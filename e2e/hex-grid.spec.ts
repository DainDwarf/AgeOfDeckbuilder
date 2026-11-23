import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import type { Point } from '../src/ui/border-loops';
import { LOOK, multiplied } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  aimed,
  bareAimable,
  campaignThenChronicle,
  capstoneClosed,
  click,
  type HexGridFill,
  hexGridFills,
  type MapGroup,
  mapOrder,
  nearestUncharted,
  onScreen,
  openSaved,
  pieceOnScreen,
  pieceWorn,
  pressContinue,
  readings,
  standing,
  tooltipLines,
  tooltipUp,
  watch,
} from './chronicle-screen';

const BUTTON = 'hex-grid-button';

/** Two tiles one edge apart. */
type Edge = readonly [TileCoords, TileCoords];

/**
 * The first seed's turn 1 with a card aimed at a tile in hand: an edge between a tile in sight and one
 * out of it, and an edge between the uncharted tile nearest the city and one beside it out of sight.
 */
function twoEdges(): { chronicle: Chronicle; index: number; seen: Edge; unseen: Edge } {
  const { chronicle, index } = bareAimable();
  const sight = inSight(CATALOGUE, chronicle);
  const outOfSight = (tile: TileCoords): boolean =>
    tileAt(chronicle.tiles, tile) !== undefined && !sight.has(tileKey(tile));
  const edgeFrom = (tile: TileCoords): Edge | undefined => {
    const beside = neighbours(tile).find(outOfSight);
    return beside === undefined ? undefined : [tile, beside];
  };
  const seen = chronicle.tiles
    .filter((tile) => sight.has(tileKey(tile)))
    .map(edgeFrom)
    .find((edge) => edge !== undefined);
  const unseen = edgeFrom(nearestUncharted(chronicle));
  if (seen === undefined) throw new Error('every tile beside the tiles in sight is in sight');
  if (unseen === undefined)
    throw new Error('the nearest uncharted tile stands among tiles in sight');
  return { chronicle, index, seen, unseen };
}

/** Whether the button stands sunk in its well. */
async function sunk(page: Page): Promise<boolean> {
  return (await pieceWorn(page, BUTTON)).piece === 'tab';
}

const middleOf = (points: readonly Point[]): Point => ({
  x: points.reduce((sum, { x }) => sum + x, 0) / points.length,
  y: points.reduce((sum, { y }) => sum + y, 0) / points.length,
});

/** The fill of these nearest the edge's middle, halfway between its two tiles' middles. */
async function fillAlong(
  page: Page,
  fills: readonly HexGridFill[],
  edge: Edge,
): Promise<HexGridFill> {
  const names = edge.map((tile) => `tile-${tileKey(tile)}`);
  const seen = await readings(page, names);
  const middle = middleOf(names.map((name) => seen(name).place));
  const apart = (fill: HexGridFill): number => {
    const at = middleOf(fill.points);
    return Math.hypot(at.x - middle.x, at.y - middle.y);
  };
  return fills.reduce((nearest, fill) => (apart(fill) < apart(nearest) ? fill : nearest));
}

/** The names of the map's groups from the land to the rivers. */
function landToRivers(groups: readonly MapGroup[]): string[] {
  const names = groups.map(({ name }) => name);
  return names.slice(names.indexOf('terrain'), names.indexOf('rivers') + 1);
}

test('a chronicle screen opens with no hex grid and the button standing left of the Faction signs button, naming itself on the rest under it; a press sinks it and shows the hex grid between the land and the rivers, white on an edge a tile in sight touches and darkened by the fog on one none does; a second hides it and stands the button again', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, seen, unseen } = twoEdges();

  await openSaved(page, chronicle);
  expect(await hexGridFills(page)).toEqual([]);
  expect(await sunk(page)).toBe(false);
  const button = await pieceOnScreen(page, BUTTON);
  const signs = await pieceOnScreen(page, 'faction-signs-button');
  expect(button.x + button.width).toBeLessThan(signs.x);
  expect(button.y + button.height / 2).toBeCloseTo(signs.y + signs.height / 2, 1);

  const at = await onScreen(page, BUTTON);
  await page.mouse.move(at.x, at.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipLines(page, 'tooltip-ui')).toEqual([
    { text: text('button.hex-grid'), bold: false },
  ]);
  const bubble = (await readings(page, ['tooltip-ui']))('tooltip-ui').boundsOnScreen;
  expect(bubble.y).toBeGreaterThan(button.y + button.height);

  await click(page, BUTTON);
  await expect.poll(() => sunk(page)).toBe(true);
  const [edges, lines] = await hexGridFills(page);
  expect(new Set(edges.map(({ colour, strength }) => `${colour} ${strength}`))).toEqual(
    new Set([`${LOOK.mapOutline} ${LOOK.hexGridEdge}`]),
  );
  const { colour: seenColour, strength } = await fillAlong(page, lines, seen);
  expect(seenColour).toBe(LOOK.selected);
  expect(strength).toBe(LOOK.hexGridLine);
  expect((await fillAlong(page, lines, unseen)).colour).toBe(multiplied(LOOK.selected, LOOK.fog));
  expect(landToRivers((await mapOrder(page, [])).groups)).toEqual([
    'terrain',
    'hex-grid',
    'rivers',
  ]);

  await click(page, BUTTON);
  await expect.poll(() => sunk(page)).toBe(false);
  expect(await hexGridFills(page)).toEqual([]);

  expect(problems).toEqual([]);
});

test('a press on the Hex grid button lets the card being aimed go and shows the hex grid, and opened again by Continue with it shown, the chronicle screen shows none', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, index } = twoEdges();

  await openSaved(page, chronicle);
  await click(page, `hand-${index}`);
  await aimed(page);
  await click(page, BUTTON);
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await sunk(page)).toBe(true);
  expect(await hexGridFills(page)).not.toEqual([]);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await campaignThenChronicle(page);
  await pressContinue(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await capstoneClosed(page);
  expect(await hexGridFills(page)).toEqual([]);
  expect(await sunk(page)).toBe(false);

  expect(problems).toEqual([]);
});
