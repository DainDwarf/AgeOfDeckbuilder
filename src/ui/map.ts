import Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { byHand, type UnitCommand } from '../rules/chronicle';
import { claimable, type ReassignCommand } from '../rules/city';
import { preparedAs } from '../rules/enemies';
import {
  type ImprovementId,
  riversAlong,
  sameTile,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
} from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import { inSight } from '../rules/sight';
import type { Stage } from '../rules/stages';
import {
  assignedTo,
  type Chronicle,
  type CityFaction,
  type Cost,
  cityRows,
  cityTileOf,
  holderOf,
  type Snapshot,
} from '../rules/state';
import { type Faction, type Landing, type Unit, unitAt } from '../rules/units';
import { tileYield } from '../rules/yields';
import type { Press } from './bindings';
import { stopMotion } from './card-motion';
import { hexagon, onResize, type Stratum } from './design-space';
import { LOOK } from './look';
import { createMapCamera } from './map-camera';
import { createMapGrab } from './map-grab';
import {
  asBuilding,
  asFeature,
  asGlow,
  asImprovement,
  assignedAt,
  assignedMark,
  asTerrain,
  asUnit,
  asUnitDim,
  asYield,
  CITY_COLOURS,
  CITY_FACTIONS,
  cityDim,
  diamond,
  FACTION_COLOURS,
  fogScrim,
  glowTile,
  type Mark,
  type PopulationBadge,
  populationBadge,
  positionOf,
  ROW_RISE,
  ringMark,
  rowOf,
  showBadge,
  showThreshold,
  strokeRim,
  strokeRivers,
  TILE_SIZE,
  type TileObjects,
  thresholdMark,
  tileFace,
  UNREAD,
  type UnitObjects,
  unreadGlow,
} from './map-marks';
import { createMapMotion } from './map-motion';
import type { MapStrata } from './map-scene';
import { asPainted, poolOf } from './pool';
import { VEILS_ON, type Veils } from './veils';

/** One glyph, corner to corner, and how far apart the glyphs of a tile stand. */
const GLYPH = 6;
const GLYPH_PITCH = 8;

/** How heavy the ring around either city's own tile is, against the one every other tile takes. */
const CITY_RING = 4;
const RING = 2;

/** How many glyphs a row of them holds before the next row starts. */
const GLYPH_ROW = 3;

/** What a tile inside the border shows of itself while city mode is on: every resource it yields. */
const EVERY_RESOURCE: ReadonlySet<Resource> = new Set(RESOURCES);

/** Where a tile's face stands on the map's own surface, for whatever stands beside it there. */
export type TileFace = {
  readonly x: number;
  readonly y: number;
  /** How far the face reaches from its middle, in map units. */
  readonly radius: number;
};

/** A tile a press landed on, and where it stands for whatever floats beside it. */
export type PressedTile = {
  readonly tile: TileCoords;
  readonly at: TileFace;
};

/** What the map draws of a tile: the face it draws, and whether that face is the tile as it stands. */
export type Drawn = {
  readonly tile: Tile;
  /**
   * Whether the face is the tile as it stands, whoever stands on it included, rather than its
   * snapshot: a snapshot answers for its tile whole.
   */
  readonly asStands: boolean;
};

