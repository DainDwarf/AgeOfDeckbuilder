import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { built, featurePlaced, improvementPlaced, made, slotFree } from '../src/rules/cards';
import { ageOf, fullHealth, neutralOf, neutralScriptOf, unitKind } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { warDeclared } from '../src/rules/city';
import { enemyEntering, preparedAs } from '../src/rules/enemies';
import {
  cornerKey,
  neighbours,
  riversAlong,
  sameTile,
  type Tile,
  type TileCoords,
  tileKey,
  tilesAtCorner,
  tilesOfEdge,
} from '../src/rules/map';
import { buildingKind, featureKind, improvementKind } from '../src/rules/map-kinds';
import { unitDamaged } from '../src/rules/schedule';
import { chartedAt, inSight } from '../src/rules/sight';
import { followed, walked } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { reachable, relationsOf, type UnitStats, unitAt } from '../src/rules/units';
import { LOOK, multiplied } from '../src/ui/look';
import { text, unitName } from '../src/ui/text';
import {
  budget,
  campKind,
  chronicleOf,
  consoleKey,
  counted,
  dragUnit,
  drawnFaces,
  enter,
  faceCounts,
  firstSeed,
  freeFor,
  freeGround,
  glyphs,
  glyphsOf,
  nearestUncharted,
  neutralCampaign,
  onDeer,
  onDesignedSpeed,
  openSaved,
  panelRows,
  playerCityTile,
  playersOf,
  readings,
  readingsAndUnitMarks,
  rested,
  ringedTile,
  riverRuns,
  SCOUT,
  settledOn,
  shownCard,
  shows,
  standing,
  stoppedTurn,
  TRAPPING,
  tileOnScreen,
  unitEntered,
  watch,
} from './chronicle-screen';

/** The settle card that enters the scout. */
const FIRST_SCOUT = 'first-scout';

/** The chronicle the step leaves, or none where the rules refuse the move. */
function stepped(chronicle: Chronicle, to: TileCoords): Chronicle | undefined {
  const [unit] = playersOf(chronicle);
  const moved = outcome(apply(CATALOGUE, chronicle, { type: 'move', unit: unit.id, tile: to }));
  return moved === chronicle ? undefined : moved;
}

/**
 * Seed 1's turn 1 with the first scout on the city, and the first neighbour whose round trip leaves
 * the map showing all three states at once: the tile it stepped onto in sight, a tile it charted from
 * there and no longer sees in fog, and a tile nobody has seen uncharted.
 */
function roundTrip(): {
  scouted: Chronicle;
  out: TileCoords;
  back: Chronicle;
  fog: TileCoords;
  uncharted: TileCoords;
} {
  const scouted = settledOn(1, [FIRST_SCOUT]);
  const city = playerCityTile(scouted);
  const before = new Set(scouted.snapshots.map(tileKey));
  for (const out of neighbours(city)) {
    const there = stepped(scouted, out);
    const back = there && stepped(there, city);
    if (back === undefined) continue;
    const seen = inSight(CATALOGUE, back);
    const chartedTiles = new Set(back.snapshots.map(tileKey));
    const fog = back.snapshots.find(
      (snapshot) => !seen.has(tileKey(snapshot)) && !before.has(tileKey(snapshot)),
    );
    const uncharted = back.tiles.find((tile) => !chartedTiles.has(tileKey(tile)));
    if (fog === undefined || uncharted === undefined) continue;
    return {
      scouted,
      out,
      back,
      fog: { q: fog.q, r: fog.r },
      uncharted: { q: uncharted.q, r: uncharted.r },
    };
  }
  throw new Error('no round trip of the scout off the city leaves a tile in fog');
}

/**
 * Seed 1's bare turn 1 on a campaign reaching the neutral, a unit of the neutral's of the first
 * fighting kind its ratio names entered four tiles from the city out of its sight, wounded, its tile
 * charted, wounded again unseen, and war declared after; the campaign, and the tile.
 */
