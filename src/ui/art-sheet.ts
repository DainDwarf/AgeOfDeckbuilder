import type { Catalogue } from '../rules/catalogue';
import { CENTRE, discAround, type Terrain } from '../rules/map';
import { type ArtThing, cardArtOf } from './art-box';
import { artShapeOf, BODY, CARD_WIDTH, FRONTS } from './card-frames';
import { type ArtPicture, artPictureOf, citySectionBuildings, type FrontWindow } from './face';
import { css, LOOK } from './look';
import {
  BUILDING_PATCH,
  BUILDING_SHEET,
  buildingPaintingsOf,
  FACE_SCALE,
  facePaintingOn,
  latticeAt,
  PAINTING,
  paintIn,
  paintingOn,
  pieceLaying,
  TILE_SIZE,
  UNIT_SHEET,
  unitPaintingOf,
} from './marks';
import {
  blankCanvas,
  type InSheet,
  type Made,
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
 * How far above the oval window's middle the middle of the tile a building stands on stands, in units
 * of a card wherever it stands but large.
 */
const BUILDING_RISE = 5;

/** How many rings of tiles lie round the middle tile of an art box's ground. */
const GROUND_RINGS = 2;

/** How many of a front's pixels make a unit of a card wherever it stands but large. */
const PIXELS = BODY.width / CARD_WIDTH;

/** What names what stands on a picture's ground in its frame's name. */
function thingKey(holds: ArtThing): string {
  switch (holds.kind) {
    case 'unit':
      return `unit:${holds.type}`;
    case 'building':
      return `building:${holds.building}`;
    case 'icon':
      return holds.file;
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

/**
 * An art box's ground about the middle tile's middle, in the map's units: the terrain on that tile
 * and on the rings round it, back row first, each wearing the painting its place on the map picks,
 * the middle tile his clearing where a building stands on it and he painted one.
 */
function paintGround(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  terrain: Terrain,
  building: string | undefined,
): void {
  const tiles = discAround(CENTRE, GROUND_RINGS).sort((one, other) => one.r - other.r);
  for (const coord of tiles) {
    const middle = coord.q === CENTRE.q && coord.r === CENTRE.r;
    const tile = { terrain, building: middle ? building : undefined, improvements: [] };
    const { sheet, painting } = facePaintingOn(tile, coord);
    const from = paintingIn(sheet, painting);
    const { x, y } = latticeAt(coord);
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

/** A box, from its top-left corner. */
type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * One painting of a building laid about its tile's middle, in the map's units: what it draws, its
 * top-left corner, its scale, and the box his paint fills.
 */
type Laid = {
  readonly from: InSheet;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly painted: Box;
};

/** A painting laid at a scale, the middle of its width and the share `down` of its height on a point. */
function laidAt(
  from: InSheet,
  frame: string,
  at: { readonly x: number; readonly y: number },
  scale: number,
  down: number,
): Laid {
  const x = at.x - (from.width * scale) / 2;
  const y = at.y - from.height * scale * down;
  const paint = paintIn(frame) ?? { x: 0, y: 0, width: from.width, height: from.height };
  return {
    from,
    x,
    y,
    scale,
    painted: {
      x: x + paint.x * scale,
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

/** The middle of the box what is painted fills, laid as the pieces are. */
function paintedMiddle(laid: readonly Laid[]): { x: number; y: number } {
  const left = Math.min(...laid.map(({ painted }) => painted.x));
  const top = Math.min(...laid.map(({ painted }) => painted.y));
  const right = Math.max(...laid.map(({ painted }) => painted.x + painted.width));
  const bottom = Math.max(...laid.map(({ painted }) => painted.y + painted.height));
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

/**
 * Where the middle tile's middle stands in an art box, about the box its glass lies in: under a
 * building in the oval window raised over the window's middle, under one in the arched window where
 * what is painted is centred on it, and on it under anything else.
 */
function groundMiddleOf(
  picture: ArtPicture,
  middle: { x: number; y: number },
  scale: number,
  laid: readonly Laid[],
): { x: number; y: number } {
  switch (picture.holds.kind) {
    case 'unit':
    case 'icon':
      return middle;
    case 'building':
      switch (picture.window) {
        case 'oval':
          return { x: middle.x, y: middle.y - BUILDING_RISE * PIXELS };
        case 'arched': {
          const painted = paintedMiddle(laid);
          return { x: middle.x - painted.x * scale, y: middle.y - painted.y * scale };
        }
      }
  }
}

/**
 * What stands on an art box's ground painted over it, in the front's pixels: a unit on the window's
 * middle, a building's paintings about the middle tile's, an icon on the window's middle as wide as
 * `ICON_SHARE` says.
 */
function paintThing(
  on: CanvasRenderingContext2D,
  paintingIn: PaintingIn,
  holds: ArtThing,
  at: {
    readonly window: { readonly width: number; readonly height: number };
    readonly middle: { readonly x: number; readonly y: number };
    readonly ground: { readonly x: number; readonly y: number };
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
      on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
      for (const { from, x, y, scale: own } of laid) drawnAt(on, from, x, y, own);
      return;
    case 'icon': {
      const from = paintingIn(ART_SHEET_KEY, holds.file);
      const side = ICON_SHARE * Math.min(window.width, window.height);
      on.setTransform(1, 0, 0, 1, middle.x, middle.y);
      drawnAbout(on, from, side / Math.max(from.width, from.height));
      return;
    }
  }
  const unlisted: never = holds;
  throw new Error(`nothing stands in an art box as ${JSON.stringify(unlisted)}`);
}

/** The shape of a window's art box, painted once for every frame of the sheet that reads it. */
type ShapeOf = (window: FrontWindow, paintingIn: PaintingIn) => CanvasRenderingContext2D;

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
      const scale =
        (TILE_SHARE * Math.max(window.width, window.height)) / (Math.sqrt(3) * TILE_SIZE);
      const { holds } = picture;
      const laid = holds.kind === 'building' ? laidPieces(paintingIn, holds.building) : [];
      const ground = groundMiddleOf(picture, middle, scale, laid);
      on.setTransform(scale, 0, 0, scale, ground.x, ground.y);
      paintGround(
        on,
        paintingIn,
        picture.ground,
        holds.kind === 'building' ? holds.building : undefined,
      );
      on.setTransform(1, 0, 0, 1, 0, 0);
      on.globalCompositeOperation = 'multiply';
      on.fillStyle = css(LOOK.cardArtGround);
      on.fillRect(0, 0, glass.width, glass.height);
      on.globalCompositeOperation = 'source-over';
      paintThing(on, paintingIn, holds, { window, middle, ground, scale, laid });
      on.setTransform(1, 0, 0, 1, 0, 0);
      on.globalCompositeOperation = 'destination-in';
      on.drawImage(shapeOf(picture.window, paintingIn).canvas, 0, 0);
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
    paint: (context, paintingIn) => context.drawImage(shapeOf(window, paintingIn).canvas, 0, 0),
  };
}

/**
 * The sheet every picture a card's art box holds is painted into, under each city section's building
 * and under none, with the icons they draw and each window's shape for a box holding none.
 */
export function artSheet(catalogue: Catalogue): Sheet {
  const shapes = new Map<FrontWindow, CanvasRenderingContext2D>();
  const shapeOf: ShapeOf = (window, paintingIn) => {
    const shape = shapes.get(window) ?? artShapeOf(window, paintingIn);
    shapes.set(window, shape);
    return shape;
  };
  const pictures = new Map<string, ArtPicture>();
  for (const id of Object.keys(catalogue.cards)) {
    for (const city of [...citySectionBuildings(catalogue), undefined]) {
      const picture = artPictureOf(catalogue, id, cardArtOf(id), city);
      if (picture !== undefined) pictures.set(artFrameOf(picture, picture.window), picture);
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
    side: 2048,
    rowGap: 8,
  };
}
