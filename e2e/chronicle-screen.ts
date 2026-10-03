import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { type Campaign, paidInto } from '../src/rules/campaign';
import {
  aimOf,
  type CardKind,
  featurePlaced,
  gained,
  improvementPlaced,
  terraformed,
} from '../src/rules/cards';
import {
  type Aim,
  ageOf,
  type Civilization,
  cardOf,
  civilizationOf,
  type Entering,
  entered,
  firstAge,
  firstCivilization,
  firstRegion,
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
  tileAt,
  tileKey,
  tileYield,
} from '../src/rules/map';
import { featureKind, improvementKind } from '../src/rules/map-kinds';
import { RESOURCES, type Resource, type Resources } from '../src/rules/resources';
import {
  type ChronicleSave,
  freshCampaign,
  readSave,
  type SaveRead,
  writeSave,
} from '../src/rules/save';
import { addedToDrawPileTop } from '../src/rules/schedule';
import { charted } from '../src/rules/sight';
import { type Aimed, followed, unchanged } from '../src/rules/stages';
import { type CardId, type Chronicle, type ChronicleCard, playable } from '../src/rules/state';
import { standsOn, type Unit, unitAt } from '../src/rules/units';
import { type Bindings, STORED, serialiseControls, UPRIGHT } from '../src/ui/bindings';
import type { Name } from '../src/ui/card-face';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { type PileStack, pileStacksOf } from '../src/ui/collection-layout';
import type { PileKind } from '../src/ui/overlay';
import { SAVE_ENTRY } from '../src/ui/save-entry';
import { cardName, referenceName } from '../src/ui/text';
import { layOutRun, type Reference } from '../src/ui/text-run';

/** What the page answers of a reading: its value, or what a read of it throws. */
type Answer<T> = { value: T } | { complaint: string };

/** What the page answers of one name, each reading as `Reading` reads it. */
type PageReading = {
  standing: boolean;
  count: number;
  text: string | undefined;
  dimmed: boolean | undefined;
  selected: boolean | undefined;
  card: string | undefined;
  reference: { kind: string; id: string } | undefined;
  shows: Answer<boolean>;
  fill: Answer<number | undefined>;
  place: Answer<{ x: number; y: number }>;
  ringed: Answer<boolean>;
  names: Answer<DrawnName[]>;
  onScreen: Answer<OnScreen>;
  kindLabelOnScreen: Answer<Spot>;
  boundsOnScreen: Answer<Frame>;
  across: Answer<Across>;
};

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
    /** What one name reads on the running scenes. */
    readName?: (name: string) => PageReading;
  }
}

/** The tile the city stands on, for a spec whose chronicle has settled it. */
export function cityTileOf(chronicle: Chronicle): TileCoords {
  if (chronicle.city === undefined) throw new Error('the city of this chronicle stands nowhere');
  return chronicle.city;
}

/** The age and the civilization the catalogue lists first, and the first region that age lists. */
export function firstsOf(): { age: string; region: string; civilization: string } {
  const age = firstAge(CATALOGUE);
  return {
    age,
    region: firstRegion(CATALOGUE, age),
    civilization: firstCivilization(CATALOGUE),
  };
}

/**
 * A chronicle launched from a seed in the first age the catalogue lists, on that age's first region
 * and the catalogue's first civilization, or the civilization given.
 */
export function launchedOn(seed: number, civilization?: Civilization): Chronicle {
  const firsts = firstsOf();
  return launched(
    CATALOGUE,
    firsts.age,
    firsts.region,
    seed,
    civilization ?? civilizationOf(CATALOGUE, firsts.civilization),
    [],
  );
}

/**
 * A chronicle launched as `launchedOn` launches it and settled headlessly: the city section's card,
 * first in hand, played on the centre tile, the ones `onCity` names played on the city's tile, and
 * the settle phase ended with the rest in hand.
 */
export function settledOn(
  seed: number,
  onCity: readonly CardId[] = [],
  civilization?: Civilization,
): Chronicle {
  let settling = playedOn(launchedOn(seed, civilization), 0, CENTRE);
  const city = cityTileOf(settling);
  for (const card of onCity)
    settling = playedOn(settling, idsOf(settling.hand).indexOf(card), city);
  return outcome(apply(CATALOGUE, settling, { type: 'end-turn' }));
}

