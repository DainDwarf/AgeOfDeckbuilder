import Phaser from 'phaser';
import type { CardId } from '../rules/cards';
import {
  apply,
  beginChronicle,
  type Chronicle,
  type Command,
  cityCommand,
  outcome,
  RESOURCES,
  type Resource,
  type Stage,
  type Target,
  targetTiles,
  tileCost,
  tileRefusal,
} from '../rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../rules/map';
import { createBand } from './band';
import { boundTo } from './bindings';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { EASE, ended, stopAllMotion, stopMotion } from './card-motion';
import { createCityMode } from './city-mode';
import {
  ACCENT,
  addText,
  applyDesignSpace,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  onHover,
  UI_FONT,
} from './design-space';
import { createHand } from './hand';
import { createInfoPanel, layersOf } from './infopanel';
import { onKeyDown } from './keys';
import { createMapView, type Inspection } from './map';
import { createOverlay } from './overlay';
import { createPiles } from './piles';
import { createRefusalNote } from './refusal-note';
import { createResourceBar } from './resource-bar';
import { text } from './text';
import { createTooltip } from './tooltip';

type Part = {
  render(chronicle: Chronicle): void;
  /** What this part plays for the stage; nothing means the scene renders it at once. */
  play?(stage: Stage): Promise<void> | undefined;
};

const LABEL_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  fontStyle: 'bold',
  color: '#0d1014',
};

/** Where the next click on the ringed tile lands: each layer in turn, then the bare ring again. */
function nextLayer(shown: number | undefined, count: number): number | undefined {
  if (shown === undefined) return 0;
  return shown + 1 < count ? shown + 1 : undefined;
}

export class ChronicleScene extends Phaser.Scene {
  private readonly deck: readonly CardId[];
  private current: Chronicle;
  /** The play-out running on the chronicle screen as it stands, and nothing while none is. */
  private sequence: symbol | undefined;

  constructor(seed: number | undefined, deck: readonly CardId[]) {
    super('chronicle');
    this.deck = deck;
    this.current = this.begin(seed);
  }

  /** The chronicle as it stands, for whoever holds the game through `window.game`. */
  get chronicle(): Chronicle {
    return this.current;
  }

  /** Whether a command is still playing out its stages: the chronicle moves on under it. */
  get playing(): boolean {
    return this.sequence !== undefined;
  }

  /**
   * A chronicle on this chronicle screen's deck, from the seed it was asked for or from a fresh
   * one. The fresh one is the one place entropy enters the game: `src/rules/` draws only from the
   * seed it is handed.
   */
  private begin(seed: number | undefined): Chronicle {
    return beginChronicle(seed ?? (Math.random() * 2 ** 32) | 0, this.deck);
  }

  /**
   * A fresh chronicle on a new seed and the same deck, on a chronicle screen raised from nothing:
   * the scene's restart takes down every object, listener, tween and timer the old chronicle
   * screen left standing. The play-out the old chronicle screen was in the middle of is let go of
   * here, and its tail commits nothing.
   */
  private newChronicle(): void {
    this.sequence = undefined;
    this.current = this.begin(undefined);
    stopAllMotion(this);
    this.scene.restart();
  }

