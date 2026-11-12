import type { Corner, TileCoords } from '../rules/map';
import { featureKind, improvementKind, type MapContent } from '../rules/map-kinds';
import { grownOf, haloOf } from './fade';
import { LOOK, type Wash } from './look';
import type { Made, Sheet } from './sheet';

/** What a feature's tile wears beside its icon: a herd of its animal, his pond, or its painting tinted. */
export type FeatureDress =
  | { readonly kind: 'herd' }
  | { readonly kind: 'pond' }
  | { readonly kind: 'tint'; readonly wash: Wash; readonly composite: GlobalCompositeOperation };

/** His resource icon each feature wears, by its file's name in his pack, and what its tile wears beside it. */
const FEATURE_LOOKS: Readonly<
  Record<string, { readonly icon: string; readonly dress: FeatureDress }>
> = {
  fertile: {
    icon: 'tobacco',
    dress: { kind: 'tint', wash: LOOK.fertileTint, composite: 'overlay' },
  },
  deer: { icon: 'deer', dress: { kind: 'herd' } },
  cattle: { icon: 'cow', dress: { kind: 'herd' } },
  flint: { icon: 'limestone', dress: { kind: 'tint', wash: LOOK.flintTint, composite: 'color' } },
  oasis: { icon: 'water', dress: { kind: 'pond' } },
};

/** How many copies of its animal a herd's tile carries. */
export const HERD_COPIES = 3;

/** How wide a feature's icon stands, in the map's units. */
export const ICON_WIDTH = 14;

/** The disc under an icon of a tile's row, and its rim, in the map's units. */
export const DISC_RADIUS = 9;
export const DISC_RIM = 1;

/** How far apart two discs of a tile's row stand, centre to centre, a unit between them, in the map's units. */
export const DISC_PITCH = 2 * DISC_RADIUS + 1;

/** How wide his file is, how tall, and how far down it the middle of his hexagon lies, in his pixels. */
export const PAINTING = { width: 256, height: 384, middle: 256 };

/** What a feature looks like; a feature with no icon is refused. */
function featureLookOf(feature: string): { readonly icon: string; readonly dress: FeatureDress } {
  return drawn(FEATURE_LOOKS, feature, 'no icon is drawn for the feature');
}

/** David Baumgart's paintings of each terrain: his pack's folder, the family's name, how many he painted. */
const TERRAIN_FACES: Readonly<
  Record<string, { readonly pack: string; readonly family: string; readonly count: number }>
> = {
  plain: { pack: 'hex-basic-terrain-set', family: 'hexPlains', count: 4 },
  forest: { pack: 'hex-basic-terrain-set', family: 'hexForestBroadleaf', count: 4 },
  hills: { pack: 'hex-basic-terrain-set', family: 'hexHighlands', count: 4 },
  mountain: { pack: 'hex-basic-terrain-set', family: 'hexMountain', count: 4 },
  desert: { pack: 'hex-basic-terrain-set', family: 'hexDesertDunes', count: 4 },
  coast: { pack: 'hex-rivers-coasts-and-seas', family: 'hexLake', count: 4 },
  ocean: { pack: 'hex-rivers-coasts-and-seas', family: 'hexOceanCalm', count: 4 },
};

/** The files that many of his paintings of one family are, numbered from nought, under the assets folder. */
function numberedFiles(folder: string, family: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, at) => `store/${folder}/${family}${String(at).padStart(2, '0')}.png`,
  );
}

/** The files a terrain's paintings are, under the assets folder; a terrain with none is refused. */
export function paintingsOf(terrain: string): string[] {
  const { pack, family, count } = drawn(TERRAIN_FACES, terrain, 'no painting faces the terrain');
  return numberedFiles(`${pack}/Tiles`, family, count);
}

// His coast files name their edges north-west, north-east, east, south-east, south-west, west, one
// character each: the places of those edges in the order `neighbours` walks them.
const SHORE_EDGES: readonly number[] = [2, 1, 0, 5, 4, 3];

/** The two files his coast along the edges a mask names is painted in, under the assets folder. */
function shoreFiles(mask: string): string[] {
  return ['00', '01'].map(
    (painting) => `store/hex-rivers-coasts-and-seas/Coasts/hexCoast${mask}-${painting}.png`,
  );
}

/**
 * The paintings of the shore along the edges of a water tile that meet land, each edge read in the
 * order `neighbours` walks them; none where no edge does.
 */
export function shorePaintingsOf(land: readonly boolean[]): string[] {
  const mask = SHORE_EDGES.map((edge) => (land[edge] ? '1' : '0')).join('');
  return mask.includes('1') ? shoreFiles(mask) : [];
}

