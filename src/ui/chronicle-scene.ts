import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import { civilizationIn, type Payment } from '../rules/campaign';
import { entersOn, playedThrough, refuses, throughRefusal } from '../rules/cards';
import { type Entering, entered } from '../rules/catalogue';
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
import { type Tile, type TileCoords, tileAt, tileKey } from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import { charted } from '../rules/sight';
import { leaf, type Stage, walked } from '../rules/stages';
import { type Chronicle, type Cost, onSettlePhase, playable } from '../rules/state';
import { type Unit, unitOf } from '../rules/units';
import { createBand } from './band';
import { boundTo, type Press, pressOf } from './bindings';
import { CARD_BASELINE, CARD_HEIGHT, createKindBubble } from './card-face';
import { EASE, ended, stopAllMotion, stopMotion } from './card-motion';
import { closeConsole, offerEntries, resetConsole } from './debug-console';
import {
  addText,
  answersPress,
  awayUnder,
  type Box,
  COVERED,
  holdDesignSpace,
  MARGIN,
  onClick,
  onHover,
  onLetGoOffCanvas,
  type Scrim,
  type Stratum,
  stopsThePointer,
  stratumOf,
  thingUnder,
  UI_FONT,
} from './design-space';
import { createHand } from './hand';
import { cardsOf, createInfoPanel } from './infopanel';
import { onKeyDown, onWheelNotches } from './keys';
import { css, LOOK } from './look';
import { createMapView, type PressedTile } from './map';
import { mapOf } from './map-scene';
import { type LeavesChronicles, raiseMenu, resetMenu } from './menu-scene';
import { createOverlay } from './overlay';
import { overlayAhead, overlayOf } from './overlay-scene';
import { createPiles, TAB_EDGE } from './piles';
import { createPinnedAchievements } from './pinned-achievement';
import { refused, refusedAim } from './refusal-lines';
import { createRefusalNote } from './refusal-note';
import { createResourceBar } from './resource-bar';
import { type Choices, campaignHeld, keepChronicle, type Opening } from './save-entry';
import { createShownEvent } from './shown-event';
import { createSmallCards } from './small-card';
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

/**
 * Every `runtime-error` a command raised, on the console with the group holding it. Content only
 * runs inside a group, so no change outside one is a `runtime-error`.
 */
function logRuntimeErrors(stages: readonly Stage[]): void {
  for (const stage of walked(stages)) {
    if (stage.kind !== 'group') continue;
    for (const held of stage.stages) {
      if (held.name === 'runtime-error') console.error(`runtime-error during ${stage.name}`);
    }
  }
}

/** Where a press landed or was let go: on a thing, on a drawn tile, or beside the things. */
type Place =
  | { readonly kind: 'thing'; readonly on: Phaser.GameObjects.GameObject }
  | { readonly kind: 'tile'; readonly tile: TileCoords }
  | { readonly kind: 'beside' };

function samePlace(one: Place, other: Place): boolean {
  switch (one.kind) {
    case 'thing':
      return other.kind === 'thing' && other.on === one.on;
    case 'tile':
      return other.kind === 'tile' && tileKey(other.tile) === tileKey(one.tile);
    case 'beside':
      return other.kind === 'beside';
  }
}

const LABEL_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  fontStyle: 'bold',
  color: css(LOOK.ink),
};

export class ChronicleScene extends Phaser.Scene implements LeavesChronicles {
  private choices!: Choices;
  private current!: Chronicle;
  /** Whether the screen opened with the console standing as the screen before it left it. */
  private consoleKept!: boolean;
  /** What the chronicle paid into the campaign as it ended, and nothing before it has. */
  private payment: Payment | undefined;
  /**
   * The play-out running on the chronicle screen as it stands, with the chronicle its command
   * leaves, and nothing while none is.
   */
  private sequence: { readonly leaves: Chronicle } | undefined;

  constructor() {
    super('ui');
  }

  init({ resumed, seed, consoleKept, ...choices }: ChronicleStart): void {
    this.choices = choices;
    this.consoleKept = consoleKept === true;
    this.payment = undefined;
    this.current = resumed ?? this.begin(seed);
  }

