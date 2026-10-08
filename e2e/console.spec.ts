import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf, type Entering, entered, unitKind } from '../src/rules/catalogue';
import { apply, chartedAndRead, outcome } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { freshCampaign, readSave } from '../src/rules/save';
import { inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { standsOn, unitAt } from '../src/rules/units';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { openingChoices } from '../src/ui/launch-layout';
import { SAVE_ENTRY } from '../src/ui/save-entry';
import { text } from '../src/ui/text';
import {
  besideTiles,
  budget,
  campaignShown,
  chronicleOf,
  cityTileOf,
  click,
  consoleKey,
  enemiesOf,
  enter,
  firstsOf,
  heldSave,
  launchedAs,
  marksIn,
  openLaunch,
  openSaved,
  playing,
  readNames,
  rested,
  ringedTile,
  settledOn,
  shows,
  standing,
  tileOnScreen,
  WARRIOR,
  waitGameClock,
  watch,
} from './chronicle-screen';

/** A tile on bare map, clear of the resource bar, the piles and the hand; the opening never sees it. */
const BARE = { q: 0, r: -3 };

/** What the console reads, line by line, the line being typed last of all. */
function consoleLines(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = window.named?.('console')?.object as Phaser.GameObjects.Container | undefined;
    if (root === undefined) throw new Error('no console stands on the screen');
    return root.list
      .filter((part) => part.type === 'Text')
      .map((part) => (part as Phaser.GameObjects.Text).text);
  });
}

/** What the console's input line reads. */
async function typedLine(page: Page): Promise<string> {
  const lines = await consoleLines(page);
  return lines[lines.length - 1];
}

/** How far down the resource bar reaches, and the highest line the console writes, on the screen. */
function bandAndLines(page: Page): Promise<{ bar: number; highest: number }> {
  return page.evaluate(() => {
    const boundsOf = (name: string): Phaser.Geom.Rectangle => {
      const found = window.named?.(name)?.object as
        | (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.GetBounds)
        | undefined;
      if (found === undefined) throw new Error(`nothing named ${name} is on the chronicle screen`);
      return found.getBounds();
    };
    const written = ['console-line-0', 'console-line-1', 'console-line-2', 'console-line-3'];
    return {
      bar: boundsOf('reading-food').bottom,
      highest: Math.min(
        ...written.map((name) => boundsOf(name).top),
        boundsOf('console-input').top,
      ),
    };
  });
}

/** The console as a new chronicle leaves it: closed, and no line run. */
const CLEARED = ['', '', '', '', '> '];

/** Waits for the chronicle screen to stand on a chronicle of that seed. */
async function standsOnSeed(page: Page, seed: number): Promise<void> {
  await page.waitForFunction(
    (wanted) =>
      window.game?.scene.isActive('ui') === true &&
      window.game.scene.getScene<ChronicleScene>('ui').chronicle.seed === wanted,
    seed,
  );
  await rested(page);
}

/** The first tile beside the city a warrior stands on with nobody on it. */
function warriorGround(chronicle: Chronicle): TileCoords {
  const warrior = unitKind(CATALOGUE, WARRIOR);
  const free = neighbours(cityTileOf(chronicle)).find(
    (tile) =>
      standsOn(CATALOGUE, warrior, false, tileAt(chronicle.tiles, tile)) &&
      unitAt(chronicle.units, tile) === undefined,
  );
  if (free === undefined) throw new Error('no tile beside the city takes a warrior');
  return free;
}

/** The chronicle the save holds, read as the game reads it. */
async function heldChronicle(page: Page): Promise<Chronicle | undefined> {
  return (await heldSave(page)).chronicle?.chronicle;
}

/** The chronicle a unit entering leaves, charted and read as the rules chart and read a command's. */
function enteredOn(chronicle: Chronicle, entering: Entering): Chronicle {
  const { stages } = entered(CATALOGUE, chronicle, entering);
  return outcome(chartedAndRead(CATALOGUE, chronicle, stages));
}

/**
 * The chronicle screen once a unit has entered, in one question to the page: the chronicle on it
 * and the one the save holds, the tile ringed, the console, the fog marks and the end-turn label.
 */
