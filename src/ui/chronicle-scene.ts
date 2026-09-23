import Phaser from 'phaser';
import { refuses } from '../rules/cards';
import { deckOf } from '../rules/catalogue';
import {
  admitted,
  apply,
  type Command,
  costOf,
  launched,
  outcome,
  refusalOf,
  type UnitCommand,
} from '../rules/chronicle';
import { cityCommand, type ReassignCommand, tileCost, tileRefusal } from '../rules/city';
import { tileAt, tileKey } from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import { leaf, type Stage, walked } from '../rules/stages';
import { type Chronicle, type Cost, onSettlePhase, playable } from '../rules/state';
import { unitOf } from '../rules/units';
import { createBand } from './band';
import { boundTo } from './bindings';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { EASE, ended, stopAllMotion, stopMotion } from './card-motion';
import { resetConsole } from './debug-console';
import {
  addText,
  answersPress,
  COVERED,
  DESIGN_WIDTH,
  holdDesignSpace,
  letGoOfPress,
  MARGIN,
  onClick,
  onHover,
  type Stratum,
  stopsThePointer,
  stratumOf,
  UI_FONT,
} from './design-space';
import { createHand } from './hand';
import { cardsOf, createInfoPanel } from './infopanel';
import { onKeyDown } from './keys';
import type { Choices } from './launch-page';
import { css, LOOK } from './look';
import { createMapView, type PressedTile } from './map';
import { mapOf } from './map-scene';
import { type OpensChronicles, raiseMenu, resetMenu } from './menu-scene';
import { createOverlay } from './overlay';
import { overlayOf } from './overlay-scene';
import { createPiles } from './piles';
import { createRefusalNote, refused, refusedAim } from './refusal-note';
import { createResourceBar } from './resource-bar';
import { createStanding } from './standing';
import { text } from './text';
import { createTooltip } from './tooltip';

type Part = {
  render(chronicle: Chronicle): void;
  /**
   * What this part plays for the stage. For a change or a group holding nothing, nothing means the
   * scene renders it at once; for a group holding stages, nothing means this part renders nothing
   * for it. A part plays a group or the stages it holds, never both.
   */
  play?(stage: Stage): Promise<void> | undefined;
};

const LABEL_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  fontStyle: 'bold',
  color: css(LOOK.ink),
};

export class ChronicleScene extends Phaser.Scene implements OpensChronicles {
  private choices!: Choices;
  private current!: Chronicle;
  /** The play-out running on the chronicle screen as it stands, and nothing while none is. */
  private sequence: symbol | undefined;

  constructor() {
    super('ui');
  }

