import Phaser from 'phaser';
import { CARDS } from '../rules/cards';
import { apply, type Chronicle, type Command, type Target } from '../rules/chronicle';
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
  private current: Chronicle;

  constructor(chronicle: Chronicle) {
    super('chronicle');
    this.current = chronicle;
  }

  /** The chronicle as it stands, for whoever holds the game through `window.game`. */
  get chronicle(): Chronicle {
    return this.current;
  }

  create(): void {
    applyDesignSpace(this);

    const parts: Part[] = [];
    const perform = (command: Command): void => {
      this.current = apply(this.current, command);
      for (const part of parts) part.render(this.current);
    };

    const view = createMapView(this, this.current);
    const overlay = createOverlay(this);
    const endTurn = this.addEndTurn(() => perform({ type: 'end-turn' }));
    parts.push(
      view,
      createResourceBar(this),
      createPiles(this, (pile) => overlay.browse(pile, this.current)),
      createHand(
        this,
        (index) => perform({ type: 'play', index }),
        (index, released) => {
          // The aiming catcher lies under the hand and the piles, so the button is the one thing
          // left on the table that has to be dead for the length of the aim.
          endTurn.live(false);
          const chosen = (target: Target | undefined): void => {
            endTurn.live(true);
            if (target === undefined) released();
            else perform({ type: 'play', index, target });
          };
          return CARDS[this.current.hand[index]].kind === 'building'
            ? view.aimBuild(this.current, chosen)
            : view.aimOrder(this.current, chosen);
        },
        (id, refusal) => overlay.zoom(id, refusal),
      ),
      endTurn,
    );
    for (const part of parts) part.render(this.current);
  }

  private addEndTurn(endTurn: () => void): Part & { live(on: boolean): void } {
    const button = this.add.rectangle(0, 0, 1, 1, ACCENT).setName('end-turn').setDepth(20);
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
    button.setPosition(x, y).setSize(width, height);
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

    const part = {
      render(chronicle: Chronicle): void {
        turn = chronicle.turn;
        paint();
      },
      live(on: boolean): void {
        if (on) button.setInteractive({ useHandCursor: true });
        else button.disableInteractive();
        hovered = false;
        paint();
      },
    };
    part.live(true);
    return part;
  }
}
