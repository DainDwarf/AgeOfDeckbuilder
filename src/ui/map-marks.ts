import Phaser from 'phaser';
import {
  type BuildingTypeId,
  CENTRE,
  type Corner,
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
import { addText, corners, DESIGN_HEIGHT, DESIGN_WIDTH, ownBoxOf, UI_FONT } from './design-space';
import { css, type Glow, LOOK, multiplied, type Wash } from './look';
import {
  BUILDING_SHEET,
  type BuildingLook,
  type BuildingPaintings,
  type BuildingPiece,
  buildingLookOf,
  clearingsOf,
  FACE_SHEET,
  FEATURE_SHEET_KEY,
  featureDressOf,
  featureIconOf,
  HERD_COPIES,
  improvementMarkOf,
  PATCH,
  PONDS,
  paintIn,
  paintingOn,
  paintingsOf,
  pickOf,
  shorePaintingsOf,
  tintedName,
  unitMarkOf,
  VOIDS,
} from './marks';
import { text } from './text';

export const TILE_SIZE = 24;

/** How much the map's lattice is squashed down: rows three quarters of a tile's width apart (docs/LOOK.md). */
export const SQUASH = 0.75 / (Math.sqrt(3) / 2);

/** A tile's hexagon on the map's own surface, at `size` about the tile's middle: its corners at `TILE_SIZE`. */
export function hexagonOn(tile: TileCoords, size: number): { x: number; y: number }[] {
  const middle = positionOf(tile);
  return cornersOf(tile)
    .map(cornerAt)
    .map(({ x, y }) => ({
      x: middle.x + ((x - middle.x) * size) / TILE_SIZE,
      y: middle.y + ((y - middle.y) * size) / TILE_SIZE,
    }));
}

/** A hexagon as the map draws it, squashed with the lattice, as a polygon's points. */
export function mapHexagon(size: number): number[] {
  return corners(hexagonOn(CENTRE, size).flatMap(({ x, y }) => [x, y]));
}

/** How wide his file is, how tall, and how far down it the middle of his hexagon lies, in his pixels. */
export const PAINTING = { width: 256, height: 384, middle: 256 };

/** How much wider than its tile a face is drawn, so no seam of the page shows between neighbours. */
const FACE_OVERLAP = 1.04;

/** How much smaller than his file anything painted beside his tile is drawn: a tile's width to his. */
const PAINTED_SCALE = (Math.sqrt(3) * TILE_SIZE) / PAINTING.width;

/** How much smaller than his file a face is drawn, and anything painted at his tile's scale. */
const FACE_SCALE = PAINTED_SCALE * FACE_OVERLAP;

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

/**
 * The culture threshold on a tile: how the number reads, the glyph beside it with its gap, and the
 * plate under the pair, how tall it is and its room on each side of the pair.
 */
const THRESHOLD_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '12px',
  fontStyle: 'bold',
  color: css(LOOK.thresholdInk),
};
const THRESHOLD_GLYPH = 8;
const THRESHOLD_GAP = 3;
const THRESHOLD_PLATE_HEIGHT = 16;
const THRESHOLD_PLATE_PAD = 4;

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
  /** His void, standing while the map does not draw the tile. */
  readonly void: Phaser.GameObjects.Image;
  readonly face: Phaser.GameObjects.Image;
  readonly shore: Phaser.GameObjects.Image;
  readonly feature: Phaser.GameObjects.Image;
  readonly featureDisc: Phaser.GameObjects.Arc;
  readonly building: Phaser.GameObjects.Polygon;
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

/** A colour of a mark as its tile shows it: darkened by the fog's tint on a tile in fog. */
export function darkened(colour: number, inFog: boolean): number {
  return inFog ? multiplied(colour, LOOK.fog) : colour;
}

// A Shape carries no tint (docs/PHASER.md): a shape is darkened through its colours, by `darkened`.
/** An image of the map darkened by the fog's tint on a tile in fog, and its tint cleared on any other. */
export function asDarkened(
  image: Phaser.GameObjects.Image,
  inFog: boolean,
): Phaser.GameObjects.Image {
  return inFog ? image.setTint(LOOK.fog) : image.clearTint();
}

