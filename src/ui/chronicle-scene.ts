import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import type { Choices, Payment } from '../rules/campaign';
import { entersOn, refuses, triedAt } from '../rules/cards';
import { costOf, type Entering, entered } from '../rules/catalogue';
import {
  admitted,
  apply,
  type Command,
  chartedAndRead,
  declaresWar,
  launchedFromCampaign,
  outcome,
  refusalOf,
  type UnitCommand,
} from '../rules/chronicle';
import { cityCommand, type ReassignCommand, tileCost, tileRefusal } from '../rules/city';
import { sameTile, type TileCoords, type TilesBeside, tileAt, tileKey } from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import { leaf, runtimeErrors, type Stage, walked } from '../rules/stages';
import { type Chronicle, type Cost, cityOn, onSettlePhase, playable } from '../rules/state';
import { unitOf } from '../rules/units';
import { tileYield } from '../rules/yields';
import { chronicleScreenAtSpeed } from './animation-speed';
import { createBand, trayNow } from './band';
import { boundTo, type Press, pressOf } from './bindings';
import { createFootBubble } from './card-face';
import { dropWaitedMotion, EASE, ended, stopAllMotion, stopMotion } from './card-motion';
import { createSignButton } from './chrome';
import { createChronicleFaces } from './chronicle-faces';
import { createCityPanel } from './city-panel';
import { offerEntries, resetConsole } from './debug-console';
import {
  awayUnder,
  type Box,
  COVERED,
  holdDesignSpace,
  onClick,
  onHover,
  onLetGoOffCanvas,
  onResize,
  type Scrim,
  type Stratum,
  screenSize,
  stopsThePointer,
  stratumOf,
  thingUnder,
} from './design-space';
import { createDisplayButton } from './display-button';
import { createHand } from './hand';
import { type Card, cardsOf, createInfoPanel } from './infopanel';
import { onKeyDown, onWheel, onWheelNotches } from './keys';
import { createLog } from './log';
import { LOOK } from './look';
import { type AimShown, createMapView, type Drawn, type PressedTile } from './map';
import { mapOf } from './map-scene';
import { createMenuButton, raiseMenu } from './menu';
import { type LeavesChronicles, resetMenu, warnOfWar } from './menu-scene';
import { createOverlay } from './overlay';
import { overlayAhead, overlayOf } from './overlay-scene';
import { countText, createCount, createPiles, nameOver, onCount } from './piles';
import { createPinnedAchievements } from './pinned-achievement';
import { refused, refusedAim } from './refusal-lines';
import { createRefusalNote } from './refusal-note';
import { createResourceBar } from './resource-bar';
import { campaignHeld, keepChronicle, type Opening } from './save-entry';
import { createSmallCards } from './small-card';
import { createStanding } from './standing';
import { createSummary } from './summary';
import { text } from './text';
import { createTooltip, type Tooltip } from './tooltip';

type Part = {
  render(chronicle: Chronicle): void;
  /**
   * What this part plays for the stage. For a change or a group holding nothing, nothing means the
   * scene renders it at once; for a group holding stages, nothing means this part renders nothing
   * for it. A part plays a group or the stages it holds, never both.
   */
  play?(stage: Stage): Promise<void> | undefined;
};

