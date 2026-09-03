import Phaser from 'phaser';
import type { Chronicle, Stage, Target } from '../rules/chronicle';
import {
  type BuildingTypeId,
  CITY_TILE,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from '../rules/map';
import { type Faction, reachable, type Unit, type UnitTypeId, unitAt } from '../rules/units';
import { MAP_FRAME } from './band';
import { bindings, type Control, keyOf } from './bindings';
import { EASE, ended, stopMotion } from './card-motion';
import {
  ACCENT,
  corners,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  dragged,
  hexagon,
  onResize,
  renderFactor,
  type Surface,
  whileUp,
} from './design-space';

const TILE_SIZE = 24;

const TERRAIN_COLOURS: Record<Terrain, number> = {
  plain: 0x7d9c55,
  forest: 0x2f6f4e,
  hills: 0x9a8555,
  water: 0x3d6d9e,
  urban: 0x8f8f9c,
};

const FACTION_COLOURS: Record<Faction, number> = { player: ACCENT, enemy: 0xb4453c };

/** Placeholder primitives until the art pass: the worker a block, the warrior a point. */
const UNIT_MARKS: Record<UnitTypeId, number[]> = {
  PH_Worker: corners([-11, -11, 11, -11, 11, 11, -11, 11]),
  PH_Warrior: corners([0, -14, 13, 9, -13, 9]),
};

/**
 * Placeholder primitives until the art pass: the farm a house, the city a crenellated wall, both
 * wide enough to show under a unit.
 */
const BUILDING_MARKS: Record<BuildingTypeId, number[]> = {
  PH_City: corners([
    -15, 10, -15, -12, -8, -12, -8, -6, -4, -6, -4, -12, 4, -12, 4, -6, 8, -6, 8, -12, 15, -12, 15,
    10,
  ]),
  PH_Farm: corners([-16, 8, -16, -2, 0, -13, 16, -2, 16, 8]),
};

const BUILT = 0xcfc6b4;

const OUTLINE = 0x0d1014;

/** Pale, not accent: the border rings are already accent, and aiming has to read over them. */
const LIT = 0xf2f6ff;

/**
 * Under the hand and the piles, which stay live while a card is aimed: the map takes every press
 * they do not.
 */
const AIM_DEPTH = 1;

/** Over the terrain and the border rings, under what stands on the tiles. */
const GLOW_DEPTH = 2;

const BUILDING_DEPTH = 3;

const UNIT_DEPTH = 4;

/** How close the map comes and how far it goes, on top of the factor the design space renders at. */
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3.5;

/** What one wheel notch multiplies the zoom by; the wheel measures a notch as 100 of its delta. */
const ZOOM_PER_NOTCH = 1.3;

/** How fast a held key pans the frame, in design pixels a second. */
const PAN_SPEED = 1200;

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

/** Where a tile's face stands on the map's own surface, for whatever stands beside it there. */
export type TileFace = {
  readonly x: number;
  readonly y: number;
  /** How far the face reaches from its middle, in map units. */
  readonly radius: number;
};

/** A tile the pointer picked out, and where it stands for whatever floats beside it. */
export type Inspection = {
  readonly tile: TileCoords;
  readonly at: TileFace;
};

export type MapView = {
  render(chronicle: Chronicle): void;
  /** What the map plays for the stage; nothing means the scene renders it at once. */
  play(stage: Stage): Promise<void> | undefined;
  /** Aims at a unit, then at where it lands, until a target is chosen or cancel is called. */
  aimUnitTile(chronicle: Chronicle, chosen: (target: Target | undefined) => void): () => void;
  /** Lights the tiles it is given and aims at them, until a target is chosen or cancel is called. */
  aimTile(
    chronicle: Chronicle,
    tiles: TileCoords[],
    chosen: (target: Target | undefined) => void,
  ): () => void;
  /**
   * Reports the tile every click the UI leaves lands on, and nothing when it lands off the map;
   * `zoomed` fires whenever the zoom changes, so whatever stands on the map at a size of its own
   * stands again. Called once; while a card is aimed the map belongs to the aim and no click is
   * reported.
   */
  inspect(inspected: (found: Inspection | undefined) => void, zoomed: () => void): void;
  /** Rings the tile being inspected, or clears the ring. */
  markInspected(tile: TileCoords | undefined): void;
  /** Whether the wheel and the pan keys reach the map; they do not while anything covers it. */
  live(on: boolean): void;
};

/** The one way a tile's terrain is drawn: the hexagonal face, at the size a tile is drawn at. */
export function terrainMark(scene: Phaser.Scene, terrain: Terrain): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, hexagon(TILE_SIZE), TERRAIN_COLOURS[terrain])
    .setStrokeStyle(1, OUTLINE);
}

