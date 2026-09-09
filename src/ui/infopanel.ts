import type Phaser from 'phaser';
import {
  BUILDINGS,
  type BuildingTypeId,
  FEATURES,
  type FeatureId,
  IMPROVEMENTS,
  type ImprovementId,
  RIVER_YIELDS,
  type River,
  runsAlong,
  TERRAIN_YIELDS,
  type Terrain,
  type Tile,
} from '../rules/map';
import { RESOURCES, type Resource, type Resources } from '../rules/resources';
import { UNIT_STATS, type Unit, unitAt } from '../rules/units';
import { CARD_EDGE, CARD_HEIGHT, CARD_METRICS, CARD_WIDTH, drawCardSurface } from './card-face';
import { stopMotion } from './card-motion';
import { addText, onHover, type Surface, UI_FONT } from './design-space';
import {
  buildingMark,
  featureMark,
  improvementMark,
  riverMark,
  type TileFace,
  terrainMark,
  unitMark,
} from './map';
import { RESOURCE_COLOURS } from './resource-bar';
import { text } from './text';
import { createTooltip } from './tooltip';

/** One line of a card's ledger: what it is drawn and named by, and what it gives at income. */
type Row =
  | { readonly kind: 'building'; readonly building: BuildingTypeId }
  | { readonly kind: 'improvement'; readonly improvement: ImprovementId }
  | { readonly kind: 'feature'; readonly feature: FeatureId }
  | { readonly kind: 'terrain'; readonly terrain: Terrain }
  | { readonly kind: 'river'; readonly terrain: Terrain };

/** One card an inspection steps through, headed by the first of the rows it holds. */
export type Card =
  | { readonly kind: 'unit'; readonly unit: Unit }
  | { readonly kind: 'building'; readonly rows: readonly Row[] }
  | { readonly kind: 'terrain'; readonly rows: readonly Row[] };

/**
 * What a tile is made of right now, as the cards an inspection steps: the unit, the building with
 * the tile's improvements, and the terrain with its feature and the river running along it. The
 * first two are left out when nothing fills them; the terrain card always stands.
 */
export function cardsOf(tile: Tile, units: readonly Unit[], rivers: readonly River[]): Card[] {
  const cards: Card[] = [];

  const unit = unitAt(units, tile);
  if (unit !== undefined) cards.push({ kind: 'unit', unit });

  const built: Row[] = [];
  if (tile.building !== undefined) built.push({ kind: 'building', building: tile.building });
  for (const improvement of tile.improvements) built.push({ kind: 'improvement', improvement });
  if (built.length > 0) cards.push({ kind: 'building', rows: built });

  const ground: Row[] = [{ kind: 'terrain', terrain: tile.terrain }];
  if (tile.feature !== undefined) ground.push({ kind: 'feature', feature: tile.feature });
  if (runsAlong(rivers, tile)) ground.push({ kind: 'river', terrain: tile.terrain });
  cards.push({ kind: 'terrain', rows: ground });

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

/** Over the terrain, the buildings and the units the map draws, under the bubble a row raises. */
const DEPTH = 25;

/** How far the panel stands clear of the face it reads, in design pixels. */
const STANDOFF = 12;

/** How far each card waiting behind the panel stands out of it, down and to the right. */
const GHOST_OFFSET = 4;

/** How long one card takes to dissolve into the next. */
const CYCLE_MS = 150;

const { em, pad } = CARD_METRICS;

const TITLE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: `${0.75 * em}px`,
  fontStyle: 'bold',
  color: '#0d1014',
};
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: `${0.62 * em}px`, color: '#4a5058' };
const VALUE_STYLE = { fontFamily: UI_FONT, fontSize: `${0.62 * em}px`, color: '#0d1014' };
const CHIP_STYLE = { ...VALUE_STYLE, fontStyle: 'bold' };

const STATS = ['health', 'damage', 'range', 'move', 'action', 'sight'] as const;

/** What a row of a card is named by: one `label.` and one `tooltip.` entry each. */
type Term = (typeof STATS)[number] | Resource;

