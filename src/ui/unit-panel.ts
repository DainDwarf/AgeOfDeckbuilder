import type Phaser from 'phaser';
import { UNIT_STATS, type Unit } from '../rules/units';
import {
  addText,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  drawBubble,
  MARGIN,
  PANEL_EDGE,
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

const PAD = 12;

/** The square the placeholder mark is drawn into, and the scale that fits the widest one in it. */
const MARK_BOX = 20;
const MARK_SCALE = 0.75;
const MARK_TO_NAME = 10;

const RULE_GAP = 9;
const ROW_GAP = 6;

/** The clear water between a stat's name and its value. */
const COLUMN_GAP = 28;

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
            ? addText(scene, 0, 0, ` / ${UNIT_STATS[unit.stats.id].health}`, VALUE_STYLE).setOrigin(
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

      const rightOfTile = at.x + STANDOFF + width <= DESIGN_WIDTH - MARGIN;
      const left = rightOfTile ? at.x + STANDOFF : at.x - STANDOFF - width;
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
        row.hover.on('pointerover', () =>
          tooltip.beside(text(`tooltip.${row.stat}`), {
            left,
            right: left + width,
            y: top + middle,
            prefer: rightOfTile ? 'right' : 'left',
          }),
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

      drawBubble(bubble, width, height, {
        edge: rightOfTile ? 'left' : 'right',
        at: at.y - top,
      });
      panel.setPosition(left, top).setVisible(true);
    },
  };
}