/** The one way a building is drawn: its placeholder mark, in the stone everything built is. */
export function buildingMark(
  scene: Phaser.Scene,
  building: BuildingTypeId,
): Phaser.GameObjects.Polygon {
  return scene.add.polygon(0, 0, BUILDING_MARKS[building], BUILT).setStrokeStyle(2, OUTLINE);
}

/** The one way a unit is drawn: its placeholder mark, in the colour of the faction it acts for. */
export function unitMark(scene: Phaser.Scene, unit: Unit): Phaser.GameObjects.Polygon {
  return scene.add
    .polygon(0, 0, UNIT_MARKS[unit.stats.id], FACTION_COLOURS[unit.faction])
    .setStrokeStyle(2, OUTLINE);
}

/** The one way an intent is drawn: the enemy's ring around the tile its attack is aimed at. */
function intentMark(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add
    .polygon(x, y, hexagon(TILE_SIZE - 2), 0, 0)
    .setStrokeStyle(4, FACTION_COLOURS.enemy);
}

/** Every tile the enemies of a chronicle are aiming at, one ring's worth each. */
function aimedAt(units: readonly Unit[]): TileCoords[] {
  return units.flatMap((unit) =>
    unit.faction === 'enemy' && unit.intent !== undefined ? [unit.intent] : [],
  );
}

function positionOf({ q, r }: TileCoords): { x: number; y: number } {
  return {
    x: DESIGN_WIDTH / 2 + Math.sqrt(3) * TILE_SIZE * (q + r / 2),
    y: DESIGN_HEIGHT / 2 + 1.5 * TILE_SIZE * r,
  };
}

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

/** A hexagon is exactly the ground closer to its own centre than to any other centre. */
function tileUnder(chronicle: Chronicle, x: number, y: number): TileCoords | undefined {
  let nearest: TileCoords | undefined;
  let best = Infinity;
  for (const tile of chronicle.tiles) {
    const at = positionOf(tile);
    const gap = Math.hypot(at.x - x, at.y - y);
    if (gap < best) {
      best = gap;
      nearest = { q: tile.q, r: tile.r };
    }
  }
  return best <= TILE_SIZE ? nearest : undefined;
}

function same(a: TileCoords, b: TileCoords): boolean {
  return a.q === b.q && a.r === b.r;
}

function litTile(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), LIT, 0.4).setStrokeStyle(2, LIT, 0.9);
}

/**
 * The map and everything standing on it, on a surface of its own that pans and zooms under the UI.
 * The terrain is drawn once; the buildings and the units are redrawn on every state change; and a
 * card is aimed here — the rules say which tiles light up, never this file.
 */
