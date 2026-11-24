import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { type Campaign, learnedInto, openingChoices } from '../src/rules/campaign';
import { aimOf, gained } from '../src/rules/cards';
import { cardOf, entered } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import { addedToDrawPileTop } from '../src/rules/schedule';
import { inSight } from '../src/rules/sight';
import { type Group, walked } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { unitAt, unitOf } from '../src/rules/units';
import { withAge } from '../src/ui/launch-layout';
import { LOOK } from '../src/ui/look';
import { text, unitName } from '../src/ui/text';
import {
  learnedWithNeeds,
  technologiesEarnedIn,
  technologiesReaching,
} from '../tools/learned-with-needs';
import {
  aimed,
  aimLine,
  chronicleOf,
  click,
  cursorOverCanvas,
  endTurn,
  enemyBesideCity,
  enemyEnteredOn,
  firstSeed,
  inHand,
  type LogEntry,
  logLineNamed,
  logPointed,
  logRead,
  mapFrame,
  neutralInFog,
  offsetOf,
  onScreen,
  openSaved,
  pieceOnScreen,
  pieceOnScreenOf,
  playerCityTile,
  type RingShown,
  readings,
  rested,
  settledOn,
  squeezed,
  standing,
  tileOnScreen,
  tilePlayable,
  tooltipLines,
  tooltipUp,
  WARRIOR,
  watch,
  wheel,
} from './chronicle-screen';

/** The log's panel, the frame its lines scroll in, its tab and the tab's sign. */
const LOG = 'log';
const LOG_FRAME = 'log-lines-frame';
const TAB = 'log-tab';
const SIGN = 'log-tab-sign';

/** The ledger's panel, its rows' panel and the frame they scroll in, and its tab. */
const LEDGER = 'pinned-achievements';
const LEDGER_ROWS = 'pinned-achievements-rows';
const LEDGER_FRAME = 'pinned-achievements-rows-frame';
const LEDGER_TAB = 'pinned-achievements-tab';

type Attack = Extract<Group, { readonly name: 'attack' }>;

/** Every attack the end of turn makes on the chronicle, in the order it plays them. */
function attacksAtTheEndOfTurn(chronicle: Chronicle): Attack[] {
  return [...walked(apply(CATALOGUE, chronicle, { type: 'end-turn' }))].filter(
    (stage): stage is Attack => stage.kind === 'group' && stage.name === 'attack',
  );
}

/** Whether the map draws the tile live on the chronicle it stands on as the attack plays, or on the one it leaves. */
function seenAt(attack: Attack, tile: TileCoords): boolean {
  return [attack.before, attack.chronicle].some((chronicle) =>
    inSight(CATALOGUE, chronicle).has(tileKey(tile)),
  );
}

/**
 * Every way the log may read the attack, by the rules' own reading of it: the attacker and the unit
 * attacked by their kinds' names, and the damage it took or its kill.
 */
function attackReadings(attack: Attack): { both: string; all: string[] } {
  const attacker = unitAt(attack.before.units, attack.attacker);
  const target = unitAt(attack.before.units, attack.target);
  if (attacker === undefined || target === undefined) throw new Error('the attack names no unit');
  const names = { attacker: unitName(attacker.stats.type), target: unitName(target.stats.type) };
  const left = unitOf(attack.chronicle.units, target.id);
  const damage = left === undefined ? 0 : target.stats.health - left.stats.health;
  const both =
    left === undefined ? text('log.kill', names) : text('log.attack', { ...names, damage });
  const all = [
    both,
    left === undefined ? text('log.killed', names) : text('log.attacked', { ...names, damage }),
    text('log.attacks', names),
  ];
  return { both: squeezed(both), all: all.map(squeezed) };
}

/**
 * The first seed's turn 1 with a warrior of the player's on the city's tile and an enemy beside it,
 * as `prepared` leaves it, whose end of turn makes an attack the map plays on both its tiles; the
 * attack.
 */