/** Every `runtime-error` among the stages, on the console with the group holding it where one does. */
function logRuntimeErrors(stages: readonly Stage[]): void {
  for (const { during } of runtimeErrors(stages)) {
    console.error(during === undefined ? 'runtime-error' : `runtime-error during ${during}`);
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

/** Whether the bars read their reckoning through the command's play-out: the end of turn's they may not. */
function reckonsThrough(command: Command): boolean {
  switch (command.type) {
    case 'end-turn':
    case 'take':
      return false;
    case 'play':
    case 'move':
    case 'attack':
    case 'assign':
    case 'reassign':
    case 'claim':
      return true;
  }
}

export class ChronicleScene extends Phaser.Scene implements LeavesChronicles {
  private choices!: Choices;
  private current!: Chronicle;
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

  init({ resumed, seed, ...choices }: Opening): void {
    this.choices = choices;
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
    const seed = typed === undefined ? (Math.random() * 2 ** 32) | 0 : typed;
    const { stages, chronicle } = launchedFromCampaign(
      CATALOGUE,
      campaignHeld(),
      this.choices,
      seed,
    );
    logRuntimeErrors(stages);
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
    overlayAhead(this.scene, 'design');
    this.scene.stop('map');
    this.scene.start('campaign');
  }

  /** A new chronicle on the choices this one was launched on and the seed typed. */
  private launchOn(seed: number): void {
    this.letGo();
    openChronicle(this.scene, { ...this.choices, seed });
  }

  create(): void {
    chronicleScreenAtSpeed(this.game.scene);
    const map = mapOf(this);
    const camera = this.cameras.main;
    const stratum = (): Stratum => stratumOf(this.add.layer(), camera);
    const ui = {
      modeFrame: stratum(),
      band: stratum(),
      modeChip: stratum(),
      summary: stratum(),
      pinned: stratum(),
      /** The Menu button and the map's display buttons. */
      corner: stratum(),
      /** The piles and the resting cards of the hand. */
      resting: stratum(),
      /** Under the resource bar's, which hides its top. */
      cityPanel: stratum(),
      bar: stratum(),
      endTurn: stratum(),
      /** The deal window's ribbon and its button, while the window stands minimized. */
      minimized: stratum(),
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
    const band = createBand(this, ui.band);

    /** The one bubble each surface raises; the overlay builds its own. */
    const tooltip = {
      map: createTooltip(map, map.strata.tooltip),
      ui: createTooltip(this, ui.tooltip),
    };
    // One of each for the surface's every face: a second bubble would hide the first's as its own goes
    // down, and a second chain would stand a small card beside the first's.
    const footBubble = createFootBubble(tooltip.ui);

    createMenuButton(this, ui.corner, tooltip.ui);
    const iconsButton = createDisplayButton(
      this,
      ui.corner,
      tooltip.ui,
      { symbol: 'icons-button', at: 'icons', reads: 'button.icons' },
      true,
      (shown) => {
        view.showDiscs(shown);
        reinspect();
      },
    );
    const signsButton = createDisplayButton(
      this,
      ui.corner,
      tooltip.ui,
      { symbol: 'faction-signs-button', at: 'signs', reads: 'button.faction-signs' },
      false,
      (shown) => {
        view.showSigns(shown);
        reinspect();
      },
    );
    const hexGridButton = createDisplayButton(
      this,
      ui.corner,
      tooltip.ui,
      { symbol: 'hex-grid-button', at: 'hexGrid', reads: 'button.hex-grid' },
      false,
      (shown) => {
        view.showHexGrid(shown);
      },
    );

    /** Whether every unit, every city and every camp wears its faction's sign. */
    const signs = (): boolean => signsButton.shown();

    const faces = {
      footBubble,
      small: createSmallCards(this, ui.smallCard, CATALOGUE, signs, footBubble, (name) => {
        overlay.inspectNamed(name);
      }),
      cards: createChronicleFaces(this, ui.resting, CATALOGUE, this.current),
    };

    const parts: Part[] = [];
    const view = createMapView(map, map.strata, CATALOGUE, this.current, {
      discs: iconsButton.shown(),
      signs: signs(),
      hexGrid: hexGridButton.shown(),
    });
    const panel = createInfoPanel(map, map.strata.infopanel, CATALOGUE, tooltip.map, {
      small: faces.small,
      on: ui.smallCard,
      inspect: (name) => {
        overlay.inspectNamed(name);
      },
    });
    const note = createRefusalNote(map, map.strata.note);
    // A press reaches the map only where this scene lets it through.
    note.hearPressesOf(this);
    const summary = createSummary(this, ui.summary, CATALOGUE, tooltip.ui);

    /**
     * The tile selected or the one the selected unit stands on, and nothing while neither is: which
     * of the two is selected is the map's to answer (`unitSelected`).
     */
    let selection: PressedTile | undefined;

    /** Whether city mode is on: a left click on the selection is the city's act on that tile. */
    let cityMode = false;

    /** The tile the infopanel is inspecting, as the map draws it, its cards, and which of them it shows. */
    let inspection: { on: PressedTile; face: Drawn; cards: Card[]; card: number } | undefined;

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

    /** Whether the resource bar and the city's bars read what ending the turn would do. */
    const reckons = (on: boolean): void => {
      bar.live(on);
      cityPanel.live(on);
      view.reckons(on);
    };

    /**
     * The hand, the button and the map's hold live, or, under the deal window minimized, the hand
     * read and the button and the hold dead; Close dressed for whichever it is.
     */
    const liven = (): void => {
      const minimized = overlay.minimized();
      hand.live(minimized ? 'read' : 'live');
      endTurn.live(!minimized);
      cityPanel.dress();
      view.takesHold(!minimized);
    };

    /**
     * The screen standing on the chronicle, every part painted on it, the bar reckoning, and the hand,
     * the button and the map's hold livened.
     */
    const stand = (on: Chronicle): void => {
      this.current = on;
      paint();
      liven();
      reckons(true);
      this.sequence = undefined;
    };

    /** The command played out, and whether its play-out ran to its end: none starts over another. */
    const playOut = async (command: Command): Promise<boolean> => {
      if (this.sequence !== undefined) return false;
      return playStages(apply(CATALOGUE, this.current, command), reckonsThrough(command));
    };

    // The button and the hand are dead for the whole play-out: a card played or hovered under it would
    // be animated, reverted, and kill the very tweens the stages wait on. A play-out the screen has let
    // go of commits nothing from its tail, and answers that it did not run to its end.
    const playStages = async (stages: readonly Stage[], reckoning: boolean): Promise<boolean> => {
      logRuntimeErrors(stages);
      const after = outcome(stages);
      if (after !== this.current) this.payment = keepChronicle(this.choices, after);
      const running = { leaves: after };
      this.sequence = running;
      log.hear(stages);
      let held = false;

      try {
        endTurn.live(false);
        hand.live('dead');
        reckons(reckoning);
        dismiss();

        for (const stage of walked(stages)) {
          if (this.sequence !== running) return false;
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
        held = this.sequence === running;
        if (held) stand(after);
      }
      return held;
    };

    /**
     * The play-out in flight let go of, its skipped lines logged, the screen standing on what it
     * leaves. Its motions are dropped, not stopped: a stop would run what each chains after it over
     * that screen.
     */
    const jumpToEnd = (): void => {
      const running = this.sequence;
      if (running === undefined) return;
      this.sequence = undefined;
      dropWaitedMotion(this);
      dropWaitedMotion(map);
      log.cutShort();
      stand(running.leaves);
    };

    /**
     * A unit entered on the chronicle the rules have left, played as a card's entering plays, what it
     * sees charted and what it meets read as a command's are.
     */
    const enterUnit = (entering: Entering): void => {
      jumpToEnd();
      const { stages } = entered(CATALOGUE, this.current, entering);
      const reckoning = true;
      void playStages(chartedAndRead(CATALOGUE, this.current, stages), reckoning);
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

    /** The summary reading the selection as the map now draws its tile, or down where none stands. */
    const summarise = (): void => {
      const face = selection === undefined ? undefined : view.drawnAs(selection.tile);
      summary.read(
        face === undefined
          ? undefined
          : {
              cards: cardsOn(face),
              unit: view.unitSelected(),
              tile: face.tile,
              yields: tileYield(CATALOGUE, this.current, face.tile, besideOnMap),
            },
      );
    };

    /** The selection standing marked on the map, the unit on its tile where `unit`, and summarised. */
    const markSelection = (unit: boolean): void => {
      view.markSelected(selection?.tile, unit, thresholdOn(selection));
      summarise();
    };

    /**
     * The one place the screen's selection changes: the unit on the tile, or the tile where `unit` is
     * false or the map has no unit to select there, or nothing; and the card the hand held, the
     * inspection standing on whatever was selected before and the note over it are let go of.
     */
    const select = (found: PressedTile | undefined, unit = true): void => {
      if (found !== undefined && view.isSelected(found.tile, unit)) return;
      selection = found;
      note.hide();
      uninspect();
      hand.unselect();
      markSelection(unit);
    };

    /** The unit being aimed let go of: selected no more, the inspection standing. */
    const unaimUnit = (): void => {
      selection = undefined;
      markSelection(false);
    };

    /** Whatever is being aimed let go of, a card or a unit, as a left click on a thing lets it go. */
    const unaimAll = (): void => {
      hand.unaim();
      if (view.unitBeingAimed()) unaimUnit();
    };

    /**
     * One step of the inspection on a tile: the next of its cards in the infopanel, and after the
     * last of them the first again; on a tile it does not stand on yet, the tile's first card, or the
     * first of the tile's own past its unit's where `tileOwn`.
     */
    const inspect = (on: PressedTile, tileOwn: boolean): void => {
      const face = view.drawnAs(on.tile);
      if (face === undefined) {
        uninspect();
        return;
      }
      const cards = cardsOn(face);
      const already =
        inspection !== undefined && tileKey(inspection.on.tile) === tileKey(on.tile)
          ? inspection
          : undefined;
      const opening = tileOwn ? cards.findIndex((card) => card.kind !== 'unit') : 0;
      const stepped = already === undefined ? opening : (already.card + 1) % cards.length;
      panel.show(cards, stepped, on.at, already !== undefined && stepped !== already.card);
      inspection = { on, face, cards, card: stepped };
    };

    /** The faces the map draws, read beside any tile: what a tile's yield is read on. */
    const besideOnMap: TilesBeside = (coord) => view.drawnAs(coord)?.tile;

    /**
     * The cards an inspection steps on a tile the map draws so, as the screen now shows the discs and
     * the signs.
     */
    const cardsOn = (face: Drawn): Card[] =>
      cardsOf(CATALOGUE, face, this.current, besideOnMap, {
        discs: iconsButton.shown(),
        signs: signs(),
      });

    /** The card the infopanel stands read again, as the screen now shows the discs and the signs. */
    const reinspect = (): void => {
      if (inspection === undefined) return;
      inspection = { ...inspection, cards: cardsOn(inspection.face) };
      panel.reread(inspection.cards[inspection.card]);
    };

    const act = async (found: PressedTile): Promise<void> => {
      const refusal = tileRefusal(CATALOGUE, this.current, found.tile);
      if (refusal === undefined) return;
      const command = cityCommand(CATALOGUE, this.current, found.tile);
      if (command === undefined) {
        note.overTile(refused(tileCost(this.current, found.tile), refusal), found.at);
        return;
      }
      if (!(await playOut(command))) return;
      select(view.pressedOn(found.tile));
    };

    /** The press landed, or, where it declares war, the warning raised that lands it gone through. */
    const warnedOrLanded = (command: UnitCommand, land: () => void): void => {
      if (declaresWar(CATALOGUE, this.current, command)) warnOfWar(this, command, land);
      else land();
    };

    const commandUnit = async (command: UnitCommand): Promise<void> => {
      if (!(await playOut(command))) return;
      const on = unitOf(this.current.units, command.unit)?.tile;
      if (on !== undefined) select(view.pressedOn(on));
    };

    /**
     * One population carried onto another tile by a drag in city mode: the play-out runs, and the
     * tile it landed on is selected, so the next press on it is the city's next act there. A drag
     * that landed while another command was playing out did nothing, and selects nothing either.
     */
    const reassign = async (command: ReassignCommand): Promise<void> => {
      if (!(await playOut(command))) return;
      select(view.pressedOn(command.to));
    };

    /**
     * Whether a left click on the tile acts on the selection, the tile selected: the city's act there
     * in city mode, and city mode entered on the player's city's own tile out of it.
     */
    const actsOn = (tile: TileCoords): boolean => {
      if (selection === undefined || view.unitSelected() || !sameTile(tile, selection.tile)) {
        return false;
      }
      if (cityMode) return tileRefusal(CATALOGUE, this.current, tile) !== undefined;
      return cityOn(this.current, tile) === 'player' && entersCityMode();
    };

    view.onPress(
      (found) => {
        if (selection === undefined || !sameTile(found.tile, selection.tile)) select(found);
        else if (actsOn(found.tile)) {
          if (cityMode) void act(found);
          else enterCityMode();
        } else if (view.unitSelected()) select(found, false);
        else select(found);
      },
      actsOn,
      () => {
        panel.rescale();
        note.rescale();
      },
      (command) => {
        warnedOrLanded(command, () => {
          void commandUnit(command);
        });
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
      signs,
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
      minimizing: { on: ui.minimized, tooltip: tooltip.ui, switched: liven },
    });

    const endTurn = this.addEndTurn(ui.endTurn, tooltip.ui, () => {
      void playOut({ type: 'end-turn' });
    });

    const hand = createHand(this, ui, faces, CATALOGUE, {
      play: (key, aimed) => {
        void playOut({ type: 'play', key, ...aimed });
      },
      dismiss,
      aimTile: ({ key, id }, card, released) => {
        // Nothing changes the chronicle while an aim stands, so the refusal it opens on is still the
        // rules' answer at the press that lands it, and no play is sent for one they would refuse.
        const refusal = refusalOf(CATALOGUE, this.current, id);

        /** What the card's play at a tile would give, tile by tile; nothing for a card aimed at a unit. */
        const gives: AimShown['gives'] = (tile, faces) => {
          switch (card.aim) {
            case 'tile':
              return triedAt(CATALOGUE, this.current, card, tile, faces).gives;
            case 'unit':
              return [];
          }
        };

        /** What the card's aim admits, as the map shows what it is aimed at: a tile, or a unit. */
        const shownAs = (admits: TileCoords[]): AimShown => {
          const unaffordable = refusal.unaffordable.length > 0;
          switch (card.aim) {
            case 'tile':
              return { tiles: admits, units: [], gives, unaffordable };
            case 'unit':
              return { tiles: [], units: admits, gives, unaffordable };
          }
        };

        return view.aimTile(
          shownAs(admitted(CATALOGUE, this.current, card)),
          (tile) => {
            if (!playable(refusal)) {
              note.overTile(refused(costOf(CATALOGUE, id), refusal), view.faceOf(tile));
              return;
            }
            hand.unselect();
            void playOut({ type: 'play', key, aim: card.aim, tile });
          },
          (found) => {
            const tile = tileAt(this.current.tiles, found.tile);
            const block =
              tile === undefined ? undefined : refuses(CATALOGUE, this.current, card, tile);
            if (block === undefined) return;
            note.overTile(refusedAim(block), found.at);
          },
          released,
        );
      },
      inspect: (card) => overlay.inspect(this.current, card),
      inspectNamed: (name) => overlay.inspectNamed(name),
    });

    const standingOn = { frame: ui.modeFrame, chip: ui.modeChip };
    const settleStanding = createStanding(this, standingOn, {
      name: 'settle-phase',
      colour: LOOK.settlePhase,
      label: text('button.settle-phase'),
    });
    const cityStanding = createStanding(this, standingOn, { name: 'city', colour: LOOK.cityMode });

    /**
     * The one place the settle phase's standing is shown or hidden, and a render calls it: the phase
     * ends under the player on the turn's tick, where city mode is only ever left through the two
     * doors below.
     */
    const showSettleStanding = (chronicle: Chronicle): void => {
      settleStanding.show(onSettlePhase(chronicle) && !cityMode);
    };

    /** Whether city mode would be raised now, and left now: neither under the deal window minimized. */
    const entersCityMode = (): boolean =>
      !cityMode && !overlay.minimized() && this.current.city !== undefined;
    const leavesCityMode = (): boolean => cityMode && !overlay.minimized();

    /** City mode raised: what was pending on the chronicle screen is let go of and it passes. */
    const enterCityMode = (): void => {
      if (!entersCityMode()) return;
      dismiss();
      cityMode = true;
      cityStanding.show(true);
      cityPanel.show(true);
      showSettleStanding(this.current);
      view.showCityMarks(true);
    };

    /** City mode left, and whether it was left: the one way out, for the key, Close and the back. */
    const leaveCityMode = (): boolean => {
      if (!leavesCityMode()) return false;
      cityMode = false;
      dismiss();
      cityStanding.show(false);
      cityPanel.show(false);
      showSettleStanding(this.current);
      view.showCityMarks(false);
      return true;
    };

    const cityPanel = createCityPanel(this, ui.cityPanel, CATALOGUE, tooltip.ui, {
      civilization: this.choices.civilization,
      leave: () => {
        leaveCityMode();
      },
      leaves: leavesCityMode,
    });

    const bar = createResourceBar(this, ui.bar, CATALOGUE, tooltip.ui, {
      cityMode: enterCityMode,
      entersCityMode,
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
      if (on === undefined || bar.isPaper(on) || band.isPaper(on)) {
        return { place: { kind: 'beside' }, onMap: false };
      }
      return { place: { kind: 'thing', on }, onMap: false };
    };

    /** The one door every left click takes, after the thing it lands on has reacted to its own. */
    const leftClicked = (place: Place): void => {
      switch (place.kind) {
        case 'thing':
          if (hand.owns(place.on)) return;
          unaimAll();
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

    /** The one door every right click takes, after the thing it lands on has reacted to its own. */
    const rightClicked = (place: Place): void => {
      switch (place.kind) {
        case 'thing':
          return;
        case 'tile':
          inspect(
            view.pressedOn(place.tile),
            selection !== undefined && sameTile(selection.tile, place.tile) && !view.unitSelected(),
          );
          return;
        case 'beside':
          uninspect();
          return;
      }
      const unlisted: never = place;
      throw new Error(`no place is ${JSON.stringify(unlisted)}`);
    };

    /**
     * Where each press held landed, whether on the map, and whether under the deal window minimized,
     * where a left click selects and acts on nothing however the window stands at its release.
     */
    const landings = new Map<
      Press,
      { readonly place: Place; readonly onMap: boolean; readonly minimized: boolean }
    >();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const press = pressOf(pointer);
      if (press === undefined) return;
      queueMicrotask(() => {
        landings.set(press, { ...placeUnder(), minimized: overlay.minimized() });
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
            if (!from.minimized) leftClicked(to.place);
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

    onWheel(this, (by, over) => {
      for (const panel of [ledger.scrolls, log.scrolls]) if (panel.under(over)) panel.wheel(by);
    });
    // On this scene and not the map's: this one stops the pointer over the hand and the bar, where
    // the wheel still zooms.
    onWheelNotches(
      this,
      (over) => ![ledger.scrolls, log.scrolls].some((panel) => panel.under(over)),
      (notches) => {
        view.zoom(-notches);
      },
    );

    // A window on the overlay takes every key ahead of this scene, so nothing here is gated on what
    // stands over the screen; the map's own reader reacts to the pan and zoom keys.
    onKeyDown(this, (press) => {
      if (boundTo(press, 'city')) {
        if (!leaveCityMode()) enterCityMode();
        return;
      }
      if (boundTo(press, 'yields')) {
        clearOrShowAllYields();
        return;
      }
      if (boundTo(press, 'icons')) {
        iconsButton.switch();
        return;
      }
      if (boundTo(press, 'inspect')) {
        const selected = hand.selection();
        if (selected !== undefined) overlay.inspect(this.current, selected);
        else if (selection !== undefined) inspect(selection, !view.unitSelected());
        return;
      }
      if (!boundTo(press, 'back')) return;
      if (inspection !== undefined) {
        uninspect();
        return;
      }
      if (overlay.minimized()) {
        overlay.bringBack();
        return;
      }
      if (hand.unselect()) return;
      if (selection !== undefined) {
        select(undefined);
        return;
      }
      if (!leaveCityMode()) raiseMenu(this);
    });

    resetConsole(this);
    offerEntries(this, {
      seed: {
        reads: () => this.current.seed,
        launch: (seed) => {
          this.launchOn(seed);
        },
      },
      veiled: (veils) => {
        view.showVeils(veils);
        summarise();
      },
      unit: {
        reads: () => {
          const chronicle = this.latest;
          return {
            ended: chronicle.ending !== undefined,
            selected: view.unitSelected() ? undefined : selection?.tile,
            holdsKind: (kind) => Object.hasOwn(CATALOGUE.units, kind),
            holdsScript: (script) => Object.hasOwn(CATALOGUE.scripts, script),
            refusal: (kind, tile) => {
              const at = tileAt(chronicle.tiles, tile);
              if (at === undefined) throw new Error(`no tile of the map is ${tileKey(tile)}`);
              return entersOn(kind).refuses(CATALOGUE, chronicle, at, 'player');
            },
          };
        },
        enter: enterUnit,
      },
    });
    resetMenu(this, (up) => {
      under('menu', up);
      // The overlay's own scrims are no cover to the overlay: whatever rises on them takes down what
      // it covers.
      if (up) overlayOf(this).input.emit(COVERED);
    });

    const ledger = createPinnedAchievements(
      this,
      ui.pinned,
      CATALOGUE,
      this.current,
      campaignHeld().pins,
      {
        small: faces.small,
        inspect: (name) => {
          overlay.inspectNamed(name);
        },
        tooltip: tooltip.ui,
        unaim: unaimAll,
        capstone: () => {
          overlay.raiseCapstone(this.current);
        },
      },
    );
    const log = createLog(this, ui.pinned, {
      tooltip: tooltip.ui,
      unaim: unaimAll,
      map: view,
    });

    parts.push(
      // A card added has its face before the piles and the hand read it, and a card banished keeps its
      // face until the hand has let it go.
      { render: faces.cards.fillIn },
      // Ahead of the map, so it asks what the map plays a stage on before the map renders past it.
      log,
      view,
      // After the map, whose faces it reads.
      { render: summarise },
      bar,
      cityPanel,
      createPiles(
        this,
        ui,
        { tooltip: tooltip.ui, cards: faces.cards },
        {
          browse: (pile) => overlay.browse(pile, this.current),
          unaim: unaimAll,
        },
      ),
      hand,
      { render: faces.cards.lose },
      endTurn,
      { render: showSettleStanding },
      ledger,
      overlay,
    );
    paint();

    // A motion runs to the place its target held as it began (`travel`): a play-out a change of
    // shape catches midway lands at once.
    let shaped = screenSize();
    onResize(this, () => {
      const now = screenSize();
      if (now.width === shaped.width && now.height === shaped.height) return;
      shaped = now;
      jumpToEnd();
    });
  }

  private addEndTurn(
    on: Stratum,
    tooltip: Tooltip,
    endTurn: () => void,
  ): Part & { live(on: boolean): void } {
    let box = trayNow().endTurn;
    /** The turn's chip, and nothing on the settle phase, which wears none. */
    let counted: Box | undefined;

    /** Whether the screen wants the button live, and whether the city it would end the turn of stands. */
    let wanted = true;
    let standing = false;
    const live = (): boolean => wanted && standing;
    // Interactive dead or live, so no press reaches the map under it.
    const button = createSignButton(this, 'gold', 'end-turn-button', box, 'end-turn', {
      live,
      reaches: (x, y) => counted !== undefined && onCount(counted, x, y),
    });
    const count = createCount(this, 'end-turn-count');
    const leaving = countText(this).setName('end-turn-leaving').setVisible(false);
    on.layer.add([button.face, button.sign, count.chip, count.number, leaving]);

    let turn = 1;
    let settlePhase = false;

    /** The button and its chip laid where the screen puts them, the chip sized for the number it reads. */
    const lay = (): void => {
      box = trayNow().endTurn;
      button.place(box);
      count.number.setText(String(turn));
      counted = settlePhase ? undefined : count.lay(box, 'right');
      count.chip.setVisible(!settlePhase);
      count.number.setVisible(!settlePhase);
    };
    onResize(this, lay);

    const name = (): void => {
      nameOver(
        tooltip,
        text(settlePhase ? 'button.end-settle-phase' : 'button.end-turn'),
        box,
        counted,
      );
    };
    const hover = onHover(button.face, name, () => {
      tooltip.hide();
    });
    onClick(button.face, () => {
      if (live()) endTurn();
    });

    /** The button standing on the chronicle's phase and turn, a name standing under the pointer read again. */
    const stand = (chronicle: Chronicle): void => {
      const phaseWas = settlePhase;
      turn = chronicle.turn;
      settlePhase = onSettlePhase(chronicle);
      lay();
      button.dress();
      if (!hover.hovered || settlePhase === phaseWas) return;
      tooltip.hide();
      name();
    };

    /** The roll in the air; a render owns it and takes it down. */
    let rolling: object | undefined;

    const render = (chronicle: Chronicle): void => {
      rolling = undefined;
      stopMotion(this, [count.number, leaving]);
      leaving.setVisible(false);
      count.number.setAlpha(1);
      standing = chronicle.city !== undefined;
      stand(chronicle);
    };

    /** The turn rolling over: the number that stood rises out of the chip as the next rises in. */
    const roll = async (chronicle: Chronicle): Promise<void> => {
      const flight = {};
      rolling = flight;
      const stood = settlePhase ? undefined : count.number.text;
      stand(chronicle);
      const { x, y } = count.number;
      leaving
        .setText(stood ?? '')
        .setPosition(x, y)
        .setAlpha(1)
        .setVisible(stood !== undefined);
      count.number.setPosition(x, y + 12).setAlpha(0);

      const motion = { duration: 400, ease: EASE };
      await Promise.all([
        ended(this.tweens.add({ targets: leaving, y: y - 12, alpha: 0, ...motion })),
        ended(this.tweens.add({ targets: count.number, y, alpha: 1, ...motion })),
      ]);
      // A render while the roll was in the air took it down and painted the turn it stands on.
      if (rolling === flight) render(chronicle);
    };

    const part = {
      render,
      play(stage: Stage): Promise<void> | undefined {
        return stage.kind === 'group' && stage.name === 'turn' ? roll(stage.chronicle) : undefined;
      },
      live(on: boolean): void {
        wanted = on;
        button.dress();
      },
    };
    return part;
  }
}

/**
 * The chronicle screen opened on the opening, in place of the screen calling or as the boot's first.
 * The overlay is put ahead and the map started before it: it reaches into both as it is created.
 */
export function openChronicle(
  scenes: Phaser.Scenes.ScenePlugin | Phaser.Scenes.SceneManager,
  opening: Opening,
): void {
  overlayAhead(scenes, 'window');
  // A scene's plugin queues the start, and its own `start` would stop the scene calling it.
  if (scenes instanceof Phaser.Scenes.ScenePlugin) scenes.launch('map');
  else scenes.start('map');
  scenes.start('ui', opening);
}