export function createMapView(scene: Phaser.Scene, map: Surface, chronicle: Chronicle): MapView {
  const camera = map.camera;
  const layer = map.layer;

  for (const tile of chronicle.tiles) {
    const { x, y } = positionOf(tile);
    layer.add(
      terrainMark(scene, tile.terrain)
        .setPosition(x, y)
        .setName(`tile-${tileKey(tile)}`),
    );
  }

  const ring = hexagon(TILE_SIZE - 4);
  for (const coord of chronicle.held) {
    const { x, y } = positionOf(coord);
    layer.add(
      scene.add
        .polygon(x, y, ring, 0, 0)
        .setStrokeStyle(same(coord, chronicle.city) ? 4 : 2, ACCENT),
    );
  }

  const built = scene.add.container(0, 0).setDepth(BUILDING_DEPTH).setName('buildings');
  const intents = scene.add.container(0, 0).setDepth(GLOW_DEPTH).setName('intents');
  const inspected = scene.add.container(0, 0).setDepth(GLOW_DEPTH).setName('inspected');
  const marks = scene.add.container(0, 0).setDepth(UNIT_DEPTH);
  layer.add([built, intents, inspected, marks]);

  let markers: Phaser.GameObjects.Polygon[] = [];
  let inspector: Phaser.GameObjects.Zone | undefined;
  let rescale: (() => void) | undefined;
  let taking = true;

  const box = boxOf(chronicle.tiles);
  const centre = positionOf(CITY_TILE);
  let zoom = 1;
  const catchers = new Set<Phaser.GameObjects.Zone>();

  /** Where the middle of the frame may sit on one axis: KEPT design pixels of the map stay in it. */
  const bounded = (at: number, near: number, far: number, span: number): number => {
    const keep = Math.min(KEPT / zoom, far - near, span);
    return Math.min(Math.max(at, near + keep - span / 2), far - keep + span / 2);
  };

  /** The one place the camera is written: the zoom and the middle it holds, and what it frames. */
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
  };
  onResize(scene, place);

  /** A pan carries what stands on the map by the camera; only a zoom changes what it measures in. */
  const moveTo = (x: number, y: number, next: number): void => {
    const was = zoom;
    centre.x = x;
    centre.y = y;
    zoom = next;
    place();
    if (zoom !== was) rescale?.();
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

  /**
   * Brings the frame to hold every tile a stage plays on, and answers nothing when it holds them
   * all already. The map is not taken for this: a drag or a held key writes the same middle while
   * it runs, and the two fight until the pan ends.
   */
  const hold = (tiles: readonly TileCoords[]): Promise<void> | undefined => {
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
  };

  /**
   * The press a catcher takes and the scene resolves: the press is the catcher's, so the hand and
   * the piles keep theirs, while the release is the scene's, so a press that travelled off the
   * catcher still ends — on the canvas as a release, off it as an abandon. Past the drag slack the
   * press carries the map instead, and one that panned reaches neither `release` nor `abandon`:
   * this is the only place a pan is told from a choice. Hands back the way to take the three scene
   * listeners off again.
   */
  const takePress = (
    catcher: Phaser.GameObjects.Zone,
    on: {
      /** Whether this press may carry the map: one that takes hold of something answers false. */
      down?: (pointer: Phaser.Input.Pointer) => boolean;
      release: (pointer: Phaser.Input.Pointer) => void;
      abandon?: () => void;
    },
  ): (() => void) => {
    let pressed = false;
    /** Where the press landed on the canvas, and the middle the map held then, while it may pan. */
    let from: { x: number; y: number; centre: { x: number; y: number } } | undefined;
    let panned = false;

    catcher.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pressed = true;
      panned = false;
      const mayPan = on.down?.(pointer) ?? true;
      from = mayPan
        ? { x: pointer.x, y: pointer.y, centre: { x: centre.x, y: centre.y } }
        : undefined;
    });

    const pan = (pointer: Phaser.Input.Pointer): void => {
      if (from === undefined) return;
      if (!panned && !dragged(scene, pointer)) return;
      panned = true;
      const was = map.at(from.x, from.y);
      const to = map.at(pointer.x, pointer.y);
      moveTo(from.centre.x - (to.x - was.x), from.centre.y - (to.y - was.y), zoom);
    };

    /** Lets the press go, and says whether anything is left to choose by. */
    const ended = (): boolean => {
      if (!pressed) return false;
      pressed = false;
      from = undefined;
      return !panned;
    };
    const release = (pointer: Phaser.Input.Pointer): void => {
      if (ended()) on.release(pointer);
    };
    const abandon = (): void => {
      if (ended()) on.abandon?.();
    };

    scene.input.on('pointermove', pan);
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', abandon);
    return () => {
      scene.input.off('pointermove', pan);
      scene.input.off('pointerup', release);
      scene.input.off('pointerupoutside', abandon);
    };
  };

  /**
   * A zone over the whole frame, under everything the UI draws: it takes every press the UI does
   * not. It is framed in map space, so it is re-cut to the frame on every pan and every zoom.
   */
  const catcherZone = (name: string): Phaser.GameObjects.Zone => {
    const catcher = scene.add
      .zone(0, 0, 1, 1)
      .setOrigin(0, 0)
      .setDepth(AIM_DEPTH)
      .setName(name)
      .setInteractive();
    catcher.once(Phaser.GameObjects.Events.DESTROY, () => catchers.delete(catcher));
    catchers.add(catcher);
    layer.add(catcher);
    place();
    return catcher;
  };

  scene.input.on(
    'wheel',
    (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (!taking) return;
      const next = Math.min(Math.max(zoom * ZOOM_PER_NOTCH ** (-dy / 100), MIN_ZOOM), MAX_ZOOM);
      // The zoom is about the pointer: what the map showed under it before shows under it after.
      const at = map.at(pointer.x, pointer.y);
      const away = zoom / next;
      moveTo(at.x - (at.x - centre.x) * away, at.y - (at.y - centre.y) * away, next);
    },
  );

  /** Every key held down right now, by the label it binds under. */
  const held = new Set<string>();
  const keyboard = scene.input.keyboard;
  keyboard?.on('keydown', (event: KeyboardEvent) => held.add(keyOf(event.key)));
  keyboard?.on('keyup', (event: KeyboardEvent) => held.delete(keyOf(event.key)));

  // A window that loses focus under a held key is never sent that key's release, and the frame
  // would pan on for ever.
  whileUp(scene, scene.game.events, Phaser.Core.Events.BLUR, () => held.clear());

  whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
    if (!taking) return;
    const keys = bindings();
    let x = 0;
    let y = 0;
    for (const pan of PANS) {
      if (!keys[pan.control].some((key) => key !== undefined && held.has(key))) continue;
      x += pan.x;
      y += pan.y;
    }
    if (x === 0 && y === 0) return;
    const step = (PAN_SPEED * delta) / 1000 / zoom / Math.hypot(x, y);
    moveTo(centre.x + x * step, centre.y + y * step, zoom);
  });

  /** The ground every aim runs on: its own catcher, a glow to paint, and inspection held off. */
  const openAim = (): {
    catcher: Phaser.GameObjects.Zone;
    glow: Phaser.GameObjects.Container;
    close: () => void;
  } => {
    inspector?.disableInteractive();
    const catcher = catcherZone('aim');
    const glow = scene.add.container(0, 0).setDepth(GLOW_DEPTH);
    layer.add(glow);
    return {
      catcher,
      glow,
      close: (): void => {
        catcher.destroy();
        glow.destroy();
        inspector?.setInteractive();
      },
    };
  };

  /** The chronicle the map stands on: which marker is whose is read from it. */
  let shown: Chronicle | undefined;
  /** What the map has in the air; a render owns it and takes it down. */
  let flight: symbol | undefined;

  const render = (current: Chronicle): void => {
    flight = undefined;
    shown = current;

    built.removeAll(true);
    for (const tile of current.tiles) {
      if (tile.building === undefined) continue;
      const { x, y } = positionOf(tile);
      built.add(buildingMark(scene, tile.building).setPosition(x, y));
    }

    // What is about to be destroyed loses its tweens first: a motion left running on a destroyed
    // marker never completes, and the stage waiting on it would never end.
    stopMotion(scene, intents.list);
    intents.removeAll(true);
    for (const coord of aimedAt(current.units)) intents.add(intentMark(scene, coord));

    stopMotion(scene, marks.list);
    marks.removeAll(true);
    markers = current.units.map((unit) => {
      const { x, y } = positionOf(unit.tile);
      const marker = unitMark(scene, unit).setPosition(x, y);
      marks.add(marker);
      return marker;
    });
  };

  /** Takes the map for one stage's motion, and hands back the token that settles it. */
  const takeOff = (): symbol => {
    const token = Symbol('motion');
    flight = token;
    return token;
  };

  const settle = (token: symbol, chronicle: Chronicle): void => {
    // A render while this was in the air took it down and painted the map it stands on.
    if (flight === token) render(chronicle);
  };

  /** The marker standing on a tile, and nothing where the map shows none. */
  const markerOn = (coord: TileCoords): Phaser.GameObjects.Polygon | undefined => {
    const index = shown?.units.findIndex((unit) => same(unit.tile, coord)) ?? -1;
    return index === -1 ? undefined : markers[index];
  };

  /** What a target does: a bump where it was hit, and a shrink off the map if it was killed. */
  const struck = async (
    marker: Phaser.GameObjects.Polygon,
    killed: boolean,
    token: symbol,
  ): Promise<void> => {
    await ended(
      scene.tweens.add({
        targets: marker,
        scale: 1.35,
        delay: 150,
        duration: 60,
        ease: EASE,
        yoyo: true,
      }),
    );
    if (!killed || flight !== token) return;
    await ended(scene.tweens.add({ targets: marker, scale: 0, duration: 200, ease: EASE }));
  };

  /** One attack: the attacker lunges halfway at the tile it aimed at, and what stands there takes it. */
  const strike = (
    attacker: TileCoords,
    target: TileCoords,
    chronicle: Chronicle,
  ): Promise<void> | undefined => {
    const lunging = markerOn(attacker);
    if (lunging === undefined) return undefined;
    const hit = markerOn(target);
    const token = takeOff();

    const from = positionOf(attacker);
    const to = positionOf(target);
    const lunge = ended(
      scene.tweens.add({
        targets: lunging,
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        duration: 150,
        ease: EASE,
        yoyo: true,
      }),
    );
    const taken =
      hit === undefined
        ? Promise.resolve()
        : struck(hit, unitAt(chronicle.units, target) === undefined, token);

    return Promise.all([lunge, taken]).then(() => settle(token, chronicle));
  };

  /** One enemy's move: its marker slides from the tile it left to the one it reached. */
  const slide = (
    from: TileCoords,
    to: TileCoords,
    chronicle: Chronicle,
  ): Promise<void> | undefined => {
    const marker = markerOn(from);
    if (marker === undefined) return undefined;
    const token = takeOff();
    const at = positionOf(to);

    return ended(
      scene.tweens.add({ targets: marker, x: at.x, y: at.y, duration: 350, ease: EASE }),
    ).then(() => settle(token, chronicle));
  };

  /** The tiles the chronicle is aimed at that the map is not already ringing. */
  const declared = (chronicle: Chronicle): TileCoords[] => {
    const standing = new Set(aimedAt(shown?.units ?? []).map(tileKey));
    return aimedAt(chronicle.units).filter((coord) => !standing.has(tileKey(coord)));
  };

  /** The units of the chronicle standing on tiles the map shows none on. */
  const arrivals = (chronicle: Chronicle): Unit[] => {
    const standing = new Set((shown?.units ?? []).map((unit) => tileKey(unit.tile)));
    return chronicle.units.filter((unit) => !standing.has(tileKey(unit.tile)));
  };

  /** The declarations: every ring the enemies did not already stand behind fades in. */
  const declare = (chronicle: Chronicle): Promise<void> | undefined => {
    const fresh = declared(chronicle);
    if (fresh.length === 0) return undefined;

    const token = takeOff();
    const rings = fresh.map((coord) => {
      const ring = intentMark(scene, coord).setAlpha(0);
      intents.add(ring);
      return ring;
    });

    return ended(scene.tweens.add({ targets: rings, alpha: 1, duration: 250, ease: EASE })).then(
      () => settle(token, chronicle),
    );
  };

  /** The arrival: every unit the map was not already showing grows onto its tile. */
  const arriving = (chronicle: Chronicle): Promise<void> | undefined => {
    const arrived = arrivals(chronicle);
    if (arrived.length === 0) return undefined;

    const token = takeOff();
    const entering = arrived.map((unit) => {
      const { x, y } = positionOf(unit.tile);
      const marker = unitMark(scene, unit).setPosition(x, y).setScale(0);
      marks.add(marker);
      return marker;
    });

    return ended(scene.tweens.add({ targets: entering, scale: 1, duration: 250, ease: EASE })).then(
      () => settle(token, chronicle),
    );
  };

  /**
   * One stage: the frame comes to hold the tiles it plays on, and the motion starts once it does.
   * A pan paints nothing, so a stage whose motion had nothing to animate is rendered here — the
   * scene renders only the stages the map answers nothing for.
   */
  const staged = (
    tiles: readonly TileCoords[],
    chronicle: Chronicle,
    motion: () => Promise<void> | undefined,
  ): Promise<void> | undefined => {
    const panning = hold(tiles);
    if (panning === undefined) return motion();
    return panning.then(() => {
      const played = motion();
      if (played === undefined) render(chronicle);
      return played;
    });
  };

  return {
    live(on: boolean): void {
      taking = on;
    },

    render,

    play(stage: Stage): Promise<void> | undefined {
      switch (stage.name) {
        case 'attack':
          return staged([stage.attacker, stage.target], stage.chronicle, () =>
            strike(stage.attacker, stage.target, stage.chronicle),
          );
        case 'move':
          return staged([stage.from, stage.to], stage.chronicle, () =>
            slide(stage.from, stage.to, stage.chronicle),
          );
        case 'intents':
          return staged(declared(stage.chronicle), stage.chronicle, () => declare(stage.chronicle));
        case 'events':
          return staged(
            arrivals(stage.chronicle).map((unit) => unit.tile),
            stage.chronicle,
            () => arriving(stage.chronicle),
          );
        default:
          return undefined;
      }
    },

    inspect(found: (inspection: Inspection | undefined) => void, zoomed: () => void): void {
      rescale = zoomed;
      const catcher = catcherZone('inspect');
      inspector = catcher;

      takePress(catcher, {
        release: (pointer) => {
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(chronicle, at.x, at.y);
          found(
            on === undefined
              ? undefined
              : { tile: on, at: { ...positionOf(on), radius: TILE_SIZE } },
          );
        },
      });
    },

    markInspected(tile: TileCoords | undefined): void {
      inspected.removeAll(true);
      inspected.setData('tile', tile === undefined ? undefined : tileKey(tile));
      if (tile === undefined) return;
      const { x, y } = positionOf(tile);
      inspected.add(scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), 0, 0).setStrokeStyle(4, LIT));
    },

    aimUnitTile(current: Chronicle, chosen: (target: Target | undefined) => void): () => void {
      const { catcher, glow, close } = openAim();

      let selected: number | undefined;
      let landings: TileCoords[] = [];
      let grabbed: number | undefined;

      const paint = (): void => {
        glow.removeAll(true);
        for (const coord of landings) glow.add(litTile(scene, coord));
        current.units.forEach((unit, index) => {
          if (unit.faction !== 'player') return;
          const { x, y } = positionOf(unit.tile);
          glow.add(
            scene.add
              .polygon(x, y, hexagon(TILE_SIZE - 2), 0, 0)
              .setStrokeStyle(index === selected ? 4 : 2, LIT),
          );
        });
      };

      const drag = (pointer: Phaser.Input.Pointer): void => {
        if (grabbed === undefined) return;
        const at = map.at(pointer.x, pointer.y);
        markers[grabbed].setPosition(at.x, at.y);
      };

      const finish = (target: Target | undefined): void => {
        scene.input.off('pointermove', drag);
        stop();
        close();
        chosen(target);
      };

      const letGo = (): void => {
        if (grabbed !== undefined) {
          const home = positionOf(current.units[grabbed].tile);
          markers[grabbed].setPosition(home.x, home.y);
          grabbed = undefined;
        }
        selected = undefined;
        landings = [];
        paint();
      };

      const select = (index: number): void => {
        selected = index;
        landings = reachable(current.tiles, current.units, current.units[index]);
        paint();
      };

      const stop = takePress(catcher, {
        down: (pointer) => {
          const at = map.at(pointer.x, pointer.y);
          const under = tileUnder(current, at.x, at.y);
          const found =
            under === undefined
              ? -1
              : current.units.findIndex(
                  (unit) => unit.faction === 'player' && same(unit.tile, under),
                );
          grabbed = found === -1 ? undefined : found;
          if (grabbed === undefined) return true;
          select(grabbed);
          return false;
        },
        release: (pointer) => {
          const at = map.at(pointer.x, pointer.y);
          const to = tileUnder(current, at.x, at.y);
          const held = grabbed;

          if (held !== undefined) {
            const home = positionOf(current.units[held].tile);
            markers[held].setPosition(home.x, home.y);
            grabbed = undefined;
            if (to !== undefined && same(to, current.units[held].tile)) return;
          }
          if (selected !== undefined && to !== undefined && landings.some((c) => same(c, to))) {
            finish({ type: 'unit-tile', unit: selected, tile: to });
            return;
          }
          letGo();
        },
        abandon: letGo,
      });

      scene.input.on('pointermove', drag);
      paint();
      return () => finish(undefined);
    },

    aimTile(
      current: Chronicle,
      tiles: TileCoords[],
      chosen: (target: Target | undefined) => void,
    ): () => void {
      const { catcher, glow, close } = openAim();
      for (const coord of tiles) glow.add(litTile(scene, coord));

      const finish = (target: Target | undefined): void => {
        stop();
        close();
        chosen(target);
      };

      const stop = takePress(catcher, {
        release: (pointer) => {
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(current, at.x, at.y);
          if (on !== undefined && tiles.some((coord) => same(coord, on)))
            finish({ type: 'tile', tile: on });
        },
      });

      return () => finish(undefined);
    },
  };
}
