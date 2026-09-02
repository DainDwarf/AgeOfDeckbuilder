import type { Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { CardId, DeckId } from '../src/rules/cards';
import type { Chronicle } from '../src/rules/chronicle';
import type { ChronicleScene } from '../src/ui/chronicle-scene';

/** How far up a card comes before the release plays or arms it, in design units, and then some. */
const DRAG = 140;

/** Where a named object's centre sits on the page, and what one design unit measures there. */
export type OnScreen = { x: number; y: number; unit: number };

/** Everything the run logged that it should not have; a clean run leaves it empty. */
export function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page: ${error.message}`));
  return problems;
}

/** Opens the chronicle a seed and a deck found, and waits for its scene to run. */
export async function open(
  page: Page,
  seed: number,
  deck: DeckId | readonly CardId[],
): Promise<void> {
  await page.goto(`/?seed=${seed}&deck=${typeof deck === 'string' ? deck : deck.join(',')}`);
  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);
}

export function chronicleOf(page: Page): Promise<Chronicle> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    if (scene === undefined) throw new Error('the chronicle scene is not running');
    return scene.chronicle;
  });
}

export function onScreen(page: Page, name: string): Promise<OnScreen> {
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

/** The gesture that takes a card out of the hand; what the release does is the card's kind. */
export async function dragOut(page: Page, index: number): Promise<void> {
  const card = await onScreen(page, `hand-${index}`);
  await page.mouse.move(card.x, card.y);
  await page.mouse.down();
  await page.mouse.move(card.x, card.y - (DRAG / 2) * card.unit, { steps: 5 });
  await page.mouse.move(card.x, card.y - DRAG * card.unit, { steps: 5 });
  await page.mouse.up();
}

/** Ends the turn on the button, and waits for the next one to open — or for the chronicle to end. */
export async function endTurn(page: Page): Promise<void> {
  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  await page.mouse.click(button.x, button.y);
  await page.waitForFunction((next) => {
    const current = window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle;
    return current?.turn === next || current?.defeat !== undefined;
  }, turn + 1);
}
