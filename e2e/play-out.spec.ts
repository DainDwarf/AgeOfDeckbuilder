import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { growthThreshold } from '../src/rules/chronicle';
import { idle } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  chronicleOf,
  counted,
  endTurn,
  endTurnLabel,
  onScreen,
  open,
  playing,
  watch,
} from './chronicle-screen';

/**
 * The two turns this ends are safe on any seed: no event lands before the third turn, and a raid
 * landing on it enters its warriors on camps too far off to cross to the city by then.
 */
const SEED = 1;

/** What the broken motion throws, so the one problem of the run can be told from any other. */
const THROWN = 'this motion was broken from outside';

/** Longer than any motion of one stage stays in the air, so one left running has come down by then. */
const IN_THE_AIR = 1500;

/**
 * Breaks the next motion the chronicle screen raises: the first tween asked for puts the manager
 * back and throws instead, so one stage of the end of turn fails and every motion after it is
 * sound again.
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

/** What the two piles read on the chronicle screen. */
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

/** What the bar reads for each of those readings. */
function paintedReadings(page: Page, readings: readonly string[]): Promise<Record<string, string>> {
  return page.evaluate(
    (keys) =>
      Object.fromEntries(
        keys.map((key) => {
          const value = window.named?.(`reading-${key}-value`)?.object as
            | Phaser.GameObjects.Text
            | undefined;
          if (value === undefined) throw new Error(`there is no reading for ${key}`);
          return [key, value.text];
        }),
      ),
    readings,
  );
}

test('a motion that throws still ends the turn and gives the chronicle screen back', async ({
  page,
}) => {
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

  const readings: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(committed.resources).map(([key, count]) => [key, String(count)]),
    ),
    food: text('reading.over', {
      count: committed.resources.food,
      over: growthThreshold(committed),
    }),
    population: text('reading.over', { count: idle(committed), over: committed.population }),
  };
  expect(await paintedReadings(page, Object.keys(readings))).toEqual(readings);
  expect(await endTurnLabel(page)).toBe(text('button.turn', { turn: committed.turn }));
  expect(await counted(page, 'end-turn-leaving')).toBe(0);

  await endTurn(page);
  expect((await chronicleOf(page)).turn).toBe(opened.turn + 2);

  await expect.poll(() => problems.length).toBe(1);
  expect(problems[0]).toContain(THROWN);
});
