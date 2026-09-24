import Phaser from 'phaser';
import { type Press, pressOf } from './bindings';
import { LOOK } from './look';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const UI_FONT = 'system-ui, "Segoe UI", sans-serif';
export const CONSOLE_FONT = 'ui-monospace, Consolas, "Courier New", monospace';

/** How far anything laid against an edge of the screen stands off it. */
export const MARGIN = 24;

/** How tall the strip along the top of the screen stands: the resource bar is drawn in it. */
export const BAR_HEIGHT = 48;

// Phaser reads a polygon's corner list in min-(0, 0) space; corners about their own centre draw
// displaced by half the shape.
export function corners(raw: number[]): number[] {
  const minX = Math.min(...raw.filter((_, i) => i % 2 === 0));
  const minY = Math.min(...raw.filter((_, i) => i % 2 === 1));
  return raw.map((value, i) => (i % 2 === 0 ? value - minX : value - minY));
}

export function hexagon(size: number): number[] {
  const raw: number[] = [];
  for (let corner = 0; corner < 6; corner++) {
    const angle = (Math.PI / 3) * corner - Math.PI / 6;
    raw.push(size * Math.cos(angle), size * Math.sin(angle));
  }
  return corners(raw);
}

const TAIL_LENGTH = 7;
const TAIL_HALF = 6;

/** The edge a bubble's tail leaves by, and how far along that edge it points. */
export type Tail = { edge: 'top' | 'bottom' | 'left' | 'right'; at: number };

/**
 * A bubble in the panel language: the box and its tail as one closed path, so the fill is
 * continuous and the stroke never crosses the seam. The tail reaches out of the edge nearer what
 * the bubble belongs to, and stays clear of both corners.
 */
export function drawBubble(
  bubble: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  tail: Tail,
): void {
  const span = tail.edge === 'top' || tail.edge === 'bottom' ? width : height;
  const at = Math.min(Math.max(tail.at, TAIL_HALF + 4), span - TAIL_HALF - 4);

  bubble.clear();
  bubble.fillStyle(LOOK.panelFill);
  bubble.lineStyle(1, LOOK.panelEdge);
  bubble.beginPath();
  bubble.moveTo(0, 0);
  if (tail.edge === 'top') {
    bubble.lineTo(at - TAIL_HALF, 0);
    bubble.lineTo(at, -TAIL_LENGTH);
    bubble.lineTo(at + TAIL_HALF, 0);
  }
  bubble.lineTo(width, 0);
  if (tail.edge === 'right') {
    bubble.lineTo(width, at - TAIL_HALF);
    bubble.lineTo(width + TAIL_LENGTH, at);
    bubble.lineTo(width, at + TAIL_HALF);
  }
  bubble.lineTo(width, height);
  if (tail.edge === 'bottom') {
    bubble.lineTo(at + TAIL_HALF, height);
    bubble.lineTo(at, height + TAIL_LENGTH);
    bubble.lineTo(at - TAIL_HALF, height);
  }
  bubble.lineTo(0, height);
  if (tail.edge === 'left') {
    bubble.lineTo(0, at + TAIL_HALF);
    bubble.lineTo(-TAIL_LENGTH, at);
    bubble.lineTo(0, at - TAIL_HALF);
  }
  bubble.closePath();
  bubble.fillPath();
  bubble.strokePath();
}

// `Phaser.Scale.FIT` in main.ts fits the canvas by this same min, which is what makes the backing
// store equal the canvas's on-screen size in device pixels.
/** How many device pixels one design pixel is drawn across. */
export function renderFactor(): number {
  return (
    window.devicePixelRatio *
    Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT)
  );
}

/** The backing store the window calls for, in device pixels. */
export function backingSize(): { width: number; height: number } {
  const factor = renderFactor();
  return { width: Math.round(DESIGN_WIDTH * factor), height: Math.round(DESIGN_HEIGHT * factor) };
}

/**
 * The backing store follows the window: Phaser's scale manager already refits the canvas on a
 * window resize, a devtools dock, a browser zoom and a fullscreen change, and this resizes the
 * backing to what the new window calls for.
 */
