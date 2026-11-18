import Phaser from 'phaser';
import {
  bonusOf,
  type Catalogue,
  damageOf,
  fullHealth,
  standsOnWaterAlone,
  unitKind,
} from '../rules/catalogue';
import { type PreparedAs, preparedAs } from '../rules/enemies';
import { groundCost, movementCost, runsAlong, type TilesBeside } from '../rules/map';
import { featureKind, improvementKind, terrainKind } from '../rules/map-kinds';
import { RESOURCES, type Resource, type Resources } from '../rules/resources';
import { unitShown } from '../rules/sight';
import { type Chronicle, NO_REFUSAL } from '../rules/state';
import { relationsOf, type Unit } from '../rules/units';
import { type YieldPart, type YieldSource, yieldParts } from '../rules/yields';
import {
  CARD_HEIGHT,
  type CardFace,
  createCardFace,
  createFootBubble,
  type Name,
  type SmallCards,
} from './card-face';
import { CARD_WIDTH } from './card-frames';
import { stopMotion } from './card-motion';
import { addText, onHover, type Stratum, UI_FONT } from './design-space';
import { buildingFace, inMovePoints } from './face';
import { factionSigns } from './faction-signs';
import { glyphOf } from './glyphs';
import { css, LOOK } from './look';
import type { Drawn, TileFace } from './map';
import {
  buildingMark,
  featureMark,
  improvementMark,
  inCanoe,
  type Mark,
  paintedBoundsOf,
  riverMark,
  terrainMark,
  unitFittedBy,
  unitMark,
} from './map-marks';
import { buildingName, featureName, improvementName, terrainName, text, unitName } from './text';
import type { Reference } from './text-run';
import type { Tooltip } from './tooltip';

/** How wide a card of the infopanel's grey paper stands, and a thing named shown small. */
export const PAPER_WIDTH = 130;

/** Every measure inside a card of grey paper is a multiple of `em`, so one width scales it whole. */
export function paperMetricsOf(width: number): {
  height: number;
  em: number;
  pad: number;
  radius: number;
} {
  const em = width * 0.13;
  return { height: Math.round(width * 1.4), em, pad: 0.55 * em, radius: 0.45 * em };
}

/** How tall a card of grey paper stands at `PAPER_WIDTH`. */
export const PAPER_HEIGHT = paperMetricsOf(PAPER_WIDTH).height;

/** The smallest type on a card of grey paper, as a share of its `em`; `addText` refuses less at `PAPER_WIDTH`. */
const SMALLEST_TYPE = 0.66;

/**
 * A card's grey paper and its edge that wide, and as tall as a card of grey paper that wide unless
 * told, from the top-left corner of its box.
 */
function drawPaper(
  surface: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height = paperMetricsOf(width).height,
): void {
  const { radius } = paperMetricsOf(width);
  surface.fillStyle(LOOK.affordableCard.face);
  surface.fillRoundedRect(x, y, width, height, radius);
  surface.lineStyle(1, LOOK.cardEdge);
  surface.strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, radius);
}

/** One line of a card's ledger: what it is drawn and named by, and what it gives at income. */
type Row = (Exclude<YieldSource, { readonly kind: 'building' }> | { readonly kind: 'river' }) & {
  readonly yields: Partial<Resources>;
};

/**
 * What a unit card reads: a unit on the map, one a snapshot kept as it stood, or a unit kind read as
 * a unit fresh of it, the damage its attack removes, what its prepare lands as, if it has prepared,
 * and whether it is the neutral's while it is hostile.
 */
type UnitReading = Pick<Unit, 'stats' | 'faction' | 'movePoints' | 'action' | 'embarked'> & {
  readonly damage: number;
  readonly prepares?: PreparedAs;
  readonly hostile?: boolean;
};

/**
 * One card an inspection steps through: the unit's, the building's, which is its face, or the
 * terrain's, headed by the first of the rows it holds.
 */
export type Card =
  | { readonly kind: 'unit'; readonly unit: UnitReading }
  | { readonly kind: 'building'; readonly building: string }
  | {
      readonly kind: 'terrain';
      readonly rows: readonly Row[];
      readonly movementCost: number | undefined;
    };

/**
 * What a card of grey paper is drawn from: the unit's or the terrain's an inspection steps through,
 * or a feature or an improvement named alone.
 */
