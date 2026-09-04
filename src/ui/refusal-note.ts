import type Phaser from 'phaser';
import type { Cost, Refusal } from '../rules/chronicle';
import { addText, DESIGN_WIDTH, drawBubble, MARGIN, type Surface, UI_FONT } from './design-space';
import type { TileFace } from './map';
import { text } from './text';

/** Over the hand's lifted cards, over everything the map draws, under the overlay. */
const DEPTH = 50;

/** The clear water between the note and what it points at; its tail crosses most of that. */
const STANDOFF = 8;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: '#0d1014' };

/** Where the note stands on its surface, laid out for the bubble it has measured. */
type Place = (width: number, height: number, unit: number) => Placement;

/** The note's own corner, and how far along its bottom edge the tail comes down. */
type Placement = { left: number; top: number; at: number };

export type RefusalNote = {
  /**
   * Says every reason the rules refuse the card, standing over it: `x` is where the card is at home
   * and `top` the edge the note keeps clear of — the card's top once a hover has lifted it.
   */
  overCard(costs: readonly Cost[], refusal: Refusal, x: number, top: number): void;
  /**
   * Says every reason the rules refuse a city-mode click, standing over the face it landed on with
   * its tail down on the tile.
   */
  overTile(costs: readonly Cost[], refusal: Refusal, at: TileFace): void;
  /** Stands what it is saying over the same place again, at the size on screen it already had. */
  rescale(): void;
  hide(): void;
};

/** Every reason, one sentence each: what the city cannot pay first, then what stands in the way. */
function reasons(costs: readonly Cost[], refusal: Refusal): string[] {
  return [
    ...costs
      .filter(({ resource }) => refusal.unaffordable.includes(resource))
      .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount })),
    ...refusal.blocked.map((block) => text(`refusal.${block}`)),
  ];
}

/**
 * The bubble a refusal answers with, standing on the surface it was raised from in the panel
 * language, its tail pointing down at what the rules refused, and staying up until it is taken
 * down. One stands per surface: a second refusal replaces the first, and any press on the chronicle
 * screen takes down whichever is up. It keeps the size on screen it was laid out at however far its
 * surface has zoomed, so a zoom stands it again.
 */
export function createRefusalNote(scene: Phaser.Scene, on: Surface): RefusalNote {
  let note: Phaser.GameObjects.Container | undefined;
  /** How the note stands where it was raised, for a zoom that changes what the surface measures in. */
  let stand: (() => void) | undefined;

  const hide = (): void => {
    stand = undefined;
    if (note === undefined) return;
    note.destroy();
    note = undefined;
  };

  scene.input.on('pointerdown', hide);

  const raise = (costs: readonly Cost[], refusal: Refusal, place: Place): void => {
    hide();
    const bubble = scene.add.graphics();
    const labels = reasons(costs, refusal).map((reason) => addText(scene, 0, 0, reason, STYLE));

    let line = 7;
    for (const label of labels) {
      label.setPosition(10, line);
      line += label.height;
    }
    const width = Math.max(...labels.map((label) => label.width)) + 20;
    const height = line + 7;

    const raised = scene.add
      .container(0, 0, [bubble, ...labels])
      .setDepth(DEPTH)
      .setName('refusal');
    on.layer.add(raised);
    note = raised;

    stand = (): void => {
      const unit = on.unit();
      const { left, top, at } = place(width, height, unit);
      drawBubble(bubble, width, height, { edge: 'bottom', at });
      raised.setScale(unit).setPosition(left, top);
    };
    stand();
  };

  return {
    overCard(costs: readonly Cost[], refusal: Refusal, x: number, top: number): void {
      raise(costs, refusal, (width, height) => {
        const left = Math.min(Math.max(x - width / 2, MARGIN), DESIGN_WIDTH - MARGIN - width);
        return { left, top: top - STANDOFF - height, at: x - left };
      });
    },

    overTile(costs: readonly Cost[], refusal: Refusal, at: TileFace): void {
      raise(costs, refusal, (width, height, unit) => ({
        left: at.x - (width / 2) * unit,
        top: at.y - at.radius - (STANDOFF + height) * unit,
        at: width / 2,
      }));
    },

    rescale(): void {
      stand?.();
    },

    hide,
  };
}
