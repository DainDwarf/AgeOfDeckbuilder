import type { PileKind } from './cast';
import type { Box } from './design-space';

/** How far under the screen's bottom edge the middle resting card's bottom edge stands. */
const SINK = 52;

/** How far over the screen's bottom edge a card lifted out of the lane stands its bottom edge. */
const LIFTED_OVER = 8;

/** The clear water between a pile's round and the lane the hand fans out in. */
const LANE_PAD = 28;

/** How wide a pile's round stands, and the gap between the discard pile's and the exhaust pile's. */
export const ROUND = 56;
const PILE_GAP = 12;

/** How far inside the tray's sides the outer rounds stand. */
const TRAY_MARGIN = 24;

/** How far under the resting cards' tops the tray's top stands, and the frame the map is held in ends. */
const TRAY_UNDER_TOPS = 48;
const FRAME_UNDER_TOPS = 24;

/**
 * How wide and how tall the end-turn button stands; how far in from the screen's right and bottom
 * edges it stands in the corner, and how far clear of the tray at the least; and how far over the
 * resting cards' tops its foot stands where it stands over the exhaust pile instead.
 */
const END_TURN = 64;
const CORNER_IN = 64;
const CLEAR_OF_TRAY = 12;
const OVER_THE_HAND = 14;

/** What the tray holds left of the lane, and right of it. */
const LEFT_OF_LANE = LANE_PAD + ROUND + TRAY_MARGIN;
const RIGHT_OF_LANE = LANE_PAD + ROUND + PILE_GAP + ROUND + TRAY_MARGIN;

export type TrayLayout = {
  /** Where the middle resting card's bottom edge stands. */
  readonly baseline: number;
  /** Where the resting cards' tops stand. */
  readonly restingTop: number;
  /** Where a foot standing just over the resting cards stands. */
  readonly overTheHand: number;
  /** Where a card lifted out of the lane stands its bottom edge, wherever on the fan it rests. */
  readonly liftedBottom: number;
  /** The lane the hand fans out in, its padding left out. */
  readonly lane: { readonly left: number; readonly right: number };
  /** The tray's own box, down to the screen's bottom edge. */
  readonly tray: Box;
  /** The middle of each pile's round. */
  readonly piles: Readonly<Record<PileKind, { readonly x: number; readonly y: number }>>;
  /**
   * The end-turn button's box: in the screen's bottom right corner where it stands clear of the tray
   * there, else over the exhaust pile, its right edge on the pile's.
   */
  readonly endTurn: Box;
  /** The frame the map is centred in, bounded by and holds a played stage clear of. */
  readonly mapFrame: Box;
};

type Screen = { readonly width: number; readonly height: number };

/** Where the resting cards' tops stand on a screen that tall, for cards that tall. */
function restingTopOf(height: number, cardHeight: number): number {
  return height + SINK - cardHeight;
}

/** The frame the map is held in on a screen of that size, for cards that tall. */
export function mapFrameOf({ width, height }: Screen, cardHeight: number): Box {
  return { x: 0, y: 0, width, height: restingTopOf(height, cardHeight) + FRAME_UNDER_TOPS };
}

/**
 * The hand's lane, the tray it stands in with the piles and the frame the map is held in, on a screen
 * of that size, for cards that tall: the lane as wide as the smallest screen gives it, and the tray
 * keeping it and the piles together in the middle of the bottom edge.
 */
export function layOutTray(screen: Screen, smallest: number, cardHeight: number): TrayLayout {
  const { width, height } = screen;
  const lane = smallest - LEFT_OF_LANE - RIGHT_OF_LANE;
  const trayLeft = (width - (LEFT_OF_LANE + lane + RIGHT_OF_LANE)) / 2;
  const left = trayLeft + LEFT_OF_LANE;
  const right = left + lane;
  const baseline = height + SINK;
  const restingTop = restingTopOf(height, cardHeight);
  const trayTop = restingTop + TRAY_UNDER_TOPS;
  const y = (trayTop + height) / 2;
  const discard = right + LANE_PAD + ROUND / 2;
  const exhaust = discard + ROUND + PILE_GAP;
  const trayRight = right + RIGHT_OF_LANE;
  const cornerLeft = width - CORNER_IN - END_TURN;
  const overTheHand = restingTop - OVER_THE_HAND;
  return {
    baseline,
    restingTop,
    overTheHand,
    liftedBottom: height - LIFTED_OVER,
    lane: { left, right },
    tray: { x: trayLeft, y: trayTop, width: trayRight - trayLeft, height: height - trayTop },
    piles: {
      'draw-pile': { x: left - LANE_PAD - ROUND / 2, y },
      'discard-pile': { x: discard, y },
      'exhaust-pile': { x: exhaust, y },
    },
    endTurn:
      cornerLeft >= trayRight + CLEAR_OF_TRAY
        ? { x: cornerLeft, y: height - CORNER_IN - END_TURN, width: END_TURN, height: END_TURN }
        : {
            x: exhaust + ROUND / 2 - END_TURN,
            y: overTheHand - END_TURN,
            width: END_TURN,
            height: END_TURN,
          },
    mapFrame: mapFrameOf(screen, cardHeight),
  };
}
