import type Phaser from 'phaser';
import type { Campaign } from '../rules/campaign';
import { type Achievement, type Catalogue, technologyOf } from '../rules/catalogue';
import { type Control, type Press, pressOf } from './bindings';
import { createKindBubble, type Name } from './card-face';
import { addText, answersPress, dragged, MARGIN, onClick, UI_FONT } from './design-space';
import { onHeldKeys } from './keys';
import { css, LOOK } from './look';
import { groundColourOf } from './marks';
import { ROOM, type Worn } from './navbar';
import {
  drawRun,
  linesOf,
  NAME_LINE,
  NAME_STYLE,
  PAD_X,
  PAD_Y,
  paperOf,
  type RunNames,
  TEXT_LINE,
  TEXT_STYLE,
} from './plate';
import { createWell, placeWell, SUNK } from './resource-bar';
import { PAN_SPEED } from './scroll';
import { createSmallCards, type Raiser } from './small-card';
import { achievementGoal, ageName, technologyName, text } from './text';
import { layOutTree, PLATE_WIDTH, type Plate, stopped, WASH } from './tree-layout';

const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '11px', color: css(LOOK.faintInk) };
const UNKNOWN_STYLE = { ...NAME_STYLE, color: css(LOOK.unknownInk) };
const AGE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '20px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};

/** The gutter between a plate's labels and what they label. */
const LABEL_GAP = 8;

/** The influence's diamond, and how far the number stands off the start of its line. */
const DIAMOND = 8;
const DIAMOND_TO_NUMBER = 14;

const LINK_WEIGHT = 2;
const FAINT_LINK = 0.45;

/** The two controls that move the tree, and the way each one carries it. */
const PANS: readonly { control: Control; way: number }[] = [
  { control: 'pan-left', way: -1 },
  { control: 'pan-right', way: 1 },
];

/** One line of a reward: an entry read as a run, or the influence the achievement pays. */
type RewardLine =
  | { readonly kind: 'run'; readonly entry: string }
  | { readonly kind: 'influence'; readonly amount: number };

/** What a plate reads when it reads anything: the technology's name, its goal, and its reward. */
type Reading = {
  readonly name: string;
  readonly goal: string;
  readonly reward: readonly RewardLine[];
};

/** Every technology's reading, from the achievement that earns it. */
function readingsOf(catalogue: Catalogue): Map<string, Reading> {
  const earning = new Map<string, { id: string; achievement: Achievement }>();
  for (const { achievements } of Object.values(catalogue.ages)) {
    for (const [id, achievement] of Object.entries(achievements)) {
      earning.set(achievement.technology, { id, achievement });
    }
  }
  const readings = new Map<string, Reading>();
  for (const technology of Object.keys(catalogue.technologies)) {
    const earned = earning.get(technology);
    if (earned === undefined) throw new Error(`no achievement earns the technology ${technology}`);
    const { unlocks } = technologyOf(catalogue, technology);
    const reward: RewardLine[] = [
      ...Object.entries(unlocks.cards).map(
        ([card, copies]): RewardLine => ({
          kind: 'run',
          entry: text('plate.cards', { copies, card }),
        }),
      ),
      ...(unlocks.age === undefined
        ? []
        : [{ kind: 'run', entry: text('plate.age', { age: ageName(unlocks.age) }) } as const]),
      ...(earned.achievement.influence > 0
        ? [{ kind: 'influence', amount: earned.achievement.influence } as const]
        : []),
    ];
    readings.set(technology, {
      name: technologyName(technology),
      goal: achievementGoal(earned.id, earned.achievement.need),
      reward,
    });
  }
  return readings;
}

export type TreeView = {
  /** A scrim risen over the screen, or the last fallen. */
  cover(under: boolean): void;
};

/**
 * The technology tree in the room the navbar and the bar leave, for the campaign; a right click on a
 * name of a plate hands `inspect` what it names, and a left click on an available plate hands `pinMoved`
 * the technology the pin moves to, nothing where it is taken off.
 */
