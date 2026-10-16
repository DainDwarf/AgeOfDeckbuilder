import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { type Reckoning, reckoned } from '../rules/chronicle';
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
  ownBoxOf,
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
const RECKONING_STYLE = { fontFamily: UI_FONT, fontSize: '13px', color: css(LOOK.ink) };

const CHIP_TO_WORD = 18;
const WORD_TO_VALUE = 8;

/** How far what sits in a well is pressed down and to the right. */
export const SUNK = 1;

/** The readings the bar carries, in the order it reads them. */
const READINGS: readonly BarReading[] = [...RESOURCES, 'idle'];

/** The readings the city is managed by: pressing either of them enters city mode. */
const CITY_READINGS = ['culture', 'idle'] as const;

/** Whether a press on this reading enters city mode instead of toggling its resource. */
function managesCity(key: BarReading): key is (typeof CITY_READINGS)[number] {
  return CITY_READINGS.some((reading) => reading === key);
}

/** A reading as a bar draws one: the diamond, the word, the value, and the zone its tooltip is raised from. */
export type Reading = {
  readonly chip: Phaser.GameObjects.Rectangle;
  readonly word: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
  readonly hover: Phaser.GameObjects.Zone;
};

type Entry = Reading & {
  readonly key: BarReading;
  /** What ending the turn now would do to the value, after it. */
  readonly reckoning: Phaser.GameObjects.Text;
  /** The chip, the word, the value and its reckoning together: what the well presses into the bar. */
  readonly face: Phaser.GameObjects.Container;
  /** The well the reading sits in while it is latched down or its act waits; it stands only then. */
  readonly well: Phaser.GameObjects.Container;
  readonly floor: Phaser.GameObjects.Rectangle;
  /** What the value reads, as the number a rise ticks through; the text follows it. */
  readonly ticking: { count: number };
};

export type ResourceBar = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /** Whether the bar reads the reckoning of what it renders, or none. */
  live(on: boolean): void;
  /** Latches down the readings of these resources, and lets every other one back up. */
  latch(shown: ReadonlySet<Resource>): void;
  /** Whether the object is the bar's paper between its readings, which is beside the things. */
  isPaper(object: Phaser.GameObjects.GameObject): boolean;
};

