import type { TileCoords } from '../rules/map';
import { LOOK } from './look';

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

/** Half the width of the fertile plain's hexagon, whose corners stand five from its centre. */
const HEX_HALF = 2.5 * Math.sqrt(3);

const FERTILE: number[] = [
  HEX_HALF,
  -2.5,
  HEX_HALF,
  2.5,
  0,
  5,
  -HEX_HALF,
  2.5,
  -HEX_HALF,
  -2.5,
  0,
  -5,
];

const TRIANGLE: number[] = [-5, 4, 0, -4, 5, 4];

/** Placeholder primitives until the art pass. */
const FEATURE_MARKS: Readonly<Record<string, number[]>> = {
  fertile: FERTILE,
  deer: TRIANGLE,
  cattle: TRIANGLE,
  flint: [-2, -5, 4, -1, 2, 5, -4, 1],
  oasis: [-4, -4, 4, -4, 4, 4, -4, 4],
};

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

/** The sheet every terrain's paintings are drawn into. */
export const FACE_SHEET = 'faces';

/** The files a terrain's paintings are, under the assets folder; a terrain with none is refused. */
export function paintingsOf(terrain: string): string[] {
  const { pack, family, count } = drawn(TERRAIN_FACES, terrain, 'no painting faces the terrain');
  return Array.from(
    { length: count },
    (_, at) => `store/${pack}/Tiles/${family}${String(at).padStart(2, '0')}.png`,
  );
}

/** Every painting of every terrain: the files the face sheet is drawn from. */
export const FACE_FILES: readonly string[] = Object.keys(TERRAIN_FACES).flatMap(paintingsOf);

/** The painting a tile of the terrain wears, picked by its place on the disc alone. */
export function paintingOn(terrain: string, { q, r }: TileCoords): string {
  const paintings = paintingsOf(terrain);
  let hash = Math.imul(q, 0x27d4eb2d) ^ Math.imul(r, 0x165667b1);
  hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
  hash ^= hash >>> 13;
  return paintings[(hash >>> 0) % paintings.length];
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

/** The corners a feature's mark is drawn from; a feature with no mark is refused. */
export function featureMarkOf(feature: string): number[] {
  return drawn(FEATURE_MARKS, feature, 'no mark is drawn for the feature');
}

/** The colour a feature's mark is painted in; a feature with no colour is refused. */
export function featureColourOf(feature: string): number {
  return drawn(LOOK.feature, feature, 'no colour paints the feature');
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
