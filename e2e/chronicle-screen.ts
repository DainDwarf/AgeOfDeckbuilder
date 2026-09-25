import { expect, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { catalogueOf } from '../src/content/catalogues';
import { STAND_IN, STAND_IN_REGION, STAND_IN_SCHEDULE } from '../src/content/stand-in';
import { aimOf } from '../src/rules/cards';
import { type AimedCard, type Catalogue, cardOf, type Deck, deckOf } from '../src/rules/catalogue';
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
import { type ChronicleSave, writeSave } from '../src/rules/save';
import { offered } from '../src/rules/schedule';
import { type CardId, type Chronicle, type ChronicleCard, playable } from '../src/rules/state';
import type { Unit } from '../src/rules/units';
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

/**
 * What the city holds when the settle phase ends: the six tiles around it claimed by the settle
 * section's free claims, or its own tile alone.
 */
export type Border = 'ring' | 'bare';

/**
 * The headless twin of `open`: the two must settle alike, or a spec's fixture is not the chronicle
 * its page shows.
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

/** The region, the schedule and the deck a catalogue lists first. */
function firstsOf(catalogue: Catalogue): { region: string; schedule: string; deck: string } {
  const first = (table: Readonly<Record<string, unknown>>, noun: string): string => {
    const [id] = Object.keys(table);
    if (id === undefined) throw new Error(`${catalogue.version} lists no ${noun}`);
    return id;
  };
  return {
    region: first(catalogue.regions, 'region'),
    schedule: first(catalogue.schedules, 'schedule'),
    deck: first(catalogue.decks, 'deck'),
  };
}

/**
 * A chronicle launched from a seed on the first region, schedule and deck the catalogue lists, and
 * settled headlessly: the first card of the settle section played on the centre tile, the settle
 * cards `onCity` names played on the city's tile, and the settle phase ended with the rest in hand.
 */
export function settledOn(
  catalogue: Catalogue,
  seed: number,
  onCity: readonly CardId[] = [],
): Chronicle {
  const { region, schedule, deck } = firstsOf(catalogue);
  const opened = launched(catalogue, region, schedule, seed, deckOf(catalogue, deck));
  let settling = playedOn(opened, 0, CENTRE);
  const city = cityTileOf(settling);
  for (const card of onCity)
    settling = playedOn(settling, idsOf(settling.hand).indexOf(card), city);
  return outcome(apply(catalogue, settling, { type: 'end-turn' }));
}

/** The chronicle the card at that place in the hand leaves, played on the tile; a refusal throws. */
function playedOn(chronicle: Chronicle, index: number, tile: TileCoords): Chronicle {
  const catalogue = catalogueOf(chronicle.content);
  const played = outcome(apply(catalogue, chronicle, { type: 'play', index, aim: 'tile', tile }));
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
 * The settle as a player makes it on the settle phase: the first card of the hand dragged out, the
 * centre tile or the tile given pressed, the free claims played on the six tiles around the city
 * unless it is asked for bare, and the turn ended.
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
    () => window.game?.scene.getScene<ChronicleScene>('ui').chronicle.city !== undefined,
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
 * A free claim as a player plays it on the settle phase: the first card of the hand selected, then
 * the tile pressed, waited out until the city holds one tile more.
 */
async function claimFree(page: Page, tile: TileCoords): Promise<void> {
  const { held } = await chronicleOf(page);
  await click(page, 'hand-0');
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);
  await page.waitForFunction(
    (count) => window.game?.scene.getScene<ChronicleScene>('ui').chronicle.held.length === count,
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
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
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
 * The chronicle kept as the save the pages this one loads from now on find, written against the
 * content it names; a save the reading would refuse throws here.
 */
export async function plant(page: Page, save: ChronicleSave): Promise<void> {
  const text = writeSave(catalogueOf(save.chronicle.content), save);
  await page.addInitScript(
    ({ entry, kept }) => {
      window.localStorage.setItem(entry, kept);
    },
    { entry: SAVE_ENTRY, kept: text },
  );
}

/**
 * Opens the chronicle as the save the boot finds, on the first region and deck its content lists,
 * and closes the capstone's window every resumed chronicle opens under. The boot reads a save only
 * on the bare address; the card and not the back key closes the window, that key being rebindable.
 */
export async function openSaved(page: Page, chronicle: Chronicle): Promise<void> {
  const { region, deck } = firstsOf(catalogueOf(chronicle.content));
  await readNames(page);
  await plant(page, { chronicle, region, deck });
  await page.goto('/');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);
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

/**
 * The first seed whose timeline's first deal stands alone and offers the raid first, with a tile
 * free for it to enter a warrior on — what the take lands is then one more warrior standing on the
 * map — the turn that deal is due on, and the chronicle that end of turn leaves, the deal waiting.
 */
export function dealRun(): { seed: number; due: number; dealt: Chronicle } {
  return firstSeed('deals a raid first on its first deal', (seed) => {
    const opened = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    const due = opened.timeline.next;

    let chronicle = opened;
    for (let turn = 1; turn < due - 1; turn++) chronicle = endedTurn(chronicle);
    const dealt = outcome(apply(STAND_IN, chronicle, { type: 'end-turn' }));
    const [deal, ...behind] = dealt.deals;
    if (deal === undefined || behind.length > 0) return undefined;
    if (offered(STAND_IN, deal)[0] !== 'PH_Raid') return undefined;

    const landed = outcome(apply(STAND_IN, dealt, { type: 'take', at: 0 }));
    return enemiesOf(landed).length > enemiesOf(dealt).length ? { seed, due, dealt } : undefined;
  });
}

/** A chronicle whose turn `turn` can enter a worker, move it onto `tile` and play a card there. */
export type Run = { readonly seed: number; readonly turn: number; readonly tile: TileCoords };

/**
 * The first seed with a turn in its first eight that opens on such a run, for a card the city can
 * pay for; `on` narrows which run counts, by the tile the unit lands on and the chronicle it lands in.
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
 * worker is the only unit of the player's on the map.
 */
function steppedThisTurn(
  chronicle: Chronicle,
): { first: TileCoords; second: TileCoords } | undefined {
  const enter = idsOf(chronicle.hand).indexOf('PH_Worker');
  if (enter === -1 || !playable(refusalOf(STAND_IN, chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(STAND_IN, chronicle, { type: 'play', index: enter, aim: 'none' }));
  const [worker, ...others] = playersOf(entered);
  if (worker === undefined || others.length > 0) return undefined;

  for (const first of neighbours(cityTileOf(entered))) {
    const stepped = outcome(
      apply(STAND_IN, entered, { type: 'move', unit: worker.id, tile: first }),
    );
    if (stepped === entered) continue;
    for (const second of neighbours(first)) {
      if (tileKey(second) === tileKey(cityTileOf(entered))) continue;
      const again = { type: 'move', unit: worker.id, tile: second } as const;
      if (outcome(apply(STAND_IN, stepped, again)) !== stepped) {
        return { first, second };
      }
    }
  }
  return undefined;
}

/** Where a card aimed at a tile that the city can pay for lies in the hand, or -1. */
export function atTile(chronicle: Chronicle): number {
  return idsOf(chronicle.hand).findIndex(
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
 * the card there, in that order. The worker has to be the only unit of the player's on the map, so
 * every spec built on the run finds it first among `playersOf`.
 */
function workedThisTurn(
  chronicle: Chronicle,
  card: CardId,
  aimed: AimedCard,
  keeps: (tile: Tile, chronicle: Chronicle) => boolean,
): TileCoords | undefined {
  const enter = idsOf(chronicle.hand).indexOf('PH_Worker');
  if (enter === -1 || !playable(refusalOf(STAND_IN, chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(STAND_IN, chronicle, { type: 'play', index: enter, aim: 'none' }));
  const [worker, ...others] = playersOf(entered);
  if (worker === undefined || others.length > 0 || !idsOf(entered.hand).includes(card))
    return undefined;

  for (const tile of neighbours(cityTileOf(entered))) {
    const moved = outcome(apply(STAND_IN, entered, { type: 'move', unit: worker.id, tile }));
    if (moved === entered) continue;
    const standing = tileAt(moved.tiles, tile);
    if (standing === undefined || !keeps(standing, moved)) continue;
    if (admitted(STAND_IN, moved, aimed).some((coord) => tileKey(coord) === tileKey(tile)))
      return tile;
  }
  return undefined;
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
 * The chronicle one whole turn leaves, played through the rules on the content it names: the end of
 * turn, and the first entry of every deal it may stop on taken. What every seed a spec searches for
 * is run forward with, a chronicle waiting on a deal taking no other command.
 */
export function endedTurn(chronicle: Chronicle): Chronicle {
  const catalogue = catalogueOf(chronicle.content);
  return firstEntriesTaken(outcome(apply(catalogue, chronicle, { type: 'end-turn' })));
}

/** The first entry of every deal standing taken, one deal after another, as the window's presses take them. */
export function firstEntriesTaken(chronicle: Chronicle): Chronicle {
  const catalogue = catalogueOf(chronicle.content);
  let taking = chronicle;
  while (taking.deals.length > 0) {
    const taken = outcome(apply(catalogue, taking, { type: 'take', at: 0 }));
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