export function createResourceBar(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  tooltip: Tooltip,
  presses: {
    cityMode: () => void;
    toggleYield: (resource: Resource) => void;
  },
): ResourceBar {
  const { cityMode, toggleYield } = presses;
  const bar = scene.add.container(0, 0);
  on.layer.add(bar);
  // Never marked as answering a press, or the pointer is the hand over the whole bar.
  const paper = scene.add
    .rectangle(0, 0, DESIGN_WIDTH, BAR_HEIGHT, LOOK.panelFill)
    .setOrigin(0, 0)
    .setName('resource-bar')
    .setInteractive();
  bar.add(paper);
  bar.add(
    scene.add
      .rectangle(0, BAR_HEIGHT - 1, DESIGN_WIDTH, 1, LOOK.panelEdge)
      .setOrigin(0, 0)
      .setName('bar-edge'),
  );

  const { slot, space } = digitSlot(scene);

  const entries = READINGS.map((key) => createEntry(scene, bar, tooltip, key));
  const layout = layOutBar({
    readings: entries.map((entry) => readingWidth(entry, slot)),
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
      entry.floor.setFillStyle(filled ? LOOK.actWaiting : LOOK.wellFill);
      entry.face.setPosition(down ? SUNK : 0, down ? SUNK : 0);
      entry.word.setColor(down ? SUNK_WORD_INK : WORD_INK);
    }
  };

  /** Whether the bar reads the reckoning of the chronicle last rendered, and that chronicle. */
  let live = true;
  let rendered: Chronicle | undefined;

  // Dead through the end of turn's play-out: on the chronicles it passes through, the reckoning reads
  // the income again after the income, the strikes still in hand counted a second time, and the
  // income alone after the discard.
  const reckon = (): void => {
    const read = live && rendered !== undefined ? reckoned(catalogue, rendered) : undefined;
    for (const entry of entries) {
      const { count, taken } =
        read === undefined ? { count: 0, taken: false } : reckoningOf(read, entry.key);
      entry.reckoning.setText(reckoningReads(count));
      entry.reckoning.setColor(css(taken ? LOOK.takenPastNothing : LOOK.ink));
      const value = ownBoxOf(entry.value);
      entry.reckoning.x += value.x + value.width + space - ownBoxOf(entry.reckoning).x;
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
    rendered = chronicle;
    reckon();
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
      case 'neutral-played':
      case 'strike':
      case 'turn':
      case 'enemy-phase':
      case 'capstone-landing':
      case 'capstone-continued':
      case 'deal':
      case 'answer':
      case 'reward':
      case 'attack':
      case 'capture':
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
    live(on: boolean): void {
      live = on;
      reckon();
    },
    latch(shown: ReadonlySet<Resource>): void {
      latched = shown;
      dress();
    },
    isPaper(object: Phaser.GameObjects.GameObject): boolean {
      return object === paper;
    },
  };
}

/**
 * The width every value grows rightward into, so no reading ever moves: two numbers of two digits
 * read over each other, a space, and a reckoning of two digits; and that space. A value wider than
 * that grows into the gap before the next reading, its reckoning with it.
 */
function digitSlot(scene: Phaser.Scene): { slot: number; space: number } {
  const measured = (shown: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
    const sample = addText(scene, 0, 0, shown, style);
    const sizes = { width: sample.width, own: ownBoxOf(sample).width };
    sample.destroy();
    return sizes;
  };
  const space = measured(' ', VALUE_STYLE).own;
  const reckoning = measured(text('reading.minus', { count: '00' }), RECKONING_STYLE).own;
  return { slot: measured('00/00', VALUE_STYLE).width + space + reckoning, space };
}

/**
 * A well: the floor what sits in it rests on, named `<name>-floor`, the edge it is cut into above and
 * to the left, and the light that catches below and to the right. Laid out by `placeWell`.
 */
export function createWell(
  scene: Phaser.Scene,
  name: string,
): { well: Phaser.GameObjects.Container; floor: Phaser.GameObjects.Rectangle } {
  const [floor, ...edges] = [
    LOOK.wellFill,
    LOOK.panelEdge,
    LOOK.panelEdge,
    LOOK.wellLight,
    LOOK.wellLight,
  ].map((colour) => scene.add.rectangle(0, 0, 1, 1, colour).setOrigin(0, 0));
  floor.setName(`${name}-floor`);
  const well = scene.add.container(0, 0, [floor, ...edges]).setName(`${name}-well`);
  return { well, floor };
}

/** The well's five rectangles laid over a rectangle: the floor, then the four edges. */
export function placeWell(
  well: Phaser.GameObjects.Container,
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
): void {
  const [floor, top, left, bottom, right] = well.list as Phaser.GameObjects.Rectangle[];
  floor.setPosition(x, y).setSize(width, height);
  top.setPosition(x, y).setSize(width, 1);
  left.setPosition(x, y).setSize(1, height);
  bottom.setPosition(x, y + height - 1).setSize(width, 1);
  right.setPosition(x + width - 1, y).setSize(1, height);
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

export function chipAt(
  scene: Phaser.Scene,
  { x, y }: { x: number; y: number },
  colour: number,
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, 10, 10, colour).setAngle(45);
}

/**
 * A reading named `reading-<name>`, its value `reading-<name>-value`, whose tooltip is raised under
 * it. The caller adds its parts to the bar and places it; its zone's coordinates are the screen's.
 */
export function createReading(
  scene: Phaser.Scene,
  tooltip: Tooltip,
  shown: { name: string; colour: number; word: string; tip: string },
): Reading {
  const chip = chipAt(scene, { x: 0, y: 0 }, shown.colour);
  const word = addText(scene, 0, 0, shown.word, WORD_STYLE).setOrigin(0, 0.5);
  const value = addText(scene, 0, 0, '', VALUE_STYLE)
    .setOrigin(0, 0.5)
    .setName(`reading-${shown.name}-value`);
  const hover = scene.add
    .zone(0, 0, 1, BAR_HEIGHT)
    .setOrigin(0, 0)
    .setName(`reading-${shown.name}`)
    .setInteractive();
  onHover(
    hover,
    () => {
      tooltip.under(shown.tip, hover.x, hover.x + hover.width / 2, BAR_HEIGHT + 8);
    },
    () => tooltip.hide(),
  );
  return { chip, word, value, hover };
}

function createEntry(
  scene: Phaser.Scene,
  bar: Phaser.GameObjects.Container,
  tooltip: Tooltip,
  key: BarReading,
): Entry {
  const reading = createReading(scene, tooltip, {
    name: key,
    colour: chipColour(key),
    word: text(`label.${key}`),
    tip: text(`tooltip.${key}`),
  });
  const { chip, word, value, hover } = reading;
  const reckoning = addText(scene, 0, BAR_HEIGHT / 2, '', RECKONING_STYLE)
    .setOrigin(0, 0.5)
    .setName(`reading-${key}-reckoning`);
  // The well is added first, so the reading it holds is painted inside it.
  const { well, floor } = createWell(scene, `reading-${key}`);
  well.setVisible(false);
  const face = scene.add.container(0, 0, [chip, word, value, reckoning]);
  bar.add([well, face, hover]);
  return { ...reading, key, reckoning, face, well, floor, ticking: { count: 0 } };
}

/** How wide a reading's content stands for the bar's flow, its value taking the width handed. */
export function readingWidth({ word }: Reading, value: number): number {
  return CHIP_TO_WORD + word.width + WORD_TO_VALUE + value;
}

/** A reading where the layout stands it: its zone covers the bar's height, less the edge at its foot. */
export function placeReading({ chip, word, value, hover }: Reading, { at, zone }: Placed): void {
  const middle = BAR_HEIGHT / 2;
  chip.setPosition(at + 5, middle);
  word.setPosition(at + CHIP_TO_WORD, middle);
  value.setPosition(at + CHIP_TO_WORD + word.width + WORD_TO_VALUE, middle);
  hover.setPosition(zone.x, 0).setSize(zone.width, BAR_HEIGHT - 1);
}

/** One reading where the layout stands it: the press covers the zone the well is drawn in. */
function place(entry: Entry, placed: Placed): void {
  placeReading(entry, placed);
  placeWell(entry.well, {
    x: placed.zone.x,
    y: 0,
    width: placed.zone.width,
    height: BAR_HEIGHT - 1,
  });
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
      return { count: chronicle.resources.food, over: growthThreshold(chronicle, 'player') };
    case 'culture':
      return { count: chronicle.resources.culture, over: cultureThreshold(chronicle, 'player') };
    case 'production':
    case 'military':
    case 'money':
    case 'science':
      return { count: chronicle.resources[key] };
  }
}

/** The readings whose act in city mode is waiting on the player. */
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

/**
 * What ending the turn would do to a reading: the count it moves by, and whether it is a stock taken
 * past nothing or the population taken.
 */
function reckoningOf(read: Reckoning, key: BarReading): { count: number; taken: boolean } {
  switch (key) {
    case 'idle':
      return { count: read.population, taken: read.population < 0 };
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
      return { count: read.stocks[key], taken: read.pastNothing.has(key) };
  }
}

/** How a reckoning paints: signed, and nothing where it moves nothing. */
function reckoningReads(count: number): string {
  if (count > 0) return text('reading.plus', { count });
  if (count < 0) return text('reading.minus', { count: -count });
  return '';
}
