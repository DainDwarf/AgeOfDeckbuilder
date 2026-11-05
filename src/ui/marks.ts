import type { Corner, TileCoords } from '../rules/map';
import { featureKind, type MapContent } from '../rules/map-kinds';
import { LOOK, type Wash } from './look';
import type { Sheet } from './sheet';

const BLOCK: number[] = [-11, -11, 11, -11, 11, 11, -11, 11];

const POINT: number[] = [0, -14, 13, 9, -13, 9];

/** Placeholder primitives until the art pass, each its corners about its own centre, raw. */
const UNIT_MARKS: Readonly<Record<string, number[]>> = {
  worker: BLOCK,
  warrior: POINT,
  scout: [0, -14, 11, 12, 0, 5, -11, 12],
  archer: [-13, -9, 13, -9, 0, 14],
  leader: [0, -14, 13, -4, 8, 12, -8, 12, -13, -4],
};

/** The wall the city is drawn as, and the camp and the neutral's city with it. */
const WALL: number[] = [
  -15, 10, -15, -12, -8, -12, -8, -6, -4, -6, -4, -12, 4, -12, 4, -6, 8, -6, 8, -12, 15, -12, 15,
  10,
];

const CAVE: number[] = [-16, 10, -12, -4, 0, -10, 12, -4, 16, 10];

const CAIRN: number[] = [-16, 10, -16, -10, 16, 10];

const BONES: number[] = [-16, -10, 0, -2, 16, -10, 16, 10, 0, 2, -16, 10];

/** Each wide enough to show under the unit standing on its tile. */
const BUILDING_MARKS: Readonly<Record<string, number[]>> = {
  hearth: WALL,
  village: WALL,
  camp: WALL,
  'stone-camp': WALL,
  'neutral-village': WALL,
  shelter: [-16, 10, 0, -13, 16, 10, 5, 10, 0, 2, -5, 10],
  farm: [-16, -6, 16, -6, 16, 6, -16, 6],
  tannery: [-16, 8, -6, -8, 16, -8, 6, 8],
  fishery: [-10, -8, 10, -8, 16, 8, -16, 8],
  megalith: [-16, -8, 16, -8, 10, 8, -10, 8],
  foundations: [-16, 2, 16, 2, 16, 10, -16, 10],
  'great-stones': [-16, 10, -16, 2, -8, 2, -8, -6, 8, -6, 8, 2, 16, 2, 16, 10],
  monument: [-16, 10, -16, 2, 0, -14, 16, 2, 16, 10],
  'painted-cave': CAVE,
  'stone-painted-cave': CAVE,
  'old-cairn': CAIRN,
  'stone-old-cairn': CAIRN,
  'beast-bones': BONES,
  'stone-beast-bones': BONES,
};

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

/** What a feature looks like; a feature with no icon is refused. */
function featureLookOf(feature: string): { readonly icon: string; readonly dress: FeatureDress } {
  return drawn(FEATURE_LOOKS, feature, 'no icon is drawn for the feature');
}

/** Placeholder primitives until the art pass. */
const IMPROVEMENT_MARKS: Readonly<Record<string, number[]>> = {
  trapping: [-5, -4, 5, -4, 0, 5],
  irrigation: [-6, -2, 6, -2, 6, 2, -6, 2],
  pasture: [-4, -5, 5, 0, -4, 5],
  'clay-pit': [-6, -4, 6, -4, 3, 4, -3, 4],
};

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

/** The sheet every terrain's paintings, every shore's and his voids are drawn into. */
export const FACE_SHEET: Sheet = {
  key: 'faces',
  files: [
    ...Object.keys(TERRAIN_FACES).flatMap(paintingsOf),
    ...Array.from({ length: 2 ** SHORE_EDGES.length - 1 }, (_, at) =>
      shoreFiles((at + 1).toString(2).padStart(SHORE_EDGES.length, '0')),
    ).flat(),
    ...VOIDS,
  ],
  side: 4096,
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
  return `store/icons-strategic-resources-and-goods/Icons/${featureLookOf(feature).icon}.png`;
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

/** The frame a painting tinted for a feature stands under in the features sheet. */
export function tintedName(painting: string, feature: string): string {
  return `${painting}#${feature}`;
}

export const FEATURE_SHEET_KEY = 'features';

/**
 * The sheet every feature's icon and his ponds are drawn into, and the paintings of the terrain each
 * feature with a tint lies on, tinted for it off the face sheet.
 */
export function featureSheet(catalogue: MapContent): Sheet {
  return {
    key: FEATURE_SHEET_KEY,
    files: [...new Set(Object.keys(FEATURE_LOOKS).map(featureIconOf)), ...PONDS],
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

/** The corners a unit kind's mark is drawn from; a kind with no mark is refused. */
export function unitMarkOf(type: string): number[] {
  return drawn(UNIT_MARKS, type, 'no mark is drawn for the unit kind');
}

/** The flat colour a terrain is known by; a terrain with no colour is refused. */
export function terrainColourOf(terrain: string): number {
  return drawn(LOOK.terrain, terrain, 'no colour paints the terrain');
}

/** The colour an age's ground in the technology tree is painted in; an age with no colour is refused. */
export function groundColourOf(age: string): number {
  return drawn(LOOK.ground, age, 'no colour paints the ground of the age');
}

/** The corners a building's mark is drawn from; a building with no mark is refused. */
export function buildingMarkOf(building: string): number[] {
  return drawn(BUILDING_MARKS, building, 'no mark is drawn for the building');
}

/** The colour a building's mark is painted in; a building with no colour is refused. */
export function buildingColourOf(building: string): number {
  return LOOK[drawn(LOOK.building, building, 'no colour paints the building')];
}

/** The corners an improvement's mark is drawn from; an improvement with no mark is refused. */
export function improvementMarkOf(improvement: string): number[] {
  return drawn(IMPROVEMENT_MARKS, improvement, 'no mark is drawn for the improvement');
}

/** The entry of one table a key names; a key the table does not hold is refused with the complaint. */
function drawn<T>(table: Readonly<Record<string, T>>, id: string, complaint: string): T {
  if (!Object.hasOwn(table, id)) throw new Error(`${complaint} ${id}`);
  return table[id];
}
