const BLOCK: number[] = [-11, -11, 11, -11, 11, 11, -11, 11];

const POINT: number[] = [0, -14, 13, 9, -13, 9];

/**
 * Placeholder primitives until the art pass: the worker a block, the warrior a point, the scout an
 * arrowhead. Each is its corners about its own centre, raw.
 */
const UNIT_MARKS: Readonly<Record<string, number[]>> = {
  PH_Worker: BLOCK,
  PH_Warrior: POINT,
  worker: BLOCK,
  warrior: POINT,
  scout: [0, -14, 11, 12, 0, 5, -11, 12],
};

/** The red the enemies are drawn in, and everything that is theirs. */
export const ENEMY_RED = 0xb4453c;

/** The stone everything built and everything worked is painted in. */
export const BUILT = 0xcfc6b4;

const TERRAIN_COLOURS: Readonly<Record<string, number>> = {
  plain: 0x7d9c55,
  forest: 0x2f6f4e,
  hills: 0x9a8555,
  mountain: 0x6b5f57,
  coast: 0x3d6d9e,
  deep: 0x2b4f7a,
  urban: 0x8f8f9c,
};

/** The wall the city is drawn as, and the camp with it: a camp is the city's mark in enemy red. */
const WALL: number[] = [
  -15, 10, -15, -12, -8, -12, -8, -6, -4, -6, -4, -12, 4, -12, 4, -6, 8, -6, 8, -12, 15, -12, 15,
  10,
];

/**
 * Placeholder primitives until the art pass: the farm a house, the city and the camp a crenellated
 * wall, the shelter a tent, all of them wide enough to show under a unit.
 */
const BUILDING_MARKS: Readonly<Record<string, number[]>> = {
  PH_City: WALL,
  PH_Farm: [-16, 8, -16, -2, 0, -13, 16, -2, 16, 8],
  PH_Camp: WALL,
  city: WALL,
  camp: WALL,
  shelter: [-16, 10, 0, -13, 16, 10, 5, 10, 0, 2, -5, 10],
};

/** What each building's mark is painted in: the stone everything built is, a camp the enemy's red. */
const BUILDING_COLOURS: Readonly<Record<string, number>> = {
  PH_City: BUILT,
  PH_Farm: BUILT,
  PH_Camp: ENEMY_RED,
  city: BUILT,
  camp: ENEMY_RED,
  shelter: BUILT,
};

/** Half the width of the fertile plain's hexagon, whose corners stand four from its centre. */
const HEX_HALF = 2 * Math.sqrt(3);

const FERTILE: number[] = [HEX_HALF, -2, HEX_HALF, 2, 0, 4, -HEX_HALF, 2, -HEX_HALF, -2, 0, -4];

/**
 * Placeholder primitives until the art pass: the fertile plain a small hexagon of its own green, the
 * game a small triangle, the flint a shard.
 */
const FEATURE_MARKS: Readonly<Record<string, number[]>> = {
  PH_Fertile: FERTILE,
  fertile: FERTILE,
  game: [-4, 3, 0, -4, 4, 3],
  flint: [-2, -4, 3, -1, 1, 4, -3, 1],
};

const FEATURE_COLOURS: Readonly<Record<string, number>> = {
  PH_Fertile: 0x4a7a2d,
  fertile: 0x4a7a2d,
  game: 0x8a5a2b,
  flint: 0x4b4f58,
};

/**
 * Placeholder primitives until the art pass: the mine a cut into the ground, the road a straight
 * band, the trapping a snare.
 */
const IMPROVEMENT_MARKS: Readonly<Record<string, number[]>> = {
  PH_Mine: [-8, 7, -4, -7, 4, -7, 8, 7],
  PH_Road: [-8, -2, 8, -2, 8, 2, -8, 2],
  trapping: [-8, -6, -4, -6, 0, 2, 4, -6, 8, -6, 0, 7],
};

/** The corners a unit kind's mark is drawn from; a kind with no mark is refused. */
export function unitMarkOf(type: string): number[] {
  return drawn(UNIT_MARKS, type, 'no mark is drawn for the unit kind');
}

/** The colour a terrain's face is painted in; a terrain with no colour is refused. */
export function terrainColourOf(terrain: string): number {
  return drawn(TERRAIN_COLOURS, terrain, 'no colour paints the terrain');
}

/** The corners a building's mark is drawn from; a building with no mark is refused. */
export function buildingMarkOf(building: string): number[] {
  return drawn(BUILDING_MARKS, building, 'no mark is drawn for the building');
}

/** The colour a building's mark is painted in; a building with no colour is refused. */
export function buildingColourOf(building: string): number {
  return drawn(BUILDING_COLOURS, building, 'no colour paints the building');
}

/** The corners a feature's mark is drawn from; a feature with no mark is refused. */
export function featureMarkOf(feature: string): number[] {
  return drawn(FEATURE_MARKS, feature, 'no mark is drawn for the feature');
}

/** The colour a feature's mark is painted in; a feature with no colour is refused. */
export function featureColourOf(feature: string): number {
  return drawn(FEATURE_COLOURS, feature, 'no colour paints the feature');
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
