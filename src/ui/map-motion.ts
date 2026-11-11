import type Phaser from 'phaser';
import { preparedAs } from '../rules/enemies';
import {
  type BuildingTypeId,
  type FeatureId,
  type ImprovementId,
  neighbours,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from '../rules/map';
import { type Change, type Group, type Stage, walked } from '../rules/stages';
import type { Chronicle } from '../rules/state';
import { type Unit, unitAt } from '../rules/units';
import { EASE, ended } from './card-motion';
import {
  asTerrain,
  buildingStandsAs,
  facePaintingOn,
  featureMarksOn,
  improvementLyingOf,
  improvementMarksOn,
  type Lying,
  lyingOf,
  type Mark,
  positionOf,
  ROW_RISE,
  rowOf,
  type TileObjects,
  type UnitObjects,
  wearing,
} from './map-marks';
import { FACE_SHEET, onPatch } from './marks';

/** The paintings a change brings beside its tile, painted, and the ones it takes away. */
type Swap = { readonly coming: readonly Mark[]; readonly going: readonly Mark[] };

/** What a stage's motion reads and repaints of the map, which keeps all of it. */
type MapInMotion = {
  readonly lying: Phaser.GameObjects.Layer;
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
  /**
   * The face the map draws of a tile on this chronicle, the painting of the beach it draws on any
   * tile there, and the way to paint that tile whole.
   */
  faceOn(
    chronicle: Chronicle,
    tile: Tile,
  ):
    | { readonly tile: Tile; shoreOn(coord: TileCoords): string | undefined; paint(): Mark[] }
    | undefined;
  tileObjects(key: string): TileObjects;
  unitObjects(id: number): UnitObjects | undefined;
  /** These units of this chronicle painted, and their markers. */
  paintArrivals(chronicle: Chronicle, units: readonly Unit[]): Phaser.GameObjects.Container[];
  paintHue(unit: Unit): Phaser.GameObjects.Polygon;
  /** The marks of an improvement on the tile of that key, painted at that point of its row. */
  improvementOn(
    improvement: ImprovementId,
    key: string,
    x: number,
    y: number,
    inFog: boolean,
  ): Mark[];
  /** A building painted standing on its tile, its patch left out. */
  buildingOn(building: BuildingTypeId, coord: TileCoords, inFog: boolean): Mark;
  /** The patch a building's paintings lie on, painted on that tile. */
  patchOn(coord: TileCoords, inFog: boolean): Phaser.GameObjects.Image;
  /** The disc and the icon the tile of that key keeps for a feature, painted at that point of its row. */
  featureOn(key: string, feature: FeatureId, x: number, y: number, inFog: boolean): Mark[];
  /** What lies on a tile's ground, painted. */
  lyingOn(laid: readonly Lying[], inFog: boolean): Mark[];
  /** A face from the pool the terrain crossfades on, standing in that tile's row. */
  crossfade(tile: TileCoords): Phaser.GameObjects.Image;
  /** A face from that pool a beach fades in on, standing over the face it lies on. */
  shoreOver(face: Phaser.GameObjects.Image): Phaser.GameObjects.Image;
  /**
   * The river pieces at the corners of a tile whose piece this chronicle changes, and nothing where
   * it changes none: the way to paint each new one, and each kept one with it.
   */
  riversAt(chronicle: Chronicle, tile: TileCoords): (() => Swap) | undefined;
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

  /** A mark painted where it stands on the face a change leaves, raised from nothing to its scale. */
  const scaleUp = (mark: Mark): Promise<void> => {
    const { scale } = mark;
    mark.setScale(0);
    return ended(scene.tweens.add({ targets: mark, scale, duration: 250, ease: EASE }));
  };

  /**
   * Whatever is painted rising out of nothing, or sinking into it: what a tile newly drawn fades in
   * with, and a beach beside it changes by.
   */
  const fade = (painted: readonly Mark[], to: 0 | 1): Promise<void> => {
    if (painted.length === 0) return Promise.resolve();
    for (const object of painted) object.setAlpha(1 - to);
    return ended(scene.tweens.add({ targets: painted, alpha: to, duration: 400, ease: EASE }));
  };

  const fadeIn = (painted: readonly Mark[]): Promise<void> => fade(painted, 1);

  /**
   * The motion between two faces of one tile, and nothing where they are alike, in the fog the map
   * stands on. The painting crossfades from the start, with the beach the new face wears; the marks
   * gone shrink, then those staying slide to their slots on the new face, then those come scale up.
   */
  const between = (
    coord: TileCoords,
    from: Tile,
    to: Tile,
    shore: string | undefined,
  ): ((token: symbol) => Promise<void>) | undefined => {
    const key = tileKey(coord);
    const inFog = !view.live().has(key);
    const { x, y } = positionOf(coord);
    const was = rowOf(from, x);
    const is = rowOf(to, x);

    /** A mark the map drew that goes, or that stays and slides to `to`. */
    const drawnMarks: { on: Phaser.GameObjects.Layer; name: string; to: number | undefined }[] = [];
    /** The marks to come, each painted where it stands. */
    const come: (() => readonly Mark[])[] = [];
    const compare = <Id extends string>(
      on: Phaser.GameObjects.Layer,
      names: (id: Id) => readonly string[],
      make: (id: Id, slot: number, markY: number) => readonly Mark[],
      markY: number,
      before: { ids: readonly Id[]; xs: readonly number[] },
      after: { ids: readonly Id[]; xs: readonly number[] },
    ): void => {
      for (const id of new Set([...before.ids, ...after.ids])) {
        const at = before.ids.indexOf(id);
        const next = after.ids.indexOf(id);
        if (next < 0) {
          for (const name of names(id)) drawnMarks.push({ on, name, to: undefined });
        } else if (at < 0) come.push(() => make(id, after.xs[next], markY));
        else if (before.xs[at] !== after.xs[next]) {
          for (const name of names(id)) drawnMarks.push({ on, name, to: after.xs[next] });
        }
      }
    };
    const one = <Id extends string>(id: Id | undefined): Id[] => (id === undefined ? [] : [id]);
    compare(
      view.features,
      () => Object.values(featureMarksOn(key)),
      (id, slot, markY) => view.featureOn(key, id, slot, markY, inFog),
      y - ROW_RISE,
      { ids: one(from.feature), xs: [was.feature] },
      { ids: one(to.feature), xs: [is.feature] },
    );
    compare(
      view.lying,
      (id) => lyingOf(id, coord).map(({ name }) => name),
      (id) => view.lyingOn(lyingOf(id, coord), inFog),
      y,
      { ids: one(from.feature), xs: [x] },
      { ids: one(to.feature), xs: [x] },
    );
    const laidBefore = improvementLyingOf(from, coord);
    const laidAfter = improvementLyingOf(to, coord);
    compare(
      view.lying,
      (name) => [name],
      (name) =>
        view.lyingOn(
          laidAfter.filter((laid) => laid.name === name),
          inFog,
        ),
      y,
      { ids: laidBefore.map(({ name }) => name), xs: laidBefore.map(() => x) },
      { ids: laidAfter.map(({ name }) => name), xs: laidAfter.map(() => x) },
    );
    compare(
      view.improvements,
      (id) => Object.values(improvementMarksOn(id, key).names),
      (id, slot, markY) => view.improvementOn(id, key, slot, markY, inFog),
      y - ROW_RISE,
      { ids: from.improvements, xs: was.improvements },
      { ids: to.improvements, xs: is.improvements },
    );
    const patched = (building: BuildingTypeId | undefined): 'patch'[] =>
      building !== undefined && onPatch(building) ? ['patch'] : [];
    compare(
      view.built,
      () => [`building-patch-${key}`],
      () => [view.patchOn(coord, inFog)],
      y,
      { ids: patched(from.building), xs: [x] },
      { ids: patched(to.building), xs: [x] },
    );
    compare(
      view.built,
      () => [buildingStandsAs(key)],
      (id) => [view.buildingOn(id, coord, inFog)],
      y,
      { ids: one(from.building), xs: [x] },
      { ids: one(to.building), xs: [x] },
    );

    const crossfades = facePaintingOn(from, coord).painting !== facePaintingOn(to, coord).painting;
    if (!crossfades && drawnMarks.length === 0 && come.length === 0) return undefined;

    return async (token) => {
      let crossing = Promise.resolve();
      if (crossfades) {
        const face = asTerrain(view.crossfade(coord), to, coord, inFog).setPosition(x, y);
        crossing = fadeIn(
          shore === undefined
            ? [face]
            : [face, wearing(view.shoreOver(face), FACE_SHEET.key, shore, inFog).setPosition(x, y)],
        );
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
      if (flight === token) await Promise.all(come.flatMap((make) => make().map(scaleUp)));
      await crossing;
    };
  };

  /**
   * The paintings a change brings beside its tile swapped for the ones it takes away: each new one
   * fading in and each kept one fading out, as long as the changed tile's own fade-in takes.
   */
  const swapped =
    (paint: () => Swap): (() => Promise<void>) =>
    async () => {
      const { coming, going } = paint();
      await Promise.all([fade(coming, 1), fade(going, 0)]);
    };

  /**
   * The beaches of the tiles the map draws beside a changed one whose painting the change moves, and
   * nothing where it moves none, each new painting over its tile's face in the fog it stands in.
   */
  const shoresBeside = (
    coord: TileCoords,
    shoreOn: (coord: TileCoords) => string | undefined,
  ): (() => Promise<void>) | undefined => {
    const shown = view.shown();
    const live = view.live();
    const moved = neighbours(coord).flatMap((beside) => {
      const stood = shown === undefined ? undefined : tileAt(shown.tiles, beside);
      if (stood === undefined || view.drawnOf(stood) === undefined) return [];
      const { face, shore } = view.tileObjects(tileKey(beside));
      const kept = shore.visible ? shore : undefined;
      const painting = shoreOn(beside);
      if (painting === kept?.frame.name) return [];
      return [{ beside, face, kept, painting }];
    });
    if (moved.length === 0) return undefined;

    return swapped(() => ({
      coming: moved.flatMap(({ beside, face, painting }) => {
        if (painting === undefined) return [];
        const { x, y } = positionOf(beside);
        const inFog = !live.has(tileKey(beside));
        return [wearing(view.shoreOver(face), FACE_SHEET.key, painting, inFog).setPosition(x, y)];
      }),
      going: moved.flatMap(({ kept }) => (kept === undefined ? [] : [kept])),
    }));
  };

  /**
   * A change on a tile: what the map draws of it, beside it and at its corners, from the chronicle it
   * stands on to the change's, played after the pan that holds the tile. A tile newly drawn fades in
   * whole; one drawn alike on both, or on neither, plays nothing.
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
      from === undefined
        ? () => fadeIn(to.paint())
        : between(coord, from.tile, to.tile, to.shoreOn(coord));
    const shores = shoresBeside(coord, to.shoreOn);
    const riversAt = view.riversAt(chronicle, coord);
    const rivers = riversAt === undefined ? undefined : swapped(riversAt);
    if (motion === undefined && shores === undefined && rivers === undefined) return undefined;
    return heldThen([coord], chronicle, () => {
      const token = takeOff();
      return Promise.all([motion?.(token), shores?.(), rivers?.()]).then(() =>
        settle(token, chronicle),
      );
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
