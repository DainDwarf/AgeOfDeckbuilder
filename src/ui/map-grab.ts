import type Phaser from 'phaser';
import { cityDrag, type ReassignCommand } from '../rules/city';
import type { TileCoords } from '../rules/map';
import { assignedTo, type Chronicle } from '../rules/state';
import { unitAt, unitOf } from '../rules/units';
import { EASE, SLIDE_HOME } from './card-motion';
import { dragged, type Stratum, thingUnder } from './design-space';
import type { MapCamera } from './map-camera';
import { assignedAt, positionOf } from './map-marks';

/**
 * What one left press has hold of on the map — a unit by the number it is named by, or population
 * by the tile it is assigned to — with where the press landed and whether it has come past the slack
 * that tells a drag from a click. A press holds one of them or nothing at all.
 */
type Grab = { readonly from: { x: number; y: number }; dragging: boolean } & (
  | { readonly kind: 'unit'; readonly unit: number }
  | { readonly kind: 'assigned'; readonly tile: TileCoords }
);

/** The mark a press takes hold of: a unit's, or a population's. */
type GrabMark = Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle;

/** What a press reads and lights of the map, which keeps all of it. */
type MapUnderPress = {
  /** The chronicle the map stands on. */
  shown(): Chronicle | undefined;
  /** Whether the map is showing what city mode marks. */
  marking(): boolean;
  /** The tile the map rings. */
  selection(): TileCoords | undefined;
  /** The tile the map draws at this point of its surface, and nothing where it draws none. */
  tileUnder(x: number, y: number): TileCoords | undefined;
  lightUnit(tile: TileCoords | undefined): void;
  /** The marker of the unit of that number, and nothing where the map keeps none. */
  markerOf(unit: number): Phaser.GameObjects.Container | undefined;
  /** The mark drawn on a tile the population stands on, and nothing where none is. */
  assignedMarkOn(tile: TileCoords): Phaser.GameObjects.Rectangle | undefined;
};

/** What the left presses on the map have hold of. */
export type MapGrab = {
  /**
   * Takes the left presses on this catcher. `commandUnitOn` is the step or the attack a release on a
   * tile is for that unit, and says whether it was one; `reassigned` is the population a drag in
   * city mode carries. Called once.
   */
  onPress(
    catcher: Phaser.GameObjects.Zone,
    commandUnitOn: (unit: number, on: TileCoords) => boolean,
    reassigned: (command: ReassignCommand) => void,
  ): void;
  /** Every mark sliding home set there at once. */
  homeAtOnce(): void;
  /** Whatever population a press holds no longer held; a unit held stands. */
  dropPopulation(): void;
};

