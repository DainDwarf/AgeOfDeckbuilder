import type Phaser from 'phaser';
import type { Chronicle, Resource } from '../rules/chronicle';
import { addText, DESIGN_WIDTH, UI_FONT } from './design-space';
import { text } from './text';

export const BAR_HEIGHT = 48;

const PANEL_FILL = 0x0d1014;
const PANEL_ALPHA = 0.88;
const PANEL_EDGE = 0x2a2f36;
const DIM = '#9aa3ad';
const BRIGHT = '#e6e9ee';

type Reading = Resource | 'population';

/** The five core resources, then culture and population behind the divider. */
const GROUPS: readonly (readonly { key: Reading; colour: number }[])[] = [
  [
    { key: 'food', colour: 0x7d9c55 },
    { key: 'production', colour: 0xb0834a },
    { key: 'military', colour: 0xb05252 },
    { key: 'money', colour: 0xd9c26a },
    { key: 'science', colour: 0x5f8fc0 },
  ],
  [
    { key: 'culture', colour: 0x9a6fb8 },
    { key: 'population', colour: 0xc2c2cf },
  ],
];

type Entry = {
  readonly key: Reading;
  readonly chip: Phaser.GameObjects.Rectangle;
  readonly word: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
  readonly hover: Phaser.GameObjects.Zone;
};

export type ResourceBar = { render(chronicle: Chronicle): void };

export function createResourceBar(scene: Phaser.Scene): ResourceBar {
  const bar = scene.add.container(0, 0).setDepth(10);
  bar.add(
    scene.add.rectangle(0, 0, DESIGN_WIDTH, BAR_HEIGHT, PANEL_FILL, PANEL_ALPHA).setOrigin(0, 0),
  );
  bar.add(scene.add.rectangle(0, BAR_HEIGHT - 1, DESIGN_WIDTH, 1, PANEL_EDGE).setOrigin(0, 0));

  const tooltip = createTooltip(scene);

  const groups = GROUPS.map((group) =>
    group.map(({ key, colour }): Entry => {
      const chip = scene.add.rectangle(0, 0, 10, 10, colour).setAngle(45);
      const word = addText(scene, 0, 0, text(`label.${key}`), {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: DIM,
      }).setOrigin(0, 0.5);
      const value = addText(scene, 0, 0, '', {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: BRIGHT,
      }).setOrigin(0, 0.5);
      const hover = scene.add.zone(0, 0, 1, BAR_HEIGHT).setOrigin(0, 0).setInteractive();
      hover.on('pointerover', () => tooltip.show(key, hover.x));
      hover.on('pointerout', () => tooltip.hide());
      bar.add([chip, word, value, hover]);
      return { key, chip, word, value, hover };
    }),
  );

  const dividers = GROUPS.slice(1).map(() =>
    scene.add.rectangle(0, BAR_HEIGHT / 2, 1, BAR_HEIGHT - 20, PANEL_EDGE),
  );
  bar.add(dividers);

  const turn = addText(scene, DESIGN_WIDTH - 24, BAR_HEIGHT / 2, '', {
    fontFamily: UI_FONT,
    fontSize: '18px',
    color: DIM,
  }).setOrigin(1, 0.5);
  bar.add(turn);

  return {
    render(chronicle: Chronicle): void {
      for (const group of groups) {
        for (const entry of group) entry.value.setText(String(readingOf(chronicle, entry.key)));
      }
      turn.setText(text('bar.turn', { turn: chronicle.turn }));
      flow(groups, dividers);
    },
  };
}

function readingOf(chronicle: Chronicle, key: Reading): number {
  return key === 'population' ? chronicle.population : chronicle.resources[key];
}

function flow(groups: Entry[][], dividers: Phaser.GameObjects.Rectangle[]): void {
  const middle = BAR_HEIGHT / 2;
  let x = 24;
  for (const [index, group] of groups.entries()) {
    if (index > 0) {
      dividers[index - 1].setPosition(x, middle);
      x += 18;
    }
    for (const { chip, word, value, hover } of group) {
      chip.setPosition(x + 5, middle);
      word.setPosition(x + 18, middle);
      value.setPosition(word.x + word.width + 8, middle);
      hover.setPosition(x, 0).setSize(value.x + value.width - x, BAR_HEIGHT);
      x = value.x + value.width + 22;
    }
  }
}

function createTooltip(scene: Phaser.Scene): {
  show(key: Reading, x: number): void;
  hide(): void;
} {
  const box = scene.add
    .rectangle(0, 0, 1, 1, PANEL_FILL, PANEL_ALPHA)
    .setOrigin(0, 0)
    .setStrokeStyle(1, PANEL_EDGE);
  const label = addText(scene, 10, 7, '', {
    fontFamily: UI_FONT,
    fontSize: '14px',
    color: BRIGHT,
  });
  const tooltip = scene.add.container(0, 0, [box, label]).setDepth(30).setVisible(false);

  return {
    show(key: Reading, x: number): void {
      label.setText(text(`tooltip.${key}`));
      box.setSize(label.width + 20, label.height + 14);
      tooltip
        .setPosition(Math.min(x, DESIGN_WIDTH - box.width - 24), BAR_HEIGHT + 8)
        .setVisible(true);
    },
    hide(): void {
      tooltip.setVisible(false);
    },
  };
}
