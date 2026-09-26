import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { cultureThreshold, growthThreshold } from '../src/rules/city';
import { type Chronicle, idle } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  counted,
  endedTurn,
  endTurn,
  endTurnLabel,
  firstSeed,
  onScreen,
  openSaved,
  playing,
  settledOn,
  waitGameClock,
  watch,
} from './chronicle-screen';

/** The first seed's turn 1, with no deal due on the two turns the spec ends. */
function settled(): Chronicle {
  return firstSeed('deals nothing on its second and third turns', (seed) => {
    const chronicle = settledOn(seed);
    return chronicle.timeline.next > chronicle.turn + 2 ? chronicle : undefined;
  });
}

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
    const scene = window.game?.scene.getScene('ui');
    if (scene === null || scene === undefined) {
      throw new Error('the ui scene is not running');
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
  test.setTimeout(budget(2));
  const opened = settled();
  const committed = outcome(apply(CATALOGUE, opened, { type: 'end-turn' }));

  await openSaved(page, opened);

  await breakNextMotion(page);
  const button = await onScreen(page, 'end-turn');
  await page.mouse.click(button.x, button.y);

  await expect.poll(async () => (await chronicleOf(page)).turn).toBe(committed.turn);
  expect(await playing(page)).toBe(false);

  await waitGameClock(page, IN_THE_AIR);

  expect(await chronicleOf(page)).toEqual(committed);
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
    culture: text('reading.over', {
      count: committed.resources.culture,
      over: cultureThreshold(committed),
    }),
    idle: String(idle(committed)),
  };
  expect(await paintedReadings(page, Object.keys(readings))).toEqual(readings);
  expect(await endTurnLabel(page)).toBe(text('button.end-turn'));
  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn: committed.turn }));
  expect(await counted(page, 'end-turn-leaving')).toBe(0);

  await endTurn(page);
  expect(await chronicleOf(page)).toEqual(endedTurn(committed));

  await expect.poll(() => problems.length).toBe(1);
  expect(problems[0]).toContain(THROWN);
});
