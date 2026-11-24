import type Phaser from 'phaser';
import type { Stage } from '../rules/stages';
import type { Chronicle } from '../rules/state';
import { trayNow } from './band';
import {
  createChromePanel,
  PANEL_RIMS,
  PAST_THE_EDGE,
  standChromePanel,
  takesThePointer,
} from './chrome';
import {
  addText,
  inked,
  onResize,
  ownBoxOf,
  type SizedStyle,
  type Stratum,
  UI_FONT,
} from './design-space';
import { createFoldTab, TAB_ROOM } from './fold-tab';
import { asGlyph, glyphMark } from './glyphs';
import {
  type LogLine,
  type LogReader,
  type LogReading,
  linesSkipped,
  logReaders,
  type Moved,
  type Named,
  type Removed,
} from './log-lines';
import { css, LOOK } from './look';
import { asFactionDisc, UNDARKENED, unitDiscMarker } from './map-marks';
import type { SightOn } from './map-motion';
import { createPanel, type Panel } from './panel';
import { LEDGER, LOG } from './pinned-layout';
import { type Pool, poolOf, rootedPoolOf } from './pool';
import { signedCount } from './resource-bar';
import {
  buildingName,
  cardName,
  improvementName,
  type TextKey,
  text,
  textAround,
  unitName,
} from './text';
import type { Tooltip } from './tooltip';

/** How many turns the log holds: the one the chronicle stands on and those before it. */
const TURNS_HELD = 5;

/** The padding round the log's rows. */
const PAD = { x: 12, y: 8 };
const ROW = 18;
const TYPE = 12;
const HEADING_TYPE = 11;
const DISC = 12;
const DISC_GLYPH = 0.64 * DISC;
const DISC_TO_NAME = 4;
/** How far a line's rows after its first are set in. */
const RUN_ON = 16;
const BEFORE_SIGNED = TYPE / 2;
const SIGNED_TO_GLYPH = 2;
const GLYPH = 12;

const WORDS_STYLE = { fontFamily: UI_FONT, fontSize: `${TYPE}px`, color: css(LOOK.charcoalInk) };
const NAME_STYLE = { ...WORDS_STYLE, fontStyle: 'bold' };
const HEADING_STYLE = {
  fontFamily: UI_FONT,
  fontSize: `${HEADING_TYPE}px`,
  color: css(LOOK.logHeadingInk),
};

/** What a line is laid from: words, a unit named, or a signed number and its glyph. */
type Token =
  | { readonly kind: 'words'; readonly words: string; readonly spaced: boolean }
  | { readonly kind: 'unit'; readonly named: Named; readonly spaced: boolean }
  | { readonly kind: 'signed'; readonly moved: Moved };

/** A part of a line laid on its rows: where it stands across, and on which row. */
type Laid =
  | { readonly kind: 'words'; readonly x: number; readonly row: number; readonly words: string }
  | { readonly kind: 'unit'; readonly x: number; readonly row: number; readonly named: Named }
  | { readonly kind: 'signed'; readonly x: number; readonly row: number; readonly moved: Moved };

/** A line laid: its parts, and how many rows it takes. */
type LaidLine = { readonly parts: readonly Laid[]; readonly rows: number };

/** What draws one line, its parts each from a pool of their kind. */
type LineMarks = {
  readonly root: Phaser.GameObjects.Container;
  readonly words: Pool<Phaser.GameObjects.Text>;
  readonly names: Pool<Phaser.GameObjects.Text>;
  readonly numbers: Pool<Phaser.GameObjects.Text>;
  readonly discs: Pool<Phaser.GameObjects.Container>;
  readonly glyphs: Pool<Phaser.GameObjects.Container>;
};

export type Log = {
  render(chronicle: Chronicle): void;
  /** Each line the stage reads landed, as the map plays it; the scene renders the stage itself. */
  play(stage: Stage): undefined;
  /** The stages a play-out is about to play, read ahead for the lines they may land. */
  hear(stages: readonly Stage[]): void;
  /** The play-out cut short: the lines of every stage it skipped landed, in the order they would have. */
  cutShort(): void;
  readonly scrolls: Pick<Panel, 'under' | 'wheel'>;
};

/**
 * The log against the screen's left edge under the ledger, reading in sentences what the chronicle
 * did where `sightOn` says the map plays it, each line under its turn's heading, as tall as its lines
 * down to just over the resting cards and scrolling past that; standing only while it holds a line.
 */
