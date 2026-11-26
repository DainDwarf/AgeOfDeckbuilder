import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { damageOf, fullHealth } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import {
  movementCost,
  neighbours,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
} from '../src/rules/map';
import { buildingKind } from '../src/rules/map-kinds';
import { RESOURCES, type Resources } from '../src/rules/resources';
import { charted } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { type Unit, unitAt } from '../src/rules/units';
import { tileYield } from '../src/rules/yields';
import { glyphFileOf } from '../src/ui/cast';
import { cardFaceAtStart, inMovePoints, unitFacing } from '../src/ui/face';
import { buildingName, terrainName, text, unitName } from '../src/ui/text';
import {
  BUILT,
  besideTiles,
  builtBeside,
  chronicleOf,
  click,
  drawnFaces,
  firstSeed,
  openSaved,
  pieceOnScreenOf,
  playedOut,
  playerCityTile,
  playersOf,
  readings,
  ringedTile,
  type SummaryRead,
  settledOn,
  summaryRead,
  watch,
} from './chronicle-screen';

/** The first seed's turn 1 with the first worker entered on the city, and a tile beside it the worker steps onto. */
function workerStepping(): { chronicle: Chronicle; to: TileCoords } {
  return firstSeed('steps its first worker off the city', (seed) => {
    const chronicle = settledOn(seed, ['first-worker']);
    const [worker] = playersOf(chronicle);
    const to = neighbours(playerCityTile(chronicle)).find(
      (tile) =>
        outcome(apply(CATALOGUE, chronicle, { type: 'move', unit: worker.id, tile })) !== chronicle,
    );
    return to === undefined ? undefined : { chronicle, to };
  });
}

/** What the summary of the unit reads, read off the rules: its name, its card's sentence, and its four numbers. */
function unitSummary(chronicle: Chronicle, unit: Unit): SummaryRead {
  const facing = unitFacing(CATALOGUE, unit.stats.type);
  if (facing.wears !== 'card') throw new Error(`no unit card places ${unit.stats.type}`);
  expect(damageOf(CATALOGUE, chronicle.units, unit)).toBe(unit.stats.damage);
  const over = (count: number | string, of: number | string): string =>
    text('reading.over', { count, over: of });
  return {
    name: unitName(unit.stats.type),
    aside: cardFaceAtStart(CATALOGUE, facing.card, undefined).rules,
    numbers: [
      glyphFileOf('health'),
      over(unit.stats.health, fullHealth(CATALOGUE, unit.stats)),
      glyphFileOf('move'),
      over(inMovePoints(unit.movePoints), inMovePoints(unit.stats.move)),
      glyphFileOf('action'),
      over(unit.action, unit.stats.action),
      glyphFileOf('damage'),
      String(unit.stats.damage),
    ],
  };
}

/** A sign and one glyph to each point after it, nothing where there are none. */
function pointsRead(sign: 'gives' | 'takes', amounts: Partial<Resources>): string[] {
  const glyphs = RESOURCES.flatMap((resource) =>
    Array<string>(amounts[resource] ?? 0).fill(glyphFileOf(resource)),
  );
  return glyphs.length === 0 ? [] : [text(`face.${sign}`), ...glyphs];
}

/**
 * What the summary of the tile reads, read off the face the map draws of it, every face it draws
 * beside it: its building's name beside its terrain's, or its terrain's alone; what it yields, its
 * building's upkeep, and what entering it costs.
 */
function tileSummary(chronicle: Chronicle, at: TileCoords): SummaryRead {
  const faces = drawnFaces(chronicle);
  const tile = faces.find((one) => tileKey(one) === tileKey(at));
  if (tile === undefined) throw new Error(`the map draws no face of ${tileKey(at)}`);
  const cost = movementCost(CATALOGUE, tile, false);
  if (cost === undefined) throw new Error(`nothing crosses onto ${tileKey(at)}`);
  const { building } = tile;
  return {
    name: building === undefined ? terrainName(tile.terrain) : buildingName(building),
    aside: building === undefined ? '' : terrainName(tile.terrain),
    numbers: [
      ...pointsRead('gives', tileYield(CATALOGUE, chronicle, tile, tilesBeside(faces))),
      ...pointsRead(
        'takes',
        building === undefined ? {} : (buildingKind(CATALOGUE, building).upkeep ?? {}),
      ),
      glyphFileOf('move'),
      inMovePoints(cost),
    ],
  };
}

