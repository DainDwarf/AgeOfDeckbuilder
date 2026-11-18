import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf, refuses, terraformed } from '../src/rules/cards';
import { cardOf, standsOnEntering } from '../src/rules/catalogue';
import { arrived } from '../src/rules/city';
import { distance, neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { followed } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { CANOE } from '../src/ui/marks';
import { refusedAim } from '../src/ui/refusal-lines';
import {
  admits,
  aimed,
  campaignWith,
  chronicleOf,
  claimedAt,
  click,
  dragOut,
  firstSeed,
  idsOf,
  inspected,
  openSaved,
  paidFor,
  paintedOn,
  panelFace,
  playedOn,
  playedOut,
  playerCityTile,
  RAFT,
  refusalLines,
  rested,
  settledOn,
  unitMarksOn,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([RAFT]);

/** The first terrain a raft entering stands on. */
const WATER = (() => {
  const found = Object.keys(CATALOGUE.terrains).find((terrain) =>
    standsOnEntering(CATALOGUE, RAFT, { q: 0, r: 0, terrain, improvements: [] }),
  );
  if (found === undefined) throw new Error(`no terrain of the catalogue holds a ${RAFT}`);
  return found;
})();

/**
 * The first seed's turn 1 with the Raft in hand and two tiles beside the city and each other, clear
 * of the line over the hand, made water: the first claimed, one population arrived idle, the Raft
 * paid for and where it lies, and the second outside the border.
 */
function onTheWater(): {
  readonly chronicle: Chronicle;
  readonly index: number;
  readonly coast: TileCoords;
  readonly beyond: TileCoords;
} {
  const card = aimOf(cardOf(CATALOGUE, RAFT));
  if (card.aim !== 'tile') throw new Error(`${RAFT} is aimed at no tile`);
  return firstSeed(`opens turn 1 on ${RAFT} in hand`, (seed) => {
    const opened = settledOn(seed, [], CAMPAIGN);
    if (!idsOf(opened.hand).includes(RAFT)) return undefined;
    const city = playerCityTile(opened);
    const beside = neighbours(city).filter(
      (coord) => coord.r <= city.r + 1 && unitAt(opened.units, coord) === undefined,
    );
    for (const coast of beside) {
      for (const beyond of beside.filter((other) => distance(other, coast) === 1)) {
        const wet = followed(terraformed(CATALOGUE, opened, coast, WATER), (left) =>
          terraformed(CATALOGUE, left, beyond, WATER),
        ).chronicle;
        const claimed = claimedAt(wet, coast);
        if (claimed === undefined) continue;
        const { chronicle, index } = paidFor(arrived(claimed, 'player').chronicle, RAFT);
        const outside = tileAt(chronicle.tiles, beyond);
        if (outside === undefined || !admits(chronicle, index, coast)) continue;
        if (refuses(CATALOGUE, chronicle, card, outside) !== 'outside-border') continue;
        return { chronicle, index, coast, beyond };
      }
    }
    return undefined;
  });
}

test('the Raft dragged out is aimed: a click on a water tile outside the border says the border’s refusal, and a click on a free one inside it turns one idle population into a raft there, embarked, drawn in no canoe, on the map and in the window of the Raft card’s face on the infopanel', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, index, coast, beyond } = onTheWater();
  const played = playedOn(chronicle, index, coast);

  await openSaved(page, chronicle, CAMPAIGN);
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(beyond)}`);
  await rested(page);

  expect(await refusalLines(page)).toEqual(refusedAim('outside-border'));
  expect(await chronicleOf(page)).toEqual(chronicle);

  await click(page, `tile-${tileKey(coast)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(played);
  expect(unitAt(played.units, coast)).toMatchObject({ embarked: true, stats: { type: RAFT } });
  expect(played.population).toBe(chronicle.population - 1);
  const [mark] = await unitMarksOn(page, [coast]);
  expect(mark?.paintedAs).toBe(paintedOn(played, coast));
  // A painting's frame is named for the file it is drawn off (`linedName` in `src/ui/marks.ts`).
  expect(mark?.paintedAs.split('#')[0]).toBe(CANOE);
  expect(mark?.canoe).toBeUndefined();

  await inspected(page, coast);
  const face = await panelFace(page);
  expect(face.card).toBe(RAFT);
  expect(face.windowUnit).toMatchObject({ paintedAs: paintedOn(played, coast), canoe: undefined });

  expect(problems).toEqual([]);
});
