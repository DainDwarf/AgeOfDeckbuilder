import Phaser from 'phaser';
import { PRESSES, type Press, pressOf } from './bindings';
import { interfaceSize, pixelsAt } from './interface-size';
import { css, LOOK } from './look';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;
export const TYPE_FLOOR = 11;

/** A box of the design space: its top-left corner and its size. */
export type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

// Bare for the FontFace constructor, which keeps quotes as part of the name; quoted for a font string,
// which takes no bare name holding a digit.
export const UI_FAMILY = 'Source Sans 3';
export const UI_FONT = `"${UI_FAMILY}", sans-serif`;
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

/**
 * How the screen standing is laid out: on a design space of the window's shape, the chronicle
 * screen's, or as the one 1280 by 720 design of a meta screen.
 */
export type Shape = 'window' | 'design';

let shape: Shape = 'design';

/**
 * The screen about to open laid out on its shape, and everything standing laid out again for it: the
 * menu and the console take the shape of the screen under them.
 */
export function shapeScreen(game: Phaser.Game, next: Shape): void {
  if (next === shape) return;
  shape = next;
  game.scale.refresh();
}

/**
 * How many CSS pixels a unit is drawn across: the largest size that holds 1280 by 720 units, capped
 * by the interface size on a screen of the window's shape.
 */
function unitPixels(): number {
  const fit = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
  switch (shape) {
    case 'window':
      return Math.min(pixelsAt(interfaceSize()), fit);
    case 'design':
      return fit;
  }
}

/** How many device pixels one design pixel is drawn across. */
export function renderFactor(): number {
  return window.devicePixelRatio * unitPixels();
}

// `Phaser.Scale.FIT` in main.ts fits the canvas to the window by the backing store's shape, which
// this keeps the window's own.
/** The backing store the window calls for, in device pixels: the whole window. */
export function backingSize(): { width: number; height: number } {
  return {
    width: Math.round(window.innerWidth * window.devicePixelRatio),
    height: Math.round(window.innerHeight * window.devicePixelRatio),
  };
}

/**
 * The design space the screen standing is laid out on, in units from its top left corner: the
 * window's shape, or 1280 by 720.
 */
export function screenSize(): { width: number; height: number } {
  switch (shape) {
    case 'window': {
      const backing = backingSize();
      const factor = renderFactor();
      return { width: backing.width / factor, height: backing.height / factor };
    }
    case 'design':
      return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
  }
}

/**
 * How far the middle of the design space stands from the middle of 1280 by 720: what a group laid
 * out about the one is moved by to stand about the other.
 */
export function offMiddle(): { x: number; y: number } {
  const { width, height } = screenSize();
  return { x: (width - DESIGN_WIDTH) / 2, y: (height - DESIGN_HEIGHT) / 2 };
}

/** Where the design space stands on the backing store, in whole device pixels: centred on it. */
export function screenOnCanvas(game: Phaser.Game): Box {
  const factor = renderFactor();
  const size = screenSize();
  const width = Math.round(size.width * factor);
  const height = Math.round(size.height * factor);
  return {
    x: Math.round((game.scale.width - width) / 2),
    y: Math.round((game.scale.height - height) / 2),
    width,
    height,
  };
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
    // Not `resize`: under `FIT` it keeps the shape the canvas had (docs/PHASER.md).
    game.scale.setGameSize(backing.width, backing.height);
  });
}

// The query changes once, on leaving the ratio it was made on, so a hop makes it again on the new
// one or the next goes unheard (docs/PHASER.md).
/** A hop to a monitor of another pixel density followed as a resize: it fires none of its own. */
export function followPixelRatio(game: Phaser.Game): void {
  const listen = (): void => {
    const ratio = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    ratio.addEventListener(
      'change',
      () => {
        game.scale.refresh();
        listen();
      },
      { once: true },
    );
  };
  listen();
}

/**
 * Whatever the pointer is holding, let go of where it stands: Phaser reads a `mouseup` on the
 * window whose target is not the canvas as a release off the canvas, and that point leaves its hit
 * test empty, so no press held becomes a click and the browser's own release lands as nothing.
 */
