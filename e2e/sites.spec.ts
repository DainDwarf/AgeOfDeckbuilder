import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { tileAt, tileKey } from '../src/rules/map';
import { captureLore } from '../src/ui/lore';
import { buildingName } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  loreOf,
  openSaved,
  rested,
  settledOn,
  sitesOf,
  standing,
  stoppedTurn,
  titleOf,
  unitEntered,
  WARRIOR,
  watch,
} from './chronicle-screen';

test('a warrior standing on a site through the enemy phase captures it, and the capture’s window reads the site’s name and lore', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const bare = settledOn(1);
  const [site] = sitesOf(bare);
  if (site === undefined) throw new Error('seed 1 deals no site');
  const { building, q, r } = site;
  const chronicle = unitEntered(bare, { type: WARRIOR, faction: 'player', tile: { q, r } });
  const captured = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));

  await openSaved(page, chronicle);
  expect(await standing(page, `building-${tileKey(site)}`)).toBe(true);
  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);

  expect(await chronicleOf(page)).toEqual(captured);
  expect(tileAt(captured.tiles, site)?.building).toBeUndefined();
  expect(captured.deals[0]).toMatchObject({ of: 'capture', building });
  expect(await titleOf(page, 'deal')).toBe(buildingName(building));
  expect(await loreOf(page, 'deal')).toBe(captureLore(building));
  expect(problems).toEqual([]);
});