function neutralInFog(): { chronicle: Chronicle; campaign: Campaign; fog: TileCoords } {
  const campaign = neutralCampaign();
  const bare = settledOn(1, [], campaign);
  const neutral = neutralOf(CATALOGUE, bare.age);
  const kind = neutral.ratio.find((row) => !unitKind(CATALOGUE, row.kind).worker)?.kind;
  if (kind === undefined) throw new Error(`the neutral of the age ${bare.age} fights with no kind`);
  if (unitKind(CATALOGUE, kind).health <= 2) throw new Error(`${kind} lives through no two wounds`);
  const seen = inSight(CATALOGUE, bare);
  const fog = freeGround(bare, kind, 4).find((tile) => !seen.has(tileKey(tile)));
  if (fog === undefined) throw new Error('seed 1 leaves no ground unseen four tiles from its city');
  const script = neutralScriptOf(CATALOGUE, neutral, kind);
  const entered = unitEntered(bare, { type: kind, faction: 'neutral', script, tile: fog });
  const kept = chartedAt(CATALOGUE, unitDamaged(entered, fog, 1).chronicle, fog);
  const unseen = unitDamaged(kept, fog, 1).chronicle;
  return { chronicle: warDeclared(unseen).chronicle, campaign, fog };
}

/**
 * The first seed whose turn 1, the first scout on the city, runs rivers along no charted tile, and
 * the first landing of the scout's, in the order the rules list them, that charts one; and the
 * chronicle the step leaves.
 */
function riverUncharted(): { scouted: Chronicle; landing: TileCoords; stepped: Chronicle } {
  return firstSeed('charts a river on the scout’s first step', (seed) => {
    const scouted = settledOn(seed, [FIRST_SCOUT]);
    if (scouted.rivers.length === 0 || riverRuns(scouted) > 0) return undefined;
    const [scout] = playersOf(scouted);
    for (const { tile } of reachable(CATALOGUE, scouted, scout)) {
      const moved = stepped(scouted, tile);
      if (moved !== undefined && riverRuns(moved) > 0)
        return { scouted, landing: tile, stepped: moved };
    }
    return undefined;
  });
}

/**
 * The first seed's turn 1 with a lone scout entered out of the city's sight, taken down to the damage
 * of an enemy of the camp's kind entered beside it as a raider, whose end of turn attacks it on tiles
 * the attack leaves out of sight; and the scout's tile.
 */
function attackedUnseen(): { chronicle: Chronicle; alone: TileCoords } {
  return firstSeed('attacks a scout where its sight alone holds the tiles', (seed) => {
    const settled = settledOn(seed);
    const citySees = inSight(CATALOGUE, settled);
    const kind = campKind(settled);
    const { raider } = ageOf(CATALOGUE, settled.age).camp.scripts;
    const scout = unitKind(CATALOGUE, SCOUT);
    const enemy = unitKind(CATALOGUE, kind);
    const unseenFor = (stats: UnitStats, at: TileCoords): boolean =>
      !citySees.has(tileKey(at)) && freeFor(settled, stats, at);

    for (const { q, r } of settled.tiles) {
      const alone = { q, r };
      if (!unseenFor(scout, alone)) continue;
      const beside = neighbours(alone).find((at) => unseenFor(enemy, at));
      if (beside === undefined) continue;
      const entered = unitEntered(
        unitEntered(settled, { type: SCOUT, faction: 'player', tile: alone }),
        enemyEntering(kind, raider, beside),
      );
      const chronicle = unitDamaged(entered, alone, scout.health - enemy.damage).chronicle;
      const unseen = [...walked(apply(CATALOGUE, chronicle, { type: 'end-turn' }))].some(
        (stage) => {
          if (stage.kind !== 'group' || stage.name !== 'attack') return false;
          if (tileKey(stage.target) !== tileKey(alone)) return false;
          const left = inSight(CATALOGUE, stage.chronicle);
          return !left.has(tileKey(stage.attacker)) && !left.has(tileKey(alone));
        },
      );
      if (unseen) return { chronicle, alone };
    }
    return undefined;
  });
}

/** Whether a river of the chronicle runs along an edge of the tile. */
function alongRiver(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.rivers.some((river) =>
    river.some(
      (corner, at) =>
        at > 0 && tilesOfEdge(river[at - 1], corner).some((beside) => sameTile(beside, tile)),
    ),
  );
}

/**
 * The first seed's turn 1 with Trapping's feature in sight trapped under a worker and bare, and charted
 * out of sight the camp with its guard, that feature trapped and bare, and a tile on a river nothing
 * beside sees; the tiles, and how many river corners the map draws in sight and wholly in fog, both some.
 */
