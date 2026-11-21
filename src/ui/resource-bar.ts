import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { type Reckoning, reckoned } from '../rules/chronicle';
import { assignWaiting, claimWaiting } from '../rules/city';
import { RESOURCES, type Resource } from '../rules/resources';
import { type Group, type Stage, walked } from '../rules/stages';
import { type Chronicle, idle } from '../rules/state';
import { layOutReadings, type Placed } from './bar-layout';
import { EASE, ended, stopMotion } from './card-motion';
import type { CastSymbol } from './cast';
import {
  createChromePanel,
  createChromeWell,
  PANEL_RIMS,
  PAST_THE_EDGE,
  placeChromeWell,
  standChromePanel,
  type WellPiece,
} from './chrome';
import { type CityBarStock, cityBarOf, thresholdOf } from './city-bar';
import {
  addText,
  BAR_HEIGHT,
  type Box,
  inked,
  onClick,
  onHover,
  onResize,
  ownBoxOf,
  reactsToPress,
  type SizedStyle,
  type Stratum,
  screenSize,
  UI_FONT,
} from './design-space';
import { type GlyphPaint, glyphOf } from './glyphs';
import { type BarReading, css, LOOK } from './look';
import { asThresholdBar, type ThresholdBarSize, thresholdBarMarker } from './map-marks';
import { text } from './text';
import type { Tooltip } from './tooltip';

const WORD_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: css(LOOK.faintInk) };
const VALUE_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: css(LOOK.ink) };
const RECKONING_STYLE = { fontFamily: UI_FONT, fontSize: '13px', color: css(LOOK.ink) };

/** The weight a reckoning on its pill is set in. */
const ON_THE_PILL = 'bold';

const CHIP_TO_WORD = 18;
const WORD_TO_VALUE = 8;

/** How far past its glyph a reading that reads no word starts its value. */
const GLYPH_TO_VALUE = 6;

/** A reading's glyph on the resource bar, a side of its square. */
const BAR_GLYPH = 22;

/** How far the plate's ends stand off its first reading and its last. */
const PLATE_END = 16;

/** How far a reckoning's pill reaches past its number, sideways and up and down. */
const PILL_PAD = { x: 4, y: 1.5 };

/** How thick a threshold's bar under its reading is, and how far under the reading's middle its top stands. */
const THRESHOLD_BAR_WIDTH = 5;
const THRESHOLD_BAR_DROP = 13;

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

/** What a reading's tooltip reads: its sentence, under its name where it has one. */
type Tip = { readonly title?: string; readonly message: string };

/**
 * A reading as a bar draws one: the glyph, the word where it reads one, the value, the zone its
 * tooltip is raised from, and a side of its glyph's square.
 */
export type Reading = {
  readonly chip: Phaser.GameObjects.Container;
  readonly word: Phaser.GameObjects.Text | undefined;
  readonly value: Phaser.GameObjects.Text;
  readonly hover: Phaser.GameObjects.Zone;
  readonly glyph: number;
};

/** The threshold's bar a reading wears under it: its mark, its size, and the stock it reads. */
type ThresholdBar = {
  readonly mark: Phaser.GameObjects.Container;
  readonly size: ThresholdBarSize;
  readonly stock: CityBarStock;
};

type Entry = Reading & {
  readonly key: BarReading;
  /** What ending the turn now would do to the value, after it. */
  readonly reckoning: Phaser.GameObjects.Text;
  /** The pill the reckoning stands on while it reads a stock taken past nothing, or the population taken. */
  readonly pill: Phaser.GameObjects.Rectangle;
  /** The threshold's bar under food's reading and culture's, and none under the others. */
  readonly threshold: ThresholdBar | undefined;
  /** How far past the glyph the reading reaches, whatever its value reads: `roomOf`. */
  readonly room: number;
  /** Everything the reading shows together: what the well presses into the bar. */
  readonly face: Phaser.GameObjects.Container;
  /**
   * The well the reading sits in while it is latched down, or the gold it stands on while its act
   * waits; it stands only then, over the box `wellBox` holds.
   */
  readonly well: Phaser.GameObjects.NineSlice;
  readonly wellBox: Box;
  /** What the value reads, as the number a rise ticks through; the text follows it. */
  readonly ticking: { count: number };
  /** What the reckoning reads, as the last reckoning left it. */
  readonly reckoned: { last: Reckoned };
};

