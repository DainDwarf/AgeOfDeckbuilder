import { expect, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { STAND_IN, STAND_IN_REGION, STAND_IN_SCHEDULE } from '../src/content/stand-in';
import { aimOf } from '../src/rules/cards';
import { type AimedCard, cardOf, type Deck, deckOf } from '../src/rules/catalogue';
import { admitted, apply, launched, outcome, refusalOf } from '../src/rules/chronicle';
import {
  CENTRE,
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
import { type CardId, type Chronicle, playable } from '../src/rules/state';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import type { PileKind } from '../src/ui/overlay';

declare global {
  interface Window {
    /**
     * The named object and the camera that paints it, on whichever running scene it stands. A
     * scene's own display list carries only the two layers, so `children.getByName` finds nothing,
     * and a name may sit any depth down inside a container.
     */
    named?: (
      name: string,
    ) =>
      | { object: Phaser.GameObjects.GameObject; camera: Phaser.Cameras.Scene2D.Camera }
      | undefined;
    /** How many objects of that name stand on the running scenes: a repaint leaves no second one. */
    counted?: (name: string) => number;
  }
}

/**
 * What the city holds when turn 0 ends: the six tiles around it claimed by the settle section's free
 * claims, or its own tile alone.
 */
export type Border = 'ring' | 'bare';

/**
 * The chronicle the screen opens on a seed, a deck and a schedule, launched exactly as the boot
 * launches it — on the schedule the boot takes when the address names none, unless one is given —
 * and settled exactly as `open` settles it: the first card of the hand played on the centre tile, or
 * on the tile given, the free claims played on the six tiles around it unless the city is asked for
 * bare, and turn 0 ended, a deal turn 1 stops on left standing.
 */
export function launch(
  seed: number,
  deck: Deck,
  schedule: string = STAND_IN_SCHEDULE,
  at: TileCoords = CENTRE,
  border: Border = 'ring',
): Chronicle {
  const opened = launched(STAND_IN, STAND_IN_REGION, schedule, seed, deck);
  let settling = outcome(
    apply(STAND_IN, opened, { type: 'play', index: 0, aim: 'tile', tile: at }),
  );
  if (settling.city === undefined)
    throw new Error(`seed ${seed} settles no city on ${tileKey(at)}`);
  switch (border) {
    case 'ring':
      for (const tile of neighbours(at)) {
        const claimed = outcome(
          apply(STAND_IN, settling, { type: 'play', index: 0, aim: 'tile', tile }),
        );
        if (claimed.held.length === settling.held.length)
          throw new Error(`seed ${seed} claims no ${tileKey(tile)} beside its city`);
        settling = claimed;
      }
      break;
    case 'bare':
      break;
  }
  return outcome(apply(STAND_IN, settling, { type: 'end-turn' }));
}

/** The tile the city stands on, for a spec whose chronicle has settled it. */
export function cityTileOf(chronicle: Chronicle): TileCoords {
  if (chronicle.city === undefined) throw new Error('the city of this chronicle stands nowhere');
  return chronicle.city;
}

/** How far up a card comes before the release plays it or aims it, in design units, and then some. */
const DRAG = 140;

/** What the dev server's first transform costs the spec that opens on it, and then some. */
const COLD_START_MS = 10_000;

/** What one end of turn takes with every stage of it played out, and then some. */
const TURN_MS = 10_000;

/**
 * How long a spec may take, in milliseconds: `turns` counts every end of turn it plays out past the
 * settle's, which is counted here, and a gesture whose release plays out stages of its own counts as
 * one more.
 */
export function budget(turns: number): number {
  return COLD_START_MS + TURN_MS * (turns + 1);
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

/**
 * Opens the chronicle a seed, a deck and a schedule found, waits for its scene to run, closes the
 * capstone's window every chronicle opens on, and settles on the centre tile or the tile given, its
 * city holding the border asked for: turn 1 open on the chronicle screen, or the deal it stops on
 * standing. The card and not the back key closes the window: that key is rebindable, and specs
 * rebind it.
 */
export async function open(
  page: Page,
  seed: number,
  deck: string,
  schedule: string = STAND_IN_SCHEDULE,
  at: TileCoords = CENTRE,
  border: Border = 'ring',
): Promise<void> {
  await openOnCapstone(page, seed, deck, schedule);
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);
  await settle(page, at, border);
}

/**
 * The settle as a player makes it on turn 0: the first card of the hand dragged out, the centre
 * tile or the tile given pressed, the free claims played on the six tiles around the city unless it
 * is asked for bare, and the turn ended.
 */
export async function settle(
  page: Page,
  at: TileCoords = CENTRE,
  border: Border = 'ring',
): Promise<void> {
  await dragOut(page, 0);
  await aimed(page);
  await click(page, `tile-${tileKey(at)}`);
  await playedOut(page);
  await page.waitForFunction(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.city !== undefined,
  );
  switch (border) {
    case 'ring':
      for (const tile of neighbours(at)) await claimFree(page, tile);
      break;
    case 'bare':
      break;
  }
  await stoppedTurn(page);
}

/**
 * A free claim as a player plays it on turn 0: the first card of the hand selected, then the tile
 * pressed, waited out until the city holds one tile more.
 */
async function claimFree(page: Page, tile: TileCoords): Promise<void> {
  const { held } = await chronicleOf(page);
  await click(page, 'hand-0');
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);
  await page.waitForFunction(
    (count) =>
      window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.held.length === count,
    held.length + 1,
  );
}

/** The same as `open` before the settle, with the capstone's window left standing as the opening raised it. */
export async function openOnCapstone(
  page: Page,
  seed: number,
  deck: string,
  schedule: string = STAND_IN_SCHEDULE,
): Promise<void> {
  await readNames(page);
  await page.goto(`/?content=${STAND_IN.version}&seed=${seed}&deck=${deck}&schedule=${schedule}`);
  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);
  await rested(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
}

/** Gives the pages this one loads from now on `window.named` and `window.counted`. */
export async function readNames(page: Page): Promise<void> {
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

    const layers = (): Phaser.GameObjects.Layer[] =>
      (window.game?.scene.getScenes(true) ?? []).flatMap(
        (scene) =>
          scene.children.list.filter(
            (child) => child.type === 'Layer',
          ) as Phaser.GameObjects.Layer[],
      );

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
}

/** Waits for a drawn frame, so a camera moved since answers for where it now stands. */
export function rested(page: Page): Promise<void> {
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
 * two axes, and the centre tile's face with the two beside it — charted from turn 0 on — give both.
 * Where a spec presses for a tile the map may be drawing nothing of, a press that lands off the map.
 */
export async function tileOnScreen(page: Page, coord: TileCoords): Promise<OnScreen> {
  const origin = await onScreen(page, `tile-${tileKey(CENTRE)}`);
  const alongQ = await onScreen(page, `tile-${tileKey({ q: CENTRE.q + 1, r: CENTRE.r })}`);
  const alongR = await onScreen(page, `tile-${tileKey({ q: CENTRE.q, r: CENTRE.r + 1 })}`);
  const q = coord.q - CENTRE.q;
  const r = coord.r - CENTRE.r;
  return {
    x: origin.x + q * (alongQ.x - origin.x) + r * (alongR.x - origin.x),
    y: origin.y + q * (alongQ.y - origin.y) + r * (alongR.y - origin.y),
    unit: origin.unit,
  };
}

/**
 * A point beside the tiles: up and left of the centre, inside the map's frame, which starts under
 * the resource bar, and far enough out for the nearest tile to be well outside the map's disc.
 */
export async function besideTiles(page: Page): Promise<{ x: number; y: number }> {
  const city = await onScreen(page, `tile-${tileKey(CENTRE)}`);
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

/** The corner of the canvas the resource bar stands in: on the scrim, beside a window's cards. */
export function besideTheCards(page: Page): Promise<{ x: number; y: number }> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + 10, y: rect.top + 10 };
  });
}

