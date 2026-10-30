import Phaser from 'phaser';
import {
  type BuildingTypeId,
  CENTRE,
  type Corner,
  cornerKey,
  cornersOf,
  type FeatureId,
  type ImprovementId,
  neighbours,
  type River,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from '../rules/map';
import type { Resource } from '../rules/resources';
import type { CityFaction, Cost } from '../rules/state';
import type { Faction } from '../rules/units';
import {
  addText,
  corners,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  hexagon,
  ownBoxOf,
  UI_FONT,
} from './design-space';
import { css, type Glow, LOOK } from './look';
import {
  buildingColourOf,
  buildingMarkOf,
  featureColourOf,
  featureMarkOf,
  improvementMarkOf,
  terrainColourOf,
  unitMarkOf,
} from './marks';
import { text } from './text';

export const TILE_SIZE = 24;

export const FACTION_COLOURS: Record<Faction, number> = {
  player: LOOK.civilization,
  enemy: LOOK.enemy,
  neutral: LOOK.neutral,
};

export const CITY_COLOURS: Record<CityFaction, number> = {
  player: LOOK.civilization,
  neutral: LOOK.neutral,
};

/** Every city faction, read off the table every one of them must hold a colour in. */
export const CITY_FACTIONS = Object.keys(CITY_COLOURS) as CityFaction[];

const CITY_BADGE_INKS: Record<CityFaction, number> = {
  player: LOOK.civilizationBadgeInk,
  neutral: LOOK.neutralBadgeInk,
};

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

// Phaser reads a polygon's first point at its construction, and one with none throws.
/** What a polygon holds until a mark is read onto it. */
export const UNREAD: number[] = [0, 0, 1, 0, 0, 1];

/** How far above a tile's middle the row of its feature and its improvements stands, clear of a building mark. */
export const ROW_RISE = 15;
/** How far apart the marks of that row stand, centre to centre. */
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

/**
 * A city's badge: how far right of and below its tile's middle its centre stands, how tall it is,
 * the pad on each side of its number, and how the number reads.
 */
const BADGE_OFF = 12;
const BADGE_HEIGHT = 14;
const BADGE_PAD = 3;
const BADGE_STYLE = { fontFamily: UI_FONT, fontSize: '10px', fontStyle: 'bold' };

/** What the map draws a tile's things as: one polygon, or a unit's mark, a container of them. */
export type Mark = Phaser.GameObjects.Polygon | Phaser.GameObjects.Container;

/** What each tile of the disc keeps from the chronicle's open, shown as the tile stands. */
export type TileObjects = {
  readonly face: Phaser.GameObjects.Polygon;
  readonly feature: Phaser.GameObjects.Polygon;
  readonly ring: Phaser.GameObjects.Polygon;
  readonly building: Phaser.GameObjects.Polygon;
  readonly scrim: Phaser.GameObjects.Polygon;
};

/** What the map keeps of a unit from its entering to its leaving, shown as the unit stands. */
export type UnitObjects = {
  readonly marker: Phaser.GameObjects.Container;
  readonly parts: Phaser.GameObjects.Container;
  readonly dim: Phaser.GameObjects.Container;
  readonly hue: Phaser.GameObjects.Polygon;
};

export function positionOf({ q, r }: TileCoords): { x: number; y: number } {
  return {
    x: DESIGN_WIDTH / 2 + Math.sqrt(3) * TILE_SIZE * (q + r / 2),
    y: DESIGN_HEIGHT / 2 + 1.5 * TILE_SIZE * r,
  };
}

/** Where the mark of a tile the population stands on lies: below the middle of that tile. */
export function assignedAt(tile: TileCoords): { x: number; y: number } {
  const { x, y } = positionOf(tile);
  return { x, y: y + ASSIGNED_DROP };
}

/**
 * Where the marks of a face's row stand across its tile, its feature first and its improvements
 * after, in the order the face holds them, the row centred on the tile's middle `x`.
 */
export function rowOf(face: Tile, x: number): { feature: number; improvements: number[] } {
  const first = face.feature === undefined ? 0 : 1;
  const count = first + face.improvements.length;
  const at = (slot: number): number => x + (slot - (count - 1) / 2) * ROW_PITCH;
  return { feature: at(0), improvements: face.improvements.map((_, index) => at(first + index)) };
}

/** The hexagonal face of a tile, at the size a tile is drawn at, with no terrain on it yet. */
export function tileFace(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, hexagon(TILE_SIZE)).setStrokeStyle(1, LOOK.mapOutline);
}

