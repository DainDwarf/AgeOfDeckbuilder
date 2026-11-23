import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { openingChoices, pinned, unpinned } from '../src/rules/campaign';
import { achievementOf, firstAge } from '../src/rules/catalogue';
import { countOn } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { withAge } from '../src/ui/launch-layout';
import { css, LOOK } from '../src/ui/look';
import { LEDGER } from '../src/ui/pinned-layout';
import { achievementGoal, technologyName, text } from '../src/ui/text';
import {
  aimed,
  campaignShown,
  campaignThenChronicle,
  capstoneClosed,
  chronicleOf,
  click,
  DESIGN_WINDOW,
  dragOut,
  HOLDING,
  HUNT,
  mapFrame,
  onScreen,
  openSaved,
  paidOnDeer,
  pieceOnScreenOf,
  pinnedAchievement,
  plantCampaign,
  playedOn,
  playedOut,
  pressContinue,
  pressed,
  reachedByClaims,
  readings,
  readNames,
  rested,
  rowOf,
  settledOn,
  standing,
  textOf,
  tooltipLines,
  tooltipUp,
  WIDE,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The technology whose achievement counts the hunts played. */
const HUNTING = 'trapping';

/** The ledger's panel, its tab, the tab's sign and the tally it reads folded. */
const PANEL = 'pinned-achievements';
const TAB = 'pinned-achievements-tab';
const SIGN = 'pinned-achievements-tab-sign';
const TALLY = 'pinned-achievements-tally';

/** What stops the pointer over the capstone's row, at the ledger's top. */
const CAPSTONE_STOP = 'pinned-capstone-stop';

/** What the technology's pinned achievement draws, read in one question. */
function partsOf(technology: string): string[] {
  return ['name', 'goal', 'goal-run', 'count'].map(
    (part) => `${pinnedAchievement(technology)}-${part}`,
  );
}

/** The technologies the campaign pins whose achievements the chronicle reads, in its order. */
function stackedIn(chronicle: Chronicle, pins: readonly string[]): string[] {
  return chronicle.achievements
    .map(({ id }) => achievementOf(CATALOGUE, chronicle.age, id).technology)
    .filter((technology) => pins.includes(technology));
}

/** Whether each plate wears the pin's marking, read in one question. */
function pinsWorn(page: Page, technologies: readonly string[]): Promise<boolean[]> {
  return page.evaluate(
    (names) =>
      names.map(
        (name) =>
          (window.named?.(`plate-${name}-pin`)?.object as Phaser.GameObjects.Graphics | undefined)
            ?.visible === true,
      ),
    technologies,
  );
}

test('on a campaign that has learned the first age’s technology, every available plate wears its pin; a left click on a pinned plate takes its pin off in the save, the others standing, and a left click on a plate not pinned pins it again', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const [first, second] = campaign.pins;
  expect(second).toBeDefined();
  await readNames(page);
  await plantCampaign(page, campaign);
  await page.goto('/');
  await campaignShown(page);
  expect(await pinsWorn(page, [first, second])).toEqual([true, true]);

  const offFirst = await pressed(page, `plate-${first}-name`, campaign, (held) =>
    unpinned(held, first),
  );
  expect(await pinsWorn(page, [first, second])).toEqual([false, true]);

  const offBoth = await pressed(page, `plate-${second}-name`, offFirst, (held) =>
    unpinned(held, second),
  );
  expect(await pinsWorn(page, [first, second])).toEqual([false, false]);

  await pressed(page, `plate-${first}-name`, offBoth, (held) => pinned(CATALOGUE, held, first));
  expect(await pinsWorn(page, [first, second])).toEqual([true, false]);

  expect(problems).toEqual([]);
});

