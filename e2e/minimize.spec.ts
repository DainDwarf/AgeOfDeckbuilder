import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { sameTile, tileKey } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import type { Chronicle } from '../src/rules/state';
import { glyphFileOf } from '../src/ui/cast';
import { eventName } from '../src/ui/event-text';
import { LOOK } from '../src/ui/look';
import { cardName, text, unitName } from '../src/ui/text';
import {
  browse,
  campaignWith,
  cardOnFace,
  chronicleOf,
  claimMarked,
  click,
  cursorAt,
  dealMinimized,
  dealtAloneOn,
  dragBetween,
  type EndTurnWorn,
  endTurnWornOf,
  firstAdmitted,
  firstSeed,
  inCityMode,
  inspected,
  onScreen,
  openSaved,
  paidInHand,
  pieceOnScreenOf,
  pieceWorn,
  pieceWornOf,
  playedAtNothing,
  playerCityTile,
  playersOf,
  reacted,
  readings,
  rested,
  restedOnDeal,
  ringedTile,
  SCOUT,
  selected,
  selectionShown,
  shownCard,
  standing,
  stillAt,
  summaryRead,
  take,
  tooltipText,
  tooltipUp,
  unitEntered,
  watch,
} from './chronicle-screen';

/** The event the first test's window stands. */
const LEAN_SEASON = 'lean-season';

/** The card that deals the top of the draw pile. */
const CALENDAR = 'calendar';

/** The window's Minimize button, and the minimized window's ribbon, title and sunk button. */
const BUTTON = 'deal-minimize';
const RIBBON = 'minimized-deal-ribbon';
const TITLE = 'minimized-deal-title';
const SUNK = 'minimized-deal-minimize';

/**
 * The chronicle of the first seed whose turn 1 from a new campaign, settled bare and a scout of the
 * player's entered on its city, first deals the lean season alone, the scout still on the city and a
 * card in hand, stopped on that deal.
 */
function scoutUnderTheDeal(): Chronicle {
  const campaign = freshCampaign(CATALOGUE);
  return firstSeed(`deals the ${LEAN_SEASON} alone first over a scout on its city`, (seed) => {
    const dealt = dealtAloneOn(seed, LEAN_SEASON, campaign, (settled) =>
      unitEntered(settled, { type: SCOUT, faction: 'player', tile: playerCityTile(settled) }),
    );
    if (dealt === undefined || dealt.hand.length === 0) return undefined;
    const city = playerCityTile(dealt);
    return playersOf(dealt).some(({ tile }) => sameTile(tile, city)) ? dealt : undefined;
  });
}

/** What End turn wears, what its chip reads, nothing where it wears none, and whether it stands lighter. */
type EndTurnShown = EndTurnWorn & { chip: string | undefined; lighter: boolean };

/** What End turn shows, in one question to the page. */
async function endTurnShown(page: Page): Promise<EndTurnShown> {
  const read = await readings(page, [
    'end-turn',
    'end-turn-sign',
    'end-turn-count',
    'end-turn-veil',
  ]);
  const count = read('end-turn-count');
  return {
    ...endTurnWornOf(read),
    chip: count.standing ? count.text : undefined,
    lighter: read('end-turn-veil').standing,
  };
}

/** Whether the minimized window stands, and the deal window does not. */
async function standsMinimized(page: Page): Promise<boolean[]> {
  const seen = await readings(page, [RIBBON, 'deal']);
  return [seen(RIBBON).standing, seen('deal').standing];
}

