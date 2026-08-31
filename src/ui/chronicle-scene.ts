import Phaser from 'phaser';
import { apply, type Chronicle } from '../rules/chronicle';
import type { Terrain, TileCoords } from '../rules/map';
import { addText, applyDesignSpace, DESIGN_HEIGHT, DESIGN_WIDTH, UI_FONT } from './design-space';
import { createResourceBar, type ResourceBar } from './resource-bar';
import { text } from './text';

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
  private chronicle: Chronicle;

  constructor(chronicle: Chronicle) {
    super('chronicle');
    this.chronicle = chronicle;
  }

  create(): void {
    applyDesignSpace(this);

    this.drawMap();

    const bar = createResourceBar(this);
    bar.render(this.chronicle);
    this.addEndTurn(bar);
  }

  private drawMap(): void {
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

  private addEndTurn(bar: ResourceBar): void {
    const button = this.add.rectangle(0, 0, 1, 1, HELD_GOLD).setDepth(20);
    const label = addText(this, 0, 0, '', {
      fontFamily: UI_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#0d1014',
    })
      .setOrigin(0.5, 0.5)
      .setDepth(21);

    // Measured at both labels, so neither the hover swap nor a fourth digit in the turn resizes it.
    label.setText(text('button.end-turn'));
    const hoveredWidth = label.width;
    label.setText(text('button.turn', { turn: 8888 }));
    const width = Math.max(hoveredWidth, label.width) + 56;
    const height = label.height + 24;
    const x = DESIGN_WIDTH - 24 - width / 2;
    const y = DESIGN_HEIGHT - 24 - height / 2;
    button.setPosition(x, y).setSize(width, height).setInteractive({ useHandCursor: true });
    label.setPosition(x, y);

    let hovered = false;
    const paint = (): void => {
      label.setText(
        hovered ? text('button.end-turn') : text('button.turn', { turn: this.chronicle.turn }),
      );
    };

    button.on('pointerover', () => {
      hovered = true;
      paint();
    });
    button.on('pointerout', () => {
      hovered = false;
      paint();
    });
    button.on('pointerup', () => {
      this.chronicle = apply(this.chronicle, { type: 'end-turn' });
      bar.render(this.chronicle);
      paint();
    });

    paint();
  }
}
