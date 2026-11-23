import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { capstoneReading } from '../src/rules/schedule';
import { type Chronicle, cardsInPiles } from '../src/rules/state';
import { capstoneName, capstoneText } from '../src/ui/event-text';
import { capstoneLore } from '../src/ui/lore';
import { text } from '../src/ui/text';
import type { Reference } from '../src/ui/text-run';
import {
  beforeTheLanding,
  capstoneClosed,
  cardOnFace,
  chronicleOf,
  cleared,
  click,
  idsOf,
  loreOf,
  namedIn,
  namedOnceIn,
  nameOnScreen,
  onScreen,
  openSaved,
  pieceOnScreenOf,
  playedOut,
  readings,
  rested,
  standing,
  stoppedTurn,
  titleOf,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The capstone's row of the ledger, and what a click on raises the capstone's window. */
const ROW = 'pinned-capstone';
const ROW_PRESS = `${ROW}-press`;

/** What the capstone's window draws its row of things from: each one's face, and a stack's holder. */
const NAMED = 'capstone-named';

test('the capstone’s landing holds the end of turn on its window over the hand the turn drew, a right click on a card its text names shows that card large and one on its paper nothing, and the landing plays out once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  const { before, landed } = beforeTheLanding(
    'stands on an open turn the turn before the capstone lands',
    (before, landed) => ({ before, landed }),
  );
  const capstone = before.timeline.capstone.id;
  const names = namedIn(capstoneText(capstone, capstoneReading(CATALOGUE, landed, capstone)));
  const naming = names.findIndex((reference) => reference.kind === 'card');
  if (naming === -1) throw new Error(`the text of the ${capstone} names no card`);
  const named = names[naming].id;

  await openSaved(page, before);
  expect(await standing(page, 'capstone')).toBe(false);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.word'));
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(capstone, 'landing'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(capstone);
  expect((await chronicleOf(page)).hand).toEqual(landed.hand);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length}`)).toBe(false);

  await rested(page);
  const drawn = (await readings(page, ['capstone-card-0']))('capstone-card-0');
  const { x, y, width } = drawn.boundsOnScreen;
  const title = drawn.answerNameOnScreen;
  const paper = { x: x + width / 2, y: (y + title.y - title.height / 2) / 2 };
  await page.mouse.click(paper.x, paper.y, { button: 'right' });
  await rested(page);
  const offNames = await readings(page, ['inspection', 'capstone']);
  expect([offNames('inspection').standing, offNames('capstone').standing]).toEqual([false, true]);

  const name = await nameOnScreen(page, 'capstone-card-0', naming);
  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);

  await click(page, 'capstone-card-0');
  await playedOut(page);
  expect(await standing(page, 'capstone')).toBe(false);
  await expect.poll(() => chronicleOf(page)).toEqual(landed);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length}`)).toBe(false);

  await rested(page);
  expect(await standing(page, 'capstone')).toBe(false);
  expect(problems).toEqual([]);
});

/** How many copies of the card the chronicle holds more than the one before it did. */
function addedTo(before: Chronicle, after: Chronicle, card: string): number {
  const copies = (chronicle: Chronicle): number =>
    idsOf(cardsInPiles(chronicle)).filter((id) => id === card).length;
  return copies(after) - copies(before);
}

/**
 * The first seed's open turn before its capstone lands, from the campaign, whose landing adds several
 * copies of a card the capstone's text names and deals nothing; its end of turn, what the text names,
 * the place among them of that card, and the copies the landing adds.
 */
function stackedLanding(campaign: Campaign): {
  readonly before: Chronicle;
  readonly landed: Chronicle;
  readonly names: readonly Reference[];
  readonly stacked: number;
  readonly copies: number;
} {
  return beforeTheLanding(
    'lands a capstone adding several copies of a card its text names, dealing nothing',
    (before, landed) => {
      if (landed.deals.length > 0) return undefined;
      const { id } = before.timeline.capstone;
      const names = namedOnceIn(capstoneText(id, capstoneReading(CATALOGUE, before, id)));
      const stacked = names.findIndex(
        ({ kind, id: card }) => kind === 'card' && addedTo(before, landed, card) > 1,
      );
      if (stacked === -1) return undefined;
      const copies = addedTo(before, landed, names[stacked].id);
      return { before, landed, names, stacked, copies };
    },
    { campaign, readied: cleared },
  );
}

/** Raises the capstone's window by a click of that button on the ledger's row, and rests. */
async function raisedFromRow(page: Page, button: 'left' | 'right'): Promise<void> {
  const at = await onScreen(page, ROW_PRESS);
  await page.mouse.click(at.x, at.y, { button });
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
}

test('a left click and a right click on the capstone’s row each raise its window, the promise read before the landing and the landing’s lore after it, the capstone on one panel beside everything its text names, a card the landing adds several copies of as one stack of them, and a left click on a card of the row closes the window onto the chronicle as it stood', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const { before, landed, names, stacked, copies } = stackedLanding(campaign);
  const capstone = before.timeline.capstone.id;
  const faces = names.map((_, at) => `${NAMED}-card-${at}`);
  const past = `${NAMED}-card-${names.length}`;
  const stack = `${NAMED}-stack-${stacked}`;
  const count = `${faces[stacked]}-copies`;

  await openSaved(page, before, campaign);
  const row = await readings(page, [`${ROW}-name`, `${ROW}-word`]);
  expect([row(`${ROW}-name`).text, row(`${ROW}-word`).text]).toEqual([
    capstoneName(capstone),
    text('capstone.word'),
  ]);

  await raisedFromRow(page, 'left');
  const seen = await readings(page, [
    'capstone-lore',
    'capstone-card-0',
    'capstone-plate',
    ...faces,
    past,
    stack,
    count,
  ]);
  expect([seen('capstone-lore').text, seen('capstone-card-0').card]).toEqual([
    capstoneLore(capstone, 'opening'),
    capstone,
  ]);
  expect(faces.map((face) => seen(face).card)).toEqual(names.map(({ id }) => id));
  expect([seen(past).standing, seen(stack).standing]).toEqual([false, true]);
  expect(seen(count).text).toBe(text('collection.row-copies', { copies }));
  const plate = pieceOnScreenOf(seen('capstone-plate'));
  for (const drawn of ['capstone-card-0', ...faces, count].map((name) => seen(name))) {
    const { x, width } = drawn.boundsOnScreen;
    expect(x).toBeGreaterThan(plate.x);
    expect(x + width).toBeLessThan(plate.x + plate.width);
  }

  await click(page, faces[stacked]);
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);
  expect(await standing(page, 'deal')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);

  await raisedFromRow(page, 'right');
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(capstone, 'opening'));
  await capstoneClosed(page);
  expect(await chronicleOf(page)).toEqual(before);

  await openSaved(page, landed, campaign);
  await raisedFromRow(page, 'left');
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(capstone, 'landing'));
  await click(page, faces[stacked]);
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);
  expect(await standing(page, 'deal')).toBe(false);
  expect(await chronicleOf(page)).toEqual(landed);

  expect(problems).toEqual([]);
});
