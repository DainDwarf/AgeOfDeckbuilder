import Phaser from 'phaser';
import { type Catalogue, fullHealth, unitKind } from '../rules/catalogue';
import { preparedAs } from '../rules/enemies';
import {
  builtYield,
  groundCost,
  MOVE_POINT,
  movementCost,
  type River,
  runsAlong,
  type Tile,
  type TileCoords,
  type TilesBeside,
  type YieldSource,
  yieldParts,
} from '../rules/map';
import { buildingKind, featureKind, improvementKind, terrainKind } from '../rules/map-kinds';
import { RESOURCES, type Resource, type Resources } from '../rules/resources';
import { type Unit, unitAt } from '../rules/units';
import { CARD_HEIGHT, CARD_WIDTH, drawCardSurface, metricsOf } from './card-face';
import { stopMotion } from './card-motion';
import { addText, onHover, type Stratum, UI_FONT } from './design-space';
import { css, LOOK } from './look';
import {
  buildingMark,
  featureMark,
  improvementMark,
  type Mark,
  riverMark,
  type TileFace,
  terrainMark,
  unitMark,
} from './map';
import { buildingName, featureName, improvementName, terrainName, text, unitName } from './text';
import type { Reference } from './text-run';
import type { Tooltip } from './tooltip';

/** One line of a card's ledger: what it is drawn and named by, and what it gives at income. */
type Row = (YieldSource | { readonly kind: 'river' }) & { readonly yields: Partial<Resources> };

/**
 * What a unit card reads: a unit on the map, or a unit kind read as a unit fresh of it, and what its
 * prepare lands as, if it has prepared.
 */
type UnitReading = Pick<Unit, 'stats' | 'faction' | 'movePoints' | 'action' | 'embarked'> & {
  readonly prepares?: 'capture' | 'pillage';
};

/** One card an inspection steps through, headed by the first of the rows it holds. */
export type Card =
  | { readonly kind: 'unit'; readonly unit: UnitReading }
  | { readonly kind: 'building'; readonly rows: readonly Row[] }
  | {
      readonly kind: 'terrain';
      readonly rows: readonly Row[];
      readonly movementCost: number | undefined;
    };

/** What a card of the infopanel's look is drawn from: one an inspection steps through, or a feature alone. */
type Drawing = Card | { readonly kind: 'feature'; readonly rows: readonly Row[] };

/** A thing a name names that is no card. */
export type Thing = Exclude<Reference, { readonly kind: 'card' }>;

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
        kind: 'building',
        rows: [
          {
            kind: 'improvement',
            improvement: thing.id,
            yields: improvementKind(catalogue, thing.id).yields,
          },
        ],
      };
    case 'building':
      return {
        kind: 'building',
        rows: [{ kind: 'building', building: thing.id, yields: builtYield(catalogue, thing.id) }],
      };
    case 'player':
    case 'enemy': {
      const stats = unitKind(catalogue, thing.id);
      const unit = {
        stats,
        faction: thing.kind,
        movePoints: stats.move,
        action: stats.action,
        embarked: false,
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
  const face = buildFace(scene, catalogue, drawingOf(catalogue, thing), width, undefined);
  face.root.setPosition(-width / 2, -metricsOf(width).height);
  return scene.add.container(0, 0, [face.root]).setData('reference', thing);
}

/**
 * Where a part of a tile's yield stands in an inspection: on the building card, or on the terrain
 * card ahead of the river's row or after it.
 */
function placeOf(source: YieldSource): 'building' | 'ground' | 'beside' {
  switch (source.kind) {
    case 'building':
    case 'improvement':
      return 'building';
    case 'terrain':
    case 'feature':
      return 'ground';
    case 'beside':
      return 'beside';
  }
}

/**
 * What a tile is made of right now, as the cards an inspection steps, each row read off the tile's
 * yield: the unit, the building card, and the terrain card, which always stands.
 */
export function cardsOf(
  catalogue: Catalogue,
  tile: Tile,
  units: readonly Unit[],
  city: TileCoords | undefined,
  rivers: readonly River[],
  beside: TilesBeside,
): Card[] {
  const cards: Card[] = [];

  const unit = unitAt(units, tile);
  if (unit !== undefined) {
    cards.push({ kind: 'unit', unit: { ...unit, prepares: preparedAs({ city }, unit) } });
  }

  const parts = yieldParts(catalogue, tile, beside);
  const rows = (place: ReturnType<typeof placeOf>): Row[] =>
    parts.filter((part) => placeOf(part) === place);

  const built = rows('building');
  if (built.length > 0) cards.push({ kind: 'building', rows: built });

  const river: Row[] = runsAlong(rivers, tile) ? [{ kind: 'river', yields: {} }] : [];
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
   * the map now measures in a different unit. Whatever bubble a row had raised goes down.
   */
  rescale(): void;
  hide(): void;
};

/** How far the panel stands clear of the face it reads, in design pixels. */
const STANDOFF = 12;

/** How far each card waiting behind the panel stands out of it, down and to the right. */
const GHOST_OFFSET = 4;

/** How long one card takes to dissolve into the next. */
const CYCLE_MS = 150;

/** The type a card's face is set in, sized by the `em` of the width it is drawn at. */
function stylesOf(em: number) {
  const label = { fontFamily: UI_FONT, fontSize: `${0.62 * em}px`, color: css(LOOK.faintInk) };
  const value = { fontFamily: UI_FONT, fontSize: `${0.62 * em}px`, color: css(LOOK.ink) };
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
    movement: { ...label, fontSize: `${0.55 * em}px` },
  };
}

