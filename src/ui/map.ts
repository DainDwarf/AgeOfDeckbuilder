import Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { byHand, type UnitCommand } from '../rules/chronicle';
import { cityDrag, claimable, type ReassignCommand } from '../rules/city';
import {
  type BuildingTypeId,
  CENTRE,
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
  tileAt,
  tileKey,
  tileYield,
} from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import { inSight } from '../rules/sight';
import type { Change, Group, Stage } from '../rules/stages';
import { assignedTo, type Chronicle, type Cost, type Snapshot } from '../rules/state';
import { type Faction, type Landing, type Unit, unitAt, unitOf } from '../rules/units';
import { MAP_FRAME } from './band';
import { type Bind, bindings, boundTo, type Control, type Press, pressOf } from './bindings';
import { EASE, ended, stopMotion } from './card-motion';
import {
  ACCENT,
  addText,
  corners,
  css,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  dragged,
  hexagon,
  onResize,
  renderFactor,
  type Surface,
  UI_FONT,
  whileUp,
} from './design-space';
import { onKeyDown, onKeyUp } from './keys';
import {
  BUILT,
  buildingColourOf,
  buildingMarkOf,
  ENEMY_RED,
  featureColourOf,
  featureMarkOf,
  improvementMarkOf,
  terrainColourOf,
  unitMarkOf,
} from './marks';
import { RESOURCE_COLOURS } from './resource-bar';
import { text } from './text';
import { VEILS_ON, type Veils } from './veils';

const TILE_SIZE = 24;

const FACTION_COLOURS: Record<Faction, number> = { player: ACCENT, enemy: ENEMY_RED };

/**
 * Placeholder primitives until the art pass: a river a line along its corners on the map, and a
 * bent band where it stands as a mark of its own, both in its own blue.
 */
const RIVER_COLOUR = 0x62a9e0;
const RIVER_WIDTH = 5;
const RIVER_OUTLINE_WIDTH = 7;
const RIVER_MARK: number[] = corners([-12, -12, -4, 0, 4, -8, 12, 4, 12, 12, 4, 0, -4, 8, -12, -4]);

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

/** Over everything that darkens a tile: the fog, city mode's dim and the overlay's dim. */
const SELECTED_DEPTH = 9;

const YIELD_DEPTH = 10;

/**
 * Over everything a tile carries: its unit, the fog, city mode's dim, the selection's ring, the
 * overlay's dim and glyphs.
 */
const THRESHOLD_DEPTH = 11;

/** How dark the yield overlay's dim paints the map: the scrim's alpha. */
const DIM_ALPHA = 0.6;

/** How dark a tile in fog is painted: the scrim's alpha. */
const FOG_ALPHA = 0.6;

/** One glyph, corner to corner, and how far apart the glyphs of a tile stand. */
const GLYPH = 6;
const GLYPH_PITCH = 8;

/**
 * How far above a tile's middle the row of its feature and its improvements stands, clear of a
 * building mark, and how far apart the marks of that row stand, centre to centre.
 */
const ROW_RISE = 15;
const ROW_PITCH = 11;

/** The mark of an assigned tile, corner to corner, and how far below the tile's middle it stands. */
const ASSIGNED_GLYPH = 12;
const ASSIGNED_DROP = 16;

/** The culture threshold on a tile: how the number reads, and the glyph beside it with its gap. */
const THRESHOLD_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '12px',
  fontStyle: 'bold',
  color: css(LIT),
  stroke: css(OUTLINE),
  strokeThickness: 2.5,
};
const THRESHOLD_GLYPH = 8;
const THRESHOLD_GAP = 3;

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

/** What the map draws of a tile: the face it draws, and whether that face is the tile as it stands. */
export type Drawn = {
  readonly tile: Tile;
  /**
   * Whether the face is the tile as it stands, whoever stands on it included, rather than its
   * snapshot: a snapshot answers for its tile whole.
   */
  readonly asStands: boolean;
};

