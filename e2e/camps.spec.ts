import { expect, test } from '@playwright/test';
import { STAND_IN, STAND_IN_REGION } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { CENTRE, distance, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { regionOf } from '../src/rules/map-kinds';
import { offered } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { campLore } from '../src/ui/lore';
import { buildingName } from '../src/ui/text';
import {
  aimed,
  budget,
  chronicleOf,
  cityTileOf,
  click,
  consoleKey,
  dragOut,
  dragUnit,
  endTurn,
  enter,
  launch,
  loreOf,
  marksIn,
  open,
  openOnCapstone,
  playedOut,
  playersOf,
  rested,
  standing,
  stoppedTurn,
  take,
  titleOf,
  watch,
} from './chronicle-screen';

/** The seed this spec opens on: its map is dealt every camp the composition asks for. */
const SEED = 1;

/**
 * The turn this seed's timeline deals its first event on. The raid is among what it offers, and
 * every camp's tile holds the guard it opened with.
 */
const RAID = launch(SEED, deckOf(STAND_IN, 'PH_Deck')).timeline.next;

/** The tiles the generator put a camp on, in the order the map lists them. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => tile.building === STAND_IN.camp.building)
    .map(({ q, r }) => ({ q, r }));
}

test('the map draws the camps it was dealt, a guard on each, and the raid’s warrior stands beside one', async ({
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
    expect(unitAt(opened.units, camp)?.faction).toBe('enemy');
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
  const [deal] = dealt.deals;
  if (deal === undefined) throw new Error(`turn ${RAID} deals nothing`);
  await take(page, offered(STAND_IN, deal).indexOf('PH_Raid'));

  const raided = await chronicleOf(page);
  const enemy = raided.units.find((unit) => unit.id >= dealt.nextUnit);
  const tile = enemy?.tile ?? cityTileOf(raided);

  expect(raided.turn).toBe(RAID);
  expect(enemy?.faction).toBe('enemy');
  expect(camps.map((camp) => distance(camp, tile))).toContain(1);
  expect(problems).toEqual([]);
});

test('a warrior standing on a camp through the enemy phase captures it, and the capture’s window reads the camp’s name and lore', async ({
  page,
}) => {
  const problems = watch(page);
  // The take's landing plays out stages of its own, and so does the end of turn 1.
  test.setTimeout(budget(2));

  await openOnCapstone(page, SEED, 'PH_CampDeck', 'PH_CampSchedule');
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);

  await dragOut(page, 0);
  await aimed(page);
  await click(page, `tile-${tileKey(CENTRE)}`);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).city).toEqual(CENTRE);

  // On the city's tile the warrior stands one step from every tile the answer may place the camp on.
  await click(page, 'hand-0');
  await aimed(page);
  await click(page, `tile-${tileKey(CENTRE)}`);
  await playedOut(page);
  await expect.poll(async () => playersOf(await chronicleOf(page)).length).toBe(1);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  await take(page, 0);

  const placed = await chronicleOf(page);
  const camp = campsOf(placed).find((tile) => distance(tile, CENTRE) === 1);
  if (camp === undefined) throw new Error('the answer placed no camp beside the city');
  await dragUnit(page, CENTRE, camp);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);

  const captured = await chronicleOf(page);
  expect(tileAt(captured.tiles, camp)?.building).toBeUndefined();
  expect(captured.deals[0]?.of).toBe('camp');
  expect(await titleOf(page, 'deal')).toBe(buildingName(STAND_IN.camp.building));
  expect(await loreOf(page, 'deal')).toBe(campLore(STAND_IN.camp.building));
  expect(problems).toEqual([]);
});