/** The chronicle the card at that place in the hand leaves, played on the tile; a refusal throws. */
export function playedOn(chronicle: Chronicle, index: number, tile: TileCoords): Chronicle {
  return playedAs(chronicle, index, { aim: 'tile', tile });
}

/**
 * The chronicle the card at that place in the hand leaves, played at the unit standing on the tile;
 * a refusal throws.
 */
export function playedAtUnit(chronicle: Chronicle, index: number, tile: TileCoords): Chronicle {
  return playedAs(chronicle, index, { aim: 'unit', tile });
}

function playedAs(
  chronicle: Chronicle,
  index: number,
  aimed: Extract<Aimed, { readonly tile: TileCoords }>,
): Chronicle {
  const played = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, ...aimed }));
  if (played === chronicle) {
    const card = chronicle.hand[index]?.id ?? `no card at ${index}`;
    throw new Error(`seed ${chronicle.seed} refuses ${card} on ${tileKey(aimed.tile)}`);
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

/** Where a line of text a face draws sits on the page, its middle, and how tall it stands there. */
type Spot = { x: number; y: number; height: number };

/** A name a face draws: where it sits on the page, and what it names. */
type DrawnName = { spot: Spot; reference: Reference };

/** An object's left and right ends and its middle across, in design units. */
type Across = { left: number; right: number; middle: number };

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
 * Closes the capstone's window standing by a press on its card, and rests: the back key is
 * rebindable, and specs rebind it.
 */
export async function capstoneClosed(page: Page): Promise<void> {
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);
}

