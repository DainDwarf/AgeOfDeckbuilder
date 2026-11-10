import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { built, featurePlaced, made, reaches, slotFree, terraformed } from '../src/rules/cards';
import { achievementOf, ageOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { claimable } from '../src/rules/city';
import { enemyEntering } from '../src/rules/enemies';
import {
  CENTRE,
  neighbours,
  sameTile,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
  water,
} from '../src/rules/map';
import { buildingKind, featureKind } from '../src/rules/map-kinds';
import { freshCampaign } from '../src/rules/save';
import { chartedAt, inSight } from '../src/rules/sight';
import { followed, unchanged, walked } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import {
  buildingLookOf,
  clearingsOf,
  featureDressOf,
  featureIconOf,
  HERD_COPIES,
  PONDS,
  paintingsOf,
  shorePaintingsOf,
  tintedName,
} from '../src/ui/marks';
import {
  admits,
  aimed,
  budget,
  campGround,
  campKind,
  chronicleOf,
  claimedAt,
  consoleKey,
  dragBetween,
  dragOut,
  dragTiles,
  drawnFaces,
  eastOf,
  endTurn,
  enter,
  firstSeed,
  idsOf,
  inside,
  mapFrame,
  neutralCampaign,
  onScreen,
  openSaved,
  pinnedAchievement,
  playedOn,
  playedOut,
  playerCityTile,
  readings,
  rested,
  ringedTile,
  type Step,
  settledOn,
  shownCard,
  shows,
  sitesOf,
  standing,
  stillAt,
  tileOnScreen,
  unitEntered,
  watch,
  westOf,
  workerStepped,
} from './chronicle-screen';

/** A point on bare map, clear of the resource bar, the piles and the hand; no tile is read off it. */
const BARE = { at: { q: 0, r: -3 }, key: '0,-3' };

/** A bare tile the opening charts, clear of the same three: what a press picks out. */
const CHARTED = { at: { q: 1, r: -2 }, key: '1,-2' };

/** What one wheel notch multiplies the zoom by. */
const NOTCH = 1.3;

/** The card the worker plays where it stands. */
const GATHER = 'gather';

/** Seed 1's bare turn 1. */
const OPENED = settledOn(1);

/** The tile of the list furthest along the measure given. */
function furthest(tiles: readonly TileCoords[], by: (tile: TileCoords) => number): TileCoords {
  const { q, r } = tiles.reduce((far, tile) => (by(tile) > by(far) ? tile : far));
  return { q, r };
}

/** The tiles furthest east and furthest south: the last of the map to leave the frame. */
const EAST = furthest(
  OPENED.tiles.filter((tile) => tile.r === CENTRE.r),
  (tile) => tile.q,
);
const SOUTH = furthest(
  OPENED.tiles.filter((tile) => tile.q === CENTRE.q),
  (tile) => tile.r,
);

type Point = { x: number; y: number };

/** Drags from a page point by a page offset, well past the slack that tells a drag from a click. */
async function drag(page: Page, from: Point, by: Point): Promise<void> {
  await dragBetween(page, from, { x: from.x + by.x, y: from.y + by.y });
  await rested(page);
}

/**
 * Drags the map until the tile stands off the frame: the map is zoomed in first, since its own
 * bounds keep a frame at full width from ever carrying a tile near the middle of the disc out of
 * itself; then sideways, and up or down after it.
 */
async function pushOut(page: Page, coord: TileCoords): Promise<void> {
  const frame = await mapFrame(page);
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  await page.mouse.move(middle.x, middle.y);
  for (let notch = 0; notch < 2; notch++) await page.mouse.wheel(0, -100);
  await rested(page);

  for (const step of [
    { x: frame.width / 3, y: 0 },
    { x: 0, y: frame.height / 4 },
  ]) {
    for (let pass = 0; pass < 6; pass++) {
      const at = await tileOnScreen(page, coord);
      if (!inside(at, frame)) return;
      const way = Math.sign(step.x === 0 ? at.y - middle.y : at.x - middle.x) || 1;
      await drag(page, middle, { x: step.x * way, y: step.y * way });
    }
  }
}

/** The first seed's turn 1 whose first worker steps off the city onto a tile gather admits. */
function gatherStep(): Step {
  return workerStepped(
    'steps its first worker off the city with gather to play there',
    (stepped, tile) => admits(stepped, idsOf(stepped.hand).indexOf(GATHER), tile),
  );
}

/** The first seed's turn 1 whose first worker steps off the city onto the tile beside it `side` names. */
function workerStepsTo(side: (city: TileCoords) => TileCoords): Step {
  return workerStepped(
    'steps its first worker off the city onto the tile beside it along q',
    (stepped, tile) => tileKey(tile) === tileKey(side(playerCityTile(stepped))),
  );
}

/**
 * The first seed's bare turn 1 with the tile east of the city claimed, the claim's culture gained
 * first: a tile the city holds and nobody stands on, beside the population on the city's tile.
 */
function claimedEast(): { chronicle: Chronicle; claimed: TileCoords } {
  return firstSeed('claims the tile east of the city on its bare turn 1', (seed) => {
    const bare = settledOn(seed);
    const claimed = eastOf(playerCityTile(bare));
    const chronicle = claimedAt(bare, claimed);
    return chronicle === undefined ? undefined : { chronicle, claimed };
  });
}

/** The first pinned achievement a new campaign shows on the chronicle, by the name it stands under. */
function pinnedRead(chronicle: Chronicle): string {
  const { pins } = freshCampaign(CATALOGUE);
  const technology = chronicle.achievements
    .map(({ id }) => achievementOf(CATALOGUE, chronicle.age, id).technology)
    .find((read) => pins.includes(read));
  if (technology === undefined)
    throw new Error(`the ${chronicle.age} age reads no achievement a new campaign pins`);
  return pinnedAchievement(technology);
}

/** Whether the named object stands over the one tile and clear of the other, read in one question. */
async function standsOver(
  page: Page,
  name: string,
  over: TileCoords,
  clear: TileCoords,
): Promise<boolean[]> {
  const tiles = [`tile-${tileKey(over)}`, `tile-${tileKey(clear)}`];
  const seen = await readings(page, [name, ...tiles]);
  const box = seen(name).boundsOnScreen;
  return tiles.map((tile) => inside(seen(tile).onScreen, box));
}

/**
 * Seed 1's bare turn 1 with a raider entered three tiles out, on the first tile whose end of turn is
 * its one move with a tile of it in sight and no deal, and the crossing's two tiles.
 */
function raiderThreeOff(): { chronicle: Chronicle; from: TileCoords; to: TileCoords } {
  for (const tile of campGround(OPENED, 3)) {
    const { raider } = ageOf(CATALOGUE, OPENED.age).camp.scripts;
    const chronicle = unitEntered(OPENED, enemyEntering(campKind(OPENED), raider, tile));
    const stages = [...walked(apply(CATALOGUE, chronicle, { type: 'end-turn' }))];
    const moves = stages.flatMap((stage) =>
      stage.name === 'move'
        ? [{ from: stage.from, to: stage.to, seen: inSight(CATALOGUE, stage.chronicle) }]
        : [],
    );
    const [crossing] = moves;
    if (
      moves.length === 1 &&
      !stages.some((stage) => stage.name === 'deal') &&
      (crossing.seen.has(tileKey(crossing.from)) || crossing.seen.has(tileKey(crossing.to)))
    ) {
      return { chronicle, from: crossing.from, to: crossing.to };
    }
  }
  throw new Error('seed 1 crosses no raider entered three tiles out in sight');
}

/** Whether a building is drawn as his paintings. */
function painted(building: string | undefined): boolean {
  return building !== undefined && buildingLookOf(building).kind === 'painted';
}

/**
 * The paintings a tile's face may wear: his clearings of its terrain under a painted building where
 * he painted any, else his paintings of its terrain, each tinted for the feature on it where that
 * feature tints its tile.
 */
function facePaintingsOf({ terrain, feature, building }: Tile): string[] {
  const cleared = painted(building) ? clearingsOf(terrain) : [];
  const paintings = cleared.length > 0 ? [...cleared] : paintingsOf(terrain);
  if (feature === undefined || featureDressOf(feature).kind !== 'tint') return paintings;
  return paintings.map((painting) => tintedName(painting, feature));
}

/** The monument's stages, each built over the one before it. */
const STAGES = ['foundations', 'great-stones', 'monument'];

/** Every city's own building: each civilization's, and each a technology unlocks. */
const CITY_BUILDINGS = new Set([
  ...Object.values(CATALOGUE.civilizations).map(({ city }) => city.building),
  ...Object.values(CATALOGUE.technologies).flatMap(({ unlocks }) =>
    unlocks.city === undefined ? [] : [unlocks.city.building],
  ),
]);

/** How many claims the border may grow by while it looks for a building's ground. */
const CLAIMS = 12;

/**
 * The chain built in turn on a free tile of its first building's ground inside the border, a clearing's
 * terrain first, the feature it asks for placed first where none lies, the border claimed out where no
 * tile qualifies; nothing where `CLAIMS` claims find none.
 */
function builtInside(chronicle: Chronicle, chain: readonly string[]): Chronicle | undefined {
  const { terrains, features } = buildingKind(CATALOGUE, chain[0]);
  const featureFor = (tile: Tile): string | undefined =>
    tile.feature === undefined
      ? features?.find((feature) => featureKind(CATALOGUE, feature).terrain === tile.terrain)
      : features?.find((feature) => feature === tile.feature);
  let growing = chronicle;
  for (let claims = 0; claims <= CLAIMS; claims++) {
    const held = new Set(growing.held.map(tileKey));
    const reached = new Set([...held, ...claimable(CATALOGUE, growing, 'player').map(tileKey)]);
    const ground = growing.tiles
      .filter(
        (tile) =>
          reached.has(tileKey(tile)) &&
          slotFree(tile) === undefined &&
          unitAt(growing.units, tile) === undefined &&
          made(CATALOGUE, tile, terrains) === undefined &&
          (features === undefined || featureFor(tile) !== undefined),
      )
      .sort(
        (one, other) =>
          clearingsOf(other.terrain).length - clearingsOf(one.terrain).length ||
          Number(held.has(tileKey(other))) - Number(held.has(tileKey(one))),
      );
    const [at] = ground;
    if (at !== undefined) {
      const coord = { q: at.q, r: at.r };
      const inside = held.has(tileKey(at)) ? growing : claimedAt(growing, coord);
      if (inside === undefined) return undefined;
      let building = unchanged(inside);
      const feature = featureFor(at);
      if (feature !== undefined && at.feature === undefined) {
        building = followed(building, (left) => featurePlaced(CATALOGUE, left, coord, feature));
      }
      for (const id of chain)
        building = followed(building, (left) => built(CATALOGUE, left, coord, id));
      return building.chronicle;
    }
    const wider = claimable(CATALOGUE, growing, 'player')
      .map((tile) => claimedAt(growing, tile))
      .find((claimed) => claimed !== undefined);
    if (wider === undefined) return undefined;
    growing = wider;
  }
  return undefined;
}

/**
 * The first seed's Stone Age turn 1, both cities on their villages, with every painted building that
 * is no city's and no tile holds built by `builtInside`, each stage of the monument on its own tile.
 */
function castBuilt(): Chronicle {
  const campaign = neutralCampaign();
  return firstSeed(
    'builds every painted building of the cast inside the Stone Age border',
    (seed) => {
      const opened = settledOn(seed, [], campaign);
      const chains = Object.keys(CATALOGUE.buildings)
        .filter(
          (id) =>
            painted(id) &&
            !CITY_BUILDINGS.has(id) &&
            !opened.tiles.some((tile) => tile.building === id),
        )
        .map((id) => (STAGES.includes(id) ? STAGES.slice(0, STAGES.indexOf(id) + 1) : [id]));
      let chronicle: Chronicle | undefined = opened;
      for (const chain of chains) {
        if (chronicle !== undefined) chronicle = builtInside(chronicle, chain);
      }
      return chronicle;
    },
  );
}

/**
 * The chronicle with every feature the catalogue holds placed on a bare tile of its own: one of the
 * terrain it lies on where the map holds one, else the first a terraform into that terrain reaches,
 * terraformed first.
 */
function everyFeaturePlaced(chronicle: Chronicle): Chronicle {
  let placing = unchanged(chronicle);
  for (const feature of Object.keys(CATALOGUE.features)) {
    const { terrain } = featureKind(CATALOGUE, feature);
    const { tiles, units } = placing.chronicle;
    const bare = tiles.filter(
      (tile) =>
        tile.feature === undefined &&
        tile.building === undefined &&
        unitAt(units, tile) === undefined,
    );
    const lying = bare.find((tile) => tile.terrain === terrain);
    const at = lying ?? bare.find((tile) => reaches(CATALOGUE, placing.chronicle, tile, terrain));
    if (at === undefined) throw new Error(`no tile of the map is made ${terrain} for ${feature}`);
    const coord = { q: at.q, r: at.r };
    if (lying === undefined) {
      placing = followed(placing, (left) => terraformed(CATALOGUE, left, coord, terrain));
    }
    placing = followed(placing, (left) => featurePlaced(CATALOGUE, left, coord, feature));
  }
  return placing.chronicle;
}

/** The names of what a feature lays on its tile's ground. */
function lyingNames(feature: string, key: string): string[] {
  const dress = featureDressOf(feature);
  switch (dress.kind) {
    case 'herd':
      return Array.from({ length: HERD_COPIES }, (_, copy) => `herd-${key}-${copy}`);
    case 'pond':
      return [`pond-${key}`];
    case 'tint':
      return [];
  }
}

/** The first water terrain the catalogue holds. */
const WATER = (() => {
  const terrain = Object.keys(CATALOGUE.terrains).find((id) => water(CATALOGUE, id));
  if (terrain === undefined) throw new Error('the catalogue holds no water terrain');
  return terrain;
})();

/** Whether each tile beside a tile is land among these faces, in the order `neighbours` walks them. */
function landBeside(faces: readonly Tile[], coord: TileCoords): boolean[] {
  const beside = tilesBeside(faces);
  return neighbours(coord).map((tile) => {
    const face = beside(tile);
    return face !== undefined && !water(CATALOGUE, face.terrain);
  });
}

/** The chronicle with a tile made water through the rules, and charted as it stands. */
function madeWater(chronicle: Chronicle, at: TileCoords): Chronicle {
  return chartedAt(CATALOGUE, terraformed(CATALOGUE, chronicle, at, WATER).chronicle, at);
}

/**
 * Seed 1's bare turn 1 with the first tile beside the city made water, and the first tile of the
 * centre part made water that the map draws land beside and has uncharted land beside; and a tile
 * beside the city the map draws as land.
 */
function shored(): { chronicle: Chronicle; beside: TileCoords; rim: TileCoords; land: TileCoords } {
  const city = playerCityTile(OPENED);
  const beside = neighbours(city).find(
    (tile) => tileAt(madeWater(OPENED, tile).tiles, tile)?.terrain === WATER,
  );
  if (beside === undefined) throw new Error('seed 1 makes no tile beside the city water');
  const wet = madeWater(OPENED, beside);
  for (const { q, r } of OPENED.centre) {
    const rim = { q, r };
    if (sameTile(rim, city) || sameTile(rim, beside)) continue;
    const chronicle = madeWater(wet, rim);
    if (tileAt(chronicle.tiles, rim)?.terrain !== WATER) continue;
    const drawn = landBeside(drawnFaces(chronicle), rim);
    if (!drawn.includes(true) || drawn.join() === landBeside(chronicle.tiles, rim).join()) continue;
    const landBesideCity = landBeside(drawnFaces(chronicle), city);
    const land = neighbours(city).find((_, at) => landBesideCity[at]);
    if (land === undefined) continue;
    return { chronicle, beside, rim, land };
  }
  throw new Error('seed 1 makes no tile of its centre part water beside uncharted land');
}

test('the map is framed between the resource bar and the band, on the city', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const frame = await mapFrame(page);
  const bar = await onScreen(page, 'bar-edge');
  const band = await onScreen(page, 'band-edge');
  expect(Math.abs(frame.y - bar.y)).toBeLessThan(2);
  expect(Math.abs(frame.y + frame.height - band.y)).toBeLessThan(2);
  expect((await onScreen(page, 'band')).y).toBeGreaterThan(frame.y + frame.height);

  const at = await onScreen(page, `tile-${tileKey(playerCityTile(OPENED))}`);
  expect(Math.abs(at.x - (frame.x + frame.width / 2))).toBeLessThan(2);
  expect(Math.abs(at.y - (frame.y + frame.height / 2))).toBeLessThan(2);

  expect(problems).toEqual([]);
});