export function followWindow(game: Phaser.Game): void {
  game.scale.on(Phaser.Scale.Events.RESIZE, () => {
    const backing = backingSize();
    if (game.scale.width === backing.width && game.scale.height === backing.height) return;
    game.scale.resize(backing.width, backing.height);
  });
}

/**
 * Whatever the pointer is holding, let go of where it stands: Phaser reads a `mouseup` on the
 * window whose target is not the canvas as a release off the canvas, and that point leaves its hit
 * test empty, so no press held becomes a click and the browser's own release lands as nothing.
 */
export function letGoOfPress(game: Phaser.Game): void {
  if (game.input.mousePointer?.isDown !== true) return;
  // Button 0 whichever button is held: whoever answers this reads no button off the pointer.
  window.dispatchEvent(
    new MouseEvent('mouseup', { bubbles: true, button: 0, buttons: 0, clientX: -1, clientY: -1 }),
  );
}

/**
 * The release the browser withholds: a window that loses focus mid-press delivers no `mouseup`, so
 * Phaser's drag stays in flight and the next press starts nothing.
 */
export function releaseOnBlur(game: Phaser.Game): void {
  game.events.on(Phaser.Core.Events.BLUR, () => {
    letGoOfPress(game);
  });
}

/**
 * A listener for as long as the scene is up. Every emitter the scene listens on — its own, the
 * scale manager's, the game's — outlives its shutdown, so one left on any of them is called again
 * by the chronicle screen a restart raises, holding every object the chronicle screen it was made
 * on has since destroyed.
 */
export function whileUp<A extends unknown[]>(
  scene: Phaser.Scene,
  on: Phaser.Events.EventEmitter,
  event: string,
  handler: (...args: A) => void,
): void {
  on.on(event, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    on.off(event, handler);
  });
}

// Everything here reads the window and the scale manager live, never the RESIZE event's size
// arguments: the resize `followWindow` triggers emits RESIZE again, nested inside the one being
// handled, so the outer arguments describe a backing store that is already gone.
/** Lays something out now, and again after every change of window. */
export function onResize(scene: Phaser.Scene, place: () => void): void {
  place();
  whileUp(scene, scene.scale, Phaser.Scale.Events.RESIZE, place);
}

/** Every Text the scene holds, however deep in layers and containers it sits. */
function* textsIn(
  objects: readonly Phaser.GameObjects.GameObject[],
): Generator<Phaser.GameObjects.Text> {
  for (const object of objects) {
    if (object instanceof Phaser.GameObjects.Text) yield object;
    else if (object instanceof Phaser.GameObjects.Container) yield* textsIn(object.list);
    else if (object instanceof Phaser.GameObjects.Layer) yield* textsIn(object.list);
  }
}

/** How far a press travels before it is a drag and no longer a click, in design units. */
const DRAG_SLACK = 8;

/**
 * The conversions read the camera as it stands, which neither `pointer.worldX` nor `getWorldPoint`
 * does: the pointer carries whichever camera its last hit test found it over, and a camera's matrix
 * is rebuilt once a frame, so both answer for a pan or a zoom that has since happened.
 */
export type Stratum = {
  readonly layer: Phaser.GameObjects.Layer;
  readonly camera: Phaser.Cameras.Scene2D.Camera;
  /** Where a canvas point falls on this stratum. */
  at(x: number, y: number): { x: number; y: number };
  /**
   * How much of this stratum one design pixel covers: what anything standing on it scales by to
   * keep the size on screen it was laid out at. One on a surface that never zooms.
   */
  unit(): number;
};

/** One stratum and the camera it is painted by, for whoever stands something on it. */
export function stratumOf(
  layer: Phaser.GameObjects.Layer,
  camera: Phaser.Cameras.Scene2D.Camera,
): Stratum {
  // A camera turns about the middle of its viewport, which is where `centerOn` puts what it holds;
  // a viewport narrower than the canvas stands off the canvas's origin by the camera's own x and y.
  return {
    layer,
    camera,
    at(x, y) {
      const half = { x: camera.width / 2, y: camera.height / 2 };
      return {
        x: camera.scrollX + half.x + (x - camera.x - half.x) / camera.zoomX,
        y: camera.scrollY + half.y + (y - camera.y - half.y) / camera.zoomY,
      };
    },
    unit() {
      return renderFactor() / camera.zoomX;
    },
  };
}