type Drawing =
  | Exclude<Card, { readonly kind: 'building' }>
  | { readonly kind: 'feature' | 'improvement'; readonly rows: readonly Row[] };

/** A thing a name names that is neither a card nor a building, each of which a face shows. */
export type Thing = Exclude<Reference, { readonly kind: 'card' | 'building' }>;

/** The card the infopanel reads a thing named by: its one row, or the unit kind read fresh. */
function drawingOf(catalogue: Catalogue, thing: Thing): Drawing {
  switch (thing.kind) {
    case 'terrain':
      return {
        kind: 'terrain',
        rows: [
          { kind: 'terrain', terrain: thing.id, yields: terrainKind(catalogue, thing.id).yields },
        ],
        movementCost: costRead((embarked) => groundCost(catalogue, thing.id, embarked)),
      };
    case 'feature':
      return {
        kind: 'feature',
        rows: [
          { kind: 'feature', feature: thing.id, yields: featureKind(catalogue, thing.id).yields },
        ],
      };
    case 'improvement':
      return {
        kind: 'improvement',
        rows: [
          {
            kind: 'improvement',
            improvement: thing.id,
            yields: improvementKind(catalogue, thing.id).yields,
          },
        ],
      };
    case 'player':
    case 'enemy': {
      const stats = unitKind(catalogue, thing.id);
      const unit = {
        stats,
        faction: thing.kind,
        movePoints: stats.move,
        action: stats.action,
        embarked: standsOnWaterAlone(catalogue, thing.id),
        damage: stats.damage,
      };
      return { kind: 'unit', unit };
    }
  }
}

/**
 * What the terrain card reads in its corner, out of what entering costs a unit embarked or ashore:
 * the cost ashore, or, where none is, the cost embarked; nothing where nothing crosses it.
 */
function costRead(cost: (embarked: boolean) => number | undefined): number | undefined {
  return cost(false) ?? cost(true);
}

/**
 * A thing named, drawn as the card the infopanel reads it by at `width`, about its own bottom centre
 * as a card face is, and carrying what it stands in its data as `reference`. Its rows raise nothing.
 */
export function createThingCard(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  thing: Thing,
  width: number,
): Phaser.GameObjects.Container {
  const paper = buildPaper(scene, catalogue, drawingOf(catalogue, thing), width, undefined, false);
  paper.root.setPosition(-width / 2, -paperMetricsOf(width).height);
  return scene.add.container(0, 0, [paper.root]).setData('reference', thing);
}

/**
 * The row a part of a tile's yield is on the terrain card, and whether it stands ahead of the river's
 * row or after it; nothing for the building's own part, its card reading no row.
 */
function rowOf(part: YieldPart): { place: 'ground' | 'beside'; row: Row } | undefined {
  switch (part.kind) {
    case 'building':
      return undefined;
    case 'terrain':
    case 'feature':
    case 'improvement':
      return { place: 'ground', row: part };
    case 'beside':
      return { place: 'beside', row: part };
  }
}

/**
 * What the map draws of a tile, as the cards an inspection steps, each row read off the face's
 * yield: the unit, the building card, and the terrain card, which always stands.
 */
export function cardsOf(
  catalogue: Catalogue,
  face: Drawn,
  chronicle: Pick<
    Chronicle,
    'city' | 'neutral' | 'relations' | 'turn' | 'timeline' | 'units' | 'rivers'
  >,
  beside: TilesBeside,
): Card[] {
  const { tile } = face;
  const cards: Card[] = [];

  const unit = unitShown(chronicle.units, face);
  if (unit !== undefined) {
    const prepares = preparedAs(chronicle, unit);
    const hostile = unit.faction === 'neutral' && relationsOf(chronicle) === 'hostile';
    const damage = damageOf(catalogue, chronicle.units, unit);
    cards.push({ kind: 'unit', unit: { ...unit, damage, prepares, hostile } });
  }

  if (tile.building !== undefined) cards.push({ kind: 'building', building: tile.building });

  const parts = yieldParts(catalogue, chronicle, tile, beside);
  const rows = (place: 'ground' | 'beside'): Row[] =>
    parts.flatMap((part) => {
      const placed = rowOf(part);
      return placed?.place === place ? [placed.row] : [];
    });

  const river: Row[] = runsAlong(chronicle.rivers, tile) ? [{ kind: 'river', yields: {} }] : [];
  cards.push({
    kind: 'terrain',
    rows: [...rows('ground'), ...river, ...rows('beside')],
    movementCost: costRead((embarked) => movementCost(catalogue, tile, embarked)),
  });

  return cards;
}