/** His four voids, under the assets folder. */
export const VOIDS: readonly string[] = numberedFiles('hex-basic-terrain-set/Tiles', 'hexVoid', 4);

/** His clearings of a terrain, each by its file under the assets folder. */
const CLEARINGS: Readonly<Record<string, readonly string[]>> = {
  forest: numberedFiles('hex-medieval-fantasy-locations/Tiles', 'hexForestBroadleafClearing', 2),
};

/** His clearings of a terrain; none where he painted none. */
export function clearingsOf(terrain: string): readonly string[] {
  return Object.hasOwn(CLEARINGS, terrain) ? CLEARINGS[terrain] : [];
}

/** The sheet every terrain's paintings, every shore's, his voids and his clearings are drawn into. */
export const FACE_SHEET: Sheet = {
  key: 'faces',
  files: [
    ...Object.keys(TERRAIN_FACES).flatMap(paintingsOf),
    ...Array.from({ length: 2 ** SHORE_EDGES.length - 1 }, (_, at) =>
      shoreFiles((at + 1).toString(2).padStart(SHORE_EDGES.length, '0')),
    ).flat(),
    ...VOIDS,
    ...Object.values(CLEARINGS).flat(),
  ],
  side: 4096,
};

/**
 * One painting a building is drawn with: his files, one picked by the tile's place; its size against
 * the size he painted it at beside his tile, or his whole tile; and its middle about the tile's.
 */
export type BuildingPiece = {
  readonly files: readonly string[];
  readonly size: number | 'tile';
  readonly x: number;
  readonly y: number;
};

/**
 * A building drawn as his paintings: whether they lie on the patch, the pieces, back first, and
 * whether they leave an improvement's painting room beside them.
 */
export type BuildingPaintings = {
  readonly patch: boolean;
  readonly pieces: readonly BuildingPiece[];
  readonly leavesRoom?: true;
};

const LOCATIONS = 'store/hex-medieval-fantasy-locations/Decor';

/** One piece of one file. */
function piece(file: string, size: number | 'tile', x: number, y: number): BuildingPiece {
  return { files: [file], size, x, y };
}

const ICONS = 'store/icons-strategic-resources-and-goods/Icons';

const YURT = `${LOCATIONS}/houseYurt00.png`;
const FURS = `${ICONS}/furs.png`;
const IVORY = `${ICONS}/ivory.png`;
const CAVE_MOUTH = `${LOCATIONS}/undergroundPassage00.png`;
const TALL_BARROW = `${LOCATIONS}/barrow00.png`;
const LOW_BARROW = `${LOCATIONS}/barrow01.png`;
const DOCK = 'store/hex-rivers-coasts-and-seas/Decor/dockE00.png';
const NET = 'store/ancient-icons/fishing_net.png';
const ROCKS = numberedFiles('hex-basic-terrain-set/Decor', 'rocks', 4);

const STANDING_STONES = piece(`${LOCATIONS}/standingStones.png`, 'tile', 0, 0);

/** His thatched village, one of his four picked by the tile's place. */
const VILLAGE: BuildingPaintings = {
  patch: false,
  pieces: [
    {
      files: numberedFiles('hex-medieval-fantasy-locations/Decor', 'villageThatched', 4),
      size: 'tile',
      x: 0,
      y: 0,
    },
  ],
};

const PAINTED_CAVE: BuildingPaintings = { patch: false, pieces: [piece(CAVE_MOUTH, 0.9, 0, -2.3)] };

const OLD_CAIRN: BuildingPaintings = {
  patch: false,
  pieces: [piece(TALL_BARROW, 1.5, 6.5, -4.9), piece(LOW_BARROW, 1.7, -4.5, 2.9)],
};

const BEAST_BONES: BuildingPaintings = { patch: false, pieces: [piece(IVORY, 0.9, 0, -1)] };

