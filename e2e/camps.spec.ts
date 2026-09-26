import { expect, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { campsPlaced } from '../src/rules/schedule';
import { charted } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { campLore } from '../src/ui/lore';
import { buildingName } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  consoleKey,
  enter,
  loreOf,
  marksIn,
  openSaved,
  rested,
  settledOn,
  standing,
  stoppedTurn,
  titleOf,
  unitEntered,
  watch,
} from './chronicle-screen';

/** The unit kind of the player's that captures the camp. */
const WARRIOR = 'warrior';

/** The tiles the camp's building stands on, in the order the map lists them. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => tile.building === NOMADIC.camp.building)
    .map(({ q, r }) => ({ q, r }));
}

/**
 * Seed 1's turn 1 with one camp placed beside the city and nobody entered with it, and a warrior of
 * the player's entered on it; and the camp.
 */
function campBeside(): { chronicle: Chronicle; camp: TileCoords } {
  const bare = settledOn(NOMADIC, 1);
  const placing = campsPlaced(NOMADIC, bare, 1, [1, 1], 1);
  const [camp] = placing.placed;
  if (camp === undefined) throw new Error('seed 1 places no camp beside its city');
  const placed = charted(NOMADIC, placing.chronicle);
  const chronicle = unitEntered(placed, { type: WARRIOR, faction: 'player', tile: camp });
  return { chronicle, camp };
}

test('the map draws the camps it was dealt once the uncharted veil is off', async ({ page }) => {
  const problems = watch(page);
  const opened = settledOn(NOMADIC, 1);
  const camps = campsOf(opened);
  expect(camps.length).toBeGreaterThan(0);

  await openSaved(page, opened);

  // Every camp stands beyond the city's sight at the opening: uncharted, and drawn not at all.
  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(false);
  }

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(true);
  }
  // The whole disc drawn, the buildings on it are the camps and the city's own.
  expect(await marksIn(page, 'buildings')).toBe(camps.length + 1);
  expect(problems).toEqual([]);
});

test('a warrior standing on a camp through the enemy phase captures it, and the capture’s window reads the camp’s name and lore', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, camp } = campBeside();
  const captured = outcome(apply(NOMADIC, chronicle, { type: 'end-turn' }));

  await openSaved(page, chronicle);
  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);

  expect(await chronicleOf(page)).toEqual(captured);
  expect(tileAt(captured.tiles, camp)?.building).toBeUndefined();
  expect(captured.deals[0]?.of).toBe('camp');
  expect(await titleOf(page, 'deal')).toBe(buildingName(NOMADIC.camp.building));
  expect(await loreOf(page, 'deal')).toBe(campLore(NOMADIC.camp.building));
  expect(problems).toEqual([]);
});