/** The face of a tile, held about the middle of his hexagon, with no terrain on it yet. */
export function tileFace(scene: Phaser.Scene): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, FACE_SHEET.key).setOrigin(0.5, PAINTING.middle / PAINTING.height);
}

// The scale is set here and `asPainted` resets it to one: a face is painted before it wears anything.
/**
 * A face made to wear a painting of a sheet at the width of a tile, darkened on a tile in fog,
 * whatever it wore before.
 */
export function wearing(
  face: Phaser.GameObjects.Image,
  sheet: string,
  painting: string,
  inFog: boolean,
): Phaser.GameObjects.Image {
  return asDarkened(face.setTexture(sheet, painting).setScale(FACE_SCALE), inFog);
}

/** The painting a tile's face wears, and the sheet that holds it. */
export type FacePainting = { readonly sheet: string; readonly painting: string };

/**
 * The painting a tile's face wears, picked by its place on the disc: his clearing of its terrain
 * under a painted building, where he painted any, else his painting of it; tinted where the feature on
 * it tints it.
 */
export function facePaintingOn(
  { terrain, feature, building }: Pick<Tile, 'terrain' | 'feature' | 'building'>,
  coord: TileCoords,
): FacePainting {
  const cleared =
    building !== undefined && buildingLookOf(building).kind === 'painted'
      ? clearingsOf(terrain)
      : [];
  const painting = paintingOn(cleared.length > 0 ? cleared : paintingsOf(terrain), coord);
  if (feature !== undefined && featureDressOf(feature).kind === 'tint') {
    return { sheet: FEATURE_SHEET_KEY, painting: tintedName(painting, feature) };
  }
  return { sheet: FACE_SHEET.key, painting };
}

/** A face made to wear the painting its tile wears, darkened on a tile in fog. */
export function asTerrain(
  face: Phaser.GameObjects.Image,
  tile: Pick<Tile, 'terrain' | 'feature' | 'building'>,
  coord: TileCoords,
  inFog: boolean,
): Phaser.GameObjects.Image {
  const { sheet, painting } = facePaintingOn(tile, coord);
  return wearing(face, sheet, painting, inFog);
}

/** A face made to wear the one of his voids its tile's place on the disc picks. */
export function asVoid(
  face: Phaser.GameObjects.Image,
  coord: TileCoords,
): Phaser.GameObjects.Image {
  return wearing(face, FACE_SHEET.key, paintingOn(VOIDS, coord), false);
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
  const face = wearing(tileFace(scene), FACE_SHEET.key, paintingsOf(terrain)[0], false);
  return face.setOrigin(0.5, 0.5);
}

/**
 * A polygon made to draw a building: its placeholder mark, in the colour it is known by, darkened on
 * a tile in fog.
 */
export function asBuilding(
  mark: Phaser.GameObjects.Polygon,
  { corners: around, colour }: BuildingLook & { readonly kind: 'mark' },
  inFog: boolean,
): Phaser.GameObjects.Polygon {
  return mark
    .setTo(corners([...around]))
    .setFillStyle(darkened(colour, inFog))
    .setStrokeStyle(2, darkened(LOOK.mapOutline, inFog));
}

// The scale is set here and `asPainted` resets it to one: a patch is painted before it is placed.
/** An image of the buildings sheet made to draw the patch about its own middle, darkened on a tile in fog. */
export function asPatch(image: Phaser.GameObjects.Image, inFog: boolean): Phaser.GameObjects.Image {
  return asDarkened(
    image
      .setTexture(BUILDING_SHEET.key, PATCH.frame)
      .setOrigin(0.5, 0.5)
      .setScale(PATCH.scale)
      .setFlipX(false),
    inFog,
  );
}

