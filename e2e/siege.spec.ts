import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { bonusCarried, unitKind } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { enemyEntering } from '../src/rules/enemies';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { unitDamaged } from '../src/rules/schedule';
import { inSight } from '../src/rules/sight';
import { walked } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { standsOn, type Unit, unitAt } from '../src/rules/units';
import { capstoneFace } from '../src/ui/face';
import { capstoneLore } from '../src/ui/lore';
import { text, victoryLine } from '../src/ui/text';
import {
  beforeTheLanding,
  budget,
  chronicleOf,
  cityTileOf,
  cleared,
  click,
  dragTiles,
  enemiesOf,
  onScreen,
  openSaved,
  panelRows,
  playedOut,
  readings,
  rested,
  shownCard,
  standing,
  stoppedTurn,
  textOf,
  unitEntered,
  victoryShown,
  WARRIOR,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The capstone the spec lands. */
const SIEGE = 'siege';

/** The unit kind whose kill passes it. */
const LEADER = 'leader';

/** The script every enemy of its raid carries. */
const SIEGE_RAIDER = 'siege-raider';

/** The kinds its band draws from. */
const BAND = [WARRIOR, 'archer'];

/**
 * The first tile beside `around`, `kept` aside, in sight, that a unit of the kind stands on ashore
 * with nobody on it.
 */
function freeBeside(
  chronicle: Chronicle,
  around: TileCoords,
  kind: string,
  kept: TileCoords,
): TileCoords | undefined {
  const stats = unitKind(CATALOGUE, kind);
  const seen = inSight(CATALOGUE, chronicle);
  return neighbours(around).find(
    (tile) =>
      tileKey(tile) !== tileKey(kept) &&
      seen.has(tileKey(tile)) &&
      standsOn(CATALOGUE, stats, false, tileAt(chronicle.tiles, tile)) &&
      unitAt(chronicle.units, tile) === undefined,
  );
}

/**
 * The landed chronicle cleared of its enemies, a warrior of the player's entered on the city's tile,
 * a leader entered on a tile beside it and taken down to the warrior's damage, and an enemy warrior
 * entered beside the leader; nothing where no tile takes them.
 */
function struckAtTheLeader(
  landed: Chronicle,
): { chronicle: Chronicle; warrior: Unit; leader: Unit; led: Unit } | undefined {
  const city = cityTileOf(landed);
  const guarded = unitEntered(cleared(landed), { type: WARRIOR, faction: 'player', tile: city });
  const at = freeBeside(guarded, city, LEADER, city);
  if (at === undefined) return undefined;
  const entered = unitEntered(guarded, enemyEntering(LEADER, SIEGE_RAIDER, at));
  const warrior = unitAt(entered.units, city);
  const fresh = unitAt(entered.units, at);
  if (warrior === undefined || fresh === undefined) return undefined;
  const worn = unitDamaged(entered, at, fresh.stats.health - warrior.stats.damage).chronicle;
  const beside = freeBeside(worn, at, WARRIOR, city);
  if (beside === undefined) return undefined;
  const chronicle = unitEntered(worn, enemyEntering(WARRIOR, SIEGE_RAIDER, beside));
  const leader = unitAt(chronicle.units, at);
  const led = unitAt(chronicle.units, beside);
  if (leader === undefined || led === undefined) return undefined;
  return { chronicle, warrior, leader, led };
}

/** The units the capstone's landing entered as the end of turn from `before` lands it, as they stand once it has. */
function landingEntered(before: Chronicle): Unit[] {
  const ended = apply(CATALOGUE, before, { type: 'end-turn' });
  const landing = [...walked(ended)].find(
    (stage) => stage.kind === 'group' && stage.name === 'capstone-landing',
  );
  if (landing === undefined) throw new Error('the end of turn lands no capstone');
  return [...walked([landing])].flatMap((stage) => {
    if (stage.name !== 'enter') return [];
    const unit = unitAt(landing.chronicle.units, stage.tile);
    return unit === undefined ? [] : [unit];
  });
}

/** The first siege seed's landing, on the campaign, as `beforeTheLanding` reaches it. */
function siegeLanding<T>(
  complaint: string,
  campaign: Campaign,
  answer: (before: Chronicle, landed: Chronicle) => T | undefined,
): T {
  return beforeTheLanding(complaint, answer, { campaign, capstone: SIEGE, readied: cleared });
}

test('the siege’s landing raises its card and enters a leader and its band of warriors and archers as a raid, every one carrying the siege’s raider', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { before, landed } = siegeLanding(
    'stands on an open turn the turn before the siege lands',
    campaign,
    (before, landed) => ({ before, landed }),
  );
  const raid = landingEntered(before);
  const kinds = raid.map((unit) => unit.stats.type);
  expect(enemiesOf(before).some((unit) => unit.stats.type === LEADER)).toBe(false);
  expect(kinds.filter((kind) => kind === LEADER)).toHaveLength(1);
  expect(kinds.filter((kind) => BAND.includes(kind))).toHaveLength(
    capstoneFace(CATALOGUE, landed).reading.band,
  );
  expect(raid.map((unit) => (unit.faction === 'enemy' ? unit.script : undefined))).toEqual(
    raid.map(() => SIEGE_RAIDER),
  );

  await openSaved(page, before, campaign);
  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  const shown = await readings(page, ['capstone-lore', 'capstone-card-0']);
  expect([shown('capstone-lore').text, shown('capstone-card-0').card]).toEqual([
    capstoneLore(SIEGE, 'landing'),
    SIEGE,
  ]);
  expect(shown('capstone-card-0').rules).toBe(capstoneFace(CATALOGUE, landed).rules);

  await click(page, 'capstone-card-0');
  await playedOut(page);
  expect(await chronicleOf(page)).toEqual(landed);
  expect(problems).toEqual([]);
});

test('an enemy warrior beside the leader reads its damage and the bonus it carries, and the warrior’s attack that kills the leader wins on the blow with the siege’s line', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { chronicle, warrior, leader, led } = siegeLanding(
    'stands a leader and a warrior of its band beside its city after the siege lands',
    campaign,
    (_before, landed) => struckAtTheLeader(landed),
  );
  const carried = bonusCarried(CATALOGUE, chronicle.units, led);
  const won = outcome(
    apply(CATALOGUE, chronicle, { type: 'attack', unit: warrior.id, tile: leader.tile }),
  );
  expect(carried).toBeGreaterThan(0);
  expect(won.ending).toEqual({ outcome: 'victory', turn: chronicle.turn });

  await openSaved(page, chronicle, campaign);
  expect(await victoryShown(page)).toBe(false);

  await rested(page);
  const at = await onScreen(page, `tile-${tileKey(led.tile)}`);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  const rows = (await panelRows(page)).map((row) => row.text);
  expect(rows[rows.indexOf(text('label.damage')) + 1]).toBe(`${led.stats.damage} + ${carried}`);
  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();

  await dragTiles(page, warrior.tile, leader.tile);
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(await chronicleOf(page)).toEqual(won);
  expect(await textOf(page, 'ending-line')).toBe(victoryLine(SIEGE));
  expect(problems).toEqual([]);
});