/** Every building's paintings. */
const BUILDING_PAINTINGS: Readonly<Record<string, BuildingPaintings>> = {
  hearth: {
    patch: false,
    pieces: [piece(YURT, 1.05, 0.5, -6.7), piece(YURT, 0.95, -8.3, 3.2), piece(YURT, 1, 8.3, 4.4)],
  },
  village: VILLAGE,
  'neutral-village': VILLAGE,
  shelter: {
    patch: false,
    pieces: [piece(`${LOCATIONS}/houseLonghouse00.png`, 1.45, 0, -2.5)],
    leavesRoom: true,
  },
  farm: {
    patch: false,
    pieces: [
      piece(`${LOCATIONS}/granaryThatched00.png`, 2, 3, -9.5),
      piece(`${LOCATIONS}/field00.png`, 1.2, -5.5, 4.5),
    ],
    leavesRoom: true,
  },
  tannery: {
    patch: false,
    pieces: [piece(`${LOCATIONS}/foresterShed00.png`, 1.4, 0, -6), piece(FURS, 0.65, -6.4, 6)],
    leavesRoom: true,
  },
  megalith: {
    patch: false,
    pieces: [piece(`${LOCATIONS}/barrow03.png`, 2.2, 0, -3)],
    leavesRoom: true,
  },
  fishery: {
    patch: false,
    pieces: [piece(DOCK, 1.6, -0.5, -3), piece(NET, 0.7, -1, 2)],
  },
  foundations: {
    patch: true,
    pieces: [
      piece(ROCKS[0], 1.8, 5.5, -8.5),
      piece(ROCKS[1], 1.8, -8, 0.5),
      piece(ROCKS[3], 1.8, 6.5, 5.5),
    ],
  },
  'great-stones': { patch: true, pieces: [STANDING_STONES] },
  monument: {
    patch: true,
    pieces: [STANDING_STONES, piece(`${LOCATIONS}/obelisk00.png`, 1.53, 0.3, -14.7)],
  },
  camp: { patch: false, pieces: [piece(`${LOCATIONS}/banditCamp00.png`, 1.15, 0, -1.9)] },
  'stone-camp': {
    patch: false,
    pieces: [piece(`${LOCATIONS}/strongholdThatched00.png`, 'tile', 0, 0)],
  },
  'painted-cave': PAINTED_CAVE,
  'stone-painted-cave': PAINTED_CAVE,
  'old-cairn': OLD_CAIRN,
  'stone-old-cairn': OLD_CAIRN,
  'beast-bones': BEAST_BONES,
  'stone-beast-bones': BEAST_BONES,
};

const ARMS = 'store/icons-medieval-arms-and-armor/icons';

/** His canoe, which an embarked unit stands in, under the assets folder. */
export const CANOE = 'store/hex-rivers-coasts-and-seas/Decor/canoe00.png';

/** How many of his pixels wide an arms icon is, and how many of the map's units it is drawn at a size of one. */
const ARMS_PIXELS = 128;
const UNIT_WIDTH = 18;

/** How deep a unit's halo fades out from its painting's outline, and how wide the dark line between them is, in the map's units. */
const HALO_DEPTH = 4;
const DARK_LINE = 0.25;

/** His arms icon a unit kind is drawn as: its file, its size against `UNIT_WIDTH`, and where his paint lies in it, in his pixels. */
type UnitPicture = { readonly file: string; readonly size: number; readonly ink: Box };

const UNIT_PICTURES: Readonly<Record<string, UnitPicture>> = {
  worker: { file: `${ARMS}/mallet.png`, size: 1, ink: { x: 25, y: 21, width: 82, height: 93 } },
  warrior: {
    file: `${ARMS}/spiked_club.png`,
    size: 1,
    ink: { x: 8, y: 8, width: 113, height: 114 },
  },
  scout: {
    file: `${ARMS}/shoes_leather.png`,
    size: 1,
    ink: { x: 7, y: 16, width: 112, height: 97 },
  },
  archer: { file: `${ARMS}/shortbow.png`, size: 1.1, ink: { x: 35, y: 1, width: 57, height: 126 } },
  leader: {
    file: `${ARMS}/decorative_axe.png`,
    size: 1.15,
    ink: { x: 3, y: 1, width: 121, height: 124 },
  },
};

/** How many of his pixels one of the map's units is in a painting drawn at that size. */
function pixelsToTheUnit(size: number): number {
  return ARMS_PIXELS / (UNIT_WIDTH * size);
}

/** The room a frame painted off his icon keeps round it on every side to reach that many units past it, in his pixels. */
function roomFor(reach: number, size: number): number {
  return Math.ceil(reach * pixelsToTheUnit(size)) + 1;
}

/** The frame of the units sheet a unit kind's painting stands in, the dark line round it. */
function linedName(file: string): string {
  return `${file}#lined`;
}

/** The frame of the units sheet a unit kind's halo stands in, white for a tint to colour. */
function haloName(file: string): string {
  return `${file}#halo`;
}

/**
 * A frame his icon is painted off, the icon in its middle with room round it to reach that many
 * units past it: `paint` is handed a canvas of the frame's size, the icon's alpha on it, how many
 * pixels a unit is, and the way to draw the icon onto it.
 */
