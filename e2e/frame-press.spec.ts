import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { addedTo, civilizationIn, removedFrom } from '../src/rules/campaign';
import { cardOf } from '../src/rules/catalogue';
import { tileKey } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import type { CardId, Chronicle } from '../src/rules/state';
import {
  BADGES,
  CARD_WIDTH,
  CARDS_SHEET_KEY,
  DISC,
  FRONTS,
  LARGE_WIDTH,
} from '../src/ui/card-frames';
import { BADGE_AT, discScaleOf, downOf, heightOf, unitOf } from '../src/ui/card-shape';
import { stacksOf } from '../src/ui/collection-layout';
import { cardFront, frontWindowOf } from '../src/ui/face';
import { LOOK } from '../src/ui/look';
import { cardName } from '../src/ui/text';
import {
  drawnFaces,
  firstSeed,
  inspected,
  openCollection,
  openSaved,
  panelFace,
  pilePressed,
  plantCampaign,
  playerCityTile,
  type Reading,
  reading,
  readings,
  rested,
  ringedTile,
  saved,
  selectionShown,
  settledOn,
  standing,
  watch,
} from './chronicle-screen';

/** Where the middle of the oval rim's rise over a card's top stands, in its own space at that width. */
function rimOf(width: number): { x: number; y: number } {
  return { x: 0, y: -heightOf(width) - (FRONTS.oval.rises / 2) * downOf(width) };
}

/**
 * A point over the top of a card of the hand's size, in its own space, between its first cost's disc
 * and its oval rim, where what stands under it shows: measured on the pack's front, whose rim's edge
 * no layout of the pack states.
 */
const BESIDE_RIM = { x: -30.5, y: -heightOf(CARD_WIDTH) - 3 };

/**
 * A pixel of the swords' picture standing past a card's left edge, its lower left, measured on the
 * pack's picture: the box it is painted in reaches past the edge only there.
 */
const SWORDS_PAST_EDGE = { x: 31, y: 234 };

/**
 * That pixel of the swords on a unit card of the hand's size, in its own space, through where its
 * badge stands and how much the disc's picture, handed that wide, is scaled by.
 */
function onSwords(discPicture: number): { x: number; y: number } {
  const scale = discScaleOf(CARD_WIDTH, discPicture);
  const { number } = BADGES.damage;
  return {
    x:
      -CARD_WIDTH / 2 +
      BADGE_AT.damage.x * unitOf(CARD_WIDTH) +
      (SWORDS_PAST_EDGE.x - number.x) * scale,
    y:
      -heightOf(CARD_WIDTH) +
      BADGE_AT.damage.y * downOf(CARD_WIDTH) +
      (SWORDS_PAST_EDGE.y - number.y) * scale,
  };
}

/** How wide the disc's picture is, as the game's cards sheet holds it. */
function discPictureWidth(page: Page): Promise<number> {
  return page.evaluate(
    ([sheet, file]) => {
      const frame = window.game?.textures.getFrame(sheet, file);
      if (frame === undefined) throw new Error('the game is not running');
      return frame.width;
    },
    [CARDS_SHEET_KEY, DISC.file] as const,
  );
}

/** A point of the face's own space on the page, through its place and its axes as the page reads them. */
function onPageOf(face: Reading, { x, y }: { x: number; y: number }): { x: number; y: number } {
  const { placeOnScreen: place, axes } = face;
  return {
    x: place.x + place.unit * (axes.x.x * x + axes.y.x * y),
    y: place.y + place.unit * (axes.x.y * x + axes.y.y * y),
  };
}

/** Whether the card wears an oval window, whose rim rises over its top. */
function oval(card: CardId): boolean {
  return frontWindowOf(cardFront(cardOf(CATALOGUE, card))) === 'oval';
}

/** The key of the tile the map draws under a point of the page: the one whose middle stands nearest. */
async function tileUnder(page: Page, chronicle: Chronicle, at: { x: number; y: number }) {
  const names = drawnFaces(chronicle).map((tile) => `tile-${tileKey(tile)}`);
  const seen = await readings(page, names);
  const [nearest] = names
    .map((name) => {
      const { x, y } = seen(name).onScreen;
      return { name, away: Math.hypot(x - at.x, y - at.y) };
    })
    .sort((one, other) => one.away - other.away);
  return nearest.name.slice('tile-'.length);
}

/** The first seed's chronicle settled with its first worker on the city, a card of oval window in hand. */
function workerAndOvalCard(): { chronicle: Chronicle; index: number } {
  return firstSeed('holds a card of oval window in hand, its first worker on the city', (seed) => {
    const chronicle = settledOn(seed, ['first-worker']);
    const index = chronicle.hand.findIndex(({ id }) => oval(id));
    return index === -1 ? undefined : { chronicle, index };
  });
}

test('a left click on the rim rising over the infopanel’s unit card, or on its swords past its left edge, reaches nothing under the card, and one beside the rim, where the map shows, selects the tile there', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle } = workerAndOvalCard();

  await openSaved(page, chronicle);
  await inspected(page, playerCityTile(chronicle));
  await rested(page);
  const face = await panelFace(page);
  const inspecting = await selectionShown(page);
  const swords = onSwords(await discPictureWidth(page));

  for (const on of [rimOf(CARD_WIDTH), swords]) {
    const at = onPageOf(face, on);
    await page.mouse.click(at.x, at.y);
    await rested(page);
    expect(await selectionShown(page)).toEqual(inspecting);
  }

  const beside = onPageOf(face, BESIDE_RIM);
  const under = await tileUnder(page, chronicle, beside);
  await page.mouse.click(beside.x, beside.y);
  await expect.poll(() => ringedTile(page)).toBe(under);

  expect(problems).toEqual([]);
});

test('the pointer on the rim rising over a card of the hand lifts it, and a right press on the rim of the card shown large leaves it standing', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, index } = workerAndOvalCard();
  const card = `hand-${index}`;

  await openSaved(page, chronicle);
  const rim = onPageOf(await reading(page, card), rimOf(CARD_WIDTH));
  await page.mouse.move(rim.x, rim.y);
  await expect.poll(async () => (await reading(page, card)).scale).toBe(LOOK.liftedCard);

  await page.mouse.click(rim.x, rim.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  await rested(page);
  const large = onPageOf(await reading(page, 'inspection'), rimOf(LARGE_WIDTH));
  await page.mouse.click(large.x, large.y, { button: 'right' });
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(true);

  expect(problems).toEqual([]);
});

test('in the deck editing mode a left click on the rim rising over a stack’s card adds a copy of it, as a click on its body does', async ({
  page,
}) => {
  const problems = watch(page);
  const fresh = freshCampaign(CATALOGUE);
  const [civilization] = Object.keys(fresh.civilizations);
  const { cards } = civilizationIn(CATALOGUE, fresh, civilization);
  const [first] = stacksOf(CATALOGUE, fresh.collection, cardName).filter(
    ({ id }) => oval(id) && cards.includes(id),
  );
  if (first === undefined) throw new Error('the first deck holds no card of oval window');
  const campaign = removedFrom(CATALOGUE, fresh, civilization, first.id);

  await plantCampaign(page, campaign);
  await openCollection(page);
  await pilePressed(page, civilization);
  const rim = onPageOf(await reading(page, `collection-card-${first.id}`), rimOf(CARD_WIDTH));
  await page.mouse.click(rim.x, rim.y);
  await saved(page, addedTo(CATALOGUE, campaign, civilization, first.id));

  expect(problems).toEqual([]);
});
