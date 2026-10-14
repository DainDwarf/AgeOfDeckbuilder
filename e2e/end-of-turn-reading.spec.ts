import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { cardOf, strikeOf } from '../src/rules/catalogue';
import { type Reckoning, reckoned } from '../src/rules/chronicle';
import { arrived } from '../src/rules/city';
import { RESOURCES } from '../src/rules/resources';
import type { Chronicle } from '../src/rules/state';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { type BarReading, css, LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  endedTurn,
  endTurn,
  firstSeed,
  hazardsAdded,
  openSaved,
  settledOn,
  watch,
} from './chronicle-screen';

/** The readings of the bar, in the order it reads them. */
const READINGS: readonly BarReading[] = [...RESOURCES, 'idle'];

/** What a reading's reckoning reads, and the ink it reads in. */
type Painted = { text: string; colour: string };

/** What each reading's reckoning reads on the screen, in one question to the page. */
function reckoningsShown(page: Page): Promise<Painted[]> {
  return page.evaluate(
    (keys) =>
      keys.map((key) => {
        const shown = window.named?.(`reading-${key}-reckoning`)?.object as
          | Phaser.GameObjects.Text
          | undefined;
        if (shown === undefined) throw new Error(`the ${key} reading reads no reckoning`);
        return { text: shown.text, colour: String(shown.style.color) };
      }),
    READINGS,
  );
}

/** What each reading's reckoning reads by the rules: what ending the turn on the chronicle would do. */
function reckoningsOf(chronicle: Chronicle): Painted[] {
  const read = reckoned(CATALOGUE, chronicle);
  return READINGS.map((key) => reckoningOf(read, key));
}

/** What one reading's reckoning reads, signed, in its colour where it is a take; nothing where none runs. */
function reckoningOf(read: Reckoning | undefined, key: BarReading): Painted {
  const painted = (count: number, taken: boolean): Painted => {
    const colour = css(taken ? LOOK.takenPastNothing : LOOK.ink);
    if (count > 0) return { text: text('reading.plus', { count }), colour };
    if (count < 0) return { text: text('reading.minus', { count: -count }), colour };
    return { text: '', colour };
  };
  if (read === undefined) return painted(0, false);
  switch (key) {
    case 'idle':
      return painted(read.population, read.population < 0);
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
      return painted(read.stocks[key], read.pastNothing.has(key));
  }
}

/** Whether the hand holds a card that strikes. */
function strikesInHand(chronicle: Chronicle): boolean {
  return chronicle.hand.some(({ id }) => strikeOf(cardOf(CATALOGUE, id)) !== undefined);
}

/**
 * The first seed's turn 2, one population arrived idle, the hazard drawn at a counter past the food
 * the turn holds and earns: its strike takes a population, and the city stands after it.
 */
function hungry(): Chronicle {
  return firstSeed('draws a strike past its food, the city standing after it', (seed) => {
    const peopled = arrived(settledOn(seed), 'player').chronicle;
    const next = endedTurn(peopled);
    const earned = reckoned(CATALOGUE, next);
    if (earned === undefined) return undefined;
    const past = next.resources.food + earned.stocks.food + 1;
    const drawn = endedTurn(hazardsAdded(peopled, [past]));
    if (!strikesInHand(drawn)) return undefined;
    const read = reckoned(CATALOGUE, drawn);
    if (read === undefined || !read.pastNothing.has('food') || read.population >= 0) {
      return undefined;
    }
    return endedTurn(drawn).ending === undefined ? drawn : undefined;
  });
}

test('on a quiet turn the bar reads after each stock what the income brings it, and nothing after idle', async ({
  page,
}) => {
  const problems = watch(page);
  const quiet = firstSeed('settles with no strike in hand', (seed) => {
    const settled = settledOn(seed);
    return strikesInHand(settled) ? undefined : settled;
  });

  await openSaved(page, quiet);

  expect(await reckoningsShown(page)).toEqual(reckoningsOf(quiet));

  expect(problems).toEqual([]);
});

test('the bar reads what ending the turn would do, a stock the strikes take past nothing and the population taken in their colour; nothing while the end of turn plays out, and the next hand’s once it stands', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const struck = hungry();

  await openSaved(page, struck);

  expect(await reckoningsShown(page)).toEqual(reckoningsOf(struck));

  const midway = page.waitForFunction(
    ({ keys, stood }) => {
      const scene = window.game?.scene.getScene<ChronicleScene>('ui');
      if (scene?.playing !== true || JSON.stringify(scene.chronicle.resources) === stood) {
        return undefined;
      }
      return keys.map(
        (key) =>
          (
            window.named?.(`reading-${key}-reckoning`)?.object as
              | Phaser.GameObjects.Text
              | undefined
          )?.text,
      );
    },
    { keys: READINGS, stood: JSON.stringify(struck.resources) },
  );
  await endTurn(page);
  expect(await (await midway).jsonValue()).toEqual(READINGS.map(() => ''));

  expect(await reckoningsShown(page)).toEqual(reckoningsOf(await chronicleOf(page)));

  expect(problems).toEqual([]);
});
