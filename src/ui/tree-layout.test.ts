import { expect, test } from 'vitest';
import {
  type Achievement,
  ageOf,
  type Catalogue,
  catalogued,
  technologyOf,
} from '../rules/catalogue';
import { AGE, CATALOGUE, QUIET } from '../rules/fixtures';
import { layOutTree, PLATE_WIDTH, type Plate, type Point, stopped, type Tree } from './tree-layout';

const EARLY = AGE;
const LATE = QUIET;

const FIRE = 'PH_Fire';
const POTTERY = 'PH_Pottery';
const WEAVING = 'PH_Weaving';
const KILN = 'PH_Kiln';
const DOOR = 'PH_Door';
const WHEEL = 'PH_Wheel';
const BRONZE = 'PH_Bronze';
const IRON = 'PH_Iron';

const PLATE_HEIGHT = 74;

const ROOM = { width: 800, height: 600, margin: 24 };

/** The achievement that earns the technology in `TREE`. */
function earnerOf(technology: string): string {
  return `PH_Earns_${technology}`;
}

/**
 * Two ages of the fixture's, the first holding a technology needing one a column back and one two
 * columns back past a plate, and its victory's, which unlocks the second age; the second a chain,
 * and its victory's, needing the chain's first.
 */
const TREE: Catalogue = (() => {
  const earning = (ids: readonly string[]): Readonly<Record<string, Achievement>> =>
    Object.fromEntries(
      ids.map((technology) => [
        earnerOf(technology),
        { count: () => 0, need: 1, technology, influence: 1 },
      ]),
    );
  return catalogued({
    ...CATALOGUE,
    technologies: {
      [FIRE]: { needs: [], unlocks: { cards: {} } },
      [POTTERY]: { needs: [FIRE], unlocks: { cards: {} } },
      [WEAVING]: { needs: [], unlocks: { cards: {} } },
      [KILN]: { needs: [FIRE, POTTERY], unlocks: { cards: {} } },
      [DOOR]: { needs: [], unlocks: { cards: {} } },
      [WHEEL]: { needs: [DOOR], unlocks: { cards: {} } },
      [BRONZE]: { needs: [WHEEL], unlocks: { cards: {} } },
      [IRON]: { needs: [WHEEL], unlocks: { cards: {} } },
    },
    ages: {
      [EARLY]: {
        ...ageOf(CATALOGUE, EARLY),
        achievements: earning([FIRE, POTTERY, WEAVING, KILN, DOOR]),
        victory: earnerOf(DOOR),
      },
      [LATE]: {
        ...ageOf(CATALOGUE, LATE),
        achievements: earning([WHEEL, BRONZE, IRON]),
        victory: earnerOf(IRON),
      },
    },
  });
})();

/** `TREE` with the first age's victory technology needing one of its age's first column. */
const DOOR_NEEDING: Catalogue = catalogued({
  ...TREE,
  technologies: { ...TREE.technologies, [DOOR]: { needs: [WEAVING], unlocks: { cards: {} } } },
});

const EVERY = Object.keys(TREE.technologies);

function laid(learned: readonly string[] = [], room = ROOM): Tree {
  return layOutTree(TREE, learned, PLATE_HEIGHT, room);
}

function plateOf(tree: Tree, technology: string): Plate {
  const plate = tree.plates.find((each) => each.technology === technology);
  if (plate === undefined) throw new Error(`${technology} stands on no plate`);
  return plate;
}

function middleOf(plate: Plate): Point {
  return { x: plate.x + PLATE_WIDTH / 2, y: plate.y + PLATE_HEIGHT / 2 };
}

