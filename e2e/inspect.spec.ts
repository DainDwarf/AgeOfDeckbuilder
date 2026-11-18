import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { built } from '../src/rules/cards';
import { ageOf, bonusOf, fullHealth, placingOf, unitKind } from '../src/rules/catalogue';
import { enemyEntering } from '../src/rules/enemies';
import {
  type FeatureId,
  MOVE_POINT,
  movementCost,
  neighbours,
  runsAlong,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
} from '../src/rules/map';
import { buildingKind, featureKind } from '../src/rules/map-kinds';
import type { Resources } from '../src/rules/resources';
import { unitDamaged } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { tileYield, yieldParts } from '../src/rules/yields';
import { type CardArt, cardArtOf, unitGroundOf } from '../src/ui/art-box';
import { artFrameOf } from '../src/ui/art-sheet';
import {
  buildingFace,
  cardFaceAtStart,
  type Face,
  frontWindowOf,
  unitFacing,
} from '../src/ui/face';
import { LOOK } from '../src/ui/look';
import { featureName, improvementName, terrainName, text } from '../src/ui/text';
import {
  besideTiles,
  campBeside,
  cardOnFace,
  claimedAt,
  dragSlack,
  drawnFaces,
  firstSeed,
  freeGround,
  inspected,
  nameOnScreen,
  onDeer,
  onScreen,
  onTheBand,
  openCampaign,
  openSaved,
  type PanelRow,
  paintedOn,
  panelFace,
  panelMovement,
  panelRows,
  playerCityTile,
  type Reading,
  reacted,
  reading,
  readings,
  referenceOnFace,
  rested,
  ringedLitAndInspecting,
  ringedTile,
  riverRows,
  settledOn,
  shownCard,
  standing,
  TRAPPING,
  unitEntered,
  WARRIOR,
  watch,
  westOf,
  wonCampaign,
} from './chronicle-screen';

declare global {
  interface Window {
    /** Whether the game cancelled the browser's own menu, once the browser has asked for one. */
    browserMenu?: boolean;
  }
}

/** Listens for the browser asking for a menu of its own; nothing is asked for until it is. */
function watchBrowserMenu(page: Page): Promise<void> {
  return page.evaluate(() => {
    window.addEventListener(
      'contextmenu',
      (event) => {
        window.browserMenu = event.defaultPrevented;
      },
      { once: true },
    );
  });
}

/** Whether the browser asked for a menu, and whether the game cancelled the one it asked for. */
function browserMenu(page: Page): Promise<boolean | undefined> {
  return page.evaluate(() => window.browserMenu);
}

/**
 * The chronicle a search over the seeds found, a tile touching its city, and so well inside the
 * frame, and what the search found there.
 */
type Found<T> = { readonly chronicle: Chronicle; readonly tile: Tile; readonly found: T };

/** The first of the city's neighbours that `found` answers, and its answer. */
function besideOn<T>(
  chronicle: Chronicle,
  found: (tile: Tile) => T | undefined,
): Found<T> | undefined {
  for (const at of neighbours(playerCityTile(chronicle))) {
    const tile = tileAt(chronicle.tiles, at);
    if (tile === undefined) continue;
    const answer = found(tile);
    if (answer !== undefined) return { chronicle, tile, found: answer };
  }
  return undefined;
}

/** The first seed's turn 1 on the Nomadic content, its city settled bare, with a neighbour `found` answers. */
function besideCity<T>(
  complaint: string,
  found: (tile: Tile, chronicle: Chronicle) => T | undefined,
): Found<T> {
  return firstSeed(complaint, (seed) => {
    const chronicle = settledOn(seed);
    return besideOn(chronicle, (tile) => found(tile, chronicle));
  });
}

/**
 * A chronicle whose city tile and the tile west of it hold nothing but what the spec steps: no
 * river runs along either, and the west one is bare, so its terrain card is the only one it holds.
 */
function stepsClear(chronicle: Chronicle): boolean {
  const west = tileAt(chronicle.tiles, westOf(playerCityTile(chronicle)));
  return (
    west !== undefined &&
    west.feature === undefined &&
    west.building === undefined &&
    west.improvements.length === 0 &&
    !runsAlong(chronicle.rivers, playerCityTile(chronicle)) &&
    !runsAlong(chronicle.rivers, west)
  );
}

/** The first seed's turn 1, with the first worker entered on the city, whose steps are clear. */
function workerOnCity(): Chronicle {
  return firstSeed('enters its first worker on a city whose steps are clear', (seed) => {
    const chronicle = settledOn(seed, ['first-worker']);
    return stepsClear(chronicle) ? chronicle : undefined;
  });
}

