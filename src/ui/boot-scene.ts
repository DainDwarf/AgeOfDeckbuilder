import Phaser from 'phaser';
import { addText, applyDesignSpace, DESIGN_HEIGHT, DESIGN_WIDTH } from './design-space';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    applyDesignSpace(this);

    const x = DESIGN_WIDTH / 2;
    const y = DESIGN_HEIGHT / 2;

    const raw: number[] = [];
    for (let corner = 0; corner < 6; corner++) {
      const angle = (Math.PI / 3) * corner - Math.PI / 6;
      raw.push(120 * Math.cos(angle), 120 * Math.sin(angle));
    }
    // Phaser reads a polygon's points in min-(0, 0) space; points about their own centre draw
    // displaced by half the shape.
    const minX = Math.min(...raw.filter((_, i) => i % 2 === 0));
    const minY = Math.min(...raw.filter((_, i) => i % 2 === 1));
    const corners = raw.map((v, i) => (i % 2 === 0 ? v - minX : v - minY));

    this.add.polygon(x, y, corners, 0x2f6f4e).setStrokeStyle(3, 0x8fd6a8);
    addText(this, x, y + 180, 'Age of Deckbuilder', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
    }).setOrigin(0.5);
  }
}
