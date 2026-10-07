import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { cardOf } from '../src/rules/catalogue';
import type { Chronicle } from '../src/rules/state';
import { DEFAULTS } from '../src/ui/bindings';
import type { PileKind } from '../src/ui/overlay';
import { cardRules, text } from '../src/ui/text';
import {
  besideTheCards,
  browse,
  cardOnFace,
  chronicleOf,
  click,
  consoleKey,
  cursorAt,
  endedTurn,
  firstSeed,
  hazardsAdded,
  heldFor,
  inside,
  kindLabelOnScreen,
  namedIn,
  namedOn,
  nameOnScreen,
  offsetOf,
  onScreen,
  openSaved,
  overflowingPiles,
  pileStacks,
  pileTop,
  readings,
  readOrder,
  rested,
  scrolled,
  selected,
  settledOn,
  standing,
  titleOf,
  tooltipText,
  tooltipUp,
  waitGameClock,
  watch,
  wheel,
} from './chronicle-screen';

/** Longer than the hand-over a small card waits out before it goes down, so one going has gone. */
const PAST_HANDOVER = 400;

/** The cursor over something that answers a left click or a rest. */
const HAND = 'pointer';

const PILES: readonly PileKind[] = ['draw-pile', 'discard-pile'];

/** The face whose spot on the page stands nearest the height `y`, and that spot; a tie goes to the first. */
function nearest<At extends { y: number }>(
  y: number,
  spots: readonly { face: string; at: At }[],
): { face: string; at: At } {
  let best: { face: string; at: At } | undefined;
  for (const spot of spots) {
    if (best === undefined || Math.abs(spot.at.y - y) < Math.abs(best.at.y - y)) best = spot;
  }
  if (best === undefined) throw new Error('no face to choose from');
  return best;
}

/**
 * Seed 1's turn 1, settled bare, a hazard added to its draw pile twice at the reading its counter
 * starts at and once at the next: two copies alike, and two of one card that read apart.
 */
function readingApart(): Chronicle {
  return hazardsAdded(settledOn(1), [0, 0, 1]);
}

test('a pile of more stacks than the frame holds scrolls under the wheel wherever the pointer stands, a notch off the frame moving it as far as the same notch over it, and stops on its first and last line', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, overflowingPiles());
  await browse(page, 'draw-pile');

  const opened = await scrolled(page);
  expect(opened.offset).toBe(0);
  expect(opened.overflow).toBeGreaterThan(0);

  await wheel(page, 120);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(0);
  const notch = await offsetOf(page);
  // Short of the last line, or a notch moved twice would stop there all the same.
  expect(notch).toBeLessThan(opened.overflow);
  await wheel(page, 4000);
  await expect.poll(() => offsetOf(page)).toBe(opened.overflow);
  await wheel(page, -4000);
  await expect.poll(() => offsetOf(page)).toBe(0);

  const title = await onScreen(page, 'browse-title');
  await page.mouse.move(title.x, title.y);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => offsetOf(page)).toBe(notch);
  await page.mouse.wheel(0, -4000);
  await expect.poll(() => offsetOf(page)).toBe(0);

  const frame = await onScreen(page, 'browse-frame');
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.down();
  await page.mouse.move(frame.x, frame.y - 60 * frame.unit, { steps: 6 });
  await page.mouse.move(frame.x, frame.y - 120 * frame.unit, { steps: 6 });
  await page.mouse.up();

  await expect.poll(() => offsetOf(page)).toBeGreaterThanOrEqual(120);
  expect(await standing(page, 'browse')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(false);

  await browse(page, 'discard-pile');

  const discarded = await scrolled(page);
  expect(discarded.offset).toBe(0);
  expect(discarded.overflow).toBeGreaterThan(0);
  await wheel(page, 4000);
  await expect.poll(() => offsetOf(page)).toBe(discarded.overflow);
  await wheel(page, -4000);
  await expect.poll(() => offsetOf(page)).toBe(0);

  expect(problems).toEqual([]);
});

test('a wheel turned with Control held moves a browse nothing, and a wheel over the debug console where it covers the frame scrolls it', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, overflowingPiles());
  await browse(page, 'draw-pile');
  await rested(page);
  const opened = await scrolled(page);
  expect(opened.offset).toBe(0);
  expect(opened.overflow).toBeGreaterThan(0);

  const frame = await onScreen(page, 'browse-frame');
  await page.mouse.move(frame.x, frame.y);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, 120);
  await page.keyboard.up('Control');
  await rested(page);
  await rested(page);
  expect(await offsetOf(page)).toBe(0);

  await consoleKey(page);
  const seen = await readings(page, ['console', 'browse-frame']);
  const strip = seen('console').boundsOnScreen;
  const framed = seen('browse-frame').boundsOnScreen;
  const covered = { x: framed.x + framed.width / 2, y: (framed.y + strip.y + strip.height) / 2 };
  expect(inside(covered, strip)).toBe(true);
  expect(inside(covered, framed)).toBe(true);
  await page.mouse.move(covered.x, covered.y);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(0);

  expect(problems).toEqual([]);
});

