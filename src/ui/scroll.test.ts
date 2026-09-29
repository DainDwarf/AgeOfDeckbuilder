import { expect, test } from 'vitest';
import { type Box, createScroll, heldAt, reachOf, type Scroll } from './scroll';

/** A panel's frame: its first line stands at its top. */
const FRAME: Box = { x: 0, y: 100, width: 400, height: 300 };

/** A scroll over a panel whose lines run this far down from its first line's top. */
function panelHolding(holds: number): { scroll: Scroll; moves: number[] } {
  const moves: number[] = [];
  const scroll = createScroll((offset) => {
    moves.push(offset);
  });
  scroll.reach(reachOf(FRAME.height, holds));
  return { scroll, moves };
}

/** A drag down the panel by this far, fast, let go of on the canvas, and every frame of its run. */
function flung(scroll: Scroll, by: number): void {
  scroll.grab(200);
  for (let at = 0; at <= 5; at++) scroll.drag(200 + (by * at) / 5, 1000 + 10 * at);
  scroll.release(1050, true);
  for (let frame = 0; frame < 2000; frame++) scroll.step(16);
}

test('a panel holding more than its room stops at its first line and at its last, however far the wheel, the drag and the run carry it', () => {
  const holds = 1000;
  const { scroll } = panelHolding(holds);

  scroll.wheel(-250);
  expect(scroll.offset).toBe(0);

  scroll.wheel(5000);
  expect(FRAME.y + holds - scroll.offset).toBe(FRAME.y + FRAME.height);

  flung(scroll, 400);
  expect(scroll.offset).toBe(0);

  flung(scroll, -400);
  expect(FRAME.y + holds - scroll.offset).toBe(FRAME.y + FRAME.height);

  scroll.grab(200);
  scroll.drag(-5000, 1000);
  scroll.release(1000, false);
  expect(FRAME.y + holds - scroll.offset).toBe(FRAME.y + FRAME.height);
});

test('a panel its room holds whole does not move, whatever the wheel, the drag and the run', () => {
  const { scroll, moves } = panelHolding(FRAME.height - 20);

  scroll.wheel(250);
  scroll.wheel(-250);
  flung(scroll, -400);
  flung(scroll, 400);

  expect(scroll.offset).toBe(0);
  expect(moves).toEqual([]);
});

test('a card scrolled out of its panel answers nothing at the place it would stand, and the card scrolled in answers where it stands', () => {
  const first = { box: { x: 20, y: FRAME.y, width: 100, height: 140 } };
  const last = { box: { x: 20, y: FRAME.y + FRAME.height + 20, width: 100, height: 140 } };
  const cards = [first, last];
  const { scroll } = panelHolding(last.box.y + last.box.height - FRAME.y);

  expect(heldAt(FRAME, scroll.offset, cards, 70, last.box.y + 70)).toBeUndefined();
  expect(heldAt(FRAME, scroll.offset, cards, 70, first.box.y + 70)).toBe(first);

  scroll.wheel(200);
  const firstNow = first.box.y - scroll.offset;
  const lastNow = last.box.y - scroll.offset;

  const firstFoot = firstNow + first.box.height;
  expect(firstFoot).toBeLessThan(FRAME.y);
  expect(heldAt(FRAME, scroll.offset, cards, 70, firstFoot - 10)).toBeUndefined();
  expect(heldAt(FRAME, scroll.offset, cards, 70, lastNow + 70)).toBe(last);
});