/** What a stat's row reads: what the unit has left over its own number, where it has two. */
function readingOf(unit: Unit, stat: (typeof STATS)[number]): string {
  switch (stat) {
    case 'health':
      return `${unit.stats.health} / ${UNIT_STATS[unit.stats.type].health}`;
    case 'move':
      return `${unit.movePoints} / ${unit.stats.move}`;
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

/** What a row does with the one bubble: raises it beside its own middle in the card, or lets it go. */
type RowBubble = {
  raise(centre: number, message: string): void;
  drop(): void;
};

/**
 * A tile inspected: one card at a time, the cards behind it showing as ghosts under its corner. It
 * stands on the map itself, so a pan carries it with the tile it inspects and nothing here hears
 * about one. Every show rebuilds the card, so nothing here follows a state change — the panel is
 * dismissed by whatever caused one.
 */
export function createInfoPanel(scene: Phaser.Scene, on: Surface): InfoPanel {
  const tooltip = createTooltip(scene, on);
  const ghosts = scene.add.graphics();
  const panel = scene.add
    .container(0, 0, [ghosts])
    .setDepth(DEPTH)
    .setName('infopanel')
    .setVisible(false);
  on.layer.add(panel);

  let standing: Face | undefined;
  let leaving: Face | undefined;
  /** How many cards wait behind the one standing: the ghosts, and the room they ask for. */
  let behind = 0;
  const box: Box = { left: 0, top: 0, unit: 1 };
  /** The face the panel is standing beside, and nothing while it stands nowhere. */
  let beside: TileFace | undefined;

  const bubble: RowBubble = {
    raise(centre: number, message: string): void {
      tooltip.beside(message, box.left + CARD_WIDTH * box.unit, box.top + centre * box.unit);
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
    for (let depth = behind; depth >= 1; depth--) {
      drawCardSurface(ghosts, depth * GHOST_OFFSET, depth * GHOST_OFFSET);
    }
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
    bubble.drop();
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
      bubble.drop();
      settle();

      behind = cards.length - 1;
      stand(at);

      const outgoing = standing;
      if (!cycling) outgoing?.root.destroy();

      const face = buildFace(scene, bubble, cards[index]);
      // Under the card it replaces, so the dissolve uncovers it, and over the ghosts either way.
      panel.addAt(face.root, 1);
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
      bubble.drop();
      stand(beside);
    },
  };
}

/** The card's head over its rows, laid out in the card's own type and spacing. */
function buildFace(scene: Phaser.Scene, bubble: RowBubble, card: Card): Face {
  const left = 1 + pad;
  const right = CARD_WIDTH - 1 - pad;
  const top = 1 + pad;
  const middle = top + 0.55 * em;
  const markBox = 1.15 * em;

  const paper = scene.add.graphics();
  drawCardSurface(paper, 0, 0);

  const head = headOf(scene, card);
  const mark = fitMark(head.mark, markBox).setPosition(left + markBox / 2, middle);
  const name = addText(scene, left + markBox + 0.5 * em, middle, head.name, TITLE_STYLE).setOrigin(
    0,
    0.5,
  );

  const ruleY = Math.round(middle + 1.15 * em);
  const rule = scene.add.rectangle(left, ruleY, right - left, 1, CARD_EDGE).setOrigin(0, 0);

  const contents: Phaser.GameObjects.GameObject[] = [paper, mark, name, rule];
  const hovers: Phaser.GameObjects.Zone[] = [];

  /** The box a term raises its bubble from, named so a spec finds the rows in the order drawn. */
  const listen = (x: number, rowTop: number, width: number, height: number, term: Term): void => {
    const hover = scene.add
      .zone(x, rowTop, width, height)
      .setOrigin(0, 0)
      .setName(`infopanel-row-${hovers.length}`)
      .setInteractive();
    onHover(
      hover,
      () => bubble.raise(rowTop + height / 2, text(`tooltip.${term}`)),
      () => bubble.drop(),
    );
    contents.push(hover);
    hovers.push(hover);
  };

  let rowTop = ruleY + 1 + 0.55 * em;

  if (card.kind === 'unit') {
    for (const stat of STATS) {
      const label = addText(scene, left, 0, text(`label.${stat}`), LABEL_STYLE).setOrigin(0, 0.5);
      const reading = readingOf(card.unit, stat);
      const value = addText(scene, right, 0, reading, VALUE_STYLE).setOrigin(1, 0.5);
      label.setY(rowTop + label.height / 2);
      value.setY(rowTop + label.height / 2);
      contents.push(label, value);
      listen(left, rowTop, label.width, label.height, stat);
      rowTop += label.height + 0.35 * em;
    }
    return { root: scene.add.container(0, 0, contents), hovers };
  }

  for (const row of card.rows) {
    const rowName = addText(
      scene,
      left + 0.75 * em + 0.3 * em,
      0,
      nameOf(row),
      LABEL_STYLE,
    ).setOrigin(0, 0.5);
    const line = rowName.height;
    rowName.setY(rowTop + line / 2);
    contents.push(
      fitMark(markOf(scene, row), 0.75 * em).setPosition(left + 0.375 * em, rowTop + line / 2),
    );
    contents.push(rowName);

    const gives = yieldsOf(row);
    if (gives.length === 0) {
      contents.push(
        addText(scene, right, rowTop + line / 2, text('panel.no-yield'), LABEL_STYLE).setOrigin(
          1,
          0.5,
        ),
      );
      rowTop += line + 0.35 * em;
    } else {
      const chips = gives.map(({ resource, amount }) => {
        const value = addText(scene, 0, 0, `+${amount}`, CHIP_STYLE).setOrigin(0, 0.5);
        return { resource, value, width: 0.7 * em + value.width };
      });

      /** What the line being laid out has for its chips: the row's width, less the name beside them. */
      let room = right - (rowName.x + rowName.width + 0.3 * em);
      const together =
        chips.reduce((total, chip) => total + chip.width, 0) + 0.3 * em * (chips.length - 1);
      if (together > room) {
        rowTop += line + 0.35 * em;
        room = right - left;
      }

      let first = 0;
      while (first < chips.length) {
        let taken = 0;
        let width = 0;
        while (taken < 3 && first + taken < chips.length) {
          const grown = width + chips[first + taken].width + (taken === 0 ? 0 : 0.3 * em);
          if (taken > 0 && grown > room) break;
          width = grown;
          taken++;
        }

        const centre = rowTop + line / 2;
        let x = right - width;
        for (const { resource, value } of chips.slice(first, first + taken)) {
          // A diamond is a square turned, never a polygon: see the trap over `yieldMark` in `map.ts`.
          const chip = scene.add
            .rectangle(x + 0.25 * em, centre, 0.5 * em, 0.5 * em, RESOURCE_COLOURS[resource])
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

    const note = noteOf(row);
    if (note !== undefined) {
      contents.push(
        addText(scene, rowName.x, rowTop + line / 2, note, LABEL_STYLE).setOrigin(0, 0.5),
      );
      rowTop += line + 0.35 * em;
    }
  }

  return { root: scene.add.container(0, 0, contents), hovers };
}

/** What the card is headed by: the unit it stands for, or the first row it holds. */
function headOf(
  scene: Phaser.Scene,
  card: Card,
): { mark: Phaser.GameObjects.Polygon; name: string } {
  if (card.kind === 'unit') {
    return {
      mark: unitMark(scene, card.unit.stats.type, card.unit.faction),
      name: text(`unit.${card.unit.stats.type}`),
    };
  }
  return { mark: markOf(scene, card.rows[0]), name: nameOf(card.rows[0]) };
}

function markOf(scene: Phaser.Scene, row: Row): Phaser.GameObjects.Polygon {
  switch (row.kind) {
    case 'building':
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
      return text(`building.${row.building}`);
    case 'improvement':
      return text(`improvement.${row.improvement}`);
    case 'feature':
      return text(`feature.${row.feature}`);
    case 'terrain':
      return text(`terrain.${row.terrain}`);
    case 'river':
      return text('panel.river');
  }
}

/** What a row says under itself of what it does to a move, and nothing for a row that does none. */
function noteOf(row: Row): string | undefined {
  switch (row.kind) {
    case 'building':
    case 'improvement':
    case 'feature':
    case 'terrain':
      return undefined;
    case 'river':
      return text('panel.crossing');
  }
}

function yieldsIn(row: Row): Partial<Resources> {
  switch (row.kind) {
    case 'building':
      return BUILDINGS[row.building].yields;
    case 'improvement':
      return IMPROVEMENTS[row.improvement].yields;
    case 'feature':
      return FEATURES[row.feature].yields;
    case 'terrain':
      return TERRAIN_YIELDS[row.terrain];
    case 'river':
      return RIVER_YIELDS[row.terrain] ?? {};
  }
}

/** What the row gives at income, in the order the resource bar reads. */
function yieldsOf(row: Row): { resource: Resource; amount: number }[] {
  const yields = yieldsIn(row);
  const given: { resource: Resource; amount: number }[] = [];
  for (const resource of RESOURCES) {
    const amount = yields[resource];
    if (amount !== undefined) given.push({ resource, amount });
  }
  return given;
}

/** A mark drawn at the size it has on the map, brought into a box; its outline keeps its weight. */
function fitMark(mark: Phaser.GameObjects.Polygon, box: number): Phaser.GameObjects.Polygon {
  const scale = box / Math.max(mark.width, mark.height);
  return mark.setScale(scale).setStrokeStyle(mark.lineWidth / scale, mark.strokeColor);
}
