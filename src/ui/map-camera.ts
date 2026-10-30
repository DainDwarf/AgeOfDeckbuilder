import Phaser from 'phaser';
import { CENTRE, type Tile, type TileCoords } from '../rules/map';
import { MAP_FRAME } from './band';
import { boundTo, type Control, type Press, pressOf } from './bindings';
import { EASE, ended } from './card-motion';
import { dragged, onLetGoOffCanvas, onResize, renderFactor, type Stratum } from './design-space';
import { onHeldKeys, onKeyDown } from './keys';
import { positionOf, TILE_SIZE } from './map-marks';
import { PAN_SPEED } from './scroll';

/** How close the map comes and how far it goes, on top of the factor the design space renders at. */
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3.5;

/** What one notch of zoom multiplies the zoom by. */
const ZOOM_PER_NOTCH = 1.3;

/** How much of the map stays inside the frame however far it is panned, in design pixels. */
const KEPT = 360;

/** How far clear of every border a tile a stage plays on is brought, in design pixels. */
const CLEARANCE = 24;

/** How long the pan that brings a stage into the frame lasts, however far it has to go. */
const HOLD_LEAST = 200;
const HOLD_MOST = 600;

/** The four controls that pan, and the way each one carries the frame. */
const PANS: readonly { control: Control; x: number; y: number }[] = [
  { control: 'pan-up', x: 0, y: -1 },
  { control: 'pan-left', x: -1, y: 0 },
  { control: 'pan-down', x: 0, y: 1 },
  { control: 'pan-right', x: 1, y: 0 },
];

