import { expect, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf, type CardKind } from '../src/rules/cards';
import {
  type Aim,
  cardOf,
  type Deck,
  deckOf,
  type Entering,
  entered,
  unitKind,
} from '../src/rules/catalogue';
import { admitted, apply, launched, outcome, refusalOf } from '../src/rules/chronicle';
import {
  CENTRE,
  distance,
  neighbours,
  riversAlong,
  runsAlong,
  type Tile,
  type TileCoords,
  tileKey,
  tileYield,
} from '../src/rules/map';
import { RESOURCES, type Resource, type Resources } from '../src/rules/resources';
import { type ChronicleSave, writeSave } from '../src/rules/save';
import { charted } from '../src/rules/sight';
import { type CardId, type Chronicle, type ChronicleCard, playable } from '../src/rules/state';
import { standsOn, type Unit, unitAt } from '../src/rules/units';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import type { PileKind } from '../src/ui/overlay';
import { SAVE_ENTRY } from '../src/ui/save-entry';

declare global {
  interface Window {
    /**
     * The named object and the camera that paints it, on whichever running scene it stands. A name
     * may sit any depth down inside a Layer or a container, so `children.getByName` finds nothing.
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

/** The tile the city stands on, for a spec whose chronicle has settled it. */
export function cityTileOf(chronicle: Chronicle): TileCoords {
  if (chronicle.city === undefined) throw new Error('the city of this chronicle stands nowhere');
  return chronicle.city;
}

/** The region, the schedule and the deck the catalogue lists first. */
export function firstsOf(): { region: string; schedule: string; deck: string } {
  const first = (table: Readonly<Record<string, unknown>>, noun: string): string => {
    const [id] = Object.keys(table);
    if (id === undefined) throw new Error(`${CATALOGUE.version} lists no ${noun}`);
    return id;
  };
  return {
    region: first(CATALOGUE.regions, 'region'),
    schedule: first(CATALOGUE.schedules, 'schedule'),
    deck: first(CATALOGUE.decks, 'deck'),
  };
}

/**
 * A chronicle launched from a seed on the first region, schedule and deck the catalogue lists, or the
 * deck given: the headless twin of `openNew`, the two launching alike.
 */
export function launchedOn(seed: number, deck?: Deck): Chronicle {
  const firsts = firstsOf();
  return launched(
    CATALOGUE,
    firsts.region,
    firsts.schedule,
    seed,
    deck ?? deckOf(CATALOGUE, firsts.deck),
  );
}

/**
 * A chronicle launched as `launchedOn` launches it and settled headlessly: the first settle card
 * played on the centre tile, the ones `onCity` names played on the city's tile, and the settle phase
 * ended with the rest in hand.
 */
export function settledOn(seed: number, onCity: readonly CardId[] = [], deck?: Deck): Chronicle {
  let settling = playedOn(launchedOn(seed, deck), 0, CENTRE);
  const city = cityTileOf(settling);
  for (const card of onCity)
    settling = playedOn(settling, idsOf(settling.hand).indexOf(card), city);
  return outcome(apply(CATALOGUE, settling, { type: 'end-turn' }));
}

/** The chronicle the card at that place in the hand leaves, played on the tile; a refusal throws. */
function playedOn(chronicle: Chronicle, index: number, tile: TileCoords): Chronicle {
  const played = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  if (played === chronicle) {
    const card = chronicle.hand[index]?.id ?? `no card at ${index}`;
    throw new Error(`seed ${chronicle.seed} refuses ${card} on ${tileKey(tile)}`);
  }
  return played;
}

/** How far up a card comes before the release plays it or aims it, in design units, and then some. */
const DRAG = 140;

/** What the dev server's first transform costs the spec that opens on it, and then some. */
const COLD_START_MS = 10_000;

/** What one end of turn takes with every stage of it played out, and then some. */
const TURN_MS = 10_000;

/**
 * How long a spec may take, in milliseconds: `turns` counts every end of turn it plays out on screen,
 * a gesture whose release plays out stages of its own counting as one, and one more is granted.
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
 * Opens a new chronicle on the address naming the seed, and the first schedule and deck the catalogue
 * lists, the region left to the boot's first; the capstone's window the opening raises is left
 * standing. The boot begins a chronicle only on an address naming a deck.
 */
export async function openNew(page: Page, seed: number): Promise<void> {
  const { schedule, deck } = firstsOf();
  await readNames(page);
  await page.goto(`/?seed=${seed}&deck=${deck}&schedule=${schedule}`);
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
}

/**
 * Closes the capstone's window standing by a press on its card, and rests: the back key is
 * rebindable, and specs rebind it.
 */
export async function capstoneClosed(page: Page): Promise<void> {
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);
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

    /** Every place a name may stand: each running scene's display list, under its main camera. */
    const places = (): {
      list: Phaser.GameObjects.GameObject[];
      camera: Phaser.Cameras.Scene2D.Camera;
    }[] =>
      (window.game?.scene.getScenes(true) ?? []).map((scene) => ({
        list: scene.children.list,
        camera: scene.cameras.main,
      }));

    window.named = (name) => {
      for (const place of places()) {
        const object = within(place.list, name, [])[0];
        if (object === undefined) continue;
        return { object, camera: place.camera };
      }
      return undefined;
    };

    window.counted = (name) =>
      places().reduce((total, place) => total + within(place.list, name, []).length, 0);
  });
}

