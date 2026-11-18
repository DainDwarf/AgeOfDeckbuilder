import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import {
  CENTRE,
  type Corner,
  cornerKey,
  cornersOf,
  discAround,
  edgesAlong,
  type FeatureId,
  type ImprovementId,
  type River,
  type Terrain,
  type Tile,
  type TileCoords,
} from '../rules/map';
import { cardArtOf } from './art-box';
import type { Point } from './border-loops';
import { artShapeOf, BODY, CARD_WIDTH, FRONTS } from './card-frames';
import {
  type ArtPicture,
  artPictureOf,
  bareTerrain,
  buildingFace,
  citySectionBuildings,
  type FrontWindow,
  featureFace,
  freshUnit,
  type InspectedTile,
  riverFace,
  terrainFace,
  unitFace,
} from './face';
import { css, LOOK } from './look';
import {
  armsAlong,
  BUILDING_PATCH,
  BUILDING_SHEET,
  buildingPaintingsOf,
  cornerOnLattice,
  DISC_RADIUS,
  type DiscLook,
  type DiscPicture,
  type Ditches,
  discWornOn,
  ditchLaying,
  FACE_SCALE,
  FEATURE_DISC,
  FEATURE_SHEET_KEY,
  facePaintingOn,
  featureDressOf,
  featureIconOf,
  featureToldOn,
  HERD_WIDTH,
  herdOn,
  ICON_WIDTH,
  IMPROVEMENT_DISC,
  latticeAt,
  liesOf,
  PAINTING,
  PONDS,
  paintDisc,
  paintIn,
  paintingOn,
  pieceLaying,
  pondOn,
  RIVER_SHEET,
  type RiverLaying,
  ROW_RISE,
  riverPieceAt,
  riverPieceLaying,
  rowOf,
  TILE_SIZE,
  UNIT_SHEET,
  unitPaintingOf,
} from './marks';
import {
  blankCanvas,
  drawSheets,
  type InSheet,
  type Made,
  mipmappedSide,
  type PaintingIn,
  paintUnder,
  type Sheet,
} from './sheet';

export const ART_SHEET_KEY = 'art';

const WINDOWS = Object.keys(FRONTS) as FrontWindow[];

/**
 * A tile's width in an art box, as a share of its window's wider measure, and a lone icon's longer
 * side, as a share of its smaller measure.
 */
const TILE_SHARE = 0.9;
const ICON_SHARE = 0.75;

/**
 * How far above each window's middle the middle of what is painted of a building or an improvement
 * stands, in units of a card wherever it stands but large.
 */
const PAINTED_RISE: Readonly<Record<FrontWindow, number>> = { oval: 8, arched: 0 };

/**
 * How far under the window's middle the middle tile's middle stands under an improvement the map
 * tells by ditches, in the same units.
 */
const DITCHES_DROP = 16;

/** How many rings of tiles lie round the middle tile of an art box's ground. */
const GROUND_RINGS = 2;

/** How much larger than the map lays it what a feature lays stands in its art box. */
const DECOR_GROWN = 1.5;

/** His long pond, the one an oasis's art box holds. */
const LONG_POND = PONDS[1];

/** The middle tile's middle, about which an art box's ground is painted. */
const CENTRE_MIDDLE: Point = { x: 0, y: 0 };

/** How many of a front's pixels make a unit of a card wherever it stands but large. */
const PIXELS = BODY.width / CARD_WIDTH;

/** How many of a front's pixels one of the map's units spans in that window's art box. */
export function artScaleOf(window: FrontWindow): number {
  const { width, height } = FRONTS[window].window;
  return (TILE_SHARE * Math.max(width, height)) / (Math.sqrt(3) * TILE_SIZE);
}

/** What stands on a picture's ground. */
type Holds = ArtPicture['holds'];

/** What names what stands on a picture's ground in its frame's name. */
function thingKey(holds: Holds): string {
  switch (holds.kind) {
    case 'inspected':
      return 'inspected';
    case 'unit':
      return `unit:${holds.type}`;
    case 'building':
      return `building:${holds.building}`;
    case 'improvement':
      return `improvement:${holds.improvement}`;
    case 'icon':
      return holds.file;
    case 'tile':
      return holds.feature === undefined ? 'tile' : `tile:${holds.feature}`;
    case 'river':
      return 'river';
    case 'nothing':
      return 'nothing';
  }
}

