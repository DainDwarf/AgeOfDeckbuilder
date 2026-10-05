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
import { type Change, type Group, type Stage, walked } from '../rules/stages';
import { assignedTo, type Chronicle, type Cost, type Snapshot } from '../rules/state';
import { type Faction, type Landing, type Unit, unitAt, unitOf } from '../rules/units';
import { MAP_FRAME } from './band';
import { boundTo, type Control, type Press, pressOf } from './bindings';
import { EASE, ended, SLIDE_HOME, stopMotion } from './card-motion';
import {
  addText,
  corners,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  dragged,
  hexagon,
  onLetGoOffCanvas,
  onResize,
  renderFactor,
  type Stratum,
  thingUnder,
  UI_FONT,
} from './design-space';
import { onHeldKeys, onKeyDown } from './keys';
import { css, type Glow, LOOK } from './look';
import type { MapStrata } from './map-scene';
import {
  buildingColourOf,
  buildingMarkOf,
  featureColourOf,
  featureMarkOf,
  improvementMarkOf,
  terrainColourOf,
  unitMarkOf,
} from './marks';
import { PAN_SPEED } from './scroll';
import { text } from './text';
import { VEILS_ON, type Veils } from './veils';

const TILE_SIZE = 24;

const FACTION_COLOURS: Record<Faction, number> = { player: LOOK.civilization, enemy: LOOK.enemy };

// No corner of the hull, shifted by half its size, lands on the corner before it: Phaser's stroke
// would skip it and leave the outline open (the trap over `diamond`).
/** Placeholder primitive until the art pass: the hull an embarked unit stands on, raw, and its drop. */
const HULL: number[] = [-16, -4, 16, -4, 10, 4, -10, 4];
const HULL_DROP = 12;

/**
 * Placeholder primitives until the art pass: a river a line along its corners on the map, and a
 * bent band where it stands as a mark of its own, both in its own blue.
 */
const RIVER_WIDTH = 5;
const RIVER_OUTLINE_WIDTH = 7;
const RIVER_MARK: number[] = corners([-12, -12, -4, 0, 4, -8, 12, 4, 12, 12, 4, 0, -4, 8, -12, -4]);

/** Placeholder primitive until the art pass: the disc's rim a plain line around the map. */
const RIM_WIDTH = 2;

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
  color: css(LOOK.thresholdInk),
  stroke: css(LOOK.mapOutline),
  strokeThickness: 2.5,
};
const THRESHOLD_GLYPH = 8;
const THRESHOLD_GAP = 3;

/** How heavy the ring around the city's own tile is, against the one every other tile takes. */
const CITY_RING = 4;
const RING = 2;

/** How many glyphs a row of them holds before the next row starts. */
const GLYPH_ROW = 3;

/** What a tile inside the border shows of itself while city mode is on: every resource it yields. */
const EVERY_RESOURCE: ReadonlySet<Resource> = new Set(RESOURCES);

/** How close the map comes and how far it goes, on top of the factor the design space renders at. */
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3.5;

/** What one notch of zoom multiplies the zoom by. */
const ZOOM_PER_NOTCH = 1.3;

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
   * Lights those of the tiles it is given that the map draws, aims at them, and answers the way to
   * let the aim go, which `released` follows.
   */
  aimTile(
    tiles: TileCoords[],
    chosen: (tile: TileCoords) => void,
    refused: (at: PressedTile) => void,
    released: () => void,
  ): () => void;
  /**
   * Where the pointer is on the map, it being on this thing: on a drawn tile or beside the tiles;
   * nothing where the thing is none of the map's.
   */
  placeOf(
    on: Phaser.GameObjects.GameObject | undefined,
  ): { readonly tile: TileCoords | undefined } | undefined;
  /** Whether the last press of that button landed on the map carried it or what it took hold of. */
  carried(press: Press): boolean;
  /**
   * A left click on a drawn tile: the aim's while one stands, else the step or the attack of the unit
   * lit where it lights or glows that tile, else the tile reported to `onPress`.
   */
  click(tile: TileCoords): void;
  /** Whether a unit of the player's on the selected tile lights or glows anything: it is being aimed. */
  unitBeingAimed(): boolean;
  /**
   * Reports a click on a drawn tile to `clicked`; `commanded` is the step or the attack a click or a
   * drag onto a lit unit's tile is, and `reassigned` the population a drag in city mode carries.
   * Called once.
   */
  onPress(
    clicked: (found: PressedTile) => void,
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
  /** A tile named as a press landed on it names it: where its face stands goes with it. */
  pressedOn(tile: TileCoords): PressedTile;
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
  /** Whether the pan and zoom keys and the wheel move the map; they do not while a scrim stands. */
  live(on: boolean): void;
  /** Notches of zoom, in above zero, about the pointer. */
  zoom(notches: number): void;
};

/** The one way a tile's terrain is drawn: the hexagonal face, at the size a tile is drawn at. */
export function terrainMark(scene: Phaser.Scene, terrain: Terrain): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, hexagon(TILE_SIZE), terrainColourOf(terrain))
    .setStrokeStyle(1, LOOK.mapOutline);
}

/** The one way a building is drawn: its placeholder mark, in the colour that building is known by. */
export function buildingMark(
  scene: Phaser.Scene,
  building: BuildingTypeId,
): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, corners(buildingMarkOf(building)), buildingColourOf(building))
    .setStrokeStyle(2, LOOK.mapOutline);
}