export type InfoPanel = {
  /**
   * The card at `index`, beside the tile, over one ghost per card behind it. `cycling` dissolves it
   * out of the card already shown; anything else is instant.
   */
  show(cards: Card[], index: number, at: TileFace, cycling: boolean): void;
  /**
   * Stands what it is showing beside the same face again, at the size on screen it already had:
   * the map now measures in a different unit. Whatever a row, a name or the foot had raised goes
   * down.
   */
  rescale(): void;
  hide(): void;
};

/**
 * What the names on the building card raise on the screen standing over the map: its small cards,
 * on the stratum they stand on, and the named thing shown large.
 */
export type PanelNames = {
  readonly small: Pick<SmallCards, 'over' | 'down'>;
  readonly on: Stratum;
  inspect(name: Name): void;
};

/** How far the panel stands clear of the face it reads, in design pixels. */
const STANDOFF = 12;

/** How far each card waiting behind the panel stands out of it, down and to the right. */
const GHOST_OFFSET = 4;

/** How long one card takes to dissolve into the next. */
const CYCLE_MS = 150;

/** The type a card's face is set in, sized by the `em` of the width it is drawn at. */
function stylesOf(em: number) {
  const fontSize = `${SMALLEST_TYPE * em}px`;
  const label = { fontFamily: UI_FONT, fontSize, color: css(LOOK.faintInk) };
  const value = { fontFamily: UI_FONT, fontSize, color: css(LOOK.ink) };
  return {
    title: {
      fontFamily: UI_FONT,
      fontSize: `${0.75 * em}px`,
      fontStyle: 'bold',
      color: css(LOOK.ink),
    },
    label,
    value,
    chip: { ...value, fontStyle: 'bold' },
  };
}

const STATS = ['health', 'damage', 'bonus', 'range', 'move', 'action', 'sight'] as const;

type Stat = (typeof STATS)[number];

/** The stats a unit card reads, in the order `STATS` lists them. */
function statsOf(catalogue: Catalogue, unit: UnitReading): readonly Stat[] {
  return STATS.filter((stat) => readsRow(catalogue, unit, stat));
}

/**
 * Whether a unit card reads the stat's row: an embarked unit's reads no damage and no range, and the
 * card of a unit whose kind carries no bonus reads none.
 */
function readsRow(catalogue: Catalogue, unit: UnitReading, stat: Stat): boolean {
  switch (stat) {
    case 'damage':
    case 'range':
      return !unit.embarked;
    case 'bonus':
      return bonusOf(catalogue, unit.stats) > 0;
    case 'health':
    case 'move':
    case 'action':
    case 'sight':
      return true;
  }
}

/** What a row of a card is named by: one `label.` and one `tooltip.` entry each. */
type Term = Stat | Resource;

/**
 * What a stat's row reads: what the unit has left over its own number, where it has two, and its own
 * damage and the bonus it carries, where it carries one.
 */
function readingOf(catalogue: Catalogue, unit: UnitReading, stat: Stat): string {
  switch (stat) {
    case 'health':
      return `${unit.stats.health} / ${fullHealth(catalogue, unit.stats)}`;
    case 'move':
      return `${inMovePoints(unit.movePoints)} / ${inMovePoints(unit.stats.move)}`;
    case 'action':
      return `${unit.action} / ${unit.stats.action}`;
    case 'damage': {
      const carried = unit.damage - unit.stats.damage;
      return carried > 0 ? `${unit.stats.damage} + ${carried}` : String(unit.stats.damage);
    }
    case 'bonus':
      return text('reading.plus', { count: bonusOf(catalogue, unit.stats) });
    case 'range':
    case 'sight':
      return String(unit.stats[stat]);
  }
}

/** One card of grey paper drawn: its paper, its contents, and the zones its rows raise tooltips from. */
type Paper = {
  readonly root: Phaser.GameObjects.Container;
  readonly hovers: Phaser.GameObjects.Zone[];
};

/**
 * The card the panel stands: one of grey paper, or the building card's face, which the panel's root
 * holds laid out from its top-left corner as the paper is; and its size.
 */
type Shown = Paper & {
  readonly face: CardFace | undefined;
  readonly width: number;
  readonly height: number;
};