export type MapView = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /**
   * Lights those of the tiles it is given that the map draws, aims at them, and answers the way to
   * let the aim go, which `released` follows.
   */
  aimTile(
    tiles: TileCoords[],
    chosen: (tile: TileCoords) => void,
    refused: (at: PressedTile) => void,
    released: () => void,
  ): () => void;
  /**
   * Where the pointer is on the map, it being on this thing: on a drawn tile or beside the tiles;
   * nothing where the thing is none of the map's.
   */
  placeOf(
    on: Phaser.GameObjects.GameObject | undefined,
  ): { readonly tile: TileCoords | undefined } | undefined;
  /** Whether the last press of that button landed on the map carried it or what it took hold of. */
  carried(press: Press): boolean;
  /**
   * A left click on a drawn tile: the aim's while one stands, else the step or the attack of the unit
   * lit where it lights or glows that tile, else the tile reported to `onPress`.
   */
  click(tile: TileCoords): void;
  /** Whether a unit of the player's on the selected tile lights or glows anything: it is being aimed. */
  unitBeingAimed(): boolean;
  /**
   * Reports a click on a drawn tile to `clicked`; `commanded` is the step or the attack a click or a
   * drag onto a lit unit's tile is, and `reassigned` the population a drag in city mode carries.
   * Called once.
   */
  onPress(
    clicked: (found: PressedTile) => void,
    zoomed: () => void,
    commanded: (command: UnitCommand) => void,
    reassigned: (command: ReassignCommand) => void,
  ): void;
  /**
   * Rings the selected tile and lights what the unit of the player's on it can do, or clears both.
   * `cost` is the threshold the tile wears in its middle, over everything else it carries and in
   * place of its yield glyphs; nothing leaves it bare.
   */
  markSelected(tile: TileCoords | undefined, cost: Cost | undefined): void;
  /** Where a tile's face stands, for whatever floats beside a tile no press picked out. */
  faceOf(tile: TileCoords): TileFace;
  /** A tile named as a press landed on it names it: where its face stands goes with it. */
  pressedOn(tile: TileCoords): PressedTile;
  /** The face the map draws of a tile, and nothing at all for a tile it draws none of. */
  drawnAs(tile: TileCoords): Drawn | undefined;
  /**
   * Shows what every tile yields of these resources, a glyph for each point of it, over a dimmed
   * map; an empty set takes the overlay down.
   */
  showYields(shown: ReadonlySet<Resource>): void;
  /**
   * Marks the tiles the population stands on, dims the held ones with nobody on them, rings the ones
   * the city may claim, and shows what every tile inside the border yields, whatever the overlay is
   * showing: what the map shows while city mode is on.
   */
  showCityMarks(on: boolean): void;
  /** Draws the map under these veils: what the console's two switches take off and put back. */
  showVeils(veils: Veils): void;
  /** Whether the pan and zoom keys and the wheel move the map; they do not while a scrim stands. */
  live(on: boolean): void;
  /** Notches of zoom, in above zero, about the pointer. */
  zoom(notches: number): void;
};

/** Where a tile's face stands, at the size every tile is drawn at. */
function faceAt(tile: TileCoords): TileFace {
  return { ...positionOf(tile), radius: TILE_SIZE };
}

/** A tile a press landed on named: where its face stands goes with it. */
function pressedOn(tile: TileCoords): PressedTile {
  return { tile, at: faceAt(tile) };
}

/** What the map draws of a chronicle and what of it it draws live, by tile key, and the snapshots it draws in fog. */
type Drawing = {
  readonly drawn: ReadonlySet<string>;
  readonly live: ReadonlySet<string>;
  readonly charted: ReadonlyMap<string, Snapshot>;
};

/**
 * The face the map draws of a tile, which everything the chronicle screen reads off the map reads
 * too: the tile as it stands where the map draws it live or has no snapshot of it to draw, and the
 * tile its snapshot last saw where it draws it in fog. Nothing for a tile it draws none of.
 */
function faceIn(drawing: Drawing, tile: Tile): Drawn | undefined {
  const key = tileKey(tile);
  if (!drawing.drawn.has(key)) return undefined;
  const snapshot = drawing.charted.get(key);
  if (drawing.live.has(key) || snapshot === undefined) return { tile, asStands: true };
  return { tile: snapshot.tile, asStands: false };
}

/**
 * The map and everything standing on it, on a surface of its own that pans and zooms under the UI.
 * Every layer of every tile, the border and every unit are written again on each state change; and
 * a card is aimed here — the rules say which tiles light up, never this file.
 */