/** The one way a feature is drawn: its placeholder mark, in the colour that feature is known by. */
export function featureMark(scene: Phaser.Scene, feature: FeatureId): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, corners(featureMarkOf(feature)), featureColourOf(feature))
    .setStrokeStyle(1, LOOK.mapOutline);
}

/** The one way a river is drawn off the map: its placeholder mark, in the blue a river runs in. */
export function riverMark(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, RIVER_MARK, LOOK.river).setStrokeStyle(1, LOOK.mapOutline);
}

/** The one way an improvement is drawn: its placeholder mark, in the stone everything worked is. */
export function improvementMark(
  scene: Phaser.Scene,
  improvement: ImprovementId,
): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, corners(improvementMarkOf(improvement)), LOOK.built)
    .setStrokeStyle(2, LOOK.mapOutline);
}

/** The shapes a unit's mark is drawn from, bottom first, each its corners and its drop below the middle. */
function unitShapes(type: string, embarked: boolean): { corners: number[]; drop: number }[] {
  const kind = { corners: corners(unitMarkOf(type)), drop: 0 };
  return embarked ? [{ corners: corners(HULL), drop: HULL_DROP }, kind] : [kind];
}

/**
 * The one way a unit is drawn: its placeholder mark, over a hull while it is embarked, in the colour
 * of the faction it acts for.
 */
export function unitMark(
  scene: Phaser.Scene,
  type: string,
  faction: Faction,
  embarked: boolean,
): Phaser.GameObjects.Container {
  return scene.add.container(
    0,
    0,
    unitShapes(type, embarked).map((shape) =>
      scene.add
        .polygon(0, shape.drop, shape.corners, FACTION_COLOURS[faction])
        .setStrokeStyle(2, LOOK.mapOutline),
    ),
  );
}

/**
 * The one way a unit standing live on the map is drawn: its mark, dimmed under a scrim of its own
 * shape once it is a unit of the player's with no move points and no action left.
 */
function unitMarker(scene: Phaser.Scene, unit: Unit): Phaser.GameObjects.Container {
  const { x, y } = positionOf(unit.tile);
  const key = tileKey(unit.tile);
  const marker = scene.add
    .container(x, y, [unitMark(scene, unit.stats.type, unit.faction, unit.embarked)])
    .setName(`unit-${key}`);
  if (unit.faction === 'player' && unit.movePoints <= 0 && unit.action <= 0) {
    const scrims = unitShapes(unit.stats.type, unit.embarked).map((shape) =>
      scene.add.polygon(0, shape.drop, shape.corners, LOOK.mapOutline, LOOK.mapDim.strength),
    );
    marker.add(scene.add.container(0, 0, scrims).setName(`unit-dim-${key}`));
  }
  return marker;
}

// Phaser's WebGL stroke skips a polygon point whose origin-shifted position lands on the raw point
// before it, which a centred diamond always has once, whatever order its corners are given in: a
// square turned is the only shape that outlines whole, a polygon comes out open and cut across.
// That is what forces the shape here and nowhere else — a diamond drawn without an outline, as the
// card face draws its own, meets none of it (phaserjs/phaser#7361).
/** The one way a diamond the map outlines is drawn: `span` corner to corner, in the colour given. */
function diamond(scene: Phaser.Scene, span: number, colour: number): Phaser.GameObjects.Rectangle {
  const side = span / Math.SQRT2;
  return scene.add
    .rectangle(0, 0, side, side, colour)
    .setStrokeStyle(1, LOOK.mapOutline)
    .setAngle(45);
}

/** The one way a point of yield is drawn: a diamond in the colour its resource is known by. */
function yieldMark(scene: Phaser.Scene, resource: Resource): Phaser.GameObjects.Rectangle {
  return diamond(scene, GLYPH, LOOK.reading[resource]).setName(`yield-${resource}`);
}

/** The one way a tile is ringed: a hexagon just inside its face, in the colour given. */
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
  return diamond(scene, ASSIGNED_GLYPH, LOOK.population).setName('assigned');
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
  const glyph = diamond(scene, THRESHOLD_GLYPH, LOOK.reading[cost.resource]);

  const width = number.width + THRESHOLD_GAP + THRESHOLD_GLYPH;
  number.setX((number.width - width) / 2);
  glyph.setX((width - THRESHOLD_GLYPH) / 2);
  const { x, y } = positionOf(coord);
  return scene.add.container(x, y, [number, glyph]).setName('threshold');
}

/** The one way a held tile with nobody on it is dimmed: a scrim over it and all it carries. */
function cityDim(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, hexagon(TILE_SIZE), LOOK.mapOutline, LOOK.mapDim.strength)
    .setName('city-dim');
}

/** The one way a tile in fog is darkened: a scrim over the tile as it was last seen. */
function fogScrim(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, hexagon(TILE_SIZE), LOOK.mapOutline, LOOK.mapDim.strength)
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

function glowTile(
  scene: Phaser.Scene,
  coord: TileCoords,
  colour: number,
  glow: Glow,
): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, hexagon(TILE_SIZE - 2), colour, glow.fill)
    .setStrokeStyle(2, colour, glow.stroke);
}

/**
 * Everything a group holds stopped where it stands and destroyed: a Layer's `removeAll` destroys
 * nothing, whatever it is handed.
 */
function wipe(group: Phaser.GameObjects.Layer): void {
  stopMotion(group.scene, group.list);
  for (const object of [...group.list]) object.destroy();
}

