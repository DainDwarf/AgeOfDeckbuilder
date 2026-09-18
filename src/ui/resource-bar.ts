import type Phaser from 'phaser';
import { growthThreshold } from '../rules/city';
import { RESOURCES, type Resource } from '../rules/resources';
import { type Group, type Stage, walked } from '../rules/stages';
import { type Chronicle, idle } from '../rules/state';
import { layOutBar, type Placed, type Zone } from './bar-layout';
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

/** Where the bar stands on the chronicle screen: over the map and the hand, under the scrim. */
const BAR_DEPTH = 10;

/** The word of a reading, and the ink it is lifted to while the reading is latched down. */
const WORD_INK = '#4a5058';
const SUNK_WORD_INK = '#0d1014';

const WORD_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: WORD_INK };
const VALUE_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: '#0d1014' };

const CHIP_TO_WORD = 18;
const WORD_TO_VALUE = 8;

const MENU_HEIGHT = 32;
const MENU_PADDING = 12;

/** The well a latched reading sits in: its floor, the edge it is cut into, and the light beneath. */
const WELL_FILL = 0xb4b9c0;
const WELL_LIGHT = 0xeef0f3;

/** How far a latched reading is pressed down and to the right. */
const SUNK = 1;

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

/** The readings the bar carries, in the order it reads them. */
const READINGS: readonly Reading[] = [...RESOURCES, 'population'];

/** The readings the city is managed by: pressing either of them enters city mode. */
const CITY_READINGS = ['culture', 'population'] as const;

/** Whether a press on this reading enters city mode instead of toggling its resource. */
function managesCity(key: Reading): key is (typeof CITY_READINGS)[number] {
  return CITY_READINGS.some((reading) => reading === key);
}

type Entry = {
  readonly key: Reading;
  readonly chip: Phaser.GameObjects.Rectangle;
  readonly word: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
  /** The chip, the word and the value together: what the latch presses into the bar. */
  readonly face: Phaser.GameObjects.Container;
  /** The well the reading sits in while it is latched down; it stands only then. */
  readonly well: Phaser.GameObjects.Container;
  /** What the value reads, as the number a rise ticks through; the text follows it. */
  readonly ticking: { count: number };
  readonly hover: Phaser.GameObjects.Zone;
};

export type ResourceBar = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /** Latches down the readings of these resources, and lets every other one back up. */
  latch(shown: ReadonlySet<Resource>): void;
};

