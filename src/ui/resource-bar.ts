import type Phaser from 'phaser';
import type { Chronicle, Resource, Stage } from '../rules/chronicle';
import { EASE, ended, stopMotion } from './card-motion';
import {
  addText,
  DESIGN_WIDTH,
  MARGIN,
  OVER_SCRIM_DEPTH,
  onClick,
  onHover,
  PANEL_EDGE,
  PANEL_FILL,
  UI_FONT,
} from './design-space';
import { text } from './text';
import type { Tooltip } from './tooltip';

export const BAR_HEIGHT = 48;

const WORD_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: '#4a5058' };
const VALUE_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: '#0d1014' };

const CHIP_TO_WORD = 18;
const WORD_TO_VALUE = 8;
const BETWEEN = 22;

const MENU_HEIGHT = 32;
const MENU_PADDING = 12;

type Reading = Resource | 'population';

/** The colour each reading is known by, in the bar and on every cost a card asks for. */
export const RESOURCE_COLOURS: Record<Reading, number> = {
  food: 0x7d9c55,
  production: 0xb0834a,
  military: 0xb05252,
  money: 0xa08a1e,
  science: 0x5f8fc0,
  culture: 0x9a6fb8,
  population: 0x6b6b7d,
};

const LEFT: readonly Reading[] = ['food', 'production', 'military', 'money', 'science'];
const RIGHT: readonly Reading[] = ['culture', 'population'];

type Entry = {
  readonly key: Reading;
  readonly chip: Phaser.GameObjects.Rectangle;
  readonly word: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
  /** What the value reads, as the number a rise ticks through; the text follows it. */
  readonly ticking: { count: number };
  readonly hover: Phaser.GameObjects.Zone;
};

export type ResourceBar = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
};

export function createResourceBar(
  scene: Phaser.Scene,
  tooltip: Tooltip,
  menu: () => void,
): ResourceBar {
  const bar = scene.add.container(0, 0).setDepth(10);
  bar.add(scene.add.rectangle(0, 0, DESIGN_WIDTH, BAR_HEIGHT, PANEL_FILL).setOrigin(0, 0));
  bar.add(
    scene.add
      .rectangle(0, BAR_HEIGHT - 1, DESIGN_WIDTH, 1, PANEL_EDGE)
      .setOrigin(0, 0)
      .setName('bar-edge'),
  );

  const slot = digitSlot(scene);

  const menuWidth = createMenuButton(scene, menu);

  const left = LEFT.map((key) => createEntry(scene, bar, tooltip, key));
  const right = RIGHT.map((key) => createEntry(scene, bar, tooltip, key));
  place(left, MARGIN, slot);
  place(right, DESIGN_WIDTH - MARGIN - menuWidth - BETWEEN - spanOf(right, slot), slot);

  const entries = [...left, ...right];
  /** The readings the bar has ticking; a render owns them and takes them down. */
  let rising: Entry[] = [];

  const render = (chronicle: Chronicle): void => {
    for (const entry of rising) stopMotion(scene, entry.ticking);
    rising = [];
    for (const entry of entries) {
      entry.ticking.count = readingOf(chronicle, entry.key);
      entry.value.setText(String(entry.ticking.count));
    }
  };

  /** The income arriving: every reading that changed ticks up to what it now stands at. */
  const rise = (chronicle: Chronicle): Promise<void> | undefined => {
    const ticking = entries.filter(
      (entry) => entry.ticking.count !== readingOf(chronicle, entry.key),
    );
    if (ticking.length === 0) return undefined;
    rising = ticking;

    return Promise.all(
      ticking.map((entry) =>
        ended(
          scene.tweens.add({
            targets: entry.ticking,
            count: readingOf(chronicle, entry.key),
            duration: 400,
            ease: EASE,
            onUpdate: () => entry.value.setText(String(Math.round(entry.ticking.count))),
          }),
        ),
      ),
    ).then(() => {
      // A render while these were ticking took them down and painted the readings it stands on.
      if (rising === ticking) render(chronicle);
    });
  };

  return {
    render,
    play(stage: Stage): Promise<void> | undefined {
      return stage.name === 'income' ? rise(stage.chronicle) : undefined;
    },
  };
}

/**
 * The Menu button at the bar's right end, and how wide it came out. It stands over the scrim
 * instead of in the bar, so it is still pressable while a window or the defeat screen covers the
 * table: a new chronicle is how a player leaves a defeat.
 */
function createMenuButton(scene: Phaser.Scene, pressed: () => void): number {
  const label = addText(scene, 0, 0, text('menu.menu'), VALUE_STYLE).setOrigin(0.5, 0.5);
  const width = label.width + 2 * MENU_PADDING;
  const x = DESIGN_WIDTH - MARGIN - width / 2;
  const y = BAR_HEIGHT / 2;

  const button = scene.add
    .rectangle(x, y, width, MENU_HEIGHT, PANEL_FILL)
    .setStrokeStyle(1, PANEL_EDGE)
    .setName('menu-button')
    .setInteractive({ useHandCursor: true });
  label.setPosition(x, y);
  // The label is added after the fill: equal depths draw in the order they were added, so a label
  // standing beside the button rather than inside it would be painted over by it.
  scene.add.container(0, 0, [button, label]).setDepth(OVER_SCRIM_DEPTH);
  onClick(button, pressed);
  return width;
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
  key: Reading,
): Entry {
  const chip = scene.add.rectangle(0, 0, 10, 10, RESOURCE_COLOURS[key]).setAngle(45);
  const word = addText(scene, 0, 0, text(`label.${key}`), WORD_STYLE).setOrigin(0, 0.5);
  const value = addText(scene, 0, 0, '', VALUE_STYLE)
    .setOrigin(0, 0.5)
    .setName(`reading-${key}-value`);
  const hover = scene.add
    .zone(0, 0, 1, BAR_HEIGHT)
    .setOrigin(0, 0)
    .setName(`reading-${key}`)
    .setInteractive();
  onHover(
    hover,
    () => tooltip.under(text(`tooltip.${key}`), hover.x, hover.x + hover.width / 2, BAR_HEIGHT + 8),
    () => tooltip.hide(),
  );
  bar.add([chip, word, value, hover]);
  return { key, chip, word, value, ticking: { count: 0 }, hover };
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