/** What the map draws of a chronicle and what of it it draws live, by tile key, and the snapshots it draws in fog. */
type Drawing = {
  readonly drawn: ReadonlySet<string>;
  readonly live: ReadonlySet<string>;
  readonly charted: ReadonlyMap<string, Snapshot>;
};

/**
 * The one face the map draws of a tile, which everything the chronicle screen reads off the map
 * reads too: the tile as it stands where the map draws it live or has no snapshot of it to draw,
 * and the tile its snapshot last saw where it draws it in fog. Nothing for a tile it draws none of.
 */
function faceIn(drawing: Drawing, tile: Tile): Drawn | undefined {
  const key = tileKey(tile);
  if (!drawing.drawn.has(key)) return undefined;
  const snapshot = drawing.charted.get(key);
  if (drawing.live.has(key) || snapshot === undefined) return { tile, asStands: true };
  return { tile: snapshot.tile, asStands: false };
}

/**
 * Where the marks of a face's row stand across its tile, its feature first and its improvements
 * after, in the order the face holds them, the row centred on the tile's middle `x`.
 */
function rowOf(face: Tile, x: number): { feature: number; improvements: number[] } {
  const first = face.feature === undefined ? 0 : 1;
  const count = first + face.improvements.length;
  const at = (slot: number): number => x + (slot - (count - 1) / 2) * ROW_PITCH;
  return { feature: at(0), improvements: face.improvements.map((_, index) => at(first + index)) };
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

/** The mark a press takes hold of: a unit's, or a population's. */
type GrabMark = Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle;

/** What the map draws a tile's things as: one polygon, or a unit's mark, a container of them. */
export type Mark = Phaser.GameObjects.Polygon | Phaser.GameObjects.Container;

/**
 * The map and everything standing on it, on a surface of its own that pans and zooms under the UI.
 * Every layer of every tile, the border and the units are redrawn on each state change; and a card
 * is aimed here — the rules say which tiles light up, never this file.
 */
export function createMapView(
  scene: Phaser.Scene,
  strata: MapStrata,
  catalogue: Catalogue,
  chronicle: Chronicle,
): MapView {
  const map = strata.terrain;
  const camera = map.camera;

  const group = (on: Stratum, name: string): Phaser.GameObjects.Layer => {
    const layer = scene.add.layer().setName(name);
    on.layer.add(layer);
    return layer;
  };

  const ground = group(strata.terrain, 'terrain');
  const rim = scene.add.graphics().setName('rim');
  strata.terrain.layer.add(rim);
  const rivers = group(strata.terrain, 'rivers');
  const features = group(strata.terrain, 'features');
  const rings = group(strata.terrain, 'border');
  const lighted = group(strata.lit, 'lit');
  const improvements = group(strata.buildings, 'improvements');
  const built = group(strata.buildings, 'buildings');
  const marks = group(strata.units, 'units');
  const fog = group(strata.fog, 'fog');
  const cityMarks = group(strata.cityMarks, 'city-marks');
  const dim = scene.add
    .rectangle(0, 0, 1, 1, LOOK.mapOutline, LOOK.mapDim.strength)
    .setOrigin(0, 0)
    .setName('yield-dim')
    .setVisible(false);
  strata.dim.layer.add(dim);
  const selected = group(strata.ring, 'selected');
  const glyphs = group(strata.yields, 'yields');
  const thresholds = group(strata.yields, 'thresholds');

  // Nothing a chronicle does moves the disc's rim, so it is stroked here and no render repaints it.
  const onMap = new Set(chronicle.tiles.map(tileKey));
  rim.lineStyle(RIM_WIDTH, LOOK.mapRim);
  for (const tile of chronicle.tiles) {
    const around = new Set(cornersOf(tile).map(cornerKey));
    for (const coord of neighbours(tile)) {
      if (onMap.has(tileKey(coord))) continue;
      const shared = cornersOf(coord).filter((corner) => around.has(cornerKey(corner)));
      rim.strokePoints(shared.map(cornerAt), false);
    }
  }

  /** The mark drawn for each unit the map shows, by the number that unit is named by. */
  let markers = new Map<number, Phaser.GameObjects.Container>();
  /** The mark drawn on each tile the population stands on while city mode is on, by its tile's key. */
  let assignedMarks = new Map<string, Phaser.GameObjects.Rectangle>();

  /** What the left press on the map has hold of; nothing while it holds nothing. */
  let grabbed: Grab | undefined;

  /** Each mark a press let go of sliding home: where home is, and the slide. */
  const homing = new Map<
    GrabMark,
    { readonly x: number; readonly y: number; readonly slide: Phaser.Tweens.Tween }
  >();

  /** The mark a press has hold of, and nothing where the map draws none. */
  const markOf = (grab: Grab): GrabMark | undefined => {
    switch (grab.kind) {
      case 'unit':
        return markers.get(grab.unit);
      case 'assigned':
        return assignedMarks.get(tileKey(grab.tile));
    }
  };

  /**
   * Where the map draws what a press has hold of standing: the unit on the tile it stands on, the
   * population under the tile it is assigned to.
   */
  const homeOf = (grab: Grab): { x: number; y: number } | undefined => {
    switch (grab.kind) {
      case 'unit': {
        const standing = shown === undefined ? undefined : unitOf(shown.units, grab.unit);
        return standing === undefined ? undefined : positionOf(standing.tile);
      }
      case 'assigned':
        return assignedAt(grab.tile);
    }
  };

  /** What a press had hold of sliding home from where it was let go. */
  const slideHome = (grab: Grab): void => {
    const mark = markOf(grab);
    const home = homeOf(grab);
    if (mark === undefined || home === undefined) return;
    const over = (): void => {
      homing.delete(mark);
    };
    const slide = scene.tweens.add({
      targets: mark,
      x: home.x,
      y: home.y,
      duration: SLIDE_HOME,
      ease: EASE,
      onComplete: over,
      onStop: over,
    });
    homing.set(mark, { ...home, slide });
  };

  /** A press taking hold: what it holds, if it is sliding home, stops where it stands. */
  const takeHold = (grab: Grab): void => {
    grabbed = grab;
    const mark = markOf(grab);
    if (mark !== undefined) homing.get(mark)?.slide.stop();
  };

  /** Every mark sliding home set there at once. */
  const homeAtOnce = (): void => {
    for (const [mark, { x, y, slide }] of [...homing]) {
      slide.stop();
      mark.setPosition(x, y);
    }
  };

  let presser: Phaser.GameObjects.Zone | undefined;
  /** What a left click on a drawn tile is while no aim stands. */
  let clickedTile: ((tile: TileCoords) => void) | undefined;
  /** What a left click on a drawn tile is to the aim standing, and nothing while none does. */
  let aimClicked: ((tile: TileCoords) => void) | undefined;
  /** Whether each button's last press on a catcher carried the map or what it took hold of. */
  const carrying: Record<Press, boolean> = { left: false, right: false };
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
   * The press is the catcher's and the release the scene's, so a press that travelled off the
   * catcher still ends — on the canvas as a release, off it as an abandon — while the hand and the
   * piles keep their own presses. One that panned past the drag slack reaches neither.
   */
  const takePress = (
    catcher: Phaser.GameObjects.Zone,
    on: {
      /**
       * Whether this press may carry the map: one that takes hold of something answers false. Asked
       * of a left press alone — a right press takes hold of nothing, so it always may pan.
       */
      down?: (pointer: Phaser.Input.Pointer) => boolean;
      /**
       * The left press let go; a second button's release lets nothing go, and whatever the press has
       * hold of stands through it.
       */
      release?: (pointer: Phaser.Input.Pointer) => void;
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
      carrying[press] = false;
      if (taken !== undefined) return;
      taken = press;
      panned = false;
      const mayPan = press === 'right' || (on.down?.(pointer) ?? true);
      from = mayPan
        ? { x: pointer.x, y: pointer.y, centre: { x: centre.x, y: centre.y } }
        : undefined;
    });

    const pan = (pointer: Phaser.Input.Pointer): void => {
      if (from === undefined || taken === undefined) return;
      if (!panned && !dragged(scene, from, pointer)) return;
      panned = true;
      carrying[taken] = true;
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
      if (press !== taken) return;
      if (ended() && press === 'left') on.release?.(pointer);
    };
    scene.input.on('pointermove', pan);
    scene.input.on('pointerup', release);
    const unheard = onLetGoOffCanvas(scene, (press) => {
      if (press === taken && ended()) on.abandon?.();
    });
    return () => {
      scene.input.off('pointermove', pan);
      scene.input.off('pointerup', release);
      unheard();
    };
  };

  /**
   * A zone over the whole frame, under everything the UI draws: it takes every press the UI does
   * not. It is framed in map space, so it is re-cut to the frame on every pan and every zoom.
   */
  const catcherZone = (name: string): Phaser.GameObjects.Zone => {
    const catcher = scene.add.zone(0, 0, 1, 1).setOrigin(0, 0).setName(name).setInteractive();
    catcher.once(Phaser.GameObjects.Events.DESTROY, () => catchers.delete(catcher));
    catchers.add(catcher);
    strata.terrain.layer.add(catcher);
    place();
    return catcher;
  };

  /**
   * Notches of zoom, in above zero, about the pointer: what the map showed under it before shows
   * under it now.
   */
  const zoomBy = (notches: number): void => {
    if (!taking) return;
    const next = Math.min(Math.max(zoom * ZOOM_PER_NOTCH ** notches, MIN_ZOOM), MAX_ZOOM);
    const pointer = scene.input.activePointer;
    const at = map.at(pointer.x, pointer.y);
    const away = zoom / next;
    moveTo(at.x - (at.x - centre.x) * away, at.y - (at.y - centre.y) * away, next);
  };

  onKeyDown(scene, (press) => {
    if (boundTo(press, 'zoom-in')) zoomBy(1);
    else if (boundTo(press, 'zoom-out')) zoomBy(-1);
  });

  onHeldKeys(scene, (pressing, delta) => {
    let x = 0;
    let y = 0;
    if (taking) {
      for (const pan of PANS) {
        if (!pressing(pan.control)) continue;
        x += pan.x;
        y += pan.y;
      }
    }
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
   * What the dim is laid under rather than over, lifted onto the dim's stratum only while it stands:
   * the tiles lit and the units glowed, and the glow a card is aimed by. The ring and the culture
   * threshold are not here — their own strata already stand over the dim's.
   */
  const overDim = new Set<Phaser.GameObjects.Layer>([lighted]);

  const liftOverDim = (): void => {
    const onto = showing.size > 0 ? strata.dim : strata.lit;
    for (const lifted of overDim) onto.layer.add(lifted);
  };

  /** The ground every aim runs on: its own catcher, a glow to paint, and the tile presses held off. */
  const openAim = (): {
    catcher: Phaser.GameObjects.Zone;
    glow: Phaser.GameObjects.Layer;
    close: () => void;
  } => {
    presser?.disableInteractive();
    const catcher = catcherZone('aim');
    const glow = group(strata.lit, 'aim-lit');
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
  /** What the map draws of that chronicle. */
  let { drawn, live, charted }: Drawing = { drawn: new Set(), live: new Set(), charted: new Map() };
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
  const drawing = (chronicle: Chronicle): Drawing => {
    const seen = inSight(catalogue, chronicle);
    const charted = new Map(chronicle.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
    const keys = chronicle.tiles.map(tileKey);
    const shownKeys = new Set(
      veils.uncharted ? keys.filter((key) => seen.has(key) || charted.has(key)) : keys,
    );
    return { drawn: shownKeys, live: veils.fog ? seen : shownKeys, charted };
  };

  /** The face the map draws of a tile on the chronicle it stands on. */
  const drawnOf = (tile: Tile): Drawn | undefined => faceIn({ drawn, live, charted }, tile);

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
    wipe(glyphs);
    dim.setVisible(showing.size > 0);
    liftOverDim();
    if (shown === undefined) return;

    const inside = new Set(marking ? shown.held.map(tileKey) : []);
    for (const tile of shown.tiles) {
      if (threshold !== undefined && same(tile, threshold.tile)) continue;
      const face = drawnOf(tile);
      if (face === undefined) continue;
      const asked = inside.has(tileKey(tile)) ? EVERY_RESOURCE : showing;
      const yields = tileYield(catalogue, face.tile);
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
    wipe(thresholds);
    if (threshold === undefined) return;
    const resolution = Math.ceil(renderFactor() * zoom);
    thresholds.add(thresholdMark(scene, threshold.tile, threshold.cost, resolution));
  };

  // The map scene re-rasterises every text it holds at its own factor when the window changes, and
  // subscribed to that at its create, ahead of the map: this raises the threshold again after it.
  onResize(scene, paintThreshold);

  /**
   * City mode's tiles repainted on the chronicle the map stands on: a mark under every tile the
   * population stands on, a scrim over every held tile with nobody on it, and culture's own ring
   * around every tile the city may claim. An assign and a claim change them, so this follows every
   * render.
   */
  const paintCityMarks = (): void => {
    wipe(cityMarks);
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
      cityMarks.add(ringMark(scene, coord, LOOK.reading.culture, RING).setName('claimable'));
    }
  };

  /**
   * Every layer of one tile as the map draws it on a chronicle, and every object painted for it. The
   * units of a live tile are hung by the render; a tile out of sight carries its unit under its scrim.
   */
  const paintTile = (chronicle: Chronicle, seen: Drawing, tile: Tile): Mark[] => {
    const drawing = faceIn(seen, tile);
    if (drawing === undefined) return [];
    const face = drawing.tile;
    const key = tileKey(tile);
    const painted: Mark[] = [];
    const paint = (on: Phaser.GameObjects.Layer, object: Mark): void => {
      on.add(object);
      painted.push(object);
    };

    const { x, y } = positionOf(tile);
    paint(ground, terrainMark(scene, face.terrain).setPosition(x, y).setName(`tile-${key}`));
    const row = rowOf(face, x);
    if (face.feature !== undefined) {
      paint(
        features,
        featureMark(scene, face.feature)
          .setPosition(row.feature, y - ROW_RISE)
          .setName(`feature-${key}`),
      );
    }
    face.improvements.forEach((improvement, index) => {
      paint(
        improvements,
        improvementMark(scene, improvement)
          .setPosition(row.improvements[index], y - ROW_RISE)
          .setName(`improvement-${improvement}-${key}`),
      );
    });
    if (face.building !== undefined) {
      paint(built, buildingMark(scene, face.building).setPosition(x, y).setName(`building-${key}`));
    }
    if (seen.live.has(key)) return painted;
    // A snapshot answers for its tile whole: one taken of an empty tile hides the unit that has
    // walked onto it since.
    if (drawing.asStands) {
      const standing = unitAt(chronicle.units, tile);
      if (standing !== undefined) {
        paint(
          marks,
          unitMark(scene, standing.stats.type, standing.faction, standing.embarked).setPosition(
            x,
            y,
          ),
        );
      }
    } else {
      const kept = seen.charted.get(key)?.unit;
      if (kept !== undefined)
        paint(marks, unitMark(scene, kept.type, kept.faction, false).setPosition(x, y));
    }
    paint(fog, fogScrim(scene, tile));
    return painted;
  };

  /**
   * Every layer of every tile the map draws, on the chronicle it stands on. A terraform changes a
   * tile's terrain and takes its feature with it, an improvement is placed on it and a building is
   * built on it, so every layer follows every render.
   */
  const paintTiles = (): void => {
    wipe(ground);
    wipe(features);
    wipe(improvements);
    wipe(built);
    wipe(fog);
    if (shown === undefined) return;
    for (const tile of shown.tiles) paintTile(shown, { drawn, live, charted }, tile);
  };

  /**
   * The rivers repainted on the chronicle the map stands on, cut to the runs along the tiles it
   * draws: charting one draws the water beside it, so this follows every render. Every outline goes
   * down on one surface under all the water, so two rivers meeting read as one course.
   */
  const paintRivers = (): void => {
    wipe(rivers);
    if (shown === undefined) return;

    const along = riversAlong(shown.rivers, drawn).map((run) => run.map(cornerAt));
    const outlines = scene.add.graphics();
    rivers.add(outlines);
    for (const run of along) strokeRiver(outlines, run, LOOK.mapOutline, RIVER_OUTLINE_WIDTH);
    for (const run of along) {
      const water = scene.add.graphics().setName('river');
      rivers.add(water);
      strokeRiver(water, run, LOOK.river, RIVER_WIDTH);
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
   * holds none: every tile its move points reach lit, and every unit it can attack glowed in the
   * enemies' own colour. The one place a move or an attack is offered on the map — while the
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

    wipe(lighted);
    for (const landing of lit?.landings ?? [])
      lighted.add(glowTile(scene, landing.tile, LOOK.lit, LOOK.litGlow));
    for (const coord of lit?.targets ?? []) {
      lighted.add(glowTile(scene, coord, FACTION_COLOURS.enemy, LOOK.targetGlow));
    }
  };

  /** The border repainted on the chronicle the map stands on: a claim moves it, so a render does. */
  const paintBorder = (): void => {
    wipe(rings);
    if (shown === undefined) return;
    const { city } = shown;
    for (const coord of shown.held) {
      const weight = city !== undefined && same(coord, city) ? CITY_RING : RING;
      rings.add(ringMark(scene, coord, LOOK.civilization, weight));
    }
  };

  const render = (current: Chronicle): void => {
    flight = undefined;
    shown = current;
    ({ drawn, live, charted } = drawing(current));

    wipe(marks);

    paintTiles();
    paintRivers();
    paintBorder();

    markers = new Map(
      current.units.flatMap((unit): [number, Phaser.GameObjects.Container][] => {
        if (!live.has(tileKey(unit.tile))) return [];
        const marker = unitMarker(scene, unit);
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
  const markerOn = (coord: TileCoords): Phaser.GameObjects.Container | undefined => {
    const standing = shown === undefined ? undefined : unitAt(shown.units, coord);
    return standing === undefined ? undefined : markers.get(standing.id);
  };

  /** A unit's marker bumped where it stands, as an attack's target is. */
  const bump = (marker: Phaser.GameObjects.Container, delay: number): Promise<void> =>
    ended(
      scene.tweens.add({
        targets: marker,
        scale: 1.35,
        delay,
        duration: 60,
        ease: EASE,
        yoyo: true,
      }),
    );

  /** Whatever the map drew shrinking to nothing where it stands. */
  const shrink = (target: Phaser.GameObjects.GameObject, duration: number): Promise<void> =>
    ended(scene.tweens.add({ targets: target, scale: 0, duration, ease: EASE }));

  /** What a target does: a bump where it was attacked, and a shrink off the map if it was killed. */
  const bumped = async (
    marker: Phaser.GameObjects.Container,
    killed: boolean,
    token: symbol,
  ): Promise<void> => {
    await bump(marker, 150);
    if (!killed || flight !== token) return;
    await shrink(marker, 200);
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
      const marker = unitMarker(scene, unit).setScale(0);
      marks.add(marker);
      return marker;
    });

    return ended(scene.tweens.add({ targets: entering, scale: 1, duration: 250, ease: EASE })).then(
      () => settle(token, chronicle),
    );
  };

  /**
   * The frame brought to hold the tiles, and the motion once it does. A pan paints nothing, so a
   * motion that had nothing to animate after one is rendered here — the scene renders only the
   * stages the map answers nothing for.
   */
  const heldThen = (
    tiles: readonly TileCoords[],
    chronicle: Chronicle,
    motion: () => Promise<void> | undefined,
  ): Promise<void> | undefined => {
    const panning = hold(tiles);
    if (panning === undefined) return motion();
    return panning.then(() => {
      const played = motion();
      if (played === undefined) render(chronicle);
      return played;
    });
  };

  /** The unit on a tile damaged or healed by no attacker: its marker bumps as an attack's target does. */
  const bumpedOn = (coord: TileCoords, chronicle: Chronicle): Promise<void> | undefined => {
    const marker = markerOn(coord);
    if (marker === undefined) return undefined;
    const token = takeOff();
    return bump(marker, 0).then(() => settle(token, chronicle));
  };

  /** The unit on a tile killed by no attacker: its marker shrinks off the map as one an attack killed does. */
  const killedOn = (coord: TileCoords, chronicle: Chronicle): Promise<void> | undefined => {
    const marker = markerOn(coord);
    if (marker === undefined) return undefined;
    const token = takeOff();
    return shrink(marker, 200).then(() => settle(token, chronicle));
  };

  /** A mark raised onto a layer from nothing, where it stands on the face a change leaves. */
  const scaleUp = (
    on: Phaser.GameObjects.Layer,
    mark: Phaser.GameObjects.Polygon,
    x: number,
    y: number,
  ): Promise<void> => {
    on.add(mark.setPosition(x, y).setScale(0));
    return ended(scene.tweens.add({ targets: mark, scale: 1, duration: 250, ease: EASE }));
  };

  /** Whatever is painted rising out of nothing: what a tile newly drawn fades in with. */
  const fadeIn = (painted: readonly Mark[]): Promise<void> => {
    for (const object of painted) object.setAlpha(0);
    return ended(scene.tweens.add({ targets: painted, alpha: 1, duration: 400, ease: EASE }));
  };

  /**
   * The motion between two faces of one tile, and nothing where they are alike. The terrain
   * crossfades from the start; the marks gone shrink, then the marks staying slide to their slots on
   * the new face, then the marks come scale up in theirs.
   */
  const between = (
    coord: TileCoords,
    from: Tile,
    to: Tile,
  ): ((token: symbol) => Promise<void>) | undefined => {
    const key = tileKey(coord);
    const { x, y } = positionOf(coord);
    const was = rowOf(from, x);
    const is = rowOf(to, x);

    /** A mark the map drew that goes, or that stays and slides to `to`. */
    const drawnMarks: { on: Phaser.GameObjects.Layer; name: string; to: number | undefined }[] = [];
    const come: {
      on: Phaser.GameObjects.Layer;
      make: () => Phaser.GameObjects.Polygon;
      x: number;
      y: number;
    }[] = [];
    const compare = <Id extends string>(
      on: Phaser.GameObjects.Layer,
      name: (id: Id) => string,
      make: (id: Id) => Phaser.GameObjects.Polygon,
      markY: number,
      before: { ids: readonly Id[]; xs: readonly number[] },
      after: { ids: readonly Id[]; xs: readonly number[] },
    ): void => {
      for (const id of new Set([...before.ids, ...after.ids])) {
        const at = before.ids.indexOf(id);
        const next = after.ids.indexOf(id);
        if (next < 0) drawnMarks.push({ on, name: name(id), to: undefined });
        else if (at < 0) come.push({ on, make: () => make(id), x: after.xs[next], y: markY });
        else if (before.xs[at] !== after.xs[next]) {
          drawnMarks.push({ on, name: name(id), to: after.xs[next] });
        }
      }
    };
    const one = <Id extends string>(id: Id | undefined): Id[] => (id === undefined ? [] : [id]);
    compare(
      features,
      () => `feature-${key}`,
      (id) => featureMark(scene, id),
      y - ROW_RISE,
      { ids: one(from.feature), xs: [was.feature] },
      { ids: one(to.feature), xs: [is.feature] },
    );
    compare(
      improvements,
      (id) => `improvement-${id}-${key}`,
      (id) => improvementMark(scene, id),
      y - ROW_RISE,
      { ids: from.improvements, xs: was.improvements },
      { ids: to.improvements, xs: is.improvements },
    );
    compare(
      built,
      () => `building-${key}`,
      (id) => buildingMark(scene, id),
      y,
      { ids: one(from.building), xs: [x] },
      { ids: one(to.building), xs: [x] },
    );

    const crossfades = from.terrain !== to.terrain;
    if (!crossfades && drawnMarks.length === 0 && come.length === 0) return undefined;

    return async (token) => {
      let crossing = Promise.resolve();
      if (crossfades) {
        const face = terrainMark(scene, to.terrain).setPosition(x, y);
        ground.add(face);
        crossing = fadeIn([face]);
      }
      const drawn = drawnMarks.map((mark) => ({
        to: mark.to,
        object: mark.on.list.find((object) => object.name === mark.name),
      }));
      await Promise.all(
        drawn.flatMap(({ to: slot, object }) =>
          object !== undefined && slot === undefined ? [shrink(object, 250)] : [],
        ),
      );
      if (flight === token) {
        await Promise.all(
          drawn.flatMap(({ to: slot, object }) =>
            object !== undefined && slot !== undefined
              ? [ended(scene.tweens.add({ targets: object, x: slot, duration: 150, ease: EASE }))]
              : [],
          ),
        );
      }
      if (flight === token) {
        await Promise.all(come.map((mark) => scaleUp(mark.on, mark.make(), mark.x, mark.y)));
      }
      await crossing;
    };
  };

  /**
   * A change on a tile: the difference between the face the map draws of it on the chronicle it
   * stands on and the face it draws on the change's, played after the pan that holds the tile. A
   * tile newly drawn fades in whole; one drawn alike on both, or on neither, plays nothing.
   */
  const tileChanged = (coord: TileCoords, chronicle: Chronicle): Promise<void> | undefined => {
    const leaves = tileAt(chronicle.tiles, coord);
    const stood = shown === undefined ? undefined : tileAt(shown.tiles, coord);
    if (leaves === undefined) return undefined;
    const seen = drawing(chronicle);
    const to = faceIn(seen, leaves);
    if (to === undefined) return undefined;
    const from = stood === undefined ? undefined : drawnOf(stood);

    const motion =
      from === undefined
        ? () => fadeIn(paintTile(chronicle, seen, leaves))
        : between(coord, from.tile, to.tile);
    if (motion === undefined) return undefined;
    return heldThen([coord], chronicle, () => {
      const token = takeOff();
      return motion(token).then(() => settle(token, chronicle));
    });
  };

  /**
   * One stage on units: the frame comes to hold the tiles it plays on, and the motion starts once it
   * does. A stage with no tile drawn live on the chronicle it leaves moves neither marker nor frame
   * and is answered with nothing, so the scene renders the state it ends on.
   */
  const staged = (
    tiles: readonly TileCoords[],
    chronicle: Chronicle,
    motion: () => Promise<void> | undefined,
  ): Promise<void> | undefined => {
    const watched = drawing(chronicle).live;
    if (!tiles.some((tile) => watched.has(tileKey(tile)))) return undefined;
    return heldThen(tiles, chronicle, motion);
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
      case 'healed':
        return staged([stage.tile], stage.chronicle, () => bumpedOn(stage.tile, stage.chronicle));
      case 'killed':
        return staged([stage.tile], stage.chronicle, () => killedOn(stage.tile, stage.chronicle));
      case 'retiled':
      case 'charted':
        return tileChanged(stage.tile, stage.chronicle);
      case 'refreshed':
      case 'action-spent':
      case 'held':
      case 'settled':
      case 'stock':
      case 'population':
      case 'assigned':
      case 'added':
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
      case 'tallied':
      case 'reached':
      case 'runtime-error':
        return undefined;
    }
  };

  /** The stages held by a group the map played: it plays a group or the stages it holds, never both. */
  const covered = new WeakSet<Stage>();

  const grouped = (stage: Group): Promise<void> | undefined => {
    switch (stage.name) {
      case 'attack':
        return staged([stage.attacker, stage.target], stage.chronicle, () =>
          attack(stage.attacker, stage.target, stage.chronicle),
        );
      case 'capstone-landing':
      case 'capstone-continued':
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

    zoom: zoomBy,

    render,

    play(stage: Stage): Promise<void> | undefined {
      homeAtOnce();
      switch (stage.kind) {
        case 'change':
          return covered.has(stage) ? undefined : changed(stage);
        case 'group': {
          const motion = covered.has(stage) ? undefined : grouped(stage);
          if (motion !== undefined) for (const held of walked(stage.stages)) covered.add(held);
          return motion;
        }
      }
    },

    onPress(
      clicked: (found: PressedTile) => void,
      zoomed: () => void,
      commanded: (command: UnitCommand) => void,
      reassigned: (command: ReassignCommand) => void,
    ): void {
      rescale = zoomed;
      const catcher = catcherZone('press');
      presser = catcher;

      /** Whether a press has come far enough to be a drag; it stays one once it has. */
      const travelled = (grab: Grab, pointer: Phaser.Input.Pointer): boolean => {
        if (!grab.dragging && !dragged(scene, grab.from, pointer)) return false;
        grab.dragging = true;
        carrying.left = true;
        return true;
      };

      const carry = (pointer: Phaser.Input.Pointer): void => {
        if (grabbed === undefined || !travelled(grabbed, pointer)) return;
        const at = map.at(pointer.x, pointer.y);
        markOf(grabbed)?.setPosition(at.x, at.y);
      };
      scene.input.on('pointermove', carry);

      const letGo = (grab: Grab): void => {
        slideHome(grab);
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

      clickedTile = (tile) => {
        if (lit !== undefined && commandUnitOn(lit.unit, tile)) return;
        clicked(pressedOn(tile));
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
            takeHold({ kind: 'assigned', tile: under, from, dragging: false });
            return false;
          }
          const standing = unitAt(shown.units, under);
          if (standing?.faction !== 'player') return true;
          takeHold({ kind: 'unit', unit: standing.id, from, dragging: false });
          lightUnit(under);
          return false;
        },
        release: (pointer) => {
          const holding = grabbed;
          if (holding === undefined) return;
          if (!holding.dragging) {
            letGo(holding);
            return;
          }
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(at.x, at.y);
          slideHome(holding);
          grabbed = undefined;
          // After Phaser's dispatch of this release: a hit test inside it refills the list being
          // walked (docs/PHASER.md).
          queueMicrotask(() => {
            const landed = thingUnder(scene.game) === catcher ? on : undefined;
            if (landed !== undefined && shown !== undefined) {
              switch (holding.kind) {
                case 'unit':
                  if (commandUnitOn(holding.unit, landed)) return;
                  break;
                case 'assigned': {
                  const command = cityDrag(shown, holding.tile, landed);
                  if (command !== undefined) {
                    reassigned(command);
                    return;
                  }
                  break;
                }
              }
            }
            lightUnit(selection);
          });
        },
        abandon: () => {
          if (grabbed !== undefined) letGo(grabbed);
        },
      });
    },

    markSelected(tile: TileCoords | undefined, cost: Cost | undefined): void {
      selection = tile === undefined ? undefined : { q: tile.q, r: tile.r };
      threshold =
        cost === undefined || selection === undefined ? undefined : { tile: selection, cost };
      wipe(selected);
      selected.setData('tile', tile === undefined ? undefined : tileKey(tile));
      if (tile !== undefined) {
        const { x, y } = positionOf(tile);
        selected.add(
          scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), 0, 0).setStrokeStyle(4, LOOK.selected),
        );
      }
      paintThreshold();
      paintYields();
      lightUnit(selection);
    },

    faceOf(tile: TileCoords): TileFace {
      return faceAt(tile);
    },

    pressedOn,

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
      for (const coord of lit) glow.add(glowTile(scene, coord, LOOK.lit, LOOK.litGlow));

      const click = (tile: TileCoords): void => {
        if (lit.some((coord) => same(coord, tile))) chosen(tile);
        else refused(pressedOn(tile));
      };
      aimClicked = click;

      const stop = takePress(catcher, {});

      return () => {
        stop();
        close();
        if (aimClicked === click) aimClicked = undefined;
        released();
      };
    },

    placeOf(
      on: Phaser.GameObjects.GameObject | undefined,
    ): { readonly tile: TileCoords | undefined } | undefined {
      if (!(on instanceof Phaser.GameObjects.Zone) || !catchers.has(on)) return undefined;
      const pointer = scene.input.activePointer;
      const at = map.at(pointer.x, pointer.y);
      return { tile: tileUnder(at.x, at.y) };
    },

    carried(press: Press): boolean {
      return carrying[press];
    },

    click(tile: TileCoords): void {
      (aimClicked ?? clickedTile)?.(tile);
    },

    unitBeingAimed(): boolean {
      return lit !== undefined && (lit.landings.length > 0 || lit.targets.length > 0);
    },
  };
}