/**
 * The frame of the art sheet a front's art box shows: its picture, or where it holds none its shape,
 * white for its kind's colour to tint.
 */
export function artFrameOf(picture: ArtPicture | undefined, window: FrontWindow): string {
  if (picture === undefined) return `pale-${window}`;
  return `${picture.window}-${picture.ground}-${thingKey(picture.holds)}`;
}

/** A painting of a sheet drawn with its top-left corner at a point, at a scale. */
function drawnAt(
  on: CanvasRenderingContext2D,
  from: InSheet,
  x: number,
  y: number,
  scale: number,
): void {
  const { canvas, x: cutX, y: cutY, width, height } = from;
  on.drawImage(canvas, cutX, cutY, width, height, x, y, width * scale, height * scale);
}

/** A painting of a sheet drawn about the point the context stands at, at a scale. */
function drawnAbout(on: CanvasRenderingContext2D, from: InSheet, scale: number): void {
  drawnAt(on, from, (-from.width * scale) / 2, (-from.height * scale) / 2, scale);
}

/** A painting of the river sheet drawn as it is laid, about the point the context stands at. */
function drawnLaid(
  on: CanvasRenderingContext2D,
  from: InSheet,
  { at, origin, scale, rotation }: RiverLaying,
): void {
  on.save();
  on.translate(at.x, at.y);
  on.rotate(rotation);
  on.scale(scale.x, scale.y);
  drawnAt(on, from, -origin.x * from.width, -origin.y * from.height, 1);
  on.restore();
}

/** What the middle tile of a picture's ground carries: the building, the improvements or the feature on it. */
function carriedOf(holds: Holds): Carried {
  switch (holds.kind) {
    case 'inspected':
      return {
        building: undefined,
        improvements: holds.tile.improvements,
        feature: holds.tile.feature,
      };
    case 'building':
      return { building: holds.building, improvements: [], feature: undefined };
    case 'improvement':
      return { building: undefined, improvements: [holds.improvement], feature: undefined };
    case 'tile':
      return { building: undefined, improvements: [], feature: holds.feature };
    case 'unit':
    case 'icon':
    case 'river':
    case 'nothing':
      return { building: undefined, improvements: [], feature: undefined };
  }
}

/** What a tile of an art box's ground carries beside its terrain. */
type Carried = Pick<Tile, 'building' | 'improvements' | 'feature'>;

/** Which tile of the map a picture's middle tile is: a tile inspected's own, any other the map's centre. */
function middleTileOf(holds: Holds): TileCoords {
  switch (holds.kind) {
    case 'inspected':
      return { q: holds.tile.q, r: holds.tile.r };
    case 'unit':
    case 'building':
    case 'improvement':
    case 'icon':
    case 'tile':
    case 'river':
    case 'nothing':
      return CENTRE;
  }
}

/** Where a point of the map's lattice stands about the middle of the tile at `at`. */
function aboutTile({ x, y }: Point, at: TileCoords): Point {
  const middle = latticeAt(at);
  return { x: x - middle.x, y: y - middle.y };
}

/**
 * An art box's ground about the middle tile's middle, in the map's units: the terrain on that tile,
 * the one at `at`, and on the rings round it, back row first, each wearing the painting its place on
 * the map picks, the middle tile the one the map gives a tile carrying what it carries.
 */
function paintGround(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  terrain: Terrain,
  carried: Carried,
  at: TileCoords,
): void {
  const tiles = discAround(at, GROUND_RINGS).sort((one, other) => one.r - other.r);
  for (const coord of tiles) {
    const middle = coord.q === at.q && coord.r === at.r;
    const tile = middle ? { terrain, ...carried } : { terrain, improvements: [] };
    const { sheet, painting } = facePaintingOn(tile, coord);
    const from = paintingIn(sheet, painting);
    const { x, y } = aboutTile(latticeAt(coord), at);
    drawnAt(
      on,
      from,
      x - (FACE_SCALE * from.width) / 2,
      y - FACE_SCALE * PAINTING.middle,
      FACE_SCALE,
    );
  }
}