function markedInFog(): {
  chronicle: Chronicle;
  lit: TileCoords;
  wild: TileCoords;
  camp: TileCoords;
  trapped: TileCoords;
  wildInFog: TileCoords;
  corners: { inFog: number; inSight: number };
} {
  return firstSeed('runs a river’s corners both in sight and wholly in fog', (seed) => {
    const { chronicle: opened, tile: lit } = onDeer(settledOn(seed), [TRAPPING]);
    const seen = inSight(CATALOGUE, opened);
    const empty = opened.tiles.filter((tile) => unitAt(opened.units, tile) === undefined);
    const unseen = empty.filter((tile) => !seen.has(tileKey(tile)));
    const kind = campKind(opened);
    const { building, scripts } = ageOf(CATALOGUE, opened.age).camp;
    const { terrains } = buildingKind(CATALOGUE, building);
    const camp = unseen.find(
      (tile) =>
        made(CATALOGUE, tile, terrains) === undefined &&
        slotFree(tile) === undefined &&
        freeFor(opened, unitKind(CATALOGUE, kind), tile),
    );
    const [feature] = improvementKind(CATALOGUE, TRAPPING).features ?? [];
    if (feature === undefined) throw new Error(`${TRAPPING} names no feature`);
    const { terrain } = featureKind(CATALOGUE, feature);
    const forFeature = (tile: Tile): boolean =>
      tile.terrain === terrain &&
      slotFree(tile) === undefined &&
      (camp === undefined || !sameTile(tile, camp));
    const [trapped, wildInFog] = unseen.filter(forFeature);
    const wild = empty.find((tile) => seen.has(tileKey(tile)) && forFeature(tile));
    const shore = unseen.find(
      (tile) =>
        alongRiver(opened, tile) &&
        neighbours(tile).every((beside) => !seen.has(tileKey(beside))) &&
        [trapped, wildInFog].every((one) => one === undefined || !sameTile(tile, one)),
    );
    if (
      camp === undefined ||
      trapped === undefined ||
      wildInFog === undefined ||
      wild === undefined ||
      shore === undefined
    ) {
      return undefined;
    }

    let placed = followed(built(CATALOGUE, opened, camp, building), (left) =>
      featurePlaced(CATALOGUE, left, trapped, feature),
    );
    placed = followed(placed, (left) => improvementPlaced(CATALOGUE, left, trapped, TRAPPING));
    for (const bare of [wild, wildInFog]) {
      placed = followed(placed, (left) => featurePlaced(CATALOGUE, left, bare, feature));
    }
    const guarded = unitEntered(placed.chronicle, enemyEntering(kind, scripts.guard, camp));
    const chronicle = [camp, trapped, wildInFog, shore].reduce(
      (left, at) => chartedAt(CATALOGUE, left, at),
      guarded,
    );
    const sees = inSight(CATALOGUE, chronicle);
    if ([camp, trapped, wildInFog, shore].some((at) => sees.has(tileKey(at)))) return undefined;

    const drawn = new Set(chronicle.snapshots.map(tileKey));
    const run = new Map(
      riversAlong(chronicle.rivers, drawn)
        .flat()
        .map((corner) => [cornerKey(corner), corner]),
    );
    const inFog = [...run.values()].filter((corner) =>
      tilesAtCorner(corner).every((at) => !sees.has(tileKey(at))),
    ).length;
    const inSightCount = run.size - inFog;
    if (inFog === 0 || inSightCount === 0) return undefined;
    return {
      chronicle,
      lit,
      wild: { q: wild.q, r: wild.r },
      camp: { q: camp.q, r: camp.r },
      trapped: { q: trapped.q, r: trapped.r },
      wildInFog: { q: wildInFog.q, r: wildInFog.r },
      corners: { inFog, inSight: inSightCount },
    };
  });
}

