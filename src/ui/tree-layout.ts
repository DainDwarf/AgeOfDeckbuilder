/**
 * Where the campaign screen stands the technology tree: every plate's column, place and state, the
 * links between them, each age's ground, and how far the tree moves. Horizontally everything is
 * measured from the tree's left end, vertically from the top of the room it stands in.
 */

import { available } from '../rules/campaign';
import { type Catalogue, technologyOf, victoryTechnologyOf } from '../rules/catalogue';

export const PLATE_WIDTH = 236;
const COLUMN_GAP = 70;
const ROW_GAP = 22;

/**
 * How far the first column's middle stands off the tree's left end, and the tree's right end off the
 * last column's middle.
 */
const LEAD = 200;

/** How wide the wash out of a ground is, centred on where the ground ends. */
export const WASH = 180;

export type PlateState = 'learned' | 'available' | 'unknown';

export type Plate = {
  readonly technology: string;
  readonly state: PlateState;
  readonly column: number;
  /** Its top-left corner. */
  readonly x: number;
  readonly y: number;
};

export type Point = { readonly x: number; readonly y: number };

/** A link from a technology to one that needs it, drawn through its points in order. */
export type Link = {
  readonly from: string;
  readonly to: string;
  /** Whether the technology it runs from is learned. */
  readonly learned: boolean;
  readonly points: readonly Point[];
};

/** An age's ground: from the tree's left end or its border with the age before, to its own border. */
export type Ground = { readonly age: string; readonly from: number; readonly to: number };

export type Tree = {
  readonly plates: readonly Plate[];
  readonly links: readonly Link[];
  /** In the order of history, each ending in the middle of its age's victory's column. */
  readonly grounds: readonly Ground[];
  /**
   * Where the last ground's wash ends, from which the ground of the age after it runs to the tree's
   * right end.
   */
  readonly toCome: number;
  readonly width: number;
  /** How far the tree may be moved, as the tree's point standing on the room's left edge. */
  readonly least: number;
  readonly most: number;
  /** Where it stands as the screen opens, on the same measure. */
  readonly opening: number;
};

export type Room = {
  readonly width: number;
  readonly height: number;
  /** How far the leftmost available technology opens off the room's left edge, where it must. */
  readonly margin: number;
};

function middleOf(column: number): number {
  return LEAD + column * (PLATE_WIDTH + COLUMN_GAP);
}

/**
 * Every technology's column: one after the furthest it needs, on the ground of the age whose
 * achievement earns it, and an age's victory technology on the border at its ground's right end,
 * the column after every other of the age's, whatever it needs; and each age's border column.
 */
function columnsOf(catalogue: Catalogue): {
  columns: Map<string, number>;
  borders: number[];
  victories: (string | undefined)[];
} {
  const ageOfTechnology = new Map<string, string>();
  for (const [age, { achievements }] of Object.entries(catalogue.ages)) {
    for (const { technology } of Object.values(achievements)) ageOfTechnology.set(technology, age);
  }

  const columns = new Map<string, number>();
  const borders: number[] = [];
  const victories: (string | undefined)[] = [];
  for (const [at, age] of Object.keys(catalogue.ages).entries()) {
    const victory = victoryTechnologyOf(catalogue, age);
    victories.push(victory);
    const start = at === 0 ? 0 : borders[at - 1] + 1;
    const members = Object.keys(catalogue.technologies).filter(
      (id) => ageOfTechnology.get(id) === age && id !== victory,
    );
    const column = (id: string): number => {
      const known = columns.get(id);
      if (known !== undefined) return known;
      const needs = technologyOf(catalogue, id).needs.map(column);
      const placed = Math.max(start, ...needs.map((need) => need + 1));
      columns.set(id, placed);
      return placed;
    };
    const border = Math.max(start, ...members.map((id) => column(id) + 1));
    if (victory !== undefined) columns.set(victory, border);
    borders.push(border);
  }
  return { columns, borders, victories };
}

/**
 * Where a link crosses the column between its two ends: in the gap nearest the straight line, the
 * gaps above and below the column included, and anywhere in a column with no plate.
 */
