import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { addedToDrawPileTop } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { CARD_WIDTH } from '../src/ui/card-frames';
import { cardFaceAtStart } from '../src/ui/face';
import {
  browse,
  cardOnFace,
  namedIn,
  openSaved,
  PAST_HANDOVER,
  pileStacks,
  type Reading,
  readings,
  rested,
  settledOn,
  standing,
  standsFor,
  waitGameClock,
  watch,
} from './chronicle-screen';

/** Where a name sits on the page, as a face's `namesOnScreen` reads it. */
type NameSpot = Reading['namesOnScreen'][number];

/** How far apart the pointer's steps up through the clear water fall, in page pixels. */
const STEP = 2;

/**
 * Seed 1's turn 1, settled bare, the first card of the catalogue whose rules entry names two things
 * added to its draw pile's top: that chronicle, and the card.
 */
function namingTwo(): { holding: Chronicle; naming: string } {
  const opened = settledOn(1);
  for (const naming of Object.keys(CATALOGUE.cards)) {
    const names = namedIn(cardFaceAtStart(CATALOGUE, naming, opened.citySection.building).rules);
    if (new Set(names.map(standsFor)).size < 2) continue;
    return { holding: addedToDrawPileTop(CATALOGUE, opened, naming).chronicle, naming };
  }
  throw new Error('no card of the catalogue names two things');
}

/**
 * Of the names a face draws, one standing on the line under another naming something else, the two
 * overlapping across: the lower, what it raises, the upper, and the middle of their overlap across.
 */
function stackedNames(face: Reading): {
  lower: NameSpot;
  raises: string;
  upper: NameSpot;
  x: number;
} {
  const spots = face.namesOnScreen;
  const raised = face.references.map(standsFor);
  for (const [at, lower] of spots.entries()) {
    for (const [over, upper] of spots.entries()) {
      if (raised[over] === raised[at]) continue;
      const left = Math.max(lower.x - lower.width / 2, upper.x - upper.width / 2);
      const right = Math.min(lower.x + lower.width / 2, upper.x + upper.width / 2);
      const onTheLineAbove =
        Math.abs(upper.y + upper.height / 2 - (lower.y - lower.height / 2)) < 1;
      if (onTheLineAbove && left < right) {
        return { lower, raises: raised[at], upper, x: (left + right) / 2 };
      }
    }
  }
  throw new Error('the face draws no name on the line above another, across from it');
}

/** Whether a point of the page lies on a name's box. */
function liesOnName({ x, y }: { x: number; y: number }, name: NameSpot): boolean {
  return Math.abs(x - name.x) <= name.width / 2 && Math.abs(y - name.y) <= name.height / 2;
}

test('a small card holds the pointer across the clear water to the name that raised it, over the name on the line above, as wide as its body and no wider', async ({
  page,
}) => {
  const problems = watch(page);
  const { holding, naming } = namingTwo();
  const stacks = pileStacks(holding.drawPile);
  const faces = stacks.map((_, at) => `browse-card-${at}`);
  const face = `browse-card-${stacks.findIndex(({ card }) => card.id === naming)}`;

  await openSaved(page, holding);
  await browse(page, 'draw-pile');
  await rested(page);
  const browsed = await readings(page, faces);
  const { lower, raises, upper, x } = stackedNames(browsed(face));

  await page.mouse.move(x, lower.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(raises);
  await rested(page);
  const foot = (await readings(page, ['small-card-0']))('small-card-0').placeOnScreen;
  const nameTop = lower.y - lower.height / 2;
  const water = { x, y: (foot.y + nameTop) / 2 };
  if (!liesOnName(water, upper))
    throw new Error('the clear water lies off the name on the line above');

  for (let y = lower.y - STEP; y > water.y; y -= STEP) {
    await page.mouse.move(x, y);
    const chain = await readings(page, ['small-card-0', 'small-card-1']);
    expect(chain('small-card-0').card).toBe(raises);
    expect(chain('small-card-1').standing).toBe(false);
  }
  await page.mouse.move(water.x, water.y);
  await waitGameClock(page, PAST_HANDOVER);
  const held = await readings(page, ['small-card-0', 'small-card-1']);
  expect(held('small-card-0').card).toBe(raises);
  expect(held('small-card-1').standing).toBe(false);

  await page.mouse.move(x, foot.y - STEP, { steps: 3 });
  await waitGameClock(page, PAST_HANDOVER);
  expect(await cardOnFace(page, 'small-card-0')).toBe(raises);

  await page.mouse.move(water.x, water.y, { steps: 3 });
  await page.mouse.click(water.x, water.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(raises);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);

  await page.mouse.move(x, lower.y, { steps: 3 });
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(raises);
  const beyond = { x: foot.x + (CARD_WIDTH / 2 + 4) * foot.unit, y: water.y };
  if (faces.some((one) => browsed(one).namesOnScreen.some((name) => liesOnName(beyond, name)))) {
    throw new Error('a name lies beside the small card across the clear water');
  }
  await page.mouse.move(beyond.x, beyond.y);
  await waitGameClock(page, PAST_HANDOVER);
  expect(await standing(page, 'small-card-0')).toBe(false);

  expect(problems).toEqual([]);
});