test('a chronicle of the second age beside a campaign pinning a technology it reads shows that technology’s name, its goal and its count over its need, and a card played on screen that moves the count moves the reading', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const paid = paidOnDeer(HUNT, [], campaign);
  const hunted = playedOn(paid.chronicle, paid.index, paid.tile);
  const { id } = rowOf(paid.chronicle, HUNTING);
  const { need } = achievementOf(CATALOGUE, paid.chronicle.age, id);
  const countIn = (chronicle: Chronicle): string =>
    text('achievement.count', {
      count: countOn(CATALOGUE, chronicle, rowOf(chronicle, HUNTING)),
      need,
    });
  const [name, goal, run, count] = partsOf(HUNTING);
  expect(campaign.pins).toContain(HUNTING);
  expect(need).toBeGreaterThan(1);
  expect(countIn(hunted)).not.toBe(countIn(paid.chronicle));

  await openSaved(page, paid.chronicle, campaign);
  const seen = await readings(page, partsOf(HUNTING));
  expect(seen(name).text).toBe(technologyName(HUNTING));
  expect(seen(goal).text).toBe(achievementGoal(id, need));
  expect(seen(run).shows).toBe(true);
  expect(seen(count).text).toBe(countIn(paid.chronicle));
  expect(seen(count).shows).toBe(true);

  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(hunted);
  expect(await textOf(page, count)).toBe(countIn(hunted));

  expect(problems).toEqual([]);
});

test('a chronicle of the second age stands the pinned achievements it reads in one ledger, a row to each in its order under the capstone’s, each row meeting the one over it along a rule, and one it has reached reads the check mark and its name alone in a fainter ink, in no well, as tall as that line, the rows under it closing up and the last reaching the ledger’s foot', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const reached = reachedByClaims(campaign);
  const stack = stackedIn(reached, campaign.pins);
  const at = stack.indexOf(HOLDING);
  const [name, , run, count] = partsOf(HOLDING);
  expect(stack.length).toBeGreaterThan(2);
  expect(at).toBeGreaterThanOrEqual(0);
  expect(at).toBeLessThan(stack.length - 1);
  const each = (part: string): string[] =>
    stack.map((technology) => `${pinnedAchievement(technology)}-${part}`);

  await openSaved(page, reached, campaign);
  const seen = await readings(page, [
    ...partsOf(HOLDING),
    ...each('stop'),
    ...each('name'),
    ...each('rule'),
    PANEL,
    CAPSTONE_STOP,
  ]);
  expect(seen(name).text).toBe(
    text('achievement.reached', { achievement: technologyName(HOLDING) }),
  );
  expect(seen(run).shows).toBe(false);
  expect(seen(count).shows).toBe(false);
  expect(each('name').map((named) => seen(named).ink)).toEqual(
    stack.map((technology) =>
      css(rowOf(reached, technology).reached ? LOOK.reachedAchievementInk : LOOK.charcoalInk),
    ),
  );
  const lefts = each('name').map((named) => seen(named).boundsOnScreen.x);
  for (const left of lefts) expect(left).toBeCloseTo(lefts[0]);
  expect(each('rule').map((rule) => seen(rule).standing)).toEqual(stack.map(() => true));

  const boxes = each('stop').map((stop) => seen(stop).boundsOnScreen);
  const ruled = [seen(CAPSTONE_STOP).boundsOnScreen, ...boxes];
  for (const [above, box] of ruled.slice(1).entries()) {
    expect(box.y).toBeCloseTo(ruled[above].y + ruled[above].height);
  }
  // The last row's stop reaches over the ledger's foot.
  const { unit } = seen(each('stop')[0]).onScreen;
  const rowHeights = boxes.map(
    ({ height }, index) => height - (index === boxes.length - 1 ? LEDGER.foot * unit : 0),
  );
  for (const [index, technology] of stack.entries()) {
    if (rowOf(reached, technology).reached) expect(rowHeights[index]).toBeCloseTo(rowHeights[at]);
    else expect(rowHeights[index]).toBeGreaterThan(rowHeights[at]);
  }
  const ledger = pieceOnScreenOf(seen(PANEL));
  const last = boxes[boxes.length - 1];
  expect(last.y + last.height).toBeCloseTo(ledger.y + ledger.height);

  expect(problems).toEqual([]);
});