/** Where the panel stands on the map, and what it measures in there, for the bubbles its rows raise. */
type Box = { left: number; top: number; unit: number };

/** What a row reacts with: the one bubble raised beside its own middle in the card or let go. */
type RowReactions = {
  raise(centre: number, message: string): void;
  drop(): void;
};

/**
 * A tile inspected: one card at a time, the cards behind it showing as ghosts under its corner. It
 * stands on the map itself, so a pan carries it with the tile it inspects and nothing here hears
 * about one. Every show rebuilds the card, so nothing here follows a state change — the panel is
 * dismissed by whatever caused one.
 */
export function createInfoPanel(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  tooltip: Tooltip,
  names: PanelNames,
): InfoPanel {
  const ghosts = scene.add.graphics();
  // Interactive, so no press reaches the map's catchers under it, and never marked as reacting to one.
  const stop = scene.add.zone(0, 0, PAPER_WIDTH, PAPER_HEIGHT).setOrigin(0, 0).setInteractive();
  const panel = scene.add.container(0, 0, [ghosts, stop]).setName('infopanel').setVisible(false);
  on.layer.add(panel);
  const footBubble = createFootBubble(tooltip);

  let standing: Shown | undefined;
  let leaving: Shown | undefined;
  /** How many cards wait behind the one standing: the ghosts, and the room they ask for. */
  let behind = 0;
  const box: Box = { left: 0, top: 0, unit: 1 };
  /** The face the panel is standing beside, and nothing while it stands nowhere. */
  let beside: TileFace | undefined;
  /** Whether the small cards were last told the pointer is on a name of the face standing. */
  let onName = false;
  /** Whether the small cards standing were raised off a name of the face standing. */
  let chained = false;

  const reactions: RowReactions = {
    raise(centre: number, message: string): void {
      tooltip.beside(message, () => ({
        x: box.left + PAPER_WIDTH * box.unit,
        y: box.top + centre * box.unit,
      }));
    },
    drop(): void {
      tooltip.hide();
    },
  };

  /** What the standing card's rows, names and foot raised, taken down. */
  const letGo = (): void => {
    reactions.drop();
    if (standing?.face !== undefined) footBubble.over(standing.face, undefined);
    if (onName) names.small.over(undefined);
    if (chained) names.small.down();
    onName = false;
    chained = false;
  };

  /** Where a point of the map stands on the screen the small cards stand on. */
  const onScreen = (x: number, y: number): { x: number; y: number } => {
    const canvas = on.onCanvas(x, y);
    return names.on.at(canvas.x, canvas.y);
  };

  /**
   * The building's face, drawn as its card is in the hand, its top-left corner where the panel's
   * cards stand theirs; its names raise the screen's small cards while it stands, and its foot the
   * map's bubble.
   */
  const faceOf = (building: string): Shown => {
    const face: CardFace = createCardFace(scene, buildingFace(catalogue, building), NO_REFUSAL, {
      names: {
        over: (name) => {
          onName = name !== undefined;
          names.small.over(
            name === undefined
              ? undefined
              : {
                  name,
                  where: () => {
                    const spot = face.spotOf(name);
                    const top = onScreen(spot.x, spot.top);
                    const bottom = onScreen(spot.x, spot.bottom);
                    return { x: top.x, top: top.y, bottom: bottom.y };
                  },
                  hold: (held) => {
                    chained = held;
                  },
                },
          );
        },
        inspect: (name) => {
          names.inspect(name);
        },
        footOver: (label) => {
          footBubble.over(face, label);
        },
      },
    });
    face.root.setPosition(CARD_WIDTH / 2, CARD_HEIGHT);
    const root = scene.add.container(0, 0, [face.root]);
    return { root, hovers: [], face, width: CARD_WIDTH, height: CARD_HEIGHT };
  };

  /** The card drawn as the panel stands it: the building's as its face, any other on grey paper. */
  const shownOf = (card: Card): Shown => {
    switch (card.kind) {
      case 'building':
        return faceOf(card.building);
      case 'unit':
      case 'terrain': {
        const paper = buildPaper(scene, catalogue, card, PAPER_WIDTH, reactions, factionSigns());
        return { ...paper, face: undefined, width: PAPER_WIDTH, height: PAPER_HEIGHT };
      }
    }
  };

  /**
   * Level with the face it reads, clear of its rim, at the size on screen the card was laid out at,
   * each ghost behind it the size of the card standing.
   */
  const stand = (at: TileFace, size: { width: number; height: number }): void => {
    beside = at;
    box.unit = on.unit();
    box.left = at.x + at.radius + STANDOFF * box.unit;
    box.top = at.y - (PAPER_HEIGHT / 2) * box.unit;

    ghosts.clear();
    for (let ghost = behind; ghost >= 1; ghost--) {
      drawPaper(ghosts, ghost * GHOST_OFFSET, ghost * GHOST_OFFSET, size.width, size.height);
    }
    stop.setSize(size.width + behind * GHOST_OFFSET, size.height + behind * GHOST_OFFSET);
    panel.setScale(box.unit).setPosition(box.left, box.top);
  };

  /** Ends a dissolve where it was headed: the card coming in stands in place, the old one is gone. */
  const settle = (): void => {
    if (leaving !== undefined) {
      stopMotion(scene, leaving.root);
      leaving.root.destroy();
      leaving = undefined;
    }
    if (standing !== undefined) {
      stopMotion(scene, standing.root);
      standing.root.setPosition(0, 0).setAlpha(1);
    }
  };

  const hide = (): void => {
    letGo();
    settle();
    standing?.root.destroy();
    standing = undefined;
    beside = undefined;
    ghosts.clear();
    panel.setVisible(false);
  };

  return {
    hide,

    show(cards: Card[], index: number, at: TileFace, cycling: boolean): void {
      letGo();
      settle();

      const outgoing = standing;
      if (!cycling) outgoing?.root.destroy();

      const shown = shownOf(cards[index]);
      behind = cards.length - 1;
      stand(at, shown);
      // Under the card it replaces, so the dissolve uncovers it, and over the stop either way.
      panel.addAt(shown.root, panel.getIndex(stop) + 1);
      standing = shown;

      if (cycling && outgoing !== undefined) {
        leaving = outgoing;
        for (const zone of outgoing.hovers) zone.disableInteractive();
        outgoing.face?.deaden();
        shown.root.setPosition(GHOST_OFFSET, GHOST_OFFSET).setAlpha(0);
        scene.tweens.add({ targets: shown.root, x: 0, y: 0, alpha: 1, duration: CYCLE_MS });
        scene.tweens.add({
          targets: outgoing.root,
          alpha: 0,
          duration: CYCLE_MS,
          onComplete: () => {
            outgoing.root.destroy();
            leaving = undefined;
          },
        });
      }

      panel.setData('card', cards[index].kind).setVisible(true);
    },

    rescale(): void {
      if (beside === undefined || standing === undefined) return;
      letGo();
      stand(beside, standing);
    },
  };
}

