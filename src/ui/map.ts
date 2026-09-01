import type Phaser from 'phaser';
import type { Chronicle, Target } from '../rules/chronicle';
import type { Terrain, TileCoords } from '../rules/map';
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

const OUTLINE = 0x0d1014;

/** Pale, not accent: the border rings are already accent, and aiming has to read over them. */
const LIT = 0xf2f6ff;

/** Above the hand and the end-turn button, so aiming an order has the table to itself. */
const AIM_DEPTH = 60;

const UNIT_DEPTH = 3;

export type MapView = {
  render(chronicle: Chronicle): void;
  aim(chronicle: Chronicle, chosen: (target: Target | undefined) => void): void;
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

/**
 * The map and everything standing on it. The terrain is drawn once; the units are redrawn on every
 * state change; and an order is aimed here — the rules say which tiles light up, never this file.
 */
export function createMapView(scene: Phaser.Scene, chronicle: Chronicle): MapView {
  const face = hexagon(TILE_SIZE);
  for (const tile of chronicle.tiles) {
    const { x, y } = positionOf(tile);
    scene.add.polygon(x, y, face, TERRAIN_COLOURS[tile.terrain]).setStrokeStyle(1, OUTLINE);
  }

  const ring = hexagon(TILE_SIZE - 4);
  for (const coord of chronicle.held) {
    const { x, y } = positionOf(coord);
    scene.add.polygon(x, y, ring, 0, 0).setStrokeStyle(same(coord, chronicle.city) ? 4 : 2, ACCENT);
  }

  const centre = positionOf(chronicle.city);
  scene.add.circle(centre.x, centre.y, 4, ACCENT);

  const layer = scene.add.container(0, 0).setDepth(UNIT_DEPTH);
  let markers: Phaser.GameObjects.Polygon[] = [];

  return {
    render(current: Chronicle): void {
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

    aim(current: Chronicle, chosen: (target: Target | undefined) => void): void {
      const catcher = scene.add
        .zone(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
        .setOrigin(0, 0)
        .setDepth(AIM_DEPTH)
        .setInteractive();
      const glow = scene.add.container(0, 0).setDepth(AIM_DEPTH + 1);
      layer.setDepth(AIM_DEPTH + 2);

      let selected: number | undefined;
      let landings: TileCoords[] = [];
      let grabbed: number | undefined;

      const paint = (): void => {
        glow.removeAll(true);
        for (const coord of landings) {
          const { x, y } = positionOf(coord);
          glow.add(
            scene.add.polygon(x, y, hexagon(TILE_SIZE - 2), LIT, 0.4).setStrokeStyle(2, LIT, 0.9),
          );
        }
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
        catcher.destroy();
        glow.destroy();
        layer.setDepth(UNIT_DEPTH);
        chosen(target);
      };

      const select = (index: number): void => {
        selected = index;
        landings = reachable(current.tiles, current.units, current.units[index]);
        paint();
      };

      catcher.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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

      catcher.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        const to = tileAt(current, pointer.worldX, pointer.worldY);
        const held = grabbed;
        grabbed = undefined;

        // Only a press that began on no unit of the player's cancels: a drop nowhere valid
        // returns aiming to bare instead of throwing the card away.
        if (held !== undefined) {
          const home = positionOf(current.units[held].tile);
          markers[held].setPosition(home.x, home.y);
          if (to !== undefined && same(to, current.units[held].tile)) return;
          if (to !== undefined && landings.some((coord) => same(coord, to))) {
            finish({ unit: held, to });
            return;
          }
          selected = undefined;
          landings = [];
          paint();
          return;
        }

        if (selected !== undefined && to !== undefined && landings.some((c) => same(c, to))) {
          finish({ unit: selected, to });
          return;
        }
        finish(undefined);
      });

      scene.input.on('pointermove', drag);
      paint();
    },
  };
}