function laneThrough(tops: readonly number[], height: number, straight: number): number {
  if (tops.length === 0) return straight;
  const lanes = [tops[0] - ROW_GAP / 2, ...tops.map((top) => top + height + ROW_GAP / 2)];
  return lanes.reduce((best, lane) =>
    Math.abs(lane - straight) < Math.abs(best - straight) ? lane : best,
  );
}

export function layOutTree(
  catalogue: Catalogue,
  learned: readonly string[],
  plateHeight: number,
  room: Room,
): Tree {
  const ages = Object.keys(catalogue.ages);
  const { columns, borders, victories } = columnsOf(catalogue);
  const stateOf = (id: string): PlateState => {
    if (learned.includes(id)) return 'learned';
    return available(catalogue, id, learned) ? 'available' : 'unknown';
  };

  const byColumn = new Map<number, string[]>();
  for (const id of Object.keys(catalogue.technologies)) {
    const column = columns.get(id);
    if (column === undefined) throw new Error(`the technology ${id} stands in no column`);
    byColumn.set(column, [...(byColumn.get(column) ?? []), id]);
  }
  const topsOf = (column: number): number[] => {
    const ids = byColumn.get(column) ?? [];
    const tall = ids.length * plateHeight + (ids.length - 1) * ROW_GAP;
    return ids.map((_, row) => room.height / 2 - tall / 2 + row * (plateHeight + ROW_GAP));
  };

  const plates: Plate[] = [];
  const placed = new Map<string, Plate>();
  for (const [column, ids] of byColumn) {
    const tops = topsOf(column);
    for (const [row, technology] of ids.entries()) {
      const plate = {
        technology,
        state: stateOf(technology),
        column,
        x: middleOf(column) - PLATE_WIDTH / 2,
        y: tops[row],
      };
      plates.push(plate);
      placed.set(technology, plate);
    }
  }

  const plateOf = (id: string): Plate => {
    const plate = placed.get(id);
    if (plate === undefined) throw new Error(`the technology ${id} stands on no plate`);
    return plate;
  };
  const links: Link[] = [];
  for (const to of plates) {
    if (victories.includes(to.technology)) continue;
    for (const need of technologyOf(catalogue, to.technology).needs) {
      const from = plateOf(need);
      const start = { x: from.x + PLATE_WIDTH, y: from.y + plateHeight / 2 };
      const end = { x: to.x, y: to.y + plateHeight / 2 };
      const points: Point[] = [start];
      for (let column = from.column + 1; column < to.column; column++) {
        const along = (middleOf(column) - start.x) / (end.x - start.x);
        const y = laneThrough(topsOf(column), plateHeight, start.y + along * (end.y - start.y));
        const left = middleOf(column) - PLATE_WIDTH / 2;
        points.push({ x: left, y }, { x: left + PLATE_WIDTH, y });
      }
      points.push(end);
      links.push({ from: need, to: to.technology, learned: from.state === 'learned', points });
    }
  }

  const grounds = ages.map((age, at) => ({
    age,
    from: at === 0 ? 0 : middleOf(borders[at - 1]),
    to: middleOf(borders[at]),
  }));

  const end = grounds[grounds.length - 1].to;
  const toCome = end + WASH / 2;
  const width = end + LEAD;
  const least = 0;
  const most = Math.max(least, width - room.width);
  const availablePlates = plates.filter(({ state }) => state === 'available');
  const opening = (() => {
    if (availablePlates.length === 0) return most;
    const left = Math.min(...availablePlates.map(({ x }) => x));
    const right = Math.max(...availablePlates.map(({ x }) => x + PLATE_WIDTH));
    if (right - left > room.width - 2 * room.margin) return left - room.margin;
    return (left + right) / 2 - room.width / 2;
  })();

  return {
    plates,
    links,
    grounds,
    toCome,
    width,
    least,
    most,
    opening: stopped({ least, most }, opening),
  };
}

/** Where the tree stands moved to that point: stopped at whichever end it would pass. */
export function stopped(tree: Pick<Tree, 'least' | 'most'>, at: number): number {
  return Math.min(Math.max(at, tree.least), tree.most);
}