function besetInSight(
  prepared: (chronicle: Chronicle) => Chronicle | undefined = (chronicle) => chronicle,
): { chronicle: Chronicle; attack: Attack } {
  return firstSeed('makes an attack in sight at the end of its turn 1', (seed) => {
    const settled = settledOn(seed);
    const guarded = entered(CATALOGUE, settled, {
      type: WARRIOR,
      faction: 'player',
      tile: playerCityTile(settled),
    }).chronicle;
    const beset = enemyBesideCity(guarded);
    const chronicle = beset === undefined ? undefined : prepared(beset.chronicle);
    if (chronicle === undefined) return undefined;
    const attack = attacksAtTheEndOfTurn(chronicle).find(
      (each) => seenAt(each, each.attacker) && seenAt(each, each.target),
    );
    return attack === undefined ? undefined : { chronicle, attack };
  });
}

/**
 * The chronicle with the first card of the catalogue aimed at a tile added to its draw pile's top and
 * its cost gained, where the hand its end of turn draws holds a card aimed at a tile the city can pay
 * for; nothing where it does not.
 */
function drawingAimable(chronicle: Chronicle): Chronicle | undefined {
  const id = Object.keys(CATALOGUE.cards).find(
    (each) => aimOf(cardOf(CATALOGUE, each)).aim === 'tile',
  );
  if (id === undefined) throw new Error('the catalogue holds no card aimed at a tile');
  const added = addedToDrawPileTop(CATALOGUE, chronicle, id).chronicle;
  const paid = gained(added, cardOf(CATALOGUE, id).cost).chronicle;
  const drawn = outcome(apply(CATALOGUE, paid, { type: 'end-turn' }));
  return inHand(drawn, tilePlayable) === -1 ? undefined : paid;
}

/** The attack's two tiles, each with the log's ring of the faction of the unit standing there as it is made. */
function ringsOf(attack: Attack): RingShown[] {
  return [attack.attacker, attack.target]
    .map((tile) => {
      const unit = unitAt(attack.before.units, tile);
      if (unit === undefined) throw new Error(`the attack names no unit on ${tileKey(tile)}`);
      return { tile: tileKey(tile), colour: LOOK.logRing[unit.faction] };
    })
    .sort((one, other) => one.tile.localeCompare(other.tile));
}

/** Where the middle of the tiles' faces stands on the page, and what a unit of the map measures there. */
async function middleOnScreen(
  page: Page,
  tiles: readonly TileCoords[],
): Promise<{ x: number; y: number; unit: number }> {
  const names = tiles.map((tile) => `tile-${tileKey(tile)}`);
  const seen = await readings(page, names);
  const at = names.map((name) => seen(name).onScreen);
  const across = (axis: 'x' | 'y'): number =>
    (Math.min(...at.map((each) => each[axis])) + Math.max(...at.map((each) => each[axis]))) / 2;
  return { x: across('x'), y: across('y'), unit: at[0].unit };
}

/** How far the middle of the tiles stands from the middle of the map's frame, on the page. */
async function offTheFrameMiddle(page: Page, tiles: readonly TileCoords[]): Promise<number> {
  const frame = await mapFrame(page);
  const middle = await middleOnScreen(page, tiles);
  return Math.hypot(
    middle.x - (frame.x + frame.width / 2),
    middle.y - (frame.y + frame.height / 2),
  );
}

/**
 * The chronicle `neutralInFog` stands, an enemy entered out of sight beside the neutral's unit in
 * the fog, whose end of turn makes an attack the map plays on neither of its tiles; the attack.
 */
function foughtInFog(): { chronicle: Chronicle; campaign: Campaign; attack: Attack } {
  const { chronicle, campaign, fog } = neutralInFog();
  const seen = inSight(CATALOGUE, chronicle);
  for (const beside of neighbours(fog)) {
    if (seen.has(tileKey(beside)) || unitAt(chronicle.units, beside) !== undefined) continue;
    const beset = enemyEnteredOn(chronicle, beside);
    if (beset === undefined) continue;
    const attack = attacksAtTheEndOfTurn(beset.chronicle).find(
      (each) => !seenAt(each, each.attacker) && !seenAt(each, each.target),
    );
    if (attack !== undefined) return { chronicle: beset.chronicle, campaign, attack };
  }
  throw new Error('no enemy entered beside the neutral’s unit in the fog fights out of sight');
}

/** Where the entry stands among the log's, -1 where it holds none. */
function placeOf(entries: readonly LogEntry[], entry: LogEntry): number {
  return entries.findIndex((each) => JSON.stringify(each) === JSON.stringify(entry));
}