export function createLog(
  scene: Phaser.Scene,
  on: Stratum,
  {
    tooltip,
    unaim,
    sightOn,
  }: {
    tooltip: Tooltip;
    /** Whatever is being aimed let go, as a left click on a thing lets it go. */
    unaim: () => void;
    sightOn: (chronicle: Chronicle, standing?: Chronicle) => SightOn;
  },
): Log {
  const tab = createFoldTab(scene, on, {
    name: 'log',
    reads: text('button.log'),
    tooltip,
    unaim,
    fold: () => {
      lay();
    },
  });
  // Taking the pointer, though it reacts to no press, so no press reaches the map round the rows.
  const back = takesThePointer(createChromePanel(scene, PANEL_RIMS.strip)).setName('log');
  on.layer.add(back);
  const held = scene.add.container(0, 0).setName('log-held');
  const panel = createPanel(
    { scene, on, follow: () => {} },
    {
      name: 'log-lines',
      frame: { x: 0, y: LOG.top + PAD.y, width: LEDGER.width, height: TAB_ROOM - 2 * PAD.y },
      parts: [held],
      held: [],
      foot: LOG.top + PAD.y,
    },
  );

  // A Text keeps its context's font synced from its last draw (phaser/src/gameobjects/text/Text.js:
  // 1348, :1360, :1482), so these measure what a line lays without drawing.
  const rulers = {
    words: addText(scene, 0, 0, ' ', WORDS_STYLE).setVisible(false),
    names: addText(scene, 0, 0, ' ', NAME_STYLE).setVisible(false),
  };
  held.add([rulers.words, rulers.names]);
  const widthOf = (ruler: Phaser.GameObjects.Text, shown: string): number =>
    ruler.context.measureText(shown).width;
  const space = widthOf(rulers.words, ' ');

  let headings = 0;
  const headingPool = poolOf(held, () =>
    addText(scene, 0, 0, '', HEADING_STYLE).setOrigin(0, 0.5).setName(`log-heading-${headings++}`),
  );
  let made = 0;
  const linePool = rootedPoolOf(held, (): LineMarks => {
    const root = scene.add.container(0, 0).setName(`log-line-${made++}`);
    const texts = (style: SizedStyle): Pool<Phaser.GameObjects.Text> =>
      poolOf(root, () => addText(scene, 0, 0, '', style).setOrigin(0, 0.5));
    return {
      root,
      words: texts(WORDS_STYLE),
      names: texts(NAME_STYLE),
      numbers: texts(WORDS_STYLE),
      discs: poolOf(root, () => scene.add.container(0, 0, unitDiscMarker(scene, DISC))),
      glyphs: poolOf(root, () => glyphMark(scene)),
    };
  });

  /** The lines the log holds, a turn's under its heading, the oldest turn first. */
  let turns: { readonly turn: number; readonly lines: LogReading[] }[] = [];
  /** The turn the chronicle stands on, as last rendered. */
  let standing = 0;
  let readers = new Map<Stage, LogReader>();
  /** The stages of the play-out heard last that have played. */
  let played = new Set<Stage>();
  const laidLines = new WeakMap<LogReading, LaidLine>();

  const widthOfToken = (token: Token): number => {
    switch (token.kind) {
      case 'words':
        return widthOf(rulers.words, token.words);
      case 'unit':
        return DISC + DISC_TO_NAME + widthOf(rulers.names, unitName(token.named.kind));
      case 'signed':
        return widthOf(rulers.words, signedCount(token.moved.count)) + SIGNED_TO_GLYPH + GLYPH;
    }
  };

  /** How far a token stands after the one before it on its row, where it may start a row instead. */
  const gapOf = (token: Token): number => {
    switch (token.kind) {
      case 'words':
      case 'unit':
        return token.spaced ? space : 0;
      case 'signed':
        return BEFORE_SIGNED;
    }
  };

  /** A line's tokens laid from the left of its first row, each row on taking what fits. */
  const laidOf = (reading: LogReading): LaidLine => {
    const known = laidLines.get(reading);
    if (known !== undefined) return known;
    const parts: Laid[] = [];
    let row = 0;
    let x = PAD.x;
    let first = true;
    for (const token of tokenised(reading)) {
      const width = widthOfToken(token);
      let gap = first ? 0 : gapOf(token);
      if (!first && gap > 0 && x + gap + width > LEDGER.width - PAD.x) {
        row += 1;
        x = PAD.x + RUN_ON;
        gap = 0;
      }
      const at = x + gap;
      const last = parts[parts.length - 1];
      if (token.kind === 'words' && gap === space && last?.kind === 'words' && last.row === row) {
        parts[parts.length - 1] = { ...last, words: `${last.words} ${token.words}` };
      } else parts.push(laidToken(token, at, row));
      x = at + width;
      first = false;
    }
    const laid = { parts, rows: row + 1 };
    laidLines.set(reading, laid);
    return laid;
  };

  /** A text set and stood with its own box's left edge at `x`, its middle at `y`. */
  const standText = (label: Phaser.GameObjects.Text, shown: string, x: number, y: number): void => {
    label.setText(shown).setPosition(x, y);
    label.setX(label.x + x - ownBoxOf(label).x);
  };

  /** One line drawn on its marks from that height down; how many rows it took. */
  const drawLine = (marks: LineMarks, reading: LogReading, top: number): number => {
    const { parts, rows } = laidOf(reading);
    marks.root.setY(top);
    for (const pool of [marks.words, marks.names, marks.numbers, marks.discs, marks.glyphs]) {
      pool.hide();
    }
    for (const part of parts) {
      const middle = part.row * ROW + ROW / 2;
      switch (part.kind) {
        case 'words':
          standText(marks.words.take(), part.words, part.x, middle);
          break;
        case 'unit': {
          const disc = marks.discs.take().setPosition(part.x + DISC / 2, middle);
          const [round, sign] = disc.list as [Phaser.GameObjects.Arc, Phaser.GameObjects.Container];
          const { faction } = part.named;
          asFactionDisc([round, sign], faction, faction, DISC_GLYPH, UNDARKENED);
          const name = unitName(part.named.kind);
          standText(marks.names.take(), name, part.x + DISC + DISC_TO_NAME, middle);
          break;
        }
        case 'signed': {
          const { count, symbol } = part.moved;
          const number = inked(marks.numbers.take(), count > 0 ? LOOK.gain : LOOK.loss);
          standText(number, signedCount(count), part.x, middle);
          const after = part.x + widthOf(rulers.words, signedCount(count)) + SIGNED_TO_GLYPH;
          asGlyph(marks.glyphs.take(), symbol, GLYPH).setPosition(after + GLYPH / 2, middle);
          break;
        }
      }
    }
    return rows;
  };

  /** The log laid as it holds its lines, the room the window leaves it and whether it is folded. */
  const lay = (): void => {
    const holds = turns.length > 0;
    tab.show(holds);
    back.setVisible(holds && !tab.folded);
    panel.show(holds && !tab.folded);
    if (!holds) return;

    headingPool.hide();
    linePool.hide();
    let top = LOG.top + PAD.y;
    for (const { turn, lines } of turns) {
      standText(headingPool.take(), text('chronicle.turn', { turn }), PAD.x, top + ROW / 2);
      top += ROW;
      for (const line of lines) top += ROW * drawLine(linePool.take(), line, top);
    }
    const rowsTop = LOG.top + PAD.y;
    const room = Math.floor((trayNow().overTheHand - rowsTop - PAD.y) / ROW) * ROW;
    const height = Math.max(Math.min(top - rowsTop, room) + 2 * PAD.y, TAB_ROOM);
    standChromePanel(back, {
      x: -PAST_THE_EDGE,
      y: LOG.top,
      width: LEDGER.width + PAST_THE_EDGE,
      height,
    });
    // Cut inside the padding, so a log scrolled anywhere shows whole rows.
    panel.place({ x: 0, y: rowsTop, width: LEDGER.width, height: height - 2 * PAD.y }, 0, top);
    tab.lay(LOG.top, undefined);
  };
  onResize(scene, lay);

  /** The turns older than the log holds let go of; whether any was. */
  const prune = (): boolean => {
    const kept = turns.filter(({ turn }) => turn > standing - TURNS_HELD);
    const dropped = kept.length !== turns.length;
    turns = kept;
    return dropped;
  };

  const land = (lines: readonly LogLine[]): void => {
    if (lines.length === 0) return;
    for (const { turn, reads } of lines) {
      const last = turns[turns.length - 1];
      if (last?.turn === turn) last.lines.push(reads);
      else turns.push({ turn, lines: [reads] });
    }
    prune();
    lay();
    panel.toFoot();
  };

  return {
    render(chronicle) {
      standing = chronicle.turn;
      if (prune()) lay();
    },
    play(stage) {
      played.add(stage);
      const reader = readers.get(stage);
      const reads = reader?.read(sightOn(stage.chronicle));
      if (reader !== undefined && reads !== undefined) land([{ turn: reader.turn, reads }]);
      return undefined;
    },
    hear(stages) {
      readers = logReaders(stages);
      played = new Set();
    },
    cutShort() {
      land(linesSkipped(readers, played, (stage) => sightOn(stage.chronicle, stage.before)));
      readers = new Map();
    },
    scrolls: {
      under: (over) => panel.under(over) || over.includes(back),
      wheel: panel.wheel,
    },
  };
}

