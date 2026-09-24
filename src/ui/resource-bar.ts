import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { assignWaiting, claimWaiting, cultureThreshold, growthThreshold } from '../rules/city';
import { RESOURCES, type Resource } from '../rules/resources';
import { type Group, type Stage, walked } from '../rules/stages';
import { type Chronicle, idle } from '../rules/state';
import { layOutBar, type Placed } from './bar-layout';
import { EASE, ended, stopMotion } from './card-motion';
import {
  addText,
  answersPress,
  BAR_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  onHover,
  type Stratum,
  UI_FONT,
} from './design-space';
import { type BarReading, css, LOOK } from './look';
import { menuRoom } from './menu';
import { text } from './text';
import type { Tooltip } from './tooltip';

/** The word of a reading, and the ink it is lifted to while the reading is latched down. */
const WORD_INK = css(LOOK.faintInk);
const SUNK_WORD_INK = css(LOOK.ink);

const WORD_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: WORD_INK };
const VALUE_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: css(LOOK.ink) };

const CHIP_TO_WORD = 18;
const WORD_TO_VALUE = 8;

/** How far a reading in its well is pressed down and to the right. */
const SUNK = 1;

/** The readings the bar carries, in the order it reads them. */
const READINGS: readonly BarReading[] = [...RESOURCES, 'idle'];

/** The readings the city is managed by: pressing either of them enters city mode. */
const CITY_READINGS = ['culture', 'idle'] as const;

/** Whether a press on this reading enters city mode instead of toggling its resource. */
function managesCity(key: BarReading): key is (typeof CITY_READINGS)[number] {
  return CITY_READINGS.some((reading) => reading === key);
}

