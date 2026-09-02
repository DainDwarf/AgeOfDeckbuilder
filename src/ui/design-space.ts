import Phaser from 'phaser';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const UI_FONT = 'system-ui, "Segoe UI", sans-serif';

/** How far anything laid against an edge of the screen stands off it. */
export const MARGIN = 24;

/** The one accent, on everything that is the player's: the border, the deck, the button. */
export const ACCENT = 0xd9a441;

/** The panel language: the tooltip bubbles and the resource bar are this fill inside this edge. */
export const PANEL_FILL = 0xd4d7db;
export const PANEL_EDGE = 0x6f757d;

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
export type Tail = { edge: 'top' | 'left' | 'right'; at: number };

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
  const span = tail.edge === 'top' ? width : height;
  const at = Math.min(Math.max(tail.at, TAIL_HALF + 4), span - TAIL_HALF - 4);

  bubble.clear();
  bubble.fillStyle(PANEL_FILL);
  bubble.lineStyle(1, PANEL_EDGE);
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

// Everything here reads the window and the scale manager live, never the RESIZE event's size
// arguments: the resize `followWindow` triggers emits RESIZE again, nested inside the one being
// handled, so the outer arguments describe a backing store that is already gone.
/** Lays something out now, and again after every change of window. */
export function onResize(scene: Phaser.Scene, place: () => void): void {
  place();
  scene.scale.on(Phaser.Scale.Events.RESIZE, place);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, place);
  });
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
  // Both cameras fill the canvas from its origin, so the point each turns about is its middle.
  const middle = (): { x: number; y: number } => ({ x: camera.width / 2, y: camera.height / 2 });
  return {
    layer,
    camera,
    at(x, y) {
      const half = middle();
      return {
        x: camera.scrollX + half.x + (x - half.x) / camera.zoomX,
        y: camera.scrollY + half.y + (y - half.y) / camera.zoomY,
      };
    },
    unit() {
      return renderFactor() / camera.zoomX;
    },
  };
}

/**
 * The design space, cut in two: each camera is blind to the other's layer, so one of them can be
 * panned and zoomed while the other holds still. Nothing may be left standing on the scene's own
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
  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, (object: Phaser.GameObjects.GameObject) => {
    if (object instanceof Phaser.GameObjects.Layer) return;
    if (object.displayList !== scene.sys.displayList) return;
    ui.layer.add(object);
  });

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

/** Whether the press a pointer is holding has travelled far enough to be a drag and not a click. */
export function dragged(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): boolean {
  const travel = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.x, pointer.y);
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
  };
}

/**
 * A click: pressed and released on the same object, with no drag in between. Phaser delivers
 * `pointerup` to whatever lies under the pointer however far it travelled since the press, so a
 * bare `pointerup` also fires on a card dragged onto the object from elsewhere, on the object a
 * drag of its own just ended over, and on the release half of a click whose press dismissed
 * something above it.
 */
export function onClick(
  target: Phaser.GameObjects.GameObject,
  handler: (pointer: Phaser.Input.Pointer) => void,
): void {
  const input = target.scene.input;
  let pressed = false;
  const disarm = (): void => {
    pressed = false;
  };

  target.on('pointerdown', () => {
    pressed = true;
  });
  target.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (pressed) handler(pointer);
  });
  target.on('dragstart', disarm);
  // The scene sees every release, on the canvas and off it, and after the target does. A press the
  // target never sees released — it was hidden, disabled or removed meanwhile — would otherwise
  // stay armed. The scene outlives the target, so those two go when the target does.
  input.on('pointerup', disarm);
  input.on('pointerupoutside', disarm);
  target.once('destroy', () => {
    input.off('pointerup', disarm);
    input.off('pointerupoutside', disarm);
  });
}

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  // Phaser sizes a Text's backing canvas from a box it measures at 1× — sideways from the advance
  // width rather than the ink box — but rasterises the glyphs at `resolution`, and a hinted outline
  // is not proportional, so ink falls outside the canvas on every side, further sideways than
  // vertically. The padding holds that overflow; being symmetric per axis, a centred text does not
  // move. A fractional resolution would truncate the canvas to whole pixels, hence the ceiling.
  return scene.add.text(x, y, content, {
    ...style,
    resolution: Math.ceil(renderFactor()),
    padding: { x: 2, y: 1 },
  });
}
