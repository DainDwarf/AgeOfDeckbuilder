import Phaser from 'phaser';
import { claimable, type Stage, type UnitCommand } from '../rules/chronicle';
import {
  type BuildingTypeId,
  CITY_TILE,
  type Corner,
  cornerKey,
  cornersOf,
  type FeatureId,
  type ImprovementId,
  neighbours,
  riversAlong,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
  tileYield,
} from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import { inSight } from '../rules/sight';
import type { Chronicle, Snapshot } from '../rules/state';
import {
  attackable,
  type Faction,
  type Landing,
  reachable,
  type Unit,
  type UnitTypeId,
  unitAt,
  unitOf,
} from '../rules/units';
import { MAP_FRAME } from './band';
import { bindings, boundTo, type Control, PRESSES, type Press } from './bindings';
import { EASE, ended, stopMotion } from './card-motion';
import {
  ACCENT,
  corners,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  dragged,
  hexagon,
  onResize,
  renderFactor,
  type Surface,
  whileUp,
} from './design-space';
import { onKeyDown, onKeyUp } from './keys';
import { RESOURCE_COLOURS } from './resource-bar';

const TILE_SIZE = 24;

const TERRAIN_COLOURS: Record<Terrain, number> = {
  plain: 0x7d9c55,
  forest: 0x2f6f4e,
  hills: 0x9a8555,
  mountain: 0x6b5f57,
  coast: 0x3d6d9e,
  deep: 0x2b4f7a,
  urban: 0x8f8f9c,
};

const FACTION_COLOURS: Record<Faction, number> = { player: ACCENT, enemy: 0xb4453c };

/** Placeholder primitives until the art pass: the worker a block, the warrior a point. */
const UNIT_MARKS: Record<UnitTypeId, number[]> = {
  PH_Worker: corners([-11, -11, 11, -11, 11, 11, -11, 11]),
  PH_Warrior: corners([0, -14, 13, 9, -13, 9]),
};

/**
 * Placeholder primitives until the art pass: the farm a house, the city a crenellated wall, both
 * wide enough to show under a unit.
 */
const BUILDING_MARKS: Record<BuildingTypeId, number[]> = {
  PH_City: corners([
    -15, 10, -15, -12, -8, -12, -8, -6, -4, -6, -4, -12, 4, -12, 4, -6, 8, -6, 8, -12, 15, -12, 15,
    10,
  ]),
  PH_Farm: corners([-16, 8, -16, -2, 0, -13, 16, -2, 16, 8]),
};

/** Placeholder primitives until the art pass: the fertile plain a small hexagon of its own green. */
const FEATURE_MARKS: Record<FeatureId, number[]> = {
  PH_Fertile: hexagon(4),
};

const FEATURE_COLOURS: Record<FeatureId, number> = { PH_Fertile: 0x4a7a2d };

/**
 * Placeholder primitives until the art pass: a river a line along its corners on the map, and a
 * bent band where it stands as a mark of its own, both in its own blue.
 */
const RIVER_COLOUR = 0x62a9e0;
const RIVER_WIDTH = 5;
const RIVER_OUTLINE_WIDTH = 7;
const RIVER_MARK: number[] = corners([-12, -12, -4, 0, 4, -8, 12, 4, 12, 12, 4, 0, -4, 8, -12, -4]);

/** Placeholder primitives until the art pass: the mine a cut into the ground. */
const IMPROVEMENT_MARKS: Record<ImprovementId, number[]> = {
  PH_Mine: corners([-8, 7, -4, -7, 4, -7, 8, 7]),
};

const BUILT = 0xcfc6b4;

const OUTLINE = 0x0d1014;

/** Placeholder primitive until the art pass: the disc's rim a plain grey line around the map. */
const RIM = 0x5c6068;
const RIM_WIDTH = 2;

/** Pale, not accent: the border rings are already accent, and aiming has to read over them. */
const LIT = 0xf2f6ff;

/**
 * Under the hand and the piles, which stay live while a card is aimed: the map takes every press
 * they do not.
 */
const AIM_DEPTH = 1;

/** Over the terrain and the border rings, under what stands on the tiles. */
const GLOW_DEPTH = 2;

const BUILDING_DEPTH = 3;

const UNIT_DEPTH = 4;

/** Over a tile in fog and everything the map draws on it. */
const FOG_DEPTH = 5;

/** Over what stands on the tiles, while city mode is on. */
const CITY_DEPTH = 6;

/** Over everything the map draws, while the yield overlay stands. */
const DIM_DEPTH = 7;

/** Over the dim: what the map keeps at full strength through it. */
const OVER_DIM_DEPTH = 8;

const YIELD_DEPTH = 9;

/** How dark the yield overlay's dim paints the map: the scrim's alpha. */
const DIM_ALPHA = 0.6;

/** How dark a tile in fog is painted: the scrim's alpha. */
const FOG_ALPHA = 0.6;

/** One glyph, corner to corner, and how far apart the glyphs of a tile stand. */
const GLYPH = 6;
const GLYPH_PITCH = 8;

/** How far above a tile's middle its feature and its improvements stand: clear of a building mark. */
const FEATURE_RISE = 16;

/** The mark of an assigned tile, corner to corner, and how far below the tile's middle it stands. */
const ASSIGNED_GLYPH = 12;
const ASSIGNED_DROP = 16;

/** How heavy the ring around the city's own tile is, against the one every other tile takes. */
const CITY_RING = 4;
const RING = 2;

/** How dark city mode paints a held tile nobody stands on: the scrim's alpha. */
const UNASSIGNED_ALPHA = 0.6;

/** How many glyphs a row of them holds before the next row starts. */
const GLYPH_ROW = 3;

/** What a tile inside the border shows of itself while city mode is on: every resource it yields. */
const EVERY_RESOURCE: ReadonlySet<Resource> = new Set(RESOURCES);

/** How close the map comes and how far it goes, on top of the factor the design space renders at. */
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3.5;

