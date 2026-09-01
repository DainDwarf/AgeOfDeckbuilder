import { expect, test } from '@playwright/test';
import { apply, beginChronicle, playable, refusalOf } from '../src/rules/chronicle';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { chronicleOf, dragOut, endTurn, open, watch } from './table';

/** The first seed whose second turn opens on a harvest card the city can pay for. */
function harvestSeed(): number {
  for (let seed = 1; seed <= 1000; seed++) {
    const chronicle = apply(beginChronicle(seed), { type: 'end-turn' });
    if (chronicle.hand.includes('PH_Harvest') && playable(refusalOf(chronicle, 'PH_Harvest'))) {
      return seed;
    }
  }
  throw new Error('no seed under a thousand opens its second turn on a playable harvest card');
}

test('the harvest card gains its two food when it is dragged out of the hand', async ({ page }) => {
  const problems = watch(page);

  await open(page, harvestSeed());
  await endTurn(page);

  const before = await chronicleOf(page);
  await dragOut(page, before.hand.indexOf('PH_Harvest'));
  await page.waitForFunction(
    (held) =>
      window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.hand.length === held,
    before.hand.length - 1,
  );

  const after = await chronicleOf(page);
  const harvests = (hand: readonly string[]): number =>
    hand.filter((id) => id === 'PH_Harvest').length;

  expect(after.resources.food).toBe(before.resources.food + 2);
  expect(harvests(after.hand)).toBe(harvests(before.hand) - 1);
  expect(problems).toEqual([]);
});