test('the map draws a tile in sight live, a tile in fog darkened by the fog’s tint, and an uncharted tile as his void', async ({
  page,
}) => {
  const problems = watch(page);
  const run = roundTrip();
  const city = playerCityTile(run.scouted);
  const [out, fog, uncharted] = [run.out, run.fog, run.uncharted].map(tileKey);

  await openSaved(page, run.scouted);

  // Before the scout steps out, the tile it will see from there is uncharted like any other.
  const before = await readings(page, [`tile-${fog}`, `void-${fog}`]);
  expect(before(`tile-${fog}`).standing).toBe(false);
  expect(before(`void-${fog}`).standing).toBe(true);

  await dragUnit(page, city, run.out);
  await dragUnit(page, run.out, city);
  expect(await chronicleOf(page)).toEqual(run.back);

  const after = await readings(
    page,
    [out, fog, uncharted].flatMap((key) => [`tile-${key}`, `void-${key}`]),
  );
  expect(after(`tile-${out}`).standing).toBe(true);
  expect(after(`tile-${out}`).tint).toBeUndefined();
  expect(after(`void-${out}`).standing).toBe(false);

  expect(after(`tile-${fog}`).standing).toBe(true);
  expect(after(`tile-${fog}`).tint).toBe(LOOK.fog);
  expect(after(`void-${fog}`).standing).toBe(false);

  expect(after(`tile-${uncharted}`).standing).toBe(false);
  expect(after(`void-${uncharted}`).standing).toBe(true);

  // The map draws a face for every tile it has ever seen, each of them in fog darkened.
  const seen = inSight(CATALOGUE, run.back);
  expect(await faceCounts(page)).toEqual({
    shown: run.back.snapshots.length,
    inFog: run.back.snapshots.filter((snapshot) => !seen.has(tileKey(snapshot))).length,
  });

  expect(problems).toEqual([]);
});

test('every painting and mark a tile in fog carries is darkened by the fog’s tint, the river’s pieces where no tile at their corner is in sight, and a tile in sight carries them as they are', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, lit, wild, camp, trapped, wildInFog, corners } = markedInFog();
  const city = playerCityTile(chronicle);
  const featureMarks = (key: string): string[] => [
    `feature-${key}`,
    `herd-${key}-0`,
    `feature-disc-${key}`,
  ];
  const trappingMarks = (key: string): string[] => [
    `improvement-disc-${TRAPPING}-${key}`,
    `improvement-${TRAPPING}-${key}`,
    `improvement-painting-${TRAPPING}-alone-${key}`,
  ];
  const [litKey, wildKey, trappedKey, wildInFogKey, cityKey, campKey] = [
    lit,
    wild,
    trapped,
    wildInFog,
    city,
    camp,
  ].map(tileKey);
  const fogged = (colour: number): number => multiplied(colour, LOOK.fog);

  await openSaved(page, chronicle);

  const { read, unitMarkOn } = await readingsAndUnitMarks(
    page,
    [
      ...featureMarks(wildKey),
      ...featureMarks(wildInFogKey),
      ...trappingMarks(litKey),
      ...trappingMarks(trappedKey),
      `building-${cityKey}`,
      `building-${campKey}`,
      'river',
    ],
    [lit, camp],
  );

  // A tile in fog: its images carry the fog's tint, its shapes their colours multiplied by it.
  expect(read(`feature-${wildInFogKey}`).tint).toBe(LOOK.fog);
  expect(read(`herd-${wildInFogKey}-0`).tint).toBe(LOOK.fog);
  expect(read(`feature-disc-${wildInFogKey}`).fill).toBe(fogged(LOOK.featureDisc.colour));
  expect(read(`improvement-disc-${TRAPPING}-${trappedKey}`).fill).toBe(fogged(LOOK.built));
  expect(read(`improvement-${TRAPPING}-${trappedKey}`).tint).toBe(LOOK.fog);
  expect(read(`improvement-painting-${TRAPPING}-alone-${trappedKey}`).tint).toBe(LOOK.fog);
  expect(read(`building-${campKey}`).tint).toBe(LOOK.fog);
  expect(unitMarkOn(camp)).toEqual({ halo: fogged(LOOK.enemy), painting: LOOK.fog });

  // A tile in sight: no tint, and every colour as it is.
  expect(read(`feature-${wildKey}`).tint).toBeUndefined();
  expect(read(`herd-${wildKey}-0`).tint).toBeUndefined();
  expect(read(`feature-disc-${wildKey}`).fill).toBe(LOOK.featureDisc.colour);
  expect(read(`improvement-disc-${TRAPPING}-${litKey}`).fill).toBe(LOOK.built);
  expect(read(`improvement-${TRAPPING}-${litKey}`).tint).toBeUndefined();
  expect(read(`improvement-painting-${TRAPPING}-alone-${litKey}`).tint).toBeUndefined();
  expect(read(`building-${cityKey}`).tint).toBeUndefined();
  expect(unitMarkOn(lit)).toEqual({ halo: LOOK.civilization, painting: undefined });

  const tints = read('river').tints;
  expect(tints.filter((tint) => tint === LOOK.fog).length).toBe(corners.inFog);
  expect(tints.filter((tint) => tint === undefined).length).toBe(corners.inSight);

  expect(problems).toEqual([]);
});

