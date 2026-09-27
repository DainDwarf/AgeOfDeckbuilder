import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import { achievementOf, ageOf, firstAge, firstDeck, firstRegion } from '../rules/catalogue';
import { type Chronicle, onSettlePhase } from '../rules/state';
import { addText, answersPress, holdDesignSpace, onClick, UI_FONT } from './design-space';
import { readsKeys } from './keys';
import { css, LOOK } from './look';
import { backRaisesMenu, closeMenu } from './menu-scene';
import { ROOM, wearNavbar } from './navbar';
import { type Choices, type Opening, savedOpening } from './save-entry';
import { type TextKey, technologyName, text } from './text';

/** The first age and deck the catalogue lists, and that age's first region, on that seed. */
export function firstsOf(seed: number | undefined): Choices {
  const age = firstAge(CATALOGUE);
  return { age, region: firstRegion(CATALOGUE, age), deck: firstDeck(CATALOGUE), seed };
}

const WIDTH = 480;
const PADDING = 30;
const LABEL_WIDTH = 120;
const FACE_HEIGHT = 34;
const FACE_PADDING = 16;
const FACE_GAP = 10;
const ROW_GAP = 8;
const SEED_WIDTH = 160;
const SEED_DIGITS = 10;
const BUTTON_HEIGHT = 44;

const INK = css(LOOK.ink);
const TITLE_STYLE = { fontFamily: UI_FONT, fontSize: '26px', fontStyle: 'bold', color: INK };
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };
const FACE_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };

type Row = 'age' | 'region' | 'deck';

/**
 * What Continue reads under its label: where the chronicle stands, then each achievement it reached,
 * under its technology's name.
 */
function readingsOf(chronicle: Chronicle): string[] {
  const named = (id: string): string =>
    technologyName(achievementOf(CATALOGUE, chronicle.age, id).technology);
  return [
    onSettlePhase(chronicle)
      ? text('launch.settle-phase')
      : text('launch.turn', { turn: chronicle.turn }),
    ...chronicle.achievements
      .filter(({ reached }) => reached)
      .map(({ id }) => text('launch.reached', { achievement: named(id) })),
  ];
}

/**
 * The launch page: Continue over the rows while the save holds a chronicle, one row per choice, the
 * seed slot under them and Launch under the slot.
 */
