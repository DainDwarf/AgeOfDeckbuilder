import { describe, expect, it } from 'vitest';
import { layOutTray, ROUND, type TrayLayout } from './tray-layout';

/** A card of a height of the test's own, and the smallest screen with a wider and a taller one. */
const CARD = 180;
const SMALLEST = { width: 1280, height: 720 };
const WIDER = { width: 1920, height: 720 };
const TALLER = { width: 1280, height: 1000 };

function laneWidth({ lane }: TrayLayout): number {
  return lane.right - lane.left;
}

describe('the tray along the bottom edge', () => {
  const smallest = layOutTray(SMALLEST, SMALLEST.width, CARD);
  const wider = layOutTray(WIDER, SMALLEST.width, CARD);

  it('spans the smallest screen, and keeps to the middle of a wider one at the same width', () => {
    expect(smallest.tray.x).toBe(0);
    expect(smallest.tray.width).toBe(SMALLEST.width);
    expect(wider.tray.width).toBe(smallest.tray.width);
    expect(wider.tray.x + wider.tray.width / 2).toBe(WIDER.width / 2);
  });

  it('gives the hand a lane no wider on a wider screen than on the smallest', () => {
    expect(laneWidth(wider)).toBe(laneWidth(smallest));
    expect(wider.lane.left - wider.tray.x).toBe(smallest.lane.left - smallest.tray.x);
  });

  it('stands the draw pile left of the lane and the discard pile then the exhaust pile right of it, each round inside the tray', () => {
    for (const { lane, tray, piles } of [smallest, wider]) {
      const draw = piles['draw-pile'];
      const discard = piles['discard-pile'];
      const exhaust = piles['exhaust-pile'];
      expect(draw.x + ROUND / 2).toBeLessThan(lane.left);
      expect(discard.x - ROUND / 2).toBeGreaterThan(lane.right);
      expect(exhaust.x - ROUND / 2).toBeGreaterThan(discard.x + ROUND / 2);
      expect(draw.x - ROUND / 2).toBeGreaterThan(tray.x);
      expect(exhaust.x + ROUND / 2).toBeLessThan(tray.x + tray.width);
      for (const { y } of [draw, discard, exhaust]) {
        expect(y - ROUND / 2).toBeGreaterThan(tray.y);
        expect(y + ROUND / 2).toBeLessThan(tray.y + tray.height);
      }
    }
  });

  it('rests the cards with their tops over the screen’s bottom edge and their feet under it, the tray’s top under their tops', () => {
    expect(smallest.restingTop).toBeLessThan(SMALLEST.height);
    expect(smallest.baseline).toBeGreaterThan(SMALLEST.height);
    expect(smallest.restingTop).toBeLessThan(smallest.tray.y);
    expect(smallest.tray.y + smallest.tray.height).toBe(SMALLEST.height);
  });

  it('stands a lifted card’s foot over the screen’s bottom edge', () => {
    expect(smallest.liftedBottom).toBeLessThan(SMALLEST.height);
    expect(smallest.liftedBottom).toBeGreaterThan(smallest.tray.y);
  });
});

describe('the end-turn button', () => {
  it('stands in the bottom right corner of a window wide enough, as far in from both edges and clear of the tray', () => {
    for (const screen of [WIDER, { width: 2560, height: 1440 }]) {
      const { endTurn, tray } = layOutTray(screen, SMALLEST.width, CARD);
      const fromRight = screen.width - (endTurn.x + endTurn.width);
      expect(fromRight).toBeGreaterThan(0);
      expect(screen.height - (endTurn.y + endTurn.height)).toBe(fromRight);
      expect(endTurn.x).toBeGreaterThan(tray.x + tray.width);
    }
  });

  it('stands over the exhaust pile on a narrower window, its right edge on the pile’s and its foot over the resting cards’ tops', () => {
    for (const screen of [SMALLEST, { width: 1440, height: 900 }]) {
      const { endTurn, piles, restingTop } = layOutTray(screen, SMALLEST.width, CARD);
      expect(endTurn.x + endTurn.width).toBe(piles['exhaust-pile'].x + ROUND / 2);
      expect(endTurn.y + endTurn.height).toBeLessThan(restingTop);
    }
  });
});

describe('the frame the map is held in', () => {
  it('runs the screen’s width from its top to between the resting cards’ tops and the tray’s', () => {
    const { mapFrame, restingTop, tray } = layOutTray(WIDER, SMALLEST.width, CARD);
    expect(mapFrame).toMatchObject({ x: 0, y: 0, width: WIDER.width });
    expect(mapFrame.height).toBeGreaterThan(restingTop);
    expect(mapFrame.height).toBeLessThan(tray.y);
  });

  it('grows by what the screen grows in height', () => {
    const today = layOutTray(SMALLEST, SMALLEST.width, CARD).mapFrame;
    const taller = layOutTray(TALLER, SMALLEST.width, CARD).mapFrame;
    expect(taller.height - today.height).toBe(TALLER.height - SMALLEST.height);
  });
});