  /** The chronicle as it stands, for whoever holds the game through `window.game`. */
  get chronicle(): Chronicle {
    return this.current;
  }

  /** The chronicle the rules have left, ahead of the screen while a play-out is still showing it. */
  private get latest(): Chronicle {
    return this.sequence?.leaves ?? this.current;
  }

  /** Whether a command is still playing out its stages: the chronicle moves on under it. */
  get playing(): boolean {
    return this.sequence !== undefined;
  }

  /**
   * A chronicle on the choices, from the seed typed or else a fresh one, kept as the save. The fresh
   * seed is the one place entropy enters the game: `src/rules/` draws only from the seed it is handed.
   */
  private begin(typed: number | undefined): Chronicle {
    const { age, region, civilization } = this.choices;
    const seed = typed === undefined ? (Math.random() * 2 ** 32) | 0 : typed;
    const campaign = campaignHeld();
    const chronicle = launched(
      CATALOGUE,
      age,
      region,
      seed,
      civilizationIn(CATALOGUE, campaign, civilization),
      campaign.technologies,
    );
    keepChronicle(this.choices, chronicle);
    return chronicle;
  }

  /** The play-out the screen was in the middle of let go of, its tail committing nothing. */
  private letGo(): void {
    this.sequence = undefined;
    stopAllMotion(this);
    stopAllMotion(mapOf(this));
  }

  /** The campaign screen opened. */
  leave(): void {
    this.letGo();
    overlayAhead(this.scene);
    this.scene.stop('map');
    this.scene.start('campaign');
  }

  /** A new chronicle on the choices this one was launched on and the seed typed. */
  private launchOn(seed: number): void {
    this.letGo();
    openChronicle(this.scene, { ...this.choices, seed });
  }

  /**
   * The unit entered on the chronicle the rules have left and what it sees charted, kept as the
   * save, and the screen reopened on that chronicle with the console standing.
   */
  private enterUnit(entering: Entering): void {
    const after = charted(CATALOGUE, entered(CATALOGUE, this.latest, entering).chronicle);
    this.letGo();
    keepChronicle(this.choices, after);
    openChronicle(this.scene, { ...this.choices, resumed: after, consoleKept: true });
  }

