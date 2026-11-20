import { expect, type Page, test } from '@playwright/test';
import { INTERFACE_SIZES, type InterfaceSize, sizeRead } from '../src/ui/interface-size';
import { text } from '../src/ui/text';
import {
  capstoneClosed,
  chronicleOf,
  click,
  endedTurn,
  endTurn,
  intoGraphics,
  onDesignedSpeed,
  openSaved,
  playedOut,
  playing,
  readings,
  reloadedOnCapstone,
  rested,
  settledOn,
  standing,
  textOf,
  watch,
} from './chronicle-screen';

const OPENED = settledOn(1);

const ROW = 'graphics-animation-speed';
const FULLSCREEN = 'graphics-fullscreen';
const SIZE = 'graphics-interface-size';

const WIDE = { width: 1920, height: 1080 };
const DESIGN_WINDOW = { width: 1280, height: 720 };

/** What the Animation speed row's button reads at that speed. */
function speedRead(speed: number): string {
  return text('graphics.speed', { speed });
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

/** A press on the Fullscreen row, waited for until it reads that. */
async function fullscreenPressed(page: Page, reads: 'graphics.on' | 'graphics.off'): Promise<void> {
  await click(page, FULLSCREEN);
  await expect.poll(() => textOf(page, `${FULLSCREEN}-label`)).toBe(text(reads));
}

/** Whether the browser holds anything fullscreen. */
function inFullscreen(page: Page): Promise<boolean> {
  return page.evaluate(() => document.fullscreenElement !== null);
}

/** Whether what the browser holds fullscreen paints the page's own ground around the design. */
function fullscreenOnThePage(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const held = document.fullscreenElement;
    return (
      held !== null &&
      getComputedStyle(held).backgroundColor ===
        getComputedStyle(document.documentElement).backgroundColor
    );
  });
}

/** How many times faster than designed each of the chronicle screen's scenes plays its tweens. */
function scenesPlayAt(page: Page): Promise<(number | undefined)[]> {
  return page.evaluate(() =>
    ['map', 'ui', 'overlay'].map((key) => window.game?.scene.getScene(key).tweens.timeScale),
  );
}

/** A press on the Interface size row, waited for until it reads that size and the screen is drawn at it. */
async function sizedTo(page: Page, size: InterfaceSize): Promise<void> {
  await click(page, SIZE);
  await expect.poll(() => textOf(page, `${SIZE}-label`)).toBe(sizeRead(size));
  await rested(page);
}

/**
 * How wide the hand's first card stands on the page, how many CSS pixels a unit of the chronicle
 * screen is drawn across, and how far the Graphics window's title stands off the window's middle.
 */
async function drawnAt(
  page: Page,
  width: number,
): Promise<{ card: number; unit: number; offMiddle: number }> {
  const seen = await readings(page, ['hand-0', 'graphics-title']);
  const card = seen('hand-0');
  const title = seen('graphics-title').boundsOnScreen;
  return {
    card: card.boundsOnScreen.width,
    unit: card.onScreen.unit,
    offMiddle: title.x + title.width / 2 - width / 2,
  };
}

test('the Graphics window lists Interface size third, and on a 1920 by 1080 window a press on it draws the chronicle screen under the menu at the next size at once, 200% and Largest at the size that holds 1280 by 720, kept across a reload', async ({
  page,
}) => {
  const problems = watch(page);
  const rows = [ROW, FULLSCREEN, SIZE, 'graphics-faction-signs'];
  const most = Math.min(WIDE.width / DESIGN_WINDOW.width, WIDE.height / DESIGN_WINDOW.height);

  await page.setViewportSize(WIDE);
  await openSaved(page, OPENED);
  await intoGraphics(page);
  const seen = await readings(page, [...rows, `${SIZE}-label`]);
  const downs = rows.map((row) => seen(row).boundsOnScreen.y);
  expect(downs).toEqual([...downs].sort((a, b) => a - b));
  expect(new Set(downs).size).toBe(rows.length);
  expect(seen(`${SIZE}-label`).text).toBe(sizeRead(100));

  const first = await drawnAt(page, WIDE.width);
  expect(first.unit).toBeCloseTo(1, 6);

  for (const [size, unit] of [
    [125, 1.25],
    [150, 1.5],
    [200, most],
    ['largest', most],
    [100, 1],
  ] as const) {
    await sizedTo(page, size);
    const drawn = await drawnAt(page, WIDE.width);
    expect(drawn.unit).toBeCloseTo(unit, 6);
    expect(drawn.card).toBeCloseTo(first.card * unit, 1);
    expect(drawn.offMiddle).toBeCloseTo(0, 0);
  }

  await sizedTo(page, 125);
  await reloadedOnCapstone(page);
  expect((await readings(page, ['hand-0']))('hand-0').onScreen.unit).toBeCloseTo(1.25, 6);
  await capstoneClosed(page);
  await intoGraphics(page);
  expect(await textOf(page, `${SIZE}-label`)).toBe(sizeRead(125));

  expect(problems).toEqual([]);
});

test('on a 1280 by 720 window every interface size draws the chronicle screen alike', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, OPENED);
  await intoGraphics(page);
  const first = await drawnAt(page, DESIGN_WINDOW.width);

  for (const size of [...INTERFACE_SIZES.slice(1), INTERFACE_SIZES[0]]) {
    await sizedTo(page, size);
    const drawn = await drawnAt(page, DESIGN_WINDOW.width);
    expect(drawn.unit).toBeCloseTo(1, 6);
    expect(drawn.card).toBeCloseTo(first.card, 1);
  }

  expect(problems).toEqual([]);
});

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

test('the Fullscreen row turns fullscreen and reads what the browser did', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, OPENED);
  await intoGraphics(page);
  expect(await textOf(page, `${FULLSCREEN}-label`)).toBe(text('graphics.off'));

  await fullscreenPressed(page, 'graphics.on');
  expect(await inFullscreen(page)).toBe(true);
  expect(await fullscreenOnThePage(page)).toBe(true);

  await click(page, 'graphics-back');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await click(page, 'settings-graphics');
  await expect.poll(() => standing(page, 'graphics')).toBe(true);
  expect(await textOf(page, `${FULLSCREEN}-label`)).toBe(text('graphics.on'));

  await fullscreenPressed(page, 'graphics.off');
  expect(await inFullscreen(page)).toBe(false);

  await fullscreenPressed(page, 'graphics.on');
  await page.evaluate(() => document.exitFullscreen());
  await expect.poll(() => textOf(page, `${FULLSCREEN}-label`)).toBe(text('graphics.off'));

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