/**
 * The scene kept to the factor it is drawn at, now and after every change of window: every Text it
 * holds re-cut for that factor, and the slack that tells a drag from a click measured at it.
 */
export function followFactor(scene: Phaser.Scene): void {
  onResize(scene, () => {
    // Phaser measures the drag threshold between raw pointer positions, in device pixels.
    scene.input.dragDistanceThreshold = DRAG_SLACK * renderFactor();
    const resolution = Math.ceil(renderFactor());
    for (const label of textsIn(scene.children.list)) {
      if (label.style.resolution !== resolution) label.setResolution(resolution);
    }
  });
}

/**
 * A camera that holds the whole of DESIGN_WIDTH × DESIGN_HEIGHT across the canvas, now and after
 * every change of window, and the scene it paints kept to its factor. A camera left unzoomed paints
 * the backing store at 1:1.
 */
export function holdDesignSpace(scene: Phaser.Scene, camera: Phaser.Cameras.Scene2D.Camera): void {
  onResize(scene, () => {
    // The cameras' own size is Phaser's business: the camera manager subscribed to RESIZE at scene
    // boot, ahead of this, and resizes every camera at the origin that had the old size.
    camera.setZoom(renderFactor()).centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
  });
  followFactor(scene);
}

/** Which moves landing on an interactive object of a scene it keeps from the scenes beneath. */
type Moves = 'every' | 'no button held';

/**
 * Every press and wheel on an interactive object of this scene kept from the scenes beneath, a
 * move as `moves` answers at that move, never a release: stopped, it would strand a drag beneath.
 * One listener per event, not per object: `topOnly` skips a stop on an object lying under another.
 */
export function stopsThePointer(scene: Phaser.Scene, moves: () => Moves): void {
  const stop = (): void => {
    scene.input.stopPropagation();
  };
  scene.input.on('gameobjectdown', stop);
  scene.input.on('gameobjectwheel', stop);
  scene.input.on('gameobjectmove', (pointer: Phaser.Input.Pointer) => {
    switch (moves()) {
      case 'every':
        stop();
        return;
      case 'no button held':
        if (pointer.buttons === 0) stop();
        return;
    }
  });
}

// A pointer records `downX` / `downY` for its primary button alone, so where a press landed is the
// taker's to remember: a right press would measure from wherever the last left press landed.
/** Whether the press a pointer is holding has travelled far enough to be a drag and not a click. */
export function dragged(
  scene: Phaser.Scene,
  from: { x: number; y: number },
  pointer: Phaser.Input.Pointer,
): boolean {
  const travel = Phaser.Math.Distance.Between(from.x, from.y, pointer.x, pointer.y);
  return travel >= scene.input.dragDistanceThreshold;
}

// A release off the canvas is known by the element it landed on, never by a coordinate: the pointer
// only reads a camera while it is over one, so `worldX` / `worldY` are left where it went out.
export function releasedOffCanvas(pointer: Phaser.Input.Pointer): boolean {
  return pointer.upElement !== pointer.manager.game.canvas;
}

/**
 * A click: one press landed and released on the same object, however far the pointer travelled
 * between the two; a drag of the object begun by that press is not one. It answers the one press it
 * is given, so an object that answers both takes one of these for each. Phaser delivers `pointerup`
 * to whatever lies under the pointer however far it travelled since the press, so a bare `pointerup`
 * also fires on a card dragged onto the object from elsewhere, on the object a drag of its own just
 * ended over, and on the release half of a click whose press dismissed something above it.
 */