test('the deal window minimized leaves its ribbon and its sunk button where they stood, the chronicle screen read under them and no card held or played, and the button, the ribbon and the back key each bring it back whole', async ({
  page,
}) => {
  const problems = watch(page);
  const dealt = scoutUnderTheDeal();
  const city = playerCityTile(dealt);
  const cityFace = `tile-${tileKey(city)}`;
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: firstAdmitted(dealt) }));

  await openSaved(page, dealt);
  await restedOnDeal(page);
  const whole = await readings(page, ['deal-ribbon', BUTTON]);
  expect(pieceWornOf(whole(BUTTON)).piece).toBe('silver');
  const button = whole(BUTTON).onScreen;
  await page.mouse.move(button.x, button.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(true);
  expect(await tooltipText(page, 'tooltip-overlay')).toBe(text('button.minimize'));

  await dealMinimized(page);
  const shown = await readings(page, [RIBBON, TITLE, SUNK, 'deal']);
  expect(shown('deal').standing).toBe(false);
  expect(shown(TITLE).text).toBe(eventName(LEAN_SEASON));
  expect(pieceWornOf(shown(SUNK)).piece).toBe('inactive-tab');
  for (const [now, was] of [
    [shown(RIBBON), whole('deal-ribbon')],
    [shown(SUNK), whole(BUTTON)],
  ]) {
    const [stands, stood] = [pieceOnScreenOf(now), pieceOnScreenOf(was)];
    for (const side of ['x', 'y', 'width', 'height'] as const) {
      expect(stands[side]).toBeCloseTo(stood[side], 3);
    }
  }
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipText(page, 'tooltip-ui')).toBe(text('button.minimize'));

  // A drag from the scout's tile takes hold of nothing and pans the map.
  const was = await onScreen(page, cityFace);
  await dragBetween(page, was, { x: was.x + 120 * was.unit, y: was.y });
  await rested(page);
  expect(await stillAt(page, cityFace, was)).toBe(false);
  expect(await ringedTile(page)).toBeUndefined();

  await inspected(page, city);
  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await standsMinimized(page)).toEqual([true, false]);

  const home = await onScreen(page, 'hand-0');
  await page.mouse.move(home.x, home.y);
  await expect.poll(async () => (await onScreen(page, 'hand-0')).y).toBeLessThan(home.y);
  const lifted = await onScreen(page, 'hand-0');
  await page.mouse.click(lifted.x, lifted.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(dealt.hand[0].id);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standsMinimized(page)).toEqual([true, false]);

  await click(page, 'hand-0');
  expect(await selected(page, 0, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(dealt);

  await browse(page, 'draw-pile');
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(false);
  await rested(page);
  expect(await standsMinimized(page)).toEqual([true, false]);

  await click(page, SUNK);
  await restedOnDeal(page);
  expect(await standsMinimized(page)).toEqual([false, true]);
  expect((await pieceWorn(page, BUTTON)).piece).toBe('silver');

  await dealMinimized(page);
  await click(page, RIBBON);
  await restedOnDeal(page);
  expect(await standsMinimized(page)).toEqual([false, true]);

  await dealMinimized(page);
  await page.keyboard.press('Escape');
  await restedOnDeal(page);
  expect(await standsMinimized(page)).toEqual([false, true]);

  await take(page, firstAdmitted(dealt));
  expect(await standing(page, 'deal')).toBe(false);
  expect(await chronicleOf(page)).toEqual(after);

  expect(problems).toEqual([]);
});