async function enteredScreen(page: Page): Promise<{
  chronicle: Chronicle;
  held: Chronicle | undefined;
  ringed: string | undefined;
  consoleOpen: boolean;
  lines: string[];
  fogMarks: number;
  endTurn: string;
}> {
  const { save, ...read } = await page.evaluate((entry) => {
    const named = (name: string): Phaser.GameObjects.GameObject => {
      const found = window.named?.(name)?.object;
      if (found === undefined) throw new Error(`nothing named ${name} stands on the screen`);
      return found;
    };
    const root = named('console') as Phaser.GameObjects.Container;
    const scene = window.game?.scene.getScene<ChronicleScene>('ui');
    if (scene === undefined) throw new Error('the ui scene is not running');
    return {
      save: window.localStorage.getItem(entry),
      chronicle: scene.chronicle,
      ringed: named('selected').getData('tile') as string | undefined,
      consoleOpen: root.visible,
      lines: root.list
        .filter((part) => part.type === 'Text')
        .map((part) => (part as Phaser.GameObjects.Text).text),
      fogMarks: (named('fog') as Phaser.GameObjects.Container).list.length,
      endTurn: (named('end-turn-label') as Phaser.GameObjects.Text).text,
    };
  }, SAVE_ENTRY);
  if (save === null) throw new Error('the game keeps no save');
  return { ...read, held: readSave(CATALOGUE, save).chronicle?.chronicle };
}

/** How far the map moved down the screen under a key held for a dozen frames. */
async function heldBy(page: Page, key: string): Promise<number> {
  const before = await tileOnScreen(page, BARE);
  await page.keyboard.down(key);
  for (let frame = 0; frame < 12; frame++) await rested(page);
  await page.keyboard.up(key);
  await rested(page);
  await rested(page);
  return (await tileOnScreen(page, BARE)).y - before.y;
}

test('the key above Tab opens the console, which then holds the keyboard', async ({ page }) => {
  const problems = watch(page);
  // No turn is played out; the budget covers the boot and the gestures held over a dozen frames.
  test.setTimeout(budget(1));

  await openSaved(page, settledOn(1));
  expect(await shows(page, 'console')).toBe(false);

  // The frame pans up under the pan key, so what stands on the map comes down the screen.
  expect(await heldBy(page, 'w')).toBeGreaterThan(40);

  await consoleKey(page);
  expect(await shows(page, 'console')).toBe(true);

  // The panel is not opaque, so the resource bar reads dimly through the top of it: no line the
  // console writes stands in that strip, whichever of the five it is and however full the history.
  const laid = await bandAndLines(page);
  expect(laid.highest).toBeGreaterThanOrEqual(laid.bar);

  // The key is the console's now: it types, and the map stands exactly where it was.
  expect(Math.abs(await heldBy(page, 'w'))).toBeLessThan(1);
  expect(await typedLine(page)).toBe('> w');

  await page.keyboard.press('Backspace');
  await rested(page);
  expect(await typedLine(page)).toBe('> ');

  await enter(page, 'sight');
  expect(await consoleLines(page)).toEqual(['', '', '> sight', 'no such entry: sight', '> ']);

  await consoleKey(page);
  expect(await shows(page, 'console')).toBe(false);
  // The key is the map's again; the frame pans down, so what stands on it goes up the screen.
  expect(await heldBy(page, 's')).toBeLessThan(-40);

  await consoleKey(page);
  expect(await shows(page, 'console')).toBe(true);
  await page.keyboard.press('Escape');
  await rested(page);
  expect(await shows(page, 'console')).toBe(false);

  expect(problems).toEqual([]);
});