function aroundIcon(
  { file, size }: UnitPicture,
  frame: string,
  reach: number,
  paint: (
    on: CanvasRenderingContext2D,
    alpha: Uint8ClampedArray,
    pixels: number,
    icon: () => void,
  ) => void,
): Made {
  const room = roomFor(reach, size);
  const side = ARMS_PIXELS + 2 * room;
  return {
    frame,
    width: side,
    height: side,
    paint: (context, paintingIn) => {
      const from = paintingIn(UNIT_SHEET.key, file);
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const on = canvas.getContext('2d');
      if (on === null) throw new Error('no canvas of the page draws in two dimensions');
      const icon = (): void =>
        on.drawImage(
          from.canvas,
          from.x,
          from.y,
          from.width,
          from.height,
          room,
          room,
          from.width,
          from.height,
        );
      icon();
      const { data } = on.getImageData(0, 0, side, side);
      const alpha = Uint8ClampedArray.from({ length: side * side }, (_, at) => data[4 * at + 3]);
      paint(on, alpha, pixelsToTheUnit(size), icon);
      context.drawImage(canvas, 0, 0);
    },
  };
}

/** Every pixel of a canvas painted in a colour, as strong as `strengths` says, out of one. */
function washed(on: CanvasRenderingContext2D, colour: number, strengths: Float64Array): void {
  const { width, height } = on.canvas;
  const image = on.createImageData(width, height);
  strengths.forEach((strength, at) => {
    image.data[4 * at] = (colour >> 16) & 0xff;
    image.data[4 * at + 1] = (colour >> 8) & 0xff;
    image.data[4 * at + 2] = colour & 0xff;
    image.data[4 * at + 3] = Math.round(0xff * strength);
  });
  on.putImageData(image, 0, 0);
}

/** A unit kind's painting over the dark line round it: his outline grown by the line, in the map's outline colour. */
function linedFrame(picture: UnitPicture): Made {
  return aroundIcon(picture, linedName(picture.file), DARK_LINE, (on, alpha, pixels, icon) => {
    const { width, height } = on.canvas;
    washed(on, LOOK.mapOutline, grownOf(alpha, width, height, DARK_LINE * pixels));
    icon();
  });
}

/** A unit kind's halo, in white: the fade out from his outline, painted once for every faction's tint. */
function haloFrame(picture: UnitPicture): Made {
  return aroundIcon(picture, haloName(picture.file), 2.5 * HALO_DEPTH, (on, alpha, pixels) => {
    const { width, height } = on.canvas;
    washed(on, 0xffffff, haloOf(alpha, width, height, LOOK.unitHalo, HALO_DEPTH * pixels));
  });
}

/** The sheet his arms icons a unit kind is drawn as are drawn into, his canoe, and each kind's painting lined and its halo. */
export const UNIT_SHEET: Sheet = {
  key: 'units',
  files: [...Object.values(UNIT_PICTURES).map(({ file }) => file), CANOE],
  made: [
    ...Object.values(UNIT_PICTURES).map(linedFrame),
    ...Object.values(UNIT_PICTURES).map(haloFrame),
  ],
  side: 1024,
};

/** How a unit kind is drawn: its painting lined and its halo, frames of the units sheet, each drawn at `scale` about its middle. */
export type UnitPainting = {
  readonly painting: string;
  readonly halo: string;
  readonly scale: number;
};

/** How a unit kind is drawn; a kind with no painting is refused. */
export function unitPaintingOf(type: string): UnitPainting {
  const { file, size } = drawn(UNIT_PICTURES, type, 'no painting is drawn for the unit kind');
  return { painting: linedName(file), halo: haloName(file), scale: 1 / pixelsToTheUnit(size) };
}

/** Where his paint and the dark line round it lie in each frame a unit kind's painting stands in, in its pixels. */
const LINED_PAINT: Readonly<Record<string, Box>> = Object.fromEntries(
  Object.values(UNIT_PICTURES).map(({ file, size, ink }) => {
    const shift = roomFor(DARK_LINE, size) - DARK_LINE * pixelsToTheUnit(size);
    const grown = 2 * DARK_LINE * pixelsToTheUnit(size);
    return [
      linedName(file),
      { x: ink.x + shift, y: ink.y + shift, width: ink.width + grown, height: ink.height + grown },
    ];
  }),
);