export function letGoOfPress(game: Phaser.Game): void {
  if (game.input.mousePointer?.isDown !== true) return;
  // No button left holding is what lets go of every press, whichever button held it.
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
 * A listener until the scene shuts down, or until what it hands back is called. The scene's own
 * events, the game's and the scale manager's outlive its shutdown, so one left on them is called
 * again by the screen a restart raises; the scene's input drops its listeners at shutdown itself.
 */
export function whileUp<A extends unknown[]>(
  scene: Phaser.Scene,
  on: Phaser.Events.EventEmitter,
  event: string,
  handler: (...args: A) => void,
): () => void {
  on.on(event, handler);
  const off = (): void => {
    on.off(event, handler);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  return () => {
    off();
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, off);
  };
}

// Everything here reads the window and the scale manager live, never the RESIZE event's size
// arguments: the resize `followWindow` triggers emits RESIZE again, nested inside the one being
// handled, so the outer arguments describe a backing store that is already gone.
/** Lays something out now, and again after every change of window. */
export function onResize(scene: Phaser.Scene, place: () => void): void {
  place();
  whileUp(scene, scene.scale, Phaser.Scale.Events.RESIZE, place);
}

/**
 * Lays something out at the first draw after every change of window, once whatever it stands by has
 * been laid out again.
 */
export function afterResize(scene: Phaser.Scene, place: () => void): void {
  let resized = false;
  whileUp(scene, scene.scale, Phaser.Scale.Events.RESIZE, () => {
    resized = true;
  });
  whileUp(scene, scene.events, Phaser.Scenes.Events.PRE_RENDER, () => {
    if (!resized) return;
    resized = false;
    place();
  });
}

/** Lays an object out now, and again after every change of window for as long as it stands. */
export function placedWhileUp<T extends Phaser.GameObjects.GameObject>(
  object: T,
  place: () => void,
): T {
  const { scene } = object;
  place();
  const off = whileUp(scene, scene.scale, Phaser.Scale.Events.RESIZE, place);
  object.once(Phaser.GameObjects.Events.DESTROY, off);
  return object;
}

// A filter camera takes the scroll and the zoom of the camera drawing its object and not its place
// (`Filters.js:536-554`), and lays its sheet down at its own (`renderNodes/Camera.js:143-150`):
// copied ahead of every draw (`Systems.js:380-382`), wherever the camera was cut.
/** The object's filters laid down where the camera drawing it is cut, for as long as it stands. */
export function filtersFollow(
  object: Phaser.GameObjects.Layer | Phaser.GameObjects.Container,
  camera: Phaser.Cameras.Scene2D.Camera,
): void {
  const { scene } = object;
  const off = whileUp(scene, scene.events, Phaser.Scenes.Events.PRE_RENDER, () => {
    object.filterCamera.setPosition(camera.x, camera.y);
  });
  object.once(Phaser.GameObjects.Events.DESTROY, off);
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

/** The resolution a Text drawn `scale` times its own size is cut at, at the factor the scene is drawn at. */
export function resolutionAt(scale: number): number {
  // A fractional resolution would truncate the backing canvas to whole pixels, hence the ceiling.
  return Math.ceil(renderFactor() * scale);
}

/**
 * Every Text among the objects, however deep in layers and containers, cut at that resolution,
 * written where it moved: `setResolution` re-rasterises at every call.
 */
export function cutTexts(
  objects: readonly Phaser.GameObjects.GameObject[],
  resolution: number,
): void {
  for (const label of textsIn(objects)) {
    if (label.style.resolution !== resolution) label.setResolution(resolution);
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
  /** Where a point of this stratum falls on the canvas: `at` turned back. */
  onCanvas(x: number, y: number): { x: number; y: number };
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
    onCanvas(x, y) {
      const half = { x: camera.width / 2, y: camera.height / 2 };
      return {
        x: camera.x + half.x + (x - camera.scrollX - half.x) * camera.zoomX,
        y: camera.y + half.y + (y - camera.scrollY - half.y) * camera.zoomY,
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
    cutTexts(scene.children.list, resolutionAt(1));
  });
}

/**
 * A camera cut to where the design space stands on the canvas and holding the whole of it, its top
 * left corner the design space's, now and after every change of window, and the scene it paints
 * kept to its factor. A camera left unzoomed paints the backing store at 1:1.
 */
export function holdDesignSpace(scene: Phaser.Scene, camera: Phaser.Cameras.Scene2D.Camera): void {
  onResize(scene, () => {
    // Phaser's camera manager resizes only the cameras that filled the old canvas
    // (`CameraManager.js:694-697`): a camera cut to a box is cut again here.
    const { x, y, width, height } = screenOnCanvas(scene.game);
    const size = screenSize();
    camera
      .setViewport(x, y, width, height)
      .setZoom(renderFactor())
      .centerOn(size.width / 2, size.height / 2);
  });
  followFactor(scene);
}

/** Which moves landing on an interactive object of a scene it keeps from the scenes beneath. */
type PointerMoves = 'every' | 'no button held';

/**
 * Every press on an interactive object here kept from the scenes beneath, a wheel and a move as
 * `wheels` and `moves` answer, never a release: that would strand a drag beneath. One listener per
 * event, not per object: `topOnly` skips a stop on an object lying under another.
 */
export function stopsThePointer(
  scene: Phaser.Scene,
  moves: () => PointerMoves,
  wheels: () => boolean,
): void {
  const stop = (): void => {
    scene.input.stopPropagation();
  };
  scene.input.on('gameobjectdown', stop);
  scene.input.on('gameobjectwheel', () => {
    if (wheels()) stop();
  });
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

/**
 * How far a click's press may travel: anywhere, or less than the drag slack from where it landed. A
 * press landed while the other button holds is that button's second click, and goes anywhere.
 */
export type Travel = 'anywhere' | 'within slack';

/** The bit each press's button sets in a pointer's `buttons`. */
const HOLDS: Readonly<Record<Press, number>> = { left: 1, right: 2 };

/**
 * Every press a release off the canvas lets go, handed once each: the press of every button the
 * pointer no longer holds, a scrim's and a lost focus's let-go included, until what it hands back is
 * called.
 */
export function onLetGoOffCanvas(scene: Phaser.Scene, letGo: (press: Press) => void): () => void {
  const heard = (pointer: Phaser.Input.Pointer): void => {
    for (const press of PRESSES.values()) if ((pointer.buttons & HOLDS[press]) === 0) letGo(press);
  };
  scene.input.on('pointerupoutside', heard);
  return () => {
    scene.input.off('pointerupoutside', heard);
  };
}

/**
 * A click: one press landed and released on the same object, not a drag of the object it began. A
 * bare `pointerup` is no click: Phaser hands it to whatever the pointer is on (docs/PHASER.md).
 */
export function onClick(
  target: Phaser.GameObjects.GameObject,
  handler: (pointer: Phaser.Input.Pointer) => void,
  press: Press = 'left',
  travel: Travel = 'anywhere',
): void {
  const scene = target.scene;
  const input = scene.input;
  let pressed = false;
  /** Where the press landed while its travel counts, and whether it has gone past the slack. */
  let from: { x: number; y: number } | undefined;
  let strayed = false;
  const drop = (): void => {
    pressed = false;
  };

  target.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pressOf(pointer) !== press) return;
    pressed = true;
    strayed = false;
    const alone = (pointer.buttons & (HOLDS.left | HOLDS.right)) === HOLDS[press];
    from = travel === 'within slack' && alone ? { x: pointer.x, y: pointer.y } : undefined;
  });
  target.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (!pressed || pressOf(pointer) !== press) return;
    if (from !== undefined && (strayed || dragged(scene, from, pointer))) return;
    handler(pointer);
  });
  const moved = (pointer: Phaser.Input.Pointer): void => {
    if (pressed && from !== undefined && dragged(scene, from, pointer)) strayed = true;
  };
  if (travel === 'within slack') input.on('pointermove', moved);
  target.on('dragstart', drop);
  // The scene sees a release the target never does — it was hidden, disabled or removed meanwhile —
  // and after the target when it sees both.
  const released = (pointer: Phaser.Input.Pointer): void => {
    if (pressOf(pointer) === press) drop();
  };
  input.on('pointerup', released);
  const unheard = onLetGoOffCanvas(scene, (gone) => {
    if (gone === press) drop();
  });
  // The scene outlives the target, so these go when the target does.
  target.once('destroy', () => {
    input.off('pointermove', moved);
    input.off('pointerup', released);
    unheard();
  });
}

