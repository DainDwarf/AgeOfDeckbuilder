import { expect, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { type AimedCard, CARDS, DECKS, type DeckId } from '../src/rules/cards';
import {
  admitted,
  apply,
  beginChronicle,
  outcome,
  playable,
  refusalOf,
} from '../src/rules/chronicle';
import {
  CITY_TILE,
  neighbours,
  type River,
  riversAlong,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  tileYield,
} from '../src/rules/map';
import { RESOURCES, type Resource } from '../src/rules/resources';
import type { CardId, Chronicle } from '../src/rules/state';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import type { PileKind } from '../src/ui/overlay';

declare global {
  interface Window {
    /**
     * The named object and the camera that paints it, wherever on the chronicle screen it stands.
     * The scene's own display list carries only the two layers, so `children.getByName` finds
     * nothing, and a name may sit any depth down inside a container.
     */
    named?: (
      name: string,
    ) =>
      | { object: Phaser.GameObjects.GameObject; camera: Phaser.Cameras.Scene2D.Camera }
      | undefined;
    /** How many objects of that name stand on the chronicle screen: a repaint leaves no second one. */
    counted?: (name: string) => number;
  }
}

/** How far up a card comes before the release plays it or aims it, in design units, and then some. */
const DRAG = 140;

/** What the dev server's first transform costs the spec that opens on it, and then some. */
const COLD_START_MS = 10_000;

/** What one end of turn takes with every stage of it played out, and then some. */
const TURN_MS = 10_000;

/**
 * How long a spec may take, in milliseconds: `turns` counts every end of turn it plays out, and a
 * gesture whose release plays out stages of its own counts as one more.
 */
export function budget(turns: number): number {
  return COLD_START_MS + TURN_MS * turns;
}

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
    if (found === undefined) throw new Error(`nothing named ${target} is on the chronicle screen`);
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
 * Where a tile's face stands on the page, whether the map draws it or not: the map lays its tiles on
 * two axes, and the city's own face with the two beside it — always in sight — give both. Where a
 * spec presses for a tile the map may be drawing nothing of, a press that lands off the map.
 */
export async function tileOnScreen(page: Page, coord: TileCoords): Promise<OnScreen> {
  const origin = await onScreen(page, `tile-${tileKey(CITY_TILE)}`);
  const alongQ = await onScreen(page, `tile-${tileKey({ q: CITY_TILE.q + 1, r: CITY_TILE.r })}`);
  const alongR = await onScreen(page, `tile-${tileKey({ q: CITY_TILE.q, r: CITY_TILE.r + 1 })}`);
  const q = coord.q - CITY_TILE.q;
  const r = coord.r - CITY_TILE.r;
  return {
    x: origin.x + q * (alongQ.x - origin.x) + r * (alongR.x - origin.x),
    y: origin.y + q * (alongQ.y - origin.y) + r * (alongR.y - origin.y),
    unit: origin.unit,
  };
}

/**
 * A point beside the tiles: up and left of the city, inside the map's frame, which starts under the
 * resource bar, and far enough out for the nearest tile to be well outside the map's disc.
 */
export async function besideTiles(page: Page): Promise<{ x: number; y: number }> {
  const city = await onScreen(page, `tile-${tileKey(CITY_TILE)}`);
  return { x: city.x - 440 * city.unit, y: city.y - 160 * city.unit };
}

/** A rectangle on the page. */
export type Frame = { x: number; y: number; width: number; height: number };

/** Where the map's frame stands on the page: the rectangle its camera is cropped to. */
export function mapFrame(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const camera = window.game?.scene.getScene('chronicle')?.cameras.getCamera('map');
    if (camera === null || camera === undefined) throw new Error('the map camera is not running');
    // A camera's viewport is measured in the backing store the canvas is drawn scaled down from.
    const canvas = camera.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const unit = rect.width / canvas.width;
    return {
      x: rect.left + camera.x * unit,
      y: rect.top + camera.y * unit,
      width: camera.width * unit,
      height: camera.height * unit,
    };
  });
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

/** Whether an object of that name stands on the chronicle screen. */
export function standing(page: Page, name: string): Promise<boolean> {
  return page.evaluate((target) => window.named?.(target) !== undefined, name);
}

