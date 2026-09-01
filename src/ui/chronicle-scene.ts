import Phaser from 'phaser';
import { apply, type Chronicle, type Command } from '../rules/chronicle';
import { CARD_HEIGHT } from './card-face';
import {
  ACCENT,
  addText,
  applyDesignSpace,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  UI_FONT,
} from './design-space';
import { createHand } from './hand';
import { createMapView } from './map';
import { createOverlay } from './overlay';
import { createPiles } from './piles';
import { createResourceBar } from './resource-bar';
import { text } from './text';

type Part = { render(chronicle: Chronicle): void };

export class ChronicleScene extends Phaser.Scene {
  private chronicle: Chronicle;

  constructor(chronicle: Chronicle) {
    super('chronicle');
    this.chronicle = chronicle;
  }

  create(): void {
    applyDesignSpace(this);

    const parts: Part[] = [];
    const perform = (command: Command): void => {
      this.chronicle = apply(this.chronicle, command);
      for (const part of parts) part.render(this.chronicle);
    };

    const view = createMapView(this, this.chronicle);
    const overlay = createOverlay(this);
    parts.push(
      view,
      createResourceBar(this),
      createPiles(this, (pile) => overlay.browse(pile, this.chronicle)),
      createHand(
        this,
        (index) => perform({ type: 'play', index }),
        (index, released) =>
          view.aim(this.chronicle, (target) => {
            if (target === undefined) released();
            else perform({ type: 'play', index, target });
          }),
        (id, refusal) => overlay.zoom(id, refusal),
      ),
      this.addEndTurn(() => perform({ type: 'end-turn' })),
    );
    for (const part of parts) part.render(this.chronicle);
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
    onClick(button, endTurn);

    return {
      render(chronicle: Chronicle): void {
        turn = chronicle.turn;
        paint();
      },
    };
  }
}
