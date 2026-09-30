/** What scrolls on a screen computes before it draws: how far it moves, and what answers where. */

import type { Box } from './design-space';

/** The pointer's travel over these last milliseconds is the speed a release runs the scroll on at. */
const FLING_WINDOW = 80;

/** What is left of a fling's speed after a millisecond, and the speed it is dropped at. */
const FLING_DECAY = 0.994;
const FLING_STILL = 0.01;

/** How fast a held key pans the map, and moves whatever else it moves, in design pixels a second. */
export const PAN_SPEED = 1200;

/** How many of the pointer's last places a drag keeps. */
const TRAIL = 8;

type Sample = { readonly time: number; readonly y: number };

/** Where a drag was pressed, how far the scroll stood then, and where the pointer has been since. */
type Drag = { readonly y: number; readonly from: number; readonly trail: Sample[] };

/** How far a room scrolls over what it holds, both as tall as they stand: zero where it holds it whole. */
export function reachOf(room: number, holds: number): number {
  return Math.max(0, holds - room);
}

export type Scroll = {
  /** How far it is scrolled: zero at its first line, its reach at its last. */
  readonly offset: number;
  /** Whether a press is dragging it. */
  readonly dragged: boolean;
  /** How far it scrolls from here on, the offset held within it. */
  reach(reach: number): void;
  /** Stands at this offset, held within its reach, neither dragged nor running on. */
  stand(at: number): void;
  /** A press on it: a fling stops. */
  press(): void;
  /** The wheel turned by this much: a fling stops, and it moves as far. */
  wheel(by: number): void;
  /**
   * One frame of a key held, this many milliseconds long, down above zero: a fling stops, and it
   * moves at the pan speed; while it is dragged it holds still.
   */
  pan(way: number, delta: number): void;
  /** A drag begun where its press landed, at this height of the design space. */
  grab(y: number): void;
  /** The pointer dragging it, at this height and this time. */
  drag(y: number, time: number): void;
  /** The drag let go of at this time: it runs on at the drag's speed where it `runs`, and stands where not. */
  release(time: number, runs: boolean): void;
  /** One frame of a fling, this many milliseconds long. */
  step(delta: number): void;
};

/**
 * A scroll with the browse's feel, standing at its first line with nothing to reach until it is told
 * its reach: `moved` is told every offset it moves to.
 */
export function createScroll(moved: (offset: number) => void): Scroll {
  let offset = 0;
  let furthest = 0;
  /** The fling's speed in design units a millisecond, and zero while it stands. */
  let fling = 0;
  let held: Drag | undefined;

  const moveTo = (at: number): void => {
    const was = offset;
    offset = Math.min(Math.max(at, 0), furthest);
    if (offset !== was) moved(offset);
  };

  return {
    get offset() {
      return offset;
    },
    get dragged() {
      return held !== undefined;
    },
    reach(reach: number): void {
      furthest = Math.max(0, reach);
      moveTo(offset);
    },
    stand(at: number): void {
      fling = 0;
      held = undefined;
      moveTo(at);
    },
    press(): void {
      fling = 0;
    },
    wheel(by: number): void {
      fling = 0;
      moveTo(offset + by);
    },
    pan(way: number, delta: number): void {
      if (way === 0 || held !== undefined) return;
      fling = 0;
      moveTo(offset + (way * PAN_SPEED * delta) / 1000);
    },
    grab(y: number): void {
      held = { y, from: offset, trail: [] };
    },
    drag(y: number, time: number): void {
      if (held === undefined) return;
      held.trail.push({ time, y });
      if (held.trail.length > TRAIL) held.trail.shift();
      moveTo(held.from - (y - held.y));
    },
    release(time: number, runs: boolean): void {
      const was = held;
      held = undefined;
      if (was === undefined || !runs) return;
      fling = -speedOf(was.trail, time);
    },
    step(delta: number): void {
      if (fling === 0) return;
      const to = offset + fling * delta;
      moveTo(to);
      fling = to === offset && Math.abs(fling) > FLING_STILL ? fling * FLING_DECAY ** delta : 0;
    },
  };
}

/** How fast the pointer was travelling as it was released, in design units a millisecond. */
function speedOf(trail: readonly Sample[], now: number): number {
  const last = trail[trail.length - 1];
  const first = trail.find((sample) => now - sample.time <= FLING_WINDOW);
  if (last === undefined || first === undefined || now - last.time > FLING_WINDOW) return 0;
  if (last.time === first.time) return 0;
  return (last.y - first.y) / (last.time - first.time);
}

/** Whether a point of the design space lies in the box, its edges included. */
export function inside(box: Box, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

/**
 * The thing a panel holds under a point of the design space, each thing's box as it stands
 * unscrolled and carried up by the offset; nothing outside the frame the panel is cut at, whatever
 * stands there.
 */
export function heldAt<T extends { readonly box: Box }>(
  frame: Box,
  offset: number,
  held: readonly T[],
  x: number,
  y: number,
): T | undefined {
  if (!inside(frame, x, y)) return undefined;
  return held.find(({ box }) => inside(box, x, y + offset));
}