/** Whether the named object is shown; what a mode raises stands there hidden while it is off. */
export function shows(page: Page, name: string): Promise<boolean> {
  return page.evaluate((target) => {
    const found = window.named?.(target)?.object as
      | (Phaser.GameObjects.GameObject & { visible: boolean })
      | undefined;
    if (found === undefined) throw new Error(`there is no ${target}`);
    return found.visible;
  }, name);
}

/** How many objects of that name stand on the chronicle screen: one still painted, plus any left over. */
export function counted(page: Page, name: string): Promise<number> {
  return page.evaluate((target) => {
    if (window.counted === undefined) throw new Error('no chronicle was opened on this page');
    return window.counted(target);
  }, name);
}

/** How many marks the named container of the map is showing. */
export function marksIn(page: Page, name: string): Promise<number> {
  return page.evaluate((target) => {
    const container = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (container === undefined) throw new Error(`there is no ${target} on the chronicle screen`);
    return container.list.length;
  }, name);
}

/** How many yield glyphs of each resource: what the map shows, or what a set of tiles is owed. */
export type Glyphs = Record<Resource, number>;

export function noGlyphs(): Glyphs {
  return Object.fromEntries(RESOURCES.map((resource) => [resource, 0])) as Glyphs;
}

/** How many yield glyphs of each resource stand on the map. */
export async function glyphs(page: Page): Promise<Glyphs> {
  const shown = noGlyphs();
  for (const resource of RESOURCES) shown[resource] = await counted(page, `yield-${resource}`);
  return shown;
}

/**
 * Every face the map draws of a chronicle: the tile a snapshot holds is the tile itself while it is
 * in sight, and the tile as it was last seen once it is not.
 */
export function drawnFaces(chronicle: Chronicle): Tile[] {
  return chronicle.snapshots.map((snapshot) => snapshot.tile);
}

/** How many glyphs each resource is owed for these faces: one for every point they yield of it. */
export function glyphsOf(faces: readonly Tile[], rivers: readonly River[]): Glyphs {
  const owed = noGlyphs();
  for (const face of faces) {
    const yields = tileYield(face, rivers);
    for (const resource of RESOURCES) owed[resource] += yields[resource] ?? 0;
  }
  return owed;
}

/** How far the browse's grid stands scrolled, and how far it can: the grid scrolls by its own `y`. */
export function scrolled(page: Page): Promise<{ offset: number; overflow: number }> {
  return page.evaluate(() => {
    const grid = window.named?.('browse')?.object as Phaser.GameObjects.Container | undefined;
    if (grid === undefined) throw new Error('no browse is open');
    return { offset: -grid.y, overflow: grid.getData('overflow') as number };
  });
}

/** How many pieces of river the map draws on a chronicle: one for each run along a tile it charted. */
export function riverRuns(chronicle: Chronicle): number {
  return riversAlong(chronicle.rivers, new Set(chronicle.snapshots.map(tileKey))).length;
}

/**
 * What the first seed of one to a thousand answers; the complaint tails `no seed under a thousand`
 * in the throw when none of them answers at all.
 */
export function firstSeed<T>(complaint: string, answer: (seed: number) => T | undefined): T {
  for (let seed = 1; seed <= 1000; seed++) {
    const found = answer(seed);
    if (found !== undefined) return found;
  }
  throw new Error(`no seed under a thousand ${complaint}`);
}

/** A chronicle whose turn `turn` can enter a worker, move it onto `tile` and play a card there. */
export type Run = { readonly seed: number; readonly turn: number; readonly tile: TileCoords };

/**
 * The first seed with a turn in its first eight that opens on such a run, for a card the city can
 * pay for; `on` narrows which run counts — the tile the unit lands on, and the chronicle it lands
 * in — for a spec that needs a particular layer standing on that tile, or the generator to have
 * left another one clear.
 */
export function workerRun(
  card: CardId,
  on: (tile: Tile, chronicle: Chronicle) => boolean = () => true,
): Run {
  return runOn(
    card,
    `opens a turn on a worker, a move and ${card}`,
    (tile, chronicle) => playable(refusalOf(chronicle, card)) && on(tile, chronicle),
  );
}

/** The same run for a card the city cannot pay for: what a play it has no cost for is aimed at. */
export function unaffordableRun(card: CardId): Run {
  return runOn(
    card,
    `opens a turn on a worker, a move and ${card} unpaid for`,
    (_, chronicle) => !playable(refusalOf(chronicle, card)),
  );
}

