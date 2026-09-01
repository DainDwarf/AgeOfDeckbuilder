import type Phaser from 'phaser';
import { buildable, type Chronicle, type Target } from '../rules/chronicle';
import { type BuildingTypeId, type Terrain, type TileCoords, tileKey } from '../rules/map';
import { type Faction, reachable, type UnitTypeId } from '../rules/units';
import { ACCENT, corners, DESIGN_HEIGHT, DESIGN_WIDTH, hexagon } from './design-space';

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

export type MapView = {
  render(chronicle: Chronicle): void;
  /** Aims an order — a unit, then where it lands — until a target is chosen or cancel is called. */
  aimOrder(chronicle: Chronicle, chosen: (target: Target | undefined) => void): () => void;
  /** Aims a building card at the tiles it can build on, until a target is chosen or cancelled. */
  aimBuild(
    chronicle: Chronicle,
    building: BuildingTypeId,
    chosen: (target: Target | undefined) => void,
  ): () => void;
};

function positionOf({ q, r }: TileCoords): { x: number; y: number } {
  return {
    x: DESIGN_WIDTH / 2 + Math.sqrt(3) * TILE_SIZE * (q + r / 2),
    y: DESIGN_HEIGHT / 2 + 1.5 * TILE_SIZE * r,
  };
}

/** A hexagon is exactly the ground closer to its own centre than to any other centre. */
function tileAt(chronicle: Chronicle, x: number, y: number): TileCoords | undefined {
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

/** The ground every aim runs on: a catcher for the presses the table leaves, and a glow to paint. */
function openAim(scene: Phaser.Scene): {
  catcher: Phaser.GameObjects.Zone;
  glow: Phaser.GameObjects.Container;
  close: () => void;
} {
  const catcher = scene.add
    .zone(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
    .setOrigin(0, 0)
    .setDepth(AIM_DEPTH)
    .setName('aim')
    .setInteractive();
  const glow = scene.add.container(0, 0).setDepth(GLOW_DEPTH);
  return {
    catcher,
    glow,
    close: (): void => {
      catcher.destroy();
      glow.destroy();
    },
  };
}

function litTile(scene: Phaser.Scene, coord: TileCoords): Phaser.GameObjects.Polygon {
  const { x, y } = positionOf(coord);
  return scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), LIT, 0.4).setStrokeStyle(2, LIT, 0.9);
}

/**
 * The map and everything standing on it. The terrain is drawn once; the buildings and the units are
 * redrawn on every state change; and a card is aimed here — the rules say which tiles light up,
 * never this file.
 */
export function createMapView(scene: Phaser.Scene, chronicle: Chronicle): MapView {
  const face = hexagon(TILE_SIZE);
  for (const tile of chronicle.tiles) {
    const { x, y } = positionOf(tile);
    scene.add
      .polygon(x, y, face, TERRAIN_COLOURS[tile.terrain])
      .setStrokeStyle(1, OUTLINE)
      .setName(`tile-${tileKey(tile)}`);
  }

  const ring = hexagon(TILE_SIZE - 4);
  for (const coord of chronicle.held) {
    const { x, y } = positionOf(coord);
    scene.add.polygon(x, y, ring, 0, 0).setStrokeStyle(same(coord, chronicle.city) ? 4 : 2, ACCENT);
  }

  const built = scene.add.container(0, 0).setDepth(BUILDING_DEPTH).setName('buildings');
  const layer = scene.add.container(0, 0).setDepth(UNIT_DEPTH);
  let markers: Phaser.GameObjects.Polygon[] = [];

  return {
    render(current: Chronicle): void {
      built.removeAll(true);
      for (const tile of current.tiles) {
        if (tile.building === undefined) continue;
        const { x, y } = positionOf(tile);
        built.add(
          scene.add.polygon(x, y, BUILDING_MARKS[tile.building], BUILT).setStrokeStyle(2, OUTLINE),
        );
      }

      layer.removeAll(true);
      markers = current.units.map((unit) => {
        const { x, y } = positionOf(unit.tile);
        const marker = scene.add
          .polygon(x, y, UNIT_MARKS[unit.stats.id], FACTION_COLOURS[unit.faction])
          .setStrokeStyle(2, OUTLINE);
        layer.add(marker);
        return marker;
      });
    },

    aimOrder(current: Chronicle, chosen: (target: Target | undefined) => void): () => void {
      const { catcher, glow, close } = openAim(scene);

      let selected: number | undefined;
      let landings: TileCoords[] = [];
      let grabbed: number | undefined;
      let pressed = false;

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
        markers[grabbed].setPosition(pointer.worldX, pointer.worldY);
      };

      const finish = (target: Target | undefined): void => {
        scene.input.off('pointermove', drag);
        scene.input.off('pointerup', release);
        close();
        chosen(target);
      };

      // The press is the catcher's, so the hand and the piles keep theirs; the release is the
      // scene's, so a unit dragged over them still comes home.
      const release = (pointer: Phaser.Input.Pointer): void => {
        if (!pressed) return;
        pressed = false;
        const to = tileAt(current, pointer.worldX, pointer.worldY);
        const held = grabbed;
        grabbed = undefined;

        if (held !== undefined) {
          const home = positionOf(current.units[held].tile);
          markers[held].setPosition(home.x, home.y);
          if (to !== undefined && same(to, current.units[held].tile)) return;
        }
        if (selected !== undefined && to !== undefined && landings.some((c) => same(c, to))) {
          finish({ unit: selected, tile: to });
          return;
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

      catcher.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pressed = true;
        const under = tileAt(current, pointer.worldX, pointer.worldY);
        const found =
          under === undefined
            ? -1
            : current.units.findIndex(
                (unit) => unit.faction === 'player' && same(unit.tile, under),
              );
        grabbed = found === -1 ? undefined : found;
        if (grabbed !== undefined) select(grabbed);
      });

      scene.input.on('pointermove', drag);
      scene.input.on('pointerup', release);
      paint();
      return () => finish(undefined);
    },

    aimBuild(
      current: Chronicle,
      building: BuildingTypeId,
      chosen: (target: Target | undefined) => void,
    ): () => void {
      const { catcher, glow, close } = openAim(scene);
      const lit = buildable(current, building);
      for (const coord of lit) glow.add(litTile(scene, coord));

      let pressed = false;

      const finish = (target: Target | undefined): void => {
        scene.input.off('pointerup', release);
        close();
        chosen(target);
      };

      const release = (pointer: Phaser.Input.Pointer): void => {
        if (!pressed) return;
        pressed = false;
        const on = tileAt(current, pointer.worldX, pointer.worldY);
        if (on !== undefined && lit.some((coord) => same(coord, on))) finish({ tile: on });
      };

      catcher.on('pointerdown', () => {
        pressed = true;
      });

      scene.input.on('pointerup', release);
      return () => finish(undefined);
    },
  };
}