test('a ledger holding the capstone’s row alone stands as far under its tab as over it, the row covering the ledger down to its foot, and folds to its tab wearing its triangle alone, in its middle', async ({
  page,
}) => {
  const problems = watch(page);
  const won = wonCampaign();
  const campaign = won.pins.reduce(unpinned, won);
  const chronicle = settledOn(1, [], campaign);
  expect(stackedIn(chronicle, won.pins).length).toBeGreaterThan(0);
  expect(stackedIn(chronicle, campaign.pins)).toEqual([]);

  await openSaved(page, chronicle, campaign);
  const seen = await readings(page, [CAPSTONE_STOP, PANEL, TAB]);
  const ledger = pieceOnScreenOf(seen(PANEL));
  const tab = pieceOnScreenOf(seen(TAB));
  const row = seen(CAPSTONE_STOP).boundsOnScreen;
  expect(ledger.y + ledger.height - (tab.y + tab.height)).toBeCloseTo(tab.y - ledger.y);
  expect(row.y + row.height).toBeCloseTo(ledger.y + ledger.height);

  await click(page, TAB);
  await expect.poll(() => standing(page, PANEL)).toBe(false);
  await rested(page);
  const folded = await readings(page, [TAB, SIGN, TALLY]);
  const closed = pieceOnScreenOf(folded(TAB));
  expect([folded(SIGN).standing, folded(TALLY).standing]).toEqual([true, false]);
  expect(folded(SIGN).onScreen.y).toBeCloseTo(closed.y + closed.height / 2, 0);

  expect(problems).toEqual([]);
});

test('the pinned achievements’ ledger stands against the screen’s left edge and runs on past it, under the resource bar, at one height on the design window and on a wide one, and its tab shows past its outer edge, its inner end under the ledger', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const { chronicle } = paidOnDeer(HUNT, [], campaign);

  /** Where the first row, the ledger, its tab, the resource bar and the map's frame stand on the page. */
  const laidOut = async () => {
    const seen = await readings(page, [CAPSTONE_STOP, PANEL, TAB, 'resource-bar']);
    return {
      row: seen(CAPSTONE_STOP).boundsOnScreen,
      unit: seen(CAPSTONE_STOP).onScreen.unit,
      ledger: pieceOnScreenOf(seen(PANEL)),
      tab: pieceOnScreenOf(seen(TAB)),
      bar: seen('resource-bar').boundsOnScreen,
      frame: await mapFrame(page),
    };
  };

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, chronicle, campaign);
  const narrow = await laidOut();
  expect(narrow.row.x).toBeCloseTo(narrow.frame.x);
  expect(narrow.ledger.x).toBeLessThan(narrow.frame.x);
  expect(narrow.ledger.x + narrow.ledger.width).toBeCloseTo(narrow.row.x + narrow.row.width);
  expect(narrow.ledger.y).toBeCloseTo(narrow.row.y);
  expect(narrow.row.y).toBeGreaterThan(narrow.bar.y + narrow.bar.height);
  const right = narrow.row.x + narrow.row.width;
  expect(narrow.tab.x).toBeLessThan(right);
  expect(narrow.tab.x + narrow.tab.width).toBeGreaterThan(right);
  expect(narrow.tab.y).toBeGreaterThan(narrow.row.y);

  await page.setViewportSize(WIDE);
  await expect.poll(async () => (await mapFrame(page)).width).toBeCloseTo(WIDE.width, 0);
  await rested(page);
  const wide = await laidOut();
  expect(wide.row.x).toBeCloseTo(wide.frame.x);
  expect((wide.row.y - wide.frame.y) / wide.unit).toBeCloseTo(
    (narrow.row.y - narrow.frame.y) / narrow.unit,
  );

  expect(problems).toEqual([]);
});