test("every tile the map draws wears a painting of its terrain, the rows three quarters of a tile's width apart", async ({
  page,
}) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const faces = drawnFaces(OPENED);
  const lattice = [CENTRE, eastOf(CENTRE), { q: CENTRE.q, r: CENTRE.r + 1 }];
  const names = new Set([...faces, ...lattice].map((tile) => `tile-${tileKey(tile)}`));
  const seen = await readings(page, [...names]);
  for (const face of faces) {
    expect(facePaintingsOf(face)).toContain(seen(`tile-${tileKey(face)}`).frame);
  }
  const [origin, east, south] = lattice.map((tile) => seen(`tile-${tileKey(tile)}`).onScreen);
  expect((south.y - origin.y) / (east.x - origin.x)).toBeCloseTo(0.75, 2);

  expect(problems).toEqual([]);
});

test('a water tile wears the shore along every edge where the map draws land, the uncharted beside it bare, and a land tile wears none', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, beside, rim, land } = shored();
  const faces = drawnFaces(chronicle);

  await openSaved(page, chronicle);

  const shore = (tile: TileCoords): string => `shore-${tileKey(tile)}`;
  const seen = await readings(page, [beside, rim, land].map(shore));
  for (const wet of [beside, rim]) {
    expect(seen(shore(wet)).standing).toBe(true);
    expect(shorePaintingsOf(landBeside(faces, wet))).toContain(seen(shore(wet)).frame);
  }
  expect(shorePaintingsOf(landBeside(chronicle.tiles, rim))).not.toContain(seen(shore(rim)).frame);
  expect(seen(shore(land)).standing).toBe(false);

  expect(problems).toEqual([]);
});

