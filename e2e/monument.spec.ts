import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained, struck } from '../src/rules/cards';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { buildingKind } from '../src/rules/map-kinds';
import { walked } from '../src/rules/stages';
import type { CardId, Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { capstoneFace } from '../src/ui/face';
import { capstoneLore } from '../src/ui/lore';
import { victoryLine } from '../src/ui/text';
import {
  admits,
  aimed,
  becomes,
  beforeTheLanding,
  budget,
  chronicleOf,
  claimedAt,
  cleared,
  click,
  dragOut,
  endedTurn,
  endTurn,
  idsOf,
  openSaved,
  paidFor,
  playedOn,
  playedOut,
  playerCityTile,
  readings,
  standing,
  stoppedTurn,
  textOf,
  unitEntered,
  victoryShown,
  WORKER,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The capstone the spec lands. */
const MONUMENT = 'monument';

/** The card the landing adds, the first of the chain, and the building it builds. */
const FOUNDATIONS = 'foundations';

/** The building the second card of the chain builds, which the last is built over. */
const GREAT_STONES = 'great-stones';

/** The last card of the chain, which finishes the monument. */
const ORNAMENTS = 'ornaments';

/** The hazards the monument adds after its landing. */
const HAZARDS = ['unrest', 'thieves', 'weary-builders'];

/**
 * The chronicle with what the hand would strike off a stock past its holding gained beforehand, as a
 * card gains it: no strike at the end of the turn takes a population for a stock it emptied.
 */
function covered(chronicle: Chronicle): Chronicle {
  let left = chronicle;
  for (const stage of walked(struck(CATALOGUE, chronicle).stages)) {
    if (stage.kind !== 'change' || stage.name !== 'population') continue;
    for (const { resource, amount } of stage.uncovered ?? []) {
      left = gained(left, { [resource]: amount }).chronicle;
    }
  }
  return left;
}

/**
 * The landed chronicle with the first tile beside the city that Foundations' building goes on
 * claimed, its slot empty, nobody on it, and a worker entered there; and that tile.
 */
function workedGround(landed: Chronicle): { chronicle: Chronicle; tile: TileCoords } | undefined {
  const { terrains } = buildingKind(CATALOGUE, FOUNDATIONS);
  for (const tile of neighbours(playerCityTile(landed))) {
    const ground = tileAt(landed.tiles, tile);
    if (ground === undefined || ground.building !== undefined) continue;
    if (!terrains.includes(ground.terrain) || unitAt(landed.units, tile) !== undefined) continue;
    const claimed = claimedAt(landed, tile);
    if (claimed === undefined) continue;
    return { chronicle: unitEntered(claimed, { type: WORKER, faction: 'player', tile }), tile };
  }
  return undefined;
}

/** The chain, walked: Ornaments in hand and paid for over Great stones, and the play that wins. */
type Built = {
  readonly chronicle: Chronicle;
  readonly index: number;
  readonly tile: TileCoords;
  readonly won: Chronicle;
};

/**
 * The landed chronicle on `workedGround`, each card of the chain paid for and played on that tile as
 * it comes around, each turn ended once `covered` and `cleared`, up to Ornaments in hand, paid for and
 * admitting the tile; nothing where 80 ends of turn, the chronicle's end or a refusal come first.
 */
function builtFrom(landed: Chronicle): Built | undefined {
  const ground = workedGround(landed);
  if (ground === undefined) return undefined;
  const { tile } = ground;
  let chronicle = ground.chronicle;
  let next = FOUNDATIONS;
  for (let turn = 0; turn < 80 && chronicle.ending === undefined; turn++) {
    if (idsOf(chronicle.hand).includes(next)) {
      const paid = paidFor(chronicle, next);
      if (!admits(paid.chronicle, paid.index, tile)) return undefined;
      if (next === ORNAMENTS) {
        const won = playedOn(paid.chronicle, paid.index, tile);
        return { chronicle: paid.chronicle, index: paid.index, tile, won };
      }
      chronicle = playedOn(paid.chronicle, paid.index, tile);
      next = becomes(next);
    }
    chronicle = endedTurn(cleared(covered(chronicle)));
  }
  return undefined;
}

test('the monument’s landing raises its card and puts Foundations on top of the draw pile, and the next turn adds one of its hazards to the discard pile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(2));
  const campaign = wonCampaign();
  const { before, landed } = beforeTheLanding(
    'stands on an open turn the turn before the monument lands',
    (before, landed) => ({ before, landed }),
    { campaign, capstone: MONUMENT, readied: cleared },
  );
  const next = endedTurn(landed);
  const hazardsIn = (chronicle: Chronicle): CardId[] =>
    idsOf(chronicle.discardPile).filter((id) => HAZARDS.includes(id));
  expect(idsOf(landed.drawPile)[0]).toBe(FOUNDATIONS);
  expect(idsOf(before.drawPile)).not.toContain(FOUNDATIONS);
  expect(hazardsIn(landed)).toEqual([]);
  expect(hazardsIn(next)).toHaveLength(1);

  await openSaved(page, before, campaign);
  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  const shown = await readings(page, ['capstone-lore', 'capstone-card-0']);
  expect([shown('capstone-lore').text, shown('capstone-card-0').card]).toEqual([
    capstoneLore(MONUMENT, 'landing'),
    MONUMENT,
  ]);
  expect(shown('capstone-card-0').rules).toBe(capstoneFace(CATALOGUE, landed).rules);

  await click(page, 'capstone-card-0');
  await playedOut(page);
  expect(await chronicleOf(page)).toEqual(landed);

  await endTurn(page);
  expect(await chronicleOf(page)).toEqual(next);
  expect(problems).toEqual([]);
});

test('Ornaments played over Great stones through the worker wins on the play, and the victory screen reads the monument’s line', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { chronicle, index, tile, won } = beforeTheLanding(
    'builds the monument to Ornaments in hand after its landing',
    (_before, landed) => builtFrom(landed),
    { campaign, capstone: MONUMENT, readied: cleared },
  );
  expect(tileAt(chronicle.tiles, tile)?.building).toBe(GREAT_STONES);
  expect(won.ending).toEqual({ outcome: 'victory', turn: chronicle.turn });

  await openSaved(page, chronicle, campaign);
  expect(await victoryShown(page)).toBe(false);
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);

  expect(await chronicleOf(page)).toEqual(won);
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(await textOf(page, 'ending-line')).toBe(victoryLine(MONUMENT));
  expect(problems).toEqual([]);
});
