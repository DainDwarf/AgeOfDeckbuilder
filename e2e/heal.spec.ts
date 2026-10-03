import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { cardOf, unitKind } from '../src/rules/catalogue';
import { tileKey } from '../src/rules/map';
import { unitDamaged } from '../src/rules/schedule';
import { unitAt } from '../src/rules/units';
import {
  aimed,
  chronicleOf,
  cityTileOf,
  click,
  dragOut,
  firstSeed,
  idsOf,
  openSaved,
  playedAtUnit,
  playedOut,
  settledOn,
  unitEntered,
  watch,
  withCard,
} from './chronicle-screen';

/** The card that heals. */
const HEAL = 'heal';

/** The kind of the unit the spec hurts. */
const WARRIOR = 'warrior';

test('the heal card played at a damaged warrior on the city’s tile heals it to full health', async ({
  page,
}) => {
  const problems = watch(page);
  const full = unitKind(CATALOGUE, WARRIOR).health;
  const paid = firstSeed(`opens turn 1 on ${HEAL} in hand`, (seed) => {
    const opened = settledOn(seed, [], withCard(HEAL));
    if (!idsOf(opened.hand).includes(HEAL)) return undefined;
    const city = cityTileOf(opened);
    const standing = unitEntered(opened, { type: WARRIOR, faction: 'player', tile: city });
    const hurt = unitDamaged(standing, city, full - 1).chronicle;
    const chronicle = gained(hurt, cardOf(CATALOGUE, HEAL).cost).chronicle;
    return { chronicle, city, index: idsOf(chronicle.hand).indexOf(HEAL) };
  });
  const healed = playedAtUnit(paid.chronicle, paid.index, paid.city);

  await openSaved(page, paid.chronicle);
  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.city)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(healed);
  expect(unitAt(healed.units, paid.city)?.stats.health).toBe(full);
  expect(problems).toEqual([]);
});