export function createTree(
  scene: Phaser.Scene,
  { bubbles, tooltip }: Worn,
  catalogue: Catalogue,
  { technologies: learned, pin: pinnedAtOpening }: Pick<Campaign, 'technologies' | 'pin'>,
  inspect: (name: Name) => void,
  pinMoved: (technology: string | undefined) => void,
): TreeView {
  const readings = readingsOf(catalogue);
  const labelColumn = (() => {
    const widths = (['plate.goal', 'plate.reward'] as const).map((key) => {
      const probe = addText(scene, 0, 0, text(key).toUpperCase(), LABEL_STYLE);
      const { width } = probe;
      probe.destroy();
      return width;
    });
    return Math.max(...widths) + LABEL_GAP;
  })();
  const goalWidth = PLATE_WIDTH - 2 * PAD_X - labelColumn;
  /** How many lines a plate reads under the name: the goal's, then the reward's, one at least. */
  const plateLines = ({ goal, reward }: Reading): number =>
    linesOf(scene, goal, goalWidth) + Math.max(1, reward.length);
  const plateHeight =
    2 * PAD_Y + NAME_LINE + TEXT_LINE * Math.max(...[...readings.values()].map(plateLines));
  const tree = layOutTree(catalogue, learned, plateHeight, { ...ROOM, margin: MARGIN });

  // Under the navbar and the bar, which cover it as it slides.
  const layer = scene.add.layer();
  scene.children.sendToBack(layer);
  const root = scene.add.container(0, ROOM.y).setName('tree');
  layer.add(root);

  for (const { age, from, to } of tree.grounds) {
    root.add(
      scene.add
        .rectangle(from, 0, to - from, ROOM.height, groundColourOf(age))
        .setOrigin(0, 0)
        .setName(`ground-${age}`),
    );
  }
  const washes = scene.add.graphics();
  for (const [at, { age, to }] of tree.grounds.entries()) {
    const next = tree.grounds[at + 1];
    const out = groundColourOf(age);
    const into = next === undefined ? LOOK.page : groundColourOf(next.age);
    washes.fillGradientStyle(out, into, out, into, 1);
    washes.fillRect(to - WASH / 2, 0, WASH, ROOM.height);
  }
  root.add(washes);
  for (const [at, { age, from }] of tree.grounds.entries()) {
    const head = from + (at === 0 ? 0 : WASH / 2) + MARGIN;
    root.add(
      addText(scene, head, MARGIN, ageName(age).toUpperCase(), AGE_STYLE).setName(
        `ground-${age}-name`,
      ),
    );
  }

  const links = scene.add.graphics();
  for (const { learned: pale, points } of tree.links) {
    links.lineStyle(LINK_WEIGHT, pale ? LOOK.paleInk : LOOK.ink, pale ? 1 : FAINT_LINK);
    const [first, ...rest] = points;
    links.beginPath();
    links.moveTo(first.x, first.y);
    for (const { x, y } of rest) links.lineTo(x, y);
    links.strokePath();
  }
  root.add(links);

  const small = createSmallCards(scene, bubbles, catalogue, createKindBubble(tooltip), inspect);
  /** The name the pointer is on, and whether the tree is being carried, which holds every rest off. */
  let hovered: Raiser | undefined;
  let carrying = false;
  const carry = (on: boolean): void => {
    if (on === carrying) return;
    carrying = on;
    if (on) small.down();
    else small.over(hovered);
  };

  /** The technology pinned, and the edge each available plate wears while its technology is. */
  let pinnedTechnology = pinnedAtOpening;
  const edges = new Map<string, Phaser.GameObjects.Rectangle>();
  const edge = (technology: string | undefined, on: boolean): void => {
    if (technology === undefined) return;
    edges.get(technology)?.setVisible(on);
  };
  const press = (technology: string): void => {
    const next = technology === pinnedTechnology ? undefined : technology;
    edge(pinnedTechnology, false);
    edge(next, true);
    pinnedTechnology = next;
    pinMoved(next);
  };

  /** The plate's backing: sunk in a well, or its paper, which an available plate's press lands on. */
  const backingOf = (plate: Plate, id: string): Phaser.GameObjects.GameObject[] => {
    const { technology, state } = plate;
    switch (state) {
      case 'learned': {
        const { well } = createWell(scene, id);
        placeWell(well, { x: 0, y: 0, width: PLATE_WIDTH, height: plateHeight });
        return [well];
      }
      case 'available': {
        const paper = answersPress(
          paperOf(scene, PLATE_WIDTH, plateHeight, LOOK.panelFill).setInteractive(),
        );
        // The tree's drag begins on the scene's own press: one that dragged it ends on a plate.
        onClick(paper, () => press(technology), 'left', 'within slack');
        const shown = scene.add
          .rectangle(0, 0, PLATE_WIDTH, plateHeight)
          .setOrigin(0, 0)
          .setStrokeStyle(2, LOOK.pin)
          .setName(`${id}-pin`)
          .setVisible(false);
        edges.set(technology, shown);
        return [paper, shown];
      }
      case 'unknown':
        return [paperOf(scene, PLATE_WIDTH, plateHeight, LOOK.unknownFill)];
    }
  };

  const drawPlate = (plate: Plate): void => {
    const { technology, state } = plate;
    const id = `plate-${technology}`;
    const face = scene.add.container(plate.x, plate.y).setName(id).setData('state', state);
    root.add(face);
    const names: Name[] = [];
    face.setData('names', names);

    face.add(backingOf(plate, id));
    if (state === 'unknown') {
      face.add(
        addText(scene, PLATE_WIDTH / 2, plateHeight / 2, text('plate.unknown'), UNKNOWN_STYLE)
          .setOrigin(0.5)
          .setName(`${id}-name`),
      );
      return;
    }

    const reading = readings.get(technology);
    if (reading === undefined) throw new Error(`the technology ${technology} reads nothing`);
    const pressed = state === 'learned' ? SUNK : 0;
    const left = PAD_X + pressed;
    const values = left + labelColumn;
    const lineMiddle = (line: number): number =>
      pressed + PAD_Y + NAME_LINE + (line + 0.5) * TEXT_LINE;

    const name =
      state === 'learned' ? text('plate.learned', { technology: reading.name }) : reading.name;
    face.add(
      addText(scene, left, pressed + PAD_Y + NAME_LINE / 2, name, NAME_STYLE)
        .setOrigin(0, 0.5)
        .setName(`${id}-name`),
    );

    const label = (key: 'plate.goal' | 'plate.reward', line: number, part: string): void => {
      face.add(
        addText(scene, left, lineMiddle(line), text(key).toUpperCase(), LABEL_STYLE)
          .setOrigin(0, 0.5)
          .setName(`${id}-${part}-label`),
      );
    };

    const answers: RunNames = {
      over: (raiser, on) => {
        if (on) hovered = raiser;
        else if (hovered === raiser) hovered = undefined;
        if (!carrying) small.over(on ? raiser : undefined);
      },
      inspect,
      click: state === 'available' ? () => press(technology) : undefined,
    };
    /** An entry drawn as a run from that line down, wrapped at that width; how many lines it took. */
    const run = (entry: string, line: number, named: string, width: number): number => {
      const drawn = drawRun(scene, face, entry, { x: values, y: lineMiddle(line) }, width, answers);
      drawn.label.setName(named);
      names.push(...drawn.names);
      return drawn.lines;
    };

    label('plate.goal', 0, 'goal');
    const under = run(reading.goal, 0, `${id}-goal`, goalWidth);
    label('plate.reward', under, 'reward');
    const rewardLine = (line: RewardLine, at: number): void => {
      const named = `${id}-reward-${at}`;
      switch (line.kind) {
        case 'run':
          run(line.entry, under + at, named, Number.POSITIVE_INFINITY);
          return;
        case 'influence': {
          const middle = lineMiddle(under + at);
          face.add([
            scene.add.rectangle(values + 5, middle, DIAMOND, DIAMOND, LOOK.influence).setAngle(45),
            addText(scene, values + DIAMOND_TO_NUMBER, middle, String(line.amount), TEXT_STYLE)
              .setOrigin(0, 0.5)
              .setName(named),
          ]);
          return;
        }
      }
      const unlisted: never = line;
      throw new Error(`no reward line is ${JSON.stringify(unlisted)}`);
    };
    for (const [at, line] of reading.reward.entries()) rewardLine(line, at);
  };
  for (const plate of tree.plates) drawPlate(plate);
  edge(pinnedTechnology, true);

  let scroll = tree.opening;
  const place = (): void => {
    root.setX(ROOM.x - scroll);
  };
  place();
  /** The tree moved to that point, stopped at its ends; whether it moved at all. */
  const moveTo = (at: number): boolean => {
    const next = stopped(tree, at);
    if (next === scroll) return false;
    scroll = next;
    place();
    return true;
  };

  /** The press holding the tree: its button, where it landed on the canvas, and where the tree stood. */
  let drag: { press: Press; x: number; y: number; from: number; panned: boolean } | undefined;
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    const press = pressOf(pointer);
    if (press === undefined || drag !== undefined) return;
    const at = bubbles.at(pointer.x, pointer.y);
    const inRoom =
      at.x >= ROOM.x && at.x < ROOM.x + ROOM.width && at.y >= ROOM.y && at.y < ROOM.y + ROOM.height;
    if (!inRoom) return;
    drag = { press, x: pointer.x, y: pointer.y, from: scroll, panned: false };
  });
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (drag === undefined) return;
    if (!drag.panned && !dragged(scene, drag, pointer)) return;
    drag.panned = true;
    const was = bubbles.at(drag.x, drag.y);
    const now = bubbles.at(pointer.x, pointer.y);
    if (moveTo(drag.from - (now.x - was.x))) carry(true);
  });
  const letGo = (): void => {
    if (drag === undefined) return;
    drag = undefined;
    carry(false);
  };
  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (drag !== undefined && pressOf(pointer) === drag.press) letGo();
  });
  scene.input.on('pointerupoutside', letGo);

  let covered = false;
  onHeldKeys(scene, (pressing, delta) => {
    let way = 0;
    if (!covered) for (const pan of PANS) if (pressing(pan.control)) way += pan.way;
    const moved = way !== 0 && moveTo(scroll + (way * PAN_SPEED * delta) / 1000);
    if (drag?.panned !== true) carry(moved);
  });

  return {
    cover(under: boolean): void {
      covered = under;
    },
  };
}