/** Gives the pages this one loads from now on `window.named` and `window.readName`. */
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

    /** Every object of the name on the running scenes, in the order walked, under its camera. */
    const everyNamed = (
      name: string,
    ): { object: Phaser.GameObjects.GameObject; camera: Phaser.Cameras.Scene2D.Camera }[] =>
      places().flatMap((place) =>
        within(place.list, name, []).map((object) => ({ object, camera: place.camera })),
      );

    window.named = (name) => everyNamed(name)[0];

    /** Where a point of the camera's world sits on the page, and what one unit of it measures there. */
    const onPage = (camera: Phaser.Cameras.Scene2D.Camera, x: number, y: number): OnScreen => {
      // The camera converts canvas pixels into its own surface; two points walk that backwards.
      const origin = camera.getWorldPoint(0, 0);
      const stepped = camera.getWorldPoint(1, 1);
      const canvas = camera.scene.game.canvas;
      const rect = canvas.getBoundingClientRect();
      const unit = rect.width / canvas.width / (stepped.x - origin.x);
      return { x: rect.left + (x - origin.x) * unit, y: rect.top + (y - origin.y) * unit, unit };
    };

    const answer = <T>(read: () => T): Answer<T> => {
      try {
        return { value: read() };
      } catch (error) {
        return { complaint: error instanceof Error ? error.message : String(error) };
      }
    };

    window.readName = (name) => {
      const all = everyNamed(name);
      const object = all[0]?.object;
      const found = (): {
        object: Phaser.GameObjects.GameObject;
        camera: Phaser.Cameras.Scene2D.Camera;
      } => {
        const first = all[0];
        if (first === undefined) throw new Error(`nothing named ${name} stands on the screen`);
        return first;
      };
      // `getData` gives an object that holds none a data manager of its own.
      const data = (key: string): unknown =>
        (object?.data as Phaser.Data.DataManager | null | undefined)?.get(key);
      const matrix = (): Phaser.GameObjects.Components.TransformMatrix => {
        const transformed = found().object as Partial<Phaser.GameObjects.Components.Transform>;
        const at = transformed.getWorldTransformMatrix?.();
        if (at === undefined) throw new Error(`${name} stands at no place`);
        return at;
      };
      const bounds = (): Phaser.Geom.Rectangle => {
        const bounded = found().object as Partial<Phaser.GameObjects.Components.GetBounds>;
        const box = bounded.getBounds?.();
        if (box === undefined) throw new Error(`${name} has no bounds`);
        return box;
      };
      const part = (named: string, complaint: string): Phaser.GameObjects.GameObject => {
        const parts = (found().object as Partial<Phaser.GameObjects.Container>).list;
        const inside = Array.isArray(parts) ? parts.find((one) => one.name === named) : undefined;
        if (inside === undefined) throw new Error(complaint);
        return inside;
      };
      return {
        standing: object !== undefined,
        count: all.length,
        text: (object as Phaser.GameObjects.Text | undefined)?.text,
        dimmed: data('dimmed') as boolean | undefined,
        selected: data('selected') as boolean | undefined,
        card: object === undefined ? undefined : (data('card') as string),
        reference: data('reference') as { kind: string; id: string } | undefined,
        shows: answer(
          () =>
            (found().object as Partial<Phaser.GameObjects.Components.Visible>).visible as boolean,
        ),
        fill: answer(() => (found().object as Partial<Phaser.GameObjects.Shape>).fillColor),
        place: answer(() => {
          const at = matrix();
          return { x: at.tx, y: at.ty };
        }),
        ringed: answer(() => {
          const ring = part('ring', `${name} is no card face`);
          return (ring as Phaser.GameObjects.GameObject & { visible: boolean }).visible;
        }),
        names: answer(() => {
          const { camera } = found();
          const drawn = (data('names') as Name[] | undefined) ?? [];
          if (drawn.length === 0) return [];
          const at = matrix();
          return drawn.map(({ x, y, height, reference }) => {
            const middle = at.transformPoint(x, y);
            const shown = onPage(camera, middle.x, middle.y);
            return { spot: { x: shown.x, y: shown.y, height: height * shown.unit }, reference };
          });
        }),
        onScreen: answer(() => {
          const box = bounds();
          return onPage(found().camera, box.centerX, box.centerY);
        }),
        kindLabelOnScreen: answer(() => {
          const label = part(
            'kind-label',
            `${name} wears no kind label`,
          ) as Phaser.GameObjects.Text;
          const middle = matrix().transformPoint(
            label.x + (0.5 - label.originX) * label.width,
            label.y + (0.5 - label.originY) * label.height,
          );
          const shown = onPage(found().camera, middle.x, middle.y);
          return { x: shown.x, y: shown.y, height: label.height * shown.unit };
        }),
        boundsOnScreen: answer(() => {
          const box = bounds();
          const corner = onPage(found().camera, box.x, box.y);
          return {
            x: corner.x,
            y: corner.y,
            width: box.width * corner.unit,
            height: box.height * corner.unit,
          };
        }),
        across: answer(() => {
          const box = bounds();
          return { left: box.left, right: box.right, middle: box.centerX };
        }),
      };
    };
  });
}

/** What the page answers of one name, and nothing on a page `readNames` never reached. */
function asked(page: Page, name: string): Promise<PageReading | undefined> {
  return page.evaluate((target) => window.readName?.(target), name);
}

/** What one name reads, in one question to the page. */
export async function reading(page: Page, name: string): Promise<Reading> {
  return readingOf(name, await asked(page, name));
}

/**
 * The chronicle kept as the save the next page this one loads finds, beside a new campaign on the
 * first civilization; a save the reading would refuse throws here.
 */
export async function plant(page: Page, save: ChronicleSave): Promise<void> {
  await kept(page, writeSave(CATALOGUE, freshCampaign(CATALOGUE), save));
}

/**
 * The campaign kept as the save the next page this one loads finds, with no chronicle beside it; a
 * save the reading would refuse throws here.
 */
export async function plantCampaign(page: Page, campaign: Campaign): Promise<void> {
  await kept(page, writeSave(CATALOGUE, campaign));
}

/** The bindings kept as the ones the pages this one loads from now on find, the wheel as it began. */
export async function plantControls(page: Page, bindings: Bindings): Promise<void> {
  await page.addInitScript(
    ({ entry, kept }) => {
      window.localStorage.setItem(entry, kept);
    },
    { entry: STORED, kept: serialiseControls(bindings, UPRIGHT) },
  );
}

