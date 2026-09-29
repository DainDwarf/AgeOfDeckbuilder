/** What scrolls on a screen computes before it draws: how far it moves, and what answers where. */

/** A box of the design space: its top-left corner and its size. */
export type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** The pointer's travel over these last milliseconds is the speed a release runs the scroll on at. */
const RUN_WINDOW = 80;

/** What is left of a run's speed after a millisecond, and the speed it is dropped at. */
const RUN_DECAY = 0.994;
const RUN_STILL = 0.01;

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
  /** A press on it: a run stops. */
  press(): void;
  /** The wheel turned by this much: a run stops, and it moves as far. */
  wheel(by: number): void;
  /** A drag begun where its press landed, at this height of the design space. */
  grab(y: number): void;
  /** The pointer dragging it, at this height and this time. */
  drag(y: number, time: number): void;
  /** The drag let go of at this time: it runs on at the drag's speed where it `runs`, and stands where not. */
  release(time: number, runs: boolean): void;
  /** One frame of a run, this many milliseconds long. */
  step(delta: number): void;
};

/**
 * A scroll with the browse's feel, standing at its first line with nothing to reach until it is told
 * its reach: `moved` is told every offset it moves to.
 */
export function createScroll(moved: (offset: number) => void): Scroll {
  let offset = 0;
  let furthest = 0;
  /** The run's speed in design units a millisecond, and zero while it stands. */
  let run = 0;
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
      run = 0;
      held = undefined;
      moveTo(at);
    },
    press(): void {
      run = 0;
    },
    wheel(by: number): void {
      run = 0;
      moveTo(offset + by);
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
      run = -speedOf(was.trail, time);
    },
    step(delta: number): void {
      if (run === 0) return;
      const to = offset + run * delta;
      moveTo(to);
      run = to === offset && Math.abs(run) > RUN_STILL ? run * RUN_DECAY ** delta : 0;
    },
  };
}

/** How fast the pointer was travelling as it was released, in design units a millisecond. */
function speedOf(trail: readonly Sample[], now: number): number {
  const last = trail[trail.length - 1];
  const first = trail.find((sample) => now - sample.time <= RUN_WINDOW);
  if (last === undefined || first === undefined || now - last.time > RUN_WINDOW) return 0;
  if (last.time === first.time) return 0;
  return (last.y - first.y) / (last.time - first.time);
}

/** Whether a point of the design space lies in the box, its edges included. */
function inside(box: Box, x: number, y: number): boolean {
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