/** A tile beside the city with a feature on it, and the feature. */
function featureBeside(): Found<FeatureId> {
  return besideCity('puts a feature beside the city', (tile) => tile.feature);
}

/**
 * A tile beside the city bare of feature, building and improvement, a river running along it, and
 * what it yields.
 */
function riverBeside(): Found<Partial<Resources>> {
  return besideCity('runs a river along a bare tile beside the city', (tile, chronicle) =>
    tile.feature === undefined &&
    tile.building === undefined &&
    tile.improvements.length === 0 &&
    runsAlong(chronicle.rivers, tile)
      ? tileYield(CATALOGUE, chronicle, tile, tilesBeside(drawnFaces(chronicle)))
      : undefined,
  );
}

/**
 * A tile beside the city bare of feature, building and improvement, and its key; a river may run
 * along it, being a row of its terrain card, not a card.
 */
function bareBeside(): Found<string> {
  return besideCity('leaves a tile beside the city bare', (tile) =>
    tile.feature === undefined && tile.building === undefined && tile.improvements.length === 0
      ? tileKey(tile)
      : undefined,
  );
}

/**
 * The first card of the catalogue that builds a building of its own, taking upkeep, naming no
 * feature and no river and giving nothing beside it, and that building.
 */
const BUILT = (() => {
  for (const [card, content] of Object.entries(CATALOGUE.cards)) {
    const placing = placingOf(content);
    if (placing?.thing !== 'building' || placing.over !== undefined) continue;
    const { upkeep, features, river, givesBeside } = buildingKind(CATALOGUE, placing.building);
    if (upkeep !== undefined && !features && !river && !givesBeside) {
      return { card, building: placing.building };
    }
  }
  throw new Error('no card of the catalogue builds a building taking upkeep alone');
})();

/**
 * The first card of the catalogue that builds its building over another, that building, and the one
 * it is built over.
 */
const BUILT_OVER = (() => {
  for (const [card, content] of Object.entries(CATALOGUE.cards)) {
    const placing = placingOf(content);
    if (placing?.thing === 'building' && placing.over !== undefined) {
      return { card, building: placing.building, over: placing.over };
    }
  }
  throw new Error('no card of the catalogue builds a building over another');
})();

/**
 * A tile beside the city the first of the buildings goes on, bare of building and improvement and
 * with nobody on it, claimed, and the buildings built there in turn, each over the one before.
 */
function builtBeside(buildings: readonly string[]): Found<Chronicle> {
  const { terrains } = buildingKind(CATALOGUE, buildings[0]);
  return besideCity(`claims a tile beside the city ${buildings[0]} goes on`, (tile, chronicle) => {
    if (!terrains.includes(tile.terrain) || tile.building !== undefined) return undefined;
    if (tile.improvements.length > 0 || unitAt(chronicle.units, tile) !== undefined)
      return undefined;
    const claimed = claimedAt(chronicle, tile);
    if (claimed === undefined) return undefined;
    return buildings.reduce(
      (standing, building) => built(CATALOGUE, standing, tile, building).chronicle,
      claimed,
    );
  });
}

/** What a face reads that the infopanel's is held to: its card, its text, its picture, and what it names. */
type FaceRead = {
  readonly card: string | undefined;
  readonly rules: string;
  readonly art: string;
  readonly references: readonly { readonly kind: string; readonly id: string }[];
};

/** What a face read on the page reads that the infopanel's is held to. */
function faceRead({ card, rules, art, references }: Reading): FaceRead {
  return { card, rules, art, references };
}

/** What a face that names nothing in its text reads: its card, its text, its picture, and its marks. */
function faceDrawn(face: Face): FaceRead {
  if (face.art === undefined) throw new Error(`the face of ${face.id} holds no painting`);
  return {
    card: face.id,
    rules: face.rules,
    art: artFrameOf(face.art, frontWindowOf(face.front)),
    references: face.goesOn.flatMap((mark) => (mark.kind === 'river' ? [] : [mark])),
  };
}

/** A row of grey paper as the infopanel reads it, and its "No yield" where it gives nothing. */
function rowRead(name: string, yields: Partial<Resources>): PanelRow[] {
  const read = { text: name, yields };
  return Object.keys(yields).length === 0
    ? [read, { text: text('panel.no-yield'), yields: {} }]
    : [read];
}

