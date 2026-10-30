import type Phaser from 'phaser';
import { preparedAs } from '../rules/enemies';
import { type ImprovementId, type Tile, type TileCoords, tileAt, tileKey } from '../rules/map';
import { type Change, type Group, type Stage, walked } from '../rules/stages';
import type { Chronicle } from '../rules/state';
import { type Unit, unitAt } from '../rules/units';
import { EASE, ended } from './card-motion';
import {
  asBuilding,
  asFeature,
  asTerrain,
  type Mark,
  positionOf,
  ROW_RISE,
  rowOf,
  type TileObjects,
  type UnitObjects,
} from './map-marks';
import { asPainted } from './pool';

/** What a stage's motion reads and repaints of the map, which keeps all of it. */
type MapInMotion = {
  readonly features: Phaser.GameObjects.Layer;
  readonly improvements: Phaser.GameObjects.Layer;
  readonly built: Phaser.GameObjects.Layer;
  /** The chronicle the map stands on. */
  shown(): Chronicle | undefined;
  /** What the map draws live of that chronicle, by tile key. */
  live(): ReadonlySet<string>;
  /** What the map draws live of this chronicle, by tile key. */
  liveOn(chronicle: Chronicle): ReadonlySet<string>;
  /** The face the map draws of a tile on the chronicle it stands on. */
  drawnOf(tile: Tile): { readonly tile: Tile } | undefined;
  /** The face the map draws of a tile on this chronicle, and the way to paint that tile whole. */
  faceOn(chronicle: Chronicle, tile: Tile): { readonly tile: Tile; paint(): Mark[] } | undefined;
  tileObjects(key: string): TileObjects;
  unitObjects(id: number): UnitObjects | undefined;
  /** These units of this chronicle painted, and their markers. */
  paintArrivals(chronicle: Chronicle, units: readonly Unit[]): Phaser.GameObjects.Container[];
  paintHue(unit: Unit): Phaser.GameObjects.Polygon;
  improvementOn(improvement: ImprovementId, key: string): Phaser.GameObjects.Polygon;
  /** A face from the pool the terrain crossfades on. */
  crossfade(): Phaser.GameObjects.Polygon;
  render(chronicle: Chronicle): void;
  hold(tiles: readonly TileCoords[]): Promise<void> | undefined;
};

/** The stages the map plays. */
export type MapMotion = {
  /** Nothing answered is the scene's word to render the stage itself. */
  play(stage: Stage): Promise<void> | undefined;
  /** What the map has in the air taken down: its settle paints nothing. */
  takeDown(): void;
};