test('under the deal window minimized a left click selects a unit or a tile and lights nothing, city mode is entered and left with nothing aimed or acted on, and the back key walks back to the window last', async ({
  page,
}) => {
  const problems = watch(page);
  const dealt = scoutUnderTheDeal();
  const city = tileKey(playerCityTile(dealt));
  const cityFace = `tile-${city}`;
  const nothingAimed = { lit: [], marked: [], card: undefined };

  await openSaved(page, dealt);
  await dealMinimized(page);

  await click(page, cityFace);
  await reacted(page);
  expect(await selectionShown(page)).toEqual({
    selected: city,
    rings: [city],
    rims: [],
    ...nothingAimed,
  });
  expect((await summaryRead(page))?.name).toBe(unitName(SCOUT));
  await click(page, cityFace);
  await reacted(page);
  expect(await selectionShown(page)).toEqual({
    selected: city,
    rings: [],
    rims: [city],
    ...nothingAimed,
  });

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await click(page, 'reading-culture');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await claimMarked(page)).toEqual([]);
  expect((await selectionShown(page)).selected).toBeUndefined();

  // The inspection standing on the held tile goes with any play-out, a refused one included.
  const held = await onScreen(page, cityFace);
  await page.mouse.click(held.x, held.y);
  await reacted(page);
  await page.mouse.click(held.x, held.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBeDefined();
  const before = await selectionShown(page);
  expect(before.selected).toBe(city);
  await page.mouse.click(held.x, held.y);
  await reacted(page);
  expect(await chronicleOf(page)).toEqual(dealt);
  expect(await selectionShown(page)).toEqual(before);
  expect(await standing(page, 'refusal')).toBe(false);

  await page.keyboard.press('Escape');
  await reacted(page);
  expect(await selectionShown(page)).toEqual({ ...before, card: undefined });
  await page.keyboard.press('Escape');
  await reacted(page);
  expect((await selectionShown(page)).selected).toBeUndefined();
  expect(await inCityMode(page)).toBe(true);
  await page.keyboard.press('Escape');
  await reacted(page);
  expect(await inCityMode(page)).toBe(false);
  expect(await standsMinimized(page)).toEqual([true, false]);
  await page.keyboard.press('Escape');
  await restedOnDeal(page);
  expect(await standsMinimized(page)).toEqual([false, true]);

  expect(problems).toEqual([]);
});

test('while a deal stands End turn wears the steel, a speech balloon and no chip, and under the deal window minimized a left click on it brings the window back', async ({
  page,
}) => {
  const problems = watch(page);
  const dealt = scoutUnderTheDeal();
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: firstAdmitted(dealt) }));
  const waiting: EndTurnShown = {
    piece: 'steel',
    signs: [glyphFileOf('deal-waiting-button')],
    inks: [LOOK.greyedInk],
    chip: undefined,
    lighter: false,
  };

  await openSaved(page, dealt);
  await restedOnDeal(page);
  expect(await endTurnShown(page)).toEqual(waiting);

  await dealMinimized(page);
  expect(await endTurnShown(page)).toEqual(waiting);
  const button = await onScreen(page, 'end-turn');
  expect(await cursorAt(page, button)).toBe('pointing hand');
  expect(await endTurnShown(page)).toEqual({ ...waiting, lighter: true });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipText(page, 'tooltip-ui')).toBe(text('button.deal-waiting'));

  await page.mouse.down();
  await rested(page);
  expect(await endTurnShown(page)).toEqual({ ...waiting, lighter: true });
  await page.mouse.up();
  await restedOnDeal(page);
  expect(await standsMinimized(page)).toEqual([false, true]);
  expect(await chronicleOf(page)).toEqual(dealt);

  await take(page, firstAdmitted(dealt));
  expect(await chronicleOf(page)).toEqual(after);
  expect(await endTurnShown(page)).toEqual({
    piece: 'gold',
    signs: [glyphFileOf('end-turn-button')],
    inks: [LOOK.metalInk],
    chip: String(after.turn),
    lighter: false,
  });

  expect(problems).toEqual([]);
});

test('a card’s deal window minimizes under the card’s name, a left click on a card of the hand plays nothing, and a right click on the ribbon brings the window back', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = campaignWith([CALENDAR]);
  const { chronicle: opened, index } = paidInHand(CALENDAR, campaign);
  const dealt = playedAtNothing(opened, index);
  const taken = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));

  await openSaved(page, dealt, campaign);
  await dealMinimized(page);
  expect((await readings(page, [TITLE]))(TITLE).text).toBe(cardName(CALENDAR));

  const home = await onScreen(page, 'hand-0');
  await click(page, 'hand-0');
  expect(await selected(page, 0, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(dealt);

  const ribbon = await onScreen(page, RIBBON);
  await page.mouse.click(ribbon.x, ribbon.y, { button: 'right' });
  await restedOnDeal(page);
  expect(await standsMinimized(page)).toEqual([false, true]);

  await take(page, 0);
  expect(await chronicleOf(page)).toEqual(taken);

  expect(problems).toEqual([]);
});
