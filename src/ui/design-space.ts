import Phaser from 'phaser';
import { type Press, pressOf } from './bindings';
import { LOOK } from './look';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const UI_FONT = 'system-ui, "Segoe UI", sans-serif';

/** How far anything laid against an edge of the screen stands off it. */
export const MARGIN = 24;

/**
 * The two depths the scrim divides the chronicle screen at: everything the chronicle screen lays
 * out is below the scrim, and the Menu button stands over it, so it is pressable while a window or
 * the ending screen covers the chronicle screen. The resource bar rises to that depth too for as
 * long as a deal waits to be taken, and answers no press while it stands there. What the scrim
 * carries stands between the two depths.
 */
export const SCRIM_DEPTH = 100;
export const OVER_SCRIM_DEPTH = 110;

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
 * The release the browser withholds: a window that loses focus mid-press delivers no `mouseup`, so
 * Phaser's drag stays in flight and the next press starts nothing. Phaser reads a `mouseup` on the
 * window whose target is not the canvas as a release off the canvas, and the point off the canvas
 * leaves its hit test empty, so no press held at the blur becomes a click.
 */
export function releaseOnBlur(game: Phaser.Game): void {
  game.events.on(Phaser.Core.Events.BLUR, () => {
    if (game.input.mousePointer?.isDown !== true) return;
    window.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, button: 0, buttons: 0, clientX: -1, clientY: -1 }),
    );
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
 * One of the two surfaces the game is drawn on: everything standing on it, and the camera that
 * paints that and nothing else. The two conversions read the camera as it stands, which neither
 * `pointer.worldX` nor the camera's own `getWorldPoint` does — the pointer carries whichever camera
 * its last hit test found it over, and a camera's matrix is rebuilt once a frame, so both of those
 * answer for a pan or a zoom that has since happened.
 */
export type Surface = {
  readonly layer: Phaser.GameObjects.Layer;
  readonly camera: Phaser.Cameras.Scene2D.Camera;
  /** Where a canvas point falls on this surface. */
  at(x: number, y: number): { x: number; y: number };
  /**
   * How much of this surface one design pixel covers: what anything standing on it scales by to
   * keep the size on screen it was laid out at. One on a surface that never zooms.
   */
  unit(): number;
};

/** The map moves under the UI; the UI does not move at all. */
export type Surfaces = { readonly map: Surface; readonly ui: Surface };

