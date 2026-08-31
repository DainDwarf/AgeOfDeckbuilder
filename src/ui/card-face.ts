import type Phaser from 'phaser';
import { CARDS, type CardId } from '../rules/cards';
import { costOf, type Resource } from '../rules/chronicle';
import { ACCENT, addText, hexagon, UI_FONT } from './design-space';
import { RESOURCE_COLOURS } from './resource-bar';
import { text } from './text';

export const CARD_WIDTH = 130;

/** Every measure inside a card is a multiple of `em`, so one width scales the whole face. */
function metricsOf(width: number): {
  height: number;
  em: number;
  pad: number;
  radius: number;
} {
  const em = width * 0.13;
  return { height: Math.round(width * 1.4), em, pad: 0.55 * em, radius: 0.45 * em };
}

const TABLE = metricsOf(CARD_WIDTH);
export const CARD_HEIGHT = TABLE.height;

const EDGE = 0x6f757d;
const KIND_INK = 0x4a5058;
const UNAFFORDABLE_MARK = 0xc0392b;
const BACK = 0x232833;
const EMPTY_EDGE = 0x4a5058;

const AFFORDABLE = { face: 0xd4d7db, art: 0xb6bbc2, artEdge: 0x9aa0a8, ink: 0x0d1014 };
const UNAFFORDABLE = { face: 0xa7abb1, art: 0x8f959c, artEdge: 0x7c828a, ink: 0x3a3f45 };

export type CardFace = {
  readonly root: Phaser.GameObjects.Container;
  arm(armed: boolean): void;
};

/**
 * A card, drawn about its own bottom centre so a container's angle fans it from that corner.
 * `unaffordable` names the costs the city cannot afford; a card with any is drawn as unplayable.
 */
export function createCardFace(
  scene: Phaser.Scene,
  id: CardId,
  unaffordable: readonly Resource[],
  faded = false,
  width = CARD_WIDTH,
): CardFace {
  const { height, em, pad, radius } = metricsOf(width);
  const tone = faded ? dim : (colour: number): number => colour;
  const palette = unaffordable.length > 0 ? UNAFFORDABLE : AFFORDABLE;

  const left = -width / 2 + 1 + pad;
  const right = width / 2 - 1 - pad;
  const top = -height + 1 + pad;

  const root = scene.add.container(0, 0);
  const paper = scene.add.graphics();
  paper.fillStyle(tone(palette.face));
  paper.fillRoundedRect(-width / 2, -height, width, height, radius);
  paper.lineStyle(1, tone(EDGE));
  paper.strokeRoundedRect(-width / 2 + 0.5, -height + 0.5, width - 1, height - 1, radius);
  root.add(paper);

  const middle = top + 0.55 * em;
  let x = left;
  for (const { resource, amount } of costOf(id)) {
    const marked = unaffordable.includes(resource);
    const chip = scene.add
      .rectangle(x + 0.4 * em, middle, 0.8 * em, 0.8 * em, tone(RESOURCE_COLOURS[resource]))
      .setAngle(45);
    root.add(chip);
    if (marked) {
      const ring = scene.add
        .rectangle(x + 0.4 * em, middle, 1.15 * em, 1.15 * em)
        .setStrokeStyle(0.12 * em, tone(UNAFFORDABLE_MARK))
        .setAngle(45);
      root.add(ring);
    }
    const value = addText(scene, x + 1.3 * em, middle, String(amount), {
      fontFamily: UI_FONT,
      fontSize: `${em}px`,
      fontStyle: 'bold',
      color: css(tone(marked ? UNAFFORDABLE_MARK : palette.ink)),
    }).setOrigin(0, 0.5);
    root.add(value);
    x = value.x + value.width + 0.35 * em;
  }

  const name = addText(scene, right, middle, text(`card.${id}`), {
    fontFamily: UI_FONT,
    fontSize: `${0.75 * em}px`,
    fontStyle: 'bold',
    color: css(tone(palette.ink)),
  }).setOrigin(1, 0.5);

  const kind = addText(scene, 0, -1 - pad, text(`kind.${CARDS[id].kind}`).toUpperCase(), {
    fontFamily: UI_FONT,
    fontSize: `${0.65 * em}px`,
    color: css(tone(KIND_INK)),
    letterSpacing: 0.14 * 0.65 * em,
  }).setOrigin(0.5, 1);

  const rules = addText(scene, 0, kind.y - kind.height - 0.45 * em, text(`rules.${id}`), {
    fontFamily: UI_FONT,
    fontSize: `${0.62 * em}px`,
    color: css(tone(palette.ink)),
    align: 'center',
    wordWrap: { width: right - left },
  }).setOrigin(0.5, 1);

  const artTop = middle + 1.15 * em;
  const artHeight = rules.y - rules.height - 0.45 * em - artTop;
  const art = scene.add.graphics();
  art.fillStyle(tone(palette.art));
  art.fillRoundedRect(left, artTop, right - left, artHeight, 0.2 * em);
  art.lineStyle(1, tone(palette.artEdge));
  art.strokeRoundedRect(left + 0.5, artTop + 0.5, right - left - 1, artHeight - 1, 0.2 * em);

  const armed = scene.add.graphics().setVisible(false);
  armed.lineStyle(3, ACCENT);
  armed.strokeRoundedRect(-width / 2 - 3.5, -height - 3.5, width + 7, height + 7, radius + 3.5);

  root.add([art, name, kind, rules, armed]);
  return {
    root,
    arm(on: boolean): void {
      armed.setVisible(on);
    },
  };
}

