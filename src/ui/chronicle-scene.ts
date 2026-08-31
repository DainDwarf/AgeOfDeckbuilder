import Phaser from 'phaser';
import { apply, type Chronicle, type Command } from '../rules/chronicle';
import type { Terrain, TileCoords } from '../rules/map';
import { CARD_HEIGHT } from './card-face';
import {
  ACCENT,
  addText,
  applyDesignSpace,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  hexagon,
  MARGIN,
  UI_FONT,
} from './design-space';
import { createHand } from './hand';
import { createPiles } from './piles';
import { createResourceBar } from './resource-bar';
import { text } from './text';

const TILE_SIZE = 24;

const TERRAIN_COLOURS: Record<Terrain, number> = {
  plain: 0x7d9c55,
  forest: 0x2f6f4e,
  hills: 0x9a8555,
  water: 0x3d6d9e,
  urban: 0x8f8f9c,
};

type Part = { render(chronicle: Chronicle): void };

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

    const parts: Part[] = [];
    const perform = (command: Command): void => {
      this.chronicle = apply(this.chronicle, command);
      for (const part of parts) part.render(this.chronicle);
    };

    parts.push(
      createResourceBar(this),
      createPiles(this),
      createHand(this, (index) => perform({ type: 'play', index })),
      this.addEndTurn(() => perform({ type: 'end-turn' })),
    );
    for (const part of parts) part.render(this.chronicle);
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
      this.add.polygon(x, y, ring, 0, 0).setStrokeStyle(isCity ? 4 : 2, ACCENT);
    }

    const { x, y } = positionOf(city);
    this.add.circle(x, y, 4, ACCENT);
  }

  private addEndTurn(endTurn: () => void): Part {
    const button = this.add.rectangle(0, 0, 1, 1, ACCENT).setDepth(20);
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
    const x = DESIGN_WIDTH - MARGIN - width / 2;
    const y = DESIGN_HEIGHT - (MARGIN + CARD_HEIGHT + 14) - height / 2;
    button.setPosition(x, y).setSize(width, height).setInteractive({ useHandCursor: true });
    label.setPosition(x, y);

    let hovered = false;
    let turn = 1;
    const paint = (): void => {
      label.setText(hovered ? text('button.end-turn') : text('button.turn', { turn }));
    };

    button.on('pointerover', () => {
      hovered = true;
      paint();
    });
    button.on('pointerout', () => {
      hovered = false;
      paint();
    });
    button.on('pointerup', endTurn);

    return {
      render(chronicle: Chronicle): void {
        turn = chronicle.turn;
        paint();
      },
    };
  }
}