/**
 * An image of the buildings sheet made to draw one piece of a building, the file `pick` picks among
 * its files, at its place about its parent's point: a painting of his whole tile at a face's scale,
 * his hexagon's middle on that point, and any other at its size about its own middle.
 */
function asPiece(
  image: Phaser.GameObjects.Image,
  { files, size, x, y }: BuildingPiece,
  pick: (files: readonly string[]) => string,
  inFog: boolean,
): Phaser.GameObjects.Image {
  const whole = size === 'tile';
  return asDarkened(
    image
      .setTexture(BUILDING_SHEET.key, pick(files))
      .setOrigin(0.5, whole ? PAINTING.middle / PAINTING.height : 0.5)
      .setScale(whole ? FACE_SCALE : size * PAINTED_SCALE)
      .setFlipX(false)
      .setPosition(x, y)
      .setAlpha(1)
      .setVisible(true),
    inFog,
  );
}

/**
 * A container read as a building's pieces, back first, each the file `pick` picks among its own, and
 * the patch under them where `patch` asks for it, darkened on a tile in fog: an image is added where
 * it holds too few, and the ones left over are hidden.
 */
export function asPieces(
  on: Phaser.GameObjects.Container,
  { pieces }: BuildingPaintings,
  patch: boolean,
  pick: (files: readonly string[]) => string,
  inFog: boolean,
): Phaser.GameObjects.Container {
  const under = patch ? 1 : 0;
  const count = under + pieces.length;
  while (on.length < count) on.add(on.scene.add.image(0, 0, BUILDING_SHEET.key));
  (on.list as Phaser.GameObjects.Image[]).forEach((image, at) => {
    if (at >= count) image.setVisible(false);
    else if (at < under) asPatch(image, inFog).setPosition(0, 0).setAlpha(1).setVisible(true);
    else asPiece(image, pieces[at - under], pick, inFog);
  });
  return on;
}

/**
 * The box a mark's paint fills, where it stands: an image's by the pixels he painted and not by its
 * file, and a container's by what it shows.
 */
export function paintedBounds(mark: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle {
  if (mark instanceof Phaser.GameObjects.Container) {
    // A Container's own bounds count the children it hides (docs/PHASER.md).
    const shown = mark.list.filter((child) => (child as Mark).visible).map(paintedBounds);
    return shown.reduce((union, box) => Phaser.Geom.Rectangle.Union(union, box, union));
  }
  const box = (mark as Mark).getBounds();
  if (!(mark instanceof Phaser.GameObjects.Image)) return box;
  const paint = paintIn(mark.frame.name);
  if (paint === undefined) return box;
  const across = box.width / mark.frame.width;
  const down = box.height / mark.frame.height;
  return new Phaser.Geom.Rectangle(
    box.x + paint.x * across,
    box.y + paint.y * down,
    paint.width * across,
    paint.height * down,
  );
}

/** The name of what a building stands as on the tile of that key: its mark, or the container of its pieces. */
export function buildingStandsAs(building: BuildingTypeId, key: string): string {
  const look = buildingLookOf(building);
  switch (look.kind) {
    case 'mark':
      return `building-${key}`;
    case 'painted':
      return `building-pieces-${key}`;
  }
}

/**
 * A building off the map: its mark, or its pieces in their arrangement, a village as the first of
 * his four, the patch among them, their paint centred on the container's point.
 */
export function buildingMark(scene: Phaser.Scene, building: BuildingTypeId): Mark {
  const look = buildingLookOf(building);
  switch (look.kind) {
    case 'mark':
      return asBuilding(scene.add.polygon(0, 0, UNREAD), look, false);
    case 'painted': {
      const pieces = asPieces(
        scene.add.container(0, 0),
        look,
        look.patch,
        ([first]) => first,
        false,
      );
      const { centerX, centerY } = paintedBounds(pieces);
      for (const image of pieces.list as Phaser.GameObjects.Image[]) {
        image.setPosition(image.x - centerX, image.y - centerY);
      }
      return pieces;
    }
  }
}

// The scale is set here and `asPainted` resets it to one: an icon is painted before it wears a feature.
/**
 * An image of the features sheet made to draw a feature on the map: its icon, at the width it
 * stands, darkened on a tile in fog.
 */
export function asFeature(
  icon: Phaser.GameObjects.Image,
  feature: FeatureId,
  inFog: boolean,
): Phaser.GameObjects.Image {
  return asDarkened(
    icon
      .setTexture(FEATURE_SHEET_KEY, featureIconOf(feature))
      .setDisplaySize(ICON_WIDTH, ICON_WIDTH),
    inFog,
  );
}

/** A feature off the map: its icon, bare. */
export function featureMark(scene: Phaser.Scene, feature: FeatureId): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, FEATURE_SHEET_KEY, featureIconOf(feature));
}