export function createMapMotion(scene: Phaser.Scene, view: MapInMotion): MapMotion {
  /** What the map has in the air; a render takes it down. */
  let flight: symbol | undefined;

  /** Takes the map for one stage's motion, and hands back the token that settles it. */
  const takeOff = (): symbol => {
    const token = Symbol('motion');
    flight = token;
    return token;
  };

  const settle = (token: symbol, chronicle: Chronicle): void => {
    // A render while this was in the air took it down and painted the map it stands on.
    if (flight === token) view.render(chronicle);
  };

  /** What the map keeps of the unit standing on a tile, and nothing where it shows none. */
  const objectsOn = (coord: TileCoords): UnitObjects | undefined => {
    const shown = view.shown();
    const standing = shown === undefined ? undefined : unitAt(shown.units, coord);
    const own = standing === undefined ? undefined : view.unitObjects(standing.id);
    return own?.marker.visible === true ? own : undefined;
  };

  /** The marker standing on a tile, and nothing where the map shows none. */
  const markerOn = (coord: TileCoords): Phaser.GameObjects.Container | undefined =>
    objectsOn(coord)?.marker;

  /** A unit's marker bumped where it stands, as an attack's target is. */
  const bump = (marker: Phaser.GameObjects.Container, delay: number): Promise<void> =>
    ended(
      scene.tweens.add({
        targets: marker,
        scale: 1.35,
        delay,
        duration: 60,
        ease: EASE,
        yoyo: true,
      }),
    );

  /** Whatever the map drew shrinking to nothing where it stands. */
  const shrink = (
    target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    duration: number,
  ): Promise<void> => ended(scene.tweens.add({ targets: target, scale: 0, duration, ease: EASE }));

  /** The hue a tile wears for the enemy standing on it, and nothing where the map shows none. */
  const hueOn = (coord: TileCoords): Phaser.GameObjects.Polygon | undefined => {
    const hue = objectsOn(coord)?.hue;
    return hue?.visible === true ? hue : undefined;
  };

  /** A unit's marker and the hue its tile wears for it: what goes with the unit. */
  const withHue = (
    coord: TileCoords,
    marker: Phaser.GameObjects.Container,
  ): Phaser.GameObjects.GameObject[] => {
    const hue = hueOn(coord);
    return hue === undefined ? [marker] : [marker, hue];
  };

  /** What a target does: a bump where it was attacked, and a shrink off the map if it was killed. */
  const bumped = async (
    coord: TileCoords,
    marker: Phaser.GameObjects.Container,
    killed: boolean,
    token: symbol,
  ): Promise<void> => {
    await bump(marker, 150);
    if (!killed || flight !== token) return;
    await shrink(withHue(coord, marker), 200);
  };

  /** One attack: the attacker lunges halfway at the tile it aimed at, and what stands there takes it. */
  const attack = (
    attacker: TileCoords,
    target: TileCoords,
    chronicle: Chronicle,
  ): Promise<void> | undefined => {
    const lunging = markerOn(attacker);
    if (lunging === undefined) return undefined;
    const hit = markerOn(target);
    const token = takeOff();

    const from = positionOf(attacker);
    const to = positionOf(target);
    const lunge = ended(
      scene.tweens.add({
        targets: lunging,
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        duration: 150,
        ease: EASE,
        yoyo: true,
      }),
    );
    const taken =
      hit === undefined
        ? Promise.resolve()
        : bumped(target, hit, unitAt(chronicle.units, target) === undefined, token);

    return Promise.all([lunge, taken]).then(() => settle(token, chronicle));
  };

  /** One enemy's move: its marker slides from the tile it left to the one it reached. */
  const slide = (
    from: TileCoords,
    to: TileCoords,
    chronicle: Chronicle,
  ): Promise<void> | undefined => {
    const marker = markerOn(from);
    if (marker === undefined) return undefined;
    const token = takeOff();
    const at = positionOf(to);

    return ended(
      scene.tweens.add({ targets: marker, x: at.x, y: at.y, duration: 350, ease: EASE }),
    ).then(() => settle(token, chronicle));
  };

  /** The units the chronicle draws live standing on tiles the map shows none on. */
  const arrivals = (chronicle: Chronicle): Unit[] => {
    const standing = new Set((view.shown()?.units ?? []).map((unit) => tileKey(unit.tile)));
    const watched = view.liveOn(chronicle);
    return chronicle.units.filter(
      (unit) => watched.has(tileKey(unit.tile)) && !standing.has(tileKey(unit.tile)),
    );
  };

  /** The arrival: every unit the map was not already showing grows onto its tile. */
  const arriving = (chronicle: Chronicle): Promise<void> | undefined => {
    const arrived = arrivals(chronicle);
    if (arrived.length === 0) return undefined;

    const token = takeOff();
    const entering = view.paintArrivals(chronicle, arrived).map((marker) => marker.setScale(0));

    return ended(scene.tweens.add({ targets: entering, scale: 1, duration: 250, ease: EASE })).then(
      () => settle(token, chronicle),
    );
  };

  /**
   * The frame brought to hold the tiles, and the motion once it does. A pan paints nothing, so a
   * motion that had nothing to animate after one is rendered here — the scene renders only the
   * stages the map answers nothing for.
   */
  const heldThen = (
    tiles: readonly TileCoords[],
    chronicle: Chronicle,
    motion: () => Promise<void> | undefined,
  ): Promise<void> | undefined => {
    const panning = view.hold(tiles);
    if (panning === undefined) return motion();
    return panning.then(() => {
      const played = motion();
      if (played === undefined) view.render(chronicle);
      return played;
    });
  };

  /** The unit on a tile damaged or healed by no attacker: its marker bumps as an attack's target does. */
  const bumpedOn = (coord: TileCoords, chronicle: Chronicle): Promise<void> | undefined => {
    const marker = markerOn(coord);
    if (marker === undefined) return undefined;
    const token = takeOff();
    return bump(marker, 0).then(() => settle(token, chronicle));
  };

  /** The unit on a tile killed by no attacker: its marker shrinks off the map as one an attack killed does. */
  const killedOn = (coord: TileCoords, chronicle: Chronicle): Promise<void> | undefined => {
    const marker = markerOn(coord);
    if (marker === undefined) return undefined;
    const token = takeOff();
    return shrink(withHue(coord, marker), 200).then(() => settle(token, chronicle));
  };

  /** A tile's hue coming as the unit on it prepares, and going as what it prepared lands. */
  const preparedOn = (coord: TileCoords, chronicle: Chronicle): Promise<void> | undefined => {
    const standing = unitAt(chronicle.units, coord);
    const worn = hueOn(coord);
    if (standing !== undefined && preparedAs(chronicle, standing) !== undefined) {
      if (worn !== undefined) return undefined;
      const token = takeOff();
      return fadeIn([view.paintHue(standing)]).then(() => settle(token, chronicle));
    }
    if (worn === undefined) return undefined;
    const token = takeOff();
    return ended(scene.tweens.add({ targets: worn, alpha: 0, duration: 250, ease: EASE })).then(
      () => settle(token, chronicle),
    );
  };

  /** A mark raised from nothing, where it stands on the face a change leaves. */
  const scaleUp = (mark: Phaser.GameObjects.Polygon, x: number, y: number): Promise<void> => {
    asPainted(mark).setPosition(x, y).setScale(0);
    return ended(scene.tweens.add({ targets: mark, scale: 1, duration: 250, ease: EASE }));
  };

  /** Whatever is painted rising out of nothing: what a tile newly drawn fades in with. */
  const fadeIn = (painted: readonly Mark[]): Promise<void> => {
    for (const object of painted) object.setAlpha(0);
    return ended(scene.tweens.add({ targets: painted, alpha: 1, duration: 400, ease: EASE }));
  };

  /**
   * The motion between two faces of one tile, and nothing where they are alike. The terrain
   * crossfades from the start; the marks gone shrink, then the marks staying slide to their slots on
   * the new face, then the marks come scale up in theirs.
   */
  const between = (
    coord: TileCoords,
    from: Tile,
    to: Tile,
  ): ((token: symbol) => Promise<void>) | undefined => {
    const key = tileKey(coord);
    const own = view.tileObjects(key);
    const { x, y } = positionOf(coord);
    const was = rowOf(from, x);
    const is = rowOf(to, x);

    /** A mark the map drew that goes, or that stays and slides to `to`. */
    const drawnMarks: { on: Phaser.GameObjects.Layer; name: string; to: number | undefined }[] = [];
    const come: { make: () => Phaser.GameObjects.Polygon; x: number; y: number }[] = [];
    const compare = <Id extends string>(
      on: Phaser.GameObjects.Layer,
      name: (id: Id) => string,
      make: (id: Id) => Phaser.GameObjects.Polygon,
      markY: number,
      before: { ids: readonly Id[]; xs: readonly number[] },
      after: { ids: readonly Id[]; xs: readonly number[] },
    ): void => {
      for (const id of new Set([...before.ids, ...after.ids])) {
        const at = before.ids.indexOf(id);
        const next = after.ids.indexOf(id);
        if (next < 0) drawnMarks.push({ on, name: name(id), to: undefined });
        else if (at < 0) come.push({ make: () => make(id), x: after.xs[next], y: markY });
        else if (before.xs[at] !== after.xs[next]) {
          drawnMarks.push({ on, name: name(id), to: after.xs[next] });
        }
      }
    };
    const one = <Id extends string>(id: Id | undefined): Id[] => (id === undefined ? [] : [id]);
    compare(
      view.features,
      () => `feature-${key}`,
      (id) => asFeature(own.feature, id),
      y - ROW_RISE,
      { ids: one(from.feature), xs: [was.feature] },
      { ids: one(to.feature), xs: [is.feature] },
    );
    compare(
      view.improvements,
      (id) => `improvement-${id}-${key}`,
      (id) => view.improvementOn(id, key),
      y - ROW_RISE,
      { ids: from.improvements, xs: was.improvements },
      { ids: to.improvements, xs: is.improvements },
    );
    compare(
      view.built,
      () => `building-${key}`,
      (id) => asBuilding(own.building, id),
      y,
      { ids: one(from.building), xs: [x] },
      { ids: one(to.building), xs: [x] },
    );

    const crossfades = from.terrain !== to.terrain;
    if (!crossfades && drawnMarks.length === 0 && come.length === 0) return undefined;

    return async (token) => {
      let crossing = Promise.resolve();
      if (crossfades) {
        crossing = fadeIn([asTerrain(view.crossfade(), to.terrain).setPosition(x, y)]);
      }
      const drawn = drawnMarks.map((mark) => ({
        to: mark.to,
        object: mark.on.list.find(
          (object) => object.name === mark.name && (object as Mark).visible,
        ),
      }));
      await Promise.all(
        drawn.flatMap(({ to: slot, object }) =>
          object !== undefined && slot === undefined ? [shrink(object, 250)] : [],
        ),
      );
      if (flight === token) {
        await Promise.all(
          drawn.flatMap(({ to: slot, object }) =>
            object !== undefined && slot !== undefined
              ? [ended(scene.tweens.add({ targets: object, x: slot, duration: 150, ease: EASE }))]
              : [],
          ),
        );
      }
      if (flight === token) {
        await Promise.all(come.map((mark) => scaleUp(mark.make(), mark.x, mark.y)));
      }
      await crossing;
    };
  };

  /**
   * A change on a tile: the difference between the face the map draws of it on the chronicle it
   * stands on and the face it draws on the change's, played after the pan that holds the tile. A
   * tile newly drawn fades in whole; one drawn alike on both, or on neither, plays nothing.
   */
  const tileChanged = (coord: TileCoords, chronicle: Chronicle): Promise<void> | undefined => {
    const leaves = tileAt(chronicle.tiles, coord);
    const shown = view.shown();
    const stood = shown === undefined ? undefined : tileAt(shown.tiles, coord);
    if (leaves === undefined) return undefined;
    const to = view.faceOn(chronicle, leaves);
    if (to === undefined) return undefined;
    const from = stood === undefined ? undefined : view.drawnOf(stood);

    const motion =
      from === undefined ? () => fadeIn(to.paint()) : between(coord, from.tile, to.tile);
    if (motion === undefined) return undefined;
    return heldThen([coord], chronicle, () => {
      const token = takeOff();
      return motion(token).then(() => settle(token, chronicle));
    });
  };

  /**
   * One stage on units: the frame comes to hold the tiles it plays on, and the motion starts once it
   * does. A stage with no tile drawn live on the map as it stands or on the chronicle it leaves moves
   * neither marker nor frame and is answered with nothing, so the scene renders the state it ends on.
   */
  const staged = (
    tiles: readonly TileCoords[],
    chronicle: Chronicle,
    motion: () => Promise<void> | undefined,
  ): Promise<void> | undefined => {
    const live = view.live();
    const watched = view.liveOn(chronicle);
    const plays = tiles.some((tile) => live.has(tileKey(tile)) || watched.has(tileKey(tile)));
    if (!plays) return undefined;
    return heldThen(tiles, chronicle, motion);
  };

  const changed = (stage: Change): Promise<void> | undefined => {
    switch (stage.name) {
      case 'move':
        return staged([stage.from, stage.to], stage.chronicle, () =>
          slide(stage.from, stage.to, stage.chronicle),
        );
      case 'enter':
        return staged(
          arrivals(stage.chronicle).map((unit) => unit.tile),
          stage.chronicle,
          () => arriving(stage.chronicle),
        );
      case 'damaged':
      case 'healed':
        return staged([stage.tile], stage.chronicle, () => bumpedOn(stage.tile, stage.chronicle));
      case 'killed':
        return staged([stage.tile], stage.chronicle, () => killedOn(stage.tile, stage.chronicle));
      case 'retiled':
      case 'charted':
        return tileChanged(stage.tile, stage.chronicle);
      case 'prepare':
        return staged([stage.tile], stage.chronicle, () => preparedOn(stage.tile, stage.chronicle));
      case 'refreshed':
      case 'action-spent':
      case 'wave-sent':
      case 'camp-joined':
      case 'held':
      case 'settled':
      case 'stock':
      case 'population':
      case 'assigned':
      case 'added':
      case 'drawn':
      case 'discarded':
      case 'exhausted':
      case 'shuffled':
      case 'counters-set':
      case 'banished':
      case 'turn':
      case 'rolled':
      case 'shown':
      case 'dealt':
      case 'taken':
      case 'ended':
      case 'tallied':
      case 'reached':
      case 'relations':
      case 'neutral-fallen':
      case 'runtime-error':
        return undefined;
    }
  };

  /** The stages held by a group the map played: it plays a group or the stages it holds, never both. */
  const covered = new WeakSet<Stage>();

  const grouped = (stage: Group): Promise<void> | undefined => {
    switch (stage.name) {
      case 'attack':
        return staged([stage.attacker, stage.target], stage.chronicle, () =>
          attack(stage.attacker, stage.target, stage.chronicle),
        );
      case 'capstone-landing':
      case 'capstone-continued':
      case 'answer':
      case 'played':
      case 'refused':
      case 'assign':
      case 'claim':
      case 'neutral-played':
      case 'strike':
      case 'income':
      case 'grow':
      case 'turn':
      case 'enemy-phase':
      case 'deal':
      case 'reward':
      case 'capture':
        return undefined;
    }
  };

  return {
    play(stage: Stage): Promise<void> | undefined {
      // Nothing is the scene's word to render a leaf, on a chronicle the group's settle drew past.
      if (covered.has(stage)) return Promise.resolve();
      switch (stage.kind) {
        case 'change':
          return changed(stage);
        case 'group': {
          const motion = grouped(stage);
          if (motion !== undefined) for (const held of walked(stage.stages)) covered.add(held);
          return motion;
        }
      }
    },

    takeDown(): void {
      flight = undefined;
    },
  };
}
