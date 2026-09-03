import { expect, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { type CardId, DECKS, type DeckId } from '../src/rules/cards';
import {
  apply,
  beginChronicle,
  buildable,
  type Chronicle,
  outcome,
  playable,
  refusalOf,
} from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import type { PileKind } from '../src/ui/overlay';

declare global {
  interface Window {
    /**
     * The named object and the camera that paints it, wherever on the table it stands. The scene's
     * own display list carries only the two layers, so `children.getByName` finds nothing, and a
     * name may sit any depth down inside a container.
     */
    named?: (
      name: string,
    ) =>
      | { object: Phaser.GameObjects.GameObject; camera: Phaser.Cameras.Scene2D.Camera }
      | undefined;
    /** How many objects of that name stand on the table: a repainted table leaves no second one. */
    counted?: (name: string) => number;
  }
}

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
  await page.addInitScript(() => {
    const within = (
      list: Phaser.GameObjects.GameObject[],
      name: string,
      found: Phaser.GameObjects.GameObject[],
    ): Phaser.GameObjects.GameObject[] => {
      for (const child of list) {
        if (child.name === name) found.push(child);
        const inside = (child as Phaser.GameObjects.Container).list;
        if (Array.isArray(inside)) within(inside, name, found);
      }
      return found;
    };

    const layers = (): Phaser.GameObjects.Layer[] => {
      const scene = window.game?.scene.getScene('chronicle');
      if (scene === null || scene === undefined) return [];
      return scene.children.list.filter(
        (child) => child.type === 'Layer',
      ) as Phaser.GameObjects.Layer[];
    };

    window.named = (name) => {
      for (const layer of layers()) {
        const object = within(layer.list, name, [])[0];
        const camera = layer.scene.cameras.getCamera(layer.name);
        if (object === undefined || camera === null) continue;
        return { object, camera };
      }
      return undefined;
    };

    window.counted = (name) =>
      layers().reduce((total, layer) => total + within(layer.list, name, []).length, 0);
  });
  await page.goto(`/?seed=${seed}&deck=${typeof deck === 'string' ? deck : deck.join(',')}`);
  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);
  await settled(page);
}

/** Waits for a drawn frame, so a camera moved since answers for where it now stands. */
export function settled(page: Page): Promise<void> {
  return page.evaluate(
    () =>
      new Promise<void>((done) => {
        requestAnimationFrame(() => requestAnimationFrame(() => done()));
      }),
  );
}

export function chronicleOf(page: Page): Promise<Chronicle> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    if (scene === undefined) throw new Error('the chronicle scene is not running');
    return scene.chronicle;
  });
}

/** Whether the end of turn is still playing out its stages. */
export function playing(page: Page): Promise<boolean> {
  return page.evaluate(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').playing === true,
  );
}

export function onScreen(page: Page, name: string): Promise<OnScreen> {
  return page.evaluate((target) => {
    const found = window.named?.(target);
    if (found === undefined) throw new Error(`nothing named ${target} is on the table`);
    const object = found.object as Phaser.GameObjects.GameObject &
      Phaser.GameObjects.Components.GetBounds;

    // The camera converts canvas pixels into its own surface; two points walk that backwards.
    const camera = found.camera;
    const origin = camera.getWorldPoint(0, 0);
    const stepped = camera.getWorldPoint(1, 1);
    const canvas = camera.scene.game.canvas;
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

/**
 * A point on the bare page above the canvas, which a window taller than the design's ratio leaves
 * letterboxed; the pointer is off the game there, and a press released there lands outside it.
 */
export async function offCanvas(page: Page): Promise<{ x: number; y: number }> {
  const band = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top - 20, room: rect.top };
  });
  if (band.room < 40) throw new Error('the window leaves no bare page above the canvas');
  return { x: band.x, y: band.y };
}

/** Whether an object of that name stands on the table. */
export function onTable(page: Page, name: string): Promise<boolean> {
  return page.evaluate((target) => window.named?.(target) !== undefined, name);
}

/** How many objects of that name stand on the table: one the table still paints, plus any left over. */
export function counted(page: Page, name: string): Promise<number> {
  return page.evaluate((target) => {
    if (window.counted === undefined) throw new Error('no chronicle was opened on this page');
    return window.counted(target);
  }, name);
}

/** How far the browse's grid stands scrolled, and how far it can: the grid scrolls by its own `y`. */
export function scrolled(page: Page): Promise<{ offset: number; overflow: number }> {
  return page.evaluate(() => {
    const grid = window.named?.('browse')?.object as Phaser.GameObjects.Container | undefined;
    if (grid === undefined) throw new Error('no browse is open');
    return { offset: -grid.y, overflow: grid.getData('overflow') as number };
  });
}