/** Everything the map covers in its own space: the faces of its tiles, and nothing else. */
function boxOf(tiles: readonly Tile[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const centres = tiles.map((tile) => positionOf(tile));
  const xs = centres.map(({ x }) => x);
  const ys = centres.map(({ y }) => y);
  return {
    left: Math.min(...xs) - TILE_SIZE,
    right: Math.max(...xs) + TILE_SIZE,
    top: Math.min(...ys) - TILE_SIZE,
    bottom: Math.max(...ys) + TILE_SIZE,
  };
}

/** What a catcher's press answers to. */
export type PressTaker = {
  /**
   * Whether this press may carry the map: one that takes hold of something answers false. Asked
   * of a left press alone — a right press takes hold of nothing, so it always may pan.
   */
  down?: (pointer: Phaser.Input.Pointer) => boolean;
  /**
   * The left press let go; a second button's release lets nothing go, and whatever the press has
   * hold of stands through it.
   */
  release?: (pointer: Phaser.Input.Pointer) => void;
  abandon?: () => void;
};

/** The frame the map is seen through, and the presses that carry it. */
export type MapCamera = {
  /**
   * Brings the frame to hold every tile a stage plays on, and answers nothing when it holds them
   * all already. The map is not taken for this: a drag or a held key writes the same middle while
   * it runs, and the two fight until the pan ends.
   */
  hold(tiles: readonly TileCoords[]): Promise<void> | undefined;
  /**
   * A zone over the whole frame, under everything the UI draws: it takes every press the UI does
   * not. It is framed in map space, so it is re-cut to the frame on every pan and every zoom.
   */
  catcherZone(name: string): Phaser.GameObjects.Zone;
  /** Whether this zone is a catcher standing on the frame. */
  catches(zone: Phaser.GameObjects.Zone): boolean;
  /**
   * The press is the catcher's and the release the scene's, so a press that travelled off the
   * catcher still ends — on the canvas as a release, off it as an abandon — while the hand and the
   * piles keep their own presses. One that panned past the drag slack reaches neither.
   */
  takePress(catcher: Phaser.GameObjects.Zone, on: PressTaker): () => void;
  /** Whether the last press of that button on a catcher carried the map or what it took hold of. */
  carried(press: Press): boolean;
  /** That press as having carried what it took hold of. */
  setCarried(press: Press): void;
  /**
   * The resolution a text on the map is raised at: it is rasterised once and scaled after, so the
   * map's own zoom goes into it, and every such text is raised again whenever that zoom changes.
   */
  atZoom(): number;
  /**
   * Notches of zoom, in above zero, about the pointer: what the map showed under it before shows
   * under it now.
   */
  zoomBy(notches: number): void;
  /** Whether the pan and zoom keys and the wheel move the map. */
  live(on: boolean): void;
};

/** The frame cut over the terrain stratum, with the dim laid across it; `zoomed` follows a zoom. */
export function createMapCamera(
  scene: Phaser.Scene,
  map: Stratum,
  dim: Phaser.GameObjects.Rectangle,
  tiles: readonly Tile[],
  zoomed: () => void,
): MapCamera {
  const camera = map.camera;

  /** Whether each button's last press on a catcher carried the map or what it took hold of. */
  const carrying: Record<Press, boolean> = { left: false, right: false };
  let taking = true;

  const box = boxOf(tiles);
  const centre = positionOf(CENTRE);
  let zoom = 1;
  const catchers = new Set<Phaser.GameObjects.Zone>();

  /** Where the middle of the frame may sit on one axis: KEPT design pixels of the map stay in it. */
  const bounded = (at: number, near: number, far: number, span: number): number => {
    const keep = Math.min(KEPT / zoom, far - near, span);
    return Math.min(Math.max(at, near + keep - span / 2), far - keep + span / 2);
  };

  const place = (): void => {
    const factor = renderFactor();
    // Phaser's camera manager resizes only the cameras that filled the old canvas: a cropped
    // camera is cut here or not at all.
    camera.setViewport(
      MAP_FRAME.x * factor,
      MAP_FRAME.y * factor,
      MAP_FRAME.width * factor,
      MAP_FRAME.height * factor,
    );
    camera.setZoom(factor * zoom);
    const span = { x: MAP_FRAME.width / zoom, y: MAP_FRAME.height / zoom };
    centre.x = bounded(centre.x, box.left, box.right, span.x);
    centre.y = bounded(centre.y, box.top, box.bottom, span.y);
    camera.centerOn(centre.x, centre.y);
    for (const catcher of catchers) {
      catcher.setPosition(centre.x - span.x / 2, centre.y - span.y / 2).setSize(span.x, span.y);
    }
    dim.setPosition(centre.x - span.x / 2, centre.y - span.y / 2).setSize(span.x, span.y);
  };
  onResize(scene, place);

  /** A pan carries what stands on the map by the camera; only a zoom changes what it measures in. */
  const moveTo = (x: number, y: number, next: number): void => {
    const was = zoom;
    centre.x = x;
    centre.y = y;
    zoom = next;
    place();
    if (zoom !== was) zoomed();
  };

  /**
   * Where the middle of the frame goes on one axis for the tiles between `lo` and `hi` to stand
   * clear of both borders: the shortest move that does it, or the middle of them when the frame is
   * too small for all of them.
   */
  const holding = (at: number, lo: number, hi: number, span: number): number => {
    const room = span / 2 - TILE_SIZE - CLEARANCE / zoom;
    if (hi - lo > 2 * room) return (lo + hi) / 2;
    return Math.min(Math.max(at, hi - room), lo + room);
  };

  const zoomBy = (notches: number): void => {
    if (!taking) return;
    const next = Math.min(Math.max(zoom * ZOOM_PER_NOTCH ** notches, MIN_ZOOM), MAX_ZOOM);
    const pointer = scene.input.activePointer;
    const at = map.at(pointer.x, pointer.y);
    const away = zoom / next;
    moveTo(at.x - (at.x - centre.x) * away, at.y - (at.y - centre.y) * away, next);
  };

  onKeyDown(scene, (press) => {
    if (boundTo(press, 'zoom-in')) zoomBy(1);
    else if (boundTo(press, 'zoom-out')) zoomBy(-1);
  });

  onHeldKeys(scene, (pressing, delta) => {
    let x = 0;
    let y = 0;
    if (taking) {
      for (const pan of PANS) {
        if (!pressing(pan.control)) continue;
        x += pan.x;
        y += pan.y;
      }
    }
    if (x === 0 && y === 0) return;
    const step = (PAN_SPEED * delta) / 1000 / zoom / Math.hypot(x, y);
    moveTo(centre.x + x * step, centre.y + y * step, zoom);
  });

  return {
    hold(tiles: readonly TileCoords[]): Promise<void> | undefined {
      if (tiles.length === 0) return undefined;
      const at = tiles.map(positionOf);
      const xs = at.map((point) => point.x);
      const ys = at.map((point) => point.y);
      const to = {
        x: holding(centre.x, Math.min(...xs), Math.max(...xs), MAP_FRAME.width / zoom),
        y: holding(centre.y, Math.min(...ys), Math.max(...ys), MAP_FRAME.height / zoom),
      };
      const away = Math.hypot(to.x - centre.x, to.y - centre.y) * zoom;
      if (away === 0) return undefined;

      const moving = { x: centre.x, y: centre.y };
      return ended(
        scene.tweens.add({
          targets: moving,
          x: to.x,
          y: to.y,
          duration: Math.min(Math.max((away / PAN_SPEED) * 1000, HOLD_LEAST), HOLD_MOST),
          ease: EASE,
          onUpdate: () => moveTo(moving.x, moving.y, zoom),
        }),
      );
    },

    catcherZone(name: string): Phaser.GameObjects.Zone {
      const catcher = scene.add.zone(0, 0, 1, 1).setOrigin(0, 0).setName(name).setInteractive();
      catcher.once(Phaser.GameObjects.Events.DESTROY, () => catchers.delete(catcher));
      catchers.add(catcher);
      map.layer.add(catcher);
      place();
      return catcher;
    },

    catches(zone: Phaser.GameObjects.Zone): boolean {
      return catchers.has(zone);
    },

    takePress(catcher: Phaser.GameObjects.Zone, on: PressTaker): () => void {
      /** Which button is holding the press, and nothing while none is. */
      let taken: Press | undefined;
      /** Where the press landed on the canvas, and the middle the map held then, while it may pan. */
      let from: { x: number; y: number; centre: { x: number; y: number } } | undefined;
      let panned = false;

      catcher.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const press = pressOf(pointer);
        if (press === undefined) return;
        carrying[press] = false;
        if (taken !== undefined) return;
        taken = press;
        panned = false;
        const mayPan = press === 'right' || (on.down?.(pointer) ?? true);
        from = mayPan
          ? { x: pointer.x, y: pointer.y, centre: { x: centre.x, y: centre.y } }
          : undefined;
      });

      const pan = (pointer: Phaser.Input.Pointer): void => {
        if (from === undefined || taken === undefined) return;
        if (!panned && !dragged(scene, from, pointer)) return;
        panned = true;
        carrying[taken] = true;
        const was = map.at(from.x, from.y);
        const to = map.at(pointer.x, pointer.y);
        moveTo(from.centre.x - (to.x - was.x), from.centre.y - (to.y - was.y), zoom);
      };

      /** Lets the press go, and says whether anything is left to choose by. */
      const ended = (): boolean => {
        if (taken === undefined) return false;
        taken = undefined;
        from = undefined;
        return !panned;
      };
      const release = (pointer: Phaser.Input.Pointer): void => {
        const press = pressOf(pointer);
        if (press !== taken) return;
        if (ended() && press === 'left') on.release?.(pointer);
      };
      scene.input.on('pointermove', pan);
      scene.input.on('pointerup', release);
      const unheard = onLetGoOffCanvas(scene, (press) => {
        if (press === taken && ended()) on.abandon?.();
      });
      return () => {
        scene.input.off('pointermove', pan);
        scene.input.off('pointerup', release);
        unheard();
      };
    },

    carried(press: Press): boolean {
      return carrying[press];
    },

    setCarried(press: Press): void {
      carrying[press] = true;
    },

    atZoom(): number {
      return Math.ceil(renderFactor() * zoom);
    },

    zoomBy,

    live(on: boolean): void {
      taking = on;
    },
  };
}
