import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { apply, beginChronicle, type Chronicle, playable, refusalOf } from '../src/rules/chronicle';
import type { ChronicleScene } from '../src/ui/chronicle-scene';

/** How far up the card comes before the release plays it, in design units, and then some. */
const DRAG = 140;

type OnScreen = { x: number; y: number; unit: number };

/** The first seed whose second turn opens on a harvest card the city can pay for. */
function harvestSeed(): number {
  for (let seed = 1; seed <= 1000; seed++) {
    const chronicle = apply(beginChronicle(seed), { type: 'end-turn' });
    if (chronicle.hand.includes('PH_Harvest') && playable(refusalOf(chronicle, 'PH_Harvest'))) {
      return seed;
    }
  }
  throw new Error('no seed under a thousand opens its second turn on a playable harvest card');
}

function chronicleOf(page: Page): Promise<Chronicle> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    if (scene === undefined) throw new Error('the chronicle scene is not running');
    return scene.chronicle;
  });
}

/** Where a named object's centre sits on the page, and what one design unit measures there. */
function onScreen(page: Page, name: string): Promise<OnScreen> {
  return page.evaluate((target) => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    const object = scene?.children.getByName(target) as
      | (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.GetBounds)
      | null
      | undefined;
    if (scene === undefined || object === null || object === undefined) {
      throw new Error(`nothing named ${target} is on the table`);
    }

    // The camera converts canvas pixels into the design space; two points walk that backwards.
    const camera = scene.cameras.main;
    const origin = camera.getWorldPoint(0, 0);
    const stepped = camera.getWorldPoint(1, 1);
    const canvas = scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const unit = rect.width / canvas.width / (stepped.x - origin.x);
    const bounds = object.getBounds();
    return {
      x: rect.left + (bounds.centerX - origin.x) * unit,
      y: rect.top + (bounds.centerY - origin.y) * unit,
      unit,
    };
  }, name);
}

test('the harvest card gains its two food when it is dragged out of the hand', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page: ${error.message}`));

  await page.goto(`/?seed=${harvestSeed()}`);
  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);

  const endTurn = await onScreen(page, 'end-turn');
  await page.mouse.click(endTurn.x, endTurn.y);
  await page.waitForFunction(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.turn === 2,
  );

  const before = await chronicleOf(page);
  const index = before.hand.indexOf('PH_Harvest');
  const card = await onScreen(page, `hand-${index}`);

  await page.mouse.move(card.x, card.y);
  await page.mouse.down();
  await page.mouse.move(card.x, card.y - (DRAG / 2) * card.unit, { steps: 5 });
  await page.mouse.move(card.x, card.y - DRAG * card.unit, { steps: 5 });
  await page.mouse.up();

  await page.waitForFunction(
    (held) =>
      window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.hand.length === held,
    before.hand.length - 1,
  );

  const after = await chronicleOf(page);
  const harvests = (hand: readonly string[]): number =>
    hand.filter((id) => id === 'PH_Harvest').length;

  expect(after.resources.food).toBe(before.resources.food + 2);
  expect(harvests(after.hand)).toBe(harvests(before.hand) - 1);
  expect(problems).toEqual([]);
});