export function createMapGrab(
  scene: Phaser.Scene,
  map: Stratum,
  frame: MapCamera,
  view: MapUnderPress,
): MapGrab {
  /** What the left press on the map has hold of; nothing while it holds nothing. */
  let grabbed: Grab | undefined;

  /** Each mark a press let go of sliding home: where home is, and the slide. */
  const homing = new Map<
    GrabMark,
    { readonly x: number; readonly y: number; readonly slide: Phaser.Tweens.Tween }
  >();

  /** The mark a press has hold of, and nothing where the map draws none. */
  const markOf = (grab: Grab): GrabMark | undefined => {
    switch (grab.kind) {
      case 'unit':
        return view.markerOf(grab.unit);
      case 'assigned':
        return view.assignedMarkOn(grab.tile);
    }
  };

  /**
   * Where the map draws what a press has hold of standing: the unit on the tile it stands on, the
   * population under the tile it is assigned to.
   */
  const homeOf = (grab: Grab): { x: number; y: number } | undefined => {
    switch (grab.kind) {
      case 'unit': {
        const shown = view.shown();
        const standing = shown === undefined ? undefined : unitOf(shown.units, grab.unit);
        return standing === undefined ? undefined : positionOf(standing.tile);
      }
      case 'assigned':
        return assignedAt(grab.tile);
    }
  };

  /** What a press had hold of sliding home from where it was let go. */
  const slideHome = (grab: Grab): void => {
    const mark = markOf(grab);
    const home = homeOf(grab);
    if (mark === undefined || home === undefined) return;
    const over = (): void => {
      homing.delete(mark);
    };
    const slide = scene.tweens.add({
      targets: mark,
      x: home.x,
      y: home.y,
      duration: SLIDE_HOME,
      ease: EASE,
      onComplete: over,
      onStop: over,
    });
    homing.set(mark, { ...home, slide });
  };

  /** A press taking hold: what it holds, if it is sliding home, stops where it stands. */
  const takeHold = (grab: Grab): void => {
    grabbed = grab;
    const mark = markOf(grab);
    if (mark !== undefined) homing.get(mark)?.slide.stop();
  };

  return {
    onPress(
      catcher: Phaser.GameObjects.Zone,
      commandUnitOn: (unit: number, on: TileCoords) => boolean,
      reassigned: (command: ReassignCommand) => void,
    ): void {
      /** Whether a press has come far enough to be a drag; it stays one once it has. */
      const travelled = (grab: Grab, pointer: Phaser.Input.Pointer): boolean => {
        if (!grab.dragging && !dragged(scene, grab.from, pointer)) return false;
        grab.dragging = true;
        frame.setCarried('left');
        return true;
      };

      const carry = (pointer: Phaser.Input.Pointer): void => {
        if (grabbed === undefined || !travelled(grabbed, pointer)) return;
        const at = map.at(pointer.x, pointer.y);
        markOf(grabbed)?.setPosition(at.x, at.y);
      };
      scene.input.on('pointermove', carry);

      const letGo = (grab: Grab): void => {
        slideHome(grab);
        grabbed = undefined;
        view.lightUnit(view.selection());
      };

      frame.takePress(catcher, {
        down: (pointer) => {
          const shown = view.shown();
          if (shown === undefined) return true;
          const at = map.at(pointer.x, pointer.y);
          const under = view.tileUnder(at.x, at.y);
          if (under === undefined) return true;
          const from = { x: pointer.x, y: pointer.y };
          if (view.marking()) {
            if (!assignedTo(shown, under)) return true;
            takeHold({ kind: 'assigned', tile: under, from, dragging: false });
            return false;
          }
          const standing = unitAt(shown.units, under);
          if (standing?.faction !== 'player') return true;
          takeHold({ kind: 'unit', unit: standing.id, from, dragging: false });
          view.lightUnit(under);
          return false;
        },
        release: (pointer) => {
          const holding = grabbed;
          if (holding === undefined) return;
          if (!holding.dragging) {
            letGo(holding);
            return;
          }
          const at = map.at(pointer.x, pointer.y);
          const on = view.tileUnder(at.x, at.y);
          slideHome(holding);
          grabbed = undefined;
          // After Phaser's dispatch of this release: a hit test inside it refills the list being
          // walked (docs/PHASER.md).
          queueMicrotask(() => {
            const shown = view.shown();
            const landed = thingUnder(scene.game) === catcher ? on : undefined;
            if (landed !== undefined && shown !== undefined) {
              switch (holding.kind) {
                case 'unit':
                  commandUnitOn(holding.unit, landed);
                  break;
                case 'assigned': {
                  const command = cityDrag(shown, holding.tile, landed);
                  if (command !== undefined) {
                    reassigned(command);
                    return;
                  }
                  break;
                }
              }
            }
            view.lightUnit(view.selection());
          });
        },
        abandon: () => {
          if (grabbed !== undefined) letGo(grabbed);
        },
      });
    },

    homeAtOnce(): void {
      for (const [mark, { x, y, slide }] of [...homing]) {
        slide.stop();
        mark.setPosition(x, y);
      }
    },

    dropPopulation(): void {
      // A key leaves the mode under a press still holding population, and the release of that
      // press is a whole scene away: that hold is the mode's and goes with its marks, while a
      // unit's is held outside the mode and stands.
      if (grabbed?.kind === 'assigned') grabbed = undefined;
    },
  };
}