export class LaunchPage extends Phaser.Scene {
  constructor() {
    super('launch');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    closeMenu(this);
    const { content } = wearNavbar(this, 'launch');
    backRaisesMenu(this);
    let chosen: Choices = firstsOf(undefined);
    let typed = '';
    let root: Phaser.GameObjects.Container | undefined;
    let seedLabel: Phaser.GameObjects.Text | undefined;

    const open = (opening: Opening): void => {
      // Queued ahead of the start below, so the overlay's keyboard plugin stands ahead of the ui
      // scene's and the map is up before the ui scene reaches into it (docs/PHASER.md).
      this.scene.launch('overlay');
      this.scene.launch('map');
      this.scene.start('ui', opening);
    };

    const launch = (): void => {
      open({ ...chosen, seed: typed === '' ? undefined : Number(typed) });
    };

    const paintSeed = (): void => {
      seedLabel?.setText(typed === '' ? text('launch.fresh') : typed);
    };

    const choose = (row: Row, option: string): void => {
      switch (row) {
        case 'age':
          if (option !== chosen.age)
            chosen = { ...chosen, age: option, region: firstRegion(CATALOGUE, option) };
          break;
        case 'region':
          chosen = { ...chosen, region: option };
          break;
        case 'deck':
          chosen = { ...chosen, deck: option };
          break;
      }
      lay();
    };

    const lay = (): void => {
      root?.destroy();
      const { regions } = ageOf(CATALOGUE, chosen.age);
      const rows: { row: Row; options: readonly string[]; chosen: string }[] = [
        { row: 'age', options: Object.keys(CATALOGUE.ages), chosen: chosen.age },
        { row: 'region', options: Object.keys(regions), chosen: chosen.region },
        { row: 'deck', options: Object.keys(CATALOGUE.decks), chosen: chosen.deck },
      ];

      const title = addText(this, 0, 0, text('launch.title'), TITLE_STYLE).setOrigin(0.5, 0);
      const laid = rows.map(({ row, options, chosen: held }) => ({
        row,
        faces: options.map((option) => {
          const label = addText(this, 0, 0, option, FACE_STYLE)
            .setOrigin(0.5)
            .setName(`launch-${row}-${option}-label`);
          const face = this.add
            .rectangle(0, 0, label.width + 2 * FACE_PADDING, FACE_HEIGHT, LOOK.panelFill)
            .setStrokeStyle(1, LOOK.panelEdge)
            .setName(`launch-${row}-${option}`)
            .setData('chosen', option === held)
            .setInteractive();
          answersPress(face);
          if (option === held) face.setFillStyle(LOOK.accent);
          onClick(face, () => choose(row, option));
          return { face, label };
        }),
      }));

      const saved = savedOpening();
      const continued =
        saved === undefined
          ? undefined
          : {
              saved,
              label: addText(this, 0, 0, text('launch.continue'), LABEL_STYLE).setName(
                'launch-continue-label',
              ),
              lines: readingsOf(saved.resumed).map((reading, index) =>
                addText(this, 0, 0, reading, FACE_STYLE).setName(`launch-continue-line-${index}`),
              ),
            };
      const continuing = continued === undefined ? [] : [continued.label, ...continued.lines];
      const continueHeight =
        BUTTON_HEIGHT + (continued?.lines.reduce((sum, line) => sum + line.height, 0) ?? 0);
      const continueRoom = continued === undefined ? 0 : continueHeight + PADDING;

      const widest = Math.max(
        SEED_WIDTH,
        ...laid.map(({ faces }) =>
          faces.reduce((sum, { face }, index) => sum + face.width + (index > 0 ? FACE_GAP : 0), 0),
        ),
      );
      const width = Math.max(
        WIDTH,
        2 * PADDING + LABEL_WIDTH + widest,
        ...continuing.map((line) => 2 * PADDING + 2 * FACE_PADDING + line.width),
      );
      const count = laid.length + 1;
      const rowsHeight = count * FACE_HEIGHT + (count - 1) * ROW_GAP;
      const height =
        PADDING + title.height + PADDING + continueRoom + rowsHeight + 2 * PADDING + BUTTON_HEIGHT;
      const top = ROOM.y + Math.round((ROOM.height - height) / 2);
      const middle = ROOM.x + ROOM.width / 2;
      const left = middle - width / 2 + PADDING;
      const right = middle + width / 2 - PADDING;
      const head = top + PADDING + title.height + PADDING;
      const body = head + continueRoom;
      const rowY = (index: number): number =>
        body + index * (FACE_HEIGHT + ROW_GAP) + FACE_HEIGHT / 2;

      const box = this.add
        .rectangle(middle, top + height / 2, width, height, LOOK.panelFill)
        .setStrokeStyle(1, LOOK.panelEdge);
      title.setPosition(middle, top + PADDING);
      root = this.add.container(0, 0, [box, title]).setName('launch');
      content.add(root);

      if (continued !== undefined) {
        const face = this.add
          .rectangle(
            middle,
            head + continueHeight / 2,
            width - 2 * PADDING,
            continueHeight,
            LOOK.accent,
          )
          .setName('launch-continue')
          .setInteractive();
        answersPress(face);
        onClick(face, () => open(continued.saved));
        root.add(face);
        let y = head + (BUTTON_HEIGHT - continued.label.height) / 2;
        for (const line of continuing) {
          root.add(line.setOrigin(0.5, 0).setPosition(middle, y));
          y += line.height;
        }
      }

      const labelled = (key: TextKey, index: number): Phaser.GameObjects.Text =>
        addText(this, left, rowY(index), text(key), LABEL_STYLE).setOrigin(0, 0.5);

      laid.forEach(({ row, faces }, index) => {
        root?.add(labelled(`launch.${row}`, index));
        let x = right;
        for (const { face, label } of [...faces].reverse()) {
          face.setPosition(x - face.width / 2, rowY(index));
          label.setPosition(face.x, face.y);
          x -= face.width + FACE_GAP;
          root?.add([face, label]);
        }
      });

      const seedRow = laid.length;
      const slot = this.add
        .rectangle(right - SEED_WIDTH / 2, rowY(seedRow), SEED_WIDTH, FACE_HEIGHT, LOOK.panelFill)
        .setStrokeStyle(1, LOOK.panelEdge)
        .setName('launch-seed');
      seedLabel = addText(this, slot.x, slot.y, '', FACE_STYLE)
        .setOrigin(0.5)
        .setName('launch-seed-label');
      root.add([labelled('launch.seed', seedRow), slot, seedLabel]);
      paintSeed();

      const buttonY = body + rowsHeight + PADDING + BUTTON_HEIGHT / 2;
      const button = this.add
        .rectangle(middle, buttonY, width - 2 * PADDING, BUTTON_HEIGHT, LOOK.accent)
        .setName('launch-button')
        .setInteractive();
      answersPress(button);
      onClick(button, launch);
      const buttonLabel = addText(this, middle, buttonY, text('launch.button'), LABEL_STYLE)
        .setOrigin(0.5)
        .setName('launch-button-label');
      root.add([button, buttonLabel]);
    };

    readsKeys(this, (event) => {
      if (event.key === 'Enter') {
        launch();
        return true;
      }
      if (event.key === 'Backspace') {
        typed = typed.slice(0, -1);
        paintSeed();
        return true;
      }
      if (!/^[0-9]$/.test(event.key)) return false;
      if (typed.length >= SEED_DIGITS) return true;
      typed += event.key;
      paintSeed();
      return true;
    });

    lay();
  }
}