/**
 * A card of grey paper: its head over its rows, laid out in the card's own type and spacing at
 * `width`, from its top-left corner; a row raises a bubble only where its reactions are handed, and
 * a unit's head wears its faction's sign where `signed`.
 */
function buildPaper(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  card: Drawing,
  width: number,
  reactions: RowReactions | undefined,
  signed: boolean,
): Paper {
  const { em, pad } = paperMetricsOf(width);
  const style = stylesOf(em);
  const left = 1 + pad;
  const right = width - 1 - pad;
  const top = 1 + pad;
  const middle = top + 0.55 * em;
  const markBox = 1.15 * em;

  const paper = scene.add.graphics();
  drawPaper(paper, 0, 0, width);

  const head = headOf(scene, catalogue, card, signed);
  const mark = fitMark(head.mark, markBox, head.fittedBy).setPosition(left + markBox / 2, middle);
  const name = addText(scene, left + markBox + 0.5 * em, middle, head.name, style.title)
    .setOrigin(0, 0.5)
    .setName('panel-name');
  const contents: Phaser.GameObjects.GameObject[] = [paper, mark, name];

  let ruleY = Math.round(middle + 1.15 * em);
  const state = card.kind === 'unit' ? stateOf(catalogue, card.unit) : undefined;
  if (state !== undefined) {
    const line = addText(scene, name.x, 0, state, style.label)
      .setOrigin(0, 0.5)
      .setName('panel-state');
    line.setY(middle + name.height / 2 + line.height / 2);
    contents.push(line);
    ruleY = Math.round(line.y + line.height / 2 + 0.35 * em);
  }
  const rule = scene.add.rectangle(left, ruleY, right - left, 1, LOOK.cardEdge).setOrigin(0, 0);
  contents.push(rule);
  const hovers: Phaser.GameObjects.Zone[] = [];

  const movement = movementOf(card);
  if (movement !== undefined) {
    contents.push(
      addText(scene, right, middle, movement, style.label)
        .setOrigin(1, 0.5)
        .setName('panel-movement'),
    );
  }

  /** The box a term raises its bubble from, named so a spec finds the rows in the order drawn. */
  const listen = (x: number, rowTop: number, across: number, down: number, term: Term): void => {
    if (reactions === undefined) return;
    const hover = scene.add
      .zone(x, rowTop, across, down)
      .setOrigin(0, 0)
      .setName(`infopanel-row-${hovers.length}`)
      .setInteractive();
    onHover(
      hover,
      () => reactions.raise(rowTop + down / 2, text(`tooltip.${term}`)),
      () => reactions.drop(),
    );
    contents.push(hover);
    hovers.push(hover);
  };

  let rowTop = ruleY + 1 + 0.55 * em;

  if (card.kind === 'unit') {
    for (const stat of statsOf(catalogue, card.unit)) {
      const label = addText(scene, left, 0, text(`label.${stat}`), style.label).setOrigin(0, 0.5);
      const reading = readingOf(catalogue, card.unit, stat);
      const value = addText(scene, right, 0, reading, style.value).setOrigin(1, 0.5);
      label.setY(rowTop + label.height / 2);
      value.setY(rowTop + label.height / 2);
      contents.push(label, value);
      listen(left, rowTop, label.width, label.height, stat);
      rowTop += label.height + 0.18 * em;
    }
    return { root: scene.add.container(0, 0, contents), hovers };
  }

  /**
   * The chips of a line on its right, three at most to a line, moved under it where they do not fit
   * the room beside what stands on its left: the top of the line after the last of them.
   */
  const chipped = (yields: Partial<Resources>, top: number, line: number, room: number): number => {
    const chips = amountsOf(yields).map(({ resource, amount }) => {
      const reading = text('reading.plus', { count: amount });
      const value = addText(scene, 0, 0, reading, style.chip).setOrigin(0, 0.5);
      return { resource, value, width: 0.7 * em + value.width };
    });

    let lineTop = top;
    let across = room;
    const together =
      chips.reduce((total, chip) => total + chip.width, 0) + 0.3 * em * (chips.length - 1);
    if (together > across) {
      lineTop += line + 0.35 * em;
      across = right - left;
    }

    let first = 0;
    while (first < chips.length) {
      let taken = 0;
      let span = 0;
      while (taken < 3 && first + taken < chips.length) {
        const grown = span + chips[first + taken].width + (taken === 0 ? 0 : 0.3 * em);
        if (taken > 0 && grown > across) break;
        span = grown;
        taken++;
      }

      const centre = lineTop + line / 2;
      let x = right - span;
      for (const { resource, value } of chips.slice(first, first + taken)) {
        const chip = glyphOf(scene, resource, Math.SQRT2 * 0.5 * em)
          .setPosition(x + 0.25 * em, centre)
          .setName(`panel-yield-${resource}`);
        value.setPosition(x + 0.7 * em, centre);
        contents.push(chip, value);
        listen(x, lineTop, 0.7 * em + value.width, line, resource);
        x += 0.7 * em + value.width + 0.3 * em;
      }
      lineTop += line + 0.35 * em;
      first += taken;
      across = right - left;
    }
    return lineTop;
  };

  for (const [at, row] of card.rows.entries()) {
    const rowName = addText(scene, left + 0.75 * em + 0.3 * em, 0, nameOf(row), style.label)
      .setOrigin(0, 0.5)
      .setName(`panel-row-${at}-name`);
    const line = rowName.height;
    rowName.setY(rowTop + line / 2);
    contents.push(
      fitMark(markOf(scene, catalogue, row), 0.75 * em).setPosition(
        left + 0.375 * em,
        rowTop + line / 2,
      ),
    );
    contents.push(rowName);

    const room = right - (rowName.x + rowName.width + 0.3 * em);
    if (amountsOf(row.yields).length === 0) {
      const none = addText(scene, right, 0, text('panel.no-yield'), style.label).setOrigin(1, 0.5);
      if (none.width > room) rowTop += line + 0.35 * em;
      none.setY(rowTop + line / 2);
      contents.push(none);
      rowTop += line + 0.35 * em;
    } else {
      rowTop = chipped(row.yields, rowTop, line, room);
    }

    const under = lineUnder(row);
    if (under !== undefined) {
      contents.push(addText(scene, left, rowTop + line / 2, under, style.label).setOrigin(0, 0.5));
      rowTop += line + 0.35 * em;
    }
  }

  return { root: scene.add.container(0, 0, contents), hovers };
}