/** What one press of a zoom key multiplies the zoom by. */
const ZOOM_PER_NOTCH = 1.3;

/** How fast a held key pans the frame, in design pixels a second. */
const PAN_SPEED = 1200;

/** How much of the map stays inside the frame however far it is panned, in design pixels. */
const KEPT = 360;

/** How far clear of every border a tile a stage plays on is brought, in design pixels. */
const CLEARANCE = 24;

/** How long the pan that brings a stage into the frame lasts, however far it has to go. */
const HOLD_LEAST = 200;
const HOLD_MOST = 600;

/** The four controls that pan, and the way each one carries the frame. */
const PANS: readonly { control: Control; x: number; y: number }[] = [
  { control: 'pan-up', x: 0, y: -1 },
  { control: 'pan-left', x: -1, y: 0 },
  { control: 'pan-down', x: 0, y: 1 },
  { control: 'pan-right', x: 1, y: 0 },
];

/** Where a tile's face stands on the map's own surface, for whatever stands beside it there. */
export type TileFace = {
  readonly x: number;
  readonly y: number;
  /** How far the face reaches from its middle, in map units. */
  readonly radius: number;
};

/** A tile a press landed on, and where it stands for whatever floats beside it. */
export type PressedTile = {
  readonly tile: TileCoords;
  readonly at: TileFace;
};

export type MapView = {
  render(chronicle: Chronicle): void;
  /** What the map plays for the stage; nothing means the scene renders it at once. */
  play(stage: Stage): Promise<void> | undefined;
  /**
   * Lights the tiles it is given and aims at them, until one is chosen or cancel is called. A right
   * press lets it go, exactly as cancel does. A left press on any other tile of the map is `refused`
   * with where that tile stands, and the aim goes on standing; one off the map does nothing.
   */
  aimTile(
    chronicle: Chronicle,
    tiles: TileCoords[],
    chosen: (tile: TileCoords | undefined) => void,
    refused: (at: PressedTile) => void,
  ): () => void;
  /**
   * Reports the tile every press the UI leaves lands on and the button it came from, and nothing
   * when it lands off the map; `zoomed` fires whenever the zoom changes, so whatever stands on the
   * map at a size of its own stands again. `commanded` is the command a press on one of the lit
   * unit's tiles is — its step onto a landing, or its attack on a unit glowed — which is no tile
   * press. Called once; while a card is aimed the map belongs to the aim and no press is reported.
   */
  onPress(
    pressed: (found: PressedTile | undefined, press: Press) => void,
    zoomed: () => void,
    commanded: (command: UnitCommand) => void,
  ): void;
  /** Rings the selected tile and lights what the unit of the player's on it can do, or clears both. */
  markSelected(tile: TileCoords | undefined): void;
  /** Where a tile's face stands, for whatever floats beside a tile no press picked out. */
  faceOf(tile: TileCoords): TileFace;
  /**
   * Shows what every tile yields of these resources, a glyph for each point of it, over a dimmed
   * map; an empty set takes the overlay down.
   */
  showYields(shown: ReadonlySet<Resource>): void;
  /**
   * Marks the tiles an inhabitant stands on, dims the held ones with nobody on them, rings the ones
   * the city may claim, and shows what every tile inside the border yields, whatever the overlay is
   * showing: what the map shows while city mode is on.
   */
  showCityMarks(on: boolean): void;
  /** Whether the pan and zoom keys reach the map; they do not while anything covers it. */
  live(on: boolean): void;
};

/** The one way a tile's terrain is drawn: the hexagonal face, at the size a tile is drawn at. */
export function terrainMark(scene: Phaser.Scene, terrain: Terrain): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, hexagon(TILE_SIZE), TERRAIN_COLOURS[terrain])
    .setStrokeStyle(1, OUTLINE);
}

/** The one way a building is drawn: its placeholder mark, in the stone everything built is. */
export function buildingMark(
  scene: Phaser.Scene,
  building: BuildingTypeId,
): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, BUILDING_MARKS[building], BUILT).setStrokeStyle(2, OUTLINE);
}

/** The one way a feature is drawn: its placeholder mark, in the colour that feature is known by. */
export function featureMark(scene: Phaser.Scene, feature: FeatureId): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, FEATURE_MARKS[feature], FEATURE_COLOURS[feature])
    .setStrokeStyle(1, OUTLINE);
}

/** The one way a river is drawn off the map: its placeholder mark, in the blue a river runs in. */
export function riverMark(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, RIVER_MARK, RIVER_COLOUR).setStrokeStyle(1, OUTLINE);
}

/** The one way an improvement is drawn: its placeholder mark, in the stone everything worked is. */
export function improvementMark(
  scene: Phaser.Scene,
  improvement: ImprovementId,
): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, IMPROVEMENT_MARKS[improvement], BUILT).setStrokeStyle(2, OUTLINE);
}

/** The one way a unit is drawn: its placeholder mark, in the colour of the faction it acts for. */
export function unitMark(
  scene: Phaser.Scene,
  type: UnitTypeId,
  faction: Faction,
): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, UNIT_MARKS[type], FACTION_COLOURS[faction])
    .setStrokeStyle(2, OUTLINE);
}

// Phaser's WebGL stroke skips a polygon point whose origin-shifted position lands on the raw point
// before it, which a centred diamond always has once, whatever order its corners are given in:
// every diamond below is a square turned, never a polygon, or its outline comes out open and cut
// across.

/** The one way a point of yield is drawn: a diamond in the colour its resource is known by. */
function yieldMark(scene: Phaser.Scene, resource: Resource): Phaser.GameObjects.Rectangle {
  const side = GLYPH / Math.SQRT2;
  return scene.add
    .rectangle(0, 0, side, side, RESOURCE_COLOURS[resource])
    .setStrokeStyle(1, OUTLINE)
    .setAngle(45)
    .setName(`yield-${resource}`);
}

