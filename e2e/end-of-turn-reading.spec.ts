import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { type Reckoning, reckoned } from '../src/rules/chronicle';
import { arrived, assignWaiting, claimWaiting } from '../src/rules/city';
import { RESOURCES } from '../src/rules/resources';
import type { Chronicle } from '../src/rules/state';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { CITY_BAR_STOCKS, cityBarOf } from '../src/ui/city-bar';
import { type BarReading, css, LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  chronicleOf,
  endedTurn,
  endTurn,
  firstSeed,
  hazardsAdded,
  hungry,
  inHand,
  onDesignedSpeed,
  onScreen,
  openSaved,
  playedOut,
  readings,
  rested,
  settledOn,
  strikesInHand,
  watch,
} from './chronicle-screen';

/** The readings of the bar, in the order it reads them. */
const READINGS: readonly BarReading[] = [...RESOURCES, 'idle'];

/** What a reading's reckoning reads, the ink it reads in, and whether it stands on its pill. */
type Painted = { text: string | undefined; colour: string | undefined; pill: boolean };

/**
 * What each reading's reckoning reads on the screen, and the share of food's bar and culture's that
 * stands paler past the stock, in one question to the page.
 */
async function reckoningsShown(page: Page): Promise<{ painted: Painted[]; paler: number[] }> {
  const names = READINGS.flatMap((key) => [`reading-${key}-reckoning`, `reading-${key}-pill`]);
  const bars = CITY_BAR_STOCKS.map((stock) => `reading-${stock}-bar`);
  const seen = await readings(page, [...names, ...bars]);
  return {
    painted: READINGS.map((key) => {
      const reckoning = seen(`reading-${key}-reckoning`);
      return {
        text: reckoning.text,
        colour: reckoning.ink,
        pill: seen(`reading-${key}-pill`).shows,
      };
    }),
    paler: bars.map((bar) => seen(bar).bar.past.share),
  };
}

/** Where the reading's act in city mode waits on the chronicle, so that it stands on the gold. */
function onGold(chronicle: Chronicle, key: BarReading): boolean {
  switch (key) {
    case 'culture':
      return claimWaiting(CATALOGUE, chronicle);
    case 'idle':
      return assignWaiting(chronicle);
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
      return false;
  }
}

/** What each reading's reckoning reads by the rules: what ending the turn on the chronicle would do. */
function reckoningsOf(chronicle: Chronicle): Painted[] {
  const read = reckoned(CATALOGUE, chronicle);
  return READINGS.map((key) => reckoningOf(read, key, onGold(chronicle, key)));
}

/**
 * What one reading's reckoning reads, signed: on its pill where it is a take past nothing, in the
 * colour of a gain or of a loss otherwise, those of the gold where it stands on it; nothing where
 * none runs.
 */
