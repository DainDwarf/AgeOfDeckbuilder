import { expect, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { beginChronicle } from '../src/rules/chronicle';
import { MAP_COMPOSITION, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  consoleKey,
  endTurn,
  enter,
  marksIn,
  open,
  standing,
  stoppedTurn,
  take,
  watch,
} from './chronicle-screen';

/** The seed this spec opens on: its map is dealt every camp the composition asks for. */
const SEED = 1;

/**
 * The turn this seed's schedule deals its first event on. The raid is among what it offers, and
 * every camp's tile is free for it, the city having entered no unit of its own.
 */
const RAID = beginChronicle(SEED, DECKS.PH_Deck).nextEvent;

/** The tiles the generator put a camp on, in the order the map lists them. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => tile.building === 'PH_Camp')
    .map(({ q, r }) => ({ q, r }));
}

test('the map draws the camps it was dealt, and the raid’s warrior stands on one', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(RAID - 1));

  await open(page, SEED, 'PH_Deck');

  // Every camp stands beyond the city's sight at the founding: uncharted, and drawn not at all.
  const opened = await chronicleOf(page);
  const camps = campsOf(opened);
  expect(camps).toHaveLength(MAP_COMPOSITION.camps);
  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(false);
  }

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(true);
  }
  // The whole disc drawn, the buildings on it are the camps and the city's own wall.
  expect(await marksIn(page, 'buildings')).toBe(camps.length + 1);

  for (let turn = opened.turn; turn < RAID - 1; turn++) await endTurn(page);
  await stoppedTurn(page);

  const dealt = await chronicleOf(page);
  await take(page, dealt.deal.indexOf('PH_Raid'));

  const raided = await chronicleOf(page);
  const enemy = raided.units.find((unit) => unit.faction === 'enemy');

  expect(raided.turn).toBe(RAID);
  expect(enemy).toBeDefined();
  expect(camps.map(tileKey)).toContain(tileKey(enemy?.tile ?? raided.city));
  expect(problems).toEqual([]);
});