function runOn(
  card: CardId,
  complaint: string,
  keeps: (tile: Tile, chronicle: Chronicle) => boolean,
): Run {
  const aimed = CARDS[card];
  if (aimed.aim !== 'tile') throw new Error(`${card} is aimed at no tile`);

  return firstSeed(complaint, (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const tile = workedThisTurn(chronicle, card, aimed, keeps);
      if (tile !== undefined) return { seed, turn, tile };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    return undefined;
  });
}

/** Where a card aimed at a tile that the city can pay for lies in the hand, or -1. */
export function atTile(chronicle: Chronicle): number {
  return chronicle.hand.findIndex(
    (id) => CARDS[id].aim === 'tile' && playable(refusalOf(chronicle, id)),
  );
}

/** The first seed with a turn in its first eight that opens on such a card. */
export function atTileRun(): { seed: number; turn: number } {
  return firstSeed('opens a turn on a card aimed at a tile the city can pay for', (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      if (atTile(chronicle) !== -1) return { seed, turn };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    return undefined;
  });
}

/** The first seed whose city is captured inside twenty turns of ending the turn and nothing else. */
export function fallRun(): { seed: number; turns: number } {
  return firstSeed('is captured inside twenty turns', (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turns = 1; turns <= 20 && chronicle.defeat === undefined; turns++) {
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
      if (chronicle.defeat?.cause === 'capture') return { seed, turns };
    }
    return undefined;
  });
}

/**
 * Where the card lands when this hand plays its worker, moves it one tile by hand and then aims
 * the card there, in that order. The worker has to be the only unit on the map, so every spec built
 * on the run finds it first in `units`, and the chronicle has dealt it the first number of all: one.
 */
function workedThisTurn(
  chronicle: Chronicle,
  card: CardId,
  aimed: AimedCard,
  keeps: (tile: Tile, chronicle: Chronicle) => boolean,
): TileCoords | undefined {
  const enter = chronicle.hand.indexOf('PH_Worker');
  if (enter === -1 || !playable(refusalOf(chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(chronicle, { type: 'play', index: enter, aim: 'none' }));
  if (entered.units.length !== 1 || !entered.hand.includes(card)) return undefined;

  for (const tile of neighbours(entered.city)) {
    const moved = outcome(apply(entered, { type: 'move', unit: 1, tile }));
    if (moved === entered) continue;
    const standing = tileAt(moved.tiles, tile);
    if (standing === undefined || !keeps(standing, moved)) continue;
    if (admitted(moved, aimed).some((coord) => tileKey(coord) === tileKey(tile))) return tile;
  }
  return undefined;
}

/** Waits for the card being aimed to lay its catcher over the map, which a press aims on. */
export async function aimed(page: Page): Promise<void> {
  await page.waitForFunction(() => window.named?.('aim') !== undefined);
}

/**
 * What the card the infopanel is standing reads, in the order it was drawn: its texts, and every
 * yield chip by the resource it is named for.
 */
export function panelLines(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const panel = window.named?.('infopanel')?.object as Phaser.GameObjects.Container | undefined;
    if (panel === undefined) throw new Error('the infopanel is not on the chronicle screen');
    return panel.list
      .filter((object) => object.type === 'Container')
      .flatMap((card) =>
        (card as Phaser.GameObjects.Container).list
          .filter((part) => part.type === 'Text' || part.name.startsWith('panel-yield-'))
          .map((part) =>
            part.type === 'Text' ? (part as Phaser.GameObjects.Text).text : part.name,
          ),
      );
  });
}

/** Which card of the tile the infopanel is showing, or nothing while it stands down. */
export function shownCard(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const panel = window.named?.('infopanel')?.object as Phaser.GameObjects.Container | undefined;
    if (panel === undefined) throw new Error('the infopanel is not on the chronicle screen');
    return panel.visible ? (panel.getData('card') as string) : undefined;
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

/** What the refusal note says, line by line, or nothing while none stands. */
export function refusalLines(page: Page): Promise<string[] | undefined> {
  return page.evaluate(() => {
    const note = window.named?.('refusal')?.object as Phaser.GameObjects.Container | undefined;
    if (note === undefined) return undefined;
    return note.list
      .filter((line) => line.type === 'Text')
      .map((line) => (line as Phaser.GameObjects.Text).text);
  });
}

/** What the end-turn button reads right now: the turn it stands on, or the hover's own word. */
export function endTurnLabel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const label = window.named?.('end-turn-label')?.object as Phaser.GameObjects.Text | undefined;
    if (label === undefined) throw new Error('the end-turn button is not on the chronicle screen');
    return label.text;
  });
}

