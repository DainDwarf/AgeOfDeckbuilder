import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { aimOf, refuses } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { costOf, refusalOf } from '../src/rules/chronicle';
import { tileAt, tileKey } from '../src/rules/map';
import type { CardId, Chronicle } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  admits,
  aimed,
  bareWith,
  chronicleOf,
  cityTileOf,
  dragOut,
  inHand,
  type Judged,
  mapFrame,
  type OnScreen,
  onScreen,
  openSaved,
  refusalLines,
  rested,
  selected,
  standing,
  waitGameClock,
  watch,
  workerStepped,
} from './chronicle-screen';

/** Every reason the rules refuse this card, in the words the note says them in. */
function reasons(chronicle: Chronicle, id: CardId): string[] {
  const refusal = refusalOf(NOMADIC, chronicle, id);
  return [
    ...costOf(NOMADIC, id)
      .filter(({ resource }) => refusal.unaffordable.includes(resource))
      .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount })),
    ...refusal.blocked.map((block) => text(`refusal.${block}`)),
  ];
}

/** The first card the rules refuse on turn 1, dragged past the play height and released on the canvas. */
async function letGo(
  page: Page,
): Promise<{ opened: Chronicle; card: CardId; index: number; name: string; home: OnScreen }> {
  const { chronicle: opened, index } = bareWith(
    'a card the rules refuse',
    ({ playable }) => !playable,
  );
  await openSaved(page, opened);

  const name = `hand-${index}`;
  const home = await onScreen(page, name);
  await dragOut(page, index);
  return { opened, card: opened.hand[index].id, index, name, home };
}

/** Longer than any motion on the chronicle screen takes to play out, so nothing is still on its way. */
const A_WHILE = 2000;

test('a card the rules refuse stays selected, plays nothing, and stands its note over it', async ({
  page,
}) => {
  const problems = watch(page);

  const { opened, card, index, home } = await letGo(page);
  const said = reasons(opened, card);

  expect(await chronicleOf(page)).toEqual(opened);
  expect(await refusalLines(page)).toEqual(said);
  expect(await selected(page, index, home)).toBe(true);

  const note = await onScreen(page, 'refusal');
  const beside = await onScreen(page, `hand-${index === 0 ? 1 : index - 1}`);
  expect(note.y).toBeLessThan(home.y);
  expect(Math.abs(note.x - home.x)).toBeLessThan(Math.abs(beside.x - home.x));

  await waitGameClock(page, A_WHILE);
  expect(await refusalLines(page)).toEqual(said);

  expect(problems).toEqual([]);
});

test('a press on a tile an aim refuses says one reason over it, and the card stays selected', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareWith(
    'a card aimed at a tile the city can pay for',
    ({ aim, playable }) => aim === 'tile' && playable,
  );

  // The city's own tile: on screen wherever the map stands, and refused by every aim in the deck,
  // no worker and no unit of the player's having entered yet.
  const { id } = opened.hand[index];
  const card = aimOf(cardOf(NOMADIC, id));
  if (card.aim !== 'tile') throw new Error(`${id} is aimed at no tile`);
  const tile = tileAt(opened.tiles, cityTileOf(opened));
  if (tile === undefined) throw new Error('the city stands on no tile of the map');
  const block = refuses(NOMADIC, opened, card, tile);
  if (block === undefined) throw new Error(`${id} admits the city's own tile`);

  await openSaved(page, opened);
  const face = await onScreen(page, `tile-${tileKey(cityTileOf(opened))}`);
  await dragOut(page, index);
  await aimed(page);
  await page.mouse.click(face.x, face.y);
  await rested(page);

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
  const { chronicle: opened, index } = bareWith(
    'a card the rules refuse that plays at nothing',
    ({ aim, playable }) => aim === 'none' && !playable,
  );

  await openSaved(page, opened);
  const name = `hand-${index}`;
  const home = await onScreen(page, name);
  const said = reasons(opened, opened.hand[index].id);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await refusalLines(page)).toEqual(said);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(await selected(page, index, home)).toBe(true);
  expect(await refusalLines(page)).toEqual(said);

  expect(problems).toEqual([]);
});

test('a press on a lit tile the city cannot pay for says the cost over it, and the aim stands', async ({
  page,
}) => {
  const problems = watch(page);
  const unpaid = ({ aim, playable }: Judged): boolean => aim === 'tile' && !playable;
  const { stepped: aiming, tile } = workerStepped(
    'steps its first worker onto a tile a card aimed at a tile the city cannot pay for admits',
    (stepped, at) => admits(stepped, inHand(stepped, unpaid), at),
  );
  const index = inHand(aiming, unpaid);

  await openSaved(page, aiming);
  const card = await onScreen(page, `hand-${index}`);
  await page.mouse.click(card.x, card.y);
  await aimed(page);

  const face = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.click(face.x, face.y);
  await rested(page);

  expect(await refusalLines(page)).toEqual(reasons(aiming, aiming.hand[index].id));
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
