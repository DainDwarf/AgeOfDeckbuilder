import Phaser from 'phaser';
import type { Chronicle } from '../rules/chronicle';
import type { Terrain, TileCoords } from '../rules/map';
import { applyDesignSpace, DESIGN_HEIGHT, DESIGN_WIDTH } from './design-space';

const TILE_SIZE = 24;
const HELD_GOLD = 0xd9a441;

const TERRAIN_COLOURS: Record<Terrain, number> = {
  plain: 0x7d9c55,
  forest: 0x2f6f4e,
  hills: 0x9a8555,
  water: 0x3d6d9e,
  urban: 0x8f8f9c,
};

// Phaser reads a polygon's points in min-(0, 0) space; points about their own centre draw
// displaced by half the shape.
function hexagon(size: number): number[] {
  const raw: number[] = [];
  for (let corner = 0; corner < 6; corner++) {
    const angle = (Math.PI / 3) * corner - Math.PI / 6;
    raw.push(size * Math.cos(angle), size * Math.sin(angle));
  }
  const minX = Math.min(...raw.filter((_, i) => i % 2 === 0));
  const minY = Math.min(...raw.filter((_, i) => i % 2 === 1));
  return raw.map((value, i) => (i % 2 === 0 ? value - minX : value - minY));
}

function positionOf({ q, r }: TileCoords): { x: number; y: number } {
  return {
    x: DESIGN_WIDTH / 2 + Math.sqrt(3) * TILE_SIZE * (q + r / 2),
    y: DESIGN_HEIGHT / 2 + 1.5 * TILE_SIZE * r,
  };
}

export class ChronicleScene extends Phaser.Scene {
  private readonly chronicle: Chronicle;

  constructor(chronicle: Chronicle) {
    super('chronicle');
    this.chronicle = chronicle;
  }

  create(): void {
    applyDesignSpace(this);

    const { tiles, city, held } = this.chronicle;

    const face = hexagon(TILE_SIZE);
    for (const tile of tiles) {
      const { x, y } = positionOf(tile);
      this.add.polygon(x, y, face, TERRAIN_COLOURS[tile.terrain]).setStrokeStyle(1, 0x0d1014);
    }

    const ring = hexagon(TILE_SIZE - 4);
    for (const coord of held) {
      const { x, y } = positionOf(coord);
      const isCity = coord.q === city.q && coord.r === city.r;
      this.add.polygon(x, y, ring, 0, 0).setStrokeStyle(isCity ? 4 : 2, HELD_GOLD);
    }

    const { x, y } = positionOf(city);
    this.add.circle(x, y, 4, HELD_GOLD);
  }
}