test("every feature stands as his icon on its disc, a herd's tile carries three of its animal, an oasis lies on one of his ponds, and a feature that tints its tile wears its painting tinted", async ({
  page,
}) => {
  const problems = watch(page);
  const chronicle = everyFeaturePlaced(OPENED);

  await openSaved(page, chronicle);
  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  const featured = chronicle.tiles.flatMap(({ q, r, feature }) =>
    feature === undefined ? [] : [{ key: tileKey({ q, r }), feature }],
  );
  const seen = await readings(page, [
    ...chronicle.tiles.map((tile) => `tile-${tileKey(tile)}`),
    ...featured.flatMap(({ key, feature }) => [
      `feature-${key}`,
      `feature-disc-${key}`,
      ...lyingNames(feature, key),
    ]),
  ]);
  for (const tile of chronicle.tiles) {
    expect(facePaintingsOf(tile)).toContain(seen(`tile-${tileKey(tile)}`).frame);
  }
  for (const { key, feature } of featured) {
    expect(seen(`feature-${key}`).standing).toBe(true);
    expect(seen(`feature-${key}`).frame).toBe(featureIconOf(feature));
    expect(seen(`feature-disc-${key}`).standing).toBe(true);
    for (const name of lyingNames(feature, key)) expect(seen(name).count).toBe(1);
    if (featureDressOf(feature).kind === 'pond') expect(PONDS).toContain(seen(`pond-${key}`).frame);
  }

  expect(problems).toEqual([]);
});