/** A unit kind's painting about the point the context stands at, in the map's units: lined, in a halo of the civilization's colour. */
function paintUnit(on: CanvasRenderingContext2D, paintingIn: PaintingIn, type: string): void {
  const { painting, halo, scale } = unitPaintingOf(type);
  const glow = paintingIn(UNIT_SHEET.key, halo);
  const tinted = blankCanvas(0, 0);
  paintUnder(tinted, glow, { colour: LOOK.civilization, strength: 1 }, 'multiply');
  drawnAbout(on, { ...glow, canvas: tinted.canvas, x: 0, y: 0 }, scale);
  drawnAbout(on, paintingIn(UNIT_SHEET.key, painting), scale);
}

/** The river along the upper edges of the ground's middle row, from one side of the ground to the other. */
function groundRiver(): River {
  const above = new Map<string, Corner>();
  for (let q = -GROUND_RINGS; q <= GROUND_RINGS; q++) {
    for (const corner of cornersOf({ q, r: CENTRE.r })) {
      if (corner.y < 0) above.set(cornerKey(corner), corner);
    }
  }
  return [...above.values()].sort((one, other) => one.x - other.x);
}

/**
 * The river the River's face holds, about the ground's middle tile: from its first corner a step down
 * and right, then one straight down, in turn, twelve edges.
 */
function faceRiver(): River {
  const course: Corner[] = [{ x: -4, y: -8 }];
  for (let edge = 0; edge < 12; edge++) {
    const { x, y } = course[edge];
    course.push(edge % 2 === 0 ? { x: x + 1, y: y + 1 } : { x, y: y + 2 });
  }
  return course;
}

/** The point of the corner lattice the River's face's window stands its middle on. */
const FACE_RIVER_MIDDLE: Corner = { x: -0.5, y: 0.5 };

/** A painting of the river sheet laid as the map lays it, moved to lie about the middle of the tile at `at`. */
function laidAbout(laying: RiverLaying, at: TileCoords): RiverLaying {
  return { ...laying, at: aboutTile(laying.at, at) };
}

/**
 * The runs of rivers about the middle of the tile at `at`, in the map's units: each corner wearing
 * his piece the map picks there.
 */
function paintRivers(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  runs: readonly River[],
  at: TileCoords,
): void {
  for (const { corner, arms } of armsAlong(runs).values()) {
    const piece = paintingIn(RIVER_SHEET.key, riverPieceAt(arms, corner));
    drawnLaid(on, piece, laidAbout(riverPieceLaying(corner, { x: 0, y: 0 }), at));
  }
}

/**
 * The ditches an improvement runs from the runs of rivers into the tile at `at`, about its middle, in
 * the map's units: each laid as the map lays it there.
 */
function paintDitches(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  ditches: Ditches,
  runs: readonly River[],
  at: TileCoords,
): void {
  const ditch = paintingIn(RIVER_SHEET.key, ditches.file);
  for (const edge of edgesAlong(runs, at)) {
    drawnLaid(on, ditch, laidAbout(ditchLaying(ditches, at, edge), at));
  }
}

/** A box, from its top-left corner. */
type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * One painting laid about its tile's middle, in the map's units: what it draws, its top-left corner,
 * its scale, whether it is mirrored across, and the box his paint fills.
 */
type Laid = {
  readonly from: InSheet;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly flipped: boolean;
  readonly painted: Box;
};

/** A laid painting drawn as it lies, mirrored about its own middle where it is flipped. */
function drawLaid(on: CanvasRenderingContext2D, { from, x, y, scale, flipped }: Laid): void {
  if (!flipped) {
    drawnAt(on, from, x, y, scale);
    return;
  }
  on.save();
  on.translate(x + from.width * scale, y);
  on.scale(-1, 1);
  drawnAt(on, from, 0, 0, scale);
  on.restore();
}

/**
 * A painting laid at a scale, the middle of its width and the share `down` of its height on a point,
 * mirrored across where `flipped` says.
 */
function laidAt(
  from: InSheet,
  frame: string,
  at: { readonly x: number; readonly y: number },
  scale: number,
  down: number,
  flipped = false,
): Laid {
  const x = at.x - (from.width * scale) / 2;
  const y = at.y - from.height * scale * down;
  const paint = paintIn(frame) ?? { x: 0, y: 0, width: from.width, height: from.height };
  const across = flipped ? from.width - paint.x - paint.width : paint.x;
  return {
    from,
    x,
    y,
    scale,
    flipped,
    painted: {
      x: x + across * scale,
      y: y + paint.y * scale,
      width: paint.width * scale,
      height: paint.height * scale,
    },
  };
}