/** What a reading stands on: the bar's charcoal, the well it is latched down in, or the gold of an act waiting. */
type StandsOn = 'bar' | WellPiece;

/** The inks a reading's value and its reckoning read in on what it stands on, a reckoning on its pill aside. */
const INKS: Readonly<Record<StandsOn, { value: number; gain: number; loss: number }>> = {
  bar: { value: LOOK.charcoalInk, gain: LOOK.gain, loss: LOOK.loss },
  tab: { value: LOOK.charcoalInk, gain: LOOK.gain, loss: LOOK.loss },
  gold: { value: LOOK.metalInk, gain: LOOK.gainOnGold, loss: LOOK.lossOnGold },
};

/** What ending the turn would do to a reading: the count it moves by, and whether it stands on the pill. */
type Reckoned = { readonly count: number; readonly taken: boolean };

const NOTHING_RECKONED: Reckoned = { count: 0, taken: false };

export type ResourceBar = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /** Whether the bar reads the reckoning of what it renders, or none. */
  live(on: boolean): void;
  /** Latches down the readings of these resources, and lets every other one back up. */
  latch(shown: ReadonlySet<Resource>): void;
  /** Whether the object is the bar's paper between its readings, which is beside the things. */
  isPaper(object: Phaser.GameObjects.GameObject): boolean;
  /** Where the plate's left end stands on the screen as it is laid out now. */
  left(): number;
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

  /** The chronicle last rendered, and whether the bar reads its reckoning. */
  let rendered: Chronicle | undefined;
  let live = true;

  const tipOf = (key: BarReading) => (): Tip => {
    if (rendered === undefined) throw new Error('the bar raised a tooltip before it rendered');
    return { title: nameOf(rendered, key), message: text(`tooltip.${key}`) };
  };

  const { space, pill } = measures(scene);
  const unplaced = READINGS.map((key) =>
    createEntry(scene, bar, tooltip, key, roomOf(scene, key, space, pill), tipOf(key)),
  );
  const row = layOutReadings(
    unplaced.map((entry) => readingWidth(entry, entry.room)),
    PLATE_END,
  );
  const entries = unplaced.map((entry, index) => place(entry, row.readings[index]));

  const panel = createChromePanel(scene, PANEL_RIMS.strip).setName('resource-bar-panel');
  standChromePanel(panel, {
    x: 0,
    y: -PAST_THE_EDGE,
    width: row.width,
    height: BAR_HEIGHT + PAST_THE_EDGE,
  });
  // Never marked as reacting to a press, or the pointer is the hand over the whole bar.
  const paper = scene.add
    .zone(0, 0, row.width, BAR_HEIGHT)
    .setOrigin(0, 0)
    .setName('resource-bar')
    .setInteractive();
  bar.addAt([panel, paper], 0);

  const left = (): number => (screenSize().width - row.width) / 2;
  onResize(scene, () => {
    bar.setX(left());
  });

  for (const entry of entries) {
    const { key } = entry;
    onClick(reactsToPress(entry.hover), () => {
      if (managesCity(key)) cityMode();
      else toggleYield(key);
    });
  }

  /** The readings the bar has ticking; a render owns them and takes them down. */
  let rising: Entry[] = [];

  /** The resources the overlay holds latched, and the readings whose act in city mode is waiting. */
  let latched: ReadonlySet<Resource> = new Set();
  let waiting: ReadonlySet<BarReading> = new Set();

  /** What a reading stands on as the bar stands. */
  const standsOn = ({ key }: Entry): StandsOn => {
    if (waiting.has(key)) return 'gold';
    return key !== 'idle' && latched.has(key) ? 'tab' : 'bar';
  };

  /** A reading's value and reckoning inked for what it stands on. */
  const ink = (entry: Entry): void => {
    const inks = INKS[standsOn(entry)];
    const { count, taken } = entry.reckoned.last;
    inked(entry.value, inks.value);
    inked(
      entry.reckoning,
      taken ? LOOK.takenPastNothingInk : count > 0 ? inks.gain : count < 0 ? inks.loss : inks.value,
    );
  };

  /**
   * Every reading put in its well, stood on the gold or lifted out of both. A latch and a render each
   * arrive without the other, so both states are painted from here.
   */
  const dress = (): void => {
    for (const entry of entries) {
      const on = standsOn(entry);
      const down = on !== 'bar';
      entry.well.setVisible(down);
      if (down) placeChromeWell(entry.well, on, entry.wellBox);
      entry.face.setPosition(down ? SUNK : 0, down ? SUNK : 0);
      ink(entry);
    }
  };

  // Dead through the end of turn's play-out: on the chronicles it passes through, the reckoning reads
  // the income again after the income, the strikes still in hand counted a second time, and the
  // income alone after the discard.
  const reckon = (): void => {
    const read = live && rendered !== undefined ? reckoned(catalogue, rendered) : undefined;
    for (const entry of entries) {
      const reckoning = read === undefined ? NOTHING_RECKONED : reckoningOf(read, entry.key);
      entry.reckoned.last = reckoning;
      showReckoning(entry, reckoning, space);
      const { threshold } = entry;
      if (threshold !== undefined && rendered !== undefined) {
        const { mark, size, stock } = threshold;
        asThresholdBar(mark, size, stock, cityBarOf(rendered, stock, read?.stocks[stock]));
      }
      ink(entry);
    }
  };

  const render = (chronicle: Chronicle): void => {
    for (const entry of rising) stopMotion(scene, entry.ticking);
    rising = [];
    for (const entry of entries) {
      const count = readingOf(chronicle, entry.key);
      entry.ticking.count = count;
      entry.value.setText(readsAs(chronicle, entry.key, count));
    }
    rendered = chronicle;
    waiting = actsWaiting(catalogue, chronicle);
    reckon();
    dress();
  };

  /** Every reading that changed ticks to where it stands. */
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
            onUpdate: () =>
              entry.value.setText(readsAs(chronicle, entry.key, Math.round(entry.ticking.count))),
          }),
        ),
      ),
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
      case 'choice':
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
    left,
  };
}

