import Phaser from 'phaser';
import { ageOf, type Catalogue } from '../rules/catalogue';
import { byHand, type UnitCommand } from '../rules/chronicle';
import { claimable, type ReassignCommand } from '../rules/city';
import { preparedAs } from '../rules/enemies';
import {
  type BuildingTypeId,
  cornerKey,
  cornersOf,
  type FeatureId,
  type ImprovementId,
  sameTile,
  type Tile,
  type TileCoords,
  type TilesBeside,
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
  type SnapshotUnit,
} from '../rules/state';
import { type Faction, type Landing, pathTo, type Unit, unitAt } from '../rules/units';
import { tileYield } from '../rules/yields';
import type { Press } from './bindings';
import { stopMotion } from './card-motion';
import { onResize, type Stratum, thingUnder, whileUp } from './design-space';
import { LOOK } from './look';
import {
  createBorder,
  createClaimMarks,
  createReach,
  type Reach,
  type WornAsDrawn,
} from './map-border';
import { createMapCamera } from './map-camera';
import { selectionRims, unitRings } from './map-fade';
import { createMapGrab } from './map-grab';
import {
  asGlow,
  asIcon,
  asPatch,
  asPieces,
  asRowDisc,
  assignedAt,
  assignedMark,
  asTerrain,
  asUnit,
  asVoid,
  asYield,
  buildingStandsAs,
  CITY_FACTIONS,
  cityDim,
  diamond,
  ditchesOf,
  FACTION_COLOURS,
  FEATURE_DISC,
  featureMarksOn,
  featureToldOn,
  IMPROVEMENT_DISC,
  improvementLyingOf,
  improvementMarksOn,
  type Lying,
  lyingOf,
  type Mark,
  mapHexagon,
  type PopulationBadge,
  populationBadge,
  positionOf,
  ROW_RISE,
  rowDisc,
  rowOf,
  SQUASH,
  shoreOn,
  showBadge,
  showThreshold,
  TILE_SIZE,
  type TileObjects,
  thresholdMark,
  tileFace,
  type UnitObjects,
  unitMarker,
  unitStandsAt,
  unreadGlow,
  wearing,
} from './map-marks';
import { createMapMotion } from './map-motion';
import { createPath } from './map-path';
import {
  asPressedStraight,
  asRiverMouth,
  asRiverPiece,
  type RiverPiece,
  riverPieces,
} from './map-rivers';
import type { MapStrata } from './map-scene';
import {
  BUILDING_SHEET,
  buildingPaintingsOf,
  FACE_SHEET,
  FEATURE_SHEET_KEY,
  featureIconOf,
  ICON_WIDTH,
  onPatch,
  paintingOn,
  RIVER_SHEET,
} from './marks';
import { asPainted, poolOf } from './pool';
import { VEILS_ON, type Veils } from './veils';

/** One glyph, corner to corner, and how far apart the glyphs of a tile stand. */
const GLYPH = 6;
const GLYPH_PITCH = 8;

/** How far over its tile's row a face crossfading in stands, short of the row in front. */
const CROSSFADE_RISE = 0.5;

/** How far over the face it lies on a beach stands: short of a face crossfading in over that one. */
const SHORE_RISE = 0.25;

/** How far over its tile's row a building's pieces stand: over its patch, short of the row in front. */
const PIECES_RISE = 0.5;

/**
 * Where a live unit's marker stands among the units, over a unit the fog keeps at 0, and where the
 * one a press carries stands, over them all.
 */
const UNIT_DEPTH = 1;
const CARRIED_DEPTH = 2;

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

/** What the map draws of a tile: the face it draws, and the snapshot it draws it from, if it does. */
export type Drawn = {
  readonly tile: Tile;
  /**
   * The snapshot the face is drawn from, whoever stood on it included, and none where the face is the
   * tile as it stands: a snapshot answers for its tile whole.
   */
  readonly snapshot?: Snapshot;
};

