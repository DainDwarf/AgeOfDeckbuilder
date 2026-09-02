import Phaser from 'phaser';
import { apply, type Chronicle, type Command, type Target, targetTiles } from '../rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../rules/map';
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
import { createInfoPanel, layersOf } from './infopanel';
import { createMapView } from './map';
import { createOverlay } from './overlay';
import { createPiles } from './piles';
import { createResourceBar } from './resource-bar';
import { text } from './text';
import { createTooltip } from './tooltip';

type Part = { render(chronicle: Chronicle): void };

/** Where the next click on the ringed tile lands: each layer in turn, then the bare ring again. */
function nextLayer(shown: number | undefined, count: number): number | undefined {
  if (shown === undefined) return 0;
  return shown + 1 < count ? shown + 1 : undefined;
}

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
    const { map, ui } = applyDesignSpace(this);

    const parts: Part[] = [];
    const view = createMapView(this, map, this.current);
    const panel = createInfoPanel(this, map);

    /** The ringed tile, and which of its layers the panel is reading — none while it is only ringed. */
    let inspecting: { tile: TileCoords; index: number | undefined } | undefined;

    /** Every state change and every aim goes through here: no inspection outlives one. */
    const dismiss = (): void => {
      inspecting = undefined;
      panel.hide();
      view.markInspected(undefined);
    };

    const perform = (command: Command): void => {
      dismiss();
      this.current = apply(this.current, command);
      for (const part of parts) part.render(this.current);
    };

    view.inspect(
      (found) => {
        const tile = found === undefined ? undefined : tileAt(this.current.tiles, found.tile);
        if (found === undefined || tile === undefined) {
          dismiss();
          return;
        }
        const layers = layersOf(tile, this.current.units);
        const ringed =
          inspecting !== undefined && tileKey(inspecting.tile) === tileKey(tile)
            ? inspecting
            : undefined;
        const index = ringed === undefined ? undefined : nextLayer(ringed.index, layers.length);
        if (index === undefined) panel.hide();
        else panel.show(layers, index, found.at, ringed?.index !== undefined);
        inspecting = { tile: { q: tile.q, r: tile.r }, index };
        view.markInspected(tile);
      },
      () => panel.rescale(),
    );
    this.input.keyboard?.on('keydown-ESC', dismiss);

    const overlay = createOverlay(this, ui, (covered) => view.live(!covered));
    const endTurn = this.addEndTurn(() => perform({ type: 'end-turn' }));
    parts.push(
      view,
      createResourceBar(this, createTooltip(this, ui)),
      createPiles(this, (pile) => overlay.browse(pile, this.current)),
      createHand(
        this,
        ui,
        (index) => perform({ type: 'play', index }),
        (index, targetType, released) => {
          // The aiming catcher lies under the hand and the piles, so the button is the one thing
          // left on the UI that has to be dead for the length of the aim.
          endTurn.live(false);
          dismiss();
          const chosen = (target: Target | undefined): void => {
            endTurn.live(true);
            if (target === undefined) released();
            else perform({ type: 'play', index, target });
          };
          switch (targetType) {
            case 'tile':
              return view.aimTile(
                this.current,
                targetTiles(this.current, this.current.hand[index]),
                chosen,
              );
            case 'unit-tile':
              return view.aimUnitTile(this.current, chosen);
          }
        },
        (id, refusal) => overlay.zoom(id, refusal),
      ),
      endTurn,
      overlay,
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
