import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { chronicleOf, counted, endTurn, onScreen, open, playing, watch } from './table';

/** No enemy arrives before the fifth turn, so the two turns this ends are safe on any seed. */
const SEED = 1;

/** What the broken motion throws, so the one problem of the run can be told from any other. */
const THROWN = 'this motion was broken from outside';

/** Longer than any motion of one stage stays in the air, so one left running has come down by then. */
const IN_THE_AIR = 1500;

/**
 * Breaks the next motion the table raises: the first tween asked for puts the manager back and
 * throws instead, so one stage of the end of turn fails and every motion after it is sound again.
 */
async function breakNextMotion(page: Page): Promise<void> {
  await page.evaluate((thrown) => {
    const scene = window.game?.scene.getScene('chronicle');
    if (scene === null || scene === undefined) {
      throw new Error('the chronicle scene is not running');
    }
    const tweens = scene.tweens;
    const raise = tweens.add;
    tweens.add = () => {
      tweens.add = raise;
      throw new Error(thrown);
    };
  }, THROWN);
}

/** What the two piles read on the table. */
function paintedPiles(page: Page): Promise<{ draw: string; discard: string }> {
  return page.evaluate(() => {
    const reading = (name: string): string => {
      const count = window.named?.(name)?.object as Phaser.GameObjects.Text | undefined;
      if (count === undefined) throw new Error(`there is no ${name}`);
      return count.text;
    };
    return { draw: reading('draw-pile-count'), discard: reading('discard-pile-count') };
  });
}

test('a motion that throws still ends the turn and gives the table back', async ({ page }) => {
  const problems = watch(page);

  await open(page, SEED, 'PH_LongDeck');
  const opened = await chronicleOf(page);

  await breakNextMotion(page);
  const button = await onScreen(page, 'end-turn');
  await page.mouse.click(button.x, button.y);

  await expect.poll(async () => (await chronicleOf(page)).turn).toBe(opened.turn + 1);
  expect(await playing(page)).toBe(false);

  await page.waitForTimeout(IN_THE_AIR);

  const committed = await chronicleOf(page);
  expect(await paintedPiles(page)).toEqual({
    draw: String(committed.drawPile.length),
    discard: String(committed.discardPile.length),
  });
  const faces = await Promise.all(committed.hand.map((_, index) => counted(page, `hand-${index}`)));
  expect(faces).toEqual(committed.hand.map(() => 1));
  expect(await counted(page, `hand-${committed.hand.length}`)).toBe(0);

  await endTurn(page);
  expect((await chronicleOf(page)).turn).toBe(opened.turn + 2);

  await expect.poll(() => problems.length).toBe(1);
  expect(problems[0]).toContain(THROWN);
});
