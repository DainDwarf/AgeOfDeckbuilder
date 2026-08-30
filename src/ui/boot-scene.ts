import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    const x = this.scale.width / 2;
    const y = this.scale.height / 2;

    const corners: number[] = [];
    for (let corner = 0; corner < 6; corner++) {
      const angle = (Math.PI / 3) * corner - Math.PI / 6;
      corners.push(120 * Math.cos(angle), 120 * Math.sin(angle));
    }

    // Phaser draws a Shape's path offset by its display origin, so corners already expressed
    // about their own centre only land on (x, y) at origin 0.
    this.add.polygon(x, y, corners, 0x2f6f4e).setOrigin(0).setStrokeStyle(3, 0x8fd6a8);
    this.add
      .text(x, y + 180, 'Age of Deckbuilder', { fontFamily: 'sans-serif', fontSize: '32px' })
      .setOrigin(0.5);
  }
}