test('every painted building stands as one of his paintings of it, a forest under one wears his clearing and every other forest its own, and the camps and the sites stand as their marks', async ({
  page,
}) => {
  const problems = watch(page);
  // The Nomadic city stands on the one painted building no Stone Age chronicle holds.
  const chronicles = [OPENED, castBuilt()];
  const unbuilt = Object.keys(CATALOGUE.buildings).filter(
    (id) =>
      painted(id) && !chronicles.some(({ tiles }) => tiles.some((tile) => tile.building === id)),
  );
  expect(unbuilt).toEqual([]);
  const cleared = chronicles.flatMap(({ tiles }) =>
    tiles.filter((tile) => clearingsOf(tile.terrain).length > 0 && painted(tile.building)),
  );
  expect(cleared.length).toBeGreaterThan(0);

  for (const chronicle of chronicles) {
    await openSaved(page, chronicle);
    await consoleKey(page);
    await enter(page, 'uncharted');
    await consoleKey(page);

    const paintedOn = chronicle.tiles.flatMap(({ q, r, building }) => {
      if (building === undefined) return [];
      const look = buildingLookOf(building);
      return look.kind === 'painted' ? [{ key: tileKey({ q, r }), look }] : [];
    });
    const { building: camp } = ageOf(CATALOGUE, chronicle.age).camp;
    const camps = chronicle.tiles.filter((tile) => tile.building === camp);
    const sites = sitesOf(chronicle);
    expect(camps.length).toBeGreaterThan(0);
    expect(sites.length).toBeGreaterThan(0);
    const marked = [...camps, ...sites].map(tileKey);
    const forests = chronicle.tiles.filter((tile) => clearingsOf(tile.terrain).length > 0);
    const seen = await readings(page, [
      ...paintedOn.map(({ key }) => `building-${key}`),
      ...marked.map((key) => `building-${key}`),
      ...forests.map((tile) => `tile-${tileKey(tile)}`),
    ]);
    for (const { key, look } of paintedOn) {
      expect(seen(`building-${key}`).standing).toBe(true);
      expect(look.pieces.at(-1)?.files).toContain(seen(`building-${key}`).frame);
    }
    for (const key of marked) expect(seen(`building-${key}`).standing).toBe(true);
    for (const tile of forests) {
      expect(facePaintingsOf(tile)).toContain(seen(`tile-${tileKey(tile)}`).frame);
    }
  }

  expect(problems).toEqual([]);
});