  create(): void {
    const { map, ui } = applyDesignSpace(this);
    createBand(this);

    const parts: Part[] = [];
    const view = createMapView(this, map, this.current);
    const panel = createInfoPanel(this, map);
    const note = createRefusalNote(this, map);

    /** The ringed tile, and which of its layers the panel is reading — none while it is only ringed. */
    let inspecting: { tile: TileCoords; index: number | undefined } | undefined;

    /** Every state change and every aim goes through here: no inspection outlives one. */
    const dismiss = (): void => {
      inspecting = undefined;
      panel.hide();
      view.markInspected(undefined);
    };

    const paint = (): void => {
      for (const part of parts) part.render(this.current);
    };

    /**
     * A command played out, stage by stage: each part is offered the stage, one with no motion for
     * it renders at once, and the next stage waits on every motion the stage did raise. The button
     * and the hand are dead for the whole of it — a card played or hovered under it would be
     * animated and then reverted, and would kill the very tweens the stages are waiting on. The
     * map stays live.
     *
     * However the play-out ends, the tail commits the last stage's chronicle and paints it: it
     * needs no motion to have completed, and a part's render takes down whatever that part left in
     * the air. A play-out the chronicle screen has let go of — a new chronicle was begun under it
     * — commits nothing: the objects it was playing on are gone, and the chronicle it would commit
     * is not the one on the chronicle screen.
     */
    const playOut = async (command: Command): Promise<void> => {
      if (this.sequence !== undefined) return;
      const stages = apply(this.current, command);
      const running = Symbol('play-out');
      this.sequence = running;

      try {
        endTurn.live(false);
        hand.live(false);
        dismiss();

        for (const stage of stages) {
          if (this.sequence !== running) return;
          this.current = stage.chronicle;
          const motions: Promise<void>[] = [];
          for (const part of parts) {
            const motion = part.play?.(stage);
            if (motion === undefined) part.render(this.current);
            else motions.push(motion);
          }
          await Promise.all(motions);
        }
      } finally {
        if (this.sequence === running) {
          this.current = outcome(stages);
          paint();
          hand.live(true);
          endTurn.live(true);
          this.sequence = undefined;
        }
      }
    };

    /** The tile read out: ringed by the click that picks it, then a layer per click after it. */
    const read = (found: Inspection | undefined): void => {
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
    };

    /** Whether city mode is on: a tile click acts on the city instead of reading the tile. */
    let cityMode = false;

    /**
     * The city acting on the tile a city-mode click landed on: the rules say which command that is,
     * a click they refuse plays nothing and stands its note over the tile instead, and a tile the
     * city has no act on takes the click without a word.
     */
    const act = (found: Inspection): void => {
      const refusal = tileRefusal(this.current, found.tile);
      if (refusal === undefined) return;
      const command = cityCommand(this.current, found.tile);
      if (command !== undefined) {
        void playOut(command);
        return;
      }
      note.overTile(tileCost(this.current, found.tile), refusal, found.at);
    };

    view.inspect(
      (found) => {
        if (!cityMode) read(found);
        else if (found !== undefined) act(found);
      },
      () => {
        panel.rescale();
        note.rescale();
      },
    );

    /** Whether a window, a browse, a card zoomed or the defeat screen stands over the map. */
    let covered = false;
    const overlay = createOverlay(
      this,
      ui,
      (over) => {
        covered = over;
        view.live(!over);
      },
      () => this.newChronicle(),
    );

    const endTurn = this.addEndTurn(() => {
      void playOut({ type: 'end-turn' });
    });
    const hand = createHand(
      this,
      ui,
      (index) => {
        void playOut({ type: 'play', index });
      },
      (index, targetType, released) => {
        // The aiming catcher lies under the hand and the piles, so the button is the one thing
        // left on the UI that has to be dead for the length of the aim.
        endTurn.live(false);
        dismiss();
        const chosen = (target: Target | undefined): void => {
          endTurn.live(true);
          if (target === undefined) released();
          else void playOut({ type: 'play', index, target });
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
    );

    /** The menu, from the Menu button or a clean chronicle screen: an armed card is let go of first. */
    const menu = (): void => {
      hand.cancelAim();
      overlay.menu();
    };

    const marks = createCityMode(this, () => {
      leaveCityMode();
    });

    /** City mode raised: what was pending on the chronicle screen is let go of and it passes. */
    const enterCityMode = (): void => {
      if (cityMode) return;
      hand.cancelAim();
      dismiss();
      cityMode = true;
      marks.show(true);
      view.showCityMarks(true);
    };

    /** City mode left, and whether it was on: the one way out, for the key, the chip and the back. */
    const leaveCityMode = (): boolean => {
      if (!cityMode) return false;
      cityMode = false;
      note.hide();
      marks.show(false);
      view.showCityMarks(false);
      return true;
    };

    const bar = createResourceBar(
      this,
      createTooltip(this, ui),
      menu,
      enterCityMode,
      (resource) => {
        toggleYield(resource);
      },
    );

    /**
     * The resources the yield overlay shows, empty while it is off. It is a display and not a mode:
     * city mode, an aim, a tile read and a state change all leave it exactly as it stands.
     */
    let yields = new Set<Resource>();

    const showYields = (): void => {
      view.showYields(yields);
      bar.latch(yields);
    };

    /** One resource in or out of the overlay: the bar's five core readings each toggle their own. */
    const toggleYield = (resource: Resource): void => {
      yields = new Set(yields);
      if (!yields.delete(resource)) yields.add(resource);
      showYields();
    };

    /** The yield key: everything the overlay shows is cleared, or, from nothing, every resource. */
    const clearOrShowAllYields = (): void => {
      yields = yields.size > 0 ? new Set() : new Set(RESOURCES);
      showYields();
    };

    // The one place the city key, the yield key and the back key are answered: a slot of the
    // Controls window listening takes any of them first, whatever it is, and anything standing over
    // the map swallows the city key and the yield key. Otherwise the back key takes back one thing,
    // the outermost that is up or pending, and only a chronicle screen with nothing on it raises the
    // menu. A second listener that acted on these keys would be a second answer to the one press;
    // the map's own listener answers the pan and zoom keys and no other.
    onKeyDown(this, (key) => {
      if (overlay.binds(key)) return;
      if (boundTo(key, 'city')) {
        if (covered) return;
        if (!leaveCityMode()) enterCityMode();
        return;
      }
      if (boundTo(key, 'yields')) {
        if (!covered) clearOrShowAllYields();
        return;
      }
      if (!boundTo(key, 'back')) return;
      if (overlay.back() || hand.cancelAim()) return;
      if (inspecting !== undefined) dismiss();
      else if (!leaveCityMode()) menu();
    });

    parts.push(
      view,
      bar,
      createPiles(this, (pile) => overlay.browse(pile, this.current)),
      hand,
      endTurn,
      overlay,
    );
    paint();
  }

  private addEndTurn(endTurn: () => void): Part & { live(on: boolean): void } {
    const button = this.add.rectangle(0, 0, 1, 1, ACCENT).setName('end-turn').setDepth(20);
    const label = addText(this, 0, 0, '', LABEL_STYLE)
      .setOrigin(0.5, 0.5)
      .setName('end-turn-label')
      .setDepth(21);

    // Measured at both labels, so neither the hover swap nor a fourth digit in the turn resizes it.
    label.setText(text('button.end-turn'));
    const hoveredWidth = label.width;
    label.setText(text('button.turn', { turn: 8888 }));
    const width = Math.max(hoveredWidth, label.width) + 56;
    const height = label.height + 24;
    const x = DESIGN_WIDTH - MARGIN - width / 2;
    const y = CARD_BASELINE - CARD_HEIGHT - 14 - height / 2;
    button.setPosition(x, y).setSize(width, height);
    label.setPosition(x, y);

    let turn = 1;
    const paint = (): void => {
      label.setText(hover.hovered ? text('button.end-turn') : text('button.turn', { turn }));
    };

    const hover = onHover(button, paint, paint);
    onClick(button, endTurn);

    /** The label a roll is carrying off the button; a render owns it and takes it down. */
    let leaving: Phaser.GameObjects.Text | undefined;

    const render = (chronicle: Chronicle): void => {
      stopMotion(this, label);
      if (leaving !== undefined) {
        stopMotion(this, leaving);
        leaving.destroy();
        leaving = undefined;
      }
      label.setPosition(x, y).setAlpha(1);
      turn = chronicle.turn;
      paint();
    };

    /** The turn rolling over: the label that stood rises out as the next turn's rises in. */
    const roll = async (chronicle: Chronicle): Promise<void> => {
      const carried = addText(this, x, y, label.text, LABEL_STYLE)
        .setOrigin(0.5, 0.5)
        .setName('end-turn-leaving')
        .setDepth(21);
      leaving = carried;
      turn = chronicle.turn;
      paint();
      label.setPosition(x, y + 24).setAlpha(0);

      const rolling = { duration: 400, ease: EASE };
      await Promise.all([
        ended(this.tweens.add({ targets: carried, y: y - 24, alpha: 0, ...rolling })),
        ended(this.tweens.add({ targets: label, y, alpha: 1, ...rolling })),
      ]);
      // A render while the roll was in the air took it down and painted the turn it stands on.
      if (leaving === carried) render(chronicle);
    };

    const part = {
      render,
      play(stage: Stage): Promise<void> | undefined {
        return stage.name === 'turn' ? roll(stage.chronicle) : undefined;
      },
      live(on: boolean): void {
        if (on) button.setInteractive({ useHandCursor: true });
        else button.disableInteractive();
        hover.end();
      },
    };
    part.live(true);
    return part;
  }
}
