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
  type Terrain,
  type Tile,
  type TileCoords,
  type TilesBeside,
  tileKey,
  water,
} from '../rules/map';
import type { MapContent } from '../rules/map-kinds';
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
  FACE_SHEET,
  FEATURE_SHEET_KEY,
  featureDressOf,
  featureIconOf,
  HERD_COPIES,
  improvementMarkOf,
  PONDS,
  paintingOn,
  paintingsOf,
  pickOf,
  shorePaintingsOf,
  tintedName,
  unitMarkOf,
} from './marks';
import { text } from './text';

export const TILE_SIZE = 24;

/** How much the map's lattice is squashed down: rows three quarters of a tile's width apart (docs/LOOK.md). */
export const SQUASH = 0.75 / (Math.sqrt(3) / 2);

/** A hexagon as the map draws it, squashed with the lattice. */
export function mapHexagon(size: number): number[] {
  return hexagon(size).map((value, i) => (i % 2 === 1 ? value * SQUASH : value));
}

/** How wide his file is, how tall, and how far down it the middle of his hexagon lies, in his pixels. */
export const PAINTING = { width: 256, height: 384, middle: 256 };

/** How much wider than its tile a face is drawn, so no seam of the page shows between neighbours. */
const FACE_OVERLAP = 1.04;

/** How much smaller than his file a face is drawn, and anything painted at his tile's scale. */
const FACE_SCALE = (Math.sqrt(3) * TILE_SIZE * FACE_OVERLAP) / PAINTING.width;

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

/** Placeholder primitive until the art pass: a river standing as a mark of its own, a bent band in its own blue. */
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

/** How wide a feature's icon stands, and the disc under it with its rim. */
const ICON_WIDTH = 14;
const DISC_RADIUS = 9;
const DISC_RIM = 1;

/** How wide a copy of a herd's animal is, and how far across and down from the middle each may lie. */
const HERD_WIDTH = 8;
const HERD_SPREAD = { x: 16, y: 5 };

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
const BADGE_STYLE = { fontFamily: UI_FONT, fontSize: '11px', fontStyle: 'bold' };

/**
 * What the map draws a tile's things as: a picture, one polygon, a feature's disc, or a unit's mark,
 * a container of them.
 */
export type Mark =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Polygon
  | Phaser.GameObjects.Arc
  | Phaser.GameObjects.Container;

/** What each tile of the disc keeps from the chronicle's open, shown as the tile stands. */
export type TileObjects = {
  readonly face: Phaser.GameObjects.Image;
  readonly shore: Phaser.GameObjects.Image;
  readonly feature: Phaser.GameObjects.Image;
  readonly featureDisc: Phaser.GameObjects.Arc;
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
    y: DESIGN_HEIGHT / 2 + 1.5 * TILE_SIZE * SQUASH * r,
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

/** The face of a tile, held about the middle of his hexagon, with no terrain on it yet. */
export function tileFace(scene: Phaser.Scene): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, FACE_SHEET.key).setOrigin(0.5, PAINTING.middle / PAINTING.height);
}

// The scale is set here and `asPainted` resets it to one: a face is painted before it wears anything.
/** A face made to wear a painting of a sheet at the width of a tile, whatever it wore before. */
export function wearing(
  face: Phaser.GameObjects.Image,
  sheet: string,
  painting: string,
): Phaser.GameObjects.Image {
  return face.setTexture(sheet, painting).setScale(FACE_SCALE);
}

/**
 * A face made to wear the painting of its terrain its tile's place on the disc picks, tinted where
 * the feature on it tints it.
 */
export function asTerrain(
  face: Phaser.GameObjects.Image,
  { terrain, feature }: Pick<Tile, 'terrain' | 'feature'>,
  coord: TileCoords,
): Phaser.GameObjects.Image {
  const painting = paintingOn(paintingsOf(terrain), coord);
  if (feature !== undefined && featureDressOf(feature).kind === 'tint') {
    return wearing(face, FEATURE_SHEET_KEY, tintedName(painting, feature));
  }
  return wearing(face, FACE_SHEET.key, painting);
}

/**
 * The shore a tile wears over its face, read off the faces drawn beside it: his coast along every
 * edge of a water face where a face of land is drawn, the one of his two its place on the disc picks,
 * and none where the face is not water or no land is drawn beside it.
 */
export function shoreOn(
  catalogue: MapContent,
  faces: TilesBeside,
  coord: TileCoords,
): string | undefined {
  const face = faces(coord);
  if (face === undefined || !water(catalogue, face.terrain)) return undefined;
  const paintings = shorePaintingsOf(
    neighbours(coord).map((beside) => {
      const drawn = faces(beside);
      return drawn !== undefined && !water(catalogue, drawn.terrain);
    }),
  );
  return paintings.length === 0 ? undefined : paintingOn(paintings, coord);
}