test('a drag on bare map carries the map with it, and picks out no tile', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const before = await tileOnScreen(page, CHARTED.at);
  await drag(page, before, { x: 120, y: -80 });

  const after = await tileOnScreen(page, CHARTED.at);
  expect(after.x - before.x).toBeCloseTo(120, 0);
  expect(after.y - before.y).toBeCloseTo(-80, 0);
  expect(await ringedTile(page)).toBeUndefined();

  await page.mouse.click(after.x, after.y);
  await expect.poll(() => ringedTile(page)).toBe(CHARTED.key);

  expect(problems).toEqual([]);
});

test('a pan and a zoom carry the ringed tile and the panel beside it', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const tile = await tileOnScreen(page, CHARTED.at);
  await page.mouse.click(tile.x, tile.y);
  await expect.poll(() => ringedTile(page)).toBe(CHARTED.key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  const panel = await onScreen(page, 'infopanel');
  await drag(page, tile, { x: 120, y: -80 });

  const panned = await tileOnScreen(page, CHARTED.at);
  const carried = await onScreen(page, 'infopanel');
  expect(await ringedTile(page)).toBe(CHARTED.key);
  expect(await shownCard(page)).toBe('terrain');
  expect(panned.x - tile.x).toBeCloseTo(120, 0);
  expect(carried.x - panel.x).toBeCloseTo(120, 0);
  expect(carried.y - panel.y).toBeCloseTo(-80, 0);

  await page.mouse.move(panned.x, panned.y);
  await page.mouse.wheel(0, -100);
  await rested(page);

  const zoomed = await onScreen(page, 'infopanel');
  const grown = await tileOnScreen(page, CHARTED.at);
  expect(await ringedTile(page)).toBe(CHARTED.key);
  expect(await shownCard(page)).toBe('terrain');
  // The tile keeps the ground it had under the pointer and grows, so the panel stands further off.
  expect(Math.abs(grown.x - panned.x)).toBeLessThan(2);
  expect(zoomed.x).toBeGreaterThan(carried.x);

  expect(problems).toEqual([]);
});

