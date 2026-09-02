import type Phaser from 'phaser';
import { RESOURCES, type Resource, type Resources } from '../rules/chronicle';
import {
  BUILDINGS,
  type BuildingTypeId,
  TERRAIN_YIELDS,
  type Terrain,
  type Tile,
} from '../rules/map';
import { UNIT_STATS, type Unit, unitAt } from '../rules/units';
import { CARD_EDGE, CARD_HEIGHT, CARD_METRICS, CARD_WIDTH, drawCardSurface } from './card-face';
import { addText, DESIGN_WIDTH, MARGIN, UI_FONT } from './design-space';
import { buildingMark, type TileFace, terrainMark, unitMark } from './map';
import { text } from './text';
import type { Beside, Tooltip } from './tooltip';

/** One thing a tile is made of, read off the map. A tile is its layers, outermost first. */
export type Layer =
  | { readonly kind: 'unit'; readonly unit: Unit }
  | { readonly kind: 'building'; readonly building: BuildingTypeId }
  | { readonly kind: 'terrain'; readonly terrain: Terrain };

/** What a tile is made of right now: the layers it has, the absent ones left out. */
export function layersOf(tile: Tile, units: readonly Unit[]): Layer[] {
  const unit = unitAt(units, tile);
  const layers: Layer[] = [];
  if (unit !== undefined) layers.push({ kind: 'unit', unit });
  if (tile.building !== undefined) layers.push({ kind: 'building', building: tile.building });
  layers.push({ kind: 'terrain', terrain: tile.terrain });
  return layers;
}

export type InfoPanel = {
  /**
   * The layer at `index`, on a card of its own beside the tile, over one ghost per layer behind
   * it. `cycling` dissolves it out of the layer already shown; anything else is instant.
   */
  show(layers: Layer[], index: number, at: TileFace, cycling: boolean): void;
  /**
   * Stands what it is showing beside the face again, wherever the map has carried that face —
   * off the table included — and re-stands the tooltip a row of it raised beside that row.
   */
  place(at: TileFace): void;
  hide(): void;
};

/** Over the table and the end-turn button, under the tooltips and the overlay. */
const DEPTH = 25;

/** How far the panel stands clear of the face it reads. */
const STANDOFF = 12;

/** How far each layer waiting behind the panel stands out of it, down and away from the tile. */
const GHOST_OFFSET = 4;

/** How long one layer takes to dissolve into the next. */
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

const STATS = ['health', 'damage', 'range', 'move'] as const;

/** What a row of any layer is named by: one `label.` and one `tooltip.` entry each. */
type Term = (typeof STATS)[number] | Resource;

type Row = { readonly term: Term; readonly value: string };

/** One layer drawn: its card, its contents, and the zones its rows raise tooltips from. */
type Face = {
  readonly root: Phaser.GameObjects.Container;
  readonly hovers: Phaser.GameObjects.Zone[];
};

/**
 * Where the panel stands, for the tooltips its rows raise beside it. One box outlives every layer
 * drawn on it: a pan rewrites it under the rows already standing.
 */
type Box = { left: number; top: number; rightOfTile: boolean };

/** What a row does with the one bubble: raises it beside its own middle in the card, or lets it go. */
type RowBubble = {
  raise(centre: number, message: string): void;
  drop(): void;
};

/**
 * What a tile is, read off the map: one layer at a time on a card of its own, the layers behind
 * it showing as ghosts under its corner. Every show rebuilds the layer, so nothing here follows a
 * state change — the panel is dismissed by whatever caused one.
 */
