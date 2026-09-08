import Phaser from 'phaser';
import {
  admitted,
  apply,
  beginChronicle,
  type Command,
  cityCommand,
  costOf,
  outcome,
  playable,
  refusalOf,
  type Stage,
  tileCost,
  tileRefusal,
  type UnitCommand,
} from '../rules/chronicle';
import { tileAt, tileKey } from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import type { CardId, Chronicle } from '../rules/state';
import { unitOf } from '../rules/units';
import { createBand } from './band';
import { boundTo } from './bindings';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { EASE, ended, stopAllMotion, stopMotion } from './card-motion';
import { createCityMode } from './city-mode';
import { createDebugConsole } from './debug-console';
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
import { cardsOf, createInfoPanel } from './infopanel';
import { onKeyDown } from './keys';
import { createMapView, type PressedTile } from './map';
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

    /** The tile the ring stands on, and nothing while none is selected; city mode selects none. */
    let selection: PressedTile | undefined;

    /** The tile the infopanel is inspecting and which of its cards it shows. */
    let inspection: { on: PressedTile; card: number } | undefined;

    /** The inspection let go of on its own: the infopanel down, whatever is selected still ringed. */
    const uninspect = (): void => {
      inspection = undefined;
      panel.hide();
    };

    /**
     * Nothing selected and nothing inspected. Every state change goes through here, and so does the
     * hand before it takes the selection: neither verb outlives one, on a tile or on a card.
     */
    const dismiss = (): void => {
      select(undefined);
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

    /**
     * The one place the screen's selection changes: the tile takes the ring, or nothing does, and
     * the card the hand held and the inspection standing on whatever was selected before are let go
     * of. The selection is one thing, a tile or a card.
     */
    const select = (found: PressedTile | undefined): void => {
      if (
        found !== undefined &&
        selection !== undefined &&
        tileKey(found.tile) === tileKey(selection.tile)
      ) {
        return;
      }
      selection = found;
      uninspect();
      hand.unselect();
      view.markSelected(found?.tile);
    };

    /**
     * One step of the inspection on a tile: the next of its cards in the infopanel, and after the
     * last of them the first again. The one place the infopanel is shown.
     */
    const inspect = (on: PressedTile): void => {
      const face = view.drawnAs(on.tile);
      if (face === undefined) {
        uninspect();
        return;
      }
      const cards = cardsOf(
        face.tile,
        face.asStands ? this.current.units : [],
        this.current.rivers,
      );
      const already =
        inspection !== undefined && tileKey(inspection.on.tile) === tileKey(on.tile)
          ? inspection
          : undefined;
      const stepped = already === undefined ? 0 : (already.card + 1) % cards.length;
      panel.show(cards, stepped, on.at, already !== undefined && stepped !== already.card);
      inspection = { on, card: stepped };
    };

    /** Whether city mode is on: a tile click acts on the city instead of selecting the tile. */
    let cityMode = false;

    /**
     * The city acting on the tile a city-mode click landed on: the rules say which command that is,
     * a click they refuse plays nothing and stands its note over the tile instead, and a tile the
     * city has no act on takes the click without a word.
     */
    const act = (found: PressedTile): void => {
      const refusal = tileRefusal(this.current, found.tile);
      if (refusal === undefined) return;
      const command = cityCommand(this.current, found.tile);
      if (command !== undefined) {
        void playOut(command);
        return;
      }
      note.overTile(tileCost(this.current, found.tile), refusal, found.at);
    };

    /**
     * One step or one attack of a unit, chosen on the map: the play-out runs, and the unit is
     * selected again on the tile it now stands on — the one it landed on, or the one it attacked
     * from and never left — so the next command is one more press on a tile the map lights. A
     * press that landed while another command was playing out did nothing, and selects nothing
     * either.
     */
    const commandUnit = async (command: UnitCommand): Promise<void> => {
      await playOut(command);
      if (this.playing) return;
      const on = unitOf(this.current.units, command.unit)?.tile;
      if (on !== undefined) select({ tile: on, at: view.faceOf(on) });
    };

    view.onPress(
      (found, press) => {
        if (cityMode) {
          if (press === 'left') {
            if (found !== undefined) act(found);
          } else if (found === undefined) uninspect();
          else inspect(found);
          return;
        }
        if (
          press === 'left' &&
          found !== undefined &&
          selection !== undefined &&
          tileKey(found.tile) === tileKey(selection.tile) &&
          tileKey(found.tile) === tileKey(this.current.city)
        ) {
          enterCityMode();
          return;
        }
        select(found);
        if (press === 'right' && found !== undefined) inspect(found);
      },
      () => {
        panel.rescale();
        note.rescale();
      },
      (command) => {
        void commandUnit(command);
      },
    );

    /** Whether a window, a browse, a card inspected or the defeat screen stands over the map. */
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
    const hand = createHand(this, ui, {
      play: (index) => {
        void playOut({ type: 'play', index, aim: 'none' });
      },
      dismiss,
      aimTile: (index, card, released) => {
        // The aiming catcher lies under the hand and the piles, so the button is the one thing
        // left on the UI that has to be dead for the length of the aim.
        endTurn.live(false);
        // Nothing changes the chronicle while an aim stands, so the refusal it opens on is still the
        // rules' answer at the press that lands it, and no play is sent for one they would refuse.
        const id = this.current.hand[index];
        const refusal = refusalOf(this.current, id);
        return view.aimTile(
          admitted(this.current, card),
          (tile) => {
            if (!playable(refusal)) {
              note.overTile(costOf(id), refusal, view.faceOf(tile));
              return;
            }
            hand.unselect();
            void playOut({ type: 'play', index, aim: 'tile', tile });
          },
          (found) => {
            const tile = tileAt(this.current.tiles, found.tile);
            const block = tile === undefined ? undefined : card.refuses(this.current, tile);
            if (block === undefined) return;
            note.overTile([], { unaffordable: [], blocked: [block] }, found.at);
          },
          () => {
            endTurn.live(true);
            released();
          },
        );
      },
      aimDiscardPile: (index, released) => {
        // The scrim the window stands on swallows the button, the hand and the piles along with the
        // map, so nothing here has to be put down for the length of this aim.
        return overlay.aimDiscardPile(
          this.current,
          (card) => {
            void playOut({ type: 'play', index, aim: 'discard-pile', card });
          },
          released,
        );
      },
      inspect: (id, refusal) => overlay.inspect(id, refusal),
    });

    /** The menu, from the Menu button or a clean chronicle screen: a selected card is let go first. */
    const menu = (): void => {
      hand.unselect();
      overlay.menu();
    };

    const marks = createCityMode(this, () => {
      leaveCityMode();
    });

    /** City mode raised: what was pending on the chronicle screen is let go of and it passes. */
    const enterCityMode = (): void => {
      if (cityMode) return;
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
      dismiss();
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
     * city mode, an aim, an inspection and a state change all leave it exactly as it stands.
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

    // The one place the city key, the yield key, the inspection key and the back key are answered: a
    // slot of the Controls window listening takes any of them first, whatever it is, and anything
    // standing over the map swallows the other three. Otherwise the back key takes back one thing,
    // the outermost that is up or pending, and only a chronicle screen with nothing on it raises the
    // menu. A second listener that acted on these keys would be a second answer to the one press;
    // the map's own listener answers the pan and zoom keys and no other.
    onKeyDown(this, (press) => {
      if (overlay.binds(press)) return;
      if (boundTo(press, 'city')) {
        if (covered) return;
        if (!leaveCityMode()) enterCityMode();
        return;
      }
      if (boundTo(press, 'yields')) {
        if (!covered) clearOrShowAllYields();
        return;
      }
      if (boundTo(press, 'inspect')) {
        if (covered) return;
        const card = hand.selection();
        if (card !== undefined) overlay.inspect(card.id, card.refusal);
        else if (selection !== undefined) inspect(selection);
        return;
      }
      if (!boundTo(press, 'back')) return;
      if (overlay.back() || hand.unselect()) return;
      if (inspection !== undefined) uninspect();
      else if (selection !== undefined) select(undefined);
      else if (!leaveCityMode()) menu();
    });

    createDebugConsole(this, (veils) => {
      view.showVeils(veils);
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
