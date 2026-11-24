import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import type { Tile } from '../rules/map';
import { buildingKind } from '../rules/map-kinds';
import type { Resource, Resources } from '../rules/resources';
import { addRun, centredMarks, GLYPH_SHARE } from './card-face';
import type { CastSymbol } from './cast';
import { createChromePanel, PANEL_RIMS, standChromePanel, takesThePointer } from './chrome';
import { SUMMARY_HEIGHT, SUMMARY_PAD_Y, SUMMARY_ROW } from './corner-layout';
import {
  addText,
  onHover,
  onResize,
  ownBoxOf,
  reactsToPress,
  type Stratum,
  UI_FONT,
} from './design-space';
import {
  type CardStat,
  damageReading,
  movementCostReading,
  onePerPoint,
  statTooltip,
  type UnitReading,
  unitFace,
  unitStats,
} from './face';
import { asGlyph, glyphMark } from './glyphs';
import type { Card } from './infopanel';
import { css, LOOK } from './look';
import { asFactionDisc, unitDiscMarker } from './map-marks';
import { cornerNow } from './menu';
import { poolOf } from './pool';
import { buildingName, terrainName, text, unitName } from './text';
import { STANDOFF, type Tooltip } from './tooltip';

/** How far the panel reaches past the summary's rows, sideways. */
const PAD_X = 12;

/** Where the middles of the panel's two rows stand under its top. */
const FIRST_ROW = SUMMARY_PAD_Y + SUMMARY_ROW / 2;
const SECOND_ROW = FIRST_ROW + SUMMARY_ROW;

/**
 * A sign's glyph, a side of its square, how far before its number it stands, and how far apart two
 * numbers stand.
 */
const GLYPH = 14;
const GLYPH_TO_NUMBER = 4;
const BETWEEN_NUMBERS = 14;

/**
 * How far a plus or a minus sign stands before its glyphs, how far apart the yield and the upkeep
 * stand, and how far before move's glyph what stands before it ends.
 */
const SIGN_TO_GLYPHS = 3;
const YIELD_TO_UPKEEP = 12;
const BEFORE_MOVE = 14;

/**
 * The faction's disc and the prepared badge: how wide each disc is, a side of its glyph's square, how
 * far before the name the faction's disc stands, and how far after it the badge does.
 */
const DISC = 14;
const DISC_GLYPH = 9;
const DISC_TO_NAME = 6;
const NAME_TO_BADGE = 8;

/** The tint a disc drawn as the map draws one is darkened by: nothing. */
const UNDARKENED = 0xffffff;

const NAME_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '16px',
  fontStyle: 'bold',
  color: css(LOOK.charcoalInk),
};
const NUMBER_STYLE = { fontFamily: UI_FONT, fontSize: '16px', color: css(LOOK.charcoalInk) };
const ASIDE_SIZE = 13;
const ASIDE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: `${ASIDE_SIZE}px`,
  color: css(LOOK.summaryPalerInk),
};

/** What a stat of the summary raises at a rest: a stat a unit's card reads, or what entering a tile costs. */
type Explained = CardStat | 'movement-cost';

/** The four numbers a unit's summary reads, each as its card on the infopanel reads it. */
type SummaryStats = Readonly<
  Pick<Record<CardStat, string>, 'health' | 'move' | 'action' | 'damage'>
>;

const EXPLAINED: readonly Explained[] = ['health', 'move', 'action', 'damage', 'movement-cost'];

/**
 * What the screen's selection is summarised from: the cards an inspection of its tile steps, as the
 * map draws the tile, whether the unit drawn there is what is selected, and what the tile yields.
 */
export type Summarised = {
  readonly cards: readonly Card[];
  readonly unit: boolean;
  readonly tile: Tile;
  readonly yields: Partial<Resources>;
};

export type Summary = {
  /** The summary reading the selection, or down where nothing is selected. */
  read(selected: Summarised | undefined): void;
};