  create(): void {
    const map = mapOf(this);
    const camera = this.cameras.main;
    const stratum = (): Stratum => stratumOf(this.add.layer(), camera);
    const ui = {
      band: stratum(),
      standing: stratum(),
      pinned: stratum(),
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
    stopsThePointer(
      this,
      () => 'no button held',
      () => true,
    );
    createBand(this, ui.band);

    /** The one bubble each surface raises; the overlay builds its own. */
    const tooltip = {
      map: createTooltip(map, map.strata.tooltip),
      ui: createTooltip(this, ui.tooltip),
    };
    // One of each for the surface's every face, the hand's and the piles': a second bubble would hide
    // the first's as its own goes down, and a second chain would stand a small card beside the first's.
    const kinds = createKindBubble(tooltip.ui);
    const faces = {
      kinds,
      small: createSmallCards(this, ui.smallCard, CATALOGUE, kinds, (name) => {
        overlay.inspectNamed(name);
      }),
    };

    const parts: Part[] = [];
    const veils = this.consoleKept ? closeConsole(this) : resetConsole(this);
    const view = createMapView(map, map.strata, CATALOGUE, this.current, veils);
    const panel = createInfoPanel(map, map.strata.infopanel, CATALOGUE, tooltip.map);
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
    // go of (the screen left for the campaign screen) commits nothing: the objects it was playing on are gone.
    const playOut = async (command: Command): Promise<void> => {
      if (this.sequence !== undefined) return;
      const stages = apply(CATALOGUE, this.current, command);
      logRuntimeErrors(stages);
      const after = outcome(stages);
      if (after !== this.current) this.payment = keepChronicle(this.choices, after);
      const running = { leaves: after };
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
      if (tileRefusal(CATALOGUE, this.current, found.tile) === undefined) return undefined;
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

    /** The unit being aimed let go of: its tile selected no more, the inspection standing. */
    const unaimUnit = (): void => {
      selection = undefined;
      view.markSelected(undefined, undefined);
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
        CATALOGUE,
        face.tile,
        face.asStands ? this.current.units : [],
        this.current.city,
        this.current.rivers,
        (coord) => view.drawnAs(coord)?.tile,
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
      const refusal = tileRefusal(CATALOGUE, this.current, found.tile);
      if (refusal === undefined) return;
      const command = cityCommand(CATALOGUE, this.current, found.tile);
      if (command === undefined) {
        note.overTile(refused(tileCost(this.current, found.tile), refusal), found.at);
        return;
      }
      await playOut(command);
      if (this.playing) return;
      select(view.pressedOn(found.tile));
    };

    const commandUnit = async (command: UnitCommand): Promise<void> => {
      await playOut(command);
      if (this.playing) return;
      const on = unitOf(this.current.units, command.unit)?.tile;
      if (on !== undefined) select(view.pressedOn(on));
    };

    /**
     * One population carried onto another tile by a drag in city mode: the play-out runs, and the
     * tile it landed on is selected, so the next press on it is the city's next act there. A drag
     * that landed while another command was playing out did nothing, and selects nothing either.
     */
    const reassign = async (command: ReassignCommand): Promise<void> => {
      await playOut(command);
      if (this.playing) return;
      select(view.pressedOn(command.to));
    };

    view.onPress(
      (found) => {
        if (selection === undefined || tileKey(found.tile) !== tileKey(selection.tile)) {
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

    const away = awayUnder(this);
    // Either scrim takes every key it stands under and offers none of them on, so a pan key held as
    // it rises would pan on for ever.
    const under = (scrim: Scrim, up: boolean): void => {
      view.live(!away(scrim, up));
    };

    const overlay = createOverlay({
      scene: overlayOf(this),
      catalogue: CATALOGUE,
      covering: (over) => {
        under('overlay', over);
      },
      take: (at) => {
        void playOut({ type: 'take', at });
      },
      paid: () => this.payment,
      leave: () => {
        this.leave();
      },
    });

    const endTurn = this.addEndTurn(ui.endTurn, () => {
      void playOut({ type: 'end-turn' });
    });

    const hand = createHand(this, ui, faces, CATALOGUE, {
      play: (index, aimed) => {
        void playOut({ type: 'play', index, ...aimed });
      },
      dismiss,
      aimTile: (index, card, released, retargeted) => {
        // Nothing changes the chronicle while an aim stands, so the refusal it opens on is still the
        // rules' answer at the press that lands it, and no play is sent for one they would refuse.
        const { id } = this.current.hand[index];
        const refusal = refusalOf(CATALOGUE, this.current, id);
        /** Whether the aim at the tile is coming down for the aim at the unit it is played through. */
        let picking = false;

        /** The aim at a unit, among those the card at this tile could be played through. */
        const throughOne = (played: TileCoords, at: Tile, units: readonly Unit[]): (() => void) =>
          view.aimTile(
            [played, ...units.map((unit) => unit.tile)],
            (tile) => {
              const block = throughRefusal(CATALOGUE, this.current, card, at, tile);
              if (block !== undefined) {
                note.overTile(refusedAim(block), view.faceOf(tile));
                return;
              }
              hand.unselect();
              void playOut({ type: 'play', index, aim: 'tile', tile: played, through: tile });
            },
            (found) => {
              const block = throughRefusal(CATALOGUE, this.current, card, at, found.tile);
              if (block === undefined) return;
              note.overTile(refusedAim(block), found.at);
            },
            released,
          );

        let letGo = view.aimTile(
          admitted(CATALOGUE, this.current, card),
          (tile) => {
            if (!playable(refusal)) {
              note.overTile(refused(costOf(CATALOGUE, id), refusal), view.faceOf(tile));
              return;
            }
            const at = tileAt(this.current.tiles, tile);
            const units = at === undefined ? [] : playedThrough(CATALOGUE, this.current, card, at);
            if (at !== undefined && units.length > 1) {
              picking = true;
              letGo();
              letGo = throughOne(tile, at, units);
              retargeted('unit');
              return;
            }
            hand.unselect();
            void playOut({ type: 'play', index, aim: card.aim, tile });
          },
          (found) => {
            const tile = tileAt(this.current.tiles, found.tile);
            const block =
              tile === undefined ? undefined : refuses(CATALOGUE, this.current, card, tile);
            if (block === undefined) return;
            note.overTile(refusedAim(block), found.at);
          },
          () => {
            if (!picking) released();
          },
        );
        return () => {
          letGo();
        };
      },
      aimDiscardPile: (index, closed) => {
        return overlay.aimDiscardPile(
          this.current,
          this.current.hand[index].id,
          (card) => {
            void playOut({ type: 'play', index, aim: 'discard-pile', card });
          },
          closed,
        );
      },
      inspect: (card) => overlay.inspect(card),
      inspectNamed: (name) => overlay.inspectNamed(name),
    });

    const settleStanding = createStanding(this, ui.standing, {
      name: 'settle-phase',
      colour: LOOK.settlePhase,
      label: text('button.settle-phase'),
    });
    const cityStanding = createStanding(this, ui.standing, {
      name: 'city',
      colour: LOOK.cityMode,
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

    const bar = createResourceBar(this, ui.bar, CATALOGUE, tooltip.ui, {
      cityMode: enterCityMode,
      toggleYield: (resource) => {
        toggleYield(resource);
      },
    });

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

    // Read outside Phaser's dispatch: a hit test inside it refills the list being walked
    // (docs/PHASER.md).
    const placeUnder = (): { readonly place: Place; readonly onMap: boolean } => {
      const on = thingUnder(this.game);
      const onMap = view.placeOf(on);
      if (onMap !== undefined) {
        const { tile } = onMap;
        return {
          place: tile === undefined ? { kind: 'beside' } : { kind: 'tile', tile },
          onMap: true,
        };
      }
      if (on === undefined || bar.isPaper(on)) return { place: { kind: 'beside' }, onMap: false };
      return { place: { kind: 'thing', on }, onMap: false };
    };

    /** The one door every left click takes, after the thing it lands on has answered its own. */
    const leftClicked = (place: Place): void => {
      switch (place.kind) {
        case 'thing':
          if (hand.owns(place.on)) return;
          hand.unaim();
          if (view.unitBeingAimed()) unaimUnit();
          return;
        case 'tile':
          view.click(place.tile);
          return;
        case 'beside':
          dismiss();
          return;
      }
      const unlisted: never = place;
      throw new Error(`no place is ${JSON.stringify(unlisted)}`);
    };

    /** The one door every right click takes, after the thing it lands on has answered its own. */
    const rightClicked = (place: Place): void => {
      switch (place.kind) {
        case 'thing':
          return;
        case 'tile':
          inspect(view.pressedOn(place.tile));
          return;
        case 'beside':
          uninspect();
          return;
      }
      const unlisted: never = place;
      throw new Error(`no place is ${JSON.stringify(unlisted)}`);
    };

    /** Where each press held landed, and whether on the map. */
    const landings = new Map<Press, { readonly place: Place; readonly onMap: boolean }>();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const press = pressOf(pointer);
      if (press === undefined) return;
      queueMicrotask(() => {
        landings.set(press, placeUnder());
      });
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const press = pressOf(pointer);
      if (press === undefined) return;
      // After the map scene's dispatch of this release too, in which the map lets go of what its press
      // took hold of.
      queueMicrotask(() => {
        const from = landings.get(press);
        landings.delete(press);
        if (from === undefined || (from.onMap && view.carried(press))) return;
        const to = placeUnder();
        if (!samePlace(from.place, to.place)) return;
        switch (press) {
          case 'left':
            leftClicked(to.place);
            return;
          case 'right':
            rightClicked(to.place);
            return;
        }
        const unlisted: never = press;
        throw new Error(`no press is ${JSON.stringify(unlisted)}`);
      });
    });
    onLetGoOffCanvas(this, (press) => {
      landings.delete(press);
    });

    // On this scene and not the map's: this one stops the pointer over the hand and the bar, where
    // the wheel still zooms.
    onWheelNotches(this, (notches) => {
      view.zoom(-notches);
    });

    // The one place the city key, the yield key, the inspection key and the back key are answered.
    // A window on the overlay takes every key ahead of this scene, so nothing here is gated on what
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
        const selected = hand.selection();
        if (selected !== undefined) overlay.inspect(selected);
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

    offerEntries(this, {
      seed: {
        reads: () => this.current.seed,
        launch: (seed) => {
          this.launchOn(seed);
        },
      },
      veiled: (thrown) => {
        view.showVeils(thrown);
      },
      unit: {
        reads: () => {
          const chronicle = this.latest;
          return {
            ended: chronicle.ending !== undefined,
            selected: selection?.tile,
            holdsKind: (kind) => Object.hasOwn(CATALOGUE.units, kind),
            holdsScript: (script) => Object.hasOwn(CATALOGUE.scripts, script),
            refusal: (kind, tile) => {
              const at = tileAt(chronicle.tiles, tile);
              if (at === undefined) throw new Error(`no tile of the map is ${tileKey(tile)}`);
              return entersOn(kind).refuses(CATALOGUE, chronicle, at);
            },
          };
        },
        enter: (entering) => {
          this.enterUnit(entering);
        },
      },
    });
    resetMenu(this, (up) => {
      under('menu', up);
      // The overlay's own scrims are no cover to the overlay: whatever rises on them takes down what
      // it covers.
      if (up) overlayOf(this).input.emit(COVERED);
    });

    parts.push(
      view,
      bar,
      createPiles(this, ui, CATALOGUE, faces, {
        browse: (pile) => overlay.browse(pile, this.current),
        inspectNamed: (name) => overlay.inspectNamed(name),
      }),
      hand,
      endTurn,
      createShownEvent(this, ui.endTurn, endTurn.box),
      { render: showSettleStanding },
      createPinnedAchievements(
        this,
        ui.pinned,
        CATALOGUE,
        this.current,
        campaignHeld().pins,
        faces.small,
        (name) => {
          overlay.inspectNamed(name);
        },
      ),
      overlay,
    );
    paint();
  }

  private addEndTurn(
    on: Stratum,
    endTurn: () => void,
  ): Part & {
    live(on: boolean): void;
    readonly box: Box;
  } {
    const button = this.add.rectangle(0, 0, 1, 1, LOOK.button).setName('end-turn');
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
    const x = TAB_EDGE - MARGIN - width / 2;
    const y = CARD_BASELINE - CARD_HEIGHT - 14 - height / 2;
    // Interactive dead or live, so no press reaches the map under it.
    button.setPosition(x, y).setSize(width, height).setInteractive();
    label.setPosition(x, y);

    /** Whether the screen wants the button live, and whether the city it would end the turn of stands. */
    let wanted = true;
    let standing = false;
    const live = (): boolean => wanted && standing;
    answersPress(button, live);

    let turn = 1;
    let settlePhase = false;
    const paint = (): void => {
      button.setFillStyle(settlePhase ? LOOK.settlePhase : LOOK.button);
      const hovered = hover.hovered && live();
      if (settlePhase) {
        label.setText(text(hovered ? 'button.end-settle-phase' : 'button.settle-phase'));
        return;
      }
      label.setText(hovered ? text('button.end-turn') : text('button.turn', { turn }));
    };

    const hover = onHover(button, paint, paint);
    onClick(button, () => {
      if (live()) endTurn();
    });

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
      standing = chronicle.city !== undefined;
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
        paint();
      },
      box: { x: x - width / 2, y: y - height / 2, width, height },
    };
    return part;
  }
}

/** What the chronicle screen starts on: the opening, and whether the console stands as it stood. */
type ChronicleStart = Opening & { readonly consoleKept?: true };

/**
 * The chronicle screen opened on the opening, in place of the screen calling or as the boot's first.
 * The overlay is put ahead and the map started before it: it reaches into both as it is created.
 */
export function openChronicle(
  scenes: Phaser.Scenes.ScenePlugin | Phaser.Scenes.SceneManager,
  opening: ChronicleStart,
): void {
  overlayAhead(scenes);
  // A scene's plugin queues the start, and its own `start` would stop the scene calling it.
  if (scenes instanceof Phaser.Scenes.ScenePlugin) scenes.launch('map');
  else scenes.start('map');
  scenes.start('ui', opening);
}