  init(choices: Choices): void {
    this.choices = choices;
    this.current = this.begin(choices.seed);
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
   * A chronicle on the choices, from the seed it was asked for or from a fresh one, written into the
   * address. The fresh one is the one place entropy enters the game: `src/rules/` draws only from
   * the seed it is handed.
   */
  private begin(seed: number | undefined): Chronicle {
    const { catalogue, region, schedule, deck } = this.choices;
    const drawn = seed ?? (Math.random() * 2 ** 32) | 0;
    const chronicle = launched(catalogue, region, schedule, drawn, deckOf(catalogue, deck));
    const written = new URL(window.location.href);
    written.search = new URLSearchParams({
      content: catalogue.version,
      region,
      schedule,
      deck,
      seed: String(chronicle.seed),
    }).toString();
    window.history.replaceState(window.history.state, '', written);
    return chronicle;
  }

  /**
   * A fresh chronicle on a new seed and the same choices: the restart takes down every object,
   * listener, tween and timer the old chronicle screen left standing, and the play-out it was in
   * the middle of is let go of here, its tail committing nothing.
   */
  newChronicle(): void {
    this.sequence = undefined;
    stopAllMotion(this);
    stopAllMotion(mapOf(this));
    // Queued ahead of the restart below, and a start on a running scene stops it first, so the
    // overlay and the map go down and come back up ahead of this one: the overlay's keyboard plugin
    // ahead of this one's, the map up before this one reaches into it (docs/PHASER.md).
    this.scene.launch('overlay');
    this.scene.launch('map');
    this.scene.restart({ ...this.choices, seed: undefined });
  }

  create(): void {
    const map = mapOf(this);
    const camera = this.cameras.main;
    const stratum = (): Stratum => stratumOf(this.add.layer(), camera);
    const ui = {
      band: stratum(),
      standing: stratum(),
      /** The piles and the resting cards of the hand. */
      resting: stratum(),
      bar: stratum(),
      endTurn: stratum(),
      flight: stratum(),
      lifted: stratum(),
      aimLine: stratum(),
      note: stratum(),
      smallCard: stratum(),
      tooltip: stratum(),
    };
    holdDesignSpace(this, camera);
    stopsThePointer(this, () => 'no button held');
    createBand(this, ui.band);

    /** The one bubble each surface raises: the infopanel's rows on the map, the bar's on the UI. */
    const tooltip = {
      map: createTooltip(map, map.strata.tooltip),
      ui: createTooltip(this, ui.tooltip),
    };

    const parts: Part[] = [];
    const view = createMapView(map, map.strata, this.choices.catalogue, this.current);
    const panel = createInfoPanel(map, map.strata.infopanel, this.choices.catalogue, tooltip.map);
    const note = createRefusalNote(map, map.strata.note);
    // The map's note hears only the presses this scene lets through to the map.
    this.input.on('pointerdown', note.hide);

    /** The tile the ring stands on, and nothing while none is selected. */
    let selection: PressedTile | undefined;

    /** Whether city mode is on: a left click on the selection is the city's act on that tile. */
    let cityMode = false;

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

    // The button and the hand are dead for the whole play-out: a card played or hovered under it would
    // be animated, reverted, and kill the very tweens the stages wait on. A play-out the screen has let
    // go of (a new chronicle begun under it) commits nothing: the objects it was playing on are gone.
    const playOut = async (command: Command): Promise<void> => {
      if (this.sequence !== undefined) return;
      const stages = apply(this.choices.catalogue, this.current, command);
      const running = Symbol('play-out');
      this.sequence = running;

      try {
        endTurn.live(false);
        hand.live(false);
        dismiss();

        for (const stage of walked(stages)) {
          if (this.sequence !== running) return;
          const settles = leaf(stage);
          if (settles) this.current = stage.chronicle;
          const motions: Promise<void>[] = [];
          for (const part of parts) {
            const motion = part.play?.(stage);
            if (motion !== undefined) motions.push(motion);
            else if (settles) part.render(this.current);
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
     * What a claim on the tile selected in city mode asks for, which the tile wears from the moment
     * it is selected. A tile the city holds asks for nothing and a tile it has no act on answers
     * nothing, so neither wears anything; nor does any tile outside city mode.
     */
    const thresholdOn = (found: PressedTile | undefined): Cost | undefined => {
      if (!cityMode || found === undefined) return undefined;
      if (tileRefusal(this.choices.catalogue, this.current, found.tile) === undefined)
        return undefined;
      return tileCost(this.current, found.tile).find(({ resource }) => resource === 'culture');
    };

    /**
     * The one place the screen's selection changes: the tile takes the ring, or nothing does, and
     * the card the hand held, the inspection standing on whatever was selected before and the note
     * over it are let go of. The selection is one thing, a tile or a card.
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
      note.hide();
      uninspect();
      hand.unselect();
      view.markSelected(found?.tile, thresholdOn(found));
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
        this.choices.catalogue,
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

    const act = async (found: PressedTile): Promise<void> => {
      const refusal = tileRefusal(this.choices.catalogue, this.current, found.tile);
      if (refusal === undefined) return;
      const command = cityCommand(this.choices.catalogue, this.current, found.tile);
      if (command === undefined) {
        note.overTile(refused(tileCost(this.current, found.tile), refusal), found.at);
        return;
      }
      await playOut(command);
      if (this.playing) return;
      select({ tile: found.tile, at: view.faceOf(found.tile) });
    };

    const commandUnit = async (command: UnitCommand): Promise<void> => {
      await playOut(command);
      if (this.playing) return;
      const on = unitOf(this.current.units, command.unit)?.tile;
      if (on !== undefined) select({ tile: on, at: view.faceOf(on) });
    };

    /**
     * One population carried onto another tile by a drag in city mode: the play-out runs, and the
     * tile it landed on is selected, so the next press on it is the city's next act there. A drag
     * that landed while another command was playing out did nothing, and selects nothing either.
     */
    const reassign = async (command: ReassignCommand): Promise<void> => {
      await playOut(command);
      if (this.playing) return;
      select({ tile: command.to, at: view.faceOf(command.to) });
    };

    view.onPress(
      (found, press) => {
        switch (press) {
          case 'right':
            if (found === undefined) uninspect();
            else inspect(found);
            return;
          case 'left':
            if (
              found === undefined ||
              selection === undefined ||
              tileKey(found.tile) !== tileKey(selection.tile)
            ) {
              select(found);
              return;
            }
            if (cityMode) void act(found);
            else if (
              this.current.city !== undefined &&
              tileKey(found.tile) === tileKey(this.current.city)
            ) {
              enterCityMode();
            }
            return;
        }
      },
      () => {
        panel.rescale();
        note.rescale();
      },
      (command) => {
        void commandUnit(command);
      },
      (command) => {
        void reassign(command);
      },
    );

    /** Whether the overlay's scrim stands over the screen, and whether a window of the menu does. */
    let covered = false;
    let underMenu = false;
    /** Whether the screen is away: the pointer has left the game for whichever scrim covers it. */
    let away = false;

    /**
     * The screen away under either scrim and back when the last of them falls. The press it holds is
     * let go of after the pointer event that raised the scrim: Phaser's dispatch is synchronous, and
     * a release inside it walks the plugin's lists mid-walk.
     */
    const covering = (): void => {
      const under = covered || underMenu;
      if (under === away) return;
      away = under;
      if (!under) return;
      this.input.emit(COVERED);
      queueMicrotask(() => letGoOfPress(this.game));
    };

    const overlay = createOverlay(
      overlayOf(this),
      this.choices.catalogue,
      (over) => {
        covered = over;
        covering();
      },
      (at) => {
        void playOut({ type: 'take', at });
      },
    );

    const endTurn = this.addEndTurn(ui.endTurn, () => {
      void playOut({ type: 'end-turn' });
    });
    const hand = createHand(this, ui, this.choices.catalogue, {
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
        const refusal = refusalOf(this.choices.catalogue, this.current, id);
        return view.aimTile(
          admitted(this.choices.catalogue, this.current, card),
          (tile) => {
            if (!playable(refusal)) {
              note.overTile(
                refused(costOf(this.choices.catalogue, id), refusal),
                view.faceOf(tile),
              );
              return;
            }
            hand.unselect();
            void playOut({ type: 'play', index, aim: card.aim, tile });
          },
          (found) => {
            const tile = tileAt(this.current.tiles, found.tile);
            const block =
              tile === undefined
                ? undefined
                : refuses(this.choices.catalogue, this.current, card, tile);
            if (block === undefined) return;
            note.overTile(refusedAim(block), found.at);
          },
          () => {
            endTurn.live(true);
            released();
          },
        );
      },
      aimDiscardPile: (index, closed) => {
        // The scrim the window stands on swallows the button, the hand and the piles along with the
        // map, so nothing here has to be put down for the length of this aim.
        return overlay.aimDiscardPile(
          this.current,
          this.current.hand[index],
          (card) => {
            void playOut({ type: 'play', index, aim: 'discard-pile', card });
          },
          closed,
        );
      },
      inspect: (id, refusal) => overlay.inspect(id, refusal),
      inspectNamed: (reference) => overlay.inspectNamed(reference),
    });

    const settleStanding = createStanding(this, ui.standing, {
      name: 'settle-phase',
      colour: LOOK.settlePhase,
      label: text('button.settle-phase'),
    });
    const cityStanding = createStanding(this, ui.standing, {
      name: 'city',
      colour: LOOK.accent,
      label: text('button.city-mode'),
      leave: () => {
        leaveCityMode();
      },
    });

    /**
     * The one place the settle phase's standing is shown or hidden, and a render calls it: the phase
     * ends under the player on the turn's tick, where city mode is only ever left through the two
     * doors below.
     */
    const showSettleStanding = (chronicle: Chronicle): void => {
      settleStanding.show(onSettlePhase(chronicle) && !cityMode);
    };

    /** City mode raised: what was pending on the chronicle screen is let go of and it passes. */
    const enterCityMode = (): void => {
      if (cityMode || this.current.city === undefined) return;
      dismiss();
      cityMode = true;
      cityStanding.show(true);
      showSettleStanding(this.current);
      view.showCityMarks(true);
    };

    /** City mode left, and whether it was on: the one way out, for the key, the chip and the back. */
    const leaveCityMode = (): boolean => {
      if (!cityMode) return false;
      cityMode = false;
      dismiss();
      cityStanding.show(false);
      showSettleStanding(this.current);
      view.showCityMarks(false);
      return true;
    };

    const bar = createResourceBar(
      this,
      ui.bar,
      this.choices.catalogue,
      tooltip.ui,
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

    // The one place the city key, the yield key, the inspection key and the back key are answered.
    // A window on the overlay takes all four ahead of this scene, so nothing here is gated on what
    // stands over the screen; the map's own reader answers the pan and zoom keys.
    onKeyDown(this, (press) => {
      if (boundTo(press, 'city')) {
        if (!leaveCityMode()) enterCityMode();
        return;
      }
      if (boundTo(press, 'yields')) {
        clearOrShowAllYields();
        return;
      }
      if (boundTo(press, 'inspect')) {
        const card = hand.selection();
        if (card !== undefined) overlay.inspect(card.id, card.refusal);
        else if (selection !== undefined) inspect(selection);
        return;
      }
      if (!boundTo(press, 'back')) return;
      if (inspection !== undefined) {
        uninspect();
        return;
      }
      if (hand.unselect()) return;
      if (selection !== undefined) {
        select(undefined);
        return;
      }
      if (!leaveCityMode()) raiseMenu(this);
    });

    resetConsole(this, (veils) => {
      view.showVeils(veils);
    });
    resetMenu(this, (under) => {
      underMenu = under;
      covering();
      // The overlay's own scrim is no cover to the overlay: whatever it raises wipes what stood.
      if (under) overlayOf(this).input.emit(COVERED);
      // The menu takes every key it stands under and offers none of them on, so a pan key held as
      // its window rises would pan on for ever; the overlay lets the two through and freezes nothing.
      view.live(!under);
    });

    parts.push(
      view,
      bar,
      createPiles(this, ui, this.choices.catalogue, (pile) => overlay.browse(pile, this.current)),
      hand,
      endTurn,
      { render: showSettleStanding },
      overlay,
    );
    paint();
  }

  private addEndTurn(on: Stratum, endTurn: () => void): Part & { live(on: boolean): void } {
    const button = answersPress(this.add.rectangle(0, 0, 1, 1, LOOK.accent).setName('end-turn'));
    const label = addText(this, 0, 0, '', LABEL_STYLE)
      .setOrigin(0.5, 0.5)
      .setName('end-turn-label');
    on.layer.add([button, label]);

    // Measured at every label it ever takes, so neither the hover swap, the phase it stands on nor a
    // fourth digit in the turn resizes it.
    let widest = 0;
    for (const reading of [
      text('button.turn', { turn: 8888 }),
      text('button.end-turn'),
      text('button.settle-phase'),
      text('button.end-settle-phase'),
    ]) {
      label.setText(reading);
      widest = Math.max(widest, label.width);
    }
    const width = widest + 56;
    const height = label.height + 24;
    const x = DESIGN_WIDTH - MARGIN - width / 2;
    const y = CARD_BASELINE - CARD_HEIGHT - 14 - height / 2;
    button.setPosition(x, y).setSize(width, height);
    label.setPosition(x, y);

    let turn = 1;
    let settlePhase = false;
    const paint = (): void => {
      button.setFillStyle(settlePhase ? LOOK.settlePhase : LOOK.accent);
      if (settlePhase) {
        label.setText(text(hover.hovered ? 'button.end-settle-phase' : 'button.settle-phase'));
        return;
      }
      label.setText(hover.hovered ? text('button.end-turn') : text('button.turn', { turn }));
    };

    const hover = onHover(button, paint, paint);
    onClick(button, endTurn);

    /** Whether the screen wants the button live, and whether the city it would end the turn of stands. */
    let wanted = true;
    let standing = false;
    const interact = (): void => {
      if (wanted && standing) button.setInteractive();
      else button.disableInteractive();
    };

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
      settlePhase = onSettlePhase(chronicle);
      if (standing !== (chronicle.city !== undefined)) {
        standing = chronicle.city !== undefined;
        interact();
      }
      paint();
    };

    /** The turn rolling over: the label that stood rises out as the next turn's rises in. */
    const roll = async (chronicle: Chronicle): Promise<void> => {
      const carried = addText(this, x, y, label.text, LABEL_STYLE)
        .setOrigin(0.5, 0.5)
        .setName('end-turn-leaving');
      on.layer.add(carried);
      leaving = carried;
      turn = chronicle.turn;
      settlePhase = onSettlePhase(chronicle);
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
        return stage.kind === 'group' && stage.name === 'turn' ? roll(stage.chronicle) : undefined;
      },
      live(on: boolean): void {
        wanted = on;
        interact();
      },
    };
    interact();
    return part;
  }
}
