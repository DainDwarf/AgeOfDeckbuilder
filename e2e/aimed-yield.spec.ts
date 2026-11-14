import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf, built, type GivenTo, terraformed, triedAt } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { admitted, refusalOf } from '../src/rules/chronicle';
import {
  neighbours,
  sameTile,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
} from '../src/rules/map';
import { buildingKind } from '../src/rules/map-kinds';
import { RESOURCES } from '../src/rules/resources';
import { charted, inSight } from '../src/rules/sight';
import { followed, unchanged } from '../src/rules/stages';
import { type Chronicle, playable } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  admits,
  aimed,
  besideTiles,
  budget,
  campaignWith,
  dragOut,
  drawnFaces,
  EMBARK,
  FISHERY,
  firstSeed,
  fisheryAdmitted,
  idsOf,
  launchedAs,
  neutralCampaign,
  onDeer,
  openSaved,
  playerCityTile,
  pointAt,
  settledOn,
  TRAPPING,
  watch,
} from './chronicle-screen';

/**
 * A plate of the yield an aimed card would give, as the map draws it: its tile's key, its sign, the
 * colours of its glyphs in the order drawn, and the strength it stands at.
 */
type PlateShown = { tile: string; sign: string; glyphs: number[]; strength: number };

/** The plates of the yield an aimed card would give standing on the map, in tile key order. */
function platesShown(page: Page): Promise<PlateShown[]> {
  return page.evaluate(() => {
    const plates = window.shownIn?.('thresholds');
    const marks = window.shownIn?.('terrain');
    if (plates === undefined || marks === undefined) {
      throw new Error('the map is not on the chronicle screen');
    }
    const faces = marks.filter((mark) =>
      mark.name.startsWith('tile-'),
    ) as Phaser.GameObjects.Image[];
    // A plate is centred on its tile's middle, where the tile's face stands.
    return (plates as Phaser.GameObjects.Container[])
      .filter((plate) => plate.name === 'aimed-yield')
      .map((plate) => {
        const face = faces.find((one) => one.x === plate.x && one.y === plate.y);
        if (face === undefined)
          throw new Error(`a plate stands on no face at ${plate.x},${plate.y}`);
        const sign = plate.list.find((part) => part.type === 'Text') as Phaser.GameObjects.Text;
        const glyphs = plate.list.filter(
          (part) => part.type === 'Rectangle' && (part as Phaser.GameObjects.Rectangle).visible,
        ) as Phaser.GameObjects.Rectangle[];
        return {
          tile: face.name.slice('tile-'.length),
          sign: sign.text,
          glyphs: glyphs.map((glyph) => glyph.fillColor),
          strength: plate.alpha,
        };
      })
      .sort((one, other) => one.tile.localeCompare(other.tile));
  });
}

/** What the card at that place in the hand would give played at the tile, read on the faces the map draws. */
function wouldGive(chronicle: Chronicle, index: number, at: TileCoords): GivenTo[] {
  const aim = aimOf(cardOf(CATALOGUE, chronicle.hand[index].id));
  if (aim.aim !== 'tile') throw new Error(`${chronicle.hand[index].id} is aimed at no tile`);
  return triedAt(CATALOGUE, chronicle, aim, at, tilesBeside(drawnFaces(chronicle))).gives;
}

/** The plates the map draws for what a play gives, in tile key order. */
function platesOf(gives: readonly GivenTo[]): PlateShown[] {
  return gives
    .map(({ tile, yields, already }) => ({
      tile: tileKey(tile),
      sign: text('aim.yield'),
      glyphs: RESOURCES.flatMap((resource) =>
        Array<number>(yields[resource] ?? 0).fill(LOOK.reading[resource]),
      ),
      strength: already ? LOOK.givenAlready : 1,
    }))
    .sort((one, other) => one.tile.localeCompare(other.tile));
}

/**
 * The paid chronicle with a Fishery built on a tile in sight beside the coast beside the Fishery's
 * tile, made the Fishery's terrain, free and carrying nothing, the city's tile and the Fishery's left
 * out; nothing where none is.
 */