export function createMapView(
  scene: Phaser.Scene,
  strata: MapStrata,
  catalogue: Catalogue,
  chronicle: Chronicle,
): MapView {
  const map = strata.terrain;

  const group = (on: Stratum, name: string): Phaser.GameObjects.Layer => {
    const layer = scene.add.layer().setName(name);
    on.layer.add(layer);
    return layer;
  };

  const ground = group(strata.terrain, 'terrain');
  const rim = scene.add.graphics().setName('rim');
  strata.terrain.layer.add(rim);
  const rivers = group(strata.terrain, 'rivers');
  const features = group(strata.terrain, 'features');
  const rings = group(strata.terrain, 'border');
  const lighted = group(strata.lit, 'lit');
  const hues = group(strata.lit, 'prepared');
  const improvements = group(strata.buildings, 'improvements');
  const built = group(strata.buildings, 'buildings');
  const marks = group(strata.units, 'units');
  const badges = group(strata.units, 'badges');
  const fog = group(strata.fog, 'fog');
  const cityMarks = group(strata.cityMarks, 'city-marks');
  const dim = scene.add
    .rectangle(0, 0, 1, 1, LOOK.mapOutline, LOOK.mapDim.strength)
    .setOrigin(0, 0)
    .setName('yield-dim')
    .setVisible(false);
  strata.dim.layer.add(dim);
  const selected = group(strata.ring, 'selected');
  const glyphs = group(strata.yields, 'yields');
  const thresholds = group(strata.yields, 'thresholds');

  // Nothing a chronicle does moves the disc's rim, so it is stroked here and no render repaints it.
  strokeRim(rim, chronicle.tiles);

  /** What each tile of the disc keeps, by its key. */
  const tileObjects: Record<string, TileObjects> = Object.fromEntries(
    chronicle.tiles.map((tile) => {
      const key = tileKey(tile);
      const { x, y } = positionOf(tile);
      const kept = (
        on: Phaser.GameObjects.Layer,
        mark: Phaser.GameObjects.Polygon,
      ): Phaser.GameObjects.Polygon => {
        on.add(mark.setPosition(x, y).setVisible(false));
        return mark;
      };
      return [
        key,
        {
          face: kept(ground, tileFace(scene).setName(`tile-${key}`)),
          feature: kept(features, scene.add.polygon(0, 0, UNREAD).setName(`feature-${key}`)),
          ring: kept(rings, ringMark(scene, 0, RING)),
          building: kept(built, scene.add.polygon(0, 0, UNREAD).setName(`building-${key}`)),
          scrim: kept(fog, fogScrim(scene, tile)),
        },
      ];
    }),
  );
  const paintedOnTiles = Object.values(tileObjects).flatMap(
    ({ face, feature, building, scrim }) => [face, feature, building, scrim],
  );

  const crossfadePool = poolOf(ground, () => tileFace(scene).setDepth(1));
  const improvementPool = poolOf(improvements, () => scene.add.polygon(0, 0, UNREAD));
  const fogUnitPool = poolOf(marks, () => scene.add.container(0, 0));
  const waterPool = poolOf(rivers, () => scene.add.graphics().setName('river'));
  const glyphPool = poolOf(glyphs, () => diamond(scene, GLYPH, 0));
  const litPool = poolOf(lighted, () => unreadGlow(scene));
  const assignedPool = poolOf(cityMarks, () => assignedMark(scene));
  const cityDimPool = poolOf(cityMarks, () => cityDim(scene));
  const claimablePool = poolOf(cityMarks, () =>
    ringMark(scene, LOOK.reading.culture, RING).setName('claimable'),
  );

  /** Every outline of a river, on one surface under all the water. */
  const riverOutlines = scene.add.graphics();
  rivers.add(riverOutlines);
  /** The runs the rivers stand stroked along. */
  let strokedRuns: string | undefined;

  const selectionRing = scene.add
    .polygon(0, 0, hexagon(TILE_SIZE - 2), 0, 0)
    .setStrokeStyle(4, LOOK.selected)
    .setVisible(false);
  selected.add(selectionRing);

  const thresholdOnTile = thresholdMark(scene);
  thresholds.add(thresholdOnTile.root);

  const cityBadges: Record<CityFaction, PopulationBadge> = {
    player: populationBadge(scene, 'player'),
    neutral: populationBadge(scene, 'neutral'),
  };
  for (const whose of CITY_FACTIONS) badges.add([cityBadges[whose].pill, cityBadges[whose].number]);

  /** What the map keeps of each unit of the chronicle it stands on, by the number it is named by. */
  const unitObjects = new Map<number, UnitObjects>();
  /** The mark drawn on each tile the population stands on while city mode is on, by its tile's key. */
  let assignedMarks = new Map<string, Phaser.GameObjects.Rectangle>();

  let presser: Phaser.GameObjects.Zone | undefined;
  /** What a left click on a drawn tile is while no aim stands. */
  let clickedTile: ((tile: TileCoords) => void) | undefined;
  /** What a left click on a drawn tile is to the aim standing, and nothing while none does. */
  let aimClicked: ((tile: TileCoords) => void) | undefined;
  let rescale: (() => void) | undefined;

  const frame = createMapCamera(scene, map, dim, chronicle.tiles, () => {
    paintAtZoom();
    rescale?.();
  });

  /** The resources the yield overlay is showing; empty while it is off. */
  let showing: ReadonlySet<Resource> = new Set();

  /** Whether the map is showing what city mode marks: it is while the mode is on. */
  let marking = false;

  /** The tile wearing the culture threshold and what it asks for; nothing while no tile wears one. */
  let threshold: { readonly tile: TileCoords; readonly cost: Cost } | undefined;

  /**
   * What the dim is laid under rather than over, lifted onto the dim's stratum only while it stands:
   * the tiles lit and the units glowed, and the glow a card is aimed by. The ring and the culture
   * threshold are not here — their own strata already stand over the dim's.
   */
  const overDim = new Set<Phaser.GameObjects.Layer>([lighted]);

  const liftOverDim = (): void => {
    const onto = showing.size > 0 ? strata.dim : strata.lit;
    for (const lifted of overDim) onto.layer.add(lifted);
  };

  /** The ground every aim runs on: its own catcher, a glow to paint, and the tile presses held off. */
  const openAim = (): {
    catcher: Phaser.GameObjects.Zone;
    glow: Phaser.GameObjects.Layer;
    close: () => void;
  } => {
    presser?.disableInteractive();
    const catcher = frame.catcherZone('aim');
    const glow = group(strata.lit, 'aim-lit');
    overDim.add(glow);
    liftOverDim();
    return {
      catcher,
      glow,
      close: (): void => {
        catcher.destroy();
        overDim.delete(glow);
        glow.destroy();
        presser?.setInteractive();
      },
    };
  };

  /** The chronicle the map stands on: which marker is whose is read from it. */
  let shown: Chronicle | undefined;
  /** What the map draws of that chronicle. */
  let { drawn, live, charted }: Drawing = { drawn: new Set(), live: new Set(), charted: new Map() };
  /** The veils the map draws under; both stand until the console takes one off. */
  let veils: Veils = VEILS_ON;

  /**
   * What the map draws of a chronicle: a tile in sight live, a tile charted as its snapshot has it,
   * in fog, and each veil taken off widens one of those. Answered for whichever chronicle is asked
   * about, which is not always the one the map stands on.
   */
  const drawing = (chronicle: Chronicle): Drawing => {
    const seen = inSight(catalogue, chronicle);
    const charted = new Map(chronicle.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
    const keys = chronicle.tiles.map(tileKey);
    const shownKeys = new Set(
      veils.uncharted ? keys.filter((key) => seen.has(key) || charted.has(key)) : keys,
    );
    return { drawn: shownKeys, live: veils.fog ? seen : shownKeys, charted };
  };

  /** The face the map draws of a tile on the chronicle it stands on. */
  const drawnOf = (tile: Tile): Drawn | undefined => faceIn({ drawn, live, charted }, tile);

  /**
   * The tile a press lands on: the one the map draws whose face it landed inside, and nothing where
   * the map draws none. A hexagon is exactly the ground closer to its own centre than to any other.
   */
  const tileUnder = (x: number, y: number): TileCoords | undefined => {
    let nearest: TileCoords | undefined;
    let best = Infinity;
    for (const tile of shown?.tiles ?? []) {
      if (!drawn.has(tileKey(tile))) continue;
      const at = positionOf(tile);
      const gap = Math.hypot(at.x - x, at.y - y);
      if (gap < best) {
        best = gap;
        nearest = { q: tile.q, r: tile.r };
      }
    }
    return best <= TILE_SIZE ? nearest : undefined;
  };

  /**
   * The glyphs of every tile the map draws: none on the tile wearing the culture threshold, what it
   * yields of every resource on a tile inside the border while city mode is on, and what the overlay
   * is asked for on any other. A building changes what its tile yields, so a render repaints them.
   */
  const paintYields = (): void => {
    glyphPool.hide();
    dim.setVisible(showing.size > 0);
    liftOverDim();
    if (shown === undefined) return;

    const inside = new Set(marking ? shown.held.map(tileKey) : []);
    const faces = tilesBeside(shown.tiles.flatMap((tile) => drawnOf(tile)?.tile ?? []));
    for (const tile of shown.tiles) {
      if (threshold !== undefined && sameTile(tile, threshold.tile)) continue;
      const face = drawnOf(tile);
      if (face === undefined) continue;
      const asked = inside.has(tileKey(tile)) ? EVERY_RESOURCE : showing;
      const yields = tileYield(catalogue, shown, face.tile, faces);
      const owed: Resource[] = [];
      for (const resource of RESOURCES) {
        if (!asked.has(resource)) continue;
        for (let left = yields[resource] ?? 0; left > 0; left--) owed.push(resource);
      }
      if (owed.length === 0) continue;

      const { x, y } = positionOf(tile);
      const rows = Math.ceil(owed.length / GLYPH_ROW);
      owed.forEach((resource, index) => {
        const row = Math.floor(index / GLYPH_ROW);
        const inRow = Math.min(GLYPH_ROW, owed.length - row * GLYPH_ROW);
        asYield(glyphPool.take(), resource).setPosition(
          x + ((index % GLYPH_ROW) - (inRow - 1) / 2) * GLYPH_PITCH,
          y + (row - (rows - 1) / 2) * GLYPH_PITCH,
        );
      });
    }
  };

  /** The culture threshold on the tile that wears it: what the selection changes, and nothing else. */
  const paintThreshold = (): void => {
    thresholdOnTile.root.setVisible(false);
    if (threshold !== undefined) showThreshold(thresholdOnTile, threshold.tile, threshold.cost);
  };

  /**
   * Each city's badge on its own tile, where the map draws that tile live, on the chronicle it
   * stands on: a growth, a take and a capture change the number, so this follows every render.
   */
  const paintBadges = (): void => {
    const current = shown;
    if (current === undefined) return;
    for (const whose of CITY_FACTIONS) {
      const badge = cityBadges[whose];
      badge.pill.setVisible(false);
      badge.number.setVisible(false);
      const tile = cityTileOf(current, whose);
      const rows = cityRows(current, whose);
      if (tile === undefined || rows === undefined || !live.has(tileKey(tile))) continue;
      showBadge(badge, tile, whose, rows.population);
    }
  };

  /** Every text the map raises at its own zoom, raised again. */
  const paintAtZoom = (): void => {
    const resolution = frame.atZoom();
    const numbers = CITY_FACTIONS.map((whose) => cityBadges[whose].number);
    for (const label of [thresholdOnTile.number, ...numbers]) {
      if (label.style.resolution !== resolution) label.setResolution(resolution);
    }
    paintThreshold();
    paintBadges();
  };

  // The map scene re-rasterises every text it holds at its own factor when the window changes, and
  // subscribed to that at its create, ahead of the map: this raises the map's own again after it.
  onResize(scene, paintAtZoom);

  /**
   * City mode's tiles: a mark under every tile the population stands on, a scrim over every held
   * tile with nobody on it, and culture's own ring around every tile the city may claim. An assign
   * and a claim change them, so a render repaints them.
   */
  const paintCityMarks = (): void => {
    assignedPool.hide();
    cityDimPool.hide();
    claimablePool.hide();
    assignedMarks = new Map();
    if (!marking || shown === undefined) return;

    for (const coord of shown.held) {
      if (!assignedTo(shown, coord)) {
        const { x, y } = positionOf(coord);
        cityDimPool.take().setPosition(x, y);
        continue;
      }
      const at = assignedAt(coord);
      assignedMarks.set(tileKey(coord), assignedPool.take().setPosition(at.x, at.y));
    }
    for (const coord of claimable(catalogue, shown, 'player')) {
      const { x, y } = positionOf(coord);
      claimablePool.take().setPosition(x, y);
    }
  };

  /** A placed improvement from the pool, read for that improvement on the tile of that key. */
  const improvementOn = (improvement: ImprovementId, key: string): Phaser.GameObjects.Polygon =>
    asImprovement(improvementPool.take(), improvement).setName(`improvement-${improvement}-${key}`);

  /**
   * Every layer of one tile as the map draws it on a chronicle, and every object painted for it,
   * whole, over whatever a motion left. The units of a live tile are hung by the render; a tile out
   * of sight carries its unit under its scrim.
   */
  const paintTile = (chronicle: Chronicle, seen: Drawing, tile: Tile): Mark[] => {
    const drawing = faceIn(seen, tile);
    if (drawing === undefined) return [];
    const face = drawing.tile;
    const key = tileKey(tile);
    const own = tileObjects[key];
    const painted: Mark[] = [];
    const paint = (object: Mark): void => {
      painted.push(asPainted(object));
    };

    const { x, y } = positionOf(tile);
    paint(asTerrain(own.face, face.terrain));
    const row = rowOf(face, x);
    if (face.feature !== undefined) {
      paint(asFeature(own.feature, face.feature).setPosition(row.feature, y - ROW_RISE));
    }
    face.improvements.forEach((improvement, index) => {
      paint(improvementOn(improvement, key).setPosition(row.improvements[index], y - ROW_RISE));
    });
    if (face.building !== undefined) paint(asBuilding(own.building, face.building));
    if (seen.live.has(key)) return painted;
    const unitMarked = (type: string, faction: Faction, embarked: boolean): void => {
      paint(asUnit(fogUnitPool.take(), type, faction, embarked).setPosition(x, y));
    };
    // A snapshot answers for its tile whole: one taken of an empty tile hides the unit that has
    // walked onto it since.
    if (drawing.asStands) {
      const standing = unitAt(chronicle.units, tile);
      if (standing !== undefined) {
        unitMarked(standing.stats.type, standing.faction, standing.embarked);
      }
    } else {
      const kept = seen.charted.get(key)?.unit;
      if (kept !== undefined) unitMarked(kept.type, kept.faction, kept.embarked);
    }
    paint(own.scrim);
    return painted;
  };

  /**
   * Every layer of every tile the map draws, on the chronicle it stands on, and nothing of any other
   * tile. A terraform changes a tile's terrain and takes its feature with it, an improvement is
   * placed on it and a building is built on it, so every layer follows every render.
   */
  const paintTiles = (): void => {
    stopMotion(scene, paintedOnTiles);
    for (const object of paintedOnTiles) object.setVisible(false);
    crossfadePool.hide();
    improvementPool.hide();
    fogUnitPool.hide();
    if (shown === undefined) return;
    for (const tile of shown.tiles) paintTile(shown, { drawn, live, charted }, tile);
  };

  /**
   * The rivers stroked again on the chronicle the map stands on, cut to the runs along the tiles it
   * draws, once those change: charting one draws the water beside it.
   */
  const paintRivers = (): void => {
    if (shown === undefined) return;
    const runs = riversAlong(shown.rivers, drawn);
    const stroked = JSON.stringify(runs);
    if (stroked === strokedRuns) return;
    strokedRuns = stroked;

    riverOutlines.clear();
    waterPool.hide();
    strokeRivers(riverOutlines, () => waterPool.take().clear(), runs);
  };

  /** The tile the map rings, and nothing while none is selected. */
  let selection: TileCoords | undefined;

  /**
   * Which unit the map is lighting for, by the number it is named by, where its landings lie and
   * which tiles hold a unit it can attack; nothing while none is lit.
   */
  let lit:
    | { readonly unit: number; readonly landings: Landing[]; readonly targets: TileCoords[] }
    | undefined;

  /**
   * What the unit of the player's standing on a tile can do: every tile its move points reach lit,
   * and every unit it can attack glowed in the enemies' own colour. Nothing is lit while the city
   * marks stand, and a press commands only a unit lit here.
   */
  const lightUnit = (tile: TileCoords | undefined): void => {
    const current = shown;
    const standing =
      tile === undefined || current === undefined || marking
        ? undefined
        : unitAt(current.units, tile);
    lit = undefined;
    if (current !== undefined && standing?.faction === 'player') {
      const { landings, targets } = byHand(catalogue, current, standing);
      lit = { unit: standing.id, landings, targets: targets.map((other) => other.tile) };
    }

    litPool.hide();
    for (const landing of lit?.landings ?? []) {
      asGlow(litPool.take(), landing.tile, LOOK.lit, LOOK.litGlow);
    }
    for (const coord of lit?.targets ?? []) {
      asGlow(litPool.take(), coord, FACTION_COLOURS.enemy, LOOK.targetGlow);
    }
  };

  /**
   * Both cities' borders on the chronicle the map stands on, each tile ringed off the face the map
   * draws of it: a claim moves a border, so a render does.
   */
  const paintBorder = (): void => {
    const current = shown;
    if (current === undefined) return;
    for (const tile of current.tiles) {
      const { ring } = tileObjects[tileKey(tile)];
      ring.setVisible(false);
      const face = drawnOf(tile);
      if (face === undefined) continue;
      const holder = face.asStands ? holderOf(current, tile) : charted.get(tileKey(tile))?.holder;
      if (holder === undefined) continue;
      const own = cityTileOf(current, holder);
      const weight = own !== undefined && sameTile(tile, own) ? CITY_RING : RING;
      ring.setStrokeStyle(weight, CITY_COLOURS[holder]).setVisible(true);
    }
  };

  /** What the map keeps of a unit, made the first time a render or a motion meets it. */
  const objectsOf = (unit: Unit): UnitObjects => {
    const kept = unitObjects.get(unit.id);
    if (kept !== undefined) return kept;
    const parts = scene.add.container(0, 0);
    const dim = scene.add.container(0, 0);
    const marker = scene.add.container(0, 0, [parts, dim]).setDepth(1);
    const hue = unreadGlow(scene);
    marks.add(marker);
    hues.add(hue);
    const made = { marker, parts, dim, hue };
    unitObjects.set(unit.id, made);
    return made;
  };

  /** The tile a unit has prepared on wearing its faction's colour, as the target glow wears it. */
  const paintHue = (unit: Unit): Phaser.GameObjects.Polygon =>
    asPainted(
      asGlow(objectsOf(unit).hue, unit.tile, FACTION_COLOURS[unit.faction], LOOK.preparedGlow),
    ).setName(`prepared-${tileKey(unit.tile)}`);

  /**
   * Everything the map keeps of a unit as it draws it on a chronicle, over whatever a motion left: a
   * unit of the player's with no move points and no action left under its dim, and a tile not drawn
   * live showing none of it.
   */
  const paintUnit = (chronicle: Chronicle, seen: Drawing, unit: Unit): UnitObjects => {
    const own = objectsOf(unit);
    const { marker, parts, dim, hue } = own;
    const key = tileKey(unit.tile);
    const { x, y } = positionOf(unit.tile);
    const { type } = unit.stats;
    const stands = seen.live.has(key);
    const spent = unit.faction === 'player' && unit.movePoints <= 0 && unit.action <= 0;
    stopMotion(scene, [marker, hue]);
    asPainted(marker).setPosition(x, y).setName(`unit-${key}`).setVisible(stands);
    asUnit(parts, type, unit.faction, unit.embarked);
    asUnitDim(dim, type, unit.embarked).setName(`unit-dim-${key}`).setVisible(spent);
    paintHue(unit).setVisible(stands && preparedAs(chronicle, unit) !== undefined);
    return own;
  };

  /** Every unit of a chronicle written, and what the map kept of the units gone destroyed. */
  const paintUnits = (current: Chronicle): void => {
    const standing = new Set(current.units.map((unit) => unit.id));
    for (const [id, { marker, hue }] of unitObjects) {
      if (standing.has(id)) continue;
      stopMotion(scene, [marker, hue]);
      marker.destroy();
      hue.destroy();
      unitObjects.delete(id);
    }
    for (const unit of current.units) paintUnit(current, { drawn, live, charted }, unit);
  };

  const render = (current: Chronicle): void => {
    motion.takeDown();
    shown = current;
    ({ drawn, live, charted } = drawing(current));

    paintTiles();
    paintRivers();
    paintBorder();
    paintUnits(current);
    paintBadges();
    paintCityMarks();
    paintYields();
    lightUnit(selection);
  };

  const motion = createMapMotion(scene, {
    features,
    improvements,
    built,
    shown: () => shown,
    live: () => live,
    liveOn: (chronicle) => drawing(chronicle).live,
    drawnOf,
    faceOn: (chronicle, tile) => {
      const seen = drawing(chronicle);
      const face = faceIn(seen, tile);
      if (face === undefined) return undefined;
      return { tile: face.tile, paint: () => paintTile(chronicle, seen, tile) };
    },
    tileObjects: (key) => tileObjects[key],
    unitObjects: (id) => unitObjects.get(id),
    paintArrivals: (chronicle, units) => {
      const seen = drawing(chronicle);
      return units.map((unit) => paintUnit(chronicle, seen, unit).marker);
    },
    paintHue,
    improvementOn,
    crossfade: () => crossfadePool.take(),
    render,
    hold: frame.hold,
  });

  const grab = createMapGrab(scene, map, frame, {
    shown: () => shown,
    marking: () => marking,
    selection: () => selection,
    tileUnder,
    lightUnit,
    markerOf: (unit) => unitObjects.get(unit)?.marker,
    assignedMarkOn: (tile) => assignedMarks.get(tileKey(tile)),
  });

  return {
    live: frame.live,

    zoom: frame.zoomBy,

    render,

    play(stage: Stage): Promise<void> | undefined {
      grab.homeAtOnce();
      return motion.play(stage);
    },

    onPress(
      clicked: (found: PressedTile) => void,
      zoomed: () => void,
      commanded: (command: UnitCommand) => void,
      reassigned: (command: ReassignCommand) => void,
    ): void {
      rescale = zoomed;
      const catcher = frame.catcherZone('press');
      presser = catcher;

      /** The step or the attack a release on a tile is for the unit the map has lit, and nothing else. */
      const commandUnitOn = (unit: number, on: TileCoords): boolean => {
        if (lit?.unit !== unit) return false;
        if (lit.landings.some((landing) => sameTile(landing.tile, on))) {
          commanded({ type: 'move', unit, tile: on });
          return true;
        }
        if (lit.targets.some((coord) => sameTile(coord, on))) {
          commanded({ type: 'attack', unit, tile: on });
          return true;
        }
        return false;
      };

      clickedTile = (tile) => {
        if (lit !== undefined && commandUnitOn(lit.unit, tile)) return;
        clicked(pressedOn(tile));
      };

      grab.onPress(catcher, commandUnitOn, reassigned);
    },

    markSelected(tile: TileCoords | undefined, cost: Cost | undefined): void {
      selection = tile === undefined ? undefined : { q: tile.q, r: tile.r };
      threshold =
        cost === undefined || selection === undefined ? undefined : { tile: selection, cost };
      selected.setData('tile', tile === undefined ? undefined : tileKey(tile));
      selectionRing.setVisible(tile !== undefined);
      if (tile !== undefined) {
        const { x, y } = positionOf(tile);
        selectionRing.setPosition(x, y);
      }
      paintThreshold();
      paintYields();
      lightUnit(selection);
    },

    faceOf(tile: TileCoords): TileFace {
      return faceAt(tile);
    },

    pressedOn,

    drawnAs(tile: TileCoords): Drawn | undefined {
      const standing = shown === undefined ? undefined : tileAt(shown.tiles, tile);
      return standing === undefined ? undefined : drawnOf(standing);
    },

    showYields(shownResources: ReadonlySet<Resource>): void {
      showing = shownResources;
      paintYields();
    },

    showCityMarks(on: boolean): void {
      marking = on;
      grab.dropPopulation();
      paintCityMarks();
      paintYields();
      lightUnit(selection);
    },

    showVeils(next: Veils): void {
      veils = next;
      if (shown !== undefined) render(shown);
    },

    aimTile(
      tiles: TileCoords[],
      chosen: (tile: TileCoords) => void,
      refused: (at: PressedTile) => void,
      released: () => void,
    ): () => void {
      const { catcher, glow, close } = openAim();
      const lit = tiles.filter((coord) => drawn.has(tileKey(coord)));
      for (const coord of lit) glow.add(glowTile(scene, coord, LOOK.lit, LOOK.litGlow));

      const click = (tile: TileCoords): void => {
        if (lit.some((coord) => sameTile(coord, tile))) chosen(tile);
        else refused(pressedOn(tile));
      };
      aimClicked = click;

      const stop = frame.takePress(catcher, {});

      return () => {
        stop();
        close();
        if (aimClicked === click) aimClicked = undefined;
        released();
      };
    },

    placeOf(
      on: Phaser.GameObjects.GameObject | undefined,
    ): { readonly tile: TileCoords | undefined } | undefined {
      if (!(on instanceof Phaser.GameObjects.Zone) || !frame.catches(on)) return undefined;
      const pointer = scene.input.activePointer;
      const at = map.at(pointer.x, pointer.y);
      return { tile: tileUnder(at.x, at.y) };
    },

    carried: frame.carried,

    click(tile: TileCoords): void {
      (aimClicked ?? clickedTile)?.(tile);
    },

    unitBeingAimed(): boolean {
      return lit !== undefined && (lit.landings.length > 0 || lit.targets.length > 0);
    },
  };
}
