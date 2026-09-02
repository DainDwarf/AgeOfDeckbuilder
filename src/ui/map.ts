import Phaser from 'phaser';
import type { Chronicle, Target } from '../rules/chronicle';
import {
  type BuildingTypeId,
  CITY_TILE,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from '../rules/map';
import { type Faction, reachable, type Unit, type UnitTypeId } from '../rules/units';
import {
  ACCENT,
  corners,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  dragged,
  hexagon,
  onResize,
  renderFactor,
  type Surfaces,
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

/**
 * Every key that pans the frame, each direction's first and its second, all live at once. This is
 * the one table rebinding replaces.
 */
const PAN_KEYS = [
  { keys: ['W', 'UP'], x: 0, y: -1 },
  { keys: ['A', 'LEFT'], x: -1, y: 0 },
  { keys: ['S', 'DOWN'], x: 0, y: 1 },
  { keys: ['D', 'RIGHT'], x: 1, y: 0 },
] as const;

/** Where a tile's face stands on the table's surface, for whatever floats beside it. */
export type TileFace = {
  readonly x: number;
  readonly y: number;
  /** How far the face reaches from its middle, in design pixels: the zoom moves it. */
  readonly radius: number;
};

/** A tile the pointer picked out, and where it stands for whatever floats beside it. */
export type Inspection = {
  readonly tile: TileCoords;
  readonly at: TileFace;
};

export type MapView = {
  render(chronicle: Chronicle): void;
  /** Aims at a unit, then at where it lands, until a target is chosen or cancel is called. */
  aimUnitTile(chronicle: Chronicle, chosen: (target: Target | undefined) => void): () => void;
  /** Lights the tiles it is given and aims at them, until a target is chosen or cancel is called. */
  aimTile(
    chronicle: Chronicle,
    tiles: TileCoords[],
    chosen: (target: Target | undefined) => void,
  ): () => void;
  /**
   * Reports the tile every click the table leaves lands on, nothing when it lands off the map, and
   * nothing again whenever the map moves under the inspection. Called once; while a card is aimed
   * the map belongs to the aim and no click is reported.
   */
  inspect(inspected: (found: Inspection | undefined) => void): void;
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

/**
 * The press a catcher takes and the scene resolves: the press is the catcher's, so the hand and
 * the piles keep theirs, while the release is the scene's, so a press that travelled off the
 * catcher still ends — on the canvas as a release, off it as an abandon. Hands back the way to
 * take the two scene listeners off again.
 */
function takePress(
  scene: Phaser.Scene,
  catcher: Phaser.GameObjects.Zone,
  on: {
    down?: (pointer: Phaser.Input.Pointer) => void;
    release: (pointer: Phaser.Input.Pointer) => void;
    abandon?: () => void;
  },
): () => void {
  let pressed = false;

  catcher.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    pressed = true;
    on.down?.(pointer);
  });

  const release = (pointer: Phaser.Input.Pointer): void => {
    if (!pressed) return;
    pressed = false;
    on.release(pointer);
  };
  const abandon = (): void => {
    if (!pressed) return;
    pressed = false;
    on.abandon?.();
  };

  scene.input.on('pointerup', release);
  scene.input.on('pointerupoutside', abandon);
  return () => {
    scene.input.off('pointerup', release);
    scene.input.off('pointerupoutside', abandon);
  };
}

function litTile(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), LIT, 0.4).setStrokeStyle(2, LIT, 0.9);
}

/**
 * The map and everything standing on it, on a surface of its own that pans and zooms under the
 * table. The terrain is drawn once; the buildings and the units are redrawn on every state change;
 * and a card is aimed here — the rules say which tiles light up, never this file.
 */