/** A part of a line, laid where it stands. */
function laidToken(token: Token, x: number, row: number): Laid {
  switch (token.kind) {
    case 'words':
      return { kind: 'words', x, row, words: token.words };
    case 'unit':
      return { kind: 'unit', x, row, named: token.named };
    case 'signed':
      return { kind: 'signed', x, row, moved: token.moved };
  }
}

/** What a line reads, as the tokens it is laid from. */
function tokenised(reading: LogReading): Token[] {
  switch (reading.kind) {
    case 'attack':
      return sentence('log.attack', reading, { damage: reading.damage });
    case 'kill':
      return sentence('log.kill', reading);
    case 'attacked':
      return sentence('log.attacked', reading, { damage: reading.damage });
    case 'killed':
      return sentence('log.killed', reading);
    case 'attacks':
      return sentence('log.attacks', reading);
    case 'enters':
      return sentence('log.enters', reading);
    case 'prepares-to-capture-your-city':
      return sentence('log.prepares-to-capture-your-city', reading);
    case 'prepares-to-capture':
      return sentence('log.prepares-to-capture', reading, {
        building: buildingName(reading.building),
      });
    case 'prepares-to-pillage':
      return sentence('log.prepares-to-pillage', reading);
    case 'pillages':
      return sentence('log.pillages', reading, { removed: removedName(reading.removed) });
    case 'captures':
      return sentence('log.captures', reading, { captured: buildingName(reading.building) });
    case 'income':
      return [...sentence('log.income', {}), ...signed(reading.moved)];
    case 'strikes':
      return [
        ...sentence('log.strikes', {}, { card: cardName(reading.card) }),
        ...signed(reading.moved),
      ];
    case 'grows':
      return [...sentence('log.grows', {}), ...signed(reading.moved)];
  }
}

