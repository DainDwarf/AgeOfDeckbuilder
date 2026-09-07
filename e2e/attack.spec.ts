import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome, playable, refusalOf } from '../src/rules/chronicle';
import { distance, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { UNIT_STATS, type Unit, unitAt } from '../src/rules/units';
import {
  budget,
  chronicleOf,
  dragOut,
  dragTiles,
  endTurn,
  firstSeed,
  open,
  ringedTile,
  watch,
} from './chronicle-screen';

/**
 * A chronicle whose turn `turn` enters a warrior on the city, and whose `turns` ends of turn after
 * it bring an enemy within that warrior's range while it still stands with its action full.
 */
type AttackRun = {
  readonly seed: number;
  readonly turn: number;
  readonly turns: number;
  readonly enemy: TileCoords;
};

/** The first seed that opens on such a run. */
function attackRun(): AttackRun {
  return firstSeed('brings an enemy within reach of a standing warrior', (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const met = besieged(chronicle);
      if (met !== undefined) return { seed, turn, ...met };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    return undefined;
  });
}

/**
 * How many ends of turn it takes this hand's warrior, entered and left standing on the city, to
 * have an enemy in range at the opening of a player turn, and nothing when none comes inside twenty.
 */
function besieged(chronicle: Chronicle): { turns: number; enemy: TileCoords } | undefined {
  const enter = chronicle.hand.indexOf('PH_Warrior');
  if (enter === -1 || !playable(refusalOf(chronicle, 'PH_Warrior'))) return undefined;
  let standing = outcome(apply(chronicle, { type: 'play', index: enter, aim: 'none' }));
  if (standing.units.length !== 1) return undefined;

  for (let turns = 1; turns <= 20; turns++) {
    standing = outcome(apply(standing, { type: 'end-turn' }));
    if (standing.defeat !== undefined) return undefined;
    const warrior = standing.units.find((unit) => unit.faction === 'player');
    if (warrior === undefined || warrior.action < warrior.stats.action) return undefined;
    const enemy = standing.units.find(
      (unit) =>
        unit.faction === 'enemy' && distance(unit.tile, warrior.tile) <= warrior.stats.range,
    );
    if (enemy !== undefined) return { turns, enemy: enemy.tile };
  }
  return undefined;
}

/** The unit standing on a tile of the chronicle the screen holds, and nothing where none stands. */
async function unitOn(page: Page, tile: TileCoords): Promise<Unit | undefined> {
  return unitAt((await chronicleOf(page)).units, tile);
}

test('a warrior dragged onto an enemy attacks it, and its spent action refuses a second attack', async ({
  page,
}) => {
  const problems = watch(page);
  const run = attackRun();
  // The ends of turn before the warrior and after it, and one more turn's worth for the two drags.
  test.setTimeout(budget(run.turn + run.turns));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Warrior'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  for (let turn = 0; turn < run.turns; turn++) await endTurn(page);

  const besetted = await chronicleOf(page);
  const warrior = besetted.units[0];
  const enemy = await unitOn(page, run.enemy);
  expect(warrior.tile).toEqual(entered.city);
  expect(warrior.action).toBe(UNIT_STATS.PH_Warrior.action);
  expect(enemy?.faction).toBe('enemy');

  // The attack: the warrior is dragged onto the enemy, the target on the tile making it an attack.
  await dragTiles(page, warrior.tile, run.enemy);
  await expect
    .poll(async () => (await unitOn(page, run.enemy))?.stats.health)
    .toBe((enemy?.stats.health ?? 0) - UNIT_STATS.PH_Warrior.damage);

  const attacked = await chronicleOf(page);
  expect(attacked.units[0].tile).toEqual(warrior.tile);
  expect(attacked.units[0].action).toBe(0);
  expect(attacked.units[0].movePoints).toBe(warrior.movePoints);
  // The warrior is selected again where it stands, so one more press is its next command.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(warrior.tile));

  // Its action is spent, so the enemy's tile is no target of the warrior's and the drag changes nothing.
  await dragTiles(page, warrior.tile, run.enemy);

  const again = await chronicleOf(page);
  expect(again.units).toEqual(attacked.units);
  expect(problems).toEqual([]);
});