/** What the card is headed by, the unit it stands for or the first row it holds, and what fits it to its box. */
function headOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  card: Drawing,
  signed: boolean,
): { mark: Mark; fittedBy?: readonly Mark[]; name: string } {
  if (card.kind === 'unit') {
    const { stats, faction } = card.unit;
    const mark = unitMark(scene, stats.type, faction, inCanoe(catalogue, card.unit), signed);
    return { mark, fittedBy: unitFittedBy(mark), name: unitName(stats.type) };
  }
  return { mark: markOf(scene, catalogue, card.rows[0]), name: nameOf(card.rows[0]) };
}

/** What the line under a unit card's name reads: the unit's states joined, and nothing for none. */
function stateOf(catalogue: Catalogue, unit: UnitReading): string | undefined {
  const states = inCanoe(catalogue, unit) ? [text('unit-state.raft')] : [];
  switch (unit.prepares) {
    case 'capture':
      states.push(text('unit-state.capturing'));
      break;
    case 'pillage':
      states.push(text('unit-state.pillaging'));
      break;
    case undefined:
      break;
  }
  if (unit.hostile === true) states.push(text('unit-state.hostile'));
  if (states.length === 0) return undefined;
  return states.reduce((one, other) => text('unit-state.joined', { one, other }));
}

