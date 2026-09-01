import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { apply, beginChronicle, playable, refusalOf } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { chronicleOf, dragOut, endTurn, onScreen, open, watch } from './table';

/** The first seed with a turn in its first eight that opens on a worker the city can pay for. */
function workerRun(): { seed: number; turn: number } {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed);
    for (let turn = 1; turn <= 8; turn++) {
      if (chronicle.hand.includes('PH_Worker') && playable(refusalOf(chronicle, 'PH_Worker'))) {
        return { seed, turn };
      }
      chronicle = apply(chronicle, { type: 'end-turn' });
    }
  }
  throw new Error('no seed under a thousand opens a turn on a playable worker');
}

/** Which layer the infopanel is reading, or nothing while it is dismissed. */
function shownLayer(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    const panel = scene?.children.getByName('infopanel') as
      | Phaser.GameObjects.Container
      | null
      | undefined;
    if (panel === null || panel === undefined) throw new Error('the infopanel is not on the table');
    return panel.visible ? (panel.getData('layer') as string) : undefined;
  });
}

test('clicking a tile cycles the infopanel through its layers, and clicking off the map dismisses it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun();

  await open(page, run.seed);
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await page.waitForFunction(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.units.length === 1,
  );

  const entered = await chronicleOf(page);
  const city = await onScreen(page, `tile-${tileKey(entered.units[0].tile)}`);
  expect(await shownLayer(page)).toBeUndefined();

  // The city's tile carries all three layers: the worker that just entered, the city, the terrain.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('unit');
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('building');
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('unit');

  // West of the city: nothing stands on it, and it is clear of the panel standing east of the city.
  const { q, r } = entered.units[0].tile;
  const bare = await onScreen(page, `tile-${tileKey({ q: q - 1, r })}`);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => shownLayer(page)).toBe('terrain');

  // Far enough up and left of the city for the nearest tile to be well outside the map's disc.
  await page.mouse.click(city.x - 440 * city.unit, city.y - 260 * city.unit);
  await expect.poll(() => shownLayer(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