/** A box in a frame's own pixels, from its top-left corner. */
type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Where his paint lies in each file a building is drawn with and each frame a unit kind's painting stands in, in its pixels. */
const PAINT: Readonly<Record<string, Box>> = {
  ...LINED_PAINT,
  [YURT]: { x: 1, y: 5, width: 96, height: 76 },
  [`${LOCATIONS}/villageThatched00.png`]: { x: 2, y: 130, width: 250, height: 223 },
  [`${LOCATIONS}/villageThatched01.png`]: { x: 4, y: 121, width: 243, height: 231 },
  [`${LOCATIONS}/villageThatched02.png`]: { x: 4, y: 120, width: 239, height: 249 },
  [`${LOCATIONS}/villageThatched03.png`]: { x: 3, y: 131, width: 240, height: 224 },
  [`${LOCATIONS}/houseLonghouse00.png`]: { x: 2, y: 1, width: 113, height: 99 },
  [`${LOCATIONS}/granaryThatched00.png`]: { x: 1, y: 2, width: 71, height: 66 },
  [`${LOCATIONS}/field00.png`]: { x: 0, y: 3, width: 119, height: 81 },
  [`${LOCATIONS}/foresterShed00.png`]: { x: 6, y: 5, width: 87, height: 60 },
  [FURS]: { x: 0, y: 10, width: 128, height: 114 },
  [`${LOCATIONS}/barrow03.png`]: { x: 4, y: 0, width: 56, height: 50 },
  [DOCK]: { x: 5, y: 0, width: 89, height: 56 },
  [NET]: { x: 3, y: 1, width: 119, height: 126 },
  [ROCKS[0]]: { x: 2, y: 2, width: 62, height: 28 },
  [ROCKS[1]]: { x: 2, y: 1, width: 63, height: 43 },
  [ROCKS[3]]: { x: 2, y: 1, width: 52, height: 41 },
  [`${LOCATIONS}/standingStones.png`]: { x: 8, y: 91, width: 244, height: 262 },
  [`${LOCATIONS}/obelisk00.png`]: { x: 2, y: 0, width: 77, height: 110 },
  [`${LOCATIONS}/banditCamp00.png`]: { x: 0, y: 0, width: 170, height: 176 },
  [`${LOCATIONS}/strongholdThatched00.png`]: { x: 10, y: 120, width: 235, height: 233 },
  [CAVE_MOUTH]: { x: 0, y: 1, width: 226, height: 175 },
  [TALL_BARROW]: { x: 0, y: 0, width: 78, height: 77 },
  [LOW_BARROW]: { x: 0, y: 3, width: 94, height: 58 },
  [IVORY]: { x: 2, y: 1, width: 122, height: 126 },
};

/** Where his paint lies in a frame drawn off his file, in his pixels; nothing where it fills the frame. */
export function paintIn(frame: string): Box | undefined {
  return Object.hasOwn(PAINT, frame) ? PAINT[frame] : undefined;
}

/** How wide and how tall the patch lies, in the map's units, and how many pixels of its frame each is. */
const PATCH_SIZE = { width: 42, height: 30 };
const PATCH_PIXELS = 6;

/** The patch's frame in the buildings sheet, and the scale that draws it at its size. */
export const PATCH = { frame: 'patch', scale: 1 / PATCH_PIXELS };

/**
 * The patch: an ellipse at the patch's strength out to six tenths of its radius, then falling evenly
 * to nothing at its rim.
 */
function paintPatch(context: CanvasRenderingContext2D): void {
  const width = PATCH_SIZE.width * PATCH_PIXELS;
  const height = PATCH_SIZE.height * PATCH_PIXELS;
  const { colour, strength } = LOOK.monumentPatch;
  const rgba = (alpha: number): string =>
    `rgba(${(colour >> 16) & 0xff}, ${(colour >> 8) & 0xff}, ${colour & 0xff}, ${alpha})`;
  context.translate(width / 2, height / 2);
  context.scale(1, height / width);
  const wash = context.createRadialGradient(0, 0, 0, 0, 0, width / 2);
  wash.addColorStop(0, rgba(strength));
  wash.addColorStop(0.6, rgba(strength));
  wash.addColorStop(1, rgba(0));
  context.fillStyle = wash;
  context.beginPath();
  context.arc(0, 0, width / 2, 0, 2 * Math.PI);
  context.fill();
}

/** The sheet every painting a building is drawn with, and the patch, are drawn into. */
export const BUILDING_SHEET: Sheet = {
  key: 'buildings',
  files: [
    ...new Set(
      Object.values(BUILDING_PAINTINGS).flatMap(({ pieces }) =>
        pieces.flatMap(({ files }) => files),
      ),
    ),
  ],
  made: [
    {
      frame: PATCH.frame,
      width: PATCH_SIZE.width * PATCH_PIXELS,
      height: PATCH_SIZE.height * PATCH_PIXELS,
      paint: paintPatch,
    },
  ],
  side: 2048,
};

/** How many edges his river pieces and his river mouths name, one character of a mask each. */
const RIVER_EDGES = 6;

/**
 * How many paintings he made of each piece a corner of a river wears, by its mask: his edges in the
 * order his coasts name them, every mask whose edges lie two apart.
 */