/** What the browser keeps under the entry right now, and nothing where it keeps nothing. */
export function storedUnder(page: Page, entry: string): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), entry);
}

/** The save the game keeps, read as the game reads it; a game that keeps none throws here. */
export async function heldSave(page: Page): Promise<SaveRead> {
  const saved = await storedUnder(page, SAVE_ENTRY);
  if (saved === null) throw new Error('the game keeps no save');
  return readSave(CATALOGUE, saved);
}

/** The save waited for until it holds the campaign handed, and a drawn frame after. */
export async function saved(page: Page, campaign: Campaign): Promise<void> {
  await expect
    .poll(async () => (await heldSave(page).catch(() => undefined))?.campaign)
    .toEqual(campaign);
  await rested(page);
}

/**
 * A left click on the named object, the save waited for until it holds the campaign `move` makes of
 * the one handed: the campaign the save now holds.
 */
export async function pressed(
  page: Page,
  name: string,
  campaign: Campaign,
  move: (campaign: Campaign) => Campaign,
): Promise<Campaign> {
  const moved = move(campaign);
  const at = await onScreen(page, name);
  await page.mouse.click(at.x, at.y);
  await saved(page, moved);
  return moved;
}

/** The text kept as the save the next page this one loads finds; a page after it finds what play left. */
async function kept(page: Page, text: string): Promise<void> {
  await page.addInitScript(
    ({ entry, saved, mark }) => {
      // An init script runs again at every load of the page, and would write over what play kept.
      if (window.sessionStorage.getItem(mark) !== null) return;
      window.sessionStorage.setItem(mark, '');
      window.localStorage.setItem(entry, saved);
    },
    { entry: SAVE_ENTRY, saved: text, mark: `planted-${randomUUID()}` },
  );
}

/** Waits for the campaign screen to stand, the navbar pressable on it. */
export async function campaignShown(page: Page): Promise<void> {
  await page.waitForFunction(() => window.game?.scene.isActive('campaign') === true);
  await expect.poll(() => standing(page, 'navbar-launch')).toBe(true);
  await rested(page);
}

/** The collection screen the navbar opens from the campaign screen a boot stands on. */
export async function collectionOpened(page: Page): Promise<void> {
  await campaignShown(page);
  await click(page, 'navbar-collection');
  await expect.poll(() => standing(page, 'collection-mode')).toBe(true);
  await rested(page);
}

/** The collection screen the navbar opens from the campaign screen a boot of the bare address stands on. */
export async function openCollection(page: Page): Promise<void> {
  await readNames(page);
  await page.goto('/');
  await collectionOpened(page);
}

/** The deck editing mode a press on the civilization's pile opens, and a drawn frame after it. */
export async function pilePressed(page: Page, civilization: string): Promise<void> {
  await click(page, `collection-civilization-${civilization}`);
  await expect.poll(() => standing(page, 'deck-editing-mode')).toBe(true);
  await rested(page);
}

/** Chronicle pressed on the navbar standing, and the launch screen it opens waited for. */
export async function chronicleButton(page: Page): Promise<void> {
  await click(page, 'navbar-launch');
  await expect.poll(() => standing(page, 'launch-button')).toBe(true);
  await rested(page);
}

/** Launch pressed on the launch screen standing, and the chronicle screen it raises waited for, one hand laid out on it. */
export async function launchedFromScreen(page: Page): Promise<void> {
  await rested(page);
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await expect.poll(() => counted(page, 'hand-0')).toBe(1);
}

/** The launch screen Chronicle opens from the campaign screen of a bare boot. */
export async function openLaunch(page: Page): Promise<void> {
  await readNames(page);
  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
}

/** Opens the chronicle the save holds straight, as the address word `continue` does. */
export async function continued(page: Page): Promise<void> {
  await page.goto('/?continue=1');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
}

/**
 * Opens the chronicle as the save the boot finds, on the first region and civilization the
 * catalogue lists, and closes the capstone's window every resumed chronicle opens under.
 */
