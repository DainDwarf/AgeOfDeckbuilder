import { LOOK } from './look';

const BLOCK: number[] = [-11, -11, 11, -11, 11, 11, -11, 11];

const POINT: number[] = [0, -14, 13, 9, -13, 9];

/** Placeholder primitives until the art pass, each its corners about its own centre, raw. */
const UNIT_MARKS: Readonly<Record<string, number[]>> = {
  worker: BLOCK,
  warrior: POINT,
  scout: [0, -14, 11, 12, 0, 5, -11, 12],
  archer: [-13, -9, 13, -9, 0, 14],
};

/** The wall the city is drawn as, and the camp with it. */
const WALL: number[] = [
  -15, 10, -15, -12, -8, -12, -8, -6, -4, -6, -4, -12, 4, -12, 4, -6, 8, -6, 8, -12, 15, -12, 15,
  10,
];

/** Each wide enough to show under the unit standing on its tile. */
const BUILDING_MARKS: Readonly<Record<string, number[]>> = {
  city: WALL,
  camp: WALL,
  shelter: [-16, 10, 0, -13, 16, 10, 5, 10, 0, 2, -5, 10],
  farm: [-16, -6, 16, -6, 16, 6, -16, 6],
  tannery: [-16, 8, -6, -8, 16, -8, 6, 8],
  fishery: [-10, -8, 10, -8, 16, 8, -16, 8],
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
};

/** The corners a unit kind's mark is drawn from; a kind with no mark is refused. */
export function unitMarkOf(type: string): number[] {
  return drawn(UNIT_MARKS, type, 'no mark is drawn for the unit kind');
}

/** The colour a terrain's face is painted in; a terrain with no colour is refused. */
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