/** The card of that kind among a tile's cards; a tile holding none is refused. */
function cardIn<K extends Card['kind']>(
  cards: readonly Card[],
  kind: K,
): Extract<Card, { readonly kind: K }> {
  const card = cards.find((one): one is Extract<Card, { readonly kind: K }> => one.kind === kind);
  if (card === undefined) throw new Error(`the tile summarised holds no ${kind} card`);
  return card;
}

/**
 * The summary of what is selected in the screen's top right corner, on the stratum: one panel of one
 * size, as wide as a unit reading its widest numbers, made once and read again at every selection;
 * a rest on a stat raises its tooltip under the panel.
 */
export function createSummary(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  tooltip: Tooltip,
): Summary {
  // Taking the pointer, though it reacts to no press, so no press reaches the map under it.
  const panel = takesThePointer(createChromePanel(scene, PANEL_RIMS.plate)).setName(
    'summary-panel',
  );
  const sign = unitDiscMarker(scene, DISC);
  const badge = unitDiscMarker(scene, DISC);
  const name = addText(scene, 0, FIRST_ROW, '', NAME_STYLE)
    .setOrigin(0, 0.5)
    .setName('summary-name');
  const aside = addRun(scene, '', ASIDE_STYLE, Number.POSITIVE_INFINITY);
  aside.label.setOrigin(1, 0.5).setName('summary-aside');
  const numbers = scene.add.container(0, 0).setName('numbers');
  const root = scene.add
    .container(0, 0, [panel, ...sign, ...badge, name, aside.label, numbers])
    .setName('summary')
    .setVisible(false);
  on.layer.add(root);
  const asideGlyphs = poolOf(root, () => glyphMark(scene));
  const texts = poolOf(numbers, () => addText(scene, 0, 0, '', NUMBER_STYLE).setOrigin(0, 0.5));
  const glyphs = poolOf(numbers, () => glyphMark(scene));

  /** Where each stat's zone stands across the second row, laid by the last reading. */
  const spans = new Map<Explained, { readonly from: number; readonly to: number }>();
  const zones = new Map(
    EXPLAINED.map((stat) => {
      const zone = reactsToPress(scene.add.zone(0, SECOND_ROW, 1, SUMMARY_ROW).setInteractive())
        .setName(`summary-${stat}`)
        .setVisible(false);
      root.add(zone);
      onHover(
        zone,
        () => {
          const { name: titled, sentence } = statTooltip(stat);
          const left = root.x + zone.x - zone.width / 2;
          tooltip.under(sentence, left, root.y + SUMMARY_HEIGHT + STANDOFF, titled);
        },
        () => {
          tooltip.hide();
        },
      );
      return [stat, zone] as const;
    }),
  );

  /** How far across the second row is laid, from the panel's left edge. */
  let x = PAD_X;

  const glyphAt = (symbol: CastSymbol, colour?: number): void => {
    const paint = colour === undefined ? {} : { colour };
    asGlyph(glyphs.take(), symbol, GLYPH, paint).setPosition(x + GLYPH / 2, SECOND_ROW);
    x += GLYPH;
  };
  const textAt = (reads: string): void => {
    const label = texts.take().setText(reads).setX(0);
    const own = ownBoxOf(label);
    label.setPosition(x - own.x, SECOND_ROW);
    x += own.width;
  };
  /** A stat's sign and its number, the stat's zone over both. */
  const statAt = (stat: Explained, symbol: CastSymbol, reads: string, colour?: number): void => {
    const from = x;
    glyphAt(symbol, colour);
    x += GLYPH_TO_NUMBER;
    textAt(reads);
    spans.set(stat, { from, to: x });
  };

  /** The second row laid empty, from its left end. */
  const clearRow = (): void => {
    texts.hide();
    glyphs.hide();
    spans.clear();
    x = PAD_X;
  };

  /** A unit's four numbers, each after its sign; how far across they reach. */
  const layStats = (stats: SummaryStats): number => {
    clearRow();
    const paler = LOOK.summaryPalerInk;
    statAt('health', 'health', stats.health);
    x += BETWEEN_NUMBERS;
    statAt('move', 'move', stats.move, paler);
    x += BETWEEN_NUMBERS;
    statAt('action', 'action', stats.action, paler);
    x += BETWEEN_NUMBERS;
    statAt('damage', 'damage', stats.damage, paler);
    return x;
  };

  const widest = layStats({
    health: text('reading.over', { count: 5, over: 5 }),
    move: text('reading.over', { count: 2, over: 2 }),
    action: text('reading.over', { count: 0, over: 1 }),
    damage: damageReading('2', 1),
  });
  const width = widest + PAD_X;
  standChromePanel(panel, { x: 0, y: 0, width, height: SUMMARY_HEIGHT });

  onResize(scene, () => {
    const { right, top } = cornerNow().summary;
    root.setPosition(right - width, top);
  });

  /** What ends the first row, set smaller and paler, its glyphs where its run stands them. */
  const asideReads = (entry: string): void => {
    const { label } = aside;
    label.setText(entry).setPosition(width - PAD_X, FIRST_ROW);
    const own = ownBoxOf(label);
    label.setX(label.x + width - PAD_X - (own.x + own.width));
    asideGlyphs.hide();
    for (const glyph of centredMarks(aside, {}).glyphs) {
      asGlyph(asideGlyphs.take(), glyph.symbol, GLYPH_SHARE * ASIDE_SIZE, {
        colour: LOOK.summaryPalerInk,
      }).setPosition(glyph.x, glyph.y);
    }
  };

  const showZones = (): void => {
    for (const [stat, zone] of zones) {
      const span = spans.get(stat);
      zone.setVisible(span !== undefined);
      if (span !== undefined) {
        zone
          .setPosition((span.from + span.to) / 2, SECOND_ROW)
          .setSize(span.to - span.from, SUMMARY_ROW);
      }
    }
  };

  const readUnit = (unit: UnitReading): void => {
    const { faction, prepares } = unit;
    for (const part of sign) part.setPosition(PAD_X + DISC / 2, FIRST_ROW);
    asFactionDisc(sign, faction, faction, DISC_GLYPH, UNDARKENED);
    name.setText(unitName(unit.stats.type)).setX(0);
    name.setX(PAD_X + DISC + DISC_TO_NAME - ownBoxOf(name).x);
    const after = ownBoxOf(name);
    for (const part of badge) {
      part.setPosition(after.x + after.width + NAME_TO_BADGE + DISC / 2, FIRST_ROW);
    }
    asFactionDisc(badge, faction, prepares, DISC_GLYPH, UNDARKENED);
    asideReads(unitFace(catalogue, unit).rules);
    layStats(unitStats(catalogue, unit));
  };

  const readTile = (tile: Tile, cards: readonly Card[], yields: Partial<Resources>): void => {
    for (const part of [...sign, ...badge]) part.setVisible(false);
    const { building } = tile;
    const terrain = terrainName(tile.terrain);
    name.setText(building === undefined ? terrain : buildingName(building)).setX(0);
    name.setX(PAD_X - ownBoxOf(name).x);
    asideReads(building === undefined ? '' : terrain);

    clearRow();
    let laid = false;
    const points = (side: 'gives' | 'takes', resources: readonly Resource[]): void => {
      if (resources.length === 0) return;
      if (laid) x += YIELD_TO_UPKEEP;
      textAt(text(`face.${side}`));
      x += SIGN_TO_GLYPHS;
      for (const resource of resources) glyphAt(resource);
      laid = true;
    };
    points('gives', onePerPoint(yields));
    points(
      'takes',
      building === undefined ? [] : onePerPoint(buildingKind(catalogue, building).upkeep ?? {}),
    );
    if (laid) x += BEFORE_MOVE;
    const { movementCost } = cardIn(cards, 'terrain').terrain;
    statAt('movement-cost', 'move', movementCostReading(movementCost), LOOK.summaryPalerInk);
  };

  return {
    read(selected: Summarised | undefined): void {
      root.setVisible(selected !== undefined);
      if (selected === undefined) return;
      const { cards, unit, tile, yields } = selected;
      if (unit) readUnit(cardIn(cards, 'unit').unit);
      else readTile(tile, cards, yields);
      showZones();
    },
  };
}