export function onClick(
  target: Phaser.GameObjects.GameObject,
  handler: (pointer: Phaser.Input.Pointer) => void,
  press: Press = 'left',
): void {
  const input = target.scene.input;
  let pressed = false;
  const drop = (): void => {
    pressed = false;
  };

  target.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pressOf(pointer) === press) pressed = true;
  });
  target.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (pressed && pressOf(pointer) === press) handler(pointer);
  });
  target.on('dragstart', drop);
  // The scene sees a release the target never does — it was hidden, disabled or removed meanwhile —
  // and after the target when it sees both. On the canvas this press's own button lets it go, so it
  // stands through a second button's click; off the canvas any button abandons it.
  const released = (pointer: Phaser.Input.Pointer): void => {
    if (pressOf(pointer) === press) drop();
  };
  input.on('pointerup', released);
  input.on('pointerupoutside', drop);
  // The scene outlives the target, so these two go when the target does.
  target.once('destroy', () => {
    input.off('pointerup', released);
    input.off('pointerupoutside', drop);
  });
}

/** A scrim risen over a scene, said of its input plugin; nothing inside Phaser listens to it. */
export const COVERED = 'covered';

type Hovering = { hovered: boolean; readonly enter: () => void; readonly leave: () => void };

const hovers = new Map<Phaser.GameObjects.GameObject, Hovering[]>();
const answering = new WeakSet<Phaser.GameObjects.GameObject>();

/** The object marked as answering a press: the pointer on it is the hand. */
export function answersPress<T extends Phaser.GameObjects.GameObject>(object: T): T {
  answering.add(object);
  return object;
}

export type Hover = {
  /** Whether the pointer is on the object. */
  readonly hovered: boolean;
};

/**
 * A hover: entered when the pointer comes to be on the object, left when it stops being, read each
 * frame by `followPointer`, which the boot hooks once.
 */
export function onHover(
  target: Phaser.GameObjects.GameObject,
  enter: () => void,
  leave: () => void,
): Hover {
  const hovering: Hovering = { hovered: false, enter, leave };
  hovers.set(target, [...(hovers.get(target) ?? []), hovering]);
  target.once('destroy', () => {
    hovers.delete(target);
  });
  return {
    get hovered() {
      return hovering.hovered;
    },
  };
}

// Read from the game loop, never from an input handler: a hit test refills the array Phaser's
// dispatch is walking (docs/PHASER.md).
/** The topmost interactive object under the pointer across the running scenes, if any. */
export function thingUnder(game: Phaser.Game): Phaser.GameObjects.GameObject | undefined {
  const pointer = game.input.activePointer;
  // Until its first move the pointer stands at 0,0 with `isOver` already true (docs/PHASER.md).
  if (!game.input.isOver || pointer.moveTime === 0) return undefined;
  for (const scene of game.scene.getScenes(true, true)) {
    const hits = scene.input.hitTestPointer(pointer);
    if (hits.length > 0) return scene.input.sortGameObjects(hits, pointer)[0];
  }
  return undefined;
}

/** Every frame, every hover entered or left and the canvas's cursor set by what the pointer is on. */
export function followPointer(game: Phaser.Game): void {
  let on: Phaser.GameObjects.GameObject | undefined;
  let pointed = false;
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    const under = thingUnder(game);
    if (under !== on) {
      const left = on === undefined ? [] : (hovers.get(on) ?? []);
      on = under;
      for (const hovering of left) {
        if (!hovering.hovered) continue;
        hovering.hovered = false;
        hovering.leave();
      }
      for (const hovering of under === undefined ? [] : (hovers.get(under) ?? [])) {
        hovering.hovered = true;
        hovering.enter();
      }
    }
    const pointing = under !== undefined && answering.has(under);
    if (pointing === pointed) return;
    pointed = pointing;
    game.canvas.style.cursor = pointing ? 'pointer' : '';
  });
}

// Phaser sizes a Text's backing canvas from a box it measures at 1× — sideways from the advance
// width rather than the ink box — but rasterises the glyphs at `resolution`, and a hinted outline
// is not proportional, so ink falls outside the canvas on every side, further sideways than
// vertically. The padding holds that overflow; being symmetric per axis, a centred text does not
// move.
/** How far outside its own box a text is padded: what a caller measuring one takes back out. */
export const TEXT_INSET = { x: 2, y: 1 };

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  // A fractional resolution would truncate the backing canvas to whole pixels, hence the ceiling.
  return scene.add.text(x, y, content, {
    ...style,
    resolution: Math.ceil(renderFactor()),
    padding: TEXT_INSET,
  });
}