/**
 * The chronicle kept as the save the pages this one loads from now on find; a save the reading would
 * refuse throws here.
 */
export async function plant(page: Page, save: ChronicleSave): Promise<void> {
  const text = writeSave(CATALOGUE, save);
  await page.addInitScript(
    ({ entry, kept }) => {
      window.localStorage.setItem(entry, kept);
    },
    { entry: SAVE_ENTRY, kept: text },
  );
}

/**
 * Opens the chronicle as the save the boot finds, on the first region and deck the catalogue lists,
 * and closes the capstone's window every resumed chronicle opens under but an ended one, which opens
 * on its ending screen. The boot reads a save only on the bare address.
 */
export async function openSaved(page: Page, chronicle: Chronicle): Promise<void> {
  const { region, deck } = firstsOf();
  await readNames(page);
  await plant(page, { chronicle, region, deck });
  await page.goto('/');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  if (chronicle.ending !== undefined) {
    await rested(page);
    return;
  }
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
  await capstoneClosed(page);
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

/**
 * Waits out a span of the game's own clock, the one a scene's timers run on. Phaser advances it by
 * at most a sixtieth of a second a frame for its first 120 frames, so on a slow runner a wait on the
 * wall clock ends before a timer of the same span does.
 */
export function waitGameClock(page: Page, span: number): Promise<void> {
  return page.evaluate(
    (ms) =>
      new Promise<void>((done) => {
        const [scene] = window.game?.scene.getScenes(true) ?? [];
        if (scene === undefined) throw new Error('no scene is running');
        scene.time.delayedCall(ms, () => done());
      }),
    span,
  );
}

export function chronicleOf(page: Page): Promise<Chronicle> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('ui');
    if (scene === undefined) throw new Error('the ui scene is not running');
    return scene.chronicle;
  });
}

/** What the cards of a pile are, by id, in pile order. */
export function idsOf(pile: readonly ChronicleCard[]): CardId[] {
  return pile.map(({ id }) => id);
}

/** The units of the player's standing on the chronicle, in unit order: the camps' guards left out. */
export function playersOf(chronicle: Chronicle): Unit[] {
  return chronicle.units.filter((unit) => unit.faction === 'player');
}

export function enemiesOf(chronicle: Chronicle): Unit[] {
  return chronicle.units.filter((unit) => unit.faction === 'enemy');
}