test('a drag on bare ground pans the map, and a drag from the unit moves it', async ({ page }) => {
  const problems = watch(page);
  const step = gatherStep();

  await openSaved(page, step.entered);

  const before = await tileOnScreen(page, BARE.at);
  await drag(page, before, { x: 100, y: 60 });

  const after = await tileOnScreen(page, BARE.at);
  expect(after.x - before.x).toBeCloseTo(100, 0);
  expect(after.y - before.y).toBeCloseTo(60, 0);
  expect(await chronicleOf(page)).toEqual(step.entered);

  const city = await onScreen(page, `tile-${tileKey(playerCityTile(step.entered))}`);
  const destination = await onScreen(page, `tile-${tileKey(step.tile)}`);
  await drag(page, city, { x: destination.x - city.x, y: destination.y - city.y });
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(step.stepped);
  // The press that took hold of the unit left the map where it stood.
  const held = await tileOnScreen(page, BARE.at);
  expect(held.x).toBeCloseTo(after.x, 0);
  expect(held.y).toBeCloseTo(after.y, 0);

  expect(problems).toEqual([]);
});

test('a unit carried onto a lit tile the infopanel stands over and let go there comes home, the selection where it was', async ({
  page,
}) => {
  const problems = watch(page);
  const step = workerStepsTo(eastOf);
  const city = playerCityTile(step.entered);

  await openSaved(page, step.entered);

  const mark = `unit-${tileKey(city)}`;
  const seen = await readings(page, [`tile-${tileKey(city)}`, mark]);
  const home = seen(`tile-${tileKey(city)}`).onScreen;
  const stood = seen(mark).onScreen;
  await page.mouse.click(home.x, home.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBeDefined();
  await rested(page);
  expect(await standsOver(page, 'infopanel', step.tile, city)).toEqual([true, false]);

  await dragTiles(page, city, step.tile);
  await expect.poll(() => stillAt(page, mark, stood)).toBe(true);
  expect(await chronicleOf(page)).toEqual(step.entered);
  expect(await ringedTile(page)).toBe(tileKey(city));

  expect(problems).toEqual([]);
});

test('a population carried in city mode onto a tile the infopanel stands over and let go there comes home, and nothing changes', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, claimed } = claimedEast();
  const city = playerCityTile(chronicle);

  await openSaved(page, chronicle);
  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);

  const seen = await readings(page, [`tile-${tileKey(city)}`, 'assigned']);
  const home = seen(`tile-${tileKey(city)}`).onScreen;
  const stood = seen('assigned').onScreen;
  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBeDefined();
  await rested(page);
  expect(await standsOver(page, 'infopanel', claimed, city)).toEqual([true, false]);

  await dragTiles(page, city, claimed);
  await expect.poll(() => stillAt(page, 'assigned', stood)).toBe(true);
  expect(await chronicleOf(page)).toEqual(chronicle);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a unit carried onto a lit tile a pinned achievement stands over and let go there comes home', async ({
  page,
}) => {
  const problems = watch(page);
  const step = workerStepsTo(westOf);
  const city = playerCityTile(step.entered);

  const pin = pinnedRead(step.entered);

  await openSaved(page, step.entered);

  const tile = `tile-${tileKey(step.tile)}`;
  const seen = await readings(page, [pin, tile, `tile-${tileKey(city)}`]);
  const plate = seen(pin).boundsOnScreen;
  const from = seen(tile).onScreen;
  // Half the step to the city: the tile lands inside the plate and the city as far outside it.
  const inset = (seen(`tile-${tileKey(city)}`).onScreen.x - from.x) / 2;
  await drag(page, from, {
    x: plate.x + plate.width - inset - from.x,
    y: plate.y + plate.height / 2 - from.y,
  });
  expect(await standsOver(page, pin, step.tile, city)).toEqual([true, false]);
  const mark = `unit-${tileKey(city)}`;
  const dragged = await readings(page, [`tile-${tileKey(city)}`, mark]);
  expect(inside(dragged(`tile-${tileKey(city)}`).onScreen, await mapFrame(page))).toBe(true);
  const stood = dragged(mark).onScreen;

  await dragTiles(page, city, step.tile);
  await expect.poll(() => stillAt(page, mark, stood)).toBe(true);
  expect(await chronicleOf(page)).toEqual(step.entered);

  expect(problems).toEqual([]);
});