/** Whether an object of that name stands on the chronicle screen. */
export function standing(page: Page, name: string): Promise<boolean> {
  return page.evaluate((target) => window.named?.(target) !== undefined, name);
}

/**
 * Which card the named face stands, and nothing where no such face is up: a browse's cards and the
 * card shown large each carry theirs.
 */
export function cardOnFace(page: Page, name: string): Promise<string | undefined> {
  return page.evaluate((target) => {
    const face = window.named?.(target)?.object;
    return face === undefined ? undefined : (face.getData('card') as string);
  }, name);
}

/** Whether the named card face wears the ring: every one carries it, shown while it is selected. */
export function ringed(page: Page, name: string): Promise<boolean> {
  return page.evaluate((target) => {
    const card = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (card === undefined) throw new Error(`there is no ${target} on the chronicle screen`);
    const ring = card.list.find((part) => part.name === 'ring');
    if (ring === undefined) throw new Error(`${target} is no card face`);
    return (ring as Phaser.GameObjects.GameObject & { visible: boolean }).visible;
  }, name);
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
    const yields = tileYield(STAND_IN, face, rivers);
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
    (tile, chronicle) => playable(refusalOf(STAND_IN, chronicle, card)) && on(tile, chronicle),
  );
}

/** The same run for a card the city cannot pay for: what a play it has no cost for is aimed at. */
export function unaffordableRun(card: CardId): Run {
  return runOn(
    card,
    `opens a turn on a worker, a move and ${card} unpaid for`,
    (_, chronicle) => !playable(refusalOf(STAND_IN, chronicle, card)),
  );
}