test('the two switches draw the whole map, and put the fog back where it was', async ({ page }) => {
  const problems = watch(page);
  const stood = settledOn(1);
  const [guard] = enemiesOf(stood);
  const enemy = guard.tile;
  expect(stood.snapshots.map(tileKey)).not.toContain(tileKey(enemy));

  await openSaved(page, stood);

  const seen = inSight(CATALOGUE, stood);
  const fogged = stood.snapshots.filter((snapshot) => !seen.has(tileKey(snapshot))).length;
  expect(await chronicleOf(page)).toEqual(stood);
  expect(await standing(page, `tile-${tileKey(enemy)}`)).toBe(false);
  expect(await marksIn(page, 'terrain')).toBe(stood.snapshots.length);

  await consoleKey(page);
  await enter(page, 'uncharted');
  expect(await consoleLines(page)).toEqual(['', '', '> uncharted', 'uncharted veil: off', '> ']);
  await consoleKey(page);

  // Every tile of the disc is drawn now, and every one of them out of sight stands under a scrim.
  expect(await standing(page, `tile-${tileKey(enemy)}`)).toBe(true);
  expect(await marksIn(page, 'terrain')).toBe(stood.tiles.length);
  expect(await marksIn(page, 'fog')).toBe(stood.tiles.length - seen.size);

  await consoleKey(page);
  await enter(page, 'fog');
  expect(await typedLine(page)).toBe('> ');
  expect((await consoleLines(page))[3]).toBe('fog veil: off');
  await consoleKey(page);

  // Nothing is darkened any more, and every unit on the map stands as it is, the enemies included.
  expect(await marksIn(page, 'fog')).toBe(0);
  expect(await marksIn(page, 'units')).toBe(stood.units.length);

  await consoleKey(page);
  await enter(page, 'uncharted');
  await enter(page, 'fog');
  expect(await consoleLines(page)).toEqual([
    '> uncharted',
    'uncharted veil: on',
    '> fog',
    'fog veil: on',
    '> ',
  ]);
  await consoleKey(page);

  // Both veils back: the map draws what it has charted, and no more.
  expect(await standing(page, `tile-${tileKey(enemy)}`)).toBe(false);
  expect(await marksIn(page, 'terrain')).toBe(stood.snapshots.length);
  expect(await marksIn(page, 'fog')).toBe(fogged);

  expect(problems).toEqual([]);
});

test('the launch screen holds no switch, and seed with a number there opens the chronicle the rules launch on its choices and that seed, and closes the console', async ({
  page,
}) => {
  const problems = watch(page);
  const seed = 90210;
  const choices = openingChoices(CATALOGUE, freshCampaign(CATALOGUE));

  await openLaunch(page);
  await consoleKey(page);
  await enter(page, 'fog');
  expect(await consoleLines(page)).toEqual([
    '',
    '',
    '> fog',
    text('console.no-entry', { line: 'fog' }),
    '> ',
  ]);
  await enter(page, 'seed');
  expect(await consoleLines(page)).toEqual([
    '> fog',
    text('console.no-entry', { line: 'fog' }),
    '> seed',
    text('console.no-chronicle'),
    '> ',
  ]);

  await enter(page, `seed ${seed}`);
  await standsOnSeed(page, seed);
  const oracle = launchedAs(freshCampaign(CATALOGUE), choices, seed);
  expect(await chronicleOf(page)).toEqual(oracle);
  expect(await heldChronicle(page)).toEqual(oracle);
  expect(await shows(page, 'console')).toBe(false);
  expect(await consoleLines(page)).toEqual(CLEARED);

  expect(problems).toEqual([]);
});

test('seed on the chronicle screen answers the seed of the chronicle standing, and with another number launches on its choices and that seed', async ({
  page,
}) => {
  const problems = watch(page);
  const stood = settledOn(1);
  const other = -7;
  expect(other).not.toBe(stood.seed);

  await openSaved(page, stood);
  await consoleKey(page);
  await enter(page, 'seed');
  expect(await consoleLines(page)).toEqual([
    '',
    '',
    '> seed',
    text('console.seed', { seed: stood.seed }),
    '> ',
  ]);

  await enter(page, `seed ${other}`);
  await standsOnSeed(page, other);
  const oracle = launchedAs(freshCampaign(CATALOGUE), firstsOf(), other);
  expect(await chronicleOf(page)).toEqual(oracle);
  expect(await heldChronicle(page)).toEqual(oracle);
  expect(await shows(page, 'console')).toBe(false);
  expect(await consoleLines(page)).toEqual(CLEARED);

  await consoleKey(page);
  await enter(page, 'seed');
  expect((await consoleLines(page))[3]).toBe(text('console.seed', { seed: other }));

  expect(problems).toEqual([]);
});