test('a drag during a tile aim pans the map, and the aim still plays after it', async ({
  page,
}) => {
  const problems = watch(page);
  const step = gatherStep();
  const index = idsOf(step.stepped.hand).indexOf(GATHER);
  const gathered = playedOn(step.stepped, index, step.tile);

  await openSaved(page, step.stepped);
  await dragOut(page, index);
  await aimed(page);

  const before = await tileOnScreen(page, BARE.at);
  await drag(page, before, { x: -90, y: 40 });

  const after = await tileOnScreen(page, BARE.at);
  expect(after.x - before.x).toBeCloseTo(-90, 0);
  expect(after.y - before.y).toBeCloseTo(40, 0);
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(step.stepped);

  const aimedAt = await onScreen(page, `tile-${tileKey(step.tile)}`);
  await page.mouse.click(aimedAt.x, aimedAt.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(gathered);

  expect(problems).toEqual([]);
});

test('a wheel notch zooms the map about the pointer', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const before = await tileOnScreen(page, BARE.at);
  const east = await tileOnScreen(page, EAST);
  await page.mouse.move(before.x, before.y);
  await page.mouse.wheel(0, -100);
  await rested(page);

  const after = await tileOnScreen(page, BARE.at);
  const eastAfter = await tileOnScreen(page, EAST);

  // What the pointer stood on stays under it, and the map grows out from there by one notch.
  expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  expect(after.unit / before.unit).toBeCloseTo(NOTCH, 2);
  expect((eastAfter.x - after.x) / (east.x - before.x)).toBeCloseTo(NOTCH, 2);

  expect(problems).toEqual([]);
});