export async function openSaved(page: Page, chronicle: Chronicle): Promise<void> {
  const { region, civilization } = firstsOf();
  await readNames(page);
  await plant(page, { chronicle, region, civilization });
  await continued(page);
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

export async function onScreen(page: Page, name: string): Promise<OnScreen> {
  return (await reading(page, name)).onScreen;
}

/** What an entry names, in its order, laid out as a run on a measure of one to the character. */
export function namedIn(entry: string): Reference[] {
  const measure = (content: string): number => content.length;
  const metrics = { width: Number.POSITIVE_INFINITY, glyph: 1, bearing: 0, space: 1 };
  return layOutRun(entry, measure, metrics, referenceName).names.map((name) => name.reference);
}

/**
 * Where a name the named face's rules entry draws sits on the page, the first it draws at 0, and how
 * tall its line stands there.
 */
export async function nameOnScreen(page: Page, face: string, at = 0): Promise<Spot> {
  return nameAt(face, await asked(page, face), at);
}

/**
 * The first name of the first card of the hand, read once the card has come to rest lifted under the
 * pointer: the lift carries the name up off where it lay.
 */
export async function liftedName(
  page: Page,
  lying: { x: number; y: number },
): Promise<{ x: number; y: number }> {
  let name = lying;
  await expect
    .poll(async () => {
      const was = await nameOnScreen(page, 'hand-0');
      await rested(page);
      name = await nameOnScreen(page, 'hand-0');
      return name.y < lying.y && name.y === was.y;
    })
    .toBe(true);
  return name;
}

/** Where the named face's kind label sits on the page, and how tall it stands there. */
export async function kindLabelOnScreen(page: Page, face: string): Promise<Spot> {
  return (await reading(page, face)).kindLabelOnScreen;
}

/** The cursor the page shows over the canvas. */
export function cursorOverCanvas(page: Page): Promise<string> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.style.cursor);
}