/**
 * The first seed's bare turn 1 whose opening charts a tile nothing crosses, a unit or an embarked
 * one, and a tile beside the city costing two move points, bare and with nobody on it so its terrain
 * card is the whole of its cycle: that tile, what entering it costs, and the tile nothing crosses.
 */
function costBeside(): Found<number> & { readonly uncrossed: TileCoords } {
  return firstSeed(
    'leaves a tile costing two move points beside the city, and a tile nothing crosses in sight',
    (seed) => {
      const chronicle = settledOn(seed);
      const uncrossed = chronicle.snapshots.find(
        ({ tile }) =>
          movementCost(CATALOGUE, tile, false) === undefined &&
          movementCost(CATALOGUE, tile, true) === undefined,
      );
      if (uncrossed === undefined) return undefined;
      const land = besideOn(chronicle, (tile) => {
        const cost = movementCost(CATALOGUE, tile, false);
        const bare =
          !chronicle.units.some((unit) => tileKey(unit.tile) === tileKey(tile)) &&
          tile.building === undefined &&
          tile.improvements.length === 0;
        return bare && cost === 2 * MOVE_POINT ? cost : undefined;
      });
      return land === undefined ? undefined : { ...land, uncrossed };
    },
  );
}

test('a tile the generator gave a feature shows its mark, and the terrain card gives it a row of its own', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, found: feature } = featureBeside();
  const key = tileKey(tile);

  await openSaved(page, chronicle);
  expect(await standing(page, `feature-${key}`)).toBe(true);

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const at = await onScreen(page, `tile-${key}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  await expect
    .poll(() => panelRows(page))
    .toContainEqual({ text: featureName(feature), yields: featureKind(CATALOGUE, feature).yields });

  expect(problems).toEqual([]);
});

test('a building card is the face of the card whose play places the building, as the hand draws that card, the city’s card holding the city’s building; a rest on a mark at its window’s foot raises that terrain’s small card', async ({
  page,
}) => {
  const problems = watch(page);
  const { tile, found: chronicle } = builtBeside([BUILT.building]);
  const { card, building } = chronicle.citySection;
  const city = `tile-${tileKey(playerCityTile(chronicle))}`;
  const beside = `tile-${tileKey(tile)}`;

  await openSaved(page, chronicle);
  const seen = await readings(page, [city, beside]);

  // Nobody stands on the city this early, nor on the tile built on: each one's building card comes
  // first. The city's first, the panel standing east of it over whatever lies there.
  const onCity = seen(city).onScreen;
  await page.mouse.click(onCity.x, onCity.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(faceRead(await panelFace(page))).toEqual(
    faceDrawn(cardFaceAtStart(CATALOGUE, card, building)),
  );
  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();

  const built = seen(beside).onScreen;
  await page.mouse.click(built.x, built.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  await rested(page);
  const face = await panelFace(page);
  expect(faceRead(face)).toEqual(faceDrawn(cardFaceAtStart(CATALOGUE, BUILT.card, undefined)));

  const mark = face.nameOnScreen;
  await page.mouse.move(mark.x, mark.y, { steps: 5 });
  await expect.poll(() => referenceOnFace(page, 'small-card-0')).toEqual(face.references[0]);

  expect(problems).toEqual([]);
});

test('a camp’s building card is a face of its own, reading what it is, the terrains it stands on and its painting on the ground of the trophy its capture deals', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, camp } = campBeside((tile) => ({ type: WARRIOR, faction: 'player', tile }));
  const { building, rewards } = ageOf(CATALOGUE, chronicle.age).camp;
  const holdsCamp = (art: CardArt | undefined): art is CardArt =>
    art !== undefined &&
    art.holds !== 'placed' &&
    art.holds.kind === 'building' &&
    art.holds.building === building;
  const trophy = Object.keys(rewards).map(cardArtOf).find(holdsCamp);
  if (trophy === undefined) throw new Error(`no trophy of the camp ${building} holds it`);

  await openSaved(page, chronicle);

  // The warrior planted on it comes first, the building card after it.
  const at = await onScreen(page, `tile-${tileKey(camp)}`);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(faceRead(await panelFace(page))).toEqual({
    card: building,
    rules: text('face.camp'),
    art: artFrameOf(
      { window: 'oval', ground: trophy.ground, holds: { kind: 'building', building } },
      'oval',
    ),
    references: buildingKind(CATALOGUE, building).terrains.map((id) => ({ kind: 'terrain', id })),
  });

  expect(problems).toEqual([]);
});

/** The unit kind no card places. */
const LEADER = 'leader';

/**
 * Seed 1's turn 1 on the campaign a win has paid into, a warrior of the player's on a camp beside the
 * city and an enemy leader on the first ground beside the city, each wounded by one; the two tiles.
 */
function woundedBesideCity(): {
  readonly chronicle: Chronicle;
  readonly campaign: Campaign;
  readonly warrior: TileCoords;
  readonly leader: TileCoords;
} {
  const campaign = wonCampaign();
  const { chronicle: camped, camp } = campBeside(
    (tile) => ({ type: WARRIOR, faction: 'player', tile }),
    campaign,
  );
  const [leader] = freeGround(camped, LEADER, 1);
  if (leader === undefined) throw new Error('seed 1 leaves no ground beside its city for a leader');
  const { raider } = ageOf(CATALOGUE, camped.age).camp.scripts;
  const led = unitEntered(camped, enemyEntering(LEADER, raider, leader));
  const wounded = [camp, leader].reduce(
    (standing, tile) => unitDamaged(standing, tile, 1).chronicle,
    led,
  );
  return { chronicle: wounded, campaign, warrior: camp, leader };
}

/** What a face's health reads. */
function healthOn({ stats }: Reading): string | undefined {
  return stats.find(({ stat }) => stat === 'health')?.number;
}

test('a unit’s card is the face of the unit card that places its kind, reading the health it holds over its kind’s own, its window holding the unit in its faction’s halo; the leader, which no card places, wears a face of its own', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, campaign, warrior, leader } = woundedBesideCity();
  const facing = unitFacing(CATALOGUE, WARRIOR);
  if (facing.wears !== 'card') throw new Error(`no unit card places ${WARRIOR}`);
  const art = cardArtOf(facing.card);
  if (art === undefined) throw new Error(`the card ${facing.card} holds no painting`);
  const ground = unitGroundOf(LEADER);
  if (ground === undefined) throw new Error(`the face of ${LEADER} holds no ground`);
  /** What the unit standing on the tile holds of its health, over its kind's own. */
  const heldOn = (tile: TileCoords): string => {
    const unit = unitAt(chronicle.units, tile);
    if (unit === undefined) throw new Error(`no unit stands on ${tileKey(tile)}`);
    const full = fullHealth(CATALOGUE, unit.stats);
    expect(unit.stats.health).toBeLessThan(full);
    return text('reading.over', { count: unit.stats.health, over: full });
  };

  await openSaved(page, chronicle, campaign);

  await inspected(page, warrior);
  const warriorFace = await panelFace(page);
  expect(faceRead(warriorFace)).toEqual({
    ...faceDrawn(cardFaceAtStart(CATALOGUE, facing.card, undefined)),
    art: artFrameOf({ window: 'oval', ground: art.ground, holds: { kind: 'nothing' } }, 'oval'),
  });
  expect(warriorFace.windowUnit).toMatchObject({
    halo: LOOK.civilization,
    paintedAs: paintedOn(chronicle, warrior),
    canoe: undefined,
  });
  expect(healthOn(warriorFace)).toBe(heldOn(warrior));
  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();

  await inspected(page, leader);
  const leaderFace = await panelFace(page);
  expect(faceRead(leaderFace)).toEqual({
    card: LEADER,
    rules: text('face.bonus', { count: bonusOf(CATALOGUE, unitKind(CATALOGUE, LEADER)) }),
    art: artFrameOf({ window: 'oval', ground, holds: { kind: 'nothing' } }, 'oval'),
    references: [],
  });
  expect(leaderFace.windowUnit).toMatchObject({
    halo: LOOK.enemy,
    paintedAs: paintedOn(chronicle, leader),
  });
  expect(healthOn(leaderFace)).toBe(heldOn(leader));

  expect(problems).toEqual([]);
});

test('a building marked at the foot of a building card’s window raises the face of the card that builds it small at a rest, and shows it large at a right click', async ({
  page,
}) => {
  const problems = watch(page);
  const { tile, found: chronicle } = builtBeside([BUILT_OVER.over, BUILT_OVER.building]);
  const named = buildingFace(CATALOGUE, BUILT_OVER.over);

  await openSaved(page, chronicle);

  // Nobody stands on the tile built on, so its building card comes first.
  const at = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  await rested(page);
  const face = await panelFace(page);
  expect(face.card).toBe(BUILT_OVER.card);
  const marked = face.references.findIndex(
    ({ kind, id }) => kind === 'building' && id === BUILT_OVER.over,
  );
  expect(marked).not.toBe(-1);

  const mark = face.namesOnScreen[marked];
  await page.mouse.move(mark.x, mark.y, { steps: 5 });
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named.id);
  const small = await reading(page, 'small-card-0');
  expect(small.art).toBe(faceDrawn(named).art);

  await page.mouse.click(mark.x, mark.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named.id);

  expect(problems).toEqual([]);
});

test('a city section’s building named on a technology’s plate raises the city’s card small at a rest, and shows it large at a right click', async ({
  page,
}) => {
  const problems = watch(page);
  const technology = Object.keys(CATALOGUE.technologies).find(
    (id) => CATALOGUE.technologies[id].unlocks.city !== undefined,
  );
  if (technology === undefined) throw new Error('no technology of the catalogue unlocks a city');
  const plate = `plate-${technology}`;
  const building = CATALOGUE.technologies[technology].unlocks.city?.building;
  if (building === undefined) throw new Error(`${technology} unlocks no city`);
  const city = buildingFace(CATALOGUE, building);

  await openCampaign(page);
  const at = (await reading(page, plate)).references.findIndex(
    (named) => named.kind === 'building' && named.id === building,
  );
  const name = await nameOnScreen(page, plate, at);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(city.id);
  expect((await reading(page, 'small-card-0')).art).toBe(faceDrawn(city).art);

  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(city.id);

  expect(problems).toEqual([]);
});

test('an improvement reads as a row of its tile’s terrain card, after the feature’s, and a tile it stands on with nothing built holds no building card', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile } = onDeer(settledOn(1), [TRAPPING]);
  const faces = drawnFaces(chronicle);
  const face = faces.find((drawn) => tileKey(drawn) === tileKey(tile));
  if (face === undefined) throw new Error(`the map draws no face of ${tileKey(tile)}`);
  const parts = yieldParts(CATALOGUE, chronicle, face, tilesBeside(faces));
  const feature = parts.find((part) => part.kind === 'feature');
  const trapping = parts.find((part) => part.kind === 'improvement');
  if (feature?.kind !== 'feature' || trapping === undefined) {
    throw new Error(`${tileKey(tile)} holds no feature or no improvement`);
  }

  await openSaved(page, chronicle);

  // The worker entered on it comes first, and the terrain card after it.
  const at = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  const named = featureName(feature.feature);
  const expected = [
    ...rowRead(named, feature.yields),
    ...rowRead(improvementName(TRAPPING), trapping.yields),
  ];
  const rows = await panelRows(page);
  const first = rows.findIndex((row) => row.text === named);
  expect(rows.slice(first, first + expected.length)).toEqual(expected);

  // After the terrain card comes the unit's again.
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');

  expect(problems).toEqual([]);
});

test('a tile a river runs along gives the river a row of the terrain card, and the river gives the tile no yield', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, found: yields } = riverBeside();
  const key = tileKey(tile);

  await openSaved(page, chronicle);

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const at = await onScreen(page, `tile-${key}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  // The tile is bare, so its terrain's row gives the whole of what the rules say it yields.
  await expect
    .poll(() => riverRows(page))
    .toEqual([
      { text: text('panel.river'), yields: {} },
      { text: text('panel.no-yield'), yields: {} },
    ]);
  expect(await panelRows(page)).toContainEqual({ text: terrainName(tile.terrain), yields });

  // The tile holds that one card, so a further press leaves it standing.
  await page.keyboard.press('i');
  await reacted(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(key);

  expect(problems).toEqual([]);
});