test('the two keys that pan the map up and down scroll a browse while they are held, wherever the pointer stands, and stop it on its last line and on its first; a tap moves it less than a hold, the two that pan it left and right move nothing, and a card shown large holds it still under them and under the wheel, over the frame and off it', async ({
  page,
}) => {
  const problems = watch(page);
  const [down] = DEFAULTS['pan-down'];
  const [up] = DEFAULTS['pan-up'];
  if (down === undefined || up === undefined) throw new Error('a pan key stands on no key');

  const opened = overflowingPiles();
  await openSaved(page, opened);
  await browse(page, 'draw-pile');
  const { overflow } = await scrolled(page);
  const away = await besideTheCards(page);
  await page.mouse.move(away.x, away.y);
  await rested(page);

  await page.keyboard.down(down.code);
  await expect.poll(() => offsetOf(page)).toBe(overflow);
  await waitGameClock(page, 200);
  expect(await offsetOf(page)).toBe(overflow);
  await page.keyboard.up(down.code);

  await page.keyboard.down(up.code);
  await expect.poll(() => offsetOf(page)).toBe(0);
  await page.keyboard.up(up.code);
  await rested(page);

  await page.keyboard.press(down.code);
  await rested(page);
  await rested(page);
  const tapped = await offsetOf(page);
  expect(tapped).toBeGreaterThan(0);

  const faces = pileStacks(opened.drawPile).map((_, at) => `browse-card-${at}`);
  const seen = await readings(page, ['browse-frame', ...faces]);
  const { at: shown } = nearest(
    seen('browse-frame').onScreen.y,
    faces.map((face) => ({ face, at: seen(face).onScreen })),
  );
  await page.mouse.click(shown.x, shown.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  expect(await heldFor(page, down.code, 200)).toBe(tapped);
  expect(await heldFor(page, up.code, 200)).toBe(tapped);
  await wheel(page, 120);
  const title = await onScreen(page, 'browse-title');
  await page.mouse.move(title.x, title.y);
  await page.mouse.wheel(0, 120);
  await rested(page);
  expect(await offsetOf(page)).toBe(tapped);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);

  for (const control of ['pan-left', 'pan-right'] as const) {
    for (const slot of DEFAULTS[control]) {
      if (slot === undefined) continue;
      expect(await heldFor(page, slot.code, 200)).toBe(tapped);
    }
  }

  expect(await heldFor(page, up.code, 200)).toBe(0);
  expect(await heldFor(page, down.code, 200)).toBeGreaterThan(tapped);

  expect(problems).toEqual([]);
});