test('unit on the chronicle screen enters the unit on the tile selected as the rules enter it and chart and read a command, says so, and play goes on with the console open, its lines and the veils standing', async ({
  page,
}) => {
  const problems = watch(page);
  const stood = settledOn(1, ['first-worker']);
  const city = cityTileOf(stood);
  const free = warriorGround(stood);
  const raider = ageOf(CATALOGUE, stood.age).camp.scripts.raider;
  const oracle = enteredOn(stood, { type: WARRIOR, tile: free, faction: 'enemy', script: raider });

  await openSaved(page, stood);
  await consoleKey(page);
  await enter(page, 'unit');
  expect((await consoleLines(page))[3]).toBe(text('console.unit-takes'));

  // The worker stands on the city's tile, and selected it lights the tiles it steps to: the press
  // beside the tiles lets it go before any of them is pressed.
  const cityAt = await tileOnScreen(page, city);
  await page.mouse.click(cityAt.x, cityAt.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  await enter(page, `unit ${WARRIOR}`);
  expect((await consoleLines(page))[3]).toBe(text('refusal.unit-standing'));

  const beside = await besideTiles(page);
  await page.mouse.click(beside.x, beside.y);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  await enter(page, `unit ${WARRIOR}`);
  expect((await consoleLines(page))[3]).toBe(text('console.no-tile-selected'));

  await enter(page, 'fog');
  const freeAt = await tileOnScreen(page, free);
  await page.mouse.click(freeAt.x, freeAt.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(free));
  await enter(page, `unit ${WARRIOR} ${raider}`);

  await expect.poll(() => playing(page)).toBe(false);
  expect(await enteredScreen(page)).toEqual({
    chronicle: oracle,
    held: oracle,
    ringed: undefined,
    consoleOpen: true,
    lines: [
      '> fog',
      text('console.fog-veil-off'),
      `> unit ${WARRIOR} ${raider}`,
      text('console.entered-enemy', { kind: WARRIOR, script: raider }),
      '> ',
    ],
    fogMarks: 0,
    endTurn: text('button.turn', { turn: oracle.turn }),
  });

  expect(problems).toEqual([]);
});

test('unit run while an end of turn plays out stands the screen on the chronicle the end of turn leaves, and enters the unit there', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const stood = settledOn(1);
  const turned = outcome(apply(CATALOGUE, stood, { type: 'end-turn' }));
  const free = warriorGround(turned);
  const oracle = enteredOn(turned, { type: WARRIOR, tile: free, faction: 'player' });
  const seen = inSight(CATALOGUE, oracle);
  const stands = {
    chronicle: oracle,
    held: oracle,
    ringed: undefined,
    consoleOpen: true,
    lines: ['', '', `> unit ${WARRIOR}`, text('console.entered', { kind: WARRIOR }), '> '],
    fogMarks: oracle.snapshots.filter((snapshot) => !seen.has(tileKey(snapshot))).length,
    endTurn: text('button.turn', { turn: oracle.turn }),
  };

  await openSaved(page, stood);
  await consoleKey(page);
  await page.keyboard.type(`unit ${WARRIOR}`);
  await click(page, 'end-turn');
  await expect.poll(() => playing(page)).toBe(true);
  const freeAt = await tileOnScreen(page, free);
  await page.mouse.click(freeAt.x, freeAt.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(free));
  expect(await playing(page)).toBe(true);
  await page.keyboard.press('Enter');

  await expect.poll(() => playing(page)).toBe(false);
  expect(await enteredScreen(page)).toEqual(stands);
  // Past what was left of the end of turn: nothing of it comes back over the screen.
  await waitGameClock(page, 3000);
  expect(await enteredScreen(page)).toEqual(stands);

  expect(problems).toEqual([]);
});

test('the campaign screen holds no entry: seed alone and with a number are answered no entry, and open no chronicle screen', async ({
  page,
}) => {
  const problems = watch(page);

  await readNames(page);
  await page.goto('/');
  await campaignShown(page);
  await consoleKey(page);
  await enter(page, 'seed');
  await enter(page, 'seed 3');
  expect(await consoleLines(page)).toEqual([
    '> seed',
    text('console.no-entry', { line: 'seed' }),
    '> seed 3',
    text('console.no-entry', { line: 'seed 3' }),
    '> ',
  ]);

  await rested(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await page.evaluate(() => window.game?.scene.isActive('campaign'))).toBe(true);

  expect(problems).toEqual([]);
});