/** A face made to draw a terrain, whatever it drew before. */
export function asTerrain(
  face: Phaser.GameObjects.Polygon,
  terrain: Terrain,
): Phaser.GameObjects.Polygon {
  return face.setFillStyle(terrainColourOf(terrain));
}

export function terrainMark(scene: Phaser.Scene, terrain: Terrain): Phaser.GameObjects.Polygon {
  return asTerrain(tileFace(scene), terrain);
}

/** A polygon made to draw a building: its placeholder mark, in the colour it is known by. */
export function asBuilding(
  mark: Phaser.GameObjects.Polygon,
  building: BuildingTypeId,
): Phaser.GameObjects.Polygon {
  return mark
    .setTo(corners(buildingMarkOf(building)))
    .setFillStyle(buildingColourOf(building))
    .setStrokeStyle(2, LOOK.mapOutline);
}

export function buildingMark(
  scene: Phaser.Scene,
  building: BuildingTypeId,
): Phaser.GameObjects.Polygon {
  return asBuilding(scene.add.polygon(0, 0, UNREAD), building);
}

/** A polygon made to draw a feature: its placeholder mark, in the colour it is known by. */
export function asFeature(
  mark: Phaser.GameObjects.Polygon,
  feature: FeatureId,
): Phaser.GameObjects.Polygon {
  return mark
    .setTo(corners(featureMarkOf(feature)))
    .setFillStyle(featureColourOf(feature))
    .setStrokeStyle(1, LOOK.mapOutline);
}

export function featureMark(scene: Phaser.Scene, feature: FeatureId): Phaser.GameObjects.Polygon {
  return asFeature(scene.add.polygon(0, 0, UNREAD), feature);
}

/** A river drawn off the map: its placeholder mark, in the blue a river runs in. */
export function riverMark(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, RIVER_MARK, LOOK.river).setStrokeStyle(1, LOOK.mapOutline);
}

/** A polygon made to draw an improvement: its placeholder mark, in the stone everything worked is. */
export function asImprovement(
  mark: Phaser.GameObjects.Polygon,
  improvement: ImprovementId,
): Phaser.GameObjects.Polygon {
  return mark
    .setTo(corners(improvementMarkOf(improvement)))
    .setFillStyle(LOOK.built)
    .setStrokeStyle(2, LOOK.mapOutline);
}

export function improvementMark(
  scene: Phaser.Scene,
  improvement: ImprovementId,
): Phaser.GameObjects.Polygon {
  return asImprovement(scene.add.polygon(0, 0, UNREAD), improvement);
}

/** The shapes a unit's mark is drawn from, bottom first, each its corners and its drop below the middle. */
function unitShapes(type: string, embarked: boolean): { corners: number[]; drop: number }[] {
  const kind = { corners: corners(unitMarkOf(type)), drop: 0 };
  return embarked ? [{ corners: corners(HULL), drop: HULL_DROP }, kind] : [kind];
}

/**
 * A container read as a unit's shapes, one polygon each, dressed by `dress`: a polygon is added where
 * it holds too few, and the ones left over are hidden.
 */
function asShapes(
  on: Phaser.GameObjects.Container,
  type: string,
  embarked: boolean,
  dress: (part: Phaser.GameObjects.Polygon) => void,
): Phaser.GameObjects.Container {
  const shapes = unitShapes(type, embarked);
  while (on.length < shapes.length) on.add(on.scene.add.polygon(0, 0, UNREAD));
  (on.list as Phaser.GameObjects.Polygon[]).forEach((part, at) => {
    part.setVisible(at < shapes.length);
    if (at < shapes.length) dress(part.setTo(shapes[at].corners).setY(shapes[at].drop));
  });
  return on;
}

/** A container read as a unit's mark, over a hull while it is embarked, in its faction's colour. */
export function asUnit(
  mark: Phaser.GameObjects.Container,
  type: string,
  faction: Faction,
  embarked: boolean,
): Phaser.GameObjects.Container {
  return asShapes(mark, type, embarked, (part) => {
    part.setFillStyle(FACTION_COLOURS[faction]).setStrokeStyle(2, LOOK.mapOutline);
  });
}