const RIVER_PIECES: Readonly<Record<string, number>> = {
  '000001': 1,
  '000010': 1,
  '000100': 1,
  '001000': 1,
  '010000': 1,
  '100000': 1,
  '010100': 2,
  '101000': 1,
  '010001': 1,
  '100010': 1,
  '000101': 2,
  '001010': 2,
  '010101': 1,
  '101010': 1,
};

/** How many paintings he made of his river mouth along each edge. */
const MOUTH_PAINTINGS = 2;

/** The mask naming these of his edges, each by its place in the mask. */
function riverMask(edges: ReadonlySet<number>): string {
  return Array.from({ length: RIVER_EDGES }, (_, at) => (edges.has(at) ? '1' : '0')).join('');
}

/** The files that many paintings of one of his river pieces are, under the assets folder. */
function riverFiles(folder: string, family: string, mask: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, at) =>
      `store/hex-rivers-coasts-and-seas/${folder}/${family}${mask}-${String(at).padStart(2, '0')}.png`,
  );
}

/** The paintings of his river piece whose edges are these; edges no piece of his has are refused. */
export function riverPaintingsOf(edges: ReadonlySet<number>): string[] {
  const mask = riverMask(edges);
  const count = drawn(RIVER_PIECES, mask, 'no river piece is painted along the edges');
  return riverFiles('Rivers', 'hexRiver', mask, count);
}

/** The paintings of his river mouth along that one of his edges. */
export function mouthPaintingsOf(edge: number): string[] {
  return riverFiles('River Mouths', 'hexRiverMouth', riverMask(new Set([edge])), MOUTH_PAINTINGS);
}

/** His straight river, from his east edge to his west. */
export const STRAIGHT_RIVER: string = riverFiles('Rivers', 'hexRiver', '001001', 1)[0];

/** His river's source piece, running from his hexagon's middle to his east edge. */
const SOURCE_TO_EAST: string = riverFiles('Rivers', 'hexRiver', '001000', 1)[0];

/**
 * How his straight river is cut round: how many of his pixels across, about which of his pixels, and
 * how far it is turned anticlockwise, in degrees.
 */
const RIVER_CUT_OF = { across: 104, x: 128, y: 260, turn: 15 };

/**
 * His straight river cut round and turned, his east end rising: the one picture a river is told by
 * off the map, and the one an irrigation's disc wears.
 */
export const RIVER_CUT: Made = {
  frame: 'river-cut',
  width: RIVER_CUT_OF.across,
  height: RIVER_CUT_OF.across,
  paint: (context, paintingIn) => {
    const { canvas, x, y, width, height } = paintingIn(RIVER_SHEET.key, STRAIGHT_RIVER);
    const radius = RIVER_CUT_OF.across / 2;
    context.beginPath();
    context.arc(radius, radius, radius, 0, 2 * Math.PI);
    context.clip();
    context.translate(radius, radius);
    context.rotate((-RIVER_CUT_OF.turn * Math.PI) / 180);
    context.drawImage(canvas, x, y, width, height, -RIVER_CUT_OF.x, -RIVER_CUT_OF.y, width, height);
  },
};

/** The sheet every river piece, his straight river and every river mouth are drawn into. */
export const RIVER_SHEET: Sheet = {
  key: 'rivers',
  files: [
    ...Object.entries(RIVER_PIECES).flatMap(([mask, count]) =>
      riverFiles('Rivers', 'hexRiver', mask, count),
    ),
    STRAIGHT_RIVER,
    ...Array.from({ length: RIVER_EDGES }, (_, edge) => mouthPaintingsOf(edge)).flat(),
  ],
  side: 2048,
};

/** The file of his resource icon a feature wears, under the assets folder; a feature with none is refused. */
export function featureIconOf(feature: string): string {
  return `${ICONS}/${featureLookOf(feature).icon}.png`;
}

/** What a feature's tile wears beside its icon; a feature with no icon is refused. */
export function featureDressOf(feature: string): FeatureDress {
  return featureLookOf(feature).dress;
}

/** His four ponds, under the assets folder. */
export const PONDS: readonly string[] = numberedFiles(
  'hex-basic-terrain-set/Decor',
  'decorPond',
  4,
);

/** Where his painting of an improvement lies: its size against the size he painted it at beside his tile, and its middle about the tile's. */
export type LyingAt = { readonly size: number; readonly x: number; readonly y: number };

/** His painting of an improvement lying on its tile, alone on it and beside a building that leaves it room. */
export type LaidPainting = {
  readonly kind: 'painting';
  readonly painting: string;
  readonly alone: LyingAt;
  readonly beside: LyingAt;
};