/** What a pillage removed, by name: the building's, or else the improvements'. */
function removedName(removed: Removed): string {
  return 'building' in removed
    ? buildingName(removed.building)
    : removed.improvements.map(improvementName).join(', ');
}

/** The units a line reads, by the placeholder each stands in. */
type Units = Partial<Record<'attacker' | 'target' | 'unit', Named>>;

/**
 * The entry as tokens: its words split at their spaces, each unit it reads where its placeholder
 * stands, its other placeholders filled with their values.
 */
function sentence(
  key: TextKey,
  units: Units,
  values: Record<string, string | number> = {},
): Token[] {
  const slots = (['attacker', 'target', 'unit'] as const).filter(
    (slot) => units[slot] !== undefined,
  );
  const tokens: Token[] = [];
  let spaced = false;
  for (const part of textAround(key, slots, values)) {
    if (typeof part !== 'string') {
      const named = units[part.slot as keyof Units];
      if (named === undefined) throw new Error(`${key} reads no unit in {${part.slot}}`);
      tokens.push({ kind: 'unit', named, spaced });
      spaced = false;
      continue;
    }
    for (const run of part.split(/( +)/)) {
      if (run === '') continue;
      if (run.trim() === '') {
        spaced = true;
        continue;
      }
      tokens.push({ kind: 'words', words: run, spaced });
      spaced = false;
    }
  }
  return tokens;
}

/** Each stock or the population moved, as a signed number before its glyph. */
function signed(moved: readonly Moved[]): Token[] {
  return moved.map((each) => ({ kind: 'signed', moved: each }));
}