/**
 * The one way a tile is ringed: a hexagon just inside its face, in the colour of whoever rings it —
 * the accent on every tile the city holds, culture's own on every tile it may claim.
 */
function ringMark(
  scene: Phaser.Scene,
  coord: TileCoords,
  colour: number,
  weight: number,
): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add.polygon(x, y, hexagon(TILE_SIZE - 4), 0, 0).setStrokeStyle(weight, colour);
}

/** The one way an assigned tile is marked: a diamond in the colour population is known by. */
function assignedMark(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  const side = ASSIGNED_GLYPH / Math.SQRT2;
  return scene.add
    .rectangle(0, 0, side, side, RESOURCE_COLOURS.population)
    .setStrokeStyle(1, OUTLINE)
    .setAngle(45)
    .setName('assigned');
}

/** The one way a held tile with nobody on it is dimmed: a scrim over it and all it carries. */
function cityDim(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add.polygon(x, y, hexagon(TILE_SIZE), OUTLINE, UNASSIGNED_ALPHA).setName('city-dim');
}

/** The one way a tile in fog is darkened: a scrim over the tile as it was last seen. */
function fogScrim(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, hexagon(TILE_SIZE), OUTLINE, FOG_ALPHA)
    .setName(`fog-${tileKey(coord)}`);
}

function positionOf({ q, r }: TileCoords): { x: number; y: number } {
  return {
    x: DESIGN_WIDTH / 2 + Math.sqrt(3) * TILE_SIZE * (q + r / 2),
    y: DESIGN_HEIGHT / 2 + 1.5 * TILE_SIZE * r,
  };
}

/** Where a corner of the tile lattice stands on the map's own surface. */
function cornerAt({ x, y }: Corner): Phaser.Math.Vector2 {
  const middle = positionOf(CITY_TILE);
  return new Phaser.Math.Vector2(
    middle.x + x * (Math.sqrt(3) / 2) * TILE_SIZE,
    middle.y + (y * TILE_SIZE) / 2,
  );
}

/**
 * The one way a river is stroked: a line along its corners, in one colour at one width. Phaser
 * bevels the joints of a stroked path and leaves its ends square, so a disc at every corner rounds
 * both.
 */
function strokeRiver(
  surface: Phaser.GameObjects.Graphics,
  along: Phaser.Math.Vector2[],
  colour: number,
  width: number,
): void {
  surface.lineStyle(width, colour);
  surface.strokePoints(along, false);
  surface.fillStyle(colour);
  for (const at of along) surface.fillCircle(at.x, at.y, width / 2);
}

/** Everything the map covers in its own space: the faces of its tiles, and nothing else. */
function boxOf(tiles: readonly Tile[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const centres = tiles.map((tile) => positionOf(tile));
  const xs = centres.map(({ x }) => x);
  const ys = centres.map(({ y }) => y);
  return {
    left: Math.min(...xs) - TILE_SIZE,
    right: Math.max(...xs) + TILE_SIZE,
    top: Math.min(...ys) - TILE_SIZE,
    bottom: Math.max(...ys) + TILE_SIZE,
  };
}

/** A hexagon is exactly the ground closer to its own centre than to any other centre. */
function tileUnder(chronicle: Chronicle, x: number, y: number): TileCoords | undefined {
  let nearest: TileCoords | undefined;
  let best = Infinity;
  for (const tile of chronicle.tiles) {
    const at = positionOf(tile);
    const gap = Math.hypot(at.x - x, at.y - y);
    if (gap < best) {
      best = gap;
      nearest = { q: tile.q, r: tile.r };
    }
  }
  return best <= TILE_SIZE ? nearest : undefined;
}

function same(a: TileCoords, b: TileCoords): boolean {
  return a.q === b.q && a.r === b.r;
}

function pressOf(pointer: Phaser.Input.Pointer): Press | undefined {
  return PRESSES.get(pointer.button);
}

/**
 * The one way a tile is glowed: its face in the colour of whoever offers it — the pale one on a
 * landing and on a tile a card is aimed at, the enemies' own on a unit an attack can be made on.
 */
function glowTile(
  scene: Phaser.Scene,
  coord: TileCoords,
  colour: number,
): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, hexagon(TILE_SIZE - 2), colour, 0.4)
    .setStrokeStyle(2, colour, 0.9);
}

/**
 * The map and everything standing on it, on a surface of its own that pans and zooms under the UI.
 * Every layer of every tile, the border and the units are redrawn on each state change; and a card
 * is aimed here — the rules say which tiles light up, never this file.
 */