test('a left click on the tab folds the ledger into the screen’s edge and lets the card being aimed go: no row stands, and the tab stands alone on the edge at the height it stood, its sign turned, reading the tally the rules give, and naming itself under it on the rest; a second click brings the rows back, and the chronicle screen opened again by Continue with the ledger folded stands unfolded', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const paid = paidOnDeer(HUNT, [], campaign);
  const stack = stackedIn(paid.chronicle, campaign.pins);
  const stops = [
    CAPSTONE_STOP,
    ...stack.map((technology) => `${pinnedAchievement(technology)}-stop`),
  ];
  const tally = text('achievement.tally', {
    reached: stack.filter((technology) => rowOf(paid.chronicle, technology).reached).length,
    pinned: stack.length,
  });
  expect(stack.length).toBeGreaterThan(0);

  /** What the ledger and its tab show, in one question to the page. */
  const laidOut = async () => {
    const seen = await readings(page, [...stops, PANEL, TAB, SIGN, TALLY]);
    return {
      rows: stops.map((stop) => seen(stop).standing),
      ledger: seen(PANEL).standing,
      tab: pieceOnScreenOf(seen(TAB)),
      turn: seen(SIGN).axes.x.x,
      tally: seen(TALLY).standing ? seen(TALLY).text : undefined,
      edge: seen(stops[0]).boundsOnScreen.x,
    };
  };
  const unfolded = { rows: stops.map(() => true), ledger: true, tally: undefined };

  await openSaved(page, paid.chronicle, campaign);
  const open = await laidOut();
  expect(open).toMatchObject(unfolded);
  expect(open.turn).toBeGreaterThan(0);

  await click(page, `hand-${paid.index}`);
  await aimed(page);
  await click(page, TAB);
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  await rested(page);
  const folded = await laidOut();
  expect(folded).toMatchObject({ rows: stops.map(() => false), ledger: false, tally });
  expect(folded.tab.x).toBeLessThan(open.edge);
  expect(folded.tab.x + folded.tab.width).toBeGreaterThan(open.edge);
  expect(folded.tab.y).toBeCloseTo(open.tab.y);
  expect(folded.turn).toBeLessThan(0);
  expect(await chronicleOf(page)).toEqual(paid.chronicle);

  const at = await onScreen(page, TAB);
  await page.mouse.move(at.x, at.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipLines(page, 'tooltip-ui')).toEqual([
    { text: text('button.pinned-achievements'), bold: false },
  ]);
  const bubble = (await readings(page, ['tooltip-ui']))('tooltip-ui').boundsOnScreen;
  expect(bubble.y).toBeGreaterThan(folded.tab.y + folded.tab.height);

  await click(page, TAB);
  await expect.poll(async () => (await laidOut()).ledger).toBe(true);
  const back = await laidOut();
  expect(back).toMatchObject(unfolded);
  expect(back.turn).toBeGreaterThan(0);

  await click(page, TAB);
  await expect.poll(async () => (await laidOut()).ledger).toBe(false);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await campaignThenChronicle(page);
  await pressContinue(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await capstoneClosed(page);
  expect(await laidOut()).toMatchObject(unfolded);

  expect(problems).toEqual([]);
});

test('a chronicle of the first age beside a campaign pinning a technology of the second shows nothing of it: the ledger and its tab stand with the capstone’s row alone', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const choices = withAge(
    CATALOGUE,
    campaign,
    openingChoices(CATALOGUE, campaign),
    firstAge(CATALOGUE),
  );
  const chronicle = settledOn(1, [], campaign, choices);
  expect(campaign.pins).toContain(HUNTING);

  await openSaved(page, chronicle, campaign, choices);
  const shown = [pinnedAchievement(HUNTING), PANEL, TAB, CAPSTONE_STOP];
  const seen = await readings(page, shown);
  expect(shown.map((name) => seen(name).standing)).toEqual([false, true, true, true]);

  expect(problems).toEqual([]);
});