export function createInfoPanel(scene: Phaser.Scene, tooltip: Tooltip): InfoPanel {
  const ghosts = scene.add.graphics();
  const panel = scene.add
    .container(0, 0, [ghosts])
    .setDepth(DEPTH)
    .setName('infopanel')
    .setVisible(false);

  let standing: Face | undefined;
  let leaving: Face | undefined;
  /** How many layers wait behind the one standing: the ghosts, and the room they ask for. */
  let behind = 0;
  const box: Box = { left: 0, top: 0, rightOfTile: true };
  /** The middle of the row whose tooltip stands, in the card, and nothing while none does. */
  let raised: number | undefined;

  const bubble: RowBubble = {
    raise(centre: number, message: string): void {
      raised = centre;
      tooltip.beside(message, besideRow(box, centre));
    },
    drop(): void {
      raised = undefined;
      tooltip.hide();
    },
  };

  /** Level with the face it reads, clear of its rim, with the layers behind it out of its corner. */
  const stand = (at: TileFace): void => {
    const clear = at.radius + STANDOFF;
    box.rightOfTile = at.x + clear + CARD_WIDTH + behind * GHOST_OFFSET <= DESIGN_WIDTH - MARGIN;
    box.left = box.rightOfTile ? at.x + clear : at.x - clear - CARD_WIDTH;
    box.top = at.y - CARD_HEIGHT / 2;

    ghosts.clear();
    for (let depth = behind; depth >= 1; depth--) {
      drawCardSurface(ghosts, depth * ghostAway(box), depth * GHOST_OFFSET);
    }
    panel.setPosition(box.left, box.top);
    if (raised !== undefined) tooltip.restand(besideRow(box, raised));
  };

  /** Ends a dissolve where it was headed: the layer coming in stands in place, the old one is gone. */
  const settle = (): void => {
    if (leaving !== undefined) {
      scene.tweens.killTweensOf(leaving.root);
      leaving.root.destroy();
      leaving = undefined;
    }
    if (standing !== undefined) {
      scene.tweens.killTweensOf(standing.root);
      standing.root.setPosition(0, 0).setAlpha(1);
    }
  };

  const hide = (): void => {
    bubble.drop();
    settle();
    standing?.root.destroy();
    standing = undefined;
    ghosts.clear();
    panel.setVisible(false);
  };

  return {
    hide,

    show(layers: Layer[], index: number, at: TileFace, cycling: boolean): void {
      bubble.drop();
      settle();

      behind = layers.length - 1;
      stand(at);

      const outgoing = standing;
      if (!cycling) outgoing?.root.destroy();

      const face = buildFace(scene, bubble, layers[index]);
      // Under the layer it replaces, so the dissolve uncovers it, and over the ghosts either way.
      panel.addAt(face.root, 1);
      standing = face;

      if (cycling && outgoing !== undefined) {
        leaving = outgoing;
        for (const zone of outgoing.hovers) zone.disableInteractive();
        face.root.setPosition(ghostAway(box), GHOST_OFFSET).setAlpha(0);
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

      panel.setData('layer', layers[index].kind).setVisible(true);
    },

    place(at: TileFace): void {
      if (standing === undefined) return;
      stand(at);
    },
  };
}

/** Which way the layers behind the panel stand out of it: down, and away from the tile it reads. */
function ghostAway(box: Box): number {
  return box.rightOfTile ? GHOST_OFFSET : -GHOST_OFFSET;
}

/** The card a row's tooltip stands beside, level with that row, on the side the panel took. */
function besideRow(box: Box, centre: number): Beside {
  return {
    left: box.left,
    right: box.left + CARD_WIDTH,
    y: box.top + centre,
    prefer: box.rightOfTile ? 'right' : 'left',
  };
}

/** The layer's mark and name over its rows, laid out in the card's own type and spacing. */
function buildFace(scene: Phaser.Scene, bubble: RowBubble, layer: Layer): Face {
  const left = 1 + pad;
  const right = CARD_WIDTH - 1 - pad;
  const top = 1 + pad;
  const middle = top + 0.55 * em;
  const markBox = 1.15 * em;

  const paper = scene.add.graphics();
  drawCardSurface(paper, 0, 0);

  const head = headOf(scene, layer);
  const mark = fitMark(head.mark, markBox).setPosition(left + markBox / 2, middle);
  const name = addText(scene, left + markBox + 0.5 * em, middle, head.name, TITLE_STYLE).setOrigin(
    0,
    0.5,
  );

  const ruleY = Math.round(middle + 1.15 * em);
  const rule = scene.add.rectangle(left, ruleY, right - left, 1, CARD_EDGE).setOrigin(0, 0);

  const contents: Phaser.GameObjects.GameObject[] = [paper, mark, name, rule];
  const hovers: Phaser.GameObjects.Zone[] = [];
  const rows = rowsOf(layer);
  const firstRow = ruleY + 1 + 0.55 * em;

  if (rows.length === 0) {
    contents.push(addText(scene, left, firstRow, text('panel.no-yield'), LABEL_STYLE));
  }

  for (const [index, row] of rows.entries()) {
    const label = addText(scene, left, 0, text(`label.${row.term}`), LABEL_STYLE).setOrigin(0, 0.5);
    const value = addText(scene, right, 0, row.value, VALUE_STYLE).setOrigin(1, 0.5);
    const rowTop = firstRow + index * (label.height + 0.35 * em);
    const centre = rowTop + label.height / 2;
    label.setY(centre);
    value.setY(centre);

    const hover = scene.add
      .zone(left, rowTop, label.width, label.height)
      .setOrigin(0, 0)
      .setName(`infopanel-row-${index}`)
      .setInteractive();
    hover.on('pointerover', () => bubble.raise(centre, text(`tooltip.${row.term}`)));
    hover.on('pointerout', () => bubble.drop());

    contents.push(label, value, hover);
    hovers.push(hover);
  }

  return { root: scene.add.container(0, 0, contents), hovers };
}

function headOf(
  scene: Phaser.Scene,
  layer: Layer,
): { mark: Phaser.GameObjects.Polygon; name: string } {
  switch (layer.kind) {
    case 'unit':
      return { mark: unitMark(scene, layer.unit), name: text(`unit.${layer.unit.stats.id}`) };
    case 'building':
      return {
        mark: buildingMark(scene, layer.building),
        name: text(`building.${layer.building}`),
      };
    case 'terrain':
      return { mark: terrainMark(scene, layer.terrain), name: text(`terrain.${layer.terrain}`) };
  }
}

function rowsOf(layer: Layer): Row[] {
  switch (layer.kind) {
    case 'unit':
      return STATS.map((stat) => ({
        term: stat,
        value:
          stat === 'health'
            ? `${layer.unit.stats.health} / ${UNIT_STATS[layer.unit.stats.id].health}`
            : String(layer.unit.stats[stat]),
      }));
    case 'building':
      return yieldRows(BUILDINGS[layer.building].yields);
    case 'terrain':
      return yieldRows(TERRAIN_YIELDS[layer.terrain]);
  }
}

/** What the layer yields at income, in the order the resource bar reads. */
function yieldRows(yields: Partial<Resources>): Row[] {
  const rows: Row[] = [];
  for (const resource of RESOURCES) {
    const amount = yields[resource];
    if (amount !== undefined) rows.push({ term: resource, value: `+${amount}` });
  }
  return rows;
}

/** A mark drawn at the size it has on the map, brought into a box; its outline keeps its weight. */
function fitMark(mark: Phaser.GameObjects.Polygon, box: number): Phaser.GameObjects.Polygon {
  const scale = box / Math.max(mark.width, mark.height);
  return mark.setScale(scale).setStrokeStyle(mark.lineWidth / scale, mark.strokeColor);
}
