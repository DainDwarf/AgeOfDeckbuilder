import type Phaser from 'phaser';
import { type Press, pressOf } from './bindings';
import {
  addText,
  DESIGN_WIDTH,
  dragged,
  drawBubble,
  MARGIN,
  onLetGoOffCanvas,
  type Stratum,
  UI_FONT,
} from './design-space';
import { css, LOOK } from './look';
import type { TileFace } from './map';
import type { Said } from './refusal-lines';

/** The clear water between the note and what it points at; its tail crosses most of that. */
const STANDOFF = 8;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: css(LOOK.ink) };

/** Where the note stands on its surface, laid out for the bubble it has measured. */
type Place = (width: number, height: number, unit: number) => Placement;

/** The note's own corner, and how far along its bottom edge the tail comes down. */
type Placement = { left: number; top: number; at: number };

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
  /** The presses landing on that scene heard as those landing on its own. */
  hearPressesOf(other: Phaser.Scene): void;
};

/**
 * The bubble a cost and a refusal answer with, on the surface it was raised from: one stands per
 * surface, a second replaces the first, nothing to say raises none, and the next press on that
 * scene takes it down as it is let go or as its drag starts.
 */
export function createRefusalNote(scene: Phaser.Scene, on: Stratum): RefusalNote {
  let note: Phaser.GameObjects.Container | undefined;
  /** How the note stands where it was raised, for a zoom that changes what the surface measures in. */
  let stand: (() => void) | undefined;

  const hide = (): void => {
    stand = undefined;
    if (note === undefined) return;
    note.destroy();
    note = undefined;
  };

  /** Each press held: where it landed, and the note standing as it did, the one its answer takes down. */
  const held = new Map<
    Press,
    {
      readonly from: { x: number; y: number };
      readonly standing: Phaser.GameObjects.Container | undefined;
    }
  >();

  const pressLanded = (pointer: Phaser.Input.Pointer): void => {
    const press = pressOf(pointer);
    if (press === undefined) return;
    held.set(press, { from: { x: pointer.x, y: pointer.y }, standing: note });
  };

  // A note this press raised stands: the hand's and a window's are raised before the scene hears the
  // release that raises them (phaser/src/input/InputPlugin.js:2041, :2069).
  const pressAnswered = (press: Press): void => {
    const pressing = held.get(press);
    if (pressing === undefined) return;
    held.delete(press);
    if (pressing.standing === note) hide();
  };

  scene.input.on('pointerdown', pressLanded);
  // A held press's moves and every release reach this scene wherever the press landed (docs/PHASER.md).
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    for (const [press, { from }] of held) if (dragged(scene, from, pointer)) pressAnswered(press);
  });
  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    const press = pressOf(pointer);
    if (press !== undefined) pressAnswered(press);
  });
  onLetGoOffCanvas(scene, pressAnswered);

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

    const raised = scene.add.container(0, 0, [bubble, ...labels]).setName('refusal');
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

    hearPressesOf(other: Phaser.Scene): void {
      other.input.on('pointerdown', pressLanded);
    },
  };
}
