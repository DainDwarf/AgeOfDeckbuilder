import { expect, type Page, test } from '@playwright/test';
import { type CardId, DECKS } from '../src/rules/cards';
import {
  apply,
  beginChronicle,
  type Chronicle,
  costOf,
  outcome,
  playable,
  refusalOf,
} from '../src/rules/chronicle';
import { text } from '../src/ui/text';
import {
  chronicleOf,
  dragOut,
  endTurn,
  mapFrame,
  type OnScreen,
  onScreen,
  onTable,
  open,
  refusalLines,
  watch,
} from './table';

/** Where a card the rules refuse lies in the hand, or -1. */
function refused(chronicle: Chronicle): number {
  return chronicle.hand.findIndex((id) => !playable(refusalOf(chronicle, id)));
}

/** The first seed with a turn in its first eight that opens on such a card. */
function refusedRun(): { seed: number; turn: number } {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      if (refused(chronicle) !== -1) return { seed, turn };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
  }
  throw new Error('no seed under a thousand opens a turn on a card the rules refuse');
}

/** Every reason the rules refuse this card, in the words the note says them in. */
function reasons(chronicle: Chronicle, id: CardId): string[] {
  const refusal = refusalOf(chronicle, id);
  return [
    ...costOf(id)
      .filter(({ resource }) => refusal.unaffordable.includes(resource))
      .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount })),
    ...refusal.blocked.map((block) => text(`refusal.${block}`)),
  ];
}

/** The card the run's turn opens on, dragged past the play height and released on the canvas. */
async function letGo(
  page: Page,
): Promise<{ opened: Chronicle; card: CardId; name: string; home: OnScreen }> {
  const run = refusedRun();
  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = refused(opened);
  const name = `hand-${index}`;
  const home = await onScreen(page, name);
  await dragOut(page, index);
  return { opened, card: opened.hand[index], name, home };
}

test('a card the rules refuse comes home, plays nothing, and says why', async ({ page }) => {
  const problems = watch(page);

  const { opened, card, name, home } = await letGo(page);

  expect((await chronicleOf(page)).hand).toEqual(opened.hand);
  expect(await refusalLines(page)).toEqual(reasons(opened, card));

  await expect.poll(() => onScreen(page, name).then((at) => Math.round(at.y - home.y))).toBe(0);
  await expect.poll(() => onTable(page, 'refusal')).toBe(false);

  expect(problems).toEqual([]);
});

test('a press on the table takes the refusal note down at once', async ({ page }) => {
  const problems = watch(page);

  await letGo(page);
  expect(await onTable(page, 'refusal')).toBe(true);

  const frame = await mapFrame(page);
  await page.mouse.click(frame.x + frame.width / 2, frame.y + 10);

  expect(await onTable(page, 'refusal')).toBe(false);

  expect(problems).toEqual([]);
});
