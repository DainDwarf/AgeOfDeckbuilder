import type Phaser from 'phaser';
import { UNIT_STATS, type Unit } from '../rules/units';
import {
  addText,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  PANEL_EDGE,
  PANEL_FILL,
  UI_FONT,
} from './design-space';
import { TILE_SIZE, unitMark } from './map';
import { BAR_HEIGHT } from './resource-bar';
import { text } from './text';
import { createTooltip } from './tooltip';

/** Over the table and the end-turn button, under the tooltips and the overlay. */
const DEPTH = 25;

const TITLE_STYLE = { fontFamily: UI_FONT, fontSize: '17px', fontStyle: 'bold', color: '#0d1014' };
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '15px', color: '#4a5058' };
const VALUE_STYLE = { fontFamily: UI_FONT, fontSize: '15px', color: '#0d1014' };
const MAX_STYLE = { fontFamily: UI_FONT, fontSize: '15px', color: '#4a5058' };

const PAD = 12;

/** The square the placeholder mark is drawn into, and the scale that fits the widest one in it. */
const MARK_BOX = 20;
const MARK_SCALE = 0.75;
const MARK_TO_NAME = 10;

const RULE_GAP = 9;
const ROW_GAP = 6;

/** The clear water between a stat's name and its value. */
const COLUMN_GAP = 28;

const TAIL_LENGTH = 7;
const TAIL_HALF = 6;

/** How far the panel stands off the centre of the tile it points at. */
const STANDOFF = TILE_SIZE + 12;

const STATS = ['health', 'damage', 'range', 'move'] as const;

export type UnitPanel = {
  show(unit: Unit, at: { x: number; y: number }): void;
  hide(): void;
};

/**
 * What a unit is, read off the map: its mark and its name over its four stats, in a bubble whose
 * tail points at the tile it stands on. Every show rebuilds it, so nothing here follows a state
 * change — the panel is dismissed by whatever caused one.
 */
export function createUnitPanel(scene: Phaser.Scene): UnitPanel {
  const tooltip = createTooltip(scene);
  const bubble = scene.add.graphics();
  const panel = scene.add
    .container(0, 0, [bubble])
    .setDepth(DEPTH)
    .setName('unit-panel')
    .setVisible(false);

  let contents: Phaser.GameObjects.GameObject[] = [];

  const hide = (): void => {
    tooltip.hide();
    panel.setVisible(false);
    for (const object of contents) object.destroy();
    contents = [];
  };

  return {
    hide,

    show(unit: Unit, at: { x: number; y: number }): void {
      hide();

      const mark = unitMark(scene, unit, MARK_SCALE);
      const name = addText(scene, 0, 0, text(`card.${unit.stats.id}`), TITLE_STYLE).setOrigin(
        0,
        0.5,
      );
      const rule = scene.add.rectangle(0, 0, 1, 1, PANEL_EDGE).setOrigin(0, 0);

      const rows = STATS.map((stat) => ({
        stat,
        label: addText(scene, 0, 0, text(`label.${stat}`), LABEL_STYLE).setOrigin(0, 0.5),
        value: addText(scene, 0, 0, String(unit.stats[stat]), VALUE_STYLE).setOrigin(1, 0.5),
        max:
          stat === 'health'
            ? addText(scene, 0, 0, ` / ${UNIT_STATS[unit.stats.id].health}`, MAX_STYLE).setOrigin(
                1,
                0.5,
              )
            : undefined,
        hover: scene.add.zone(0, 0, 1, 1).setOrigin(0, 0).setInteractive(),
      }));

      const titleHeight = Math.max(MARK_BOX, name.height);
      const rowHeight = rows[0].label.height;
      const inner = Math.max(
        MARK_BOX + MARK_TO_NAME + name.width,
        ...rows.map(
          (row) => row.label.width + COLUMN_GAP + row.value.width + (row.max?.width ?? 0),
        ),
      );
      const width = inner + 2 * PAD;
      const ruleY = PAD + titleHeight + RULE_GAP;
      const firstRow = ruleY + 1 + RULE_GAP;
      const height = firstRow + rows.length * rowHeight + (rows.length - 1) * ROW_GAP + PAD;

      mark.setPosition(PAD + MARK_BOX / 2, PAD + titleHeight / 2);
      name.setPosition(PAD + MARK_BOX + MARK_TO_NAME, PAD + titleHeight / 2);
      rule.setPosition(PAD, ruleY).setSize(inner, 1);

      const beside = at.x + STANDOFF + width <= DESIGN_WIDTH - MARGIN;
      const left = beside ? at.x + STANDOFF : at.x - STANDOFF - width;
      const top = Math.min(
        Math.max(at.y - height / 2, BAR_HEIGHT + 8),
        DESIGN_HEIGHT - MARGIN - height,
      );

      for (const [index, row] of rows.entries()) {
        const rowTop = firstRow + index * (rowHeight + ROW_GAP);
        const middle = rowTop + rowHeight / 2;
        row.label.setPosition(PAD, middle);
        row.max?.setPosition(width - PAD, middle);
        row.value.setPosition(width - PAD - (row.max?.width ?? 0), middle);
        row.hover.setPosition(PAD, rowTop).setSize(row.label.width, rowHeight);
        // Under the whole panel, as the resource bar's hangs under the whole bar: a bubble under
        // the hovered row would cover the rows below it.
        row.hover.on('pointerover', () =>
          tooltip.show(
            text(`tooltip.${row.stat}`),
            left + PAD,
            left + PAD + row.label.width / 2,
            top + height + 8,
          ),
        );
        row.hover.on('pointerout', () => tooltip.hide());
      }

      contents = [
        mark,
        name,
        rule,
        ...rows.flatMap((row) =>
          row.max === undefined
            ? [row.label, row.value, row.hover]
            : [row.label, row.value, row.max, row.hover],
        ),
      ];
      panel.add(contents);

      drawBubble(bubble, width, height, at.y - top, beside);
      panel.setPosition(left, top).setVisible(true);
    },
  };
}

/**
 * The box and its tail as one closed path, so the fill is continuous and the stroke never crosses
 * the seam. The tail reaches out of the edge nearer the tile, and stays clear of both corners.
 */
function drawBubble(
  bubble: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  at: number,
  onLeft: boolean,
): void {
  const tip = Math.min(Math.max(at, TAIL_HALF + 4), height - TAIL_HALF - 4);

  bubble.clear();
  bubble.fillStyle(PANEL_FILL);
  bubble.lineStyle(1, PANEL_EDGE);
  bubble.beginPath();
  bubble.moveTo(0, 0);
  if (onLeft) {
    bubble.lineTo(width, 0);
    bubble.lineTo(width, height);
    bubble.lineTo(0, height);
    bubble.lineTo(0, tip + TAIL_HALF);
    bubble.lineTo(-TAIL_LENGTH, tip);
    bubble.lineTo(0, tip - TAIL_HALF);
  } else {
    bubble.lineTo(width, 0);
    bubble.lineTo(width, tip - TAIL_HALF);
    bubble.lineTo(width + TAIL_LENGTH, tip);
    bubble.lineTo(width, tip + TAIL_HALF);
    bubble.lineTo(width, height);
    bubble.lineTo(0, height);
  }
  bubble.closePath();
  bubble.fillPath();
  bubble.strokePath();
}