/** Which tile the map is ringing, or nothing while none is selected. */
export function ringedTile(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const ring = window.named?.('selected')?.object;
    if (ring === undefined) throw new Error('the ring is not on the chronicle screen');
    return ring.getData('tile') as string | undefined;
  });
}

export function offsetOf(page: Page): Promise<number> {
  return scrolled(page).then(({ offset }) => offset);
}

/** The key above Tab, pressed by its place: the console opens under it, and closes again. */
export async function consoleKey(page: Page): Promise<void> {
  await page.keyboard.press('Backquote');
  await settled(page);
}

/** One entry run at the open console, and the map redrawn under whatever it changed. */
export async function enter(page: Page, line: string): Promise<void> {
  await page.keyboard.type(line);
  await page.keyboard.press('Enter');
  await settled(page);
}

/** Clicks the named object where it stands on the page. */
export async function click(page: Page, name: string): Promise<void> {
  const at = await onScreen(page, name);
  await page.mouse.click(at.x, at.y);
}

/** Opens a pile's browse, and waits for its cards to be laid out. */
export async function browse(page: Page, pile: PileKind): Promise<void> {
  await click(page, pile);
  await expect.poll(() => standing(page, 'browse')).toBe(true);
}

/** Wheels over the browse's frame, from the middle of it. */
export async function wheel(page: Page, by: number): Promise<void> {
  const frame = await onScreen(page, 'browse-frame');
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.wheel(0, by);
}

/**
 * Waits for the chronicle screen to have played out whatever the last gesture handed it, first
 * giving that gesture a frame to reach the scene: the hand and the button are dead for the length
 * of a play-out, so a spec that presses either of them straight after would press nothing.
 */
export async function playedOut(page: Page): Promise<void> {
  await settled(page);
  await page.waitForFunction(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').playing === false,
  );
}

/**
 * The gesture that takes a card out of the hand; what the release does is the card's kind. A card
 * that plays at nothing is played out here and now; one that aims at a tile is left selected and
 * being aimed, one aimed at the discard pile raises its window, and their play-out waits on the aim.
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
 * The gesture that commands a unit by hand: the press takes hold of it on the tile it stands on and
 * lets it go on another, and whatever that release commands plays out from there.
 */
export async function dragTiles(page: Page, from: TileCoords, to: TileCoords): Promise<void> {
  const held = await onScreen(page, `tile-${tileKey(from)}`);
  const landing = await onScreen(page, `tile-${tileKey(to)}`);
  await page.mouse.move(held.x, held.y);
  await page.mouse.down();
  await page.mouse.move((held.x + landing.x) / 2, (held.y + landing.y) / 2, { steps: 5 });
  await page.mouse.move(landing.x, landing.y, { steps: 5 });
  await page.mouse.up();
  await playedOut(page);
}

/** The same gesture onto a tile the unit lands on, waited out until it stands there. */
export async function dragUnit(page: Page, from: TileCoords, to: TileCoords): Promise<void> {
  await dragTiles(page, from, to);
  await page.waitForFunction((on) => {
    const chronicle = window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle;
    return chronicle?.units.some((unit) => unit.tile.q === on.q && unit.tile.r === on.r) === true;
  }, to);
}

/**
 * Ends the turn on the button, and waits for the end of turn to finish playing out — the next turn
 * open, or the chronicle ended. The turn moves on partway through the sequence, so both hold before
 * the hand it deals is on the chronicle screen.
 */
export async function endTurn(page: Page): Promise<void> {
  const { turn } = await chronicleOf(page);
  await click(page, 'end-turn');
  await page.waitForFunction((next) => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    if (scene === null || scene === undefined || scene.playing) return false;
    return scene.chronicle.turn === next || scene.chronicle.defeat !== undefined;
  }, turn + 1);
}

/**
 * Whether the card at this place in the hand stands lifted out of the lane with nothing under the
 * pointer: the lift a hover gives it is gone, so the one it keeps is the selection's.
 */
export async function selected(page: Page, index: number, home: OnScreen): Promise<boolean> {
  const beside = await onScreen(page, `hand-${index === 0 ? 1 : index - 1}`);
  await page.mouse.move(beside.x, beside.y - 200 * beside.unit);
  await settled(page);
  const now = await onScreen(page, `hand-${index}`);
  return now.y < home.y;
}