/**
 * Ditches from the river into the tile: his file, the point a ditch is held at in his pixels, how far
 * in from its edge's middle that stands, the units to his pixel along it and across, and its roll's
 * reach either way, in degrees.
 */
export type Ditches = {
  readonly kind: 'ditches';
  readonly file: string;
  readonly held: { readonly x: number; readonly y: number };
  readonly inset: number;
  readonly along: number;
  readonly across: number;
  readonly roll: number;
};

/**
 * His deer behind his net, in his deer's pixels: the deer's side and the room about it on each side of
 * the frame; the net's side, and how far its middle lies right of and below the deer's, as shares of
 * the deer's side.
 */
const DEER_IN_NET_OF = { deer: 128, room: 9, net: 0.8, x: -0.04, y: 0.17 };

const DEER_IN_NET_SIDE = DEER_IN_NET_OF.deer + 2 * DEER_IN_NET_OF.room;

/** His deer behind his net, the head showing over it, the deer's middle the frame's: the picture a trapping is told by. */
export const DEER_IN_NET: Made = {
  frame: 'deer-in-net',
  width: DEER_IN_NET_SIDE,
  height: DEER_IN_NET_SIDE,
  paint: (context, paintingIn) => {
    const { deer, net, x, y } = DEER_IN_NET_OF;
    const middle = DEER_IN_NET_SIDE / 2;
    const drawnAt = (
      sheet: string,
      painting: string,
      at: number,
      down: number,
      side: number,
    ): void => {
      const from = paintingIn(sheet, painting);
      context.drawImage(
        from.canvas,
        from.x,
        from.y,
        from.width,
        from.height,
        at - side / 2,
        down - side / 2,
        side,
        side,
      );
    };
    drawnAt(FEATURE_SHEET_KEY, featureIconOf('deer'), middle, middle, deer);
    drawnAt(BUILDING_SHEET.key, NET, middle + x * deer, middle + y * deer, net * deer);
  },
};

/** What an improvement's disc wears, by its frame in the features sheet, and how wide it stands, in the map's units. */
export type DiscPicture = { readonly icon: string; readonly width: number };

/**
 * What an improvement is told by: his icon on a disc of its own, as wide as it says, with his painting
 * or ditches from the river lying on its tile; or its feature's disc turned pale under the feature's
 * icon or a picture of its own, with his painting; and whether its tile wears its terrain's clearing.
 */
export type ImprovementLook = (
  | {
      readonly kind: 'icon';
      readonly icon: string;
      readonly width: number;
      readonly lies: LaidPainting | Ditches;
    }
  | { readonly kind: 'feature'; readonly picture?: DiscPicture; readonly lies: LaidPainting }
) & { readonly clears?: true };

const IMPROVEMENT_LOOKS: Readonly<Record<string, ImprovementLook>> = {
  trapping: {
    kind: 'feature',
    picture: { icon: DEER_IN_NET.frame, width: 16 },
    lies: {
      kind: 'painting',
      painting: DEER_IN_NET.frame,
      alone: { size: 0.75, x: 0, y: 3 },
      beside: { size: 0.5, x: 10, y: 8 },
    },
    clears: true,
  },
  irrigation: {
    kind: 'icon',
    icon: RIVER_CUT.frame,
    width: 17,
    lies: {
      kind: 'ditches',
      file: SOURCE_TO_EAST,
      held: { x: 246, y: 256 },
      inset: 2.5,
      along: 0.1549,
      across: 0.0659,
      roll: 25,
    },
  },
  pasture: {
    kind: 'feature',
    lies: {
      kind: 'painting',
      painting: `${LOCATIONS}/corral00_cows.png`,
      alone: { size: 1.5, x: 0, y: 3 },
      beside: { size: 0.85, x: 10, y: 8 },
    },
  },
  'clay-pit': {
    kind: 'icon',
    icon: `${ICONS}/clay.png`,
    width: 14,
    lies: {
      kind: 'painting',
      painting: `${LOCATIONS}/clayPit01.png`,
      alone: { size: 0.7, x: 0, y: 3 },
      beside: { size: 0.4, x: 10, y: 8 },
    },
  },
};

/** The frames an improvement's look draws from the features sheet: its icon or its picture, and its painting where it lies on one. */
function improvementFrames(look: ImprovementLook): string[] {
  switch (look.kind) {
    case 'icon':
      return [look.icon, ...paintingsLaid(look.lies)];
    case 'feature':
      return [
        ...(look.picture === undefined ? [] : [look.picture.icon]),
        ...paintingsLaid(look.lies),
      ];
  }
}