/**
 * How wide a space after a value stands, and how wide a reckoning of two digits stands on its pill:
 * what every reading's room is measured with.
 */
function measures(scene: Phaser.Scene): { space: number; pill: number } {
  const space = measured(scene, ' ', VALUE_STYLE);
  const loss = measured(scene, text('reading.minus', { count: '00' }), {
    ...RECKONING_STYLE,
    fontStyle: ON_THE_PILL,
  });
  return { space, pill: loss + 2 * PILL_PAD.x };
}

/** How wide that text stands in that style, its own box. */
function measured(scene: Phaser.Scene, shown: string, style: SizedStyle): number {
  const sample = addText(scene, 0, 0, shown, style);
  const { width } = ownBoxOf(sample);
  sample.destroy();
  return width;
}

/**
 * The room after a reading's glyph that no value moves: the widest value it reads, a space, and a
 * reckoning of two digits on its pill. A value wider than that grows into the gap after the reading,
 * its reckoning with it.
 */
function roomOf(scene: Phaser.Scene, key: BarReading, space: number, pill: number): number {
  return measured(scene, widestOf(key), VALUE_STYLE) + space + pill;
}

/** The widest value a reading reads. */
function widestOf(key: BarReading): string {
  switch (key) {
    case 'idle':
      return text('reading.over', { count: '00', over: '00' });
    case 'food':
    case 'culture':
      return '00';
    case 'production':
    case 'military':
    case 'money':
    case 'science':
      return '000';
  }
}

/** The symbol whose glyph a reading wears. */
function chipSymbol(key: BarReading): CastSymbol {
  switch (key) {
    case 'idle':
      return 'population';
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
      return key;
  }
}