/** A chronicle whose turn `turn` can enter a worker, march it onto `tile` and build a farm there. */
export type Run = { readonly seed: number; readonly turn: number; readonly tile: TileCoords };

export function farmRun(): Run {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const tile = farmedThisTurn(chronicle);
      if (tile !== undefined) return { seed, turn, tile };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
  }
  throw new Error('no seed under a thousand opens a turn on a worker, a march and a farm');
}

/** Where the farm lands when this hand plays its worker, its march and its farm in that order. */
function farmedThisTurn(chronicle: Chronicle): TileCoords | undefined {
  const enter = chronicle.hand.indexOf('PH_Worker');
  if (enter === -1 || !playable(refusalOf(chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(chronicle, { type: 'play', index: enter }));

  const march = entered.hand.indexOf('PH_March');
  if (march === -1 || !entered.hand.includes('PH_Farm')) return undefined;

  for (const tile of neighbours(entered.city)) {
    const moved = outcome(
      apply(entered, {
        type: 'play',
        index: march,
        target: { type: 'unit-tile', unit: 0, tile },
      }),
    );
    if (moved === entered || !playable(refusalOf(moved, 'PH_Farm'))) continue;
    if (buildable(moved, 'PH_Farm').some((coord) => tileKey(coord) === tileKey(tile))) return tile;
  }
  return undefined;
}

/** Waits for the armed card to lay its catcher over the map, which the press that aims lands on. */
export async function aimed(page: Page): Promise<void> {
  await page.waitForFunction(() => window.named?.('aim') !== undefined);
}

/** Which layer the infopanel is reading, or nothing while it is dismissed. */
export function shownLayer(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const panel = window.named?.('infopanel')?.object as Phaser.GameObjects.Container | undefined;
    if (panel === undefined) throw new Error('the infopanel is not on the table');
    return panel.visible ? (panel.getData('layer') as string) : undefined;
  });
}

/** Whether the named bubble stands; there is one per surface, named after it. */
export function tooltipUp(page: Page, name: string): Promise<boolean> {
  return page.evaluate((target) => {
    const bubble = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (bubble === undefined) throw new Error(`there is no ${target}`);
    return bubble.visible;
  }, name);
}

/** What the end-turn button reads right now: the turn it stands on, or the hover's own word. */
export function endTurnLabel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const label = window.named?.('end-turn-label')?.object as Phaser.GameObjects.Text | undefined;
    if (label === undefined) throw new Error('the end-turn button is not on the table');
    return label.text;
  });
}

/** Which tile the map is ringing, or nothing while none is selected. */
export function ringedTile(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const ring = window.named?.('inspected')?.object;
    if (ring === undefined) throw new Error('the ring is not on the table');
    return ring.getData('tile') as string | undefined;
  });
}

export function offsetOf(page: Page): Promise<number> {
  return scrolled(page).then(({ offset }) => offset);
}

/** Opens a pile's browse, and waits for its cards to be laid out. */
export async function browse(page: Page, pile: PileKind): Promise<void> {
  const at = await onScreen(page, pile);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => onTable(page, 'browse')).toBe(true);
}

/** Wheels over the browse's frame, from the middle of it. */
export async function wheel(page: Page, by: number): Promise<void> {
  const frame = await onScreen(page, 'browse-frame');
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.wheel(0, by);
}

/**
 * Waits for the table to have played out whatever the last gesture handed it, first giving that
 * gesture a frame to reach the scene: the hand and the button are dead for the length of a play-out,
 * so a spec that presses either of them straight after would press nothing.
 */
export async function playedOut(page: Page): Promise<void> {
  await settled(page);
  await page.waitForFunction(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').playing === false,
  );
}

/**
 * The gesture that takes a card out of the hand; what the release does is the card's kind. A card
 * that plays at nothing is played out here and now; one that takes a target is left armed, and its
 * play-out waits on the aim.
 */
export async function dragOut(page: Page, index: number): Promise<void> {
  const card = await onScreen(page, `hand-${index}`);
  await page.mouse.move(card.x, card.y);
  await page.mouse.down();
  await page.mouse.move(card.x, card.y - (DRAG / 2) * card.unit, { steps: 5 });
  await page.mouse.move(card.x, card.y - DRAG * card.unit, { steps: 5 });
  await page.mouse.up();
  await playedOut(page);
}

/**
 * Ends the turn on the button, and waits for the end of turn to finish playing out — the next turn
 * open, or the chronicle ended. The turn moves on partway through the sequence, so both hold before
 * the hand it deals is on the table.
 */
export async function endTurn(page: Page): Promise<void> {
  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  await page.mouse.click(button.x, button.y);
  await page.waitForFunction((next) => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    if (scene === null || scene === undefined || scene.playing) return false;
    return scene.chronicle.turn === next || scene.chronicle.defeat !== undefined;
  }, turn + 1);
}