/** His painting of what an improvement lays on its tile's ground, and none for ditches, which the river sheet holds. */
function paintingsLaid(lies: LaidPainting | Ditches): string[] {
  switch (lies.kind) {
    case 'painting':
      return [lies.painting];
    case 'ditches':
      return [];
  }
}

/** What an improvement lays on its tile's ground. */
export function liesOf(improvement: string): LaidPainting | Ditches {
  return improvementLookOf(improvement).lies;
}

/** Whether an improvement's tile wears his clearing of its terrain. */
export function clearsItsTile(improvement: string): boolean {
  return improvementLookOf(improvement).clears === true;
}

/** The frame a painting tinted for a feature stands under in the features sheet. */
export function tintedName(painting: string, feature: string): string {
  return `${painting}#${feature}`;
}

export const FEATURE_SHEET_KEY = 'features';

/**
 * The sheet every feature's icon and his ponds are drawn into, every improvement's icon, picture and
 * painting, and the paintings of the terrain each feature with a tint lies on, tinted for it.
 */
export function featureSheet(catalogue: MapContent): Sheet {
  const made = [RIVER_CUT, DEER_IN_NET];
  const frames = new Set([
    ...Object.keys(FEATURE_LOOKS).map(featureIconOf),
    ...PONDS,
    ...Object.values(IMPROVEMENT_LOOKS).flatMap(improvementFrames),
  ]);
  return {
    key: FEATURE_SHEET_KEY,
    files: [...frames].filter((frame) => !made.some((one) => one.frame === frame)),
    made,
    tinted: Object.keys(catalogue.features).flatMap((feature) => {
      const dress = featureDressOf(feature);
      if (dress.kind !== 'tint') return [];
      return paintingsOf(featureKind(catalogue, feature).terrain).map((painting) => ({
        sheet: FACE_SHEET.key,
        painting,
        frame: tintedName(painting, feature),
        wash: dress.wash,
        composite: dress.composite,
      }));
    }),
    side: 2048,
  };
}

/** The one of the paintings a tile wears, picked by its place on the disc alone. */
export function paintingOn(paintings: readonly string[], { q, r }: TileCoords): string {
  return paintings[pickOf(q, r, paintings.length)];
}

/** The one of the paintings a corner of the lattice wears, picked by its place alone, as a tile's is. */
export function paintingAtCorner(paintings: readonly string[], { x, y }: Corner): string {
  return paintings[pickOf(x, y, paintings.length)];
}

/** Which of that many a place picks, by two numbers read off it: the one hash every pick by place goes through. */
export function pickOf(one: number, other: number, count: number): number {
  let hash = Math.imul(one, 0x27d4eb2d) ^ Math.imul(other, 0x165667b1);
  hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
  hash ^= hash >>> 13;
  return (hash >>> 0) % count;
}

/** The flat colour a terrain is known by; a terrain with no colour is refused. */
export function terrainColourOf(terrain: string): number {
  return drawn(LOOK.terrain, terrain, 'no colour paints the terrain');
}

/** The colour an age's ground in the technology tree is painted in; an age with no colour is refused. */
export function groundColourOf(age: string): number {
  return drawn(LOOK.ground, age, 'no colour paints the ground of the age');
}

/** His paintings a building is drawn as; a building with none is refused. */
export function buildingPaintingsOf(building: string): BuildingPaintings {
  return drawn(BUILDING_PAINTINGS, building, 'no painting is drawn for the building');
}

/** Whether a building's paintings lie on the patch. */
export function onPatch(building: string): boolean {
  return buildingPaintingsOf(building).patch;
}

/** Whether a building's paintings leave an improvement's painting room beside them. */
export function leavesRoom(building: string): boolean {
  return buildingPaintingsOf(building).leavesRoom === true;
}

/** What an improvement is told by; an improvement with no look is refused. */
export function improvementLookOf(improvement: string): ImprovementLook {
  return drawn(IMPROVEMENT_LOOKS, improvement, 'no mark is drawn for the improvement');
}

/**
 * The feature whose disc an improvement told on it is drawn on where no tile says one: the one its
 * kind names; a kind naming none or several is refused.
 */
export function discFeatureOf(catalogue: MapContent, improvement: string): string {
  const features = improvementKind(catalogue, improvement).features ?? [];
  if (features.length !== 1)
    throw new Error(`no one feature is named for the improvement ${improvement}`);
  return features[0];
}

/** The entry of one table a key names; a key the table does not hold is refused with the complaint. */
function drawn<T>(table: Readonly<Record<string, T>>, id: string, complaint: string): T {
  if (!Object.hasOwn(table, id)) throw new Error(`${complaint} ${id}`);
  return table[id];
}