/** What a card being aimed admits as the map shows it: the tiles it lights, and the tiles whose units it rings. */
export type AimShown = {
  readonly tiles: readonly TileCoords[];
  readonly units: readonly TileCoords[];
};

export type MapView = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /**
   * Lights the tiles it is given and rings the units, those the map draws, aims at their tiles, and
   * answers the way to let the aim go, which `released` follows.
   */
  aimTile(
    admitted: AimShown,
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
   * Marks the tiles the population stands on, dims the held ones with nobody on them, marks the ones
   * the city may claim, and shows what every tile inside the border yields, whatever the overlay is
   * showing: what the map shows while city mode is on.
   */
  showCityMarks(on: boolean): void;
  /** Draws the map under these veils: what the console's two switches take off and put back. */
  showVeils(veils: Veils): void;
  /** Shows or hides the discs of every tile's row, the features' and the improvements', with what they wear. */
  showDiscs(shown: boolean): void;
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
  if (drawing.live.has(key) || snapshot === undefined) return { tile };
  return { tile: snapshot.tile, snapshot };
}

/**
 * The unit the map draws on a face: the one the face's snapshot kept, or, where the face is the tile
 * as it stands, the one standing there. A snapshot answers for its tile whole: one taken of an empty
 * tile hides the unit that has walked onto it since.
 */
export function unitDrawn(face: Drawn, units: readonly Unit[]): Unit | SnapshotUnit | undefined {
  return face.snapshot === undefined ? unitAt(units, face.tile) : face.snapshot.unit;
}

/** The faces the map draws of these tiles, read beside any tile: what a yield and a beach read there. */
function facesIn(drawing: Drawing, tiles: readonly Tile[]): TilesBeside {
  return tilesBeside(tiles.flatMap((tile) => faceIn(drawing, tile)?.tile ?? []));
}

