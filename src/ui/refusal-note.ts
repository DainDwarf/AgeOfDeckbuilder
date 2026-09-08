import type Phaser from 'phaser';
import type { Cost, Refusal } from '../rules/chronicle';
import type { Block } from '../rules/state';
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

/** What a note says: one sentence per reason, in the order the bubble reads them. */
export type Said = readonly string[];

export type RefusalNote = {
  /**
   * Says its lines standing over the card: `x` is where the card is at home and `top` the edge the
   * note keeps clear of — the card's top once a hover has lifted it.
   */
  overCard(said: Said, x: number, top: number): void;
  /** Says its lines standing over the face a press landed on, with its tail down on the tile. */
  overTile(said: Said, at: TileFace): void;
  /** Stands what it is saying over the same place again, at the size on screen it already had. */
  rescale(): void;
  hide(): void;
};

/** The sentence one thing standing in the way says. */
function blocking(block: Block): string {
  return text(`refusal.${block}`);
}

/** What a refused card's note says: of what the card costs, only what the city cannot pay. */
export function refusedCard(costs: readonly Cost[], refusal: Refusal): Said {
  return [
    ...costs
      .filter(({ resource }) => refusal.unaffordable.includes(resource))
      .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount })),
    ...refusal.blocked.map(blocking),
  ];
}

/**
 * What the note over a tile says of the city's act on it refused: a claim it cannot pay for in the
 * one sentence that says so — the tile itself wears the culture it asks for — and what stands in
 * the way of an assign.
 */
export function refusedAct(refusal: Refusal): Said {
  return [
    ...(refusal.unaffordable.length > 0 ? [text('refusal.claim')] : []),
    ...refusal.blocked.map(blocking),
  ];
}

/** What the note over a tile a card is aimed at says: the one thing the aim has against it. */
export function refusedAim(block: Block): Said {
  return [blocking(block)];
}

/**
 * The bubble a cost and a refusal answer with, standing on the surface it was raised from in the
 * panel language, its tail pointing down at what it speaks for, and staying up until it is taken
 * down. One stands per surface: a second note replaces the first, and any press on the chronicle
 * screen takes down whichever is up. Nothing to say takes it down as well. It keeps the size on
 * screen it was laid out at however far its surface has zoomed, so a zoom stands it again.
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

  const raise = (said: Said, place: Place): void => {
    hide();
    if (said.length === 0) return;

    const bubble = scene.add.graphics();
    const labels = said.map((reason) => addText(scene, 0, 0, reason, STYLE));

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
    overCard(said: Said, x: number, top: number): void {
      raise(said, (width, height) => {
        const left = Math.min(Math.max(x - width / 2, MARGIN), DESIGN_WIDTH - MARGIN - width);
        return { left, top: top - STANDOFF - height, at: x - left };
      });
    },

    overTile(said: Said, at: TileFace): void {
      raise(said, (width, height, unit) => ({
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
