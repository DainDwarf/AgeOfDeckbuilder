import { expect, test } from 'vitest';
import type { Box } from './design-space';
import { createScroll, heldAt, PAN_SPEED, reachOf, type Scroll } from './scroll';

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

/** A drag down the panel by this far, fast, let go of on the canvas, and every frame of its fling. */
function flung(scroll: Scroll, by: number): void {
  scroll.grab(200);
  for (let at = 0; at <= 5; at++) scroll.drag(200 + (by * at) / 5, 1000 + 10 * at);
  scroll.release(1050, true);
  for (let frame = 0; frame < 2000; frame++) scroll.step(16);
}

test('a panel holding more than its room stops at its first line and at its last, however far the wheel, the drag and the fling carry it', () => {
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

test('a key held moves a panel as far as the map pans in that time, stops at its first line and at its last, stops a fling, and moves no panel a press is dragging', () => {
  const holds = 1000;
  const { scroll } = panelHolding(holds);

  scroll.pan(1, 100);
  expect(scroll.offset).toBe((PAN_SPEED * 100) / 1000);
  scroll.pan(-1, 50);
  expect(scroll.offset).toBe((PAN_SPEED * 50) / 1000);

  scroll.pan(-1, 5000);
  expect(scroll.offset).toBe(0);
  scroll.pan(1, 5000);
  expect(FRAME.y + holds - scroll.offset).toBe(FRAME.y + FRAME.height);

  scroll.stand(300);
  scroll.grab(200);
  for (let at = 0; at <= 5; at++) scroll.drag(200 - 40 * at, 1000 + 10 * at);
  const dragged = scroll.offset;
  scroll.pan(1, 100);
  expect(scroll.offset).toBe(dragged);
  scroll.release(1050, true);
  scroll.step(16);
  const flinging = scroll.offset;
  expect(flinging).toBeGreaterThan(dragged);
  scroll.pan(-1, 16);
  const stopped = scroll.offset;
  expect(stopped).toBe(flinging - (PAN_SPEED * 16) / 1000);
  for (let frame = 0; frame < 100; frame++) scroll.step(16);
  expect(scroll.offset).toBe(stopped);
});

test('a panel its room holds whole does not move, whatever the wheel, a key, the drag and the fling', () => {
  const { scroll, moves } = panelHolding(FRAME.height - 20);

  scroll.wheel(250);
  scroll.wheel(-250);
  scroll.pan(1, 1000);
  scroll.pan(-1, 1000);
  flung(scroll, -400);
  flung(scroll, 400);

  expect(scroll.offset).toBe(0);
  expect(moves).toEqual([]);
});

test('a panel laid again at the offset it stood at stands there, and one now holding less stands no further than its last line', () => {
  const holds = 1000;
  const { scroll } = panelHolding(holds);
  scroll.wheel(500);
  const stood = scroll.offset;

  const again = panelHolding(holds).scroll;
  again.stand(stood);
  const shorter = panelHolding(FRAME.height + 100).scroll;
  shorter.stand(stood);

  expect(stood).toBeGreaterThan(100);
  expect(again.offset).toBe(stood);
  expect(shorter.offset).toBe(100);
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