export function createMapView(
  scene: Phaser.Scene,
  { map, table }: Surfaces,
  chronicle: Chronicle,
): MapView {
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
  let reported: ((found: Inspection | undefined) => void) | undefined;
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
    camera.setZoom(renderFactor() * zoom);
    const span = { x: DESIGN_WIDTH / zoom, y: DESIGN_HEIGHT / zoom };
    centre.x = bounded(centre.x, box.left, box.right, span.x);
    centre.y = bounded(centre.y, box.top, box.bottom, span.y);
    camera.centerOn(centre.x, centre.y);
    for (const catcher of catchers) {
      catcher.setPosition(centre.x - span.x / 2, centre.y - span.y / 2).setSize(span.x, span.y);
    }
  };
  onResize(scene, place);

  /** Every pan and every zoom: no inspection outlives one, as none outlives a state change. */
  const moveTo = (x: number, y: number, next: number): void => {
    const was = { x: centre.x, y: centre.y, zoom };
    centre.x = x;
    centre.y = y;
    zoom = next;
    place();
    if (centre.x === was.x && centre.y === was.y && zoom === was.zoom) return;
    reported?.(undefined);
  };

  /**
   * A zone over the whole frame, under everything the table draws: it takes every press the table
   * does not. It is framed in map space, so it is re-cut to the frame on every pan and every zoom.
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

  const keyboard = scene.input.keyboard;
  const panning = PAN_KEYS.map((pan) => ({
    x: pan.x,
    y: pan.y,
    keys: pan.keys.map((name) => keyboard?.addKey(name)),
  }));

  scene.events.on(Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
    if (!taking) return;
    let x = 0;
    let y = 0;
    for (const pan of panning) {
      if (!pan.keys.some((key) => key?.isDown === true)) continue;
      x += pan.x;
      y += pan.y;
    }
    if (x === 0 && y === 0) return;
    const step = (PAN_SPEED * delta) / 1000 / zoom / Math.hypot(x, y);
    moveTo(centre.x + x * step, centre.y + y * step, zoom);
  });

  /** Where a tile's face stands on the table, for the panel that floats beside it. */
  const faceOf = (coord: TileCoords): TileFace => {
    const middle = positionOf(coord);
    const on = map.onCanvas(middle.x, middle.y);
    const at = table.at(on.x, on.y);
    return { x: at.x, y: at.y, radius: TILE_SIZE * zoom };
  };

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

  return {
    live(on: boolean): void {
      taking = on;
    },

    render(current: Chronicle): void {
      built.removeAll(true);
      for (const tile of current.tiles) {
        if (tile.building === undefined) continue;
        const { x, y } = positionOf(tile);
        built.add(buildingMark(scene, tile.building).setPosition(x, y));
      }

      intents.removeAll(true);
      for (const unit of current.units) {
        if (unit.faction !== 'enemy' || unit.intent === undefined) continue;
        const { x, y } = positionOf(unit.intent);
        intents.add(
          scene.add
            .polygon(x, y, hexagon(TILE_SIZE - 2), 0, 0)
            .setStrokeStyle(4, FACTION_COLOURS.enemy),
        );
      }

      marks.removeAll(true);
      markers = current.units.map((unit) => {
        const { x, y } = positionOf(unit.tile);
        const marker = unitMark(scene, unit).setPosition(x, y);
        marks.add(marker);
        return marker;
      });
    },

    inspect(found: (inspection: Inspection | undefined) => void): void {
      reported = found;
      const catcher = catcherZone('inspect');
      inspector = catcher;

      /** Where the press landed on the canvas, and the middle the map held then, while it pans. */
      let press: { x: number; y: number; from: { x: number; y: number } } | undefined;
      let panned = false;

      const pan = (pointer: Phaser.Input.Pointer): void => {
        if (press === undefined) return;
        if (!panned && !dragged(scene, pointer)) return;
        panned = true;
        const from = map.at(press.x, press.y);
        const to = map.at(pointer.x, pointer.y);
        moveTo(press.from.x - (to.x - from.x), press.from.y - (to.y - from.y), zoom);
      };

      takePress(scene, catcher, {
        down: (pointer) => {
          press = { x: pointer.x, y: pointer.y, from: { x: centre.x, y: centre.y } };
          panned = false;
        },
        release: (pointer) => {
          press = undefined;
          if (panned) return;
          const at = map.at(pointer.x, pointer.y);
          const on = tileUnder(chronicle, at.x, at.y);
          found(on === undefined ? undefined : { tile: on, at: faceOf(on) });
        },
        abandon: () => {
          press = undefined;
        },
      });

      scene.input.on('pointermove', pan);
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

      const stop = takePress(scene, catcher, {
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
          if (grabbed !== undefined) select(grabbed);
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

      const stop = takePress(scene, catcher, {
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