test('a left click on a pile opens nothing; a right click opens its browse, a stack per card that reads the same with its copies on a badge, in the order of the collection; a stack answers no left click, a right click shows it large over the browse, the inspection key does nothing, and the back key walks back the card, then the browse, onto the selection', async ({
  page,
}) => {
  const problems = watch(page);

  const before = readingApart();
  const stacks = pileStacks(before.drawPile);
  await openSaved(page, before);

  const home = await onScreen(page, 'hand-0');
  for (const pile of PILES) {
    const at = await pileTop(page, pile);
    await page.mouse.click(at.x, at.y);
  }
  await rested(page);
  expect(await standing(page, 'browse')).toBe(false);

  await click(page, 'hand-0');
  await rested(page);
  expect(await selected(page, 0, home)).toBe(true);

  await browse(page, 'draw-pile');
  await rested(page);
  expect(await titleOf(page, 'browse')).toBe(
    text('browse.draw-pile', { count: before.drawPile.length }),
  );
  const seen = await readings(page, [
    ...stacks.flatMap((_, at) => [`browse-card-${at}`, `browse-card-${at}-copies`]),
    `browse-card-${stacks.length}`,
  ]);
  for (const [at, { card, copies }] of stacks.entries()) {
    expect(seen(`browse-card-${at}`).card).toBe(card.id);
    expect(seen(`browse-card-${at}-copies`).text).toBe(text('collection.row-copies', { copies }));
    expect(seen(`browse-card-${at}`).ringed).toBe(false);
  }
  expect(seen(`browse-card-${stacks.length}`).standing).toBe(false);
  const indices = stacks.map((_, index) => index);
  expect(readOrder(indices, (index) => seen(`browse-card-${index}`).place)).toEqual(indices);

  const first = seen('browse-card-0').onScreen;
  await page.mouse.click(first.x, first.y);
  await rested(page);
  const clicked = await readings(page, ['browse-card-0', 'inspection', 'browse']);
  expect(clicked('browse-card-0').ringed).toBe(false);
  expect(clicked('inspection').standing).toBe(false);
  expect(clicked('browse').standing).toBe(true);

  await page.keyboard.press('KeyI');
  await rested(page);
  const keyed = await readings(page, ['inspection', 'browse']);
  expect(keyed('inspection').standing).toBe(false);
  expect(keyed('browse').standing).toBe(true);

  await page.mouse.click(first.x, first.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(stacks[0].card.id);
  expect(await standing(page, 'browse')).toBe(true);

  // A card stands large, so the inspection key does nothing.
  await page.keyboard.press('KeyI');
  await rested(page);
  expect(await cardOnFace(page, 'inspection')).toBe(stacks[0].card.id);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(false);
  await rested(page);
  expect(await standing(page, 'menu')).toBe(false);
  expect(await selected(page, 0, home)).toBe(true);

  expect(await chronicleOf(page)).toEqual(before);
  expect(problems).toEqual([]);
});

test('a small card and a kind bubble raised off a browsed stack move with it as the wheel scrolls, and go down once the scroll takes what raised them out from under a still pointer', async ({
  page,
}) => {
  const problems = watch(page);

  const opened = overflowingPiles();
  await openSaved(page, opened);
  const faces = pileStacks(opened.drawPile).map((_, at) => `browse-card-${at}`);
  await browse(page, 'draw-pile');
  await rested(page);
  const opening = await readings(page, ['browse-frame', ...faces]);
  const frame = opening('browse-frame').onScreen;

  // Nearest the frame's middle: a face at an edge sits under the title or the mask, or runs out of scroll.
  const { face: named, at: name } = nearest(
    frame.y,
    faces
      .filter((face) => opening(face).drawsName)
      .map((face) => ({ face, at: opening(face).nameOnScreen })),
  );
  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(true);
  await rested(page);
  const small = await onScreen(page, 'small-card-0');

  // A quarter of the name's line: the name moves and stays under the pointer.
  const start = await offsetOf(page);
  await page.mouse.wheel(0, name.height / frame.unit / 4);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(start);
  await waitGameClock(page, PAST_HANDOVER);
  const wheeled = await readings(page, ['small-card-0', named]);
  expect(wheeled('small-card-0').standing).toBe(true);
  const carried = wheeled(named).nameOnScreen;
  const followed = wheeled('small-card-0').onScreen;
  expect(carried.y).toBeLessThan(name.y);
  expect(followed.x - carried.x).toBeCloseTo(small.x - name.x, 1);
  expect(followed.y - carried.y).toBeCloseTo(small.y - name.y, 1);

  await page.mouse.wheel(0, (2 * name.height) / frame.unit);
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  const away = await besideTheCards(page);
  await page.mouse.move(away.x, away.y, { steps: 5 });
  const scrolledTo = await readings(page, faces);
  const { face: labelled, at: label } = nearest(
    frame.y,
    faces.map((face) => ({ face, at: scrolledTo(face).kindLabelOnScreen })),
  );
  await page.mouse.move(label.x, label.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(true);
  await rested(page);
  const bubble = await onScreen(page, 'tooltip-overlay');

  const at = await offsetOf(page);
  await page.mouse.wheel(0, label.height / frame.unit / 4);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(at);
  await rested(page);
  const carriedOn = await readings(page, [labelled, 'tooltip-overlay']);
  const moved = carriedOn(labelled).kindLabelOnScreen;
  const beside = carriedOn('tooltip-overlay').onScreen;
  expect(await tooltipUp(page, 'tooltip-overlay')).toBe(true);
  expect(moved.y).toBeLessThan(label.y);
  expect(beside.x - moved.x).toBeCloseTo(bubble.x - label.x, 1);
  expect(beside.y - moved.y).toBeCloseTo(bubble.y - label.y, 1);

  await page.mouse.wheel(0, (2 * label.height) / frame.unit);
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(false);

  expect(problems).toEqual([]);
});

test('on the discard pile’s top card a rest on a name raises the named thing small and a right click on it shows it large, no browse rising; the kind label raises what the kind is; the pointer is the hand there and the arrow elsewhere on the piles', async ({
  page,
}) => {
  const problems = watch(page);

  const opened = firstSeed('ends its first turn on a card naming a thing', (seed) => {
    const ended = endedTurn(settledOn(seed));
    const top = ended.discardPile.at(-1);
    return top !== undefined && namedIn(cardRules(top)).length > 0 ? ended : undefined;
  });
  const top = opened.discardPile[opened.discardPile.length - 1];
  const [named] = namedIn(cardRules(top));
  await openSaved(page, opened);

  const face = 'discard-pile-top';
  const name = await nameOnScreen(page, face);
  expect(await cursorAt(page, name)).toBe(HAND);
  await expect.poll(() => namedOn(page, 'small-card-0')).toEqual(named);

  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => namedOn(page, 'inspection')).toEqual(named);
  await rested(page);
  expect(await standing(page, 'browse')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);

  const label = await kindLabelOnScreen(page, face);
  expect(await cursorAt(page, label)).toBe(HAND);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipText(page, 'tooltip-ui')).toBe(
    text(`tooltip.${cardOf(CATALOGUE, top.id).kind}`),
  );

  for (const pile of PILES) expect(await cursorAt(page, await pileTop(page, pile))).toBe('');

  expect(problems).toEqual([]);
});