export function createResourceBar(
  scene: Phaser.Scene,
  tooltip: Tooltip,
  menu: () => void,
  cityMode: () => void,
  toggleYield: (resource: Resource) => void,
): ResourceBar {
  const bar = scene.add.container(0, 0).setDepth(BAR_DEPTH);
  bar.add(scene.add.rectangle(0, 0, DESIGN_WIDTH, BAR_HEIGHT, PANEL_FILL).setOrigin(0, 0));
  bar.add(
    scene.add
      .rectangle(0, BAR_HEIGHT - 1, DESIGN_WIDTH, 1, PANEL_EDGE)
      .setOrigin(0, 0)
      .setName('bar-edge'),
  );

  const slot = digitSlot(scene);

  /**
   * Whether the bar stands over the scrim, which it does while a deal waits to be taken. The map is
   * under the scrim there, so the readings that act on it — the yield overlay's five, city mode's
   * two — answer no press while it does.
   */
  let overScrim = false;

  const label = menuLabel(scene);
  const entries = READINGS.map((key) => createEntry(scene, bar, tooltip, key, () => overScrim));
  const layout = layOutBar({
    readings: entries.map((entry) => widthOf(entry, slot)),
    menu: label.width + 2 * MENU_PADDING,
    width: DESIGN_WIDTH,
    margin: MARGIN,
  });
  createMenuButton(scene, label, layout.menu, menu);
  for (const [index, placed] of layout.readings.entries()) place(entries[index], placed);

  for (const entry of entries) {
    const { key } = entry;
    onClick(entry.hover, () => {
      if (overScrim) return;
      if (managesCity(key)) cityMode();
      else toggleYield(key);
    });
  }

  /** The readings the bar has ticking; a render owns them and takes them down. */
  let rising: Entry[] = [];

  /**
   * The stages under a rise the bar played: it answers each of them with nothing to wait on and
   * renders none of them, or every reading the rise ticked would snap back to theirs. A render from
   * the scene lets them all go, so a play-out let go of between a rise and its stages leaves none
   * behind; the rise's own closing paint must not, since the stages it claimed are still to come.
   */
  const claimed = new Set<Stage>();

  const render = (chronicle: Chronicle): void => {
    claimed.clear();
    paint(chronicle);
  };

  const paint = (chronicle: Chronicle): void => {
    overScrim = chronicle.deals.length > 0;
    bar.setDepth(overScrim ? OVER_SCRIM_DEPTH : BAR_DEPTH);
    for (const entry of rising) stopMotion(scene, entry.ticking);
    rising = [];
    for (const entry of entries) {
      const { count, over } = readingOf(chronicle, entry.key);
      entry.ticking.count = count;
      entry.value.setText(readsAs(count, over));
    }
  };

  /** The income arriving, or the growth after it: every reading that changed ticks to where it stands. */
  const rise = (chronicle: Chronicle): Promise<void> | undefined => {
    const ticking = entries.filter(
      (entry) => entry.ticking.count !== readingOf(chronicle, entry.key).count,
    );
    if (ticking.length === 0) return undefined;
    rising = ticking;

    return Promise.all(
      ticking.map((entry) => {
        const { count, over } = readingOf(chronicle, entry.key);
        return ended(
          scene.tweens.add({
            targets: entry.ticking,
            count,
            duration: 400,
            ease: EASE,
            onUpdate: () => entry.value.setText(readsAs(Math.round(entry.ticking.count), over)),
          }),
        );
      }),
    ).then(() => {
      // A render while these were ticking took them down and painted the readings it stands on.
      if (rising === ticking) paint(chronicle);
    });
  };

  const grouped = (stage: Group): Promise<void> | undefined => {
    switch (stage.name) {
      case 'income':
      case 'grow':
        for (const held of walked(stage.stages)) claimed.add(held);
        return rise(stage.chronicle);
      case 'played':
      case 'refused':
      case 'assign':
      case 'claim':
      case 'strike':
      case 'turn':
      case 'enemy-phase':
      case 'capstone':
      case 'deal':
      case 'answer':
      case 'reward':
      case 'attack':
      case 'camp-capture':
        return undefined;
    }
  };

  return {
    render,
    play(stage: Stage): Promise<void> | undefined {
      if (claimed.delete(stage)) return Promise.resolve();
      switch (stage.kind) {
        case 'change':
          return undefined;
        case 'group':
          return grouped(stage);
      }
    },
    latch(shown: ReadonlySet<Resource>): void {
      for (const entry of entries) {
        const down = entry.key !== 'population' && shown.has(entry.key);
        entry.well.setVisible(down);
        entry.face.setPosition(down ? SUNK : 0, down ? SUNK : 0);
        entry.word.setColor(down ? SUNK_WORD_INK : WORD_INK);
      }
    },
  };
}

/** The Menu button's label, measured before the bar is laid out: the flow ends at its width. */
function menuLabel(scene: Phaser.Scene): Phaser.GameObjects.Text {
  return addText(scene, 0, 0, text('menu.menu'), VALUE_STYLE).setOrigin(0.5, 0.5);
}

/**
 * The Menu button, in the zone the layout gave it at the bar's right end. It stands over the scrim
 * instead of in the bar, so it is still pressable while a window or the ending screen covers the
 * chronicle screen: a new chronicle is how a player leaves a chronicle that has ended.
 */
function createMenuButton(
  scene: Phaser.Scene,
  label: Phaser.GameObjects.Text,
  zone: Zone,
  pressed: () => void,
): void {
  const x = zone.x + zone.width / 2;
  const y = BAR_HEIGHT / 2;

  const button = scene.add
    .rectangle(x, y, zone.width, MENU_HEIGHT, PANEL_FILL)
    .setStrokeStyle(1, PANEL_EDGE)
    .setName('menu-button')
    .setInteractive({ useHandCursor: true });
  label.setPosition(x, y);
  // The label is added after the fill: equal depths draw in the order they were added, so a label
  // standing beside the button rather than inside it would be painted over by it.
  scene.add.container(0, 0, [button, label]).setDepth(OVER_SCRIM_DEPTH);
  onClick(button, pressed);
}