function surfaceOf(
  layer: Phaser.GameObjects.Layer,
  camera: Phaser.Cameras.Scene2D.Camera,
): Surface {
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
 * The chronicle screen, cut in two: each camera is blind to the other's layer, so one of them can
 * be panned and zoomed while the other holds still. Nothing may be left standing on the scene's own
 * display list, which carries no camera filter and so is painted by both cameras at once — hence
 * the UI takes every object the game makes, and whatever belongs on the map moves itself there.
 * Each layer and the camera that paints it share a name.
 *
 * A scene's `scale.width` / `scale.height` report the backing store in device pixels, and a
 * pointer's `x` / `y` arrive in that same space; lay out against DESIGN_WIDTH and DESIGN_HEIGHT,
 * and read a surface's `at` for the pointer in either surface's own space.
 */
export function applyDesignSpace(scene: Phaser.Scene): Surfaces {
  const map = surfaceOf(scene.add.layer().setName('map'), scene.cameras.main.setName('map'));
  // Added after the map's, so it paints over it and the hit test reaches it first.
  const ui = surfaceOf(scene.add.layer().setName('ui'), scene.cameras.add().setName('ui'));
  map.camera.ignore(ui.layer);
  ui.camera.ignore(map.layer);

  // A layer re-announces what it is handed on this same emitter, so the guard is what ends this:
  // the object arrives a second time already homed, and falls through.
  whileUp(
    scene,
    scene.events,
    Phaser.Scenes.Events.ADDED_TO_SCENE,
    (object: Phaser.GameObjects.GameObject) => {
      if (object instanceof Phaser.GameObjects.Layer) return;
      if (object.displayList !== scene.sys.displayList) return;
      ui.layer.add(object);
    },
  );

  onResize(scene, () => {
    const factor = renderFactor();
    // The cameras' own size is Phaser's business: the camera manager subscribed to RESIZE at scene
    // boot, ahead of this, and resizes every camera at the origin that had the old size.
    ui.camera.setZoom(factor).centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    // Phaser measures the drag threshold between raw pointer positions, in device pixels.
    scene.input.dragDistanceThreshold = DRAG_SLACK * factor;
    const resolution = Math.ceil(factor);
    for (const label of textsIn(scene.children.list)) {
      if (label.style.resolution !== resolution) label.setResolution(resolution);
    }
  });

  return { map, ui };
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

/** A view of one design-space rectangle: what a scrolling object has outside it is not drawn. */
export type Clip = {
  /** Draws `only`, and nothing else the scene holds, inside the rectangle in design units. */
  show(
    only: Phaser.GameObjects.GameObject,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void;
  hide(): void;
  /** Keeps an object the scene gained after `show` out of the rectangle. */
  exclude(object: Phaser.GameObjects.GameObject): void;
};

/**
 * Everything the scene draws, walked into its layers. The layers themselves are never yielded: a
 * camera told to ignore a layer is blind to every object standing on it.
 */
function* objectsIn(
  objects: readonly Phaser.GameObjects.GameObject[],
): Generator<Phaser.GameObjects.GameObject> {
  for (const object of objects) {
    if (object instanceof Phaser.GameObjects.Layer) yield* objectsIn(object.list);
    else yield object;
  }
}

/**
 * A clip is a camera of its own, its viewport the rectangle: Phaser 4's geometry mask clips under
 * the canvas renderer alone, and this game renders through WebGL. Every camera draws the whole
 * scene, so `show` hands this one everything the scene holds but the object it is for — which is
 * also why the camera is kept and re-pointed: a camera's ignore is never lifted, and an object the
 * scene gains while the clip stands open would draw inside the rectangle.
 */
export function createClip(scene: Phaser.Scene, on: Surface): Clip {
  const camera = scene.cameras.add(0, 0, 1, 1).setVisible(false);
  /** The rectangle in design units while it is shown, and nothing while it is not. */
  let frame: { x: number; y: number; width: number; height: number } | undefined;

  const place = (): void => {
    const factor = renderFactor();
    camera.setZoom(factor);
    if (frame === undefined) return;
    const { x, y, width, height } = frame;
    camera
      .setViewport(x * factor, y * factor, width * factor, height * factor)
      .centerOn(x + width / 2, y + height / 2);
  };
  onResize(scene, place);

  return {
    show(only, x, y, width, height): void {
      frame = { x, y, width, height };
      place();
      camera.setVisible(true);
      camera.ignore([...objectsIn(scene.children.list)].filter((child) => child !== only));
      on.camera.ignore(only);
    },
    hide(): void {
      frame = undefined;
      camera.setVisible(false);
    },
    exclude(object): void {
      camera.ignore(object);
    },
  };
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
  // The scene sees every release, on the canvas and off it, and after the target does. A press the
  // target never sees released — it was hidden, disabled or removed meanwhile — would otherwise
  // stay held. The scene outlives the target, so those two go when the target does.
  input.on('pointerup', drop);
  input.on('pointerupoutside', drop);
  target.once('destroy', () => {
    input.off('pointerup', drop);
    input.off('pointerupoutside', drop);
  });
}

export type Hover = {
  /** Whether the pointer is over the object, as far as the hover knows. */
  readonly hovered: boolean;
  /**
   * The owner ends the hover it knows is over: Phaser sends no `pointerout` for a disable, and
   * leaves the object's cursor standing.
   */
  end(): void;
  /**
   * The owner resumes the hover once it has made the object live: Phaser sends no `pointerover` to
   * an object that comes live under a resting pointer.
   */
  resume(): void;
};

/**
 * A hover: entered when the pointer comes over the object, left when it goes. Phaser sends no
 * `pointerout` to an object the pointer leaves the canvas over: that leave reaches the scene's input
 * plugin alone, as `gameout`. And it sends `pointerover` only when an object joins the input
 * plugin's private per-pointer over list, which keeps the object through a disable, a re-enable and
 * a `gameout` alike.
 */
export function onHover(
  target: Phaser.GameObjects.GameObject,
  enter: () => void,
  leave: () => void,
): Hover {
  const input = target.scene.input;
  let hovered = false;
  let returning = false;
  const off = (): void => {
    if (!hovered) return;
    hovered = false;
    leave();
  };

  const resume = (): void => {
    if (hovered || returning || !input.isOver || target.input?.enabled !== true) return;
    const pointer = input.activePointer;
    if (input.sortGameObjects(input.hitTestPointer(pointer), pointer)[0] !== target) return;
    // Phaser's list has to hold the target too, or it would send no `pointerout` when the pointer
    // goes, and a `pointerover` again at the next move on it.
    const over = (input as unknown as { _over: Record<number, Phaser.GameObjects.GameObject[]> })
      ._over[pointer.id];
    if (over !== undefined && !over.includes(target)) over.push(target);
    input.setCursor(target.input);
    hovered = true;
    enter();
  };
  const end = (): void => {
    if (hovered && target.input?.cursor) input.resetCursor();
    off();
  };
  // The pointer keeps the coordinates it left the canvas at, so only a move on the canvas says
  // where it came back; the browser sends the canvas's `mouseover` ahead of that move.
  const back = (): void => {
    returning = true;
  };
  const moved = (): void => {
    if (!returning) return;
    returning = false;
    resume();
  };

  target.on('pointerover', () => {
    hovered = true;
    enter();
  });
  target.on('pointerout', off);
  // The scene outlives the target, so these go when the target does.
  input.on('gameout', off);
  input.on('gameover', back);
  input.on('pointermove', moved);
  target.once('destroy', () => {
    input.off('gameout', off);
    input.off('gameover', back);
    input.off('pointermove', moved);
  });

  return {
    get hovered() {
      return hovered;
    },
    end,
    resume,
  };
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
