import { expect, type Page, test } from '@playwright/test';
import { CARDS, DECKS, refuses } from '../src/rules/cards';
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
  atTile,
  atTileRun,
  budget,
  chronicleOf,
  dragOut,
  dragUnit,
  endTurn,
  firstSeed,
  mapFrame,
  type OnScreen,
  onScreen,
  open,
  refusalLines,
  selected,
  settled,
  standing,
  unaffordableRun,
  watch,
} from './chronicle-screen';

/** The dearest card of the deck aimed at a tile: what a city in its first turns cannot pay for. */
const UNPAID: CardId = 'PH_Urbanisation';

/** Where a card the rules refuse lies in the hand, or -1. */
function refused(chronicle: Chronicle): number {
  return chronicle.hand.findIndex((id) => !playable(refusalOf(chronicle, id)));
}

/** Where a card the rules refuse that plays at nothing lies in the hand, or -1. */
function refusedAtNothing(chronicle: Chronicle): number {
  return chronicle.hand.findIndex(
    (id) => CARDS[id].aim === 'none' && !playable(refusalOf(chronicle, id)),
  );
}

/** The first seed with a turn in its first eight that opens on the card `lies` finds, named `such`. */
function refusedRun(
  such: string,
  lies: (chronicle: Chronicle) => number,
): { seed: number; turn: number } {
  return firstSeed(`opens a turn on ${such}`, (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      if (lies(chronicle) !== -1) return { seed, turn };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    return undefined;
  });
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
  const run = refusedRun('a card the rules refuse', refused);
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

test('a card the rules refuse stays selected, plays nothing, and stands its note over it', async ({
  page,
}) => {
  const problems = watch(page);

  const { opened, card, index, home } = await letGo(page);
  const said = reasons(opened, card);

  expect((await chronicleOf(page)).hand).toEqual(opened.hand);
  expect(await refusalLines(page)).toEqual(said);
  expect(await selected(page, index, home)).toBe(true);

  const note = await onScreen(page, 'refusal');
  const beside = await onScreen(page, `hand-${index === 0 ? 1 : index - 1}`);
  expect(note.y).toBeLessThan(home.y);
  expect(Math.abs(note.x - home.x)).toBeLessThan(Math.abs(beside.x - home.x));

  await page.waitForTimeout(A_WHILE);
  expect(await refusalLines(page)).toEqual(said);

  expect(problems).toEqual([]);
});

test('a press on a tile an aim refuses says one reason over it, and the card stays selected', async ({
  page,
}) => {
  const problems = watch(page);
  const run = atTileRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  // The city's own tile: on screen wherever the map stands, and refused by every aim in the deck,
  // no worker and no unit of the player's having entered yet.
  const opened = await chronicleOf(page);
  const index = atTile(opened);
  const card = CARDS[opened.hand[index]];
  if (card.aim !== 'tile') throw new Error(`${opened.hand[index]} is aimed at no tile`);
  const tile = tileAt(opened.tiles, opened.city);
  if (tile === undefined) throw new Error('the city stands on no tile of the map');
  const block = refuses(opened, card, tile);
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

test('a second click on a card the city cannot pay for says why over it, and it stays selected', async ({
  page,
}) => {
  const problems = watch(page);
  const run = refusedRun('a card the rules refuse that plays at nothing', refusedAtNothing);

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = refusedAtNothing(opened);
  const name = `hand-${index}`;
  const home = await onScreen(page, name);
  const said = reasons(opened, opened.hand[index]);

  await page.mouse.click(home.x, home.y);
  await settled(page);
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(home.x, home.y);
  await settled(page);
  expect(await refusalLines(page)).toEqual(said);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  expect(await selected(page, index, home)).toBe(true);
  expect(await refusalLines(page)).toEqual(said);

  expect(problems).toEqual([]);
});

test('a press on a lit tile the city cannot pay for says the cost over it, and the aim stands', async ({
  page,
}) => {
  const problems = watch(page);
  const run = unaffordableRun(UNPAID);
  // The run's ends of turn, the worker entered on the turn it opens, and the step it takes.
  test.setTimeout(budget(run.turn + 2));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.tile);

  const aiming = await chronicleOf(page);
  const card = await onScreen(page, `hand-${aiming.hand.indexOf(UNPAID)}`);
  await page.mouse.click(card.x, card.y);
  await aimed(page);

  const face = await onScreen(page, `tile-${tileKey(run.tile)}`);
  await page.mouse.click(face.x, face.y);
  await settled(page);

  expect(await refusalLines(page)).toEqual(reasons(aiming, UNPAID));
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(aiming);

  const note = await onScreen(page, 'refusal');
  expect(note.y).toBeLessThan(face.y);
  expect(note.x - face.x).toBeCloseTo(0, 0);

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