/**
 * A building's paintings as the map lays them on the map's centre tile: its patch under them where
 * it lies on one, then its pieces back first.
 */
function laidPieces(paintingIn: PaintingIn, building: string): Laid[] {
  const { patch, pieces } = buildingPaintingsOf(building);
  const { frame, scale } = BUILDING_PATCH;
  const middle = { x: 0, y: 0 };
  const under = patch
    ? [laidAt(paintingIn(BUILDING_SHEET.key, frame), frame, middle, scale, 0.5)]
    : [];
  return [
    ...under,
    ...pieces.map(({ files, size, x, y }) => {
      const file = paintingOn(files, CENTRE);
      const laying = pieceLaying(size);
      return laidAt(
        paintingIn(BUILDING_SHEET.key, file),
        file,
        { x, y },
        laying.scale,
        laying.down,
      );
    }),
  ];
}

/** An improvement's painting as the map lays it alone on a tile, and nothing for one told by ditches. */
function laidImprovement(paintingIn: PaintingIn, improvement: ImprovementId): Laid[] {
  const lies = liesOf(improvement);
  switch (lies.kind) {
    case 'painting': {
      const { size, x, y } = lies.alone;
      const { scale, down } = pieceLaying(size);
      return [
        laidAt(paintingIn(FEATURE_SHEET_KEY, lies.painting), lies.painting, { x, y }, scale, down),
      ];
    }
    case 'ditches':
      return [];
  }
}

/**
 * What a feature lays on the ground of the tile at `at` as the map lays it there: his copies of its
 * animal, the pond handed, or nothing.
 */
function laidDecor(
  paintingIn: PaintingIn,
  feature: FeatureId,
  at: TileCoords,
  pond: string,
): Laid[] {
  const dress = featureDressOf(feature);
  switch (dress.kind) {
    case 'herd': {
      const icon = featureIconOf(feature);
      const from = paintingIn(FEATURE_SHEET_KEY, icon);
      return herdOn(at).map(({ x, y, flipped }) =>
        laidAt(from, icon, { x, y }, HERD_WIDTH / from.width, 0.5, flipped),
      );
    }
    case 'pond':
      return [laidAt(paintingIn(FEATURE_SHEET_KEY, pond), pond, CENTRE_MIDDLE, FACE_SCALE, 0.5)];
    case 'tint':
      return [];
  }
}

/**
 * What a tile inspected lays on its ground as the map lays it on a tile carrying no building: its
 * feature's decor where no improvement tells the feature, then each improvement's painting.
 */
function laidOnInspected(paintingIn: PaintingIn, { tile }: InspectedTile): Laid[] {
  const told = featureToldOn(tile);
  return [
    ...(told === undefined ? [] : laidDecor(paintingIn, told, tile, pondOn(tile))),
    ...tile.improvements.flatMap((improvement) => laidImprovement(paintingIn, improvement)),
  ];
}

/** Laid paintings grown by `by` about the middle of what they paint, that middle moved onto the tile's. */
function grownOnTile(laid: readonly Laid[], by: number): Laid[] {
  const middle = paintedMiddle(laid);
  const moved = (x: number, y: number): Point => ({
    x: (x - middle.x) * by,
    y: (y - middle.y) * by,
  });
  return laid.map((one) => {
    const corner = moved(one.x, one.y);
    const painted = moved(one.painted.x, one.painted.y);
    return {
      ...one,
      ...corner,
      scale: one.scale * by,
      painted: { ...painted, width: one.painted.width * by, height: one.painted.height * by },
    };
  });
}

/**
 * The paintings laid on the middle tile: a building's and an improvement's, which are centred on what
 * is painted, what a feature lays, centred on the tile at `DECOR_GROWN` its size, his long pond in
 * place of the one the map picks, and what a tile inspected lays, where the map lays it.
 */
function laidOf(paintingIn: PaintingIn, holds: Holds): Laid[] {
  switch (holds.kind) {
    case 'inspected':
      return laidOnInspected(paintingIn, holds);
    case 'building':
      return laidPieces(paintingIn, holds.building);
    case 'improvement':
      return laidImprovement(paintingIn, holds.improvement);
    case 'tile':
      return holds.feature === undefined
        ? []
        : grownOnTile(laidDecor(paintingIn, holds.feature, CENTRE, LONG_POND), DECOR_GROWN);
    case 'unit':
    case 'icon':
    case 'river':
    case 'nothing':
      return [];
  }
}