test('a held pan key moves the map, and lets go of it when it is released', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const before = await tileOnScreen(page, BARE.at);
  await page.keyboard.down('w');
  // The frame pans up, so what stands on the map comes down the screen.
  await expect
    .poll(() => tileOnScreen(page, BARE.at).then((at) => at.y))
    .toBeGreaterThan(before.y + 40);
  await page.keyboard.up('w');

  await rested(page);
  await rested(page);
  const stopped = await tileOnScreen(page, BARE.at);
  await rested(page);
  expect((await tileOnScreen(page, BARE.at)).y).toBe(stopped.y);

  expect(problems).toEqual([]);
});

test('however far the map is dragged, it cannot leave the frame', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);
  const frame = await mapFrame(page);

  // Passes the width and the height of the frame at a time, well past the whole map's own size.
  const west = { x: frame.x + frame.width - 40, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, west, { x: 80 - frame.width, y: 0 });
  const north = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, north, { x: 0, y: -frame.height / 3 });

  // The push west keeps the east end across the frame; the south end, the disc's south-east corner,
  // stays in it both ways.
  const east = await tileOnScreen(page, EAST);
  expect(east.x).toBeGreaterThan(frame.x);
  expect(east.x).toBeLessThan(frame.x + frame.width);
  expect(inside(await tileOnScreen(page, SOUTH), frame)).toBe(true);

  // One more of each pass finds the map already against its bounds.
  await drag(page, west, { x: 80 - frame.width, y: 0 });
  await drag(page, north, { x: 0, y: -frame.height / 3 });
  const again = await tileOnScreen(page, EAST);
  expect(again.x).toBeCloseTo(east.x, 0);
  expect(again.y).toBeCloseTo(east.y, 0);

  expect(problems).toEqual([]);
});

test('a stage on tiles the frame already holds pans nothing', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const run = raiderThreeOff();
  const crossed = outcome(apply(CATALOGUE, run.chronicle, { type: 'end-turn' }));

  await openSaved(page, run.chronicle);

  const frame = await mapFrame(page);
  const at = await tileOnScreen(page, run.to);
  expect(inside(at, frame)).toBe(true);
  // Onto the middle of the frame, so both tiles the move plays on stand well inside it.
  await drag(page, at, {
    x: frame.x + frame.width / 2 - at.x,
    y: frame.y + frame.height / 2 - at.y,
  });

  const before = await tileOnScreen(page, run.to);
  expect(inside(await tileOnScreen(page, run.from), frame)).toBe(true);
  await endTurn(page);

  const after = await tileOnScreen(page, run.to);
  expect(after.x).toBeCloseTo(before.x, 1);
  expect(after.y).toBeCloseTo(before.y, 1);
  expect(await chronicleOf(page)).toEqual(crossed);

  expect(problems).toEqual([]);
});

test('a stage on tiles the frame does not show is brought into it', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const run = raiderThreeOff();
  const crossed = outcome(apply(CATALOGUE, run.chronicle, { type: 'end-turn' }));

  await openSaved(page, run.chronicle);

  const frame = await mapFrame(page);
  await pushOut(page, run.to);
  expect(inside(await tileOnScreen(page, run.to), frame)).toBe(false);

  await endTurn(page);

  expect(inside(await tileOnScreen(page, run.to), frame)).toBe(true);
  expect(await chronicleOf(page)).toEqual(crossed);

  expect(problems).toEqual([]);
});