const STATS = ['health', 'damage', 'range', 'move', 'action', 'sight'] as const;

type Stat = (typeof STATS)[number];

/** The stats a unit card reads: an embarked unit's reads no damage and no range. */
function statsOf(unit: UnitReading): readonly Stat[] {
  return unit.embarked ? STATS.filter((stat) => stat !== 'damage' && stat !== 'range') : STATS;
}

/** What a row of a card is named by: one `label.` and one `tooltip.` entry each. */
type Term = Stat | Resource;

/** A count of hundredths as the move points it is worth: what every card reads one by. */
function inMovePoints(hundredths: number): string {
  return (hundredths / MOVE_POINT).toString();
}

/** What a stat's row reads: what the unit has left over its own number, where it has two. */
function readingOf(catalogue: Catalogue, unit: UnitReading, stat: Stat): string {
  switch (stat) {
    case 'health':
      return `${unit.stats.health} / ${fullHealth(catalogue, unit.stats)}`;
    case 'move':
      return `${inMovePoints(unit.movePoints)} / ${inMovePoints(unit.stats.move)}`;
    case 'action':
      return `${unit.action} / ${unit.stats.action}`;
    case 'damage':
    case 'range':
    case 'sight':
      return String(unit.stats[stat]);
  }
}

/** One card drawn: its face, its contents, and the zones its rows raise tooltips from. */
type Face = {
  readonly root: Phaser.GameObjects.Container;
  readonly hovers: Phaser.GameObjects.Zone[];
};

/** Where the panel stands on the map, and what it measures in there, for the bubbles its rows raise. */
type Box = { left: number; top: number; unit: number };

/** What a row answers: the one bubble raised beside its own middle in the card or let go. */
type RowAnswers = {
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
): InfoPanel {
  const ghosts = scene.add.graphics();
  // Interactive, so no press reaches the map's catchers under it, and never marked as answering one.
  const stop = scene.add.zone(0, 0, CARD_WIDTH, CARD_HEIGHT).setOrigin(0, 0).setInteractive();
  const panel = scene.add.container(0, 0, [ghosts, stop]).setName('infopanel').setVisible(false);
  on.layer.add(panel);

  let standing: Face | undefined;
  let leaving: Face | undefined;
  /** How many cards wait behind the one standing: the ghosts, and the room they ask for. */
  let behind = 0;
  const box: Box = { left: 0, top: 0, unit: 1 };
  /** The face the panel is standing beside, and nothing while it stands nowhere. */
  let beside: TileFace | undefined;

  const answers: RowAnswers = {
    raise(centre: number, message: string): void {
      tooltip.beside(message, () => ({
        x: box.left + CARD_WIDTH * box.unit,
        y: box.top + centre * box.unit,
      }));
    },
    drop(): void {
      tooltip.hide();
    },
  };

  /** Level with the face it reads, clear of its rim, at the size on screen the card was laid out at. */
  const stand = (at: TileFace): void => {
    beside = at;
    box.unit = on.unit();
    box.left = at.x + at.radius + STANDOFF * box.unit;
    box.top = at.y - (CARD_HEIGHT / 2) * box.unit;

    ghosts.clear();
    for (let ghost = behind; ghost >= 1; ghost--) {
      drawCardSurface(ghosts, ghost * GHOST_OFFSET, ghost * GHOST_OFFSET);
    }
    stop.setSize(CARD_WIDTH + behind * GHOST_OFFSET, CARD_HEIGHT + behind * GHOST_OFFSET);
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
    answers.drop();
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
      answers.drop();
      settle();

      behind = cards.length - 1;
      stand(at);

      const outgoing = standing;
      if (!cycling) outgoing?.root.destroy();

      const face = buildFace(scene, catalogue, cards[index], CARD_WIDTH, answers);
      // Under the card it replaces, so the dissolve uncovers it, and over the stop either way.
      panel.addAt(face.root, panel.getIndex(stop) + 1);
      standing = face;

      if (cycling && outgoing !== undefined) {
        leaving = outgoing;
        for (const zone of outgoing.hovers) zone.disableInteractive();
        face.root.setPosition(GHOST_OFFSET, GHOST_OFFSET).setAlpha(0);
        scene.tweens.add({ targets: face.root, x: 0, y: 0, alpha: 1, duration: CYCLE_MS });
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
      if (beside === undefined) return;
      answers.drop();
      stand(beside);
    },
  };
}

