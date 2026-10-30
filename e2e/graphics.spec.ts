import { expect, type Page, test } from '@playwright/test';
import { text } from '../src/ui/text';
import {
  budget,
  capstoneClosed,
  chronicleOf,
  click,
  endedTurn,
  endTurn,
  intoSettings,
  onDesignedSpeed,
  openSaved,
  playedOut,
  playing,
  reloadedOnCapstone,
  settledOn,
  standing,
  textOf,
  watch,
} from './chronicle-screen';

const OPENED = settledOn(1);

const ROW = 'graphics-animation-speed';

/** What the Animation speed row's button reads at that speed. */
function speedRead(speed: number): string {
  return text('graphics.speed', { speed });
}

/** From the chronicle screen into Graphics, the way the player walks there. */
async function intoGraphics(page: Page): Promise<void> {
  await intoSettings(page);
  await click(page, 'settings-graphics');
  await expect.poll(() => standing(page, 'graphics')).toBe(true);
}

/** A press on the row, waited for until it reads that speed. */
async function pressedTo(page: Page, speed: number): Promise<void> {
  await click(page, ROW);
  await expect.poll(() => textOf(page, `${ROW}-label`)).toBe(speedRead(speed));
}

/** Back onto the bare chronicle screen, on the back key. */
async function outOfGraphics(page: Page): Promise<void> {
  for (const behind of ['settings', 'menu']) {
    await page.keyboard.press('Escape');
    await expect.poll(() => standing(page, behind)).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
}

/** How many times faster than designed each of the chronicle screen's scenes plays its tweens. */
function scenesPlayAt(page: Page): Promise<(number | undefined)[]> {
  return page.evaluate(() =>
    ['map', 'ui', 'overlay'].map((key) => window.game?.scene.getScene(key).tweens.timeScale),
  );
}

test('a press on the row moves the speed on, kept across a reload, and ×4 goes back to ×1', async ({
  page,
}) => {
  const problems = watch(page);
  onDesignedSpeed(page);

  await openSaved(page, OPENED);
  await intoGraphics(page);
  expect(await textOf(page, `${ROW}-label`)).toBe(speedRead(1));
  expect(await scenesPlayAt(page)).toEqual([1, 1, 1]);

  await pressedTo(page, 2);
  await pressedTo(page, 4);
  expect(await scenesPlayAt(page)).toEqual([4, 4, 4]);

  await reloadedOnCapstone(page);
  expect(await scenesPlayAt(page)).toEqual([4, 4, 4]);
  await capstoneClosed(page);

  await intoGraphics(page);
  expect(await textOf(page, `${ROW}-label`)).toBe(speedRead(4));

  await pressedTo(page, 1);
  expect(await scenesPlayAt(page)).toEqual([1, 1, 1]);

  await click(page, 'graphics-back');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  expect(await standing(page, 'graphics')).toBe(false);
  await click(page, 'settings-graphics');
  await expect.poll(() => standing(page, 'graphics')).toBe(true);
  await outOfGraphics(page);

  expect(problems).toEqual([]);
});

test('an end of turn played out at ×4 finishes', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  onDesignedSpeed(page);

  await openSaved(page, OPENED);
  await intoGraphics(page);
  await pressedTo(page, 2);
  await pressedTo(page, 4);
  await outOfGraphics(page);

  await endTurn(page);
  expect(await chronicleOf(page)).toEqual(endedTurn(OPENED));

  expect(problems).toEqual([]);
});

test('a press over a play-out in the air takes at once, and the play-out finishes', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  onDesignedSpeed(page);

  await openSaved(page, OPENED);

  // The hand's tweens held in the air, so the walk into Graphics cannot outlast the end of turn.
  await page.evaluate(() => {
    window.game?.scene.getScene('ui').tweens.pauseAll();
  });
  await click(page, 'end-turn');
  await intoGraphics(page);
  await pressedTo(page, 2);
  expect(await playing(page)).toBe(true);
  expect(await scenesPlayAt(page)).toEqual([2, 2, 2]);

  await page.evaluate(() => {
    window.game?.scene.getScene('ui').tweens.resumeAll();
  });
  await playedOut(page);

  expect(problems).toEqual([]);
});

test('a spec opens at ×4: the three scenes play at it and the row reads it', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, OPENED);
  expect(await scenesPlayAt(page)).toEqual([4, 4, 4]);

  await intoGraphics(page);
  expect(await textOf(page, `${ROW}-label`)).toBe(speedRead(4));

  expect(problems).toEqual([]);
});