function reckoningOf(read: Reckoning | undefined, key: BarReading, gold: boolean): Painted {
  const painted = (count: number, taken: boolean): Painted => {
    const ink = gold
      ? { value: LOOK.metalInk, gain: LOOK.gainOnGold, loss: LOOK.lossOnGold }
      : { value: LOOK.charcoalInk, gain: LOOK.gain, loss: LOOK.loss };
    const colour = (shown: number): Painted['colour'] =>
      css(taken ? LOOK.takenPastNothingInk : shown);
    if (count > 0)
      return { text: text('reading.plus', { count }), colour: colour(ink.gain), pill: taken };
    if (count < 0) {
      return {
        text: text('reading.minus', { count: -count }),
        colour: colour(ink.loss),
        pill: taken,
      };
    }
    return { text: '', colour: colour(ink.value), pill: taken };
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

/** The share of food's bar and culture's that stands paler past the stock: what the turn would add. */
function palerOf(chronicle: Chronicle): number[] {
  const turn = reckoned(CATALOGUE, chronicle);
  return CITY_BAR_STOCKS.map((stock) => cityBarOf(chronicle, stock, turn?.stocks[stock]).added);
}

/** Each number of the list within a hair of the one at its place in the other. */
function closeTo(numbers: readonly number[]): unknown[] {
  return numbers.map((number) => expect.closeTo(number, 6));
}

test('on a quiet turn the bar reads after each stock what the income brings it in the colour of a gain, and nothing after idle', async ({
  page,
}) => {
  const problems = watch(page);
  const quiet = firstSeed('settles with no strike in hand', (seed) => {
    const settled = settledOn(seed);
    return strikesInHand(settled) ? undefined : settled;
  });
  const expected = reckoningsOf(quiet);
  expect(expected.some(({ text: shown }) => shown?.startsWith('+'))).toBe(true);

  await openSaved(page, quiet);

  const shown = await reckoningsShown(page);
  expect(shown.painted).toEqual(expected);
  expect(shown.paler).toEqual(closeTo(palerOf(quiet)));

  expect(problems).toEqual([]);
});

test('a strike the stock covers reads what it takes in the colour of a loss, on no pill', async ({
  page,
}) => {
  const problems = watch(page);
  const covered = firstSeed(
    'draws a strike its food stock covers past what the turn earns',
    (seed) => {
      const settled = settledOn(seed);
      for (let step = 0; step < 10; step++) {
        const drawn = endedTurn(hazardsAdded(settled, [step]));
        if (!strikesInHand(drawn)) continue;
        const read = reckoned(CATALOGUE, drawn);
        if (read !== undefined && read.stocks.food < 0 && !read.pastNothing.has('food')) {
          return drawn;
        }
      }
      return undefined;
    },
  );

  await openSaved(page, covered);

  const shown = await reckoningsShown(page);
  expect(shown.painted).toEqual(reckoningsOf(covered));
  expect(shown.painted[READINGS.indexOf('food')]).toEqual({
    text: expect.stringMatching(/^−/),
    colour: css(LOOK.loss),
    pill: false,
  });

  expect(problems).toEqual([]);
});

test('the bar reads what ending the turn would do, a stock the strikes take past nothing and the population taken on a pill; nothing while the end of turn plays out, the threshold’s bars paler by nothing, and the next hand’s once it stands', async ({
  page,
}) => {
  const problems = watch(page);
  const struck = hungry();
  onDesignedSpeed(page);

  await openSaved(page, struck);

  const opened = await reckoningsShown(page);
  expect(opened.painted).toEqual(reckoningsOf(struck));
  expect(opened.painted[READINGS.indexOf('food')].pill).toBe(true);
  expect(opened.painted[READINGS.indexOf('idle')].pill).toBe(true);

  const midway = page.waitForFunction(
    ({ keys, bars, stood }) => {
      const scene = window.game?.scene.getScene<ChronicleScene>('ui');
      if (scene?.playing !== true || JSON.stringify(scene.chronicle.resources) === stood) {
        return undefined;
      }
      const named = (name: string) => window.named?.(name)?.object;
      return {
        reckonings: keys.map(
          (key) => (named(`reading-${key}-reckoning`) as Phaser.GameObjects.Text | undefined)?.text,
        ),
        pills: keys.map(
          (key) =>
            (named(`reading-${key}-pill`) as Phaser.GameObjects.Rectangle | undefined)?.visible,
        ),
        bars: bars.map((bar) => window.readName?.(bar)?.bar),
      };
    },
    {
      keys: READINGS,
      bars: CITY_BAR_STOCKS.map((stock) => `reading-${stock}-bar`),
      stood: JSON.stringify(struck.resources),
    },
  );
  await endTurn(page);
  const seen = await (await midway).jsonValue();
  if (seen === undefined) throw new Error('waitForFunction resolved on no answer');
  expect(seen.reckonings).toEqual(READINGS.map(() => ''));
  expect(seen.pills).toEqual(READINGS.map(() => false));
  expect(seen.bars).toEqual(
    CITY_BAR_STOCKS.map(() => ({
      value: expect.objectContaining({ past: expect.objectContaining({ share: 0 }) }),
    })),
  );

  const next = await chronicleOf(page);
  const settled = await reckoningsShown(page);
  expect(settled.painted).toEqual(reckoningsOf(next));
  expect(settled.paler).toEqual(closeTo(palerOf(next)));

  expect(problems).toEqual([]);
});

test('a card played leaves the bar reading what ending the turn would do through its play-out, on the chronicle the screen shows at each change', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = firstSeed(
    'opens turn 2 on a card with a cost that plays at nothing the city can pay for, a unit card entering on the population arrived idle',
    (seed) => {
      const chronicle = endedTurn(arrived(settledOn(seed), 'player').chronicle);
      const index = inHand(
        chronicle,
        ({ aim, costs, playable }) => aim === 'none' && costs && playable,
      );
      return index === -1 ? undefined : { chronicle, index };
    },
  );
  onDesignedSpeed(page);

  await openSaved(page, opened);
  const card = await onScreen(page, `hand-${index}`);
  await page.mouse.click(card.x, card.y);
  await rested(page);

  const midway = page.waitForFunction(
    ({ keys, stood }) => {
      const scene = window.game?.scene.getScene<ChronicleScene>('ui');
      if (scene?.playing !== true || JSON.stringify(scene.chronicle.resources) === stood) {
        return undefined;
      }
      const named = (name: string) => window.named?.(name)?.object;
      const shown = keys.map((key) => {
        const reckoning = named(`reading-${key}-reckoning`) as Phaser.GameObjects.Text | undefined;
        const pill = named(`reading-${key}-pill`) as Phaser.GameObjects.Rectangle | undefined;
        return { text: reckoning?.text, colour: reckoning?.style.color, pill: pill?.visible };
      });
      return { chronicle: scene.chronicle, shown };
    },
    { keys: READINGS, stood: JSON.stringify(opened.resources) },
  );
  await page.mouse.click(card.x, card.y);
  const seen = await (await midway).jsonValue();
  if (seen === undefined) throw new Error('waitForFunction resolved on no answer');
  expect(seen.shown).toEqual(reckoningsOf(seen.chronicle));

  await playedOut(page);
  expect((await reckoningsShown(page)).painted).toEqual(reckoningsOf(await chronicleOf(page)));

  expect(problems).toEqual([]);
});