/**
 * What the card reads in the corner of its head: what entering the tile costs on the terrain card, a
 * dash where nothing crosses it, and nothing at all on any other card.
 */
function movementOf(card: Drawing): string | undefined {
  switch (card.kind) {
    case 'unit':
    case 'feature':
    case 'improvement':
      return undefined;
    case 'terrain':
      return card.movementCost === undefined
        ? text('panel.no-movement')
        : text('panel.movement', { cost: inMovePoints(card.movementCost) });
  }
}

function markOf(scene: Phaser.Scene, catalogue: Catalogue, row: Row): Mark {
  switch (row.kind) {
    case 'beside':
      return buildingMark(scene, row.building);
    case 'improvement':
      return improvementMark(scene, catalogue, row.improvement);
    case 'feature':
      return featureMark(scene, row.feature);
    case 'terrain':
      return terrainMark(scene, row.terrain);
    case 'river':
      return riverMark(scene);
  }
}

function nameOf(row: Row): string {
  switch (row.kind) {
    case 'beside':
      return buildingName(row.building);
    case 'improvement':
      return improvementName(row.improvement);
    case 'feature':
      return featureName(row.feature);
    case 'terrain':
      return terrainName(row.terrain);
    case 'river':
      return text('panel.river');
  }
}

/** What a row says under itself of what it does beyond its yield, and nothing for a row that does nothing more. */
function lineUnder(row: Row): string | undefined {
  switch (row.kind) {
    case 'beside':
    case 'improvement':
    case 'feature':
    case 'terrain':
      return undefined;
    case 'river':
      return text('panel.crossing');
  }
}

/** Each resource named and its amount, in the order the resource bar reads. */
function amountsOf(amounts: Partial<Resources>): { resource: Resource; amount: number }[] {
  const named: { resource: Resource; amount: number }[] = [];
  for (const resource of RESOURCES) {
    const amount = amounts[resource];
    if (amount !== undefined) named.push({ resource, amount });
  }
  return named;
}

/**
 * A mark drawn at the size it has on the map, brought into a box by the paint of what it is fitted
 * by; an outline keeps its weight.
 */
function fitMark(mark: Mark, box: number, fittedBy: readonly Mark[] = [mark]): Mark {
  const shapes = mark instanceof Phaser.GameObjects.Container ? mark.list : [mark];
  const { width, height } = paintedBoundsOf(fittedBy);
  const scale = box / Math.max(width, height);
  for (const shape of shapes) {
    if (shape instanceof Phaser.GameObjects.Shape) {
      shape.setStrokeStyle(shape.lineWidth / scale, shape.strokeColor, shape.strokeAlpha);
    }
  }
  return mark.setScale(mark.scaleX * scale);
}
