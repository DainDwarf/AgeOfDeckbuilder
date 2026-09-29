import Phaser from 'phaser';
import { consoleCovers } from './debug-console';
import {
  onClick,
  onHover,
  releasedOffCanvas,
  type Stratum,
  thingUnder,
  whileUp,
} from './design-space';
import { type Box, createScroll, heldAt, reachOf } from './scroll';
import type { Answers } from './stack';

/** A thing a panel holds that answers the pointer: its box as it stands unscrolled, and its answers. */
export type Held = { readonly box: Box; readonly answers: Answers };

/**
 * What a panel is made of: its name, the frame it is cut at, its first line standing at the frame's
 * top; what it draws, the things in it that answer, and where its last line ends.
 */
export type PanelOf = {
  readonly name: string;
  readonly frame: Box;
  readonly parts: readonly Phaser.GameObjects.GameObject[];
  readonly held: readonly Held[];
  readonly foot: number;
};

/**
 * A panel cut at its frame and scrolled as a browse is, every press on it answered through its frame
 * by the thing standing under the pointer; `follow` is told each time it moves.
 */
export function createPanel(
  scene: Phaser.Scene,
  on: Stratum,
  { name, frame, parts, held, foot }: PanelOf,
  follow: () => void,
): void {
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

  /** Whether the panel has moved since the thing under the pointer was read off it. */
  let moved = false;
  const scroll = createScroll((offset) => {
    root.setY(-offset);
    follow();
    moved = true;
  });
  scroll.reach(reachOf(frame.height, foot - frame.y));

  /** The thing the pointer was last read on, and nothing while it is on none. */
  let pointed: Held | undefined;
  /** The thing under the pointer told it is pointed at; none while the panel is dragged. */
  const point = (pointer: Phaser.Input.Pointer | undefined): void => {
    const at = pointer === undefined || scroll.dragged ? undefined : on.at(pointer.x, pointer.y);
    const under = at === undefined ? undefined : heldAt(frame, scroll.offset, held, at.x, at.y);
    if (pointed !== under) pointed?.answers.point(undefined);
    pointed = under;
    under?.answers.point(at);
  };

  zone.on('pointerdown', () => {
    scroll.press();
  });
  zone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
    scroll.grab(on.at(pointer.downX, pointer.downY).y);
  });
  zone.on('drag', (pointer: Phaser.Input.Pointer) => {
    scroll.drag(on.at(pointer.x, pointer.y).y, scene.time.now);
  });
  zone.on('dragend', (pointer: Phaser.Input.Pointer) => {
    scroll.release(scene.time.now, !releasedOffCanvas(pointer));
  });
  zone.on('wheel', (pointer: Phaser.Input.Pointer, _dx: number, dy: number) => {
    if (!consoleCovers(scene, on.at(pointer.x, pointer.y))) scroll.wheel(dy);
  });
  zone.on('pointermove', point);
  onHover(
    zone,
    () => {},
    () => {
      point(undefined);
    },
  );
  onClick(
    zone,
    (pointer) => {
      const at = on.at(pointer.x, pointer.y);
      heldAt(frame, scroll.offset, held, at.x, at.y)?.answers.inspect(at);
    },
    'right',
  );

  whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
    // Here and not in the move: the wheel scrolls from inside Phaser's dispatch, where a hit test
    // refills the list being walked (docs/PHASER.md).
    if (moved) {
      moved = false;
      if (thingUnder(scene.game) === zone) point(scene.input.activePointer);
    }
    scroll.step(delta);
  });
}
