import type Phaser from 'phaser';
import { type Achievement, type Catalogue, technologyOf } from '../rules/catalogue';
import { type Control, type Press, pressOf } from './bindings';
import { createKindBubble, type Name } from './card-face';
import {
  addText,
  answersPress,
  dragged,
  MARGIN,
  onClick,
  onHover,
  ownBoxOf,
  UI_FONT,
} from './design-space';
import { onHeldKeys } from './keys';
import { css, LOOK } from './look';
import { groundColourOf } from './marks';
import { ROOM, type Worn } from './navbar';
import { createWell, placeWell, SUNK } from './resource-bar';
import { PAN_SPEED } from './scroll';
import { createSmallCards, type Raiser } from './small-card';
import { achievementGoal, ageName, referenceName, technologyName, text } from './text';
import { layOutRun, type Run } from './text-run';
import { layOutTree, PLATE_WIDTH, type Plate, type PlateState, stopped, WASH } from './tree-layout';

const INK = css(LOOK.ink);
const TEXT_SIZE = 14;
/** A glyph a run marks, corner to corner. */
const GLYPH = (2 / 3) * TEXT_SIZE;
const NAME_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };
const TEXT_STYLE = { fontFamily: UI_FONT, fontSize: `${TEXT_SIZE}px`, color: INK };
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '11px', color: css(LOOK.faintInk) };
const UNKNOWN_STYLE = { ...NAME_STYLE, color: css(LOOK.unknownInk) };
const AGE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '20px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};

/** A plate's inside: the padding round its lines, how far apart they stand, and the labels' gutter. */
const PAD_X = 12;
const PAD_Y = 8;
const NAME_LINE = 22;
const TEXT_LINE = 18;
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

/** An entry drawn as a run wrapped at that width, its names and glyphs where the run stands them. */
function addRun(
  scene: Phaser.Scene,
  entry: string,
  width: number,
): { label: Phaser.GameObjects.Text; run: Run } {
  // Phaser runs the callback from inside updateText, on a context whose font it has just synced.
  let run!: Run;
  const label = addText(scene, 0, 0, entry, {
    ...TEXT_STYLE,
    wordWrap: {
      callback: (content, textObject) => {
        const measure = (drawn: string): number => textObject.context.measureText(drawn).width;
        run = layOutRun(
          content,
          measure,
          {
            width,
            glyph: GLYPH,
            bearing: TEXT_SIZE / 4,
            space: measure(' '),
          },
          referenceName,
        );
        return run.content.split('\n');
      },
    },
  });
  return { label, run };
}

export type TreeView = {
  /** A scrim risen over the screen, or the last fallen. */
  cover(under: boolean): void;
};

/**
 * The technology tree in the room the navbar and the bar leave, for a campaign holding these
 * technologies learned; a right click on a name of a plate hands `inspect` what it names.
 */
export function createTree(
  scene: Phaser.Scene,
  { bubbles, tooltip }: Worn,
  catalogue: Catalogue,
  learned: readonly string[],
  inspect: (name: Name) => void,
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
  const linesOf = ({ goal, reward }: Reading): number => {
    const { label, run } = addRun(scene, goal, goalWidth);
    label.destroy();
    return run.widths.length + Math.max(1, reward.length);
  };
  const plateHeight =
    2 * PAD_Y + NAME_LINE + TEXT_LINE * Math.max(...[...readings.values()].map(linesOf));
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

  const backingOf = (state: PlateState, id: string): Phaser.GameObjects.GameObject => {
    const paper = (fill: number): Phaser.GameObjects.Rectangle =>
      scene.add
        .rectangle(0, 0, PLATE_WIDTH, plateHeight, fill)
        .setOrigin(0, 0)
        .setStrokeStyle(1, LOOK.panelEdge);
    switch (state) {
      case 'learned': {
        const { well } = createWell(scene, id);
        placeWell(well, { x: 0, y: 0, width: PLATE_WIDTH, height: plateHeight });
        return well;
      }
      case 'available':
        return paper(LOOK.panelFill);
      case 'unknown':
        return paper(LOOK.unknownFill);
    }
  };

  const drawPlate = (plate: Plate): void => {
    const { technology, state } = plate;
    const id = `plate-${technology}`;
    const face = scene.add.container(plate.x, plate.y).setName(id).setData('state', state);
    root.add(face);
    const names: Name[] = [];
    face.setData('names', names);

    face.add(backingOf(state, id));
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

    /** An entry drawn as a run from that line down, wrapped at that width; how many lines it took. */
    const drawRun = (entry: string, line: number, named: string, width: number): number => {
      const { label: drawn, run } = addRun(scene, entry, width);
      const pitch = ownBoxOf(drawn).height / run.widths.length;
      const middleOf = (at: number): number => lineMiddle(line) + at * pitch;
      drawn
        .setOrigin(0, 0.5)
        .setPosition(values, middleOf((run.widths.length - 1) / 2))
        .setName(named);
      face.add(drawn);
      const { x: start } = ownBoxOf(drawn);
      const centreOf = (at: number): number => start + run.widths[at] / 2;
      for (const glyph of run.glyphs) {
        const side = GLYPH / Math.SQRT2;
        face.add(
          scene.add
            .rectangle(
              centreOf(glyph.line) + glyph.x,
              middleOf(glyph.line),
              side,
              side,
              LOOK.reading[glyph.resource],
            )
            .setAngle(45),
        );
      }
      for (const { reference, from, to, line: on } of run.names) {
        const each: Name = {
          reference,
          reading: {},
          x: centreOf(on) + (from + to) / 2,
          y: middleOf(on),
          width: to - from,
          height: pitch,
        };
        names.push(each);
        const raiser: Raiser = {
          name: each,
          where: () => {
            const at = face.getWorldTransformMatrix().transformPoint(each.x, each.y);
            return { x: at.x, top: at.y - each.height / 2, bottom: at.y + each.height / 2 };
          },
        };
        const zone = answersPress(
          scene.add.zone(each.x, each.y, each.width, each.height).setInteractive(),
        );
        onHover(
          zone,
          () => {
            hovered = raiser;
            if (!carrying) small.over(raiser);
          },
          () => {
            if (hovered === raiser) hovered = undefined;
            if (!carrying) small.over(undefined);
          },
        );
        // The name travels with the tree: a press that dragged it is released on it.
        onClick(zone, () => inspect(each), 'right', 'within slack');
        face.add(zone);
      }
      return run.widths.length;
    };

    label('plate.goal', 0, 'goal');
    const under = drawRun(reading.goal, 0, `${id}-goal`, goalWidth);
    label('plate.reward', under, 'reward');
    const rewardLine = (line: RewardLine, at: number): void => {
      const named = `${id}-reward-${at}`;
      switch (line.kind) {
        case 'run':
          drawRun(line.entry, under + at, named, Number.POSITIVE_INFINITY);
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