test('an end of turn whose enemy attacks the warrior on the city’s tile in sight lands the attack’s line under its turn’s heading, its damage read from the rules, and the wheel over the log and over the ledger leaves the map’s zoom where it stood', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, attack } = besetInSight();
  const heading = { heading: text('chronicle.turn', { turn: attack.before.turn }) };
  const line = { line: attackReadings(attack).both };

  await openSaved(page, chronicle);
  expect(await standing(page, LOG)).toBe(false);
  await endTurn(page);
  const read = await logRead(page);
  const under = placeOf(read, heading);
  const at = placeOf(read, line);
  expect(under).toBeGreaterThanOrEqual(0);
  expect(at).toBeGreaterThan(under);
  expect(read.slice(under + 1, at).every((entry) => 'line' in entry)).toBe(true);

  const city = playerCityTile(chronicle);
  const stood = await tileOnScreen(page, city);
  await wheel(page, -100, LOG_FRAME);
  await rested(page);
  await wheel(page, -100, LEDGER_FRAME);
  await rested(page);
  expect(await tileOnScreen(page, city)).toEqual(stood);

  expect(problems).toEqual([]);
});

test('a fight in the fog at the end of turn lands no line', async ({ page }) => {
  const problems = watch(page);
  const { chronicle, campaign, attack } = foughtInFog();
  const { all } = attackReadings(attack);

  await openSaved(page, chronicle, campaign);
  await endTurn(page);
  const read = await logRead(page);
  expect(read.length).toBeGreaterThan(0);
  expect(read.filter((entry) => 'line' in entry && all.includes(entry.line))).toEqual([]);

  expect(problems).toEqual([]);
});

test('the pointer on the line of an attack in sight lights it under a hand and rings the attacker’s tile and the attacked unit’s, each in the log’s ring of its unit’s faction, off the log nothing is lit or ringed, and a left click on it centres the map on the two tiles, its zoom standing; the Income line lights, rings and pans nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, attack } = besetInSight();
  const line = attackReadings(attack).both;
  const tiles = [attack.attacker, attack.target];

  await openSaved(page, chronicle);
  await endTurn(page);
  const income = (await logRead(page)).flatMap((entry) =>
    'line' in entry && entry.line.startsWith(squeezed(text('log.income'))) ? [entry.line] : [],
  );
  expect(income).toHaveLength(1);

  const stood = await middleOnScreen(page, tiles);
  const onIncome = await onScreen(page, await logLineNamed(page, income[0]));
  await page.mouse.move(onIncome.x, onIncome.y);
  await rested(page);
  expect(await logPointed(page)).toEqual({ lit: [], rings: [] });
  expect(await cursorOverCanvas(page)).toBe('');
  await page.mouse.click(onIncome.x, onIncome.y);
  await rested(page);
  expect(await middleOnScreen(page, tiles)).toEqual(stood);

  const onLine = await onScreen(page, await logLineNamed(page, line));
  await page.mouse.move(onLine.x, onLine.y);
  await rested(page);
  expect(await logPointed(page)).toEqual({ lit: [line], rings: ringsOf(attack) });
  expect(await cursorOverCanvas(page)).toBe('pointer');

  const frame = await mapFrame(page);
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
  await rested(page);
  expect(await logPointed(page)).toEqual({ lit: [], rings: [] });

  expect(await offTheFrameMiddle(page, tiles)).toBeGreaterThan(stood.unit);
  await page.mouse.click(onLine.x, onLine.y);
  await expect.poll(() => offTheFrameMiddle(page, tiles)).toBeLessThan(stood.unit / 10);
  expect((await middleOnScreen(page, tiles)).unit).toBe(stood.unit);

  expect(problems).toEqual([]);
});