test('the overlay, the inspection and a press read what the map draws, and widen with it', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: stood, campaign, fog } = neutralInFog();
  const uncharted = nearestUncharted(stood);
  const kept = stood.snapshots.find((snapshot) => tileKey(snapshot) === tileKey(fog))?.unit;
  if (kept === undefined) throw new Error('the snapshot of the tile in fog keeps no unit');
  expect(kept.faction).toBe('neutral');
  expect(kept.stats.health).not.toBe(unitAt(stood.units, fog)?.stats.health);
  expect(relationsOf(stood)).toBe('hostile');
  // Hostile stands alone on the card's state line: the unit kept is neither embarked nor prepared.
  expect(kept.embarked).toBe(false);
  expect(preparedAs(stood, { ...kept, tile: fog })).toBeUndefined();

  await openSaved(page, stood, campaign);

  // The overlay glyphs the tiles the map draws, each from the faces it draws.
  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(glyphsOf(stood, drawnFaces(stood)));

  // The tile in fog inspects as it was last seen, the card of the unit its snapshot keeps first:
  // its health as kept, and Hostile as the neutral stands now.
  const fogged = await tileOnScreen(page, fog);
  await page.mouse.click(fogged.x, fogged.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(fog));
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  const rows = (await panelRows(page)).map((row) => row.text);
  expect(rows.slice(0, 2)).toEqual([unitName(kept.stats.type), text('unit-state.hostile')]);
  expect(rows[rows.indexOf(text('label.health')) + 1]).toBe(
    `${kept.stats.health} / ${fullHealth(CATALOGUE, kept.stats)}`,
  );

  // A press on an uncharted tile lands off the map, on his void: it rings nothing and inspects nothing.
  expect(await standing(page, `void-${tileKey(uncharted)}`)).toBe(true);
  const dark = await tileOnScreen(page, uncharted);
  await page.mouse.click(dark.x, dark.y);
  await rested(page);
  await rested(page);
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  // The veil off, the map draws the whole disc and no void: the overlay widens with it, and the press lands.
  expect(await standing(page, `void-${tileKey(uncharted)}`)).toBe(false);
  expect(await glyphs(page)).toEqual(glyphsOf(stood, stood.tiles));
  await page.mouse.click(dark.x, dark.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(uncharted));

  expect(problems).toEqual([]);
});

test('the map draws no river between two uncharted tiles, and draws one along a tile just charted', async ({
  page,
}) => {
  const problems = watch(page);
  const run = riverUncharted();

  await openSaved(page, run.scouted);

  // The map runs rivers, and every edge of them lies between two tiles nobody has charted yet.
  expect(await counted(page, 'river')).toBe(0);

  await dragUnit(page, playerCityTile(run.scouted), run.landing);
  expect(await chronicleOf(page)).toEqual(run.stepped);
  expect(await counted(page, 'river')).toBe(riverRuns(run.stepped));

  expect(problems).toEqual([]);
});

test('an attack that kills the unit whose sight alone held its tiles plays before the fog covers them', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle: stood, alone } = attackedUnseen();
  const mark = `unit-${tileKey(alone)}`;
  const face = `tile-${tileKey(alone)}`;
  expect(playersOf(outcome(apply(CATALOGUE, stood, { type: 'end-turn' })))).toEqual([]);
  onDesignedSpeed(page);

  await openSaved(page, stood);

  // A slow runner draws the shrink in a frame or two: the catch holds the map's tweens the frame it
  // sees the scout's mark shrinking.
  const caught = page.waitForFunction(
    (names) => {
      const marker = window.named?.(names.mark)?.object as Phaser.GameObjects.Container | undefined;
      if (marker === undefined || marker.scale <= 0 || marker.scale >= 1) return undefined;
      window.game?.scene.getScene('map').tweens.pauseAll();
      const shown = window.named?.(names.face)?.object as Phaser.GameObjects.Image | undefined;
      return { fogged: shown?.tint === names.fog };
    },
    { mark, face, fog: LOOK.fog },
  );
  const ended = stoppedTurn(page);
  expect(await (await caught).jsonValue()).toEqual({ fogged: false });

  await page.evaluate(() => {
    window.game?.scene.getScene('map').tweens.resumeAll();
  });
  await ended;
  const after = await readings(page, [mark, face]);
  expect(after(face).tint).toBe(LOOK.fog);
  expect(after(mark).standing).toBe(false);

  expect(problems).toEqual([]);
});