/** A reading's smaller glyph, a side of its square. */
export const READING_GLYPH = 10 * Math.SQRT2;

/** A glyph of `READING_GLYPH` standing at that point. */
export function chipAt(
  scene: Phaser.Scene,
  { x, y }: { x: number; y: number },
  symbol: CastSymbol,
  paint?: GlyphPaint,
): Phaser.GameObjects.Container {
  return glyphOf(scene, symbol, READING_GLYPH, paint).setPosition(x, y);
}

/**
 * A reading named `reading-<name>`, its value `reading-<name>-value`, its glyph `glyph` a side, and
 * the word where it is handed one, whose tooltip is raised under it. The caller adds its parts to the
 * bar and places it.
 */
export function createReading(
  scene: Phaser.Scene,
  tooltip: Tooltip,
  shown: { name: string; symbol: CastSymbol; glyph: number; word?: string; tip: () => Tip },
): Reading {
  const chip = glyphOf(scene, shown.symbol, shown.glyph);
  const word =
    shown.word === undefined
      ? undefined
      : addText(scene, 0, 0, shown.word, WORD_STYLE).setOrigin(0, 0.5);
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
      const { title, message } = shown.tip();
      tooltip.under(message, hover.getBounds().x, BAR_HEIGHT + 8, title);
    },
    () => tooltip.hide(),
  );
  return { chip, word, value, hover, glyph: shown.glyph };
}

function createEntry(
  scene: Phaser.Scene,
  bar: Phaser.GameObjects.Container,
  tooltip: Tooltip,
  key: BarReading,
  room: number,
  tip: () => Tip,
): Omit<Entry, 'wellBox'> {
  const reading = createReading(scene, tooltip, {
    name: key,
    symbol: chipSymbol(key),
    glyph: BAR_GLYPH,
    tip,
  });
  const { chip, value, hover } = reading;
  // Rounded past any height it is given: Phaser rounds a rectangle to half its smaller side at most.
  const pill = scene.add
    .rectangle(0, BAR_HEIGHT / 2, 1, 1, LOOK.takenPastNothing)
    .setRounded(BAR_HEIGHT)
    .setName(`reading-${key}-pill`)
    .setVisible(false);
  const reckoning = addText(scene, 0, BAR_HEIGHT / 2, '', RECKONING_STYLE)
    .setOrigin(0, 0.5)
    .setName(`reading-${key}-reckoning`);
  const threshold = thresholdBarUnder(scene, key, readingWidth(reading, room));
  // The well is added first, so the reading it holds is painted inside it.
  const well = createChromeWell(scene, `reading-${key}-well`).setVisible(false);
  const face = scene.add.container(0, 0, [
    chip,
    value,
    pill,
    reckoning,
    ...(threshold === undefined ? [] : [threshold.mark]),
  ]);
  bar.add([well, face, hover]);
  return {
    ...reading,
    key,
    reckoning,
    pill,
    threshold,
    room,
    face,
    well,
    ticking: { count: 0 },
    reckoned: { last: NOTHING_RECKONED },
  };
}

/** The threshold's bar a reading that long wears under it, named `reading-<key>-bar`: food's and culture's alone. */
function thresholdBarUnder(
  scene: Phaser.Scene,
  key: BarReading,
  length: number,
): ThresholdBar | undefined {
  switch (key) {
    case 'food':
    case 'culture': {
      const size = { length, width: THRESHOLD_BAR_WIDTH };
      return {
        mark: thresholdBarMarker(scene, size).setName(`reading-${key}-bar`),
        size,
        stock: key,
      };
    }
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'idle':
      return undefined;
  }
}

/** How wide a reading's content stands for the bar's row, its value taking the width handed. */
export function readingWidth({ word, glyph }: Reading, value: number): number {
  if (word === undefined) return glyph + GLYPH_TO_VALUE + value;
  return CHIP_TO_WORD + word.width + WORD_TO_VALUE + value;
}