/** Whether the segment runs through the inside of the plate, its edges not counted. */
function through(a: Point, b: Point, plate: Plate): boolean {
  let enters = 0;
  let leaves = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const sides: [number, number][] = [
    [-dx, a.x - plate.x],
    [dx, plate.x + PLATE_WIDTH - a.x],
    [-dy, a.y - plate.y],
    [dy, plate.y + PLATE_HEIGHT - a.y],
  ];
  for (const [toward, room] of sides) {
    if (toward === 0) {
      if (room <= 0) return false;
      continue;
    }
    const at = room / toward;
    if (toward < 0) enters = Math.max(enters, at);
    else leaves = Math.min(leaves, at);
  }
  return leaves - enters > 1e-9;
}

test('a technology stands one column after the furthest technology it needs', () => {
  const tree = laid();

  expect(plateOf(tree, POTTERY).column).toBe(plateOf(tree, FIRE).column + 1);
  expect(plateOf(tree, KILN).column).toBe(plateOf(tree, POTTERY).column + 1);
  expect(plateOf(tree, WHEEL).column).toBe(plateOf(tree, DOOR).column + 1);
  expect(plateOf(tree, BRONZE).column).toBe(plateOf(tree, WHEEL).column + 1);
  expect(plateOf(tree, WEAVING).column).toBe(plateOf(tree, FIRE).column);
  expect(plateOf(tree, KILN).x).toBeGreaterThan(plateOf(tree, POTTERY).x + PLATE_WIDTH);
});

test('each age is a ground in the order of history, a technology stands on its age’s ground, and the age’s victory technology on the border at its ground’s right end', () => {
  const tree = laid();
  const [early, late] = tree.grounds;

  expect(tree.grounds.map(({ age }) => age)).toEqual([EARLY, LATE]);
  expect(early.from).toBe(0);
  expect(early.to).toBe(late.from);
  expect(middleOf(plateOf(tree, DOOR)).x).toBe(early.to);
  expect(middleOf(plateOf(tree, IRON)).x).toBe(late.to);
  for (const technology of [FIRE, POTTERY, WEAVING, KILN]) {
    const { x } = plateOf(tree, technology);
    expect(x).toBeGreaterThan(early.from);
    expect(x + PLATE_WIDTH).toBeLessThan(early.to);
  }
  for (const technology of [WHEEL, BRONZE]) {
    const { x } = plateOf(tree, technology);
    expect(x).toBeGreaterThan(late.from);
    expect(x + PLATE_WIDTH).toBeLessThan(late.to);
  }
});

test('an age’s victory technology stands in the column after every other technology of its age, whatever it needs, and the tree’s right end stands as far past it as the first column stands off the left end', () => {
  const tree = layOutTree(DOOR_NEEDING, [], PLATE_HEIGHT, ROOM);
  const iron = plateOf(tree, IRON);

  expect(plateOf(tree, DOOR).column).toBe(plateOf(tree, KILN).column + 1);
  expect(plateOf(tree, BRONZE).column).toBe(plateOf(tree, WHEEL).column + 1);
  expect(iron.column).toBe(plateOf(tree, BRONZE).column + 1);
  expect(tree.width - (iron.x + PLATE_WIDTH)).toBe(plateOf(tree, FIRE).x);
});

test('no link runs to a victory technology, whatever it needs', () => {
  const { links } = layOutTree(DOOR_NEEDING, [], PLATE_HEIGHT, ROOM);

  expect(technologyOf(DOOR_NEEDING, IRON).needs).toEqual([WHEEL]);
  expect(links.filter(({ to }) => to === DOOR || to === IRON)).toEqual([]);
  expect(links.some(({ from }) => from === DOOR)).toBe(true);
});

test('every column is centred on the room’s middle, its technologies in the content’s order', () => {
  const tree = laid();
  const columns = new Set(tree.plates.map(({ column }) => column));

  for (const column of columns) {
    const standing = tree.plates.filter((plate) => plate.column === column);
    const top = Math.min(...standing.map(({ y }) => y));
    const bottom = Math.max(...standing.map(({ y }) => y + PLATE_HEIGHT));
    expect((top + bottom) / 2).toBe(ROOM.height / 2);
  }
  expect(plateOf(tree, FIRE).y).toBeLessThan(plateOf(tree, WEAVING).y);
});