/**
 * The card's head over its rows, laid out in the card's own type and spacing at `width`, from its
 * top-left corner; a row raises a bubble only where its answers are handed.
 */
function buildFace(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  card: Drawing,
  width: number,
  answers: RowAnswers | undefined,
): Face {
  const { em, pad } = metricsOf(width);
  const style = stylesOf(em);
  const left = 1 + pad;
  const right = width - 1 - pad;
  const top = 1 + pad;
  const middle = top + 0.55 * em;
  const markBox = 1.15 * em;

  const paper = scene.add.graphics();
  drawCardSurface(paper, 0, 0, { width });

  const head = headOf(scene, card);
  const mark = fitMark(head.mark, markBox).setPosition(left + markBox / 2, middle);
  const name = addText(scene, left + markBox + 0.5 * em, middle, head.name, style.title)
    .setOrigin(0, 0.5)
    .setName('panel-name');
  const contents: Phaser.GameObjects.GameObject[] = [paper, mark, name];

  let ruleY = Math.round(middle + 1.15 * em);
  const state = card.kind === 'unit' ? stateOf(card.unit) : undefined;
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
      addText(scene, right, middle, movement, style.movement)
        .setOrigin(1, 0.5)
        .setName('panel-movement'),
    );
  }

  /** The box a term raises its bubble from, named so a spec finds the rows in the order drawn. */
  const listen = (x: number, rowTop: number, across: number, down: number, term: Term): void => {
    if (answers === undefined) return;
    const hover = scene.add
      .zone(x, rowTop, across, down)
      .setOrigin(0, 0)
      .setName(`infopanel-row-${hovers.length}`)
      .setInteractive();
    onHover(
      hover,
      () => answers.raise(rowTop + down / 2, text(`tooltip.${term}`)),
      () => answers.drop(),
    );
    contents.push(hover);
    hovers.push(hover);
  };

  let rowTop = ruleY + 1 + 0.55 * em;

  if (card.kind === 'unit') {
    for (const stat of statsOf(card.unit)) {
      const label = addText(scene, left, 0, text(`label.${stat}`), style.label).setOrigin(0, 0.5);
      const reading = readingOf(catalogue, card.unit, stat);
      const value = addText(scene, right, 0, reading, style.value).setOrigin(1, 0.5);
      label.setY(rowTop + label.height / 2);
      value.setY(rowTop + label.height / 2);
      contents.push(label, value);
      listen(left, rowTop, label.width, label.height, stat);
      rowTop += label.height + 0.35 * em;
    }
    return { root: scene.add.container(0, 0, contents), hovers };
  }

  for (const [at, row] of card.rows.entries()) {
    const rowName = addText(scene, left + 0.75 * em + 0.3 * em, 0, nameOf(row), style.label)
      .setOrigin(0, 0.5)
      .setName(`panel-row-${at}-name`);
    const line = rowName.height;
    rowName.setY(rowTop + line / 2);
    contents.push(
      fitMark(markOf(scene, row), 0.75 * em).setPosition(left + 0.375 * em, rowTop + line / 2),
    );
    contents.push(rowName);

    /** What the line being laid out has on its right: the row's width, less the name beside it. */
    let room = right - (rowName.x + rowName.width + 0.3 * em);
    const gives = yieldsOf(row);
    if (gives.length === 0) {
      const none = addText(scene, right, 0, text('panel.no-yield'), style.label).setOrigin(1, 0.5);
      if (none.width > room) rowTop += line + 0.35 * em;
      none.setY(rowTop + line / 2);
      contents.push(none);
      rowTop += line + 0.35 * em;
    } else {
      const chips = gives.map(({ resource, amount }) => {
        const value = addText(scene, 0, 0, `+${amount}`, style.chip).setOrigin(0, 0.5);
        return { resource, value, width: 0.7 * em + value.width };
      });

      const together =
        chips.reduce((total, chip) => total + chip.width, 0) + 0.3 * em * (chips.length - 1);
      if (together > room) {
        rowTop += line + 0.35 * em;
        room = right - left;
      }

      let first = 0;
      while (first < chips.length) {
        let taken = 0;
        let span = 0;
        while (taken < 3 && first + taken < chips.length) {
          const grown = span + chips[first + taken].width + (taken === 0 ? 0 : 0.3 * em);
          if (taken > 0 && grown > room) break;
          span = grown;
          taken++;
        }

        const centre = rowTop + line / 2;
        let x = right - span;
        for (const { resource, value } of chips.slice(first, first + taken)) {
          // A diamond is a square turned, never a polygon: see the trap over `yieldMark` in `map.ts`.
          const chip = scene.add
            .rectangle(x + 0.25 * em, centre, 0.5 * em, 0.5 * em, LOOK.reading[resource])
            .setAngle(45)
            .setName(`panel-yield-${resource}`);
          value.setPosition(x + 0.7 * em, centre);
          contents.push(chip, value);
          listen(x, rowTop, 0.7 * em + value.width, line, resource);
          x += 0.7 * em + value.width + 0.3 * em;
        }
        rowTop += line + 0.35 * em;
        first += taken;
        room = right - left;
      }
    }

    const note = noteOf(catalogue, row);
    if (note !== undefined) {
      contents.push(addText(scene, left, rowTop + line / 2, note, style.label).setOrigin(0, 0.5));
      rowTop += line + 0.35 * em;
    }
  }

  return { root: scene.add.container(0, 0, contents), hovers };
}