/**
 * The map and everything standing on it, on a surface of its own that pans and zooms under the UI.
 * Every layer of every tile and every unit are written again on each state change, the border where
 * it moved; and a card is aimed here — the rules say which tiles light up, never this file.
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
  const rivers = group(strata.terrain, 'rivers');
  const ditches = group(strata.terrain, 'ditches');
  const lying = group(strata.terrain, 'lying');
  const claimMarks = createClaimMarks(scene, group(strata.terrain, 'claim-marks'), chronicle.tiles);
  const border = createBorder(scene, group(strata.terrain, 'border'), chronicle.tiles);
  const built = group(strata.buildings, 'buildings');
  const features = group(strata.buildings, 'features');
  const improvements = group(strata.buildings, 'improvements');
  const badges = group(strata.buildings, 'badges');
  const cityMarks = group(strata.cityMarks, 'city-marks');
  const dim = scene.add
    .rectangle(0, 0, 1, 1, LOOK.mapOutline, LOOK.mapDim.strength)
    .setOrigin(0, 0)
    .setName('yield-dim')
    .setVisible(false);
  strata.dim.layer.add(dim);
  const hues = group(strata.selection, 'prepared');
  const lighted = group(strata.selection, 'lit');
  const reach = createReach(scene, lighted, chronicle.tiles);
  const rings = group(strata.selection, 'rings');
  const selected = group(strata.selection, 'selected');
  const pathGroup = group(strata.selection, 'path');
  const path = createPath(scene, pathGroup);
  const marks = group(strata.units, 'units');
  const glyphs = group(strata.yields, 'yields');
  const thresholds = group(strata.yields, 'thresholds');

  /** What each tile of the disc keeps, by its key. */
  const tileObjects: Record<string, TileObjects> = Object.fromEntries(
    chronicle.tiles.map((tile) => {
      const key = tileKey(tile);
      const { x, y } = positionOf(tile);
      const kept = <T extends Mark>(on: Phaser.GameObjects.Layer, mark: T): T => {
        on.add(mark.setPosition(x, y).setVisible(false));
        return mark;
      };
      const featureNames = featureMarksOn(key);
      return [
        key,
        {
          // Added before the face it stands under at the same depth.
          void: kept(ground, asVoid(tileFace(scene), tile).setName(`void-${key}`).setDepth(tile.r)),
          face: kept(ground, tileFace(scene).setName(`tile-${key}`).setDepth(tile.r)),
          shore: kept(
            ground,
            tileFace(scene)
              .setName(`shore-${key}`)
              .setDepth(tile.r + SHORE_RISE),
          ),
          featureDisc: kept(features, rowDisc(scene).setName(featureNames.disc)),
          feature: kept(
            features,
            scene.add.image(0, 0, FEATURE_SHEET_KEY).setName(featureNames.icon),
          ),
        },
      ];
    }),
  );
  const paintedOnTiles = Object.values(tileObjects).flatMap(
    ({ face, shore, featureDisc, feature }) => [face, shore, featureDisc, feature],
  );

  const crossfadePool = poolOf(ground, () => tileFace(scene));
  const lyingPool = poolOf(lying, () => scene.add.image(0, 0, FEATURE_SHEET_KEY));
  const ditchPool = poolOf(ditches, () =>
    scene.add.container(0, 0, [scene.add.image(0, 0, RIVER_SHEET.key)]),
  );
  const patchPool = poolOf(built, () => scene.add.image(0, 0, BUILDING_SHEET.key));
  const piecesPool = poolOf(built, () => scene.add.container(0, 0));
  const improvementDiscPool = poolOf(improvements, () => rowDisc(scene));
  // The depth alone keeps an icon over its disc: both pools add to one layer in no order of pairs.
  const improvementIconPool = poolOf(improvements, () =>
    scene.add.image(0, 0, FEATURE_SHEET_KEY).setDepth(1),
  );
  const fogUnitPool = poolOf(marks, () => unitMarker(scene));
  const riverPool = poolOf(rivers, () => scene.add.image(0, 0, RIVER_SHEET.key));
  const straightPool = poolOf(rivers, () =>
    scene.add.container(0, 0, [scene.add.image(0, 0, RIVER_SHEET.key)]),
  );
  const glyphPool = poolOf(glyphs, () => diamond(scene, GLYPH, 0));
  const litPool = poolOf(lighted, () => unreadGlow(scene));
  const assignedPool = poolOf(cityMarks, () => assignedMark(scene));
  const cityDimPool = poolOf(cityMarks, () => cityDim(scene));

  /** The piece each corner of a river wears on the chronicle the map stands on, by the corner's key, and what painted it. */
  let riversWorn = new Map<string, { readonly piece: RiverPiece; readonly painted: Mark[] }>();

  const rimOn = selectionRims(scene);
  /** The selection's rim and line on no tile. */
  const selectionMarks = (): (Phaser.GameObjects.Image | Phaser.GameObjects.Polygon)[] => [
    rimOn(),
    scene.add
      .polygon(0, 0, mapHexagon(TILE_SIZE - 0.5), 0, 0)
      .setStrokeStyle(1, LOOK.selected, LOOK.selectionLine),
  ];
  const selectedRim = selectionMarks().map((mark) => mark.setVisible(false));
  selected.add(selectedRim);

  const ringOn = unitRings(scene);
  // In a container: a take sets the scale back to one, and the ring is painted at four times its size.
  const ringPool = poolOf(rings, () => scene.add.container(0, 0, [ringOn()]));

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
   * The ground every aim runs on: its own catcher, a group for its rims on the selection's stratum
   * under the path, and the tile presses held off.
   */
  const openAim = (): {
    catcher: Phaser.GameObjects.Zone;
    rims: Phaser.GameObjects.Layer;
    close: () => void;
  } => {
    presser?.disableInteractive();
    const catcher = frame.catcherZone('aim');
    const rims = group(strata.selection, 'aim-lit');
    strata.selection.layer.moveBelow(rims, pathGroup);
    return {
      catcher,
      rims,
      close: (): void => {
        catcher.destroy();
        rims.destroy();
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
   * the map draws none. A regular hexagon is exactly the ground closer to its own centre than to any
   * other, so the press is measured with the lattice's squash taken out.
   */
  const tileUnder = (x: number, y: number): TileCoords | undefined => {
    let nearest: TileCoords | undefined;
    let best = Infinity;
    for (const tile of shown?.tiles ?? []) {
      if (!drawn.has(tileKey(tile))) continue;
      const at = positionOf(tile);
      const gap = Math.hypot(at.x - x, (at.y - y) / SQUASH);
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
    if (shown === undefined) return;

    const inside = new Set(marking ? shown.held.map(tileKey) : []);
    const faces = facesIn({ drawn, live, charted }, shown.tiles);
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
    for (const label of [thresholdOnTile.number, path.number, ...numbers]) {
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
   * tile with nobody on it, and the claim marks on every tile the city may claim. An assign and a
   * claim change them, so a render repaints them.
   */
  const paintCityMarks = (): void => {
    assignedPool.hide();
    cityDimPool.hide();
    assignedMarks = new Map();
    if (!marking || shown === undefined) {
      claimMarks.paint(undefined);
      return;
    }

    for (const coord of shown.held) {
      if (!assignedTo(shown, coord)) {
        const { x, y } = positionOf(coord);
        cityDimPool.take().setPosition(x, y);
        continue;
      }
      const at = assignedAt(coord);
      assignedMarks.set(tileKey(coord), assignedPool.take().setPosition(at.x, at.y));
    }
    claimMarks.paint({ held: shown.held, claimable: claimable(catalogue, shown, 'player') });
  };

  /**
   * A placed improvement's marks from the pools, read for that improvement on the tile of that key
   * carrying that feature and standing at that point of its row: its pale disc and what it wears.
   */
  const improvementOn = (
    improvement: ImprovementId,
    feature: FeatureId | undefined,
    key: string,
    x: number,
    y: number,
    inFog: boolean,
  ): Mark[] => {
    const marks = improvementMarksOn(improvement, feature, key);
    return [
      asRowDisc(improvementDiscPool.take(), IMPROVEMENT_DISC, inFog)
        .setPosition(x, y)
        .setName(marks.names.disc),
      asIcon(improvementIconPool.take(), marks.icon, marks.width, inFog)
        .setPosition(x, y)
        .setName(marks.names.icon),
    ];
  };

  /**
   * A building standing on its tile, darkened in fog: its pieces from the pool, the front one named
   * for the tile and each behind it for its place.
   */
  const buildingOn = (
    building: BuildingTypeId,
    coord: TileCoords,
    inFog: boolean,
  ): Phaser.GameObjects.Container => {
    const key = tileKey(coord);
    const { x, y } = positionOf(coord);
    const paintings = buildingPaintingsOf(building);
    const pieces = asPieces(
      piecesPool.take(),
      paintings,
      false,
      (files) => paintingOn(files, coord),
      inFog,
    );
    const front = paintings.pieces.length - 1;
    paintings.pieces.forEach((_, at) => {
      pieces.list[at].setName(at === front ? `building-${key}` : `building-${key}-${at}`);
    });
    return pieces
      .setPosition(x, y)
      .setDepth(coord.r + PIECES_RISE)
      .setName(buildingStandsAs(key));
  };

  /** The patch a building's paintings lie on, from the pool, under them on that tile, darkened in fog. */
  const patchOn = (coord: TileCoords, inFog: boolean): Phaser.GameObjects.Image => {
    const { x, y } = positionOf(coord);
    return asPatch(patchPool.take(), inFog)
      .setPosition(x, y)
      .setDepth(coord.r)
      .setName(`building-patch-${tileKey(coord)}`);
  };

  /** The disc and the icon a tile keeps painted for a feature, standing at that point of its row. */
  const featureOn = (
    key: string,
    feature: FeatureId,
    x: number,
    y: number,
    inFog: boolean,
  ): Mark[] => {
    const own = tileObjects[key];
    return [
      asRowDisc(asPainted(own.featureDisc), FEATURE_DISC, inFog).setPosition(x, y),
      asIcon(asPainted(own.feature), featureIconOf(feature), ICON_WIDTH, inFog).setPosition(x, y),
    ];
  };

  /** What lies on a tile's ground, painted from the pool. */
  const lyingOn = (laid: readonly Lying[], inFog: boolean): Mark[] =>
    laid.map(({ paint }) => paint(lyingPool.take(), inFog));

  /** The ditches run into a tile, painted from their pool. */
  const ditchesOn = (
    laid: readonly Lying<Phaser.GameObjects.Container>[],
    inFog: boolean,
  ): Mark[] => laid.map(({ paint }) => paint(ditchPool.take(), inFog));

  /**
   * Every layer of one tile as the map draws it on a chronicle, the faces drawn there beside it, and
   * every object painted for it, whole, over whatever a motion left, darkened in fog. The units of a
   * live tile are hung by the render; a tile in fog carries its unit with it.
   */
  const paintTile = (
    chronicle: Chronicle,
    seen: Drawing,
    faces: TilesBeside,
    tile: Tile,
  ): Mark[] => {
    const drawing = faceIn(seen, tile);
    if (drawing === undefined) return [];
    const face = drawing.tile;
    const key = tileKey(tile);
    const own = tileObjects[key];
    const painted: Mark[] = [];

    const { x, y } = positionOf(tile);
    const inFog = !seen.live.has(key);
    painted.push(asTerrain(asPainted(own.face), face, tile, inFog));
    const shore = shoreOn(catalogue, faces, tile);
    if (shore !== undefined) {
      painted.push(wearing(asPainted(own.shore), FACE_SHEET.key, shore, inFog));
    }
    const row = rowOf(face, x);
    const told = featureToldOn(face);
    if (told !== undefined) {
      painted.push(
        ...lyingOn(lyingOf(told, tile), inFog),
        ...featureOn(key, told, row.feature, y - ROW_RISE, inFog),
      );
    }
    painted.push(...lyingOn(improvementLyingOf(face, tile), inFog));
    painted.push(...ditchesOn(ditchesOf(face, tile, chronicle.rivers), inFog));
    face.improvements.forEach((improvement, index) => {
      painted.push(
        ...improvementOn(
          improvement,
          face.feature,
          key,
          row.improvements[index],
          y - ROW_RISE,
          inFog,
        ),
      );
    });
    if (face.building !== undefined) {
      if (onPatch(face.building)) painted.push(patchOn(tile, inFog));
      painted.push(buildingOn(face.building, tile, inFog));
    }
    if (!inFog) return painted;
    const standing = unitDrawn(drawing, chronicle.units);
    if (standing !== undefined) {
      const { stats, faction, embarked } = standing;
      painted.push(
        asUnit(fogUnitPool.take(), stats.type, faction, embarked, 'fog').setPosition(x, y),
      );
    }
    return painted;
  };

  /**
   * Every layer of every tile the map draws, on the chronicle it stands on, and his void on every
   * other tile. A terraform changes a tile's terrain and takes its feature with it, an improvement is
   * placed on it and a building is built on it, so every layer follows every render.
   */
  const paintTiles = (): void => {
    stopMotion(scene, paintedOnTiles);
    for (const object of paintedOnTiles) object.setVisible(false);
    crossfadePool.hide();
    lyingPool.hide();
    ditchPool.hide();
    patchPool.hide();
    piecesPool.hide();
    improvementDiscPool.hide();
    improvementIconPool.hide();
    fogUnitPool.hide();
    for (const [key, own] of Object.entries(tileObjects)) own.void.setVisible(!drawn.has(key));
    if (shown === undefined) return;
    const seen = { drawn, live, charted };
    const faces = facesIn(seen, shown.tiles);
    for (const tile of shown.tiles) paintTile(shown, seen, faces, tile);
  };

  /** The piece each corner of a river wears on a chronicle, by the corner's key, read off what the map draws of it. */
  const piecesOn = (chronicle: Chronicle, seen: Drawing): Map<string, RiverPiece> =>
    riverPieces(catalogue, chronicle.rivers, seen.drawn, seen.live, facesIn(seen, chronicle.tiles));

  /** A corner's piece painted from the pools: a mouth with the straight pressed into it. */
  const paintPiece = (piece: RiverPiece): Mark[] => {
    switch (piece.kind) {
      case 'piece':
        return [asRiverPiece(riverPool.take(), piece)];
      case 'mouth':
        return [
          asPressedStraight(straightPool.take(), piece),
          asRiverMouth(riverPool.take(), piece),
        ];
    }
  };

  /** Every corner of every river along the tiles the map draws, wearing its piece on the chronicle it stands on. */
  const paintRivers = (): void => {
    riverPool.hide();
    straightPool.hide();
    riversWorn = new Map();
    if (shown === undefined) return;
    for (const [key, piece] of piecesOn(shown, { drawn, live, charted })) {
      riversWorn.set(key, { piece, painted: paintPiece(piece) });
    }
  };

  /** The tile selected, and nothing while none is. */
  let selection: TileCoords | undefined;

  /** The tiles whose units the card being aimed rings, none while no aim rings any. */
  let aimRinged: readonly TileCoords[] = [];

  /** The unit standing on a tile in sight on the chronicle the map stands on: the one a ring there is worn by. */
  const wearerOn = (tile: TileCoords): Unit | undefined =>
    shown === undefined || !live.has(tileKey(tile)) ? undefined : unitAt(shown.units, tile);

  /**
   * The selection and the aim as the chronicle the map stands on wears them: the unit on the selected
   * tile ringed out of city mode, the tile's rim where none is, and each unit the aim rings ringed.
   */
  const paintRings = (): void => {
    const onSelection = selection === undefined || marking ? undefined : wearerOn(selection);
    for (const mark of selectedRim) {
      mark.setVisible(selection !== undefined && onSelection === undefined);
    }
    const wearers = [
      ...(onSelection === undefined ? [] : [onSelection]),
      ...aimRinged.flatMap((tile) => wearerOn(tile) ?? []),
    ];
    ringPool.hide();
    for (const { tile } of wearers) {
      const { x, y } = unitStandsAt(tile);
      ringPool.take().setPosition(x, y).setData('tile', tileKey(tile));
    }
  };

  /**
   * Which unit the map is lighting for, as it stood when lit, where its landings lie and which tiles
   * hold a unit it can attack; nothing while none is lit.
   */
  let lit:
    | { readonly standing: Unit; readonly landings: Landing[]; readonly targets: TileCoords[] }
    | undefined;

  /** The landing the lit unit's path is drawn to, and nothing while none is. */
  let pathEnd: Landing | undefined;

  /** The lit unit's path to one of its landings, or none. */
  const showPath = (landing: Landing | undefined): void => {
    const current = shown;
    const tiles =
      landing === undefined || lit === undefined || current === undefined
        ? undefined
        : pathTo(catalogue, current, lit.standing, landing.tile);
    pathEnd = tiles === undefined ? undefined : landing;
    if (tiles === undefined || landing === undefined || lit === undefined) path.hide();
    else path.show(tiles, lit.standing.movePoints - landing.cost);
  };

  /**
   * What the unit of the player's standing on a tile can do: every tile its move points reach drawn
   * as one region with its own tile, and every unit it can attack glowed in the enemies' own colour.
   * Nothing is lit while the city marks stand, and a press commands only a unit lit here.
   */
  const lightUnit = (tile: TileCoords | undefined): void => {
    const current = shown;
    const standing =
      tile === undefined || current === undefined || marking
        ? undefined
        : unitAt(current.units, tile);
    const was = lit?.standing;
    lit = undefined;
    let reached: Reach | undefined;
    if (current !== undefined && standing?.faction === 'player') {
      const { landings, targets } = byHand(catalogue, current, standing);
      lit = { standing, landings, targets: targets.map((other) => other.tile) };
      reached = { own: standing.tile, landings: landings.map((landing) => landing.tile) };
    }
    reach.paint(reached);

    const kept = pathEnd?.tile;
    // A step moves the unit, and an attack spends the move points it had left, which lights nothing.
    const asBefore =
      was !== undefined &&
      standing !== undefined &&
      was.id === standing.id &&
      sameTile(was.tile, standing.tile);
    showPath(
      kept === undefined || !asBefore
        ? undefined
        : lit?.landings.find((landing) => sameTile(landing.tile, kept)),
    );

    litPool.hide();
    for (const coord of lit?.targets ?? []) {
      asGlow(litPool.take(), coord, FACTION_COLOURS.enemy, LOOK.targetGlow);
    }
  };

  /**
   * The pointer read once a frame while a unit lights a tile: a lit tile it is on takes the path,
   * the unit's own tile takes it down, and anywhere else leaves it where it stands.
   */
  const followPath = (): void => {
    if (lit === undefined || lit.landings.length === 0 || presser === undefined) return;
    if (thingUnder(scene.game) !== presser) return;
    const pointer = scene.input.activePointer;
    const at = map.at(pointer.x, pointer.y);
    const tile = tileUnder(at.x, at.y);
    if (tile === undefined) return;
    if (sameTile(tile, lit.standing.tile)) {
      if (pathEnd !== undefined) showPath(undefined);
      return;
    }
    if (pathEnd !== undefined && sameTile(pathEnd.tile, tile)) return;
    const landing = lit.landings.find((one) => sameTile(one.tile, tile));
    if (landing !== undefined) showPath(landing);
  };
  // Outside Phaser's dispatch: a hit test inside it refills the list being walked (docs/PHASER.md).
  whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, followPath);

  /**
   * Every border on the chronicle the map stands on, darkened in fog: both cities' around each one's
   * tiles as the map draws them, and the enemies' around every face it draws carrying the age's
   * camp; painted again on every render.
   */
  const paintBorder = (): void => {
    const current = shown;
    if (current === undefined) return;
    const { building: camp } = ageOf(catalogue, current.age).camp;
    const worn: Record<Faction, WornAsDrawn[]> = { player: [], neutral: [], enemy: [] };
    for (const tile of current.tiles) {
      const face = drawnOf(tile);
      if (face === undefined) continue;
      const inFog = !live.has(tileKey(tile));
      const holder = face.snapshot === undefined ? holderOf(current, tile) : face.snapshot.holder;
      if (holder !== undefined) worn[holder].push({ tile, inFog });
      if (face.tile.building === camp) worn.enemy.push({ tile, inFog });
    }
    border.paint(worn);
  };

  /** What the map keeps of a unit, made the first time a render or a motion meets it. */
  const objectsOf = (unit: Unit): UnitObjects => {
    const kept = unitObjects.get(unit.id);
    if (kept !== undefined) return kept;
    const marker = unitMarker(scene).setDepth(UNIT_DEPTH);
    const hue = unreadGlow(scene);
    marks.add(marker);
    hues.add(hue);
    const made = { marker, hue };
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
   * unit of the player's with no move points and no action left dimmed, and a tile not drawn live
   * showing none of it.
   */
  const paintUnit = (chronicle: Chronicle, seen: Drawing, unit: Unit): UnitObjects => {
    const own = objectsOf(unit);
    const { marker, hue } = own;
    const key = tileKey(unit.tile);
    const { x, y } = positionOf(unit.tile);
    const stands = seen.live.has(key);
    const spent = unit.faction === 'player' && unit.movePoints <= 0 && unit.action <= 0;
    stopMotion(scene, [marker, hue]);
    asPainted(marker).setPosition(x, y).setName(`unit-${key}`).setVisible(stands);
    asUnit(marker, unit.stats.type, unit.faction, unit.embarked, spent ? 'done' : 'clear');
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
    paintRings();
    paintBadges();
    paintCityMarks();
    paintYields();
    lightUnit(selection);
  };

  const motion = createMapMotion(scene, {
    lying,
    ditches,
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
      const faces = facesIn(seen, chronicle.tiles);
      return {
        tile: face.tile,
        shoreOn: (coord) => shoreOn(catalogue, faces, coord),
        paint: () => paintTile(chronicle, seen, faces, tile),
      };
    },
    tileObjects: (key) => tileObjects[key],
    unitObjects: (id) => unitObjects.get(id),
    paintArrivals: (chronicle, units) => {
      const seen = drawing(chronicle);
      return units.map((unit) => paintUnit(chronicle, seen, unit).marker);
    },
    paintHue,
    improvementOn,
    buildingOn,
    patchOn,
    featureOn,
    lyingOn,
    ditchesOn,
    crossfade: (tile) => crossfadePool.take().setDepth(tile.r + CROSSFADE_RISE),
    shoreOver: (face) => crossfadePool.take().setDepth(face.depth + SHORE_RISE),
    riversAt: (chronicle, tile) => {
      const pieces = piecesOn(chronicle, drawing(chronicle));
      const moved = cornersOf(tile).flatMap((corner) => {
        const key = cornerKey(corner);
        const kept = riversWorn.get(key);
        const piece = pieces.get(key);
        if (piece?.painting === kept?.piece.painting) return [];
        return [{ kept, piece }];
      });
      if (moved.length === 0) return undefined;
      return () => ({
        coming: moved.flatMap(({ piece }) => (piece === undefined ? [] : paintPiece(piece))),
        going: moved.flatMap(({ kept }) => kept?.painted ?? []),
      });
    },
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
    carry: (unit) => {
      for (const [id, { marker }] of unitObjects) {
        marker.setDepth(id === unit ? CARRIED_DEPTH : UNIT_DEPTH);
      }
    },
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
        if (lit?.standing.id !== unit) return false;
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
        if (lit !== undefined && commandUnitOn(lit.standing.id, tile)) return;
        clicked(pressedOn(tile));
      };

      grab.onPress(catcher, commandUnitOn, reassigned);
    },

    markSelected(tile: TileCoords | undefined, cost: Cost | undefined): void {
      selection = tile === undefined ? undefined : { q: tile.q, r: tile.r };
      threshold =
        cost === undefined || selection === undefined ? undefined : { tile: selection, cost };
      selected.setData('tile', tile === undefined ? undefined : tileKey(tile));
      if (tile !== undefined) {
        const { x, y } = positionOf(tile);
        for (const mark of selectedRim) mark.setPosition(x, y);
      }
      paintRings();
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
      paintRings();
      paintCityMarks();
      paintYields();
      lightUnit(selection);
    },

    showVeils(next: Veils): void {
      veils = next;
      if (shown !== undefined) render(shown);
    },

    // On the two layers and never on their marks: every render and every motion writes the marks' own.
    showDiscs(on: boolean): void {
      features.setVisible(on);
      improvements.setVisible(on);
    },

    aimTile(
      admitted: AimShown,
      chosen: (tile: TileCoords) => void,
      refused: (at: PressedTile) => void,
      released: () => void,
    ): () => void {
      const { catcher, rims, close } = openAim();
      const drawnOnes = (tiles: readonly TileCoords[]): TileCoords[] =>
        tiles.filter((coord) => drawn.has(tileKey(coord)));
      const lit = drawnOnes(admitted.tiles);
      for (const coord of lit) {
        const { x, y } = positionOf(coord);
        rims.add(scene.add.container(x, y, selectionMarks()).setData('tile', tileKey(coord)));
      }
      const ringing = drawnOnes(admitted.units);
      aimRinged = ringing;
      paintRings();

      const click = (tile: TileCoords): void => {
        if ([...lit, ...ringing].some((coord) => sameTile(coord, tile))) chosen(tile);
        else refused(pressedOn(tile));
      };
      aimClicked = click;

      const stop = frame.takePress(catcher, {});

      return () => {
        stop();
        close();
        if (aimClicked === click) aimClicked = undefined;
        if (aimRinged === ringing) {
          aimRinged = [];
          paintRings();
        }
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