test('a unit selected reads its name, its sentence and its four numbers as its card does, and its move again after a step', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, to } = workerStepping();
  const city = playerCityTile(chronicle);
  const [worker] = playersOf(chronicle);
  const stepped = outcome(apply(CATALOGUE, chronicle, { type: 'move', unit: worker.id, tile: to }));
  const moved = unitAt(stepped.units, to);
  if (moved === undefined) throw new Error(`the worker stands on no ${tileKey(to)}`);

  await openSaved(page, chronicle);
  expect(await summaryRead(page)).toBeUndefined();

  await click(page, `tile-${tileKey(city)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  expect(await summaryRead(page)).toEqual(unitSummary(chronicle, worker));

  await click(page, `tile-${tileKey(to)}`);
  await playedOut(page);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(to));
  expect(await chronicleOf(page)).toEqual(stepped);
  expect(moved.movePoints).toBeLessThan(worker.movePoints);
  expect(await summaryRead(page)).toEqual(unitSummary(stepped, moved));

  expect(problems).toEqual([]);
});

test('a tile with a building reads its name beside its terrain’s, all it yields, its upkeep and its cost; a tile with none reads its terrain’s name alone', async ({
  page,
}) => {
  const problems = watch(page);
  const { tile, found: builtOn } = builtBeside([BUILT.building]);
  // Built by the helper alone, which charts nothing: the snapshots the faces are read off are taken again.
  const chronicle = charted(CATALOGUE, builtOn);
  const city = playerCityTile(chronicle);
  const bare = neighbours(city).find((at) => {
    const beside = tileAt(chronicle.tiles, at);
    return (
      beside !== undefined &&
      beside.building === undefined &&
      unitAt(chronicle.units, at) === undefined &&
      movementCost(CATALOGUE, beside, false) !== undefined
    );
  });
  if (bare === undefined)
    throw new Error(`no bare tile a unit enters stands beside ${tileKey(city)}`);
  const built = tileSummary(chronicle, tile);
  expect(built.numbers).toContain(text('face.takes'));

  await openSaved(page, chronicle);

  await click(page, `tile-${tileKey(tile)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(tile));
  expect(await summaryRead(page)).toEqual(built);

  await click(page, `tile-${tileKey(bare)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(bare));
  expect(await summaryRead(page)).toEqual(tileSummary(chronicle, bare));

  expect(problems).toEqual([]);
});

test('a press beside the things takes the summary down with the selection', async ({ page }) => {
  const problems = watch(page);
  const chronicle = settledOn(1);
  const city = playerCityTile(chronicle);

  await openSaved(page, chronicle);
  await click(page, `tile-${tileKey(city)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  expect(await summaryRead(page)).toEqual(tileSummary(chronicle, city));

  const beside = await besideTiles(page);
  await page.mouse.click(beside.x, beside.y);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await summaryRead(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('the summary stands under the Menu button, its right edge on the button’s, at one place in city mode and out of it', async ({
  page,
}) => {
  const problems = watch(page);
  const chronicle = settledOn(1);
  const city = playerCityTile(chronicle);
  /** Where the summary's panel and the Menu button stand on the page, the shadows left out. */
  const corner = async () => {
    const read = await readings(page, ['summary-panel', 'menu-button']);
    return {
      summary: pieceOnScreenOf(read('summary-panel')),
      menu: pieceOnScreenOf(read('menu-button')),
    };
  };

  await openSaved(page, chronicle);
  await click(page, `tile-${tileKey(city)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  const { summary: out, menu } = await corner();
  expect(out.x + out.width).toBeCloseTo(menu.x + menu.width, 1);
  expect(out.y).toBeGreaterThan(menu.y + menu.height);

  await page.keyboard.press('c');
  await expect.poll(() => summaryRead(page)).toBeUndefined();
  await click(page, `tile-${tileKey(city)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  expect(await summaryRead(page)).toEqual(tileSummary(chronicle, city));
  const { summary: inCityMode } = await corner();
  expect(inCityMode).toEqual(out);

  expect(problems).toEqual([]);
});
