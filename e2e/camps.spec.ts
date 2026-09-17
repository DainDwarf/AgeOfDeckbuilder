import { expect, test } from '@playwright/test';
import { STAND_IN, STAND_IN_REGION } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { type TileCoords, tileKey } from '../src/rules/map';
import { regionOf } from '../src/rules/map-kinds';
import { offered } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  cityTileOf,
  consoleKey,
  endTurn,
  enter,
  launch,
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
 * The turn this seed's timeline deals its first event on. The raid is among what it offers, and
 * every camp's tile is free for it, the city having entered no unit of its own.
 */
const RAID = launch(SEED, deckOf(STAND_IN, 'PH_Deck')).timeline.next;

/** The tiles the generator put a camp on, in the order the map lists them. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => tile.building === STAND_IN.camp.building)
    .map(({ q, r }) => ({ q, r }));
}

test('the map draws the camps it was dealt, and the raid’s warrior stands on one', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(RAID - 1));

  await open(page, SEED, 'PH_Deck');

  // Every camp stands beyond the city's sight at the opening: uncharted, and drawn not at all.
  const opened = await chronicleOf(page);
  const camps = campsOf(opened);
  expect(camps).toHaveLength(regionOf(STAND_IN, STAND_IN_REGION).camps);
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

  const [deal] = (await chronicleOf(page)).deals;
  if (deal === undefined) throw new Error(`turn ${RAID} deals nothing`);
  await take(page, offered(STAND_IN, deal).indexOf('PH_Raid'));

  const raided = await chronicleOf(page);
  const enemy = raided.units.find((unit) => unit.faction === 'enemy');

  expect(raided.turn).toBe(RAID);
  expect(enemy).toBeDefined();
  expect(camps.map(tileKey)).toContain(tileKey(enemy?.tile ?? cityTileOf(raided)));
  expect(problems).toEqual([]);
});
