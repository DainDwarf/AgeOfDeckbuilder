import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import { ageOf } from '../rules/catalogue';
import { refuse } from '../rules/map-kinds';
import type { Chronicle } from '../rules/state';
import {
  addText,
  answersPress,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  holdDesignSpace,
  onClick,
  UI_FONT,
} from './design-space';
import { readsKeys } from './keys';
import { css, LOOK } from './look';
import { type TextKey, text } from './text';

/** What a chronicle is launched on: an age, one of its regions and a deck, and a seed or nothing for a fresh one. */
export type Choices = {
  readonly age: string;
  readonly region: string;
  readonly deck: string;
  readonly seed: number | undefined;
};

/** What the chronicle screen opens on: the choices a chronicle begins on, and the one resumed on them. */
export type Opening = Choices & { readonly resumed?: Chronicle };

/** The first age and deck the catalogue lists, and that age's first region, on that seed. */
export function firstsOf(seed: number | undefined): Choices {
  const age = firstOf(CATALOGUE.ages, 'age');
  return { age, region: firstRegionOf(age), deck: firstOf(CATALOGUE.decks, 'deck'), seed };
}

/** The first region the age lists; an age the catalogue does not hold is refused. */
export function firstRegionOf(age: string): string {
  return firstOf(ageOf(CATALOGUE, age).regions, 'region');
}

function firstOf(table: Readonly<Record<string, unknown>>, noun: string): string {
  const [first] = Object.keys(table);
  if (first === undefined) refuse(CATALOGUE, `no ${noun} is listed`);
  return first;
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

/** The launch page: one row per choice, the seed slot under them and Launch under the slot. */
export class LaunchPage extends Phaser.Scene {
  private opening!: Choices;

  constructor() {
    super('launch');
  }

  init(choices: Choices): void {
    this.opening = choices;
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    let chosen: Choices = this.opening;
    let typed = chosen.seed === undefined ? '' : String(chosen.seed);
    let root: Phaser.GameObjects.Container | undefined;
    let seedLabel: Phaser.GameObjects.Text | undefined;

    const launch = (): void => {
      // Queued ahead of the start below, so the overlay's keyboard plugin stands ahead of the ui
      // scene's and the map is up before the ui scene reaches into it (docs/PHASER.md).
      this.scene.launch('overlay');
      this.scene.launch('map');
      this.scene.start('ui', { ...chosen, seed: typed === '' ? undefined : Number(typed) });
    };

    const paintSeed = (): void => {
      seedLabel?.setText(typed === '' ? text('launch.fresh') : typed);
    };

    const choose = (row: Row, option: string): void => {
      switch (row) {
        case 'age':
          chosen = { ...chosen, age: option, region: firstRegionOf(option) };
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

      const widest = Math.max(
        SEED_WIDTH,
        ...laid.map(({ faces }) =>
          faces.reduce((sum, { face }, index) => sum + face.width + (index > 0 ? FACE_GAP : 0), 0),
        ),
      );
      const width = Math.max(WIDTH, 2 * PADDING + LABEL_WIDTH + widest);
      const count = laid.length + 1;
      const rowsHeight = count * FACE_HEIGHT + (count - 1) * ROW_GAP;
      const height = PADDING + title.height + PADDING + rowsHeight + 2 * PADDING + BUTTON_HEIGHT;
      const top = Math.round((DESIGN_HEIGHT - height) / 2);
      const middle = DESIGN_WIDTH / 2;
      const left = middle - width / 2 + PADDING;
      const right = middle + width / 2 - PADDING;
      const body = top + PADDING + title.height + PADDING;
      const rowY = (index: number): number =>
        body + index * (FACE_HEIGHT + ROW_GAP) + FACE_HEIGHT / 2;

      const box = this.add
        .rectangle(middle, top + height / 2, width, height, LOOK.panelFill)
        .setStrokeStyle(1, LOOK.panelEdge);
      title.setPosition(middle, top + PADDING);
      root = this.add.container(0, 0, [box, title]).setName('launch');

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
        // A seed the address handed in may be negative, and no key types the sign back.
        if (typed === '-') typed = '';
        paintSeed();
        return true;
      }
      if (!/^[0-9]$/.test(event.key)) return false;
      if (typed.replace('-', '').length >= SEED_DIGITS) return true;
      typed += event.key;
      paintSeed();
      return true;
    });

    lay();
  }
}