type Entry = {
  readonly key: BarReading;
  readonly chip: Phaser.GameObjects.Rectangle;
  readonly word: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
  /** The chip, the word and the value together: what the well presses into the bar. */
  readonly face: Phaser.GameObjects.Container;
  /** The well the reading sits in while it is latched down or its act waits; it stands only then. */
  readonly well: Phaser.GameObjects.Container;
  readonly floor: Phaser.GameObjects.Rectangle;
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
  on: Stratum,
  catalogue: Catalogue,
  tooltip: Tooltip,
  cityMode: () => void,
  toggleYield: (resource: Resource) => void,
): ResourceBar {
  const bar = scene.add.container(0, 0);
  on.layer.add(bar);
  bar.add(scene.add.rectangle(0, 0, DESIGN_WIDTH, BAR_HEIGHT, LOOK.panelFill).setOrigin(0, 0));
  bar.add(
    scene.add
      .rectangle(0, BAR_HEIGHT - 1, DESIGN_WIDTH, 1, LOOK.panelEdge)
      .setOrigin(0, 0)
      .setName('bar-edge'),
  );

  const slot = digitSlot(scene);

  const entries = READINGS.map((key) => createEntry(scene, bar, tooltip, key));
  const layout = layOutBar({
    readings: entries.map((entry) => widthOf(entry, slot)),
    menu: menuRoom(scene),
    width: DESIGN_WIDTH,
    margin: MARGIN,
  });
  for (const [index, placed] of layout.readings.entries()) place(entries[index], placed);

  for (const entry of entries) {
    const { key } = entry;
    onClick(answersPress(entry.hover), () => {
      if (managesCity(key)) cityMode();
      else toggleYield(key);
    });
  }

  /** The readings the bar has ticking; a render owns them and takes them down. */
  let rising: Entry[] = [];

  /** The resources the overlay holds latched, and the readings whose act in city mode is waiting. */
  let latched: ReadonlySet<Resource> = new Set();
  let waiting: ReadonlySet<BarReading> = new Set();

  /**
   * Every reading put in its well or lifted out of it. A latch and a render each arrive without the
   * other, so both states are painted from here.
   */
  const dress = (): void => {
    for (const entry of entries) {
      const filled = waiting.has(entry.key);
      const down = filled || (entry.key !== 'idle' && latched.has(entry.key));
      entry.well.setVisible(down);
      entry.floor.setFillStyle(filled ? LOOK.accent : LOOK.wellFill);
      entry.face.setPosition(down ? SUNK : 0, down ? SUNK : 0);
      entry.word.setColor(down ? SUNK_WORD_INK : WORD_INK);
    }
  };

  const render = (chronicle: Chronicle): void => {
    for (const entry of rising) stopMotion(scene, entry.ticking);
    rising = [];
    for (const entry of entries) {
      const { count, over } = readingOf(chronicle, entry.key);
      entry.ticking.count = count;
      entry.value.setText(readsAs(count, over));
    }
    waiting = actsWaiting(catalogue, chronicle);
    dress();
  };

  /** Every reading that changed ticks to where it stands. */
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
      if (rising === ticking) render(chronicle);
    });
  };

  /**
   * The stages under a rise the bar played: it answers each of them with nothing to wait on and
   * renders none of them, or every reading the rise ticked would snap back to theirs.
   */
  const claimed = new Set<Stage>();

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
      case 'capstone-landing':
      case 'capstone-continued':
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
      latched = shown;
      dress();
    },
  };
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
function createWell(
  scene: Phaser.Scene,
  key: BarReading,
): { well: Phaser.GameObjects.Container; floor: Phaser.GameObjects.Rectangle } {
  const [floor, ...edges] = [
    LOOK.wellFill,
    LOOK.panelEdge,
    LOOK.panelEdge,
    LOOK.wellLight,
    LOOK.wellLight,
  ].map((colour) => scene.add.rectangle(0, 0, 1, 1, colour).setOrigin(0, 0));
  floor.setName(`reading-${key}-floor`);
  const well = scene.add
    .container(0, 0, [floor, ...edges])
    .setName(`reading-${key}-well`)
    .setVisible(false);
  return { well, floor };
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

function chipColour(key: BarReading): number {
  switch (key) {
    case 'idle':
      return LOOK.population;
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
      return LOOK.reading[key];
  }
}

function createEntry(
  scene: Phaser.Scene,
  bar: Phaser.GameObjects.Container,
  tooltip: Tooltip,
  key: BarReading,
): Entry {
  const chip = scene.add.rectangle(0, 0, 10, 10, chipColour(key)).setAngle(45);
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
      tooltip.under(text(`tooltip.${key}`), hover.x, hover.x + hover.width / 2, BAR_HEIGHT + 8);
    },
    () => tooltip.hide(),
  );
  // The well is added first, so the reading it holds is painted inside it.
  const { well, floor } = createWell(scene, key);
  const face = scene.add.container(0, 0, [chip, word, value]);
  bar.add([well, face, hover]);
  return { key, chip, word, value, face, well, floor, ticking: { count: 0 }, hover };
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
 * What a reading reads: the number a rise ticks through, and the threshold it stands against, where
 * it has one — the food stock over the growth threshold, the culture stock over the culture
 * threshold, and the idle population alone.
 */
function readingOf(chronicle: Chronicle, key: BarReading): { count: number; over?: number } {
  switch (key) {
    case 'idle':
      return { count: idle(chronicle) };
    case 'food':
      return { count: chronicle.resources.food, over: growthThreshold(chronicle) };
    case 'culture':
      return { count: chronicle.resources.culture, over: cultureThreshold(chronicle) };
    case 'production':
    case 'military':
    case 'money':
    case 'science':
      return { count: chronicle.resources[key] };
  }
}

/** The readings whose act in city mode is waiting on the player: what fills a well in the accent. */
function actsWaiting(catalogue: Catalogue, chronicle: Chronicle): ReadonlySet<BarReading> {
  const waiting = new Set<BarReading>();
  if (claimWaiting(catalogue, chronicle)) waiting.add('culture');
  if (assignWaiting(chronicle)) waiting.add('idle');
  return waiting;
}

/** How a reading paints: the number alone, or the number over the threshold it stands against. */
function readsAs(count: number, over: number | undefined): string {
  return over === undefined ? String(count) : text('reading.over', { count, over });
}