/** Whether the end of turn is still playing out its stages. */
export function playing(page: Page): Promise<boolean> {
  return page.evaluate(() => window.game?.scene.getScene<ChronicleScene>('ui').playing === true);
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
 * Where a name the named face's rules entry draws sits on the page, the first it draws at 0, and how
 * tall its line stands there.
 */
export function nameOnScreen(
  page: Page,
  face: string,
  at = 0,
): Promise<{ x: number; y: number; height: number }> {
  return page.evaluate(
    ({ target, index }) => {
      const found = window.named?.(target);
      if (found === undefined)
        throw new Error(`nothing named ${target} is on the chronicle screen`);
      const root = found.object as Phaser.GameObjects.Container;
      const name = (
        root.getData('names') as { x: number; y: number; height: number }[] | undefined
      )?.[index];
      if (name === undefined) throw new Error(`${target} draws no name at ${index}`);
      const middle = root.getWorldTransformMatrix().transformPoint(name.x, name.y);

      const camera = found.camera;
      const origin = camera.getWorldPoint(0, 0);
      const stepped = camera.getWorldPoint(1, 1);
      const canvas = camera.scene.game.canvas;
      const rect = canvas.getBoundingClientRect();
      const unit = rect.width / canvas.width / (stepped.x - origin.x);
      return {
        x: rect.left + (middle.x - origin.x) * unit,
        y: rect.top + (middle.y - origin.y) * unit,
        height: name.height * unit,
      };
    },
    { target: face, index: at },
  );
}

/** Where the named face's kind label sits on the page, and how tall it stands there. */
export function kindLabelOnScreen(
  page: Page,
  face: string,
): Promise<{ x: number; y: number; height: number }> {
  return page.evaluate((target) => {
    const found = window.named?.(target);
    if (found === undefined) throw new Error(`nothing named ${target} is on the chronicle screen`);
    const root = found.object as Phaser.GameObjects.Container;
    const label = root.list.find((part) => part.name === 'kind-label') as
      | Phaser.GameObjects.Text
      | undefined;
    if (label === undefined) throw new Error(`${target} wears no kind label`);
    const middle = root
      .getWorldTransformMatrix()
      .transformPoint(
        label.x + (0.5 - label.originX) * label.width,
        label.y + (0.5 - label.originY) * label.height,
      );

    const camera = found.camera;
    const origin = camera.getWorldPoint(0, 0);
    const stepped = camera.getWorldPoint(1, 1);
    const canvas = camera.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const unit = rect.width / canvas.width / (stepped.x - origin.x);
    return {
      x: rect.left + (middle.x - origin.x) * unit,
      y: rect.top + (middle.y - origin.y) * unit,
      height: label.height * unit,
    };
  }, face);
}

/** The cursor the page shows over the canvas. */
export function cursorOverCanvas(page: Page): Promise<string> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.style.cursor);
}

/**
 * The centre tile and the two beside it are charted from the settle phase on, so the axes they give
 * can always be measured.
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

/** Whether a point on the page stands inside a rectangle of it. */
export function inside(at: { x: number; y: number }, frame: Frame): boolean {
  return (
    at.x > frame.x &&
    at.x < frame.x + frame.width &&
    at.y > frame.y &&
    at.y < frame.y + frame.height
  );
}

/** Where the map's frame stands on the page: the rectangle its camera is cropped to. */
export function mapFrame(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const camera = window.game?.scene.getScene('map')?.cameras.main;
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

/**
 * A point on the scrim beside the deal window's cards: at the left edge, clear of the frame they are
 * laid in and of the resource bar, which stands over the scrim while a deal waits to be taken.
 */
export function besideTheDeal(page: Page): Promise<{ x: number; y: number }> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + 8, y: rect.top + rect.height / 2 };
  });
}

/** Whether the victory screen has risen over the chronicle screen: the rise ends at full alpha. */
export function victoryShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('victory')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true && screen.alpha === 1;
  });
}

/** Whether the defeat screen has risen over the chronicle screen: the rise ends at full alpha. */
export function defeatShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('defeat')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true && screen.alpha === 1;
  });
}

/** Whether an object of that name stands on any running scene. */
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

/**
 * What the named card of a thing a name names stands, by its kind and id, and nothing where no such
 * card is up: a small card and a card shown large each carry theirs.
 */