export function unitMark(
  scene: Phaser.Scene,
  type: string,
  faction: Faction,
  embarked: boolean,
): Phaser.GameObjects.Container {
  return asUnit(scene.add.container(0, 0), type, faction, embarked);
}

/** A container read as the scrim of a unit's own shape. */
export function asUnitDim(
  dim: Phaser.GameObjects.Container,
  type: string,
  embarked: boolean,
): Phaser.GameObjects.Container {
  return asShapes(dim, type, embarked, (part) => {
    part.setFillStyle(LOOK.mapOutline, LOOK.mapDim.strength);
  });
}

// A stroked diamond is a square turned: a stroked polygon comes out open (docs/PHASER.md, under
// WebGL). One drawn with no outline, as the card face draws its own, meets none of it.
/** A diamond the map outlines: `span` corner to corner, in the colour given. */
export function diamond(
  scene: Phaser.Scene,
  span: number,
  colour: number,
): Phaser.GameObjects.Rectangle {
  const side = span / Math.SQRT2;
  return scene.add
    .rectangle(0, 0, side, side, colour)
    .setStrokeStyle(1, LOOK.mapOutline)
    .setAngle(45);
}

/** A diamond made to draw a point of yield, in the colour its resource is known by. */
export function asYield(
  mark: Phaser.GameObjects.Rectangle,
  resource: Resource,
): Phaser.GameObjects.Rectangle {
  return mark.setFillStyle(LOOK.reading[resource]).setName(`yield-${resource}`);
}

/** A hexagon just inside a tile's face, stroked in the colour given. */
export function ringMark(
  scene: Phaser.Scene,
  colour: number,
  weight: number,
): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, hexagon(TILE_SIZE - 4), 0, 0).setStrokeStyle(weight, colour);
}

/** The mark of an assigned tile: a diamond in the colour population is known by. */
export function assignedMark(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  return diamond(scene, ASSIGNED_GLYPH, LOOK.population).setName('assigned');
}

/** What a claim asks for: its number and its resource's own diamond, in one container. */
type ThresholdMark = {
  readonly root: Phaser.GameObjects.Container;
  readonly number: Phaser.GameObjects.Text;
  readonly glyph: Phaser.GameObjects.Rectangle;
};

export function thresholdMark(scene: Phaser.Scene): ThresholdMark {
  const number = addText(scene, 0, 0, '', THRESHOLD_STYLE).setOrigin(0.5, 0.5);
  const glyph = diamond(scene, THRESHOLD_GLYPH, 0);
  const root = scene.add.container(0, 0, [number, glyph]).setName('threshold').setVisible(false);
  return { root, number, glyph };
}

/**
 * What a claim asks for standing on its tile: the threshold as a minus and its number, its
 * resource's own diamond beside it, the pair centred on the tile's middle.
 */
export function showThreshold(
  { root, number, glyph }: ThresholdMark,
  coord: TileCoords,
  cost: Cost,
): void {
  number.setText(text('threshold.culture', { culture: cost.amount }));
  glyph.setFillStyle(LOOK.reading[cost.resource]);
  const width = number.width + THRESHOLD_GAP + THRESHOLD_GLYPH;
  number.setX((number.width - width) / 2);
  glyph.setX((width - THRESHOLD_GLYPH) / 2);
  const { x, y } = positionOf(coord);
  root.setPosition(x, y).setVisible(true);
}

/** A city's badge: its pill, its number, and the width the pill is drawn at, none until it is. */
export type PopulationBadge = {
  readonly pill: Phaser.GameObjects.Graphics;
  readonly number: Phaser.GameObjects.Text;
  width: number | undefined;
};

export function populationBadge(scene: Phaser.Scene, whose: CityFaction): PopulationBadge {
  const number = addText(scene, 0, 0, '', { ...BADGE_STYLE, color: css(CITY_BADGE_INKS[whose]) })
    .setOrigin(0.5, 0.5)
    .setVisible(false);
  const pill = scene.add.graphics().setData('fill', CITY_COLOURS[whose]).setVisible(false);
  return { pill, number, width: undefined };
}

/**
 * A city's own tile wearing its population: the number on a pill in that city's colour at the tile's
 * lower-right corner, a disc until the number needs more room, widening about its middle.
 */