/** The cursor the pointer shows moved to this point, a drawn frame after. */
export async function cursorAt(page: Page, at: { x: number; y: number }): Promise<string> {
  await page.mouse.move(at.x, at.y);
  await rested(page);
  return cursorOverCanvas(page);
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

/** What the named text reads, and nothing where none of that name stands. */
export async function textOf(page: Page, name: string): Promise<string | undefined> {
  return (await reading(page, name)).text;
}

/** Whether an object of that name stands on any running scene. */
export async function standing(page: Page, name: string): Promise<boolean> {
  return (await reading(page, name)).standing;
}

/**
 * Which card the named face stands, and nothing where no such face is up: a browse's cards and the
 * card shown large each carry theirs.
 */
export async function cardOnFace(page: Page, name: string): Promise<string | undefined> {
  return (await reading(page, name)).card;
}

/**
 * What the named card of a thing a name names stands, by its kind and id, and nothing where no such
 * card is up: a small card and a card shown large each carry theirs.
 */
export async function referenceOnFace(
  page: Page,
  name: string,
): Promise<{ kind: string; id: string } | undefined> {
  return (await reading(page, name)).reference;
}

/** What the named card a name raised stands: a card by its face, any other thing by its reference. */
export async function namedOn(
  page: Page,
  name: string,
): Promise<{ kind: string; id: string } | undefined> {
  const { card, reference } = await reading(page, name);
  return card === undefined ? reference : { kind: 'card', id: card };
}

/** Whether the named card face wears the ring: every one carries it, shown while it is selected. */
export async function ringed(page: Page, name: string): Promise<boolean> {
  return (await reading(page, name)).ringed;
}

/** Whether the named object is shown; what a mode raises stands there hidden while it is off. */
export async function shows(page: Page, name: string): Promise<boolean> {
  return (await reading(page, name)).shows;
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
export async function counted(page: Page, name: string): Promise<number> {
  return (await reading(page, name)).count;
}

/** What one name reads; a reading the name cannot give throws where it is read. */
export type Reading = {
  readonly standing: boolean;
  readonly count: number;
  readonly text: string | undefined;
  readonly dimmed: boolean | undefined;
  /** Whether a launch screen's option stands selected. */
  readonly selected: boolean | undefined;
  readonly card: string | undefined;
  /** What the card of a thing a name names stands, by its kind and id. */
  readonly reference: { kind: string; id: string } | undefined;
  readonly shows: boolean;
  /** What the object is painted; an object that carries no fill answers nothing. */
  readonly fill: number | undefined;
  /** Where the object stands in the design space: the point it is drawn about, a face's bottom centre. */
  readonly place: { x: number; y: number };
  readonly ringed: boolean;
  /** Whether the face's rules entry draws a name. */
  readonly drawsName: boolean;
  /** What each name the face's rules entry draws names, in the order it draws them. */
  readonly references: readonly Reference[];
  readonly onScreen: OnScreen;
  readonly nameOnScreen: Spot;
  readonly kindLabelOnScreen: Spot;
  /** Where the object's bounds stand on the page. */
  readonly boundsOnScreen: Frame;
  readonly across: Across;
};

/** The reading of what the page answered of a name; a page `readNames` never reached answers nothing. */
function readingOf(name: string, answered: PageReading | undefined): Reading {
  return {
    standing: answered?.standing ?? false,
    get count() {
      if (answered === undefined) throw new Error('no chronicle was opened on this page');
      return answered.count;
    },
    text: answered?.text,
    dimmed: answered?.dimmed,
    selected: answered?.selected,
    card: answered?.card,
    reference: answered?.reference,
    get shows() {
      return owed(name, answered?.shows);
    },
    get fill() {
      return owed(name, answered?.fill);
    },
    get place() {
      return owed(name, answered?.place);
    },
    get ringed() {
      return owed(name, answered?.ringed);
    },
    get drawsName() {
      return owed(name, answered?.names).length > 0;
    },
    get references() {
      return owed(name, answered?.names).map(({ reference }) => reference);
    },
    get onScreen() {
      return owed(name, answered?.onScreen);
    },
    get nameOnScreen() {
      return nameAt(name, answered, 0);
    },
    get kindLabelOnScreen() {
      return owed(name, answered?.kindLabelOnScreen);
    },
    get boundsOnScreen() {
      return owed(name, answered?.boundsOnScreen);
    },
    get across() {
      return owed(name, answered?.across);
    },
  };
}

/** The value the page answered of a reading of the name; what it complained of throws. */
function owed<T>(name: string, answer: Answer<T> | undefined): T {
  if (answer === undefined) throw new Error(`nothing named ${name} stands on the screen`);
  if ('complaint' in answer) throw new Error(answer.complaint);
  return answer.value;
}

/** Where the name at that place among those the face draws sits on the page. */
function nameAt(face: string, answered: PageReading | undefined, at: number): Spot {
  const drawn = owed(face, answered?.names)[at];
  if (drawn === undefined) throw new Error(`${face} draws no name at ${at}`);
  return drawn.spot;
}

/**
 * Every name handed read in one question to the page, and the reading of one of them; a name not
 * handed throws.
 */
export async function readings(
  page: Page,
  names: readonly string[],
): Promise<(name: string) => Reading> {
  const answers = await page.evaluate(
    (targets) => targets.map((target) => window.readName?.(target)),
    names,
  );
  const read = new Map(names.map((name, at) => [name, readingOf(name, answers[at])]));
  return (name) => {
    const reading = read.get(name);
    if (reading === undefined) throw new Error(`${name} was not read`);
    return reading;
  };
}

/** The items in the order their places read on the screen: top down, each line left to right. */
export function readOrder<T>(
  items: readonly T[],
  placeOf: (item: T) => { x: number; y: number },
): T[] {
  return [...items].sort((a, b) => {
    const first = placeOf(a);
    const second = placeOf(b);
    return first.y - second.y || first.x - second.x;
  });
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

/** How far the browse stands scrolled, and how far it can: its panel scrolls by its own `y`. */
export function scrolled(page: Page): Promise<{ offset: number; overflow: number }> {
  return page.evaluate(() => {
    const grid = window.named?.('browse')?.object as Phaser.GameObjects.Container | undefined;
    if (grid === undefined) throw new Error('no browse is open');
    // A y of 0 negated is -0, which `toBe(0)` refuses: adding 0 reads it +0.
    return { offset: -grid.y + 0, overflow: grid.getData('overflow') as number };
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
    case 'hand':
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

/**
 * The chronicle with the first hazard that carries a counter added to its draw pile's top once for
 * each step handed, its counter read that many up from the one it starts at, the last added on top.
 */
export function hazardsAdded(chronicle: Chronicle, steps: readonly number[]): Chronicle {
  const found = Object.entries(CATALOGUE.cards).find(
    ([, card]) => card.kind === 'hazard' && Object.keys(card.counters ?? {}).length > 0,
  );
  if (found === undefined) throw new Error('the catalogue holds no hazard carrying a counter');
  const [hazard, { counters = {} }] = found;
  const [counter] = Object.keys(counters);
  let adding = chronicle;
  for (const step of steps) {
    const set = { [counter]: counters[counter] + step };
    adding = addedToDrawPileTop(CATALOGUE, adding, hazard, set).chronicle;
  }
  return adding;
}

/**
 * How many stacks each pile of `overflowingPiles` holds at least: four lines of a browse, which
 * reach past its frame further than a drag of a spec's travels.
 */
const OVERFLOWING = 32;

/** The stacks a browse lays out of a pile, as the rules read them. */
export function pileStacks(pile: readonly ChronicleCard[]): PileStack[] {
  return pileStacksOf(CATALOGUE, pile, cardName);
}

/**
 * Seed 1's turn 1, settled bare, a hazard added to its draw pile's top at enough readings of its
 * counter to overflow both piles, and turns ended until those drawn overflow the discard pile.
 */
export function overflowingPiles(): Chronicle {
  let chronicle = hazardsAdded(
    settledOn(1),
    Array.from({ length: 2 * OVERFLOWING }, (_, reading) => reading),
  );
  while (pileStacks(chronicle.discardPile).length < OVERFLOWING) {
    if (chronicle.ending !== undefined) throw new Error('the chronicle ends before its piles fill');
    // A hand of hazards striking the city takes its population to none: it gains what they read.
    const read = chronicle.hand.flatMap(({ counters }) => Object.values(counters));
    const fed = gained(chronicle, { food: read.reduce((sum, value) => sum + value, 0) });
    chronicle = endedTurn(fed.chronicle);
  }
  if (pileStacks(chronicle.drawPile).length < OVERFLOWING) {
    throw new Error('the draw pile runs short of stacks before the discard pile fills');
  }
  return chronicle;
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

/** The card the capstone's landing adds, and the building its play builds. */
export const SHELTER = 'shelter';

/**
 * The first seed's capstone landing turn, the shelter in the hand, with a tile beside the city
 * claimed, the shelter's cost gained and a worker entered on that tile, and the tile: the shelter's
 * aim admits it.
 */
export function landed(): { chronicle: Chronicle; tile: TileCoords } {
  const card = cardOf(CATALOGUE, SHELTER);
  const aim = aimOf(card);
  if (aim.aim !== 'tile') throw new Error(`${SHELTER} is aimed at no tile`);
  return firstSeed('lands its capstone with a shelter to build beside the city', (seed) => {
    let turned = settledOn(seed);
    while (turned.turn < turned.timeline.capstone.turn && turned.ending === undefined) {
      turned = endedTurn(turned);
    }
    if (turned.ending !== undefined || !idsOf(turned.hand).includes(SHELTER)) return undefined;

    for (const tile of neighbours(cityTileOf(turned))) {
      const claimed = outcome(apply(CATALOGUE, turned, { type: 'claim', tile }));
      if (claimed === turned) continue;
      const paid = gained(claimed, card.cost).chronicle;
      const worked = entered(CATALOGUE, paid, {
        type: 'worker',
        faction: 'player',
        tile,
      }).chronicle;
      const chronicle = charted(CATALOGUE, worked);
      if (!playable(refusalOf(CATALOGUE, chronicle, SHELTER))) continue;
      if (admitted(CATALOGUE, chronicle, aim).some((coord) => tileKey(coord) === tileKey(tile))) {
        return { chronicle, tile };
      }
    }
    return undefined;
  });
}

/** A new campaign the win on the first seed's capstone landing has paid into. */
export function wonCampaign(): Campaign {
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  return paidInto(CATALOGUE, freshCampaign(CATALOGUE), won).campaign;
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

/** The card that places the improvement, and the improvement it places. */
export const TRAPPING = 'trapping';

/** The first civilization the catalogue lists, with one copy of the card added to its cards. */
export function withCard(card: CardId): Civilization {
  const first = civilizationOf(CATALOGUE, firstCivilization(CATALOGUE));
  return { ...first, cards: [...first.cards, card] };
}

/**
 * The chronicle with the first tile beside the city made the terrain of the feature Trapping names,
 * that feature and the improvements named placed on it, and a worker entered there.
 */
export function onDeer(
  chronicle: Chronicle,
  improvements: readonly string[],
): { chronicle: Chronicle; tile: TileCoords } {
  const { feature } = improvementKind(CATALOGUE, TRAPPING);
  if (feature === undefined) throw new Error(`${TRAPPING} names no feature`);
  const { terrain } = featureKind(CATALOGUE, feature);
  const [tile] = neighbours(cityTileOf(chronicle));
  let ground =
    tileAt(chronicle.tiles, tile)?.terrain === terrain
      ? unchanged(chronicle)
      : terraformed(CATALOGUE, chronicle, tile, terrain);
  ground = followed(ground, (left) => featurePlaced(CATALOGUE, left, tile, feature));
  for (const improvement of improvements) {
    ground = followed(ground, (left) => improvementPlaced(CATALOGUE, left, tile, improvement));
  }
  const worked = unitEntered(ground.chronicle, { type: 'worker', faction: 'player', tile });
  return { chronicle: worked, tile };
}

/**
 * The tiles that far from the city the camp's unit can stand on with nobody on them, in the order
 * the map lists them.
 */
export function campGround(chronicle: Chronicle, away: number): TileCoords[] {
  const stats = unitKind(CATALOGUE, ageOf(CATALOGUE, chronicle.age).camp.unit);
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
  return textOf(page, 'panel-movement');
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
  return textOf(page, `${name}-title`);
}

/**
 * What the named window's lore reads — a lore is named after the window it stands in — or nothing
 * while that window stands down.
 */
export function loreOf(page: Page, name: string): Promise<string | undefined> {
  return textOf(page, `${name}-lore`);
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
export async function endTurnLabel(page: Page): Promise<string> {
  const label = await textOf(page, 'end-turn-label');
  if (label === undefined) throw new Error('the end-turn button is not on the chronicle screen');
  return label;
}

/** What the named rectangle is painted. */
export async function fillOf(page: Page, name: string): Promise<number | undefined> {
  return (await reading(page, name)).fill;
}

/** Whether the named stack stands dimmed, and nothing where no stack of that name stands. */
export async function stackDimmed(page: Page, name: string): Promise<boolean | undefined> {
  return (await reading(page, name)).dimmed;
}

/** What the end-turn button is painted. */
export function endTurnFill(page: Page): Promise<number | undefined> {
  return fillOf(page, 'end-turn');
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

/** A point on the pile just under its top card's top edge, where neither a name nor the kind label lies. */
export async function pileTop(page: Page, pile: PileKind): Promise<{ x: number; y: number }> {
  const zone = await onScreen(page, pile);
  const height = await page.evaluate((target) => {
    const zone = window.named?.(target)?.object as Phaser.GameObjects.Zone | undefined;
    if (zone === undefined) throw new Error(`there is no ${target} on the chronicle screen`);
    return zone.height;
  }, pile);
  return { x: zone.x, y: zone.y - (height / 2 - 12) * zone.unit };
}

/** Opens a pile's browse by a right click on its top, and waits for its stacks to be laid out. */
export async function browse(page: Page, pile: PileKind): Promise<void> {
  const at = await pileTop(page, pile);
  await page.mouse.click(at.x, at.y, { button: 'right' });
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