test('the terrain card reads what entering the tile costs, and a dash on a tile nothing crosses', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, found: cost, uncrossed } = costBeside();

  await openSaved(page, chronicle);

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const land = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.click(land.x, land.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await panelMovement(page)).toBe(text('panel.movement', { cost: cost / MOVE_POINT }));

  // The infopanel stands east of the tile it reads, over whatever tile the search found there.
  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  const across = await onScreen(page, `tile-${tileKey(uncrossed)}`);
  await page.mouse.click(across.x, across.y, { button: 'right' });
  await expect.poll(() => panelMovement(page)).toBe(text('panel.no-movement'));
  expect(await shownCard(page)).toBe('terrain');

  expect(problems).toEqual([]);
});

test('a click selects a tile, the inspection key steps its cards, and the back key drops each in turn', async ({
  page,
}) => {
  const problems = watch(page);
  const entered = workerOnCity();

  await openSaved(page, entered);
  const cityTile = tileKey(playerCityTile(entered));
  const city = await onScreen(page, `tile-${cityTile}`);
  expect(await shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // With nothing selected the inspection key has no tile to step.
  await page.keyboard.press('i');
  await reacted(page);
  expect(await shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // The city's tile carries all three cards: the worker entered at the settle, the city, the terrain;
  // the click selects the worker, so the inspection opens on its card.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownCard(page)).toBeUndefined();
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('building');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  // After the last card comes the first again, never the bare ring.
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  expect(await ringedTile(page)).toBe(cityTile);

  // One step per press of the back key: the infopanel first, the ring after it.
  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(cityTile);
  await page.keyboard.press('Escape');
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await standing(page, 'menu')).toBe(false);

  // West of the city: the search leaves nothing on it, and it is clear of the panel the city raises.
  const bareTile = tileKey(westOf(playerCityTile(entered)));
  const bare = await onScreen(page, `tile-${bareTile}`);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(bareTile);
  expect(await shownCard(page)).toBeUndefined();
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');
  await page.keyboard.press('i');
  await reacted(page);
  expect(await shownCard(page)).toBe('terrain');

  // A click on the tile already selected selects nothing afresh, and the card stands.
  await page.mouse.click(bare.x, bare.y);
  await reacted(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(bareTile);

  // A click on another tile selects it, and the inspection standing on the last one is let go of.
  // West of the bare tile, so the panel standing east of it is not over the tile pressed.
  const furtherTile = tileKey(westOf(westOf(playerCityTile(entered))));
  const further = await onScreen(page, `tile-${furtherTile}`);
  await page.mouse.click(further.x, further.y);
  await expect.poll(() => ringedTile(page)).toBe(furtherTile);
  expect(await shownCard(page)).toBeUndefined();

  const beside = await besideTiles(page);
  await page.mouse.click(beside.x, beside.y);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a right click inspects and never selects, shows no browser menu, and the inspection key moves the inspection to the selection', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, found: key } = bareBeside();

  await openSaved(page, chronicle);
  const bare = await onScreen(page, `tile-${key}`);
  const cityTile = tileKey(playerCityTile(chronicle));
  const city = await onScreen(page, `tile-${cityTile}`);

  await watchBrowserMenu(page);
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();
  await expect.poll(() => browserMenu(page)).toBe(true);

  // Nothing stands on it and nothing is built on it: its terrain card is the whole of its cycle.
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await reacted(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();

  // The press carried the map nowhere either: the tile stands where it stood.
  const after = await onScreen(page, `tile-${key}`);
  expect(after.x).toBeCloseTo(bare.x, 0);
  expect(after.y).toBeCloseTo(bare.y, 0);

  // One left click on the city's own tile selects it; a second would enter city mode.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownCard(page)).toBeUndefined();

  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(cityTile);

  const beside = await besideTiles(page);
  await page.mouse.click(beside.x, beside.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(cityTile);
  expect(await standing(page, 'menu')).toBe(false);

  // Nothing stands on the city this early, so the first card of its cycle is what is built there.
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(await ringedTile(page)).toBe(cityTile);

  expect(problems).toEqual([]);
});

test('a right press let go on the infopanel inspects nothing new, and a right click on the band drops the inspection and leaves the selection standing', async ({
  page,
}) => {
  const problems = watch(page);
  const chronicle = settledOn(1);
  const cityTile = tileKey(playerCityTile(chronicle));
  const westTile = tileKey(westOf(playerCityTile(chronicle)));

  await openSaved(page, chronicle);
  const seen = await readings(page, [`tile-${cityTile}`, `tile-${westTile}`]);
  const city = seen(`tile-${cityTile}`).onScreen;
  const west = seen(`tile-${westTile}`).onScreen;
  const band = await onTheBand(page);

  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);

  // The infopanel stands east of the tile it reads, so it stands over part of the city's tile.
  await page.mouse.click(west.x, west.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBeDefined();
  await rested(page);
  const inspected = await ringedLitAndInspecting(page);

  const quarter = (await dragSlack(page)) / 4;
  const edge = (await reading(page, 'infopanel')).boundsOnScreen.x;
  await page.mouse.move(edge - quarter, west.y);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(edge + quarter, west.y);
  await page.mouse.up({ button: 'right' });
  await reacted(page);
  expect(await ringedLitAndInspecting(page)).toEqual(inspected);

  await page.mouse.click(band.x, band.y, { button: 'right' });
  await expect
    .poll(() => ringedLitAndInspecting(page))
    .toEqual({ ...inspected, inspecting: undefined });

  expect(problems).toEqual([]);
});