/**
 * A scrim over the whole design space, down until it is shown; a click of either button on it takes
 * the step back its owner hands. It goes up and down by its visibility alone: a hidden object is no
 * hit (docs/PHASER.md).
 */
export function createScrim(scene: Phaser.Scene, back: () => void): Phaser.GameObjects.Rectangle {
  const scrim = scene.add
    .rectangle(0, 0, 1, 1, LOOK.scrim.colour, LOOK.scrim.strength)
    .setOrigin(0, 0)
    .setVisible(false)
    .setInteractive();
  placedWhileUp(scrim, () => {
    const { width, height } = screenSize();
    scrim.setSize(width, height);
  });
  onClick(scrim, back);
  onClick(scrim, back, 'right');
  return scrim;
}

/** A scrim risen over a scene, said of its input plugin; nothing inside Phaser listens to it. */
export const COVERED = 'covered';

/** The two scenes whose scrims rise over a screen: the overlay's, and the menu's. */
export type Scrim = 'overlay' | 'menu';

/**
 * What a screen is told as either scrim rises over it or falls, answering whether either still
 * stands: the first to rise says `COVERED` of its input plugin and lets go of the press it holds.
 */
export function awayUnder(scene: Phaser.Scene): (scrim: Scrim, up: boolean) => boolean {
  const standing = new Set<Scrim>();
  return (scrim, up) => {
    const away = standing.size > 0;
    if (up) standing.add(scrim);
    else standing.delete(scrim);
    if (away || standing.size === 0) return standing.size > 0;
    scene.input.emit(COVERED);
    // After the pointer event that raised the scrim: Phaser's dispatch is synchronous, and a release
    // inside it walks the plugin's lists mid-walk.
    queueMicrotask(() => letGoOfPress(scene.game));
    return true;
  };
}