/** A reading where the layout stands it: its zone covers the bar's height, less the edge at its foot. */
export function placeReading(
  { chip, word, value, hover, glyph }: Reading,
  { at, zone }: Placed,
): void {
  const middle = BAR_HEIGHT / 2;
  if (word === undefined) {
    chip.setPosition(at + glyph / 2, middle);
    const start = at + glyph + GLYPH_TO_VALUE;
    value.setPosition(start, middle);
    value.x += start - ownBoxOf(value).x;
  } else {
    chip.setPosition(at + 5, middle);
    word.setPosition(at + CHIP_TO_WORD, middle);
    value.setPosition(at + CHIP_TO_WORD + word.width + WORD_TO_VALUE, middle);
  }
  hover.setPosition(zone.x, 0).setSize(zone.width, BAR_HEIGHT - 1);
}

/** One reading where the row stands it, its threshold's bar under it, and the box its well is drawn over. */
function place(entry: Omit<Entry, 'wellBox'>, placed: Placed): Entry {
  placeReading(entry, placed);
  const { threshold } = entry;
  threshold?.mark.setPosition(
    placed.at + threshold.size.length / 2,
    BAR_HEIGHT / 2 + THRESHOLD_BAR_DROP + THRESHOLD_BAR_WIDTH / 2,
  );
  return {
    ...entry,
    wellBox: { x: placed.zone.x, y: 0, width: placed.zone.width, height: BAR_HEIGHT },
  };
}

/**
 * A reading's reckoning reading what it is handed, a space after the value, on its pill where it is
 * taken past nothing, set heavier there.
 */
function showReckoning(
  { value, reckoning, pill }: Entry,
  { count, taken }: Reckoned,
  space: number,
): void {
  // Each of the two writes compares before it redraws (phaser/src/gameobjects/text/Text.js:651-656,
  // phaser/src/gameobjects/text/TextStyle.js:625-635).
  reckoning.setText(reckoningReads(count)).setFontStyle(taken ? ON_THE_PILL : '');
  const after = ownBoxOf(value);
  const start = after.x + after.width + space;
  reckoning.x += (taken ? start + PILL_PAD.x : start) - ownBoxOf(reckoning).x;
  pill.setVisible(taken);
  if (!taken) return;
  const number = ownBoxOf(reckoning);
  const width = number.width + 2 * PILL_PAD.x;
  const height = number.height + 2 * PILL_PAD.y;
  if (pill.width !== width || pill.height !== height) pill.setSize(width, height);
  pill.setPosition(start + width / 2, reckoning.y);
}

/** What a reading's tooltip names it on the chronicle: food and culture with their stock over its threshold. */
function nameOf(chronicle: Chronicle, key: BarReading): string {
  switch (key) {
    case 'food':
    case 'culture':
      return text(`label.${key}`, {
        count: chronicle.resources[key],
        over: thresholdOf(chronicle, key),
      });
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'idle':
      return text(`label.${key}`);
  }
}

/** The number a reading's rise ticks through: a stock, or the idle population. */
function readingOf(chronicle: Chronicle, key: BarReading): number {
  switch (key) {
    case 'idle':
      return idle(chronicle);
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
      return chronicle.resources[key];
  }
}

/** How a reading paints that count: a stock alone, and the idle population over the population. */
function readsAs(chronicle: Chronicle, key: BarReading, count: number): string {
  switch (key) {
    case 'idle':
      return text('reading.over', { count, over: chronicle.population });
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
      return String(count);
  }
}

/** The readings whose act in city mode is waiting on the player. */
function actsWaiting(catalogue: Catalogue, chronicle: Chronicle): ReadonlySet<BarReading> {
  const waiting = new Set<BarReading>();
  if (claimWaiting(catalogue, chronicle)) waiting.add('culture');
  if (assignWaiting(chronicle)) waiting.add('idle');
  return waiting;
}

/**
 * What ending the turn would do to a reading: the count it moves by, and whether it is a stock taken
 * past nothing or the population taken.
 */
function reckoningOf(read: Reckoning, key: BarReading): Reckoned {
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
