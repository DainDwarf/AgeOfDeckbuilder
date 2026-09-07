import { expect, type Page, test } from '@playwright/test';
import { CARDS, DECKS } from '../src/rules/cards';
import {
  apply,
  beginChronicle,
  costOf,
  outcome,
  playable,
  refusalOf,
} from '../src/rules/chronicle';
import { tileAt, tileKey } from '../src/rules/map';
import type { CardId, Chronicle } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  aimed,
  chronicleOf,
  dragOut,
  endTurn,
  mapFrame,
  type OnScreen,
  onScreen,
  open,
  refusalLines,
  settled,
  standing,
  watch,
} from './chronicle-screen';

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
): Promise<{ opened: Chronicle; card: CardId; index: number; name: string; home: OnScreen }> {
  const run = refusedRun();
  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = refused(opened);
  const name = `hand-${index}`;
  const home = await onScreen(page, name);
  await dragOut(page, index);
  return { opened, card: opened.hand[index], index, name, home };
}

/** Longer than any motion on the chronicle screen takes to play out, so nothing is still on its way. */
const A_WHILE = 2000;

test('a card the rules refuse comes home, plays nothing, and stands its note over it', async ({
  page,
}) => {
  const problems = watch(page);

  const { opened, card, index, name, home } = await letGo(page);
  const said = reasons(opened, card);

  expect((await chronicleOf(page)).hand).toEqual(opened.hand);
  expect(await refusalLines(page)).toEqual(said);

  await expect.poll(() => onScreen(page, name).then((at) => Math.round(at.y - home.y))).toBe(0);

  const note = await onScreen(page, 'refusal');
  const beside = await onScreen(page, `hand-${index === 0 ? 1 : index - 1}`);
  expect(note.y).toBeLessThan(home.y);
  expect(Math.abs(note.x - home.x)).toBeLessThan(Math.abs(beside.x - home.x));

  await page.waitForTimeout(A_WHILE);
  expect(await refusalLines(page)).toEqual(said);

  expect(problems).toEqual([]);
});

/** Where an aimed card the city can pay for lies in the hand, or -1. */
function armed(chronicle: Chronicle): number {
  return chronicle.hand.findIndex(
    (id) => CARDS[id].aim === 'tile' && playable(refusalOf(chronicle, id)),
  );
}

/** The first seed with a turn in its first eight that opens on such a card. */
function armedRun(): { seed: number; turn: number } {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      if (armed(chronicle) !== -1) return { seed, turn };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
  }
  throw new Error('no seed under a thousand opens a turn on an aimed card the city can pay for');
}

test('a press on a tile an aim refuses says one reason over it, and the card stays armed', async ({
  page,
}) => {
  const problems = watch(page);
  const run = armedRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  // The city's own tile: on screen wherever the map stands, and refused by every aim in the deck,
  // no worker and no unit of the player's having entered yet.
  const opened = await chronicleOf(page);
  const index = armed(opened);
  const card = CARDS[opened.hand[index]];
  if (card.aim !== 'tile') throw new Error(`${opened.hand[index]} is aimed at no tile`);
  const tile = tileAt(opened.tiles, opened.city);
  if (tile === undefined) throw new Error('the city stands on no tile of the map');
  const block = card.refuses(opened, tile);
  if (block === undefined) throw new Error(`${opened.hand[index]} admits the city's own tile`);

  const face = await onScreen(page, `tile-${tileKey(opened.city)}`);
  await dragOut(page, index);
  await aimed(page);
  await page.mouse.click(face.x, face.y);
  await settled(page);

  expect(await refusalLines(page)).toEqual([text(`refusal.${block}`)]);
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  const note = await onScreen(page, 'refusal');
  expect(note.y).toBeLessThan(face.y);
  expect(Math.round(note.x - face.x)).toBe(0);

  expect(problems).toEqual([]);
});

test('a press on the chronicle screen takes the refusal note down at once', async ({ page }) => {
  const problems = watch(page);

  await letGo(page);
  expect(await standing(page, 'refusal')).toBe(true);

  const frame = await mapFrame(page);
  await page.mouse.click(frame.x + frame.width / 2, frame.y + 10);

  expect(await standing(page, 'refusal')).toBe(false);

  expect(problems).toEqual([]);
});
