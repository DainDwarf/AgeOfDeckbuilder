import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { gained } from '../src/rules/cards';
import { ageOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { warDeclared } from '../src/rules/city';
import { answerCase, answerCost, answerOf } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { relationsOf } from '../src/rules/units';
import { answerFace } from '../src/ui/face';
import { text } from '../src/ui/text';
import {
  barReadingOn,
  budget,
  chronicleOf,
  eventDealRead,
  firstDealtAlone,
  idsOf,
  offeredOn,
  openSaved,
  readings,
  restedOnDeal,
  standing,
  take,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The event the spec opens on. */
const GRIEVANCE = 'grievance';

/** The answer of the event that declares war, places a camp or raids. */
const ESCALATE = 'escalate';

/** The answer of the event that adds its challenge. */
const PAY_TRIBUTE = 'pay-tribute';

/** The challenge paying tribute adds to the discard pile. */
const TRIBUTE = 'tribute';

/** The answer of the event that pays culture. */
const SEND_GIFTS = 'send-gifts';

/**
 * The deal standing on the chronicle read on screen: its title, its lore, and each answer's face
 * reading the rules entry of the case it names on that chronicle; what Escalate's face reads.
 */
async function escalateRead(page: Page, chronicle: Chronicle): Promise<string> {
  const answers = offeredOn(chronicle);
  const faces = answers.map((_, at) => `deal-card-${at}`);
  const shown = await eventDealRead(page, chronicle, GRIEVANCE, []);
  expect(faces.map((face) => shown(face).rules)).toEqual(
    answers.map((answer) => answerFace(CATALOGUE, chronicle, GRIEVANCE, answer).rules),
  );
  return shown(faces[answers.indexOf(ESCALATE)]).rules;
}

test('the grievance deals its answers, Escalate reading Declare war while the neutral’s city stands at peace, and taking it turns the neutral hostile with no warning', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = firstDealtAlone(GRIEVANCE, campaign);
  const at = offeredOn(dealt).indexOf(ESCALATE);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(answerCase(CATALOGUE, dealt, GRIEVANCE, ESCALATE)).toBe('war');
  expect(relationsOf(after)).toBe('hostile');

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  expect(await escalateRead(page, dealt)).toBe(text('answer-rules.escalate.war'));

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  expect(await standing(page, 'deal')).toBe(false);

  expect(problems).toEqual([]);
});

test('the grievance dealt with the neutral hostile reads Escalate as a camp placed near the city with the warriors the rules read, and taking it lands what the rules land', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const hostile = warDeclared(firstDealtAlone(GRIEVANCE, campaign)).chronicle;
  const at = offeredOn(hostile).indexOf(ESCALATE);
  const { warriors } = answerOf(CATALOGUE, GRIEVANCE, ESCALATE).reads(CATALOGUE, hostile);
  const after = outcome(apply(CATALOGUE, hostile, { type: 'take', at }));
  expect(answerCase(CATALOGUE, hostile, GRIEVANCE, ESCALATE)).toBe('camp');

  await openSaved(page, hostile, campaign);
  await restedOnDeal(page);
  expect(await escalateRead(page, hostile)).toBe(
    text('answer-rules.escalate.camp', {
      camp: ageOf(CATALOGUE, hostile.age).camp.building,
      warriors,
      building: hostile.citySection.building,
    }),
  );

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  expect(await standing(page, 'deal')).toBe(false);

  expect(problems).toEqual([]);
});

test('paying tribute adds Tribute to the discard pile', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = firstDealtAlone(GRIEVANCE, campaign);
  const at = offeredOn(dealt).indexOf(PAY_TRIBUTE);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(idsOf(after.discardPile)).toEqual([...idsOf(dealt.discardPile), TRIBUTE]);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  expect(await standing(page, 'deal')).toBe(false);

  expect(problems).toEqual([]);
});

/** The first seed's turn from the campaign stopped on the grievance, the culture sending gifts costs gained. */
function gifted(campaign: Campaign): Chronicle {
  const dealt = firstDealtAlone(GRIEVANCE, campaign);
  const costs = answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, GRIEVANCE, SEND_GIFTS));
  const gain = Object.fromEntries(costs.map(({ resource, amount }) => [resource, amount]));
  return gained(dealt, gain).chronicle;
}

test('sending gifts pays the culture the rules price', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = gifted(campaign);
  const at = offeredOn(dealt).indexOf(SEND_GIFTS);
  const [price] = answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, GRIEVANCE, SEND_GIFTS));
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const stock = `reading-${price.resource}-value`;
  expect(price.resource).toBe('culture');
  expect(after.resources.culture).toBe(dealt.resources.culture - price.amount);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await readings(page, [stock]);
  expect(shown(stock).text).toBe(barReadingOn(dealt, price.resource));

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', stock]);
  expect([left('deal').standing, left(stock).text]).toEqual([
    false,
    barReadingOn(after, price.resource),
  ]);

  expect(problems).toEqual([]);
});