/** What the card is headed by: the unit it stands for, or the first row it holds. */
function headOf(scene: Phaser.Scene, card: Drawing): { mark: Mark; name: string } {
  if (card.kind === 'unit') {
    const { stats, faction, embarked } = card.unit;
    return { mark: unitMark(scene, stats.type, faction, embarked), name: unitName(stats.type) };
  }
  return { mark: markOf(scene, card.rows[0]), name: nameOf(card.rows[0]) };
}

/** What the line under a unit card's name reads: the unit's states joined, and nothing for none. */
function stateOf(unit: UnitReading): string | undefined {
  const states = unit.embarked ? [text('unit-state.raft')] : [];
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
    case 'building':
      return undefined;
    case 'terrain':
      return card.movementCost === undefined
        ? text('panel.no-movement')
        : text('panel.movement', { cost: inMovePoints(card.movementCost) });
  }
}

function markOf(scene: Phaser.Scene, row: Row): Phaser.GameObjects.Polygon {
  switch (row.kind) {
    case 'building':
    case 'beside':
      return buildingMark(scene, row.building);
    case 'improvement':
      return improvementMark(scene, row.improvement);
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
    case 'building':
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

/**
 * What a row says under itself of what it does beyond its yield — to a move, to the tiles beside it
 * — and nothing for a row that does neither.
 */
function noteOf(catalogue: Catalogue, row: Row): string | undefined {
  switch (row.kind) {
    case 'building': {
      const { givesBeside } = buildingKind(catalogue, row.building);
      return givesBeside === undefined
        ? undefined
        : text('panel.beside', { terrain: terrainName(givesBeside.terrain) });
    }
    case 'beside':
    case 'improvement':
    case 'feature':
    case 'terrain':
      return undefined;
    case 'river':
      return text('panel.crossing');
  }
}

/** What the row gives at income, in the order the resource bar reads. */
function yieldsOf(row: Row): { resource: Resource; amount: number }[] {
  const given: { resource: Resource; amount: number }[] = [];
  for (const resource of RESOURCES) {
    const amount = row.yields[resource];
    if (amount !== undefined) given.push({ resource, amount });
  }
  return given;
}

/** A mark drawn at the size it has on the map, brought into a box; its outline keeps its weight. */
function fitMark(mark: Mark, box: number): Mark {
  const shapes =
    mark instanceof Phaser.GameObjects.Container
      ? (mark.list as Phaser.GameObjects.Polygon[])
      : [mark];
  const { width, height } = mark.getBounds();
  const scale = box / Math.max(width, height);
  for (const shape of shapes) shape.setStrokeStyle(shape.lineWidth / scale, shape.strokeColor);
  return mark.setScale(scale);
}
