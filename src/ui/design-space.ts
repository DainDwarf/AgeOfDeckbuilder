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
function factorNow(): number {
  return (
    window.devicePixelRatio *
    Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT)
  );
}

/** The backing store the window calls for, in device pixels. */
export function backingSize(): { width: number; height: number } {
  const factor = factorNow();
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

// Everything here reads the window and the scale manager live, never the RESIZE event's size
// arguments: the resize `followWindow` triggers emits RESIZE again, nested inside the one being
// handled, so the outer arguments describe a backing store that is already gone.
function follow(scene: Phaser.Scene, place: () => void): void {
  scene.scale.on(Phaser.Scale.Events.RESIZE, place);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, place);
  });
}

/** Every Text the scene holds, however deep in containers it sits. */
function* textsIn(
  objects: readonly Phaser.GameObjects.GameObject[],
): Generator<Phaser.GameObjects.Text> {
  for (const object of objects) {
    if (object instanceof Phaser.GameObjects.Text) yield object;
    else if (object instanceof Phaser.GameObjects.Container) yield* textsIn(object.list);
  }
}

/** How far a press travels before it is a drag and no longer a click, in design units. */
const DRAG_SLACK = 8;

// A scene's `scale.width` / `scale.height` report the backing store in device pixels, and a
// pointer's `x` / `y` arrive in that same space; lay out against DESIGN_WIDTH and DESIGN_HEIGHT,
// and read `pointer.worldX` / `pointer.worldY` for the design-space pointer. Phaser measures the
// drag threshold between the raw pointer positions, so it is set in that space and follows the
// window with the zoom.
export function applyDesignSpace(scene: Phaser.Scene): void {
  const place = (): void => {
    const factor = factorNow();
    // The main camera's own size is Phaser's business: its camera manager subscribed to RESIZE at
    // scene boot, ahead of this, and resizes every camera at the origin that had the old size.
    scene.cameras.main.setZoom(factor).centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    scene.input.dragDistanceThreshold = DRAG_SLACK * factor;
    const resolution = Math.ceil(factor);
    for (const label of textsIn(scene.children.list)) {
      if (label.style.resolution !== resolution) label.setResolution(resolution);
    }
  };
  place();
  follow(scene, place);
}

/** Where the press a pointer is still holding landed, in design space. */
export function pressedAt(
  scene: Phaser.Scene,
  pointer: Phaser.Input.Pointer,
): { x: number; y: number } {
  return scene.cameras.main.getWorldPoint(pointer.downX, pointer.downY);
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
 * A clip is a camera of its own, its viewport the rectangle: Phaser 4's geometry mask clips under
 * the canvas renderer alone, and this game renders through WebGL. Every camera draws the whole
 * scene, so `show` hands this one everything on the display list but the object it is for — which
 * is also why the camera is kept and re-pointed: a camera's ignore is never lifted, and an object
 * the scene gains while the clip stands open would draw inside the rectangle.
 */
export function createClip(scene: Phaser.Scene): Clip {
  const camera = scene.cameras.add(0, 0, 1, 1).setVisible(false);
  /** The rectangle in design units while it is shown, and nothing while it is not. */
  let frame: { x: number; y: number; width: number; height: number } | undefined;

  const place = (): void => {
    const factor = factorNow();
    camera.setZoom(factor);
    if (frame === undefined) return;
    const { x, y, width, height } = frame;
    camera
      .setViewport(x * factor, y * factor, width * factor, height * factor)
      .centerOn(x + width / 2, y + height / 2);
  };
  place();
  follow(scene, place);

  return {
    show(only, x, y, width, height): void {
      frame = { x, y, width, height };
      place();
      camera.setVisible(true);
      camera.ignore(scene.children.list.filter((child) => child !== only));
      scene.cameras.main.ignore(only);
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
    resolution: Math.ceil(factorNow()),
    padding: { x: 2, y: 1 },
  });
}