test('a technology learned is learned, one needing none that is not is available, and one needing one not learned is unknown', () => {
  const tree = laid([FIRE]);
  const states = Object.fromEntries(
    tree.plates.map(({ technology, state }) => [technology, state]),
  );

  expect(states).toEqual({
    [FIRE]: 'learned',
    [POTTERY]: 'available',
    [WEAVING]: 'available',
    [KILN]: 'unknown',
    [DOOR]: 'available',
    [WHEEL]: 'unknown',
    [BRONZE]: 'unknown',
    [IRON]: 'unknown',
  });
});

test('a link runs from a technology to each one that needs it, from a learned technology or not, and an unknown technology’s among them', () => {
  const tree = laid([FIRE]);
  const links = tree.links.map(({ from, to, learned }) => ({ from, to, learned }));

  expect(links).toHaveLength(5);
  expect(links).toEqual(
    expect.arrayContaining([
      { from: FIRE, to: POTTERY, learned: true },
      { from: FIRE, to: KILN, learned: true },
      { from: POTTERY, to: KILN, learned: false },
      { from: DOOR, to: WHEEL, learned: false },
      { from: WHEEL, to: BRONZE, learned: false },
    ]),
  );
});

test('a link runs around whatever plate stands in its way', () => {
  const tree = laid();
  const fire = plateOf(tree, FIRE);
  const kiln = plateOf(tree, KILN);
  const straight = {
    from: { x: fire.x + PLATE_WIDTH, y: middleOf(fire).y },
    to: { x: kiln.x, y: middleOf(kiln).y },
  };
  expect(through(straight.from, straight.to, plateOf(tree, POTTERY))).toBe(true);

  for (const link of tree.links) {
    const others = tree.plates.filter(
      ({ technology }) => technology !== link.from && technology !== link.to,
    );
    for (const [at, point] of link.points.slice(1).entries()) {
      const before = link.points[at];
      for (const plate of others) expect(through(before, point, plate)).toBe(false);
    }
    expect(link.points[0]).toEqual({
      x: plateOf(tree, link.from).x + PLATE_WIDTH,
      y: middleOf(plateOf(tree, link.from)).y,
    });
    expect(link.points.at(-1)).toEqual({
      x: plateOf(tree, link.to).x,
      y: middleOf(plateOf(tree, link.to)).y,
    });
  }
});

test('the tree stops at its ends, and a tree the room holds whole does not move', () => {
  const tree = laid();
  expect(tree.width).toBeGreaterThan(ROOM.width);
  expect(stopped(tree, -100)).toBe(0);
  expect(stopped(tree, tree.width)).toBe(tree.width - ROOM.width);

  const whole = laid([], { ...ROOM, width: tree.width + 100 });
  expect(whole.least).toBe(whole.most);
  for (const at of [-100, 0, 100, tree.width]) expect(stopped(whole, at)).toBe(whole.least);
});

test('the screen opens with the available technologies centred in the room, from the leftmost of them where it cannot hold them all, and on the right end where none is available', () => {
  const alone = laid([FIRE, POTTERY, WEAVING, KILN, DOOR]);
  expect(alone.plates.filter(({ state }) => state === 'available')).toEqual([
    plateOf(alone, WHEEL),
  ]);
  expect(middleOf(plateOf(alone, WHEEL)).x - alone.opening).toBe(ROOM.width / 2);

  const spread = laid();
  const availablePlates = spread.plates.filter(({ state }) => state === 'available');
  const left = Math.min(...availablePlates.map(({ x }) => x));
  const right = Math.max(...availablePlates.map(({ x }) => x + PLATE_WIDTH));
  expect(right - left).toBeGreaterThan(ROOM.width);
  expect(left - spread.opening).toBe(ROOM.margin);

  const done = laid(EVERY);
  expect(done.plates.some(({ state }) => state === 'available')).toBe(false);
  expect(done.opening).toBe(done.most);
});