/** The face-down card the draw pile shows, about its own bottom centre; worn when the pile is dry. */
export function createCardBack(scene: Phaser.Scene, faded = false): Phaser.GameObjects.Container {
  const tone = faded ? dim : (colour: number): number => colour;
  const paper = scene.add.graphics();
  paper.fillStyle(tone(BACK));
  paper.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT, TABLE.radius);
  paper.lineStyle(1, tone(EDGE));
  paper.strokeRoundedRect(
    -CARD_WIDTH / 2 + 0.5,
    -CARD_HEIGHT + 0.5,
    CARD_WIDTH - 1,
    CARD_HEIGHT - 1,
    TABLE.radius,
  );

  const emblem = scene.add
    .polygon(0, -CARD_HEIGHT / 2, hexagon(CARD_WIDTH * 0.28 - 3), 0, 0)
    .setStrokeStyle(3, tone(ACCENT));

  return scene.add.container(0, 0, [paper, emblem]);
}

/** Where a pile's top card would be: the card's own rounded outline, dashed. */
export function createEmptySlot(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const outline = scene.add.graphics();
  outline.lineStyle(2, EMPTY_EDGE);
  dashAlong(outline, cardOutline());
  return scene.add.container(0, 0, [outline]);
}

/** The card's outline as a closed polyline, corner arcs sampled into short chords. */
function cardOutline(): { x: number; y: number }[] {
  const half = CARD_WIDTH / 2;
  const r = TABLE.radius;
  const points: { x: number; y: number }[] = [];
  const corner = (cx: number, cy: number, from: number): void => {
    for (let i = 0; i <= 6; i++) {
      const angle = from + (Math.PI / 2) * (i / 6);
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
  };
  points.push({ x: -half + r, y: -CARD_HEIGHT });
  corner(half - r, -CARD_HEIGHT + r, -Math.PI / 2);
  corner(half - r, -r, 0);
  corner(-half + r, -r, Math.PI / 2);
  corner(-half + r, -CARD_HEIGHT + r, Math.PI);
  points.push({ x: -half + r, y: -CARD_HEIGHT });
  return points;
}

/** Dashes of six on, five off, stretched so a whole number of them spans the outline. */
function dashAlong(outline: Phaser.GameObjects.Graphics, points: { x: number; y: number }[]): void {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    lengths.push(Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y));
    total += lengths[i];
  }
  const step = total / Math.max(1, Math.round(total / 11));
  const on = (step * 6) / 11;

  let travelled = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const at = (t: number): { x: number; y: number } => ({
      x: points[i].x + (points[i + 1].x - points[i].x) * t,
      y: points[i].y + (points[i + 1].y - points[i].y) * t,
    });
    let along = 0;
    while (along < lengths[i]) {
      const phase = (travelled + along) % step;
      const until = phase < on ? on - phase : step - phase;
      const next = Math.min(lengths[i], along + until);
      if (phase < on) {
        const from = at(along / lengths[i]);
        const to = at(next / lengths[i]);
        outline.lineBetween(from.x, from.y, to.x, to.y);
      }
      along = next + 1e-6;
    }
    travelled += lengths[i];
  }
}

function css(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

/** What the discard pile's top card is worn down to: CSS `grayscale(0.35) brightness(0.75)`. */
function dim(colour: number): number {
  const red = (colour >> 16) & 0xff;
  const green = (colour >> 8) & 0xff;
  const blue = colour & 0xff;
  const grey = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const worn = (channel: number): number => Math.round((channel * 0.65 + grey * 0.35) * 0.75);
  return (worn(red) << 16) | (worn(green) << 8) | worn(blue);
}
