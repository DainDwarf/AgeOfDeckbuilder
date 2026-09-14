import { expect, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { refusalOf } from '../src/rules/chronicle';
import { playable } from '../src/rules/state';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import {
  chronicleOf,
  dragOut,
  endedTurn,
  endTurn,
  firstSeed,
  launch,
  open,
  watch,
} from './chronicle-screen';

/** The first seed whose second turn opens on a harvest card the city can pay for. */
function harvestSeed(): number {
  return firstSeed('opens its second turn on a playable harvest card', (seed) => {
    const chronicle = endedTurn(launch(seed, deckOf(STAND_IN, 'PH_Deck')));
    const found =
      chronicle.hand.includes('PH_Harvest') &&
      playable(refusalOf(STAND_IN, chronicle, 'PH_Harvest'));
    return found ? seed : undefined;
  });
}

test('the harvest card gains its two food when it is dragged out of the hand', async ({ page }) => {
  const problems = watch(page);

  await open(page, harvestSeed(), 'PH_Deck');
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