export function showBadge(
  badge: PopulationBadge,
  coord: TileCoords,
  whose: CityFaction,
  population: number,
): void {
  const { pill, number } = badge;
  const { x, y } = positionOf(coord);
  const at = { x: x + BADGE_OFF, y: y + BADGE_OFF };
  const key = tileKey(coord);
  number
    .setText(String(population))
    .setPosition(at.x, at.y)
    .setName(`population-${key}-number`)
    .setVisible(true);
  pill.setPosition(at.x, at.y).setName(`population-${key}`).setVisible(true);

  const width = Math.max(BADGE_HEIGHT, ownBoxOf(number).width + 2 * BADGE_PAD);
  if (width === badge.width) return;
  badge.width = width;
  const box = { x: -width / 2, y: -BADGE_HEIGHT / 2, width, height: BADGE_HEIGHT };
  const radius = BADGE_HEIGHT / 2;
  pill
    .clear()
    .fillStyle(CITY_COLOURS[whose])
    .fillRoundedRect(box.x, box.y, box.width, box.height, radius)
    .lineStyle(1.5, LOOK.mapOutline)
    .strokeRoundedRect(box.x, box.y, box.width, box.height, radius);
}

/** The scrim over a held tile with nobody on it and all it carries. */
export function cityDim(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, hexagon(TILE_SIZE), LOOK.mapOutline, LOOK.mapDim.strength)
    .setName('city-dim');
}

/** The scrim over a tile in fog, as it was last seen. */
export function fogScrim(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, hexagon(TILE_SIZE), LOOK.mapOutline, LOOK.mapDim.strength)
    .setName(`fog-${tileKey(coord)}`);
}

/** Where a corner of the tile lattice stands on the map's own surface. */
function cornerAt({ x, y }: Corner): Phaser.Math.Vector2 {
  const middle = positionOf(CENTRE);
  return new Phaser.Math.Vector2(
    middle.x + x * (Math.sqrt(3) / 2) * TILE_SIZE,
    middle.y + (y * TILE_SIZE) / 2,
  );
}

/** The disc's rim: a line along every edge a tile of the disc shares with no other. */
export function strokeRim(rim: Phaser.GameObjects.Graphics, tiles: readonly Tile[]): void {
  const onMap = new Set(tiles.map(tileKey));
  rim.lineStyle(RIM_WIDTH, LOOK.mapRim);
  for (const tile of tiles) {
    const around = new Set(cornersOf(tile).map(cornerKey));
    for (const coord of neighbours(tile)) {
      if (onMap.has(tileKey(coord))) continue;
      const shared = cornersOf(coord).filter((corner) => around.has(cornerKey(corner)));
      rim.strokePoints(shared.map(cornerAt), false);
    }
  }
}

/**
 * A line along a river's corners, in one colour at one width. Phaser bevels the joints of a stroked
 * path and leaves its ends square, so a disc at every corner rounds both.
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

/** Every outline on one surface under all the water, so two rivers meeting read as one course. */
export function strokeRivers(
  outlines: Phaser.GameObjects.Graphics,
  water: () => Phaser.GameObjects.Graphics,
  runs: readonly River[],
): void {
  const along = runs.map((run) => run.map(cornerAt));
  for (const run of along) strokeRiver(outlines, run, LOOK.mapOutline, RIVER_OUTLINE_WIDTH);
  for (const run of along) strokeRiver(water(), run, LOOK.river, RIVER_WIDTH);
}

/** A hexagon just inside a tile's face, with no glow on it yet. */
export function unreadGlow(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, hexagon(TILE_SIZE - 2));
}

/** An `unreadGlow` made to glow on a tile, whatever it glowed on before. */
export function asGlow(
  mark: Phaser.GameObjects.Polygon,
  coord: TileCoords,
  colour: number,
  glow: Glow,
): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return mark
    .setPosition(x, y)
    .setFillStyle(colour, glow.fill)
    .setStrokeStyle(2, colour, glow.stroke)
    .setData('tile', tileKey(coord));
}

export function glowTile(
  scene: Phaser.Scene,
  coord: TileCoords,
  colour: number,
  glow: Glow,
): Phaser.GameObjects.Polygon {
  return asGlow(unreadGlow(scene), coord, colour, glow);
}