type Hovering = { hovered: boolean; readonly enter: () => void; readonly leave: () => void };

const hovers = new Map<Phaser.GameObjects.GameObject, Hovering[]>();
const reacting = new WeakMap<
  Phaser.GameObjects.GameObject,
  (pointer: Phaser.Input.Pointer) => boolean
>();

/**
 * The object marked as reacting to a press where `where` says it does, everywhere on it unless
 * told: the pointer there is the hand, read each frame.
 */
export function reactsToPress<T extends Phaser.GameObjects.GameObject>(
  object: T,
  where: (pointer: Phaser.Input.Pointer) => boolean = () => true,
): T {
  reacting.set(object, where);
  return object;
}

/** An object a hit test reads in its own space: placed in the world, about its display origin. */
type HitTested = Phaser.GameObjects.Components.Transform & {
  readonly displayOriginX: number;
  readonly displayOriginY: number;
};

/** The point a hit test hands the object's hit area callback, at its place in the world. */
export function hitPointInWorld(object: HitTested, x: number, y: number): { x: number; y: number } {
  return object
    .getWorldTransformMatrix()
    .transformPoint(x - object.displayOriginX, y - object.displayOriginY);
}

/**
 * The zone made interactive where `liesUnder` says what it stands over lies under the pointer, asked
 * at the pointer's point of the world.
 */
export function pressedWhere(
  zone: Phaser.GameObjects.Zone,
  liesUnder: (x: number, y: number) => boolean,
): Phaser.GameObjects.Zone {
  return zone.setInteractive({
    hitArea: {},
    hitAreaCallback: (_area: object, x: number, y: number) => {
      const at = hitPointInWorld(zone, x, y);
      return liesUnder(at.x, at.y);
    },
  });
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

// Never read inside Phaser's input dispatch: a hit test refills the array it is walking
// (docs/PHASER.md).
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
    const where = under === undefined ? undefined : reacting.get(under);
    const pointing = where?.(game.input.activePointer) === true;
    if (pointing === pointed) return;
    pointed = pointing;
    game.canvas.style.cursor = pointing ? 'pointer' : '';
  });
}

// Phaser sizes a Text's canvas at 1×, sideways by the advance width, but rasterises hinted glyphs
// at `resolution`, so ink overflows it on every side, most sideways. The padding holds it, symmetric
// so a centred text does not move; a Text's `width` and `height` carry it, `ownBoxOf` does not.
/** How far outside its own box a text is padded. */
const TEXT_INSET = { x: 2, y: 1 };

/** A text's own box, its padding taken out, in its parent's space, its scale and angle unread. */
export function ownBoxOf(label: Phaser.GameObjects.Text): Box {
  return {
    x: label.x - label.originX * label.width + TEXT_INSET.x,
    y: label.y - label.originY * label.height + TEXT_INSET.y,
    width: label.width - 2 * TEXT_INSET.x,
    height: label.height - 2 * TEXT_INSET.y,
  };
}

export type SizedStyle = Phaser.Types.GameObjects.Text.TextStyle & { readonly fontSize: string };

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: SizedStyle,
): Phaser.GameObjects.Text {
  if (Number.parseFloat(style.fontSize) < TYPE_FLOOR) {
    throw new Error(`no text is set at ${style.fontSize}, under the floor of ${TYPE_FLOOR}`);
  }
  return scene.add.text(x, y, content, {
    ...style,
    resolution: resolutionAt(1),
    padding: TEXT_INSET,
  });
}

/** A Text's ink, written where it moved: `setColor` redraws the Text whatever it is handed. */
export function inked(label: Phaser.GameObjects.Text, colour: number): Phaser.GameObjects.Text {
  const ink = css(colour);
  return label.style.color === ink ? label : label.setColor(ink);
}

/** The ink a window's title reads in. */
export const TITLE_INK = css(LOOK.paleInk);

/** The heading a window's cards stand under, named after the window it heads. */
export function headingOf(
  scene: Phaser.Scene,
  name: string,
  heading: string,
): Phaser.GameObjects.Text {
  const title = addText(scene, 0, BAR_HEIGHT + MARGIN, heading, {
    fontFamily: UI_FONT,
    fontSize: '26px',
    fontStyle: 'bold',
    color: TITLE_INK,
  })
    .setName(`${name}-title`)
    .setOrigin(0.5, 0);
  return placedWhileUp(title, () => {
    title.setX(screenSize().width / 2);
  });
}