export type MapView = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /**
   * Lights those of the tiles it is given that the map draws and aims at them until it is let go of;
   * a tile the map does not draw is never aimed at. A left press on a lit tile is `chosen`, and the
   * aim goes on standing: whoever raised it decides what that press lands as and cancels it. A left
   * press on any other tile of the map is `refused` with where that tile stands, and the aim goes on
   * standing too. A left press on no tile at all lets the aim go, as the cancel does, and `released`
   * says so. A right press is reported to `onPress` as any other is and leaves the aim standing.
   */
  aimTile(
    tiles: TileCoords[],
    chosen: (tile: TileCoords) => void,
    refused: (at: PressedTile) => void,
    released: () => void,
  ): () => void;
  /**
   * Reports the tile every press the UI leaves lands on and the button it came from, and nothing
   * when it lands off the map; `zoomed` fires whenever the zoom changes, so whatever stands on the
   * map at a size of its own stands again. `commanded` is the command a press on one of the lit
   * unit's tiles is — its step onto a landing, or its attack on a unit glowed — and `reassigned` the
   * one a drag in city mode is, from the tile the population stands on onto a tile the city holds and
   * nobody stands on; neither is a tile press. A drag that lands anywhere else brings what it took
   * hold of home and is no press either. Called once; while a card is aimed the aim takes the left
   * press and this hears the right one alone.
   */
  onPress(
    pressed: (found: PressedTile | undefined, press: Press) => void,
    zoomed: () => void,
    commanded: (command: UnitCommand) => void,
    reassigned: (command: ReassignCommand) => void,
  ): void;
  /**
   * Rings the selected tile and lights what the unit of the player's on it can do, or clears both.
   * `cost` is the threshold the tile wears in its middle, over everything else it carries and in
   * place of its yield glyphs; nothing leaves it bare.
   */
  markSelected(tile: TileCoords | undefined, cost: Cost | undefined): void;
  /** Where a tile's face stands, for whatever floats beside a tile no press picked out. */
  faceOf(tile: TileCoords): TileFace;
  /** The face the map draws of a tile, and nothing at all for a tile it draws none of. */
  drawnAs(tile: TileCoords): Drawn | undefined;
  /**
   * Shows what every tile yields of these resources, a glyph for each point of it, over a dimmed
   * map; an empty set takes the overlay down.
   */
  showYields(shown: ReadonlySet<Resource>): void;
  /**
   * Marks the tiles the population stands on, dims the held ones with nobody on them, rings the ones
   * the city may claim, and shows what every tile inside the border yields, whatever the overlay is
   * showing: what the map shows while city mode is on.
   */
  showCityMarks(on: boolean): void;
  /** Draws the map under these veils: what the console's two switches take off and put back. */
  showVeils(veils: Veils): void;
  /** Whether the pan and zoom keys reach the map; they do not while anything covers it. */
  live(on: boolean): void;
};

/** The one way a tile's terrain is drawn: the hexagonal face, at the size a tile is drawn at. */
export function terrainMark(scene: Phaser.Scene, terrain: Terrain): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, hexagon(TILE_SIZE), terrainColourOf(terrain))
    .setStrokeStyle(1, OUTLINE);
}

/** The one way a building is drawn: its placeholder mark, in the colour that building is known by. */
export function buildingMark(
  scene: Phaser.Scene,
  building: BuildingTypeId,
): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, corners(buildingMarkOf(building)), buildingColourOf(building))
    .setStrokeStyle(2, OUTLINE);
}

/** The one way a feature is drawn: its placeholder mark, in the colour that feature is known by. */
export function featureMark(scene: Phaser.Scene, feature: FeatureId): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, corners(featureMarkOf(feature)), featureColourOf(feature))
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
  return scene.add
    .polygon(0, 0, corners(improvementMarkOf(improvement)), BUILT)
    .setStrokeStyle(2, OUTLINE);
}

/** The one way a unit is drawn: its placeholder mark, in the colour of the faction it acts for. */
export function unitMark(
  scene: Phaser.Scene,
  type: string,
  faction: Faction,
): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, corners(unitMarkOf(type)), FACTION_COLOURS[faction])
    .setStrokeStyle(2, OUTLINE);
}

// Phaser's WebGL stroke skips a polygon point whose origin-shifted position lands on the raw point
// before it, which a centred diamond always has once, whatever order its corners are given in: a
// square turned is the only shape that outlines whole, a polygon comes out open and cut across.
// That is what forces the shape here and nowhere else — a diamond drawn without an outline, as the
// card face draws its own, meets none of it (phaserjs/phaser#7361).
/** The one way a diamond the map outlines is drawn: `span` corner to corner, in the colour given. */
function diamond(scene: Phaser.Scene, span: number, colour: number): Phaser.GameObjects.Rectangle {
  const side = span / Math.SQRT2;
  return scene.add.rectangle(0, 0, side, side, colour).setStrokeStyle(1, OUTLINE).setAngle(45);
}