function fisheryBeside(
  paid: Chronicle,
  tile: TileCoords,
  beside: TileCoords,
): Chronicle | undefined {
  const sees = inSight(CATALOGUE, paid);
  const city = playerCityTile(paid);
  const [shore] = buildingKind(CATALOGUE, FISHERY).terrains;
  const at = neighbours(beside).find((coord) => {
    const there = tileAt(paid.tiles, coord);
    return (
      there !== undefined &&
      there.building === undefined &&
      !sameTile(coord, tile) &&
      !sameTile(coord, city) &&
      sees.has(tileKey(coord)) &&
      unitAt(paid.units, coord) === undefined
    );
  });
  if (at === undefined) return undefined;
  const ground =
    tileAt(paid.tiles, at)?.terrain === shore
      ? unchanged(paid)
      : terraformed(CATALOGUE, paid, at, shore);
  return charted(
    CATALOGUE,
    followed(ground, (left) => built(CATALOGUE, left, at, FISHERY)).chronicle,
  );
}

test('the Fishery aimed at the coast its worker stands on plates what it would give there and to the coast beside, faint beside a Fishery standing, and the plates go once the pointer leaves the tile', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = campaignWith([EMBARK]);
  const { chronicle, tile, index, beside } = fisheryAdmitted(campaign, fisheryBeside);
  const gives = wouldGive(chronicle, index, tile);

  await openSaved(page, chronicle, campaign);
  await dragOut(page, index);
  await aimed(page);
  await pointAt(page, tile);
  await expect.poll(() => platesShown(page)).toEqual(platesOf(gives));
  expect(await platesShown(page)).toContainEqual(
    expect.objectContaining({ tile: tileKey(beside), strength: LOOK.givenAlready }),
  );

  await pointAt(page, playerCityTile(chronicle));
  await expect.poll(() => platesShown(page)).toEqual([]);

  expect(problems).toEqual([]);
});

test('trapping aimed at the deer its worker stands on plates what it would give there, though the city cannot pay for it', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = campaignWith([TRAPPING]);
  const { chronicle, tile, index } = firstSeed(
    `opens turn 1 on ${TRAPPING} in hand, unpaid for, a deer beside the city`,
    (seed) => {
      const opened = settledOn(seed, [], campaign);
      const held = idsOf(opened.hand).indexOf(TRAPPING);
      if (held === -1) return undefined;
      const deer = onDeer(opened, []);
      if (playable(refusalOf(CATALOGUE, deer.chronicle, TRAPPING))) return undefined;
      return admits(deer.chronicle, held, deer.tile) ? { ...deer, index: held } : undefined;
    },
  );
  const gives = wouldGive(chronicle, index, tile);
  expect(gives).not.toEqual([]);

  await openSaved(page, chronicle, campaign);
  await dragOut(page, index);
  await aimed(page);
  await pointAt(page, tile);
  await expect.poll(() => platesShown(page)).toEqual(platesOf(gives));

  expect(problems).toEqual([]);
});

test('the settle card on the settle phase plates on each tile it lights what the city’s building would give there, and nothing once the pointer is off the map', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));
  // The first age's city building gives nothing, so its settle plates nothing; the neutral's age's gives.
  const campaign = neutralCampaign();
  const opened = launchedAs(1, campaign);
  const settle = aimOf(cardOf(CATALOGUE, opened.hand[0].id));
  if (settle.aim !== 'tile') throw new Error(`${opened.hand[0].id} is aimed at no tile`);
  const lit = admitted(CATALOGUE, opened, settle).slice(0, 2);

  await openSaved(page, opened, campaign);
  await dragOut(page, 0);
  await aimed(page);
  for (const at of lit) {
    const gives = wouldGive(opened, 0, at);
    expect(gives).not.toEqual([]);
    await pointAt(page, at);
    await expect.poll(() => platesShown(page)).toEqual(platesOf(gives));
  }

  const away = await besideTiles(page);
  await page.mouse.move(away.x, away.y);
  await expect.poll(() => platesShown(page)).toEqual([]);

  expect(problems).toEqual([]);
});