/** A terrain off the map: its first painting, held about the middle of the picture. */
export function terrainMark(scene: Phaser.Scene, terrain: Terrain): Phaser.GameObjects.Image {
  return wearing(tileFace(scene), FACE_SHEET.key, paintingsOf(terrain)[0]).setOrigin(0.5, 0.5);
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

// The scale is set here and `asPainted` resets it to one: an icon is painted before it wears a feature.
/** An image of the features sheet made to draw a feature on the map: its icon, at the width it stands. */
export function asFeature(
  icon: Phaser.GameObjects.Image,
  feature: FeatureId,
): Phaser.GameObjects.Image {
  return icon
    .setTexture(FEATURE_SHEET_KEY, featureIconOf(feature))
    .setDisplaySize(ICON_WIDTH, ICON_WIDTH);
}

/** A feature off the map: its icon, bare. */
export function featureMark(scene: Phaser.Scene, feature: FeatureId): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, FEATURE_SHEET_KEY, featureIconOf(feature));
}

/** The disc a feature's icon stands on, with its rim. */
export function featureDisc(scene: Phaser.Scene): Phaser.GameObjects.Arc {
  return scene.add
    .circle(0, 0, DISC_RADIUS, LOOK.featureDisc.colour, LOOK.featureDisc.strength)
    .setStrokeStyle(DISC_RIM, LOOK.featureDiscRim.colour, LOOK.featureDiscRim.strength);
}

/** One mark a feature lays on its tile's ground: its name, and the way to paint it on an image of the features sheet. */
export type Lying = {
  readonly name: string;
  paint(image: Phaser.GameObjects.Image): Phaser.GameObjects.Image;
};

/**
 * What a feature lays on its tile's ground: three copies of its animal scattered about the tile's
 * middle by its place on the disc, every other one turned, or his pond its place picks, or nothing.
 */
export function lyingOf(feature: FeatureId, coord: TileCoords): Lying[] {
  const key = tileKey(coord);
  const { q, r } = coord;
  const { x, y } = positionOf(coord);
  const dress = featureDressOf(feature);
  switch (dress.kind) {
    case 'herd':
      return Array.from({ length: HERD_COPIES }, (_, copy) => {
        const name = `herd-${key}-${copy}`;
        const across = pickOf(q * 7 + copy, r * 13 + 3 * copy, 1000) / 1000;
        const down = pickOf(r * 11 + 5 * copy, q * 3 + copy, 1000) / 1000;
        return {
          name,
          paint: (image) =>
            image
              .setTexture(FEATURE_SHEET_KEY, featureIconOf(feature))
              .setDisplaySize(HERD_WIDTH, HERD_WIDTH)
              .setFlipX(pickOf(q + copy, r - copy, 2) === 1)
              .setPosition(x + (across * 2 - 1) * HERD_SPREAD.x, y + (down * 2 - 1) * HERD_SPREAD.y)
              .setName(name),
        };
      });
    case 'pond': {
      const name = `pond-${key}`;
      return [
        {
          name,
          paint: (image) =>
            image
              .setTexture(FEATURE_SHEET_KEY, paintingOn(PONDS, coord))
              .setScale(FACE_SCALE)
              .setFlipX(false)
              .setPosition(x, y)
              .setName(name),
        },
      ];
    }
    case 'tint':
      return [];
  }
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
  return scene.add.polygon(0, 0, mapHexagon(TILE_SIZE - 4), 0, 0).setStrokeStyle(weight, colour);
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
    .polygon(0, 0, mapHexagon(TILE_SIZE), LOOK.mapOutline, LOOK.mapDim.strength)
    .setName('city-dim');
}

/** The scrim over a tile in fog, as it was last seen. */
export function fogScrim(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, mapHexagon(TILE_SIZE), LOOK.mapOutline, LOOK.mapDim.strength)
    .setName(`fog-${tileKey(coord)}`);
}

/** Where a corner of the tile lattice stands on the map's own surface. */
export function cornerAt({ x, y }: Corner): Phaser.Math.Vector2 {
  const middle = positionOf(CENTRE);
  return new Phaser.Math.Vector2(
    middle.x + x * (Math.sqrt(3) / 2) * TILE_SIZE,
    middle.y + ((y * TILE_SIZE) / 2) * SQUASH,
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

/** A hexagon just inside a tile's face, with no glow on it yet. */
export function unreadGlow(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, mapHexagon(TILE_SIZE - 2));
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