function runOn(
  card: CardId,
  complaint: string,
  keeps: (tile: Tile, chronicle: Chronicle) => boolean,
): Run {
  const aimed = aimOf(cardOf(STAND_IN, card));
  if (aimed.aim !== 'tile') throw new Error(`${card} is aimed at no tile`);

  return firstSeed(complaint, (seed) => {
    let chronicle = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    for (let turn = 1; turn <= 8; turn++) {
      const tile = workedThisTurn(chronicle, card, aimed, keeps);
      if (tile !== undefined) return { seed, turn, tile };
      chronicle = endedTurn(chronicle);
    }
    return undefined;
  });
}

/** A chronicle whose turn `turn` can enter a worker and step it onto `first` and then `second`. */
export type StepRun = {
  readonly seed: number;
  readonly turn: number;
  readonly first: TileCoords;
  readonly second: TileCoords;
};

/** The first seed with a turn in its first eight that opens on such a run. */
export function stepRun(): StepRun {
  return firstSeed('opens a turn on a worker and two steps', (seed) => {
    let chronicle = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    for (let turn = 1; turn <= 8; turn++) {
      const steps = steppedThisTurn(chronicle);
      if (steps !== undefined) return { seed, turn, ...steps };
      chronicle = endedTurn(chronicle);
    }
    return undefined;
  });
}

/**
 * The two tiles this hand's worker crosses to, one step at a time, and nothing when it cannot. The
 * worker is the only unit on the map, so the chronicle has dealt it the first number of all: one.
 */
