import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { available, type Campaign, paidInto } from '../src/rules/campaign';
import { achievementOf, ageOf, technologyOf, unitKind } from '../src/rules/catalogue';
import { apply, countOn, outcome } from '../src/rules/chronicle';
import { populationTaken } from '../src/rules/city';
import { campUnit } from '../src/rules/enemies';
import { distance, neighbours, type TileCoords, tileAt } from '../src/rules/map';
import { addedToDrawPileTop } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { standsOn, unitAt } from '../src/rules/units';
import { openingChoices } from '../src/ui/launch-layout';
import { achievementGoal, regionName, technologyName, text } from '../src/ui/text';
import {
  chronicleButton,
  chronicleOf,
  cityTileOf,
  click,
  earningOf,
  endedTurn,
  firstSeed,
  HUNT,
  idsOf,
  launchedAs,
  launchedFromScreen,
  onFeature,
  openCampaign,
  optionsSelected,
  plateReads,
  playedOn,
  readsOf,
  rested,
  rewardOf,
  rowOf,
  secondEra,
  settledOn,
  unitEntered,
  WORKER,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The technology this spec learns, and the region it unlocks. */
const RAFT = 'raft';
const ARCHIPELAGO = (() => {
  const { region } = technologyOf(CATALOGUE, RAFT).unlocks;
  if (region === undefined) throw new Error(`${RAFT} unlocks no region`);
  return region;
})();

/** The age that holds the region. */
const AGE = Object.keys(CATALOGUE.ages).find((age) =>
  Object.hasOwn(CATALOGUE.ages[age].regions, ARCHIPELAGO),
);

const PLATE = `plate-${RAFT}`;
const OPTION = `launch-region-${ARCHIPELAGO}`;

/** The technologies on the way to Raft, each reached by its own deed: hunting, and the scout's kills. */
const TRAPPING_TECHNOLOGY = 'trapping';
const BOW_AND_ARROW = 'bow-and-arrow';

/** The feature Hunt removes, and the unit kind whose kills Bow and arrow counts. */
const DEER = 'deer';
const SCOUT = 'scout';

/** What Raft's plate reads, its state aside: its name, its goal and its reward. */
function raftReads(state: 'available' | 'learned') {
  const { id, achievement } = earningOf(RAFT);
  const name = technologyName(RAFT);
  return {
    state,
    name: state === 'learned' ? text('plate.learned', { technology: name }) : name,
    goal: achievementGoal(id, achievement.need),
    reward: rewardOf(RAFT),
  };
}

/** Whether a unit of the kind could enter on the tile: it stands there, and nothing else does. */
function free(chronicle: Chronicle, at: TileCoords, kind: string): boolean {
  const tile = tileAt(chronicle.tiles, at);
  return (
    tile !== undefined &&
    tile.building === undefined &&
    unitAt(chronicle.units, at) === undefined &&
    standsOn(CATALOGUE, unitKind(CATALOGUE, kind), false, tile)
  );
}

/** The chronicle with its population taken until the city falls, paid into the campaign. */
function paidWhenFallen(campaign: Campaign, chronicle: Chronicle): Campaign {
  let falling = chronicle;
  while (falling.ending === undefined) falling = populationTaken(falling).chronicle;
  return paidInto(CATALOGUE, campaign, falling).campaign;
}

/**
 * The first seed's chronicle in the second age the campaign has reached, settled bare, with as many
 * Hunts laid on its draw pile's top as Trapping's goal asks, each played through a worker on deer
 * placed for it, turns ended to draw them, until Trapping's achievement is reached.
 */
function trappingReached(campaign: Campaign): Chronicle {
  return firstSeed('reaches Trapping by hunting', (seed) => {
    let chronicle = settledOn(seed, [], undefined, secondEra(campaign));
    const { need } = achievementOf(
      CATALOGUE,
      chronicle.age,
      rowOf(chronicle, TRAPPING_TECHNOLOGY).id,
    );
    for (let laid = 0; laid < need; laid++) {
      chronicle = addedToDrawPileTop(CATALOGUE, chronicle, HUNT).chronicle;
    }
    while (!rowOf(chronicle, TRAPPING_TECHNOLOGY).reached) {
      if (chronicle.ending !== undefined) return undefined;
      const index = idsOf(chronicle.hand).indexOf(HUNT);
      if (index === -1) {
        chronicle = endedTurn(chronicle);
        continue;
      }
      const tile = chronicle.tiles.find((at) => free(chronicle, at, WORKER));
      if (tile === undefined) return undefined;
      chronicle = playedOn(onFeature(chronicle, tile, DEER, []), index, tile);
    }
    return chronicle;
  });
}

/**
 * The first seed's chronicle in the second age the campaign has reached, settled bare, with the
 * camp's unit entered off the city's tile and scouts entered around it, each attacking it, until Bow
 * and arrow's achievement is reached.
 */
function bowAndArrowReached(campaign: Campaign): Chronicle {
  return firstSeed('reaches Bow and arrow by the scouts’ kills', (seed) => {
    let chronicle = settledOn(seed, [], undefined, secondEra(campaign));
    const { unit } = ageOf(CATALOGUE, chronicle.age).camp;
    while (!rowOf(chronicle, BOW_AND_ARROW).reached) {
      const standing = chronicle;
      const target = standing.tiles.find(
        (at) =>
          distance(at, cityTileOf(standing)) > 1 &&
          free(standing, at, unit) &&
          neighbours(at).every((beside) => free(standing, beside, SCOUT)),
      );
      if (target === undefined) return undefined;
      chronicle = unitEntered(chronicle, campUnit(CATALOGUE, chronicle, target, 'guard'));
      while (unitAt(chronicle.units, target)?.faction === 'enemy') {
        const post = neighbours(target).find((beside) => free(chronicle, beside, SCOUT));
        if (post === undefined) return undefined;
        const scout = chronicle.nextUnit;
        chronicle = unitEntered(chronicle, { type: SCOUT, faction: 'player', tile: post });
        chronicle = outcome(
          apply(CATALOGUE, chronicle, { type: 'attack', unit: scout, tile: target }),
        );
      }
    }
    return chronicle;
  });
}

/**
 * The first seed's chronicle in the second age the campaign has reached, settled bare, with scouts
 * entered on the ground in the map's order until the coast charted meets Raft's goal, and the turn
 * ended on it.
 */
function raftReached(campaign: Campaign): Chronicle {
  return firstSeed('reaches Raft by charting the coast', (seed) => {
    let chronicle = settledOn(seed, [], undefined, secondEra(campaign));
    const { need } = achievementOf(CATALOGUE, chronicle.age, rowOf(chronicle, RAFT).id);
    for (const tile of chronicle.tiles) {
      if (countOn(CATALOGUE, chronicle, rowOf(chronicle, RAFT)) >= need) break;
      if (!free(chronicle, tile, SCOUT)) continue;
      chronicle = unitEntered(chronicle, { type: SCOUT, faction: 'player', tile });
    }
    const ended = endedTurn(chronicle);
    return rowOf(ended, RAFT).reached ? ended : undefined;
  });
}

/** The won campaign with a chronicle reaching Trapping paid into it, then one reaching Bow and arrow. */
function beforeRaft(): Campaign {
  const won = wonCampaign();
  const trapped = paidWhenFallen(won, trappingReached(won));
  return paidWhenFallen(trapped, bowAndArrowReached(trapped));
}

test('on a campaign Raft stands available to, its plate reads the region it unlocks among its reward, and that region stands on the launch row reading ???, a press on it leaving the region selected where it was', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = beforeRaft();
  expect(available(CATALOGUE, RAFT, campaign.technologies)).toBe(true);
  const { age, region } = openingChoices(CATALOGUE, campaign);
  expect(age).toBe(AGE);

  await openCampaign(page, campaign);
  expect(await plateReads(page, PLATE)).toEqual(raftReads('available'));

  await chronicleButton(page);
  const options = [`launch-region-${region}`, OPTION];
  expect(await readsOf(page, [OPTION])).toEqual([[text('launch.unknown-region')]]);
  expect(await optionsSelected(page, options)).toEqual([true, false]);

  await click(page, OPTION);
  await rested(page);
  expect(await optionsSelected(page, options)).toEqual([true, false]);

  expect(problems).toEqual([]);
});

test('on a campaign that has learned Raft, its plate stands learned reading the region among its reward; a press on that region on the launch row selects it, and Launch opens the chronicle the rules launch on that region', async ({
  page,
}) => {
  const problems = watch(page);
  const before = beforeRaft();
  const campaign = paidWhenFallen(before, raftReached(before));
  expect(campaign.technologies).toContain(RAFT);
  const { age, region, civilization } = openingChoices(CATALOGUE, campaign);
  expect(age).toBe(AGE);

  await openCampaign(page, campaign);
  expect(await plateReads(page, PLATE)).toEqual(raftReads('learned'));

  await chronicleButton(page);
  const options = [`launch-region-${region}`, OPTION];
  expect(await readsOf(page, [OPTION])).toEqual([[regionName(ARCHIPELAGO)]]);
  expect(await optionsSelected(page, options)).toEqual([true, false]);

  await click(page, OPTION);
  await expect.poll(() => optionsSelected(page, options)).toEqual([false, true]);

  await launchedFromScreen(page);
  const chronicle = await chronicleOf(page);
  expect(chronicle).toEqual(
    launchedAs(campaign, { age, region: ARCHIPELAGO, civilization }, chronicle.seed),
  );

  expect(problems).toEqual([]);
});