/** The disc a feature's icon stands on, with nothing painted on it yet. */
export function featureDisc(scene: Phaser.Scene): Phaser.GameObjects.Arc {
  return scene.add.circle(0, 0, DISC_RADIUS);
}

/** A `featureDisc` made to stand under an icon, with its rim, darkened on a tile in fog. */
export function asFeatureDisc(
  disc: Phaser.GameObjects.Arc,
  inFog: boolean,
): Phaser.GameObjects.Arc {
  const { featureDisc: fill, featureDiscRim: rim } = LOOK;
  return disc
    .setFillStyle(darkened(fill.colour, inFog), fill.strength)
    .setStrokeStyle(DISC_RIM, darkened(rim.colour, inFog), rim.strength);
}

/**
 * One mark a feature lays on its tile's ground: its name, and the way to paint it on an image of the
 * features sheet, darkened on a tile in fog.
 */
export type Lying = {
  readonly name: string;
  paint(image: Phaser.GameObjects.Image, inFog: boolean): Phaser.GameObjects.Image;
};

/**
 * What a feature lays on its tile's ground: copies of its animal, or his pond, or nothing. The pond's pick
 * is salted apart from the face's: the desert has as many paintings as there are ponds, and an unsalted
 * pick pairs each painting with one pond.
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
          paint: (image, inFog) =>
            asDarkened(image, inFog)
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
          paint: (image, inFog) =>
            asDarkened(image, inFog)
              .setTexture(FEATURE_SHEET_KEY, PONDS[pickOf(q * 5 + 1, r * 9 + 7, PONDS.length)])
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

/**
 * A polygon made to draw an improvement: its placeholder mark, in the stone everything worked is,
 * darkened on a tile in fog.
 */
export function asImprovement(
  mark: Phaser.GameObjects.Polygon,
  improvement: ImprovementId,
  inFog: boolean,
): Phaser.GameObjects.Polygon {
  return mark
    .setTo(corners(improvementMarkOf(improvement)))
    .setFillStyle(darkened(LOOK.built, inFog))
    .setStrokeStyle(2, darkened(LOOK.mapOutline, inFog));
}

