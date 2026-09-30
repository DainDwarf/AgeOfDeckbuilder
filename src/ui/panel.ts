import Phaser from 'phaser';
import { pressOf } from './bindings';
import { dashAlong } from './card-face';
import { SLIDE_HOME, stopMotion, travel } from './card-motion';
import {
  answersPress,
  type Box,
  onClick,
  onHover,
  releasedOffCanvas,
  type Stratum,
  thingUnder,
  whileUp,
} from './design-space';
import { LOOK } from './look';
import { createScroll, heldAt, inside, reachOf } from './scroll';
import type { Answers, Point } from './stack';

/**
 * What a press held on a thing carries: its copy, drawn where the thing stands unscrolled, and the
 * box of the design space a release lands it in, where it does what a left click on the thing does.
 */
export type Carry = {
  readonly copy: () => Phaser.GameObjects.Container;
  readonly lands: Box;
};

/**
 * A thing a panel holds that answers the pointer: its box as it stands unscrolled, its answers, what
 * a left click on it does, where it does anything, and what a press held on it carries, where it
 * carries anything; a thing no left click answers carries nothing, whatever carry it declares.
 */
export type Held = {
  readonly box: Box;
  readonly answers: Answers;
  readonly press?: () => void;
  readonly carry?: Carry;
};

/** The one card a screen's panels carry, over all of them. */
export type Carrier = {
  /** Whether a card is carried: no panel points while one is. */
  readonly carrying: boolean;
  /**
   * The thing's copy lifted off a panel scrolled this far, under a press that landed at `from` and
   * stands at `at`; a landing runs `press`.
   */
  lift(carry: Carry, press: () => void, offset: number, from: Point, at: Point): void;
  /** The card carried and every one sliding home taken down at once. */
  down(): void;
};

/**
 * The carrier of a screen's panels, standing what it carries on the stratum handed: the copy follows
 * the pointer until the left button's release, which lands it where its carry lands and sends it
 * home anywhere else, off the canvas and under a scrim rising included.
 */
export function createCarrier(scene: Phaser.Scene, on: Stratum): Carrier {
  let carried:
    | {
        readonly carry: Carry;
        readonly press: () => void;
        readonly copy: Phaser.GameObjects.Container;
        readonly edge: Phaser.GameObjects.Graphics;
        readonly home: Point;
        readonly from: Point;
      }
    | undefined;
  const homing = new Set<Phaser.GameObjects.Container>();

  const follow = (at: Point): void => {
    if (carried === undefined) return;
    const { carry, copy, edge, home, from } = carried;
    copy.setPosition(home.x + at.x - from.x, home.y + at.y - from.y);
    edge.setVisible(inside(carry.lands, at.x, at.y));
  };

  const letGo = (): typeof carried => {
    const was = carried;
    carried = undefined;
    was?.edge.destroy();
    return was;
  };

  const slideHome = (): void => {
    const was = letGo();
    if (was === undefined) return;
    homing.add(was.copy);
    travel(scene, was.copy, { ...was.home, rotation: 0 }, 0, SLIDE_HOME).then(() => {
      homing.delete(was.copy);
      was.copy.destroy();
    });
  };

  // Phaser ends a drag at any button's release (docs/PHASER.md), so the carry reads the scene's own
  // moves and releases, and stands through a right click until the left button comes up.
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    follow(on.at(pointer.x, pointer.y));
  });
  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (carried === undefined || pressOf(pointer) !== 'left') return;
    const at = on.at(pointer.x, pointer.y);
    if (!inside(carried.carry.lands, at.x, at.y)) {
      slideHome();
      return;
    }
    const landed = carried;
    letGo();
    landed.copy.destroy();
    landed.press();
  });
  scene.input.on('pointerupoutside', slideHome);

  return {
    get carrying() {
      return carried !== undefined;
    },
    lift(carry, press, offset, from, at) {
      const copy = carry.copy();
      const { x, y, width, height } = carry.lands;
      const off = 6 + 2 / 2;
      const edge = scene.add.graphics().lineStyle(2, LOOK.paleInk).setName('landing-edge');
      dashAlong(edge, [
        { x: x + off, y: y + off },
        { x: x + width - off, y: y + off },
        { x: x + width - off, y: y + height - off },
        { x: x + off, y: y + height - off },
        { x: x + off, y: y + off },
      ]);
      on.layer.add([edge, copy]);
      carried = { carry, press, copy, edge, home: { x: copy.x, y: copy.y - offset }, from };
      follow(at);
    },
    down() {
      letGo()?.copy.destroy();
      for (const copy of homing) {
        stopMotion(scene, copy);
        copy.destroy();
      }
      homing.clear();
    },
  };
}

/** What a panel draws from its frame's top, the things in it that answer, and where its last line ends. */
export type Filled = {
  readonly parts: readonly Phaser.GameObjects.GameObject[];
  readonly held: readonly Held[];
  readonly foot: number;
};

/**
 * What a panel is made of: its name, the frame it is cut at, what it holds, and what a press of
 * either button beside what it holds does, where it does anything.
 */
export type PanelOf = {
  readonly name: string;
  readonly frame: Box;
  readonly beside?: () => void;
} & Filled;

