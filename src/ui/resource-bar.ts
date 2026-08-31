import type Phaser from 'phaser';
import type { Chronicle, Resource } from '../rules/chronicle';
import { addText, DESIGN_WIDTH, UI_FONT } from './design-space';
import { text } from './text';

export const BAR_HEIGHT = 48;

const PANEL_FILL = 0xd4d7db;
const PANEL_EDGE = 0x6f757d;
const WORD_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: '#4a5058' };
const VALUE_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: '#0d1014' };

const TAIL_HEIGHT = 7;
const TAIL_HALF = 6;

const CHIP_TO_WORD = 18;
const WORD_TO_VALUE = 8;
const BETWEEN = 22;
const MARGIN = 24;

type Reading = Resource | 'population';

const LEFT: readonly { key: Reading; colour: number }[] = [
  { key: 'food', colour: 0x7d9c55 },
  { key: 'production', colour: 0xb0834a },
  { key: 'military', colour: 0xb05252 },
  { key: 'money', colour: 0xa08a1e },
  { key: 'science', colour: 0x5f8fc0 },
];

const RIGHT: readonly { key: Reading; colour: number }[] = [
  { key: 'culture', colour: 0x9a6fb8 },
  { key: 'population', colour: 0x6b6b7d },
];

type Entry = {
  readonly key: Reading;
  readonly chip: Phaser.GameObjects.Rectangle;
  readonly word: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
  readonly hover: Phaser.GameObjects.Zone;
};

export type ResourceBar = { render(chronicle: Chronicle): void };

export function createResourceBar(scene: Phaser.Scene): ResourceBar {
  const bar = scene.add.container(0, 0).setDepth(10);
  bar.add(scene.add.rectangle(0, 0, DESIGN_WIDTH, BAR_HEIGHT, PANEL_FILL).setOrigin(0, 0));
  bar.add(scene.add.rectangle(0, BAR_HEIGHT - 1, DESIGN_WIDTH, 1, PANEL_EDGE).setOrigin(0, 0));

  const tooltip = createTooltip(scene);
  const slot = digitSlot(scene);

  const left = LEFT.map((reading) => createEntry(scene, bar, tooltip, reading));
  const right = RIGHT.map((reading) => createEntry(scene, bar, tooltip, reading));
  place(left, MARGIN, slot);
  place(right, DESIGN_WIDTH - MARGIN - spanOf(right, slot), slot);

  const entries = [...left, ...right];
  return {
    render(chronicle: Chronicle): void {
      for (const entry of entries) entry.value.setText(String(readingOf(chronicle, entry.key)));
    },
  };
}

/** The width every value grows rightward into: four digits, so no reading ever moves. */
function digitSlot(scene: Phaser.Scene): number {
  const digits = addText(scene, 0, 0, '0000', VALUE_STYLE);
  const width = digits.width;
  digits.destroy();
  return width;
}

function createEntry(
  scene: Phaser.Scene,
  bar: Phaser.GameObjects.Container,
  tooltip: Tooltip,
  { key, colour }: { key: Reading; colour: number },
): Entry {
  const chip = scene.add.rectangle(0, 0, 10, 10, colour).setAngle(45);
  const word = addText(scene, 0, 0, text(`label.${key}`), WORD_STYLE).setOrigin(0, 0.5);
  const value = addText(scene, 0, 0, '', VALUE_STYLE).setOrigin(0, 0.5);
  const hover = scene.add.zone(0, 0, 1, BAR_HEIGHT).setOrigin(0, 0).setInteractive();
  hover.on('pointerover', () => tooltip.show(key, hover.x, hover.x + hover.width / 2));
  hover.on('pointerout', () => tooltip.hide());
  bar.add([chip, word, value, hover]);
  return { key, chip, word, value, hover };
}

function widthOf({ word }: Entry, slot: number): number {
  return CHIP_TO_WORD + word.width + WORD_TO_VALUE + slot;
}

function spanOf(entries: Entry[], slot: number): number {
  return entries.reduce(
    (total, entry, index) => total + widthOf(entry, slot) + (index > 0 ? BETWEEN : 0),
    0,
  );
}

function place(entries: Entry[], from: number, slot: number): void {
  const middle = BAR_HEIGHT / 2;
  let x = from;
  for (const entry of entries) {
    const { chip, word, value, hover } = entry;
    chip.setPosition(x + 5, middle);
    word.setPosition(x + CHIP_TO_WORD, middle);
    value.setPosition(x + CHIP_TO_WORD + word.width + WORD_TO_VALUE, middle);
    hover.setPosition(x, 0).setSize(widthOf(entry, slot), BAR_HEIGHT);
    x += widthOf(entry, slot) + BETWEEN;
  }
}

function readingOf(chronicle: Chronicle, key: Reading): number {
  return key === 'population' ? chronicle.population : chronicle.resources[key];
}

type Tooltip = { show(key: Reading, x: number, centre: number): void; hide(): void };

function createTooltip(scene: Phaser.Scene): Tooltip {
  const bubble = scene.add.graphics();
  const label = addText(scene, 10, 7, '', { ...VALUE_STYLE, fontSize: '14px' });
  const tooltip = scene.add.container(0, 0, [bubble, label]).setDepth(30).setVisible(false);

  return {
    show(key: Reading, x: number, centre: number): void {
      label.setText(text(`tooltip.${key}`));
      const width = label.width + 20;
      const left = Math.min(x, DESIGN_WIDTH - MARGIN - width);
      drawBubble(bubble, width, label.height + 14, centre - left);
      tooltip.setPosition(left, BAR_HEIGHT + 8).setVisible(true);
    },
    hide(): void {
      tooltip.setVisible(false);
    },
  };
}

/**
 * The box and its tail as one closed path, so the fill is continuous and the stroke never crosses
 * the seam. The tail rises into the gap above the box, and stays clear of both corners.
 */
function drawBubble(
  bubble: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  at: number,
): void {
  const tip = Math.min(Math.max(at, TAIL_HALF + 4), width - TAIL_HALF - 4);

  bubble.clear();
  bubble.fillStyle(PANEL_FILL);
  bubble.lineStyle(1, PANEL_EDGE);
  bubble.beginPath();
  bubble.moveTo(0, 0);
  bubble.lineTo(tip - TAIL_HALF, 0);
  bubble.lineTo(tip, -TAIL_HEIGHT);
  bubble.lineTo(tip + TAIL_HALF, 0);
  bubble.lineTo(width, 0);
  bubble.lineTo(width, height);
  bubble.lineTo(0, height);
  bubble.closePath();
  bubble.fillPath();
  bubble.strokePath();
}