export function improvementMark(
  scene: Phaser.Scene,
  improvement: ImprovementId,
): Phaser.GameObjects.Polygon {
  return asImprovement(scene.add.polygon(0, 0, UNREAD), improvement, false);
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

/**
 * A container read as a unit's mark, over a hull while it is embarked, in its faction's colour,
 * darkened on a tile in fog.
 */
export function asUnit(
  mark: Phaser.GameObjects.Container,
  type: string,
  faction: Faction,
  embarked: boolean,
  inFog: boolean,
): Phaser.GameObjects.Container {
  return asShapes(mark, type, embarked, (part) => {
    part
      .setFillStyle(darkened(FACTION_COLOURS[faction], inFog))
      .setStrokeStyle(2, darkened(LOOK.mapOutline, inFog));
  });
}

export function unitMark(
  scene: Phaser.Scene,
  type: string,
  faction: Faction,
  embarked: boolean,
): Phaser.GameObjects.Container {
  return asUnit(scene.add.container(0, 0), type, faction, embarked, false);
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

/** The mark of an assigned tile: a diamond in the colour population is known by. */
export function assignedMark(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  return diamond(scene, ASSIGNED_GLYPH, LOOK.population).setName('assigned');
}

/** A rim round a pill: how wide it is, and its colour at its strength. */
type Rim = Wash & { readonly width: number };

/**
 * A pill about its graphics' own point, `width` wide and as round at the ends as it is tall, filled
 * and rimmed as given; drawn again only where its width moved.
 */
function drawPill(
  drawn: { readonly pill: Phaser.GameObjects.Graphics; width: number | undefined },
  width: number,
  height: number,
  fill: Wash,
  rim: Rim,
): void {
  if (width === drawn.width) return;
  drawn.width = width;
  const box = { x: -width / 2, y: -height / 2 };
  const radius = height / 2;
  drawn.pill
    .clear()
    .fillStyle(fill.colour, fill.strength)
    .fillRoundedRect(box.x, box.y, width, height, radius)
    .lineStyle(rim.width, rim.colour, rim.strength)
    .strokeRoundedRect(box.x, box.y, width, height, radius);
}

/**
 * What a claim asks for: its number and its resource's own diamond on their plate, in one container,
 * and the width the plate is drawn at, none until it is.
 */
type ThresholdMark = {
  readonly root: Phaser.GameObjects.Container;
  readonly pill: Phaser.GameObjects.Graphics;
  readonly number: Phaser.GameObjects.Text;
  readonly glyph: Phaser.GameObjects.Rectangle;
  width: number | undefined;
};

export function thresholdMark(scene: Phaser.Scene): ThresholdMark {
  const pill = scene.add.graphics();
  const number = addText(scene, 0, 0, '', THRESHOLD_STYLE).setOrigin(0.5, 0.5);
  const glyph = diamond(scene, THRESHOLD_GLYPH, 0);
  const root = scene.add
    .container(0, 0, [pill, number, glyph])
    .setName('threshold')
    .setVisible(false);
  return { root, pill, number, glyph, width: undefined };
}

/**
 * What a claim asks for standing on its tile: the threshold as a minus and its number, its
 * resource's own diamond beside it, the pair centred on the tile's middle on a plate drawn as the
 * feature disc is, widening about its middle with the number.
 */
export function showThreshold(mark: ThresholdMark, coord: TileCoords, cost: Cost): void {
  const { root, number, glyph } = mark;
  number.setText(text('threshold.culture', { culture: cost.amount }));
  glyph.setFillStyle(LOOK.reading[cost.resource]);
  const own = ownBoxOf(number).width;
  const width = own + THRESHOLD_GAP + THRESHOLD_GLYPH;
  number.setX((own - width) / 2);
  glyph.setX((width - THRESHOLD_GLYPH) / 2);
  drawPill(mark, width + 2 * THRESHOLD_PLATE_PAD, THRESHOLD_PLATE_HEIGHT, LOOK.featureDisc, {
    ...LOOK.featureDiscRim,
    width: DISC_RIM,
  });
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

  drawPill(
    badge,
    Math.max(BADGE_HEIGHT, ownBoxOf(number).width + 2 * BADGE_PAD),
    BADGE_HEIGHT,
    { colour: CITY_COLOURS[whose], strength: 1 },
    { colour: LOOK.mapOutline, strength: 1, width: 1.5 },
  );
}

/** The scrim over a held tile with nobody on it and all it carries. */
export function cityDim(scene: Phaser.Scene): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, mapHexagon(TILE_SIZE), LOOK.mapOutline, LOOK.mapDim.strength)
    .setName('city-dim');
}

/** Where a corner of the tile lattice stands on the map's own surface. */
export function cornerAt({ x, y }: Corner): Phaser.Math.Vector2 {
  const middle = positionOf(CENTRE);
  return new Phaser.Math.Vector2(
    middle.x + x * (Math.sqrt(3) / 2) * TILE_SIZE,
    middle.y + ((y * TILE_SIZE) / 2) * SQUASH,
  );
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