/** A panel standing on its screen. */
export type Panel = {
  /** How far it is scrolled. */
  readonly offset: number;
  /**
   * Whether the pointer is on it. Read from the game loop alone: a hit test inside an input handler
   * refills the list Phaser's dispatch is walking (docs/PHASER.md).
   */
  readonly pointed: boolean;
  /** One frame of a key held, this many milliseconds long, down above zero. */
  pan(way: number, delta: number): void;
  /** The wheel turned by this much, down above zero. */
  wheel(by: number): void;
  /** Stands where it is scrolled, a fling running on it stopped. */
  holdStill(): void;
  /** Whether it is among the objects an input event of its scene hands as under the pointer. */
  under(over: readonly Phaser.GameObjects.GameObject[]): boolean;
  /** Takes the panel down, and everything it answers with. */
  down(): void;
};

/**
 * A panel cut at its frame and scrolled as a browse is, from the offset handed as far as it reaches,
 * every press on it answered through its frame by the thing under the pointer, and a press held on a
 * thing that carries handed to the carrier; `follow` is told each time it moves.
 */
export function createPanel(
  scene: Phaser.Scene,
  on: Stratum,
  { name, frame, parts, held, foot, beside }: PanelOf,
  follow: () => void,
  carrier: Carrier,
  offset = 0,
): Panel {
  const root = scene.add.container(0, 0, [...parts]).setName(name);
  on.layer.add(root);
  // Off every display list, or it paints; the mask's destroy leaves it standing (docs/PHASER.md).
  const stencil = new Phaser.GameObjects.Rectangle(
    scene,
    frame.x + frame.width / 2,
    frame.y + frame.height / 2,
    frame.width,
    frame.height,
    0xffffff,
  );
  root.once(Phaser.GameObjects.Events.DESTROY, () => {
    stencil.destroy();
  });
  root.enableFilters().filters?.external.addMask(stencil, false, on.camera);

  const zone = scene.add
    .zone(frame.x + frame.width / 2, frame.y + frame.height / 2, frame.width, frame.height)
    .setName(`${name}-frame`)
    .setInteractive({ draggable: true });
  on.layer.add(zone);

  /**
   * Whether the thing under the pointer is to be read off the panel again: once it is laid, under a
   * pointer that may hold still, and each time it moves.
   */
  let moved = true;
  const scroll = createScroll((offset) => {
    root.setY(-offset);
    follow();
    moved = true;
  });
  const reach = reachOf(frame.height, foot - frame.y);
  root.setData('overflow', reach);
  scroll.reach(reach);
  scroll.stand(offset);
  answersPress(zone, (pointer) => {
    const at = on.at(pointer.x, pointer.y);
    const under = heldAt(frame, scroll.offset, held, at.x, at.y);
    return under !== undefined && (under.press !== undefined || under.answers.rests(at));
  });

  /** The thing the pointer was last read on, and nothing while it is on none. */
  let pointed: Held | undefined;
  /** Whether a card was carried at the last frame. */
  let paused = false;
  /** The thing under the pointer told it is pointed at; none while the panel is dragged or a card carried. */
  const point = (pointer: Phaser.Input.Pointer | undefined): void => {
    const at =
      pointer === undefined || scroll.dragged || carrier.carrying
        ? undefined
        : on.at(pointer.x, pointer.y);
    const under = at === undefined ? undefined : heldAt(frame, scroll.offset, held, at.x, at.y);
    if (pointed !== under) pointed?.answers.point(undefined);
    pointed = under;
    under?.answers.point(at);
  };

  zone.on('pointerdown', () => {
    scroll.press();
  });
  zone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
    const from = on.at(pointer.downX, pointer.downY);
    const under = heldAt(frame, scroll.offset, held, from.x, from.y);
    if (under?.carry === undefined || under.press === undefined) scroll.grab(from.y);
    else carrier.lift(under.carry, under.press, scroll.offset, from, on.at(pointer.x, pointer.y));
  });
  zone.on('drag', (pointer: Phaser.Input.Pointer) => {
    scroll.drag(on.at(pointer.x, pointer.y).y, scene.time.now);
  });
  zone.on('dragend', (pointer: Phaser.Input.Pointer) => {
    scroll.release(scene.time.now, !releasedOffCanvas(pointer));
  });
  zone.on('pointermove', point);
  onHover(
    zone,
    () => {
      point(scene.input.activePointer);
    },
    () => {
      point(undefined);
    },
  );
  onClick(
    zone,
    (pointer) => {
      const at = on.at(pointer.x, pointer.y);
      const under = heldAt(frame, scroll.offset, held, at.x, at.y);
      if (under === undefined) beside?.();
      else under.answers.inspect(at);
    },
    'right',
  );
  onClick(zone, (pointer) => {
    const at = on.at(pointer.x, pointer.y);
    const under = heldAt(frame, scroll.offset, held, at.x, at.y);
    if (under === undefined) beside?.();
    else under.press?.();
  });

  const step = (_time: number, delta: number): void => {
    // Here and not in the move: the wheel scrolls from inside Phaser's dispatch, where a hit test
    // refills the list being walked (docs/PHASER.md).
    if (carrier.carrying !== paused) {
      paused = carrier.carrying;
      moved = true;
    }
    if (moved) {
      moved = false;
      if (thingUnder(scene.game) === zone) point(scene.input.activePointer);
    }
    scroll.step(delta);
  };
  const stopStepping = whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, step);

  return {
    get offset() {
      return scroll.offset;
    },
    get pointed() {
      return thingUnder(scene.game) === zone;
    },
    pan(way, delta) {
      scroll.pan(way, delta);
    },
    wheel(by) {
      scroll.wheel(by);
    },
    holdStill() {
      scroll.stand(scroll.offset);
    },
    under(over) {
      return over.includes(zone);
    },
    down() {
      point(undefined);
      stopStepping();
      zone.destroy();
      root.destroy();
    },
  };
}