function steppedThisTurn(
  chronicle: Chronicle,
): { first: TileCoords; second: TileCoords } | undefined {
  const enter = chronicle.hand.indexOf('PH_Worker');
  if (enter === -1 || !playable(refusalOf(STAND_IN, chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(STAND_IN, chronicle, { type: 'play', index: enter, aim: 'none' }));
  if (entered.units.length !== 1) return undefined;

  for (const first of neighbours(cityTileOf(entered))) {
    const stepped = outcome(apply(STAND_IN, entered, { type: 'move', unit: 1, tile: first }));
    if (stepped === entered) continue;
    for (const second of neighbours(first)) {
      if (tileKey(second) === tileKey(cityTileOf(entered))) continue;
      if (outcome(apply(STAND_IN, stepped, { type: 'move', unit: 1, tile: second })) !== stepped) {
        return { first, second };
      }
    }
  }
  return undefined;
}

/** Where a card aimed at a tile that the city can pay for lies in the hand, or -1. */
export function atTile(chronicle: Chronicle): number {
  return chronicle.hand.findIndex(
    (id) =>
      aimOf(cardOf(STAND_IN, id)).aim === 'tile' && playable(refusalOf(STAND_IN, chronicle, id)),
  );
}

/** The first seed with a turn in its first eight that opens on such a card. */
export function atTileRun(): { seed: number; turn: number } {
  return firstSeed('opens a turn on a card aimed at a tile the city can pay for', (seed) => {
    let chronicle = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    for (let turn = 1; turn <= 8; turn++) {
      if (atTile(chronicle) !== -1) return { seed, turn };
      chronicle = endedTurn(chronicle);
    }
    return undefined;
  });
}

/** The first seed whose city is captured inside twenty turns of ending the turn and nothing else. */
export function fallRun(): { seed: number; turns: number } {
  return firstSeed('is captured inside twenty turns', (seed) => {
    let chronicle = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    for (let turns = 1; turns <= 20 && chronicle.ending === undefined; turns++) {
      chronicle = endedTurn(chronicle);
      const ending = chronicle.ending;
      if (ending?.outcome === 'defeat' && ending.cause === 'capture') return { seed, turns };
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
  if (enter === -1 || !playable(refusalOf(STAND_IN, chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(STAND_IN, chronicle, { type: 'play', index: enter, aim: 'none' }));
  if (entered.units.length !== 1 || !entered.hand.includes(card)) return undefined;

  for (const tile of neighbours(cityTileOf(entered))) {
    const moved = outcome(apply(STAND_IN, entered, { type: 'move', unit: 1, tile }));
    if (moved === entered) continue;
    const standing = tileAt(moved.tiles, tile);
    if (standing === undefined || !keeps(standing, moved)) continue;
    if (admitted(STAND_IN, moved, aimed).some((coord) => tileKey(coord) === tileKey(tile)))
      return tile;
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

/** What the card the infopanel is standing reads of the tile's movement cost, or nothing on one that reads none. */
export function panelMovement(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const reading = window.named?.('panel-movement')?.object as Phaser.GameObjects.Text | undefined;
    return reading?.text;
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

/** What the culture threshold on the map reads, or nothing while no tile wears one. */
export function thresholdShown(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const mark = window.named?.('threshold')?.object as Phaser.GameObjects.Container | undefined;
    if (mark === undefined) return undefined;
    return mark.list
      .filter((part) => part.type === 'Text')
      .map((part) => (part as Phaser.GameObjects.Text).text)[0];
  });
}

/**
 * What the named window's title reads — a title is named after the window it heads — or nothing
 * while that window stands down.
 */
export function titleOf(page: Page, name: string): Promise<string | undefined> {
  return page.evaluate((target) => {
    const title = window.named?.(target)?.object as Phaser.GameObjects.Text | undefined;
    return title?.text;
  }, `${name}-title`);
}

/** What the line over the hand says the card being aimed is played at, or nothing while none stands. */
export function aimLine(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const line = window.named?.('aim-line')?.object as Phaser.GameObjects.Container | undefined;
    if (line === undefined) return undefined;
    return line.list
      .filter((part) => part.type === 'Text')
      .map((part) => (part as Phaser.GameObjects.Text).text)[0];
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
  await rested(page);
}

/** One entry run at the open console, and the map redrawn under whatever it changed. */
export async function enter(page: Page, line: string): Promise<void> {
  await page.keyboard.type(line);
  await page.keyboard.press('Enter');
  await rested(page);
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
  await rested(page);
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
 * The gesture that carries what one tile holds onto another: the press takes hold on the tile it
 * lands on and lets go on the tile it ends on, and whatever that release commands plays out from
 * there.
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
 * open, the deal it stopped on standing, or the chronicle ended — or to stop on the capstone's window
 * at its landing, which holds the play-out until it closes. The turn moves on partway through the
 * sequence, so all three hold before the hand it deals is on the chronicle screen.
 */
export async function stoppedTurn(page: Page): Promise<void> {
  const { turn } = await chronicleOf(page);
  await click(page, 'end-turn');
  await page.waitForFunction((next) => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    if (scene === null || scene === undefined) return false;
    if (scene.playing) return window.named?.('capstone') !== undefined;
    return scene.chronicle.turn === next || scene.chronicle.ending !== undefined;
  }, turn + 1);
}

/**
 * One whole turn: the end of turn, the first entry of every deal it may stop on taken through the
 * window's own presses, one window after another, and the capstone's window a landing stops on
 * closed by a press on its card, the draw after it waited out. What every spec that only wants the
 * next turn open ends the turn with.
 */
export async function endTurn(page: Page): Promise<void> {
  await stoppedTurn(page);
  while (await standing(page, 'deal')) await take(page, 0);
  if (!(await standing(page, 'capstone'))) return;
  await click(page, 'capstone-card-0');
  await playedOut(page);
}

/** Takes the entry the deal window offers in that place: one press rings it, a second takes it. */
export async function take(page: Page, at: number): Promise<void> {
  await click(page, `deal-card-${at}`);
  await click(page, `deal-card-${at}`);
  await playedOut(page);
}

/**
 * The chronicle one whole turn leaves, played through the rules: the end of turn, and the first
 * entry of every deal it may stop on taken, as the window's presses take them. What every seed a
 * spec searches for is run forward with, a chronicle waiting on a deal taking no other command.
 */
export function endedTurn(chronicle: Chronicle): Chronicle {
  let ended = outcome(apply(STAND_IN, chronicle, { type: 'end-turn' }));
  while (ended.deals.length > 0) {
    const taken = outcome(apply(STAND_IN, ended, { type: 'take', at: 0 }));
    if (taken === ended) throw new Error(`the take at 0 is refused on turn ${ended.turn}`);
    ended = taken;
  }
  return ended;
}

/**
 * Whether the card at this place in the hand stands lifted out of the lane with nothing under the
 * pointer: the lift a hover gives it is gone, so the one it keeps is the selection's.
 */
export async function selected(page: Page, index: number, home: OnScreen): Promise<boolean> {
  const beside = await onScreen(page, `hand-${index === 0 ? 1 : index - 1}`);
  await page.mouse.move(beside.x, beside.y - 200 * beside.unit);
  await rested(page);
  const now = await onScreen(page, `hand-${index}`);
  return now.y < home.y;
}