export function createMapView(scene: Phaser.Scene, map: Surface, chronicle: Chronicle): MapView {
  const camera = map.camera;
  const layer = map.layer;

  // Equal depths paint in the order they were added, which is what keeps the terrain under the
  // rings and the features under what is built on them.
  const ground = scene.add.container(0, 0).setName('terrain');
  const rim = scene.add.graphics().setName('rim');
  const rivers = scene.add.container(0, 0).setName('rivers');
  const features = scene.add.container(0, 0).setName('features');
  const rings = scene.add.container(0, 0).setName('border');
  const improved = scene.add.container(0, 0).setDepth(BUILDING_DEPTH).setName('improvements');
  const built = scene.add.container(0, 0).setDepth(BUILDING_DEPTH).setName('buildings');
  const selected = scene.add.container(0, 0).setDepth(GLOW_DEPTH).setName('selected');
  const lighted = scene.add.container(0, 0).setDepth(GLOW_DEPTH).setName('lit');
  const marks = scene.add.container(0, 0).setDepth(UNIT_DEPTH);
  const fog = scene.add.container(0, 0).setDepth(FOG_DEPTH).setName('fog');
  const dim = scene.add
    .rectangle(0, 0, 1, 1, OUTLINE, DIM_ALPHA)
    .setOrigin(0, 0)
    .setDepth(DIM_DEPTH)
    .setName('yield-dim')
    .setVisible(false);
  const cityMarks = scene.add.container(0, 0).setDepth(CITY_DEPTH).setName('city-marks');
  const glyphs = scene.add.container(0, 0).setDepth(YIELD_DEPTH).setName('yields');
  layer.add([
    ground,
    rim,
    rivers,
    features,
    rings,
    improved,
    built,
    lighted,
    selected,
    marks,
    fog,
    cityMarks,
    dim,
    glyphs,
  ]);

  // Nothing a chronicle does moves the disc's rim, so it is stroked here and no render repaints it.
  const onMap = new Set(chronicle.tiles.map(tileKey));
  rim.lineStyle(RIM_WIDTH, RIM);
  for (const tile of chronicle.tiles) {
    const around = new Set(cornersOf(tile).map(cornerKey));
    for (const coord of neighbours(tile)) {
      if (onMap.has(tileKey(coord))) continue;
      const shared = cornersOf(coord).filter((corner) => around.has(cornerKey(corner)));
      rim.strokePoints(shared.map(cornerAt), false);
    }
  }

  /** The mark drawn for each unit the map shows, by the number that unit is named by. */
  let markers = new Map<number, Phaser.GameObjects.Polygon>();
  let presser: Phaser.GameObjects.Zone | undefined;
  let rescale: (() => void) | undefined;
  let taking = true;

  const box = boxOf(chronicle.tiles);
  const centre = positionOf(CITY_TILE);
  let zoom = 1;
  const catchers = new Set<Phaser.GameObjects.Zone>();

  /** Where the middle of the frame may sit on one axis: KEPT design pixels of the map stay in it. */
  const bounded = (at: number, near: number, far: number, span: number): number => {
    const keep = Math.min(KEPT / zoom, far - near, span);
    return Math.min(Math.max(at, near + keep - span / 2), far - keep + span / 2);
  };

  /** The one place the camera is written: the zoom and the middle it holds, and what it frames. */
  const place = (): void => {
    const factor = renderFactor();
    // Phaser's camera manager resizes only the cameras that filled the old canvas: a cropped
    // camera is cut here or not at all.
    camera.setViewport(
      MAP_FRAME.x * factor,
      MAP_FRAME.y * factor,
      MAP_FRAME.width * factor,
      MAP_FRAME.height * factor,
    );
    camera.setZoom(factor * zoom);
    const span = { x: MAP_FRAME.width / zoom, y: MAP_FRAME.height / zoom };
    centre.x = bounded(centre.x, box.left, box.right, span.x);
    centre.y = bounded(centre.y, box.top, box.bottom, span.y);
    camera.centerOn(centre.x, centre.y);
    for (const catcher of catchers) {
      catcher.setPosition(centre.x - span.x / 2, centre.y - span.y / 2).setSize(span.x, span.y);
    }
    dim.setPosition(centre.x - span.x / 2, centre.y - span.y / 2).setSize(span.x, span.y);
  };
  onResize(scene, place);

  /** A pan carries what stands on the map by the camera; only a zoom changes what it measures in. */
  const moveTo = (x: number, y: number, next: number): void => {
    const was = zoom;
    centre.x = x;
    centre.y = y;
    zoom = next;
    place();
    if (zoom !== was) rescale?.();
  };

  /**
   * Where the middle of the frame goes on one axis for the tiles between `lo` and `hi` to stand
   * clear of both borders: the shortest move that does it, or the middle of them when the frame is
   * too small for all of them.
   */
  const holding = (at: number, lo: number, hi: number, span: number): number => {
    const room = span / 2 - TILE_SIZE - CLEARANCE / zoom;
    if (hi - lo > 2 * room) return (lo + hi) / 2;
    return Math.min(Math.max(at, hi - room), lo + room);
  };

  /**
   * Brings the frame to hold every tile a stage plays on, and answers nothing when it holds them
   * all already. The map is not taken for this: a drag or a held key writes the same middle while
   * it runs, and the two fight until the pan ends.
   */
  const hold = (tiles: readonly TileCoords[]): Promise<void> | undefined => {
    if (tiles.length === 0) return undefined;
    const at = tiles.map(positionOf);
    const xs = at.map((point) => point.x);
    const ys = at.map((point) => point.y);
    const to = {
      x: holding(centre.x, Math.min(...xs), Math.max(...xs), MAP_FRAME.width / zoom),
      y: holding(centre.y, Math.min(...ys), Math.max(...ys), MAP_FRAME.height / zoom),
    };
    const away = Math.hypot(to.x - centre.x, to.y - centre.y) * zoom;
    if (away === 0) return undefined;

    const moving = { x: centre.x, y: centre.y };
    return ended(
      scene.tweens.add({
        targets: moving,
        x: to.x,
        y: to.y,
        duration: Math.min(Math.max((away / PAN_SPEED) * 1000, HOLD_LEAST), HOLD_MOST),
        ease: EASE,
        onUpdate: () => moveTo(moving.x, moving.y, zoom),
      }),
    );
  };

  /**
   * The press a catcher takes and the scene resolves: the press is the catcher's, so the hand and
   * the piles keep theirs, while the release is the scene's, so a press that travelled off the
   * catcher still ends — on the canvas as a release, off it as an abandon. Past the drag slack the
   * press carries the map instead, and one that panned reaches neither `release` nor `abandon`:
   * this is the only place a pan is told from a choice. A press is taken by the button that landed
   * it and let go of by that same button's release, while an abandon lets go of it whichever button
   * the release the browser finally delivers names. Hands back the way to take the three scene
   * listeners off again.
   */
  const takePress = (
    catcher: Phaser.GameObjects.Zone,
    on: {
      /**
       * Whether this press may carry the map: one that takes hold of something answers false. Asked
       * of a left press alone — a right press takes hold of nothing, so it always may pan.
       */
      down?: (pointer: Phaser.Input.Pointer) => boolean;
      release: (pointer: Phaser.Input.Pointer, press: Press) => void;
      abandon?: () => void;
    },
  ): (() => void) => {
    /** Which button is holding the press, and nothing while none is. */
    let taken: Press | undefined;
    /** Where the press landed on the canvas, and the middle the map held then, while it may pan. */
    let from: { x: number; y: number; centre: { x: number; y: number } } | undefined;
    let panned = false;

    catcher.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const press = pressOf(pointer);
      if (press === undefined) return;
      taken = press;
      panned = false;
      const mayPan = press === 'right' || (on.down?.(pointer) ?? true);
      from = mayPan
        ? { x: pointer.x, y: pointer.y, centre: { x: centre.x, y: centre.y } }
        : undefined;
    });

    const pan = (pointer: Phaser.Input.Pointer): void => {
      if (from === undefined) return;
      if (!panned && !dragged(scene, from, pointer)) return;
      panned = true;
      const was = map.at(from.x, from.y);
      const to = map.at(pointer.x, pointer.y);
      moveTo(from.centre.x - (to.x - was.x), from.centre.y - (to.y - was.y), zoom);
    };

    /** Lets the press go, and says whether anything is left to choose by. */
    const ended = (): boolean => {
      if (taken === undefined) return false;
      taken = undefined;
      from = undefined;
      return !panned;
    };
    const release = (pointer: Phaser.Input.Pointer): void => {
      const press = pressOf(pointer);
      if (press === undefined || press !== taken) return;
      if (ended()) on.release(pointer, press);
    };
    const abandon = (): void => {
      if (ended()) on.abandon?.();
    };

    scene.input.on('pointermove', pan);
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', abandon);
    return () => {
      scene.input.off('pointermove', pan);
      scene.input.off('pointerup', release);
      scene.input.off('pointerupoutside', abandon);
    };
  };

  /**
   * A zone over the whole frame, under everything the UI draws: it takes every press the UI does
   * not. It is framed in map space, so it is re-cut to the frame on every pan and every zoom.
   */
  const catcherZone = (name: string): Phaser.GameObjects.Zone => {
    const catcher = scene.add
      .zone(0, 0, 1, 1)
      .setOrigin(0, 0)
      .setDepth(AIM_DEPTH)
      .setName(name)
      .setInteractive();
    catcher.once(Phaser.GameObjects.Events.DESTROY, () => catchers.delete(catcher));
    catchers.add(catcher);
    layer.add(catcher);
    place();
    return catcher;
  };

  /** One notch of zoom, about the pointer: what the map showed under it before shows under it now. */
  const zoomBy = (by: number): void => {
    const next = Math.min(Math.max(zoom * by, MIN_ZOOM), MAX_ZOOM);
    const pointer = scene.input.activePointer;
    const at = map.at(pointer.x, pointer.y);
    const away = zoom / next;
    moveTo(at.x - (at.x - centre.x) * away, at.y - (at.y - centre.y) * away, next);
  };

  /** Every key held down right now, by the label it binds under. */
  const held = new Set<string>();

  /**
   * Every key pressed since the last frame, held or let go of again. A notch of the wheel is pressed
   * and released at once, so it is never in `held` on any frame, and a pan bound to it would read
   * nothing.
   */
  const tapped = new Set<string>();

  onKeyDown(scene, (key) => {
    held.add(key);
    tapped.add(key);
    if (!taking) return;
    if (boundTo(key, 'zoom-in')) zoomBy(ZOOM_PER_NOTCH);
    else if (boundTo(key, 'zoom-out')) zoomBy(1 / ZOOM_PER_NOTCH);
  });
  onKeyUp(scene, (key) => {
    held.delete(key);
  });

  // A window that loses focus under a held key is never sent that key's release, and the frame
  // would pan on for ever.
  whileUp(scene, scene.game.events, Phaser.Core.Events.BLUR, () => {
    held.clear();
    tapped.clear();
  });

  /** Whether a key carries its control this frame: one held down, or one tapped since the last. */
  const pressing = (key: string | undefined): boolean =>
    key !== undefined && (held.has(key) || tapped.has(key));

  whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
    let x = 0;
    let y = 0;
    if (taking) {
      const keys = bindings();
      for (const pan of PANS) {
        if (!keys[pan.control].some(pressing)) continue;
        x += pan.x;
        y += pan.y;
      }
    }
    tapped.clear();
    if (x === 0 && y === 0) return;
    const step = (PAN_SPEED * delta) / 1000 / zoom / Math.hypot(x, y);
    moveTo(centre.x + x * step, centre.y + y * step, zoom);
  });

  /** The resources the yield overlay is showing; empty while it is off. */
  let showing: ReadonlySet<Resource> = new Set();

  /** Whether the map is showing what city mode marks: it is while the mode is on. */
  let marking = false;

  /**
   * What the dim is laid under rather than over: the ring on the selected tile, the tiles glowed
   * under it and the glow a card is aimed by, which the player answers the overlay with. Everything
   * else the map draws dims, so these are lifted only while the dim stands.
   */
  const overDim = new Set<Phaser.GameObjects.Container>([selected, lighted]);

  const liftOverDim = (): void => {
    const over = showing.size > 0;
    for (const object of overDim) object.setDepth(over ? OVER_DIM_DEPTH : GLOW_DEPTH);
  };

  /** The ground every aim runs on: its own catcher, a glow to paint, and the tile presses held off. */
  const openAim = (): {
    catcher: Phaser.GameObjects.Zone;
    glow: Phaser.GameObjects.Container;
    close: () => void;
  } => {
    presser?.disableInteractive();
    const catcher = catcherZone('aim');
    const glow = scene.add.container(0, 0).setDepth(GLOW_DEPTH);
    layer.add(glow);
    overDim.add(glow);
    liftOverDim();
    return {
      catcher,
      glow,
      close: (): void => {
        catcher.destroy();
        overDim.delete(glow);
        glow.destroy();
        presser?.setInteractive();
      },
    };
  };

  /** The chronicle the map stands on: which marker is whose is read from it. */
  let shown: Chronicle | undefined;
  /** The tiles in sight on that chronicle, by their keys: what the map draws live. */
  let seen: ReadonlySet<string> = new Set();
  /** The snapshot of every tile charted on that chronicle, by its key: what the map draws in fog. */
  let charted: ReadonlyMap<string, Snapshot> = new Map();
  /** What the map has in the air; a render owns it and takes it down. */
  let flight: symbol | undefined;

  /**
   * The glyphs of every tile repainted on the chronicle the map stands on: a building changes what
   * its tile yields, so this follows every render as the buildings do. The one place a tile's
   * glyphs are decided — a tile inside the border shows what it yields of every resource while city
   * mode is on, and every other tile shows what the overlay is asked for, if anything.
   */
  const paintYields = (): void => {
    glyphs.removeAll(true);
    dim.setVisible(showing.size > 0);
    liftOverDim();
    if (shown === undefined) return;

    const inside = new Set(marking ? shown.held.map(tileKey) : []);
    for (const tile of shown.tiles) {
      const asked = inside.has(tileKey(tile)) ? EVERY_RESOURCE : showing;
      const yields = tileYield(tile, shown.rivers);
      const owed: Resource[] = [];
      for (const resource of RESOURCES) {
        if (!asked.has(resource)) continue;
        for (let left = yields[resource] ?? 0; left > 0; left--) owed.push(resource);
      }
      if (owed.length === 0) continue;

      const { x, y } = positionOf(tile);
      const rows = Math.ceil(owed.length / GLYPH_ROW);
      owed.forEach((resource, index) => {
        const row = Math.floor(index / GLYPH_ROW);
        const inRow = Math.min(GLYPH_ROW, owed.length - row * GLYPH_ROW);
        glyphs.add(
          yieldMark(scene, resource).setPosition(
            x + ((index % GLYPH_ROW) - (inRow - 1) / 2) * GLYPH_PITCH,
            y + (row - (rows - 1) / 2) * GLYPH_PITCH,
          ),
        );
      });
    }
  };

  /**
   * City mode's tiles repainted on the chronicle the map stands on: a mark under every tile an
   * inhabitant stands on, a scrim over every held tile with nobody on it, and culture's own ring
   * around every tile the city may claim. An assign and a claim change them, so this follows every
   * render.
   */
  const paintCityMarks = (): void => {
    cityMarks.removeAll(true);
    if (!marking || shown === undefined) return;

    const assigned = new Set(shown.assigned.map(tileKey));
    for (const coord of shown.held) {
      if (!assigned.has(tileKey(coord))) {
        cityMarks.add(cityDim(scene, coord));
        continue;
      }
      const { x, y } = positionOf(coord);
      cityMarks.add(assignedMark(scene).setPosition(x, y + ASSIGNED_DROP));
    }
    for (const coord of claimable(shown)) {
      cityMarks.add(ringMark(scene, coord, RESOURCE_COLOURS.culture, RING).setName('claimable'));
    }
  };

  /**
   * Every layer of every tile repainted on the chronicle the map stands on: a tile in sight is drawn
   * live, a tile in fog is drawn from the snapshot it was last seen as — the unit that stood on it
   * among them — under a scrim, and an uncharted tile is not drawn at all. A terraform changes a
   * tile's terrain and takes its feature with it, an improvement is improved onto it and a building
   * is built on it, so every layer follows every render. An improvement stands where a feature
   * stands, the two never sharing a terrain. The marks of the units in sight are hung after this.
   */
  const paintTiles = (): void => {
    ground.removeAll(true);
    features.removeAll(true);
    improved.removeAll(true);
    built.removeAll(true);
    fog.removeAll(true);
    if (shown === undefined) return;

    for (const tile of shown.tiles) {
      const live = seen.has(tileKey(tile));
      const snapshot = charted.get(tileKey(tile));
      const face = live ? tile : snapshot?.tile;
      if (face === undefined) continue;

      const { x, y } = positionOf(tile);
      ground.add(
        terrainMark(scene, face.terrain)
          .setPosition(x, y)
          .setName(`tile-${tileKey(tile)}`),
      );
      if (face.feature !== undefined) {
        features.add(
          featureMark(scene, face.feature)
            .setPosition(x, y - FEATURE_RISE)
            .setName(`feature-${tileKey(tile)}`),
        );
      }
      for (const improvement of face.improvements) {
        improved.add(improvementMark(scene, improvement).setPosition(x, y - FEATURE_RISE));
      }
      if (face.building !== undefined) {
        built.add(buildingMark(scene, face.building).setPosition(x, y));
      }
      if (live) continue;
      const stood = snapshot?.unit;
      if (stood !== undefined) {
        marks.add(unitMark(scene, stood.type, stood.faction).setPosition(x, y));
      }
      fog.add(fogScrim(scene, tile));
    }
  };

  /**
   * The rivers repainted on the chronicle the map stands on, cut to the runs along the tiles it has
   * charted: charting one draws the water beside it, so this follows every render. Every outline
   * goes down on one surface under all the water, so two rivers meeting read as one course.
   */
  const paintRivers = (): void => {
    rivers.removeAll(true);
    if (shown === undefined) return;

    const along = riversAlong(shown.rivers, new Set(charted.keys())).map((run) =>
      run.map(cornerAt),
    );
    const outlines = scene.add.graphics();
    rivers.add(outlines);
    for (const run of along) strokeRiver(outlines, run, OUTLINE, RIVER_OUTLINE_WIDTH);
    for (const run of along) {
      const water = scene.add.graphics().setName('river');
      rivers.add(water);
      strokeRiver(water, run, RIVER_COLOUR, RIVER_WIDTH);
    }
  };

  /** The tile the map rings, and nothing while none is selected. */
  let selection: TileCoords | undefined;

  /**
   * Which unit the map is lighting for, by the number it is named by, where its landings lie and
   * which tiles hold a unit it can attack; nothing while none is lit.
   */
  let lit:
    | { readonly unit: number; readonly landings: Landing[]; readonly targets: TileCoords[] }
    | undefined;

  /**
   * What the unit of the player's standing on a tile can do, and nothing at all for a tile that
   * holds none: every tile its move points reach lit, and every unit its attack reaches glowed in
   * the enemies' own colour. The one place a move or an attack is offered on the map. Either
   * changes them, so this follows every render.
   */
  const lightUnit = (tile: TileCoords | undefined): void => {
    const current = shown;
    const standing =
      tile === undefined || current === undefined ? undefined : unitAt(current.units, tile);
    lit = undefined;
    if (current !== undefined && standing?.faction === 'player') {
      lit = {
        unit: standing.id,
        landings: reachable(current, standing),
        targets: attackable(current.units, standing).map((other) => other.tile),
      };
    }

    lighted.removeAll(true);
    for (const landing of lit?.landings ?? []) lighted.add(glowTile(scene, landing.tile, LIT));
    for (const coord of lit?.targets ?? []) {
      lighted.add(glowTile(scene, coord, FACTION_COLOURS.enemy));
    }
  };

  /** The border repainted on the chronicle the map stands on: a claim moves it, so a render does. */
  const paintBorder = (): void => {
    rings.removeAll(true);
    if (shown === undefined) return;
    for (const coord of shown.held) {
      rings.add(ringMark(scene, coord, ACCENT, same(coord, shown.city) ? CITY_RING : RING));
    }
  };

  const render = (current: Chronicle): void => {
    flight = undefined;
    shown = current;
    seen = inSight(current);
    charted = new Map(current.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));

    // What is about to be destroyed loses its tweens first: a motion left running on a destroyed
    // marker never completes, and the stage waiting on it would never end.
    stopMotion(scene, marks.list);
    marks.removeAll(true);

    paintTiles();
    paintRivers();
    paintBorder();

    markers = new Map(
      current.units.flatMap((unit): [number, Phaser.GameObjects.Polygon][] => {
        if (!seen.has(tileKey(unit.tile))) return [];
        const { x, y } = positionOf(unit.tile);
        const marker = unitMark(scene, unit.stats.type, unit.faction).setPosition(x, y);
        marks.add(marker);
        return [[unit.id, marker]];
      }),
    );

    paintCityMarks();
    paintYields();
    lightUnit(selection);
  };

  /** Takes the map for one stage's motion, and hands back the token that settles it. */
  const takeOff = (): symbol => {
    const token = Symbol('motion');
    flight = token;
    return token;
  };

  const settle = (token: symbol, chronicle: Chronicle): void => {
    // A render while this was in the air took it down and painted the map it stands on.
    if (flight === token) render(chronicle);
  };

  /** The marker standing on a tile, and nothing where the map shows none. */
  const markerOn = (coord: TileCoords): Phaser.GameObjects.Polygon | undefined => {
    const standing = shown === undefined ? undefined : unitAt(shown.units, coord);
    return standing === undefined ? undefined : markers.get(standing.id);
  };

  /** What a target does: a bump where it was hit, and a shrink off the map if it was killed. */
  const struck = async (
    marker: Phaser.GameObjects.Polygon,
    killed: boolean,
    token: symbol,
  ): Promise<void> => {
    await ended(
      scene.tweens.add({
        targets: marker,
        scale: 1.35,
        delay: 150,
        duration: 60,
        ease: EASE,
        yoyo: true,
      }),
    );
    if (!killed || flight !== token) return;
    await ended(scene.tweens.add({ targets: marker, scale: 0, duration: 200, ease: EASE }));
  };

  /** One attack: the attacker lunges halfway at the tile it aimed at, and what stands there takes it. */
  const attack = (
    attacker: TileCoords,
    target: TileCoords,
    chronicle: Chronicle,
  ): Promise<void> | undefined => {
    const lunging = markerOn(attacker);
    if (lunging === undefined) return undefined;
    const hit = markerOn(target);
    const token = takeOff();

    const from = positionOf(attacker);
    const to = positionOf(target);
    const lunge = ended(
      scene.tweens.add({
        targets: lunging,
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        duration: 150,
        ease: EASE,
        yoyo: true,
      }),
    );
    const taken =
      hit === undefined
        ? Promise.resolve()
        : struck(hit, unitAt(chronicle.units, target) === undefined, token);

    return Promise.all([lunge, taken]).then(() => settle(token, chronicle));
  };

  /** One enemy's move: its marker slides from the tile it left to the one it reached. */
  const slide = (
    from: TileCoords,
    to: TileCoords,
    chronicle: Chronicle,
  ): Promise<void> | undefined => {
    const marker = markerOn(from);
    if (marker === undefined) return undefined;
    const token = takeOff();
    const at = positionOf(to);

    return ended(
      scene.tweens.add({ targets: marker, x: at.x, y: at.y, duration: 350, ease: EASE }),
    ).then(() => settle(token, chronicle));
  };

  /** The units in sight of the chronicle standing on tiles the map shows none on. */
  const arrivals = (chronicle: Chronicle): Unit[] => {
    const standing = new Set((shown?.units ?? []).map((unit) => tileKey(unit.tile)));
    const watched = inSight(chronicle);
    return chronicle.units.filter(
      (unit) => watched.has(tileKey(unit.tile)) && !standing.has(tileKey(unit.tile)),
    );
  };

  /** The arrival: every unit the map was not already showing grows onto its tile. */
  const arriving = (chronicle: Chronicle): Promise<void> | undefined => {
    const arrived = arrivals(chronicle);
    if (arrived.length === 0) return undefined;

    const token = takeOff();
    const entering = arrived.map((unit) => {
      const { x, y } = positionOf(unit.tile);
      const marker = unitMark(scene, unit.stats.type, unit.faction).setPosition(x, y).setScale(0);
      marks.add(marker);
      return marker;
    });

    return ended(scene.tweens.add({ targets: entering, scale: 1, duration: 250, ease: EASE })).then(
      () => settle(token, chronicle),
    );
  };

  /**
   * One stage: the frame comes to hold the tiles it plays on, and the motion starts once it does.
   * A stage with no tile in sight on the chronicle it leaves moves neither marker nor frame and is
   * answered with nothing, so the scene renders the state it ends on. A pan paints nothing, so a
   * stage whose motion had nothing to animate is rendered here — the scene renders only the stages
   * the map answers nothing for.
   */
  const staged = (
    tiles: readonly TileCoords[],
    chronicle: Chronicle,
    motion: () => Promise<void> | undefined,
  ): Promise<void> | undefined => {
    const watched = inSight(chronicle);
    if (!tiles.some((tile) => watched.has(tileKey(tile)))) return undefined;

    const panning = hold(tiles);
    if (panning === undefined) return motion();
    return panning.then(() => {
      const played = motion();
      if (played === undefined) render(chronicle);
      return played;
    });
  };

  return {
    live(on: boolean): void {
      taking = on;
    },

    render,

    play(stage: Stage): Promise<void> | undefined {
      switch (stage.name) {
        case 'attack':
          return staged([stage.attacker, stage.target], stage.chronicle, () =>
            attack(stage.attacker, stage.target, stage.chronicle),
          );
        case 'move':
          return staged([stage.from, stage.to], stage.chronicle, () =>
            slide(stage.from, stage.to, stage.chronicle),
          );
        case 'events':
          return staged(
            arrivals(stage.chronicle).map((unit) => unit.tile),
            stage.chronicle,
            () => arriving(stage.chronicle),
          );
        default:
          return undefined;
      }
    },

    onPress(
      pressed: (found: PressedTile | undefined, press: Press) => void,
      zoomed: () => void,
      commanded: (command: UnitCommand) => void,
    ): void {
      rescale = zoomed;
      const catcher = catcherZone('press');
      presser = catcher;

      /** The unit a left press has hold of, where it landed, and whether it has been dragged. */
      let grabbed: { unit: number; from: { x: number; y: number }; dragging: boolean } | undefined;

      /** The marker of the unit the press has hold of, back on the tile that unit stands on. */
      const bringHome = (): void => {
        if (grabbed === undefined || shown === undefined) return;
        const held = unitOf(shown.units, grabbed.unit);
        if (held === undefined) return;
        const home = positionOf(held.tile);
        markers.get(grabbed.unit)?.setPosition(home.x, home.y);
      };

      const carry = (pointer: Phaser.Input.Pointer): void => {
        if (grabbed === undefined) return;
        if (!grabbed.dragging && !dragged(scene, grabbed.from, pointer)) return;
        grabbed.dragging = true;
        const at = map.at(pointer.x, pointer.y);
        markers.get(grabbed.unit)?.setPosition(at.x, at.y);
      };
      scene.input.on('pointermove', carry);

      const letGo = (): void => {
        bringHome();
        grabbed = undefined;
        lightUnit(selection);
      };

      takePress(catcher, {
        down: (pointer) => {
          if (marking || shown === undefined) return true;
          const at = map.at(pointer.x, pointer.y);
          const under = tileUnder(shown, at.x, at.y);
          if (under === undefined) return true;
          const standing = unitAt(shown.units, under);
          if (standing?.faction !== 'player') return true;
          grabbed = { unit: standing.id, from: { x: pointer.x, y: pointer.y }, dragging: false };
          lightUnit(under);
          return false;
        },
        release: (pointer, press) => {
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(shown ?? chronicle, at.x, at.y);
          const held = grabbed;
          if (held !== undefined) {
            bringHome();
            grabbed = undefined;
          }

          const acting = held?.unit ?? (press === 'left' ? lit?.unit : undefined);
          if (acting !== undefined && on !== undefined && lit?.unit === acting) {
            if (lit.landings.some((landing) => same(landing.tile, on))) {
              commanded({ type: 'move', unit: acting, tile: on });
              return;
            }
            if (lit.targets.some((coord) => same(coord, on))) {
              commanded({ type: 'attack', unit: acting, tile: on });
              return;
            }
          }

          if (held !== undefined) {
            lightUnit(selection);
            if (held.dragging) return;
          }
          pressed(
            on === undefined
              ? undefined
              : { tile: on, at: { ...positionOf(on), radius: TILE_SIZE } },
            press,
          );
        },
        abandon: () => {
          if (grabbed !== undefined) letGo();
        },
      });
    },

    markSelected(tile: TileCoords | undefined): void {
      selection = tile === undefined ? undefined : { q: tile.q, r: tile.r };
      selected.removeAll(true);
      selected.setData('tile', tile === undefined ? undefined : tileKey(tile));
      if (tile !== undefined) {
        const { x, y } = positionOf(tile);
        selected.add(scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), 0, 0).setStrokeStyle(4, LIT));
      }
      lightUnit(selection);
    },

    faceOf(tile: TileCoords): TileFace {
      return { ...positionOf(tile), radius: TILE_SIZE };
    },

    showYields(shownResources: ReadonlySet<Resource>): void {
      showing = shownResources;
      paintYields();
    },

    showCityMarks(on: boolean): void {
      marking = on;
      paintCityMarks();
      paintYields();
    },

    aimTile(
      current: Chronicle,
      tiles: TileCoords[],
      chosen: (tile: TileCoords | undefined) => void,
      refused: (at: PressedTile) => void,
    ): () => void {
      const { catcher, glow, close } = openAim();
      for (const coord of tiles) glow.add(glowTile(scene, coord, LIT));

      const finish = (tile: TileCoords | undefined): void => {
        stop();
        close();
        chosen(tile);
      };

      const stop = takePress(catcher, {
        release: (pointer, press) => {
          if (press === 'right') {
            finish(undefined);
            return;
          }
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(current, at.x, at.y);
          if (on === undefined) return;
          if (tiles.some((coord) => same(coord, on))) finish(on);
          else refused({ tile: on, at: { ...positionOf(on), radius: TILE_SIZE } });
        },
      });

      return () => finish(undefined);
    },
  };
}
