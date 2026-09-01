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

function panelShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    const panel = scene?.children.getByName('unit-panel') as
      | Phaser.GameObjects.Container
      | null
      | undefined;
    if (panel === null || panel === undefined)
      throw new Error('the unit panel is not on the table');
    return panel.visible;
  });
}

test('clicking a unit shows its panel, and clicking off the map dismisses it', async ({ page }) => {
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
  expect(await panelShown(page)).toBe(false);

  await page.mouse.click(city.x, city.y);
  expect(await panelShown(page)).toBe(true);

  // Far enough up and left of the city for the nearest tile to be well outside the map's disc.
  await page.mouse.click(city.x - 440 * city.unit, city.y - 260 * city.unit);
  expect(await panelShown(page)).toBe(false);

  expect(problems).toEqual([]);
});