export function referenceOnFace(
  page: Page,
  name: string,
): Promise<{ kind: string; id: string } | undefined> {
  return page.evaluate((target) => {
    const card = window.named?.(target)?.object;
    return card?.getData('reference') as { kind: string; id: string } | undefined;
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

/** What the floor of a reading's well is painted, and nothing at all while that well is down. */
export function wellFill(page: Page, key: string): Promise<number | undefined> {
  return page.evaluate((target) => {
    const floor = window.named?.(`reading-${target}-floor`)?.object as
      | Phaser.GameObjects.Rectangle
      | undefined;
    if (floor === undefined) throw new Error(`there is no well for ${target}`);
    return floor.parentContainer.visible ? floor.fillColor : undefined;
  }, key);
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

/**
 * How many glyphs each resource is owed for these faces of the chronicle's map: one for every point
 * they yield of it.
 */
export function glyphsOf(chronicle: Chronicle, faces: readonly Tile[]): Glyphs {
  const owed = noGlyphs();
  for (const face of faces) {
    const yields = tileYield(CATALOGUE, face, chronicle.rivers);
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

/** A card of a hand as the rules judge it: its kind, what it is aimed at, whether they would play it. */
export type Judged = {
  readonly kind: CardKind;
  readonly aim: Aim['aim'];
  readonly playable: boolean;
};

/** Where the first card of the hand lies that `such` holds of, judged on the chronicle, or -1. */
export function inHand(chronicle: Chronicle, such: (card: Judged) => boolean): number {
  return chronicle.hand.findIndex(({ id }) => {
    const card = cardOf(CATALOGUE, id);
    const judged = playable(refusalOf(CATALOGUE, chronicle, id));
    return such({ kind: card.kind, aim: aimOf(card).aim, playable: judged });
  });
}

/** Whether the card at that place in the hand is aimed at a tile or a unit and admits the tile. */
export function admits(chronicle: Chronicle, index: number, at: TileCoords): boolean {
  const held = chronicle.hand[index];
  if (held === undefined) return false;
  const card = aimOf(cardOf(CATALOGUE, held.id));
  switch (card.aim) {
    case 'tile':
    case 'unit':
      return admitted(CATALOGUE, chronicle, card).some((tile) => tileKey(tile) === tileKey(at));
    case 'none':
    case 'discard-pile':
      return false;
  }
}

/**
 * The first seed's turn 1 on the Nomadic content, its city settled bare, whose hand holds a card
 * `such` holds of, and where that card lies; `named` tails the complaint when no seed does.
 */
export function bareWith(
  named: string,
  such: (card: Judged) => boolean,
): { chronicle: Chronicle; index: number } {
  return firstSeed(`opens turn 1 on ${named}`, (seed) => {
    const chronicle = settledOn(seed);
    const index = inHand(chronicle, such);
    return index === -1 ? undefined : { chronicle, index };
  });
}

/** A card aimed at a tile the city can pay for. */
export function tilePlayable({ aim, playable }: Judged): boolean {
  return aim === 'tile' && playable;
}

/** The first seed's turn 1, settled bare, with a card aimed at a tile the city can pay for. */
export function bareAimable(): { chronicle: Chronicle; index: number } {
  return bareWith('a card aimed at a tile the city can pay for', tilePlayable);
}

/**
 * A tile the chronicle charts and leaves bare: its terrain and nothing else, no river running along
 * it, outside the border. So it inspects its terrain, and a right click on it claims nothing.
 */
export function bareTile(chronicle: Chronicle): TileCoords {
  const seen = new Set(chronicle.snapshots.map(tileKey));
  const found = chronicle.tiles.find(
    (tile) =>
      distance(tile, cityTileOf(chronicle)) === 2 &&
      seen.has(tileKey(tile)) &&
      tile.feature === undefined &&
      tile.building === undefined &&
      tile.improvements.length === 0 &&
      !runsAlong(chronicle.rivers, tile),
  );
  if (found === undefined) throw new Error('the chronicle charts no bare tile two tiles out');
  return { q: found.q, r: found.r };
}

/** The Nomadic deck's cards twice over and its settle section as it is: its piles overflow a browse's frame. */
export function doubledDeck(): Deck {
  const deck = deckOf(CATALOGUE, firstsOf().deck);
  return { ...deck, cards: [...deck.cards, ...deck.cards] };
}

/**
 * The seed's turn 1 on the Nomadic content, settled bare, with its turns ended up to the one before
 * its timeline's first deal, and that end of turn applied: the chronicle stopped on the deal.
 */
export function firstDealt(seed: number): Chronicle {
  let chronicle = settledOn(seed);
  const due = chronicle.timeline.next;
  while (chronicle.turn < due - 1 && chronicle.ending === undefined) {
    chronicle = endedTurn(chronicle);
  }
  return outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));
}

/** The chronicle of the first seed whose first deal is the lean season standing alone, stopped on it. */
export function leanSeason(): Chronicle {
  return firstSeed('deals the lean season alone first', (seed) => {
    const dealt = firstDealt(seed);
    const [deal, ...behind] = dealt.deals;
    if (deal?.of !== 'event' || deal.event !== 'lean-season' || behind.length > 0) return undefined;
    return dealt;
  });
}

/**
 * The chronicle of the first seed whose city is captured inside forty turns of ending the turn and
 * nothing else, standing on the turn whose end captures it.
 */
export function beforeTheFall(): Chronicle {
  return firstSeed('is captured inside forty turns', (seed) => {
    let chronicle = settledOn(seed);
    for (let turn = 1; turn <= 40 && chronicle.ending === undefined; turn++) {
      const ended = endedTurn(chronicle);
      if (ended.ending?.outcome === 'defeat' && ended.ending.cause === 'capture') return chronicle;
      chronicle = ended;
    }
    return undefined;
  });
}

/** A turn 1 with the first worker entered on the city's tile, and the neighbour it steps onto. */
export type Step = {
  readonly entered: Chronicle;
  readonly tile: TileCoords;
  readonly stepped: Chronicle;
};

/**
 * The first seed's turn 1 on the Nomadic content whose first worker, entered on the city's tile,
 * steps onto a neighbour where `keeps` holds of the chronicle the step leaves: the first such
 * neighbour. The worker is the only unit of the player's on the map.
 */
export function workerStepped(
  complaint: string,
  keeps: (stepped: Chronicle, tile: TileCoords) => boolean,
): Step {
  return firstSeed(complaint, (seed) => {
    const entered = settledOn(seed, ['first-worker']);
    const [worker] = playersOf(entered);
    for (const tile of neighbours(cityTileOf(entered))) {
      const move = { type: 'move', unit: worker.id, tile } as const;
      const stepped = outcome(apply(CATALOGUE, entered, move));
      if (stepped !== entered && keeps(stepped, tile)) return { entered, tile, stepped };
    }
    return undefined;
  });
}

/** The chronicle with the unit entered as every unit card enters one, and charted as a command is. */
export function unitEntered(chronicle: Chronicle, entering: Entering): Chronicle {
  return charted(CATALOGUE, entered(CATALOGUE, chronicle, entering).chronicle);
}

/**
 * The tiles that far from the city the camp's unit can stand on with nobody on them, in the order
 * the map lists them.
 */
export function campGround(chronicle: Chronicle, away: number): TileCoords[] {
  const stats = unitKind(CATALOGUE, CATALOGUE.camp.unit);
  const city = cityTileOf(chronicle);
  return chronicle.tiles
    .filter(
      (tile) =>
        distance(tile, city) === away &&
        standsOn(CATALOGUE, stats, tile) &&
        unitAt(chronicle.units, tile) === undefined,
    )
    .map(({ q, r }) => ({ q, r }));
}

/** The tile nearest the city that has never been in sight: the closest dark ground to press on. */
export function nearestUncharted(chronicle: Chronicle): TileCoords {
  const seen = new Set(chronicle.snapshots.map(tileKey));
  let nearest: TileCoords | undefined;
  let away = Infinity;
  for (const tile of chronicle.tiles) {
    if (seen.has(tileKey(tile))) continue;
    const off = distance(tile, cityTileOf(chronicle));
    if (off >= away) continue;
    away = off;
    nearest = { q: tile.q, r: tile.r };
  }
  if (nearest === undefined) throw new Error('this chronicle has charted the whole disc');
  return nearest;
}

/**
 * Waits for the card being aimed to lay its catcher over the map, which a press aims on, and for a
 * frame after: Phaser hit-tests a new interactive object only from the next frame, and a press
 * landing before it is lost with the aim left standing.
 */
export async function aimed(page: Page): Promise<void> {
  await page.waitForFunction(() => window.named?.('aim') !== undefined);
  await rested(page);
}

/**
 * What the card the infopanel is standing reads, in the order it was drawn: its texts, and every
 * yield chip by the resource it is named for.
 */
function panelLines(page: Page): Promise<string[]> {
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

/** A text the infopanel's card reads, and what the yield chips drawn after it give. */
export type PanelRow = { readonly text: string; readonly yields: Partial<Resources> };

/** The rows of the card the infopanel is standing, in the order drawn; a row's chips are read in whatever order they were. */
export async function panelRows(page: Page): Promise<PanelRow[]> {
  const lines = await panelLines(page);
  const rows: { text: string; yields: Partial<Resources> }[] = [];
  for (let at = 0; at < lines.length; at++) {
    const resource = RESOURCES.find((named) => lines[at] === `panel-yield-${named}`);
    if (resource === undefined) {
      rows.push({ text: lines[at], yields: {} });
      continue;
    }
    const row = rows.at(-1);
    if (row === undefined)
      throw new Error(`the infopanel draws a ${resource} chip before any text`);
    at++;
    row.yields[resource] = Number(lines[at]);
  }
  return rows;
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

/** What the named bubble reads. */
export function tooltipText(page: Page, name: string): Promise<string> {
  return page.evaluate((target) => {
    const bubble = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (bubble === undefined) throw new Error(`there is no ${target}`);
    const label = bubble.list.find((part) => part.type === 'Text') as
      | Phaser.GameObjects.Text
      | undefined;
    if (label === undefined) throw new Error(`${target} holds no text`);
    return label.text;
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

/**
 * What the named window's lore reads — a lore is named after the window it stands in — or nothing
 * while that window stands down.
 */
export function loreOf(page: Page, name: string): Promise<string | undefined> {
  return page.evaluate((target) => {
    const lore = window.named?.(target)?.object as Phaser.GameObjects.Text | undefined;
    return lore?.text;
  }, `${name}-lore`);
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

/** What the end-turn button is painted. */
export function endTurnFill(page: Page): Promise<number> {
  return page.evaluate(() => {
    const button = window.named?.('end-turn')?.object as Phaser.GameObjects.Rectangle | undefined;
    if (button === undefined) throw new Error('the end-turn button is not on the chronicle screen');
    return button.fillColor;
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
    () => window.game?.scene.getScene<ChronicleScene>('ui').playing === false,
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
    const chronicle = window.game?.scene.getScene<ChronicleScene>('ui').chronicle;
    return chronicle?.units.some((unit) => unit.tile.q === on.q && unit.tile.r === on.r) === true;
  }, to);
}

/**
 * Ends the turn on the button, and waits for the end of turn to finish playing out — the next turn
 * open, the deal it stopped on standing, or the chronicle ended — or to stop on the capstone's window
 * at its landing, which holds the play-out until it closes. The turn moves on partway through the
 * play-out, so the turn alone does not say the hand it deals is on the chronicle screen.
 */
export async function stoppedTurn(page: Page): Promise<void> {
  const { turn } = await chronicleOf(page);
  await click(page, 'end-turn');
  await page.waitForFunction((next) => {
    const scene = window.game?.scene.getScene<ChronicleScene>('ui');
    if (scene === null || scene === undefined) return false;
    if (scene.playing) return window.named?.('capstone') !== undefined;
    const { chronicle } = scene;
    return chronicle.turn === next || chronicle.deals.length > 0 || chronicle.ending !== undefined;
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
 * The chronicle one whole turn leaves, played through the rules: the end of turn, and the first entry
 * of every deal it may stop on taken. What every seed a spec searches for is run forward with, a
 * chronicle waiting on a deal taking no other command.
 */
export function endedTurn(chronicle: Chronicle): Chronicle {
  return firstEntriesTaken(outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' })));
}

/** The first entry of every deal standing taken, one deal after another, as the window's presses take them. */
export function firstEntriesTaken(chronicle: Chronicle): Chronicle {
  let taking = chronicle;
  while (taking.deals.length > 0) {
    const taken = outcome(apply(CATALOGUE, taking, { type: 'take', at: 0 }));
    if (taken === taking) throw new Error(`the take at 0 is refused on turn ${taking.turn}`);
    taking = taken;
  }
  return taking;
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