/** The middle of the box what is painted fills, laid as the pieces are. */
function paintedMiddle(laid: readonly Laid[]): Point {
  const left = Math.min(...laid.map(({ painted }) => painted.x));
  const top = Math.min(...laid.map(({ painted }) => painted.y));
  const right = Math.max(...laid.map(({ painted }) => painted.x + painted.width));
  const bottom = Math.max(...laid.map(({ painted }) => painted.y + painted.height));
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

/**
 * Where the middle tile's middle stands in an art box, about the box its glass lies in: under what is
 * painted where that is centred, dropped under an improvement told by ditches, off it as the River's
 * face's river asks, else on its middle.
 */
function groundMiddleOf(
  picture: ArtPicture,
  middle: Point,
  scale: number,
  laid: readonly Laid[],
): Point {
  const centred = (): Point => {
    const painted = paintedMiddle(laid);
    const rise = PAINTED_RISE[picture.window] * PIXELS;
    return { x: middle.x - painted.x * scale, y: middle.y - rise - painted.y * scale };
  };
  const { holds } = picture;
  switch (holds.kind) {
    case 'unit':
    case 'icon':
    case 'tile':
    case 'inspected':
    case 'nothing':
      return middle;
    case 'building':
      return centred();
    case 'river': {
      const off = cornerOnLattice(FACE_RIVER_MIDDLE);
      return { x: middle.x - off.x * scale, y: middle.y - off.y * scale };
    }
    case 'improvement':
      switch (liesOf(holds.improvement).kind) {
        case 'painting':
          return centred();
        case 'ditches':
          return { x: middle.x, y: middle.y + DITCHES_DROP * PIXELS };
      }
  }
}

/**
 * A disc of a tile's row in its look and what it wears, `x` across from the middle tile's middle, as
 * the map draws them, in the map's units.
 */
function paintOnRow(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  look: DiscLook,
  { icon, width }: DiscPicture,
  x: number,
): void {
  on.beginPath();
  on.arc(x, -ROW_RISE, DISC_RADIUS, 0, 2 * Math.PI);
  paintDisc(on, look);
  const from = paintingIn(FEATURE_SHEET_KEY, icon);
  on.save();
  on.translate(x, -ROW_RISE);
  drawnAbout(on, from, width / from.width);
  on.restore();
}

/** What a feature's disc wears in its tile's row. */
function featureWorn(feature: FeatureId): DiscPicture {
  return { icon: featureIconOf(feature), width: ICON_WIDTH };
}

/** The discs of a tile's row as the map draws them: its feature's where no improvement tells it, then each improvement's. */
function paintRow(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  tile: InspectedTile['tile'],
): void {
  const row = rowOf(tile, 0);
  const told = featureToldOn(tile);
  if (told !== undefined) paintOnRow(on, paintingIn, FEATURE_DISC, featureWorn(told), row.feature);
  tile.improvements.forEach((improvement, at) => {
    const worn = discWornOn(improvement, tile.feature);
    paintOnRow(on, paintingIn, IMPROVEMENT_DISC, worn, row.improvements[at]);
  });
}

/**
 * What stands on an art box's ground painted over it, in the front's pixels: a unit or an icon as wide
 * as `ICON_SHARE` says on the window's middle, and anything else about the middle tile's.
 */
function paintThing(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  holds: Holds,
  at: {
    readonly window: { readonly width: number; readonly height: number };
    readonly middle: Point;
    readonly ground: Point;
    readonly scale: number;
    readonly laid: readonly Laid[];
  },
): void {
  const { window, middle, ground, scale, laid } = at;
  switch (holds.kind) {
    case 'unit':
      on.setTransform(scale, 0, 0, scale, middle.x, middle.y);
      paintUnit(on, paintingIn, holds.type);
      return;
    case 'building':
    case 'improvement': {
      on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
      for (const one of laid) drawLaid(on, one);
      const lies = holds.kind === 'improvement' ? liesOf(holds.improvement) : undefined;
      if (lies?.kind === 'ditches') {
        const runs = [groundRiver()];
        paintRivers(on, paintingIn, runs, CENTRE);
        paintDitches(on, paintingIn, lies, runs, CENTRE);
      }
      return;
    }
    case 'tile':
      on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
      for (const one of laid) drawLaid(on, one);
      if (holds.feature !== undefined) {
        paintOnRow(on, paintingIn, FEATURE_DISC, featureWorn(holds.feature), 0);
      }
      return;
    case 'inspected': {
      const { tile, rivers, discs } = holds;
      on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
      paintRivers(on, paintingIn, rivers, tile);
      for (const improvement of tile.improvements) {
        const lies = liesOf(improvement);
        if (lies.kind === 'ditches') paintDitches(on, paintingIn, lies, rivers, tile);
      }
      for (const one of laid) drawLaid(on, one);
      if (discs) paintRow(on, paintingIn, tile);
      return;
    }
    case 'river':
      on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
      paintRivers(on, paintingIn, [faceRiver()], CENTRE);
      return;
    case 'icon': {
      const from = paintingIn(ART_SHEET_KEY, holds.file);
      const side = ICON_SHARE * Math.min(window.width, window.height);
      on.setTransform(1, 0, 0, 1, middle.x, middle.y);
      drawnAbout(on, from, side / Math.max(from.width, from.height));
      return;
    }
    case 'nothing':
      return;
  }
  const unlisted: never = holds;
  throw new Error(`nothing stands in an art box as ${JSON.stringify(unlisted)}`);
}

/** Where the shape of a window's art box lies, white on nothing, the size of the box its glass lies in. */
type ShapeOf = (window: FrontWindow, paintingIn: PaintingIn) => InSheet;

/** Whether an art box holds its middle tile at its own light, its ground dimmed round it alone. */
function litTile(holds: Holds): boolean {
  switch (holds.kind) {
    case 'tile':
    case 'inspected':
      return true;
    case 'unit':
    case 'building':
    case 'improvement':
    case 'icon':
    case 'river':
    case 'nothing':
      return false;
  }
}

/**
 * An art box's ground dimmed, in the front's pixels, but for the middle tile's hexagon where it is
 * lit, the middle tile's middle at `ground` and the map's units `scale` of the front's pixels.
 */
function dimGround(
  on: CanvasRenderingContext2D,
  glass: { readonly width: number; readonly height: number },
  lit: boolean,
  ground: Point,
  scale: number,
): void {
  on.setTransform(1, 0, 0, 1, 0, 0);
  on.globalCompositeOperation = 'multiply';
  on.fillStyle = css(LOOK.cardArtGround);
  on.beginPath();
  on.rect(0, 0, glass.width, glass.height);
  if (lit) {
    on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
    const [first, ...rest] = cornersOf(CENTRE).map(cornerOnLattice);
    on.moveTo(first.x, first.y);
    for (const { x, y } of rest) on.lineTo(x, y);
    on.closePath();
    on.setTransform(1, 0, 0, 1, 0, 0);
  }
  on.fill('evenodd');
  on.globalCompositeOperation = 'source-over';
}

/**
 * A picture painted as its art box holds it, in the front's pixels: the ground dimmed under what
 * stands on it, a tile of its ground as wide as `TILE_SHARE` says, all of it kept to the box's shape.
 */
function pictureMade(picture: ArtPicture, shapeOf: ShapeOf): Made {
  const { window, glass } = FRONTS[picture.window];
  return {
    frame: artFrameOf(picture, picture.window),
    width: glass.width,
    height: glass.height,
    paint: (context, paintingIn) => {
      const on = blankCanvas(glass.width, glass.height);
      const middle = {
        x: window.x + window.width / 2 - glass.x,
        y: window.y + window.height / 2 - glass.y,
      };
      const scale = artScaleOf(picture.window);
      const { holds } = picture;
      const laid = laidOf(paintingIn, holds);
      const ground = groundMiddleOf(picture, middle, scale, laid);
      on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
      paintGround(on, paintingIn, picture.ground, carriedOf(holds), middleTileOf(holds));
      dimGround(on, glass, litTile(holds), ground, scale);
      paintThing(on, paintingIn, holds, { window, middle, ground, scale, laid });
      on.setTransform(1, 0, 0, 1, 0, 0);
      on.globalCompositeOperation = 'destination-in';
      drawnAt(on, shapeOf(picture.window, paintingIn), 0, 0, 1);
      context.drawImage(on.canvas, 0, 0);
    },
  };
}

/** The shape of a window's art box, white, for a window holding no painting to wear in its kind's colour. */
function paleMade(window: FrontWindow, shapeOf: ShapeOf): Made {
  const { glass } = FRONTS[window];
  return {
    frame: artFrameOf(undefined, window),
    width: glass.width,
    height: glass.height,
    paint: (context, paintingIn) => drawnAt(context, shapeOf(window, paintingIn), 0, 0, 1),
  };
}

/**
 * The sheet every picture a face's art box holds is painted into: a card's under each city section's
 * building and under none, a unit's ashore and embarked, and any other thing's, with the icons they
 * draw and each window's shape for a box holding none.
 */
export function artSheet(catalogue: Catalogue): Sheet {
  const shapes = new Map<FrontWindow, CanvasRenderingContext2D>();
  const shapeOf: ShapeOf = (window, paintingIn) => {
    const shape = shapes.get(window) ?? artShapeOf(window, paintingIn);
    shapes.set(window, shape);
    const { canvas } = shape;
    return { canvas, x: 0, y: 0, width: canvas.width, height: canvas.height };
  };
  const pictures = new Map<string, ArtPicture>();
  const add = (picture: ArtPicture | undefined): void => {
    if (picture !== undefined) pictures.set(artFrameOf(picture, picture.window), picture);
  };
  for (const id of Object.keys(catalogue.cards)) {
    for (const city of [...citySectionBuildings(catalogue), undefined]) {
      add(artPictureOf(catalogue, id, cardArtOf(id), city));
    }
  }
  for (const id of Object.keys(catalogue.buildings)) add(buildingFace(catalogue, id).art);
  for (const id of Object.keys(catalogue.terrains)) {
    add(terrainFace(bareTerrain(catalogue, id)).art);
  }
  for (const id of Object.keys(catalogue.features)) add(featureFace(catalogue, id).art);
  add(riverFace().art);
  for (const id of Object.keys(catalogue.units)) {
    for (const embarked of [false, true]) {
      add(unitFace(catalogue, { ...freshUnit(catalogue, id, 'player'), embarked }).art);
    }
  }
  const painted = [...pictures.values()];
  return {
    key: ART_SHEET_KEY,
    files: [
      ...new Set(painted.flatMap(({ holds }) => (holds.kind === 'icon' ? [holds.file] : []))),
    ],
    made: [
      ...WINDOWS.map((window) => paleMade(window, shapeOf)),
      ...WINDOWS.flatMap((window) =>
        painted
          .filter((picture) => picture.window === window)
          .map((picture) => pictureMade(picture, shapeOf)),
      ),
    ],
    side: 4096,
    rowGap: 8,
  };
}

/** Whether the art sheet holds a picture of what stands on it; a tile inspected is painted as it is read. */
function inArtSheet(holds: Holds): boolean {
  switch (holds.kind) {
    case 'inspected':
      return false;
    case 'unit':
    case 'building':
    case 'improvement':
    case 'icon':
    case 'tile':
    case 'river':
    case 'nothing':
      return true;
  }
}

/** The texture a front's art box shows its picture from, and the frame of it. */
export type ArtWorn = { readonly key: string; readonly frame: string };

/**
 * What a front's art box shows: the art sheet's frame of its picture, or a tile inspected painted
 * afresh into a texture of its own under `own`, which the caller lets go; what `own` held is let go.
 */
export function artWorn(
  textures: Phaser.Textures.TextureManager,
  picture: ArtPicture | undefined,
  window: FrontWindow,
  own: string,
): ArtWorn {
  if (textures.exists(own)) textures.remove(own);
  if (picture === undefined || inArtSheet(picture.holds)) {
    return { key: ART_SHEET_KEY, frame: artFrameOf(picture, window) };
  }
  const made = pictureMade(picture, (shaped, paintingIn) =>
    paintingIn(ART_SHEET_KEY, artFrameOf(undefined, shaped)),
  );
  const side = mipmappedSide(Math.max(made.width, made.height));
  drawSheets(textures, [{ key: own, files: [], made: [made], side }]);
  return { key: own, frame: made.frame };
}
