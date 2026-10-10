import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { available } from '../src/rules/campaign';
import { earningOf, technologyOf } from '../src/rules/catalogue';
import { freshCampaign } from '../src/rules/save';
import { openingChoices } from '../src/ui/launch-layout';
import { achievementGoal, regionName, technologyName, text } from '../src/ui/text';
import { learnedWithNeeds } from '../tools/learned-with-needs';
import {
  chronicleButton,
  chronicleOf,
  click,
  launchedAs,
  launchedFromScreen,
  openCampaign,
  optionsSelected,
  plateReads,
  readsOf,
  rested,
  rewardOf,
  watch,
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

/** What Raft's plate reads, its state aside: its name, its goal and its reward. */
function raftReads(state: 'available' | 'learned') {
  const { id, achievement } = earningOf(CATALOGUE, RAFT);
  const name = technologyName(RAFT);
  return {
    state,
    name: state === 'learned' ? text('plate.learned', { technology: name }) : name,
    goal: achievementGoal(id, achievement.need),
    reward: rewardOf(RAFT),
  };
}

test('on a campaign Raft stands available to, its plate reads the region it unlocks among its reward, and that region stands on the launch row reading ???, a press on it leaving the region selected where it was', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = learnedWithNeeds(
    CATALOGUE,
    freshCampaign(CATALOGUE),
    technologyOf(CATALOGUE, RAFT).needs,
  );
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
  const campaign = learnedWithNeeds(CATALOGUE, freshCampaign(CATALOGUE), [RAFT]);
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
    launchedAs(chronicle.seed, campaign, { age, region: ARCHIPELAGO, civilization }),
  );

  expect(problems).toEqual([]);
});