/**
 * The width every value grows rightward into, so no reading ever moves: two numbers of two digits
 * read over each other, which is four digits and the stroke between them. A value wider than that
 * grows into the gap before the next reading instead of moving it.
 */
function digitSlot(scene: Phaser.Scene): number {
  const digits = addText(scene, 0, 0, '00/00', VALUE_STYLE);
  const width = digits.width;
  digits.destroy();
  return width;
}

/**
 * The well of one reading: the floor it sits on, the edge it is cut into above and to the left, and
 * the light that catches below and to the right. Laid out where the reading is placed.
 */
function createWell(scene: Phaser.Scene, key: Reading): Phaser.GameObjects.Container {
  const parts = [WELL_FILL, PANEL_EDGE, PANEL_EDGE, WELL_LIGHT, WELL_LIGHT].map((colour) =>
    scene.add.rectangle(0, 0, 1, 1, colour).setOrigin(0, 0),
  );
  return scene.add.container(0, 0, parts).setName(`reading-${key}-well`).setVisible(false);
}

/** The well's five rectangles laid over the reading's own zone: the floor, then the four edges. */
function placeWell(well: Phaser.GameObjects.Container, x: number, width: number): void {
  const height = BAR_HEIGHT - 1;
  const [floor, top, left, bottom, right] = well.list as Phaser.GameObjects.Rectangle[];
  floor.setPosition(x, 0).setSize(width, height);
  top.setPosition(x, 0).setSize(width, 1);
  left.setPosition(x, 0).setSize(1, height);
  bottom.setPosition(x, height - 1).setSize(width, 1);
  right.setPosition(x + width - 1, 0).setSize(1, height);
}

function createEntry(
  scene: Phaser.Scene,
  bar: Phaser.GameObjects.Container,
  tooltip: Tooltip,
  key: Reading,
  quiet: () => boolean,
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
    () => {
      // The bubble stands under the scrim wherever the bar stands, so it is not raised over one.
      if (quiet()) return;
      tooltip.under(text(`tooltip.${key}`), hover.x, hover.x + hover.width / 2, BAR_HEIGHT + 8);
    },
    () => tooltip.hide(),
  );
  // The well is added first, so the reading it holds is painted inside it.
  const well = createWell(scene, key);
  const face = scene.add.container(0, 0, [chip, word, value]);
  bar.add([well, face, hover]);
  return { key, chip, word, value, face, well, ticking: { count: 0 }, hover };
}

function widthOf({ word }: Entry, slot: number): number {
  return CHIP_TO_WORD + word.width + WORD_TO_VALUE + slot;
}

/** One reading where the layout stands it: the press covers the zone the well is drawn in. */
function place(entry: Entry, { at, zone }: Placed): void {
  const middle = BAR_HEIGHT / 2;
  const { chip, word, value, hover, well } = entry;
  chip.setPosition(at + 5, middle);
  word.setPosition(at + CHIP_TO_WORD, middle);
  value.setPosition(at + CHIP_TO_WORD + word.width + WORD_TO_VALUE, middle);
  placeWell(well, zone.x, zone.width);
  hover.setPosition(zone.x, 0).setSize(zone.width, BAR_HEIGHT - 1);
}

/**
 * What a reading reads: the number a rise ticks through, and the whole it stands against, where it
 * has one — the idle population over all of it, the food stock over the growth threshold.
 */
function readingOf(chronicle: Chronicle, key: Reading): { count: number; over?: number } {
  switch (key) {
    case 'population':
      return { count: idle(chronicle), over: chronicle.population };
    case 'food':
      return { count: chronicle.resources.food, over: growthThreshold(chronicle) };
    default:
      return { count: chronicle.resources[key] };
  }
}

/** How a reading paints: the number alone, or the number over the whole it stands against. */
function readsAs(count: number, over: number | undefined): string {
  return over === undefined ? String(count) : text('reading.over', { count, over });
}