test('a left click on the line of an attack lets go of the card being aimed', async ({ page }) => {
  const problems = watch(page);
  const { chronicle, attack } = besetInSight(drawingAimable);
  const line = attackReadings(attack).both;

  await openSaved(page, chronicle);
  await endTurn(page);
  const card = await onScreen(page, `hand-${inHand(await chronicleOf(page), tilePlayable)}`);
  await page.mouse.click(card.x, card.y);
  await aimed(page);

  const onLine = await onScreen(page, await logLineNamed(page, line));
  await page.mouse.click(onLine.x, onLine.y);
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await aimLine(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a left click on the log’s tab folds the log into the screen’s edge, the tab alone standing there turned and naming itself under it on the rest, and a second brings the log back', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle } = besetInSight();

  await openSaved(page, chronicle);
  await endTurn(page);
  const open = await readings(page, [LOG, SIGN]);
  expect(open(LOG).standing).toBe(true);
  expect(open(SIGN).axes.x.x).toBeGreaterThan(0);

  await click(page, TAB);
  await expect.poll(() => standing(page, LOG)).toBe(false);
  await rested(page);
  const folded = await readings(page, [TAB, SIGN, 'log-lines']);
  expect([folded(TAB).standing, folded('log-lines').standing]).toEqual([true, false]);
  expect(folded(SIGN).axes.x.x).toBeLessThan(0);
  const tab = pieceOnScreenOf(folded(TAB));

  const rest = await onScreen(page, TAB);
  await page.mouse.move(rest.x, rest.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipLines(page, 'tooltip-ui')).toEqual([
    { text: text('button.log'), bold: false },
  ]);
  const bubble = (await readings(page, ['tooltip-ui']))('tooltip-ui').boundsOnScreen;
  expect(bubble.y).toBeGreaterThan(tab.y + tab.height);

  await click(page, TAB);
  await expect.poll(() => standing(page, LOG)).toBe(true);
  expect(await standing(page, 'log-lines')).toBe(true);

  expect(problems).toEqual([]);
});

/**
 * The campaign of the second age whose pins its achievements read the most of, learning that age's
 * technologies one at a time from a campaign that reaches it; the first such campaign, and the age.
 */
function widestLedger(): { campaign: Campaign; age: string } {
  const [, age] = Object.keys(CATALOGUE.ages);
  if (age === undefined) throw new Error('the catalogue lists no second age');
  const earned = technologiesEarnedIn(CATALOGUE, age);
  const reads = (campaign: Campaign): number =>
    campaign.pins.filter((pin) => earned.includes(pin)).length;
  let widest = learnedWithNeeds(
    CATALOGUE,
    freshCampaign(CATALOGUE),
    technologiesReaching(CATALOGUE, age),
  );
  const met = new Set<string>();
  let frontier = [widest];
  while (frontier.length > 0) {
    const next: Campaign[] = [];
    for (const campaign of frontier) {
      if (reads(campaign) > reads(widest)) widest = campaign;
      for (const pin of campaign.pins.filter((each) => earned.includes(each))) {
        const learned = learnedInto(CATALOGUE, campaign, pin);
        const key = [...learned.technologies].sort().join(' ');
        if (met.has(key)) continue;
        met.add(key);
        next.push(learned);
      }
    }
    frontier = next;
  }
  return { campaign: widest, age };
}

test('a campaign pinning the most goals a second-age chronicle reads stands a ledger that stops over the log and scrolls its rows past its foot under the wheel, its tab holding still', async ({
  page,
}) => {
  const problems = watch(page);
  const { campaign, age } = widestLedger();
  const choices = withAge(CATALOGUE, campaign, openingChoices(CATALOGUE, campaign), age);
  const chronicle = settledOn(1, [], campaign, choices);

  await openSaved(page, chronicle, campaign, choices);
  const opened = await readings(page, [LEDGER_ROWS, LEDGER_TAB]);
  expect(opened(LEDGER_ROWS).scrolled.offset).toBe(0);
  expect(opened(LEDGER_ROWS).scrolled.overflow).toBeGreaterThan(0);
  const tab = pieceOnScreenOf(opened(LEDGER_TAB));

  await wheel(page, 100, LEDGER_FRAME);
  await expect.poll(() => offsetOf(page, LEDGER_ROWS)).toBeGreaterThan(0);
  expect(await pieceOnScreen(page, LEDGER_TAB)).toEqual(tab);

  await endTurn(page);
  const laid = await readings(page, [LEDGER, LOG]);
  const ledger = pieceOnScreenOf(laid(LEDGER));
  const log = pieceOnScreenOf(laid(LOG));
  expect(laid(LOG).standing).toBe(true);
  expect(ledger.y + ledger.height).toBeLessThan(log.y);

  expect(problems).toEqual([]);
});