/** The one way a point of yield is drawn: a diamond in the colour its resource is known by. */
function yieldMark(scene: Phaser.Scene, resource: Resource): Phaser.GameObjects.Rectangle {
  return diamond(scene, GLYPH, RESOURCE_COLOURS[resource]).setName(`yield-${resource}`);
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
  return diamond(scene, ASSIGNED_GLYPH, RESOURCE_COLOURS.population).setName('assigned');
}

/**
 * The one way what a claim asks for stands on its tile: the threshold as a minus and its number,
 * its resource's own diamond beside it, the pair centred on the tile's middle.
 */
function thresholdMark(
  scene: Phaser.Scene,
  coord: TileCoords,
  cost: Cost,
  resolution: number,
): Phaser.GameObjects.Container {
  const number = addText(
    scene,
    0,
    0,
    text('threshold.culture', { culture: cost.amount }),
    THRESHOLD_STYLE,
  )
    .setResolution(resolution)
    .setOrigin(0.5, 0.5);
  const glyph = diamond(scene, THRESHOLD_GLYPH, RESOURCE_COLOURS[cost.resource]);

  const width = number.width + THRESHOLD_GAP + THRESHOLD_GLYPH;
  number.setX((number.width - width) / 2);
  glyph.setX((width - THRESHOLD_GLYPH) / 2);
  const { x, y } = positionOf(coord);
  return scene.add.container(x, y, [number, glyph]).setName('threshold');
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

/** Where a tile's face stands, at the size every tile is drawn at. */
function faceAt(tile: TileCoords): TileFace {
  return { ...positionOf(tile), radius: TILE_SIZE };
}

/** Where the mark of a tile the population stands on lies: below the middle of that tile. */
function assignedAt(tile: TileCoords): { x: number; y: number } {
  const { x, y } = positionOf(tile);
  return { x, y: y + ASSIGNED_DROP };
}

/** The one way a tile a press landed on is named: where its face stands goes with it. */
function pressedOn(tile: TileCoords): PressedTile {
  return { tile, at: faceAt(tile) };
}

/** Where a corner of the tile lattice stands on the map's own surface. */
function cornerAt({ x, y }: Corner): Phaser.Math.Vector2 {
  const middle = positionOf(CENTRE);
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

function same(a: TileCoords, b: TileCoords): boolean {
  return a.q === b.q && a.r === b.r;
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
 * What one left press has hold of on the map — a unit by the number it is named by, or population
 * by the tile it is assigned to — with where the press landed and whether it has come past the slack
 * that tells a drag from a click. A press holds one of them or nothing at all.
 */
type Grab = { readonly from: { x: number; y: number }; dragging: boolean } & (
  | { readonly kind: 'unit'; readonly unit: number }
  | { readonly kind: 'assigned'; readonly tile: TileCoords }
);

/**
 * The map and everything standing on it, on a surface of its own that pans and zooms under the UI.
 * Every layer of every tile, the border and the units are redrawn on each state change; and a card
 * is aimed here — the rules say which tiles light up, never this file.
 */
export function createMapView(
  scene: Phaser.Scene,
  map: Surface,
  catalogue: Catalogue,
  chronicle: Chronicle,
): MapView {
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
  const selected = scene.add.container(0, 0).setDepth(SELECTED_DEPTH).setName('selected');
  const lighted = scene.add.container(0, 0).setDepth(GLOW_DEPTH).setName('lit');
  const marks = scene.add.container(0, 0).setDepth(UNIT_DEPTH).setName('units');
  const fog = scene.add.container(0, 0).setDepth(FOG_DEPTH).setName('fog');
  const dim = scene.add
    .rectangle(0, 0, 1, 1, OUTLINE, DIM_ALPHA)
    .setOrigin(0, 0)
    .setDepth(DIM_DEPTH)
    .setName('yield-dim')
    .setVisible(false);
  const cityMarks = scene.add.container(0, 0).setDepth(CITY_DEPTH).setName('city-marks');
  const glyphs = scene.add.container(0, 0).setDepth(YIELD_DEPTH).setName('yields');
  const thresholds = scene.add.container(0, 0).setDepth(THRESHOLD_DEPTH).setName('thresholds');
  layer.add([
    ground,
    rim,
    rivers,
    features,
    rings,
    improved,
    built,
    lighted,
    marks,
    fog,
    cityMarks,
    dim,
    selected,
    glyphs,
    thresholds,
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
  /** The mark drawn on each tile the population stands on while city mode is on, by its tile's key. */
  let assignedMarks = new Map<string, Phaser.GameObjects.Rectangle>();

  /** What the left press on the map has hold of; nothing while it holds nothing. */
  let grabbed: Grab | undefined;

  /**
   * What the press has hold of, back where the map draws it standing: the unit on the tile it stands
   * on, the population under the tile it is assigned to.
   */
  const bringHome = (): void => {
    if (grabbed === undefined) return;
    switch (grabbed.kind) {
      case 'unit': {
        const standing = shown === undefined ? undefined : unitOf(shown.units, grabbed.unit);
        if (standing === undefined) return;
        const home = positionOf(standing.tile);
        markers.get(grabbed.unit)?.setPosition(home.x, home.y);
        return;
      }
      case 'assigned': {
        const home = assignedAt(grabbed.tile);
        assignedMarks.get(tileKey(grabbed.tile))?.setPosition(home.x, home.y);
        return;
      }
    }
  };

  let presser: Phaser.GameObjects.Zone | undefined;
  /** Where the map reports a press; an aim reports its right press through it too. */
  let report: ((found: PressedTile | undefined, press: Press) => void) | undefined;
  let rescale: (() => void) | undefined;
  let taking = true;

  const box = boxOf(chronicle.tiles);
  const centre = positionOf(CENTRE);
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
    if (zoom === was) return;
    paintThreshold();
    rescale?.();
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

  /** Every key held down right now, by the code of the place it binds under. */
  const held = new Set<string>();

  /**
   * Every key pressed since the last frame, held or let go of again. A notch of the wheel is pressed
   * and released at once, so it is never in `held` on any frame, and a pan bound to it would read
   * nothing.
   */
  const tapped = new Set<string>();

  onKeyDown(scene, (press) => {
    held.add(press.code);
    tapped.add(press.code);
    if (!taking) return;
    if (boundTo(press, 'zoom-in')) zoomBy(ZOOM_PER_NOTCH);
    else if (boundTo(press, 'zoom-out')) zoomBy(1 / ZOOM_PER_NOTCH);
  });
  onKeyUp(scene, (press) => {
    held.delete(press.code);
  });

  // A window that loses focus under a held key is never sent that key's release, and the frame
  // would pan on for ever.
  whileUp(scene, scene.game.events, Phaser.Core.Events.BLUR, () => {
    held.clear();
    tapped.clear();
  });

  /** Whether a key carries its control this frame: one held down, or one tapped since the last. */
  const pressing = (slot: Bind | undefined): boolean =>
    slot !== undefined && (held.has(slot.code) || tapped.has(slot.code));

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

  /** The tile wearing the culture threshold and what it asks for; nothing while no tile wears one. */
  let threshold: { readonly tile: TileCoords; readonly cost: Cost } | undefined;

  /**
   * What the dim is laid under rather than over: the tiles lit and the units glowed under the
   * selection, and the glow a card is aimed by, which the player answers the overlay with.
   * Everything else the map draws dims, so these are lifted only while the dim stands. The ring on
   * the selected tile and the threshold are deliberately not here; they stand at depths of their
   * own.
   */
  const overDim = new Set<Phaser.GameObjects.Container>([lighted]);

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
    const glow = scene.add.container(0, 0).setDepth(GLOW_DEPTH).setName('aim-lit');
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
  /** The snapshot of every tile charted on that chronicle, by its key: what the map draws in fog. */
  let charted: ReadonlyMap<string, Snapshot> = new Map();
  /** What the map draws of that chronicle, and what of it it draws live, by tile key. */
  let drawn: ReadonlySet<string> = new Set();
  let live: ReadonlySet<string> = new Set();
  /** The veils the map draws under; both stand until the console takes one off. */
  let veils: Veils = VEILS_ON;
  /** What the map has in the air; a render owns it and takes it down. */
  let flight: symbol | undefined;

  /**
   * The one rule for what the map draws of a chronicle: a tile in sight is drawn live, a tile
   * charted is drawn as its snapshot has it, in fog, and an uncharted tile is not drawn at all —
   * and each veil taken off widens one of those. The uncharted veil off draws every tile of the
   * disc; the fog veil off draws every tile the map draws at all live. Answered for whichever
   * chronicle is asked about, which is not always the one the map stands on.
   */
  const drawing = (
    chronicle: Chronicle,
  ): { drawn: ReadonlySet<string>; live: ReadonlySet<string> } => {
    const seen = inSight(catalogue, chronicle);
    const kept = new Set(chronicle.snapshots.map(tileKey));
    const keys = chronicle.tiles.map(tileKey);
    const shownKeys = new Set(
      veils.uncharted ? keys.filter((key) => seen.has(key) || kept.has(key)) : keys,
    );
    return { drawn: shownKeys, live: veils.fog ? seen : shownKeys };
  };

  /**
   * The one face the map draws of a tile, which everything the chronicle screen reads off the map
   * reads too: the tile as it stands where the map draws it live or has no snapshot of it to draw,
   * and the tile its snapshot last saw where it draws it in fog. Nothing for a tile it draws none of.
   */
  const drawnOf = (tile: Tile): Drawn | undefined => {
    const key = tileKey(tile);
    if (!drawn.has(key)) return undefined;
    const snapshot = charted.get(key);
    if (live.has(key) || snapshot === undefined) return { tile, asStands: true };
    return { tile: snapshot.tile, asStands: false };
  };

  /**
   * The tile a press lands on: the one the map draws whose face it landed inside, and nothing where
   * the map draws none. A hexagon is exactly the ground closer to its own centre than to any other.
   */
  const tileUnder = (x: number, y: number): TileCoords | undefined => {
    let nearest: TileCoords | undefined;
    let best = Infinity;
    for (const tile of shown?.tiles ?? []) {
      if (!drawn.has(tileKey(tile))) continue;
      const at = positionOf(tile);
      const gap = Math.hypot(at.x - x, at.y - y);
      if (gap < best) {
        best = gap;
        nearest = { q: tile.q, r: tile.r };
      }
    }
    return best <= TILE_SIZE ? nearest : undefined;
  };

  /**
   * The glyphs of every tile the map draws, repainted on the chronicle it stands on: a building
   * changes what its tile yields, so this follows every render as the buildings do. The one place a
   * tile's glyphs are decided — the tile wearing the culture threshold shows none, a tile inside the
   * border shows what it yields of every resource while city mode is on, and every other tile shows
   * what the overlay is asked for, if anything.
   */
  const paintYields = (): void => {
    glyphs.removeAll(true);
    dim.setVisible(showing.size > 0);
    liftOverDim();
    if (shown === undefined) return;

    const inside = new Set(marking ? shown.held.map(tileKey) : []);
    for (const tile of shown.tiles) {
      if (threshold !== undefined && same(tile, threshold.tile)) continue;
      const face = drawnOf(tile);
      if (face === undefined) continue;
      const asked = inside.has(tileKey(tile)) ? EVERY_RESOURCE : showing;
      const yields = tileYield(catalogue, face.tile, shown.rivers);
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
   * The culture threshold on the tile that wears it: what the selection changes, and nothing else.
   * A text is rasterised once and scaled after, so the map's own zoom goes into the resolution it is
   * raised at, and it is raised again whenever that zoom changes.
   */
  const paintThreshold = (): void => {
    thresholds.removeAll(true);
    if (threshold === undefined) return;
    const resolution = Math.ceil(renderFactor() * zoom);
    thresholds.add(thresholdMark(scene, threshold.tile, threshold.cost, resolution));
  };

  // The design space re-rasterises every text the scene holds at its own factor when the window
  // changes, and subscribed to that ahead of the map: this raises the threshold again after it.
  onResize(scene, paintThreshold);

  /**
   * City mode's tiles repainted on the chronicle the map stands on: a mark under every tile the
   * population stands on, a scrim over every held tile with nobody on it, and culture's own ring
   * around every tile the city may claim. An assign and a claim change them, so this follows every
   * render.
   */
  const paintCityMarks = (): void => {
    cityMarks.removeAll(true);
    assignedMarks = new Map();
    if (!marking || shown === undefined) return;

    for (const coord of shown.held) {
      if (!assignedTo(shown, coord)) {
        cityMarks.add(cityDim(scene, coord));
        continue;
      }
      const at = assignedAt(coord);
      const mark = assignedMark(scene).setPosition(at.x, at.y);
      cityMarks.add(mark);
      assignedMarks.set(tileKey(coord), mark);
    }
    for (const coord of claimable(catalogue, shown)) {
      cityMarks.add(ringMark(scene, coord, RESOURCE_COLOURS.culture, RING).setName('claimable'));
    }
  };

  /**
   * Every layer of every tile the map draws, on the chronicle it stands on. A tile in sight is
   * drawn as it stands, and the marks of the units on it are hung after this. A tile out of sight
   * stands under a scrim, its unit drawn here with its layers: from the snapshot it was last seen
   * as where it is drawn in fog, and from the chronicle where the map draws it as it stands with no
   * snapshot to draw. A terraform changes a tile's terrain and takes its feature with it, an
   * improvement is improved onto it and a building is built on it, so every layer follows every
   * render.
   */
  const paintTiles = (): void => {
    ground.removeAll(true);
    features.removeAll(true);
    improved.removeAll(true);
    built.removeAll(true);
    fog.removeAll(true);
    if (shown === undefined) return;

    for (const tile of shown.tiles) {
      const drawing = drawnOf(tile);
      if (drawing === undefined) continue;
      const face = drawing.tile;

      const { x, y } = positionOf(tile);
      ground.add(
        terrainMark(scene, face.terrain)
          .setPosition(x, y)
          .setName(`tile-${tileKey(tile)}`),
      );
      const inRow = (face.feature === undefined ? 0 : 1) + face.improvements.length;
      let slot = x - ((inRow - 1) * ROW_PITCH) / 2;
      if (face.feature !== undefined) {
        features.add(
          featureMark(scene, face.feature)
            .setPosition(slot, y - ROW_RISE)
            .setName(`feature-${tileKey(tile)}`),
        );
        slot += ROW_PITCH;
      }
      for (const improvement of face.improvements) {
        improved.add(improvementMark(scene, improvement).setPosition(slot, y - ROW_RISE));
        slot += ROW_PITCH;
      }
      if (face.building !== undefined) {
        built.add(
          buildingMark(scene, face.building)
            .setPosition(x, y)
            .setName(`building-${tileKey(tile)}`),
        );
      }
      if (live.has(tileKey(tile))) continue;
      // A snapshot answers for its tile whole: one taken of an empty tile hides the unit that has
      // walked onto it since.
      if (drawing.asStands) {
        const standing = unitAt(shown.units, tile);
        if (standing !== undefined) {
          marks.add(unitMark(scene, standing.stats.type, standing.faction).setPosition(x, y));
        }
      } else {
        const kept = charted.get(tileKey(tile))?.unit;
        if (kept !== undefined)
          marks.add(unitMark(scene, kept.type, kept.faction).setPosition(x, y));
      }
      fog.add(fogScrim(scene, tile));
    }
  };

  /**
   * The rivers repainted on the chronicle the map stands on, cut to the runs along the tiles it
   * draws: charting one draws the water beside it, so this follows every render. Every outline goes
   * down on one surface under all the water, so two rivers meeting read as one course.
   */
  const paintRivers = (): void => {
    rivers.removeAll(true);
    if (shown === undefined) return;

    const along = riversAlong(shown.rivers, drawn).map((run) => run.map(cornerAt));
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
   * the enemies' own colour. The one place a move or an attack is offered on the map — while the
   * city marks stand, none is, and the release below commands only a unit it has lit. Either
   * changes them, so this follows every render.
   */
  const lightUnit = (tile: TileCoords | undefined): void => {
    const current = shown;
    const standing =
      tile === undefined || current === undefined || marking
        ? undefined
        : unitAt(current.units, tile);
    lit = undefined;
    if (current !== undefined && standing?.faction === 'player') {
      const { landings, targets } = byHand(catalogue, current, standing);
      lit = { unit: standing.id, landings, targets: targets.map((other) => other.tile) };
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
    const { city } = shown;
    for (const coord of shown.held) {
      const weight = city !== undefined && same(coord, city) ? CITY_RING : RING;
      rings.add(ringMark(scene, coord, ACCENT, weight));
    }
  };

  const render = (current: Chronicle): void => {
    flight = undefined;
    shown = current;
    charted = new Map(current.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
    ({ drawn, live } = drawing(current));

    // What is about to be destroyed loses its tweens first: a motion left running on a destroyed
    // marker never completes, and the stage waiting on it would never end.
    stopMotion(scene, marks.list);
    marks.removeAll(true);

    paintTiles();
    paintRivers();
    paintBorder();

    markers = new Map(
      current.units.flatMap((unit): [number, Phaser.GameObjects.Polygon][] => {
        if (!live.has(tileKey(unit.tile))) return [];
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

  /** What a target does: a bump where it was attacked, and a shrink off the map if it was killed. */
  const bumped = async (
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
        : bumped(hit, unitAt(chronicle.units, target) === undefined, token);

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

  /** The units the chronicle draws live standing on tiles the map shows none on. */
  const arrivals = (chronicle: Chronicle): Unit[] => {
    const standing = new Set((shown?.units ?? []).map((unit) => tileKey(unit.tile)));
    const watched = drawing(chronicle).live;
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
   * A stage with no tile drawn live on the chronicle it leaves moves neither marker nor frame and is
   * answered with nothing, so the scene renders the state it ends on. A pan paints nothing, so a
   * stage whose motion had nothing to animate is rendered here — the scene renders only the stages
   * the map answers nothing for.
   */
  const staged = (
    tiles: readonly TileCoords[],
    chronicle: Chronicle,
    motion: () => Promise<void> | undefined,
  ): Promise<void> | undefined => {
    const watched = drawing(chronicle).live;
    if (!tiles.some((tile) => watched.has(tileKey(tile)))) return undefined;

    const panning = hold(tiles);
    if (panning === undefined) return motion();
    return panning.then(() => {
      const played = motion();
      if (played === undefined) render(chronicle);
      return played;
    });
  };

  const changed = (stage: Change): Promise<void> | undefined => {
    switch (stage.name) {
      case 'move':
        return staged([stage.from, stage.to], stage.chronicle, () =>
          slide(stage.from, stage.to, stage.chronicle),
        );
      case 'enter':
        return staged(
          arrivals(stage.chronicle).map((unit) => unit.tile),
          stage.chronicle,
          () => arriving(stage.chronicle),
        );
      case 'damaged':
      case 'killed':
      case 'refreshed':
      case 'action-spent':
      case 'retiled':
      case 'charted':
      case 'held':
      case 'settled':
      case 'stock':
      case 'population':
      case 'assigned':
      case 'laid':
      case 'drawn':
      case 'discarded':
      case 'recalled':
      case 'shuffled':
      case 'left':
      case 'turn':
      case 'rolled':
      case 'dealt':
      case 'taken':
      case 'ended':
      case 'runtime-error':
        return undefined;
    }
  };

  const grouped = (stage: Group): Promise<void> | undefined => {
    switch (stage.name) {
      case 'attack':
        return staged([stage.attacker, stage.target], stage.chronicle, () =>
          attack(stage.attacker, stage.target, stage.chronicle),
        );
      case 'capstone':
      case 'answer':
      case 'played':
      case 'refused':
      case 'assign':
      case 'claim':
      case 'strike':
      case 'income':
      case 'grow':
      case 'turn':
      case 'enemy-phase':
      case 'deal':
      case 'reward':
      case 'camp-capture':
        return undefined;
    }
  };

  return {
    live(on: boolean): void {
      taking = on;
    },

    render,

    play(stage: Stage): Promise<void> | undefined {
      switch (stage.kind) {
        case 'change':
          return changed(stage);
        case 'group':
          return grouped(stage);
      }
    },

    onPress(
      pressed: (found: PressedTile | undefined, press: Press) => void,
      zoomed: () => void,
      commanded: (command: UnitCommand) => void,
      reassigned: (command: ReassignCommand) => void,
    ): void {
      rescale = zoomed;
      report = pressed;
      const catcher = catcherZone('press');
      presser = catcher;

      /** Whether a press has come far enough to be a drag; it stays one once it has. */
      const travelled = (grab: Grab, pointer: Phaser.Input.Pointer): boolean => {
        if (!grab.dragging && !dragged(scene, grab.from, pointer)) return false;
        grab.dragging = true;
        return true;
      };

      const carry = (pointer: Phaser.Input.Pointer): void => {
        if (grabbed === undefined || !travelled(grabbed, pointer)) return;
        const at = map.at(pointer.x, pointer.y);
        switch (grabbed.kind) {
          case 'unit':
            markers.get(grabbed.unit)?.setPosition(at.x, at.y);
            return;
          case 'assigned':
            assignedMarks.get(tileKey(grabbed.tile))?.setPosition(at.x, at.y);
            return;
        }
      };
      scene.input.on('pointermove', carry);

      const letGo = (): void => {
        bringHome();
        grabbed = undefined;
        lightUnit(selection);
      };

      /** The step or the attack a release on a tile is for the unit the map has lit, and nothing else. */
      const commandUnitOn = (unit: number, on: TileCoords): boolean => {
        if (lit?.unit !== unit) return false;
        if (lit.landings.some((landing) => same(landing.tile, on))) {
          commanded({ type: 'move', unit, tile: on });
          return true;
        }
        if (lit.targets.some((coord) => same(coord, on))) {
          commanded({ type: 'attack', unit, tile: on });
          return true;
        }
        return false;
      };

      takePress(catcher, {
        down: (pointer) => {
          if (shown === undefined) return true;
          const at = map.at(pointer.x, pointer.y);
          const under = tileUnder(at.x, at.y);
          if (under === undefined) return true;
          const from = { x: pointer.x, y: pointer.y };
          if (marking) {
            if (!assignedTo(shown, under)) return true;
            grabbed = { kind: 'assigned', tile: under, from, dragging: false };
            return false;
          }
          const standing = unitAt(shown.units, under);
          if (standing?.faction !== 'player') return true;
          grabbed = { kind: 'unit', unit: standing.id, from, dragging: false };
          lightUnit(under);
          return false;
        },
        release: (pointer, press) => {
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(at.x, at.y);
          const holding = grabbed;
          if (holding === undefined) {
            if (press === 'left' && on !== undefined && lit !== undefined) {
              if (commandUnitOn(lit.unit, on)) return;
            }
            pressed(on === undefined ? undefined : pressedOn(on), press);
            return;
          }

          bringHome();
          grabbed = undefined;
          switch (holding.kind) {
            case 'unit':
              if (on !== undefined && commandUnitOn(holding.unit, on)) return;
              lightUnit(selection);
              break;
            case 'assigned': {
              const command =
                on === undefined || shown === undefined
                  ? undefined
                  : cityDrag(shown, holding.tile, on);
              if (command !== undefined) {
                reassigned(command);
                return;
              }
              break;
            }
          }

          if (holding.dragging) return;
          pressed(on === undefined ? undefined : pressedOn(on), press);
        },
        abandon: () => {
          if (grabbed !== undefined) letGo();
        },
      });
    },

    markSelected(tile: TileCoords | undefined, cost: Cost | undefined): void {
      selection = tile === undefined ? undefined : { q: tile.q, r: tile.r };
      threshold =
        cost === undefined || selection === undefined ? undefined : { tile: selection, cost };
      selected.removeAll(true);
      selected.setData('tile', tile === undefined ? undefined : tileKey(tile));
      if (tile !== undefined) {
        const { x, y } = positionOf(tile);
        selected.add(scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), 0, 0).setStrokeStyle(4, LIT));
      }
      paintThreshold();
      paintYields();
      lightUnit(selection);
    },

    faceOf(tile: TileCoords): TileFace {
      return faceAt(tile);
    },

    drawnAs(tile: TileCoords): Drawn | undefined {
      const standing = shown === undefined ? undefined : tileAt(shown.tiles, tile);
      return standing === undefined ? undefined : drawnOf(standing);
    },

    showYields(shownResources: ReadonlySet<Resource>): void {
      showing = shownResources;
      paintYields();
    },

    showCityMarks(on: boolean): void {
      marking = on;
      // A key leaves the mode under a press still holding population, and the release of that
      // press is a whole scene away: that hold is the mode's and goes with its marks, while a
      // unit's is held outside the mode and stands.
      if (grabbed !== undefined) {
        switch (grabbed.kind) {
          case 'unit':
            break;
          case 'assigned':
            bringHome();
            grabbed = undefined;
            break;
        }
      }
      paintCityMarks();
      paintYields();
      lightUnit(selection);
    },

    showVeils(next: Veils): void {
      veils = next;
      if (shown !== undefined) render(shown);
    },

    aimTile(
      tiles: TileCoords[],
      chosen: (tile: TileCoords) => void,
      refused: (at: PressedTile) => void,
      released: () => void,
    ): () => void {
      const { catcher, glow, close } = openAim();
      const lit = tiles.filter((coord) => drawn.has(tileKey(coord)));
      for (const coord of lit) glow.add(glowTile(scene, coord, LIT));

      const letGo = (): void => {
        stop();
        close();
        released();
      };

      const stop = takePress(catcher, {
        release: (pointer, press) => {
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(at.x, at.y);
          switch (press) {
            case 'right':
              report?.(on === undefined ? undefined : pressedOn(on), press);
              return;
            case 'left':
              if (on === undefined) letGo();
              else if (lit.some((coord) => same(coord, on))) chosen(on);
              else refused(pressedOn(on));
              return;
          }
        },
      });

      return letGo;
    },
  };
}
