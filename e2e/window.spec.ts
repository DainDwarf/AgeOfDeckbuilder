import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { offered } from '../src/rules/schedule';
import {
  backingLeaves,
  backingOf,
  browse,
  cameraCuts,
  campaignShown,
  canvasOf,
  DESIGN_WINDOW,
  type Frame,
  firstDealt,
  mapFrame,
  openSaved,
  overflowingPiles,
  readings,
  readNames,
  resizedTo,
  rested,
  restedOnDeal,
  settledOn,
  WIDE,
  watch,
} from './chronicle-screen';

/** The window moved to a monitor of that density: its CSS size stands and no resize fires. */
async function hoppedTo(page: Page, ratio: number, colorScheme: 'dark' | 'light'): Promise<void> {
  const was = await backingOf(page);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setDeviceMetricsOverride', {
    ...DESIGN_WINDOW,
    deviceScaleFactor: ratio,
    mobile: false,
  });
  // The override moves the ratio and tells no media query: a real monitor's change does. Any media
  // emulated anew has Chromium read every query again, so `colorScheme` has to differ hop to hop.
  await page.emulateMedia({ colorScheme });
  await backingLeaves(page, was);
}

/** The pieces of the chronicle screen laid along its edges, where they stand on the page. */
const EDGED = [
  'band',
  'resource-bar',
  'menu-button',
  'icons-button',
  'draw-pile',
  'end-turn',
  'exhaust-pile',
];

/**
 * Where the chronicle screen's pieces stand on the page, the first card of the hand among them, and
 * how many CSS pixels a unit of the screen is drawn across.
 */
async function laidOut(
  page: Page,
): Promise<{ pieces: Record<string, Frame>; card: Frame; unit: number; map: Frame }> {
  const seen = await readings(page, [...EDGED, 'hand-0']);
  const card = seen('hand-0');
  return {
    pieces: Object.fromEntries(EDGED.map((name) => [name, seen(name).boundsOnScreen])),
    card: card.boundsOnScreen,
    unit: card.onScreen.unit,
    map: await mapFrame(page),
  };
}

/** How far a frame on the page stands in from the right of a window that wide. */
function fromTheRight(frame: Frame, width: number): number {
  return width - (frame.x + frame.width);
}

/** Where the overlay's scrim standing covers the page. */
function scrimOnPage(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const overlay = window.game?.scene.getScene('overlay');
    if (overlay === undefined || overlay === null) throw new Error('the overlay is not running');
    const layer = overlay.children.getByName('scrim') as Phaser.GameObjects.Layer | null;
    const scrim = layer?.list.find(
      (object): object is Phaser.GameObjects.Rectangle =>
        object.type === 'Rectangle' && (object as Phaser.GameObjects.Rectangle).visible,
    );
    if (scrim === undefined) throw new Error('no scrim stands on the overlay');
    const camera = overlay.cameras.main;
    const canvas = overlay.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const unit = rect.width / canvas.width;
    const onPage = (x: number, y: number): { x: number; y: number } => ({
      x: rect.left + (camera.x + (x - camera.worldView.x) * camera.zoom) * unit,
      y: rect.top + (camera.y + (y - camera.worldView.y) * camera.zoom) * unit,
    });
    const from = onPage(scrim.x, scrim.y);
    const to = onPage(scrim.x + scrim.width, scrim.y + scrim.height);
    return { x: from.x, y: from.y, width: to.x - from.x, height: to.y - from.y };
  });
}

/** A frame on the page expected to cover the whole of a window that size. */
function expectCovering(frame: Frame, { width, height }: { width: number; height: number }): void {
  expect(frame.x).toBeLessThanOrEqual(0);
  expect(frame.y).toBeLessThanOrEqual(0);
  expect(frame.x + frame.width).toBeGreaterThanOrEqual(width);
  expect(frame.y + frame.height).toBeGreaterThanOrEqual(height);
}

test('the design space follows a window that grows after boot, drawing a window too small at the size that holds 1280 by 720', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize({ width: 640, height: 360 });
  await openSaved(page, settledOn(1));

  const booted = await backingOf(page);
  expect(booted.width).toBe(booted.onWidth);
  expect(booted.height).toBe(booted.onHeight);
  const small = await laidOut(page);

  await resizedTo(page, DESIGN_WINDOW);

  const grown = await backingOf(page);
  expect(grown.width).toBeGreaterThan(booted.width);
  expect(grown.width).toBe(grown.onWidth);
  expect(grown.height).toBe(grown.onHeight);
  const full = await laidOut(page);

  expect(small.unit).toBeCloseTo(full.unit / 2, 6);
  for (const name of EDGED) {
    const at = small.pieces[name];
    const was = full.pieces[name];
    expect(at.x).toBeCloseTo(was.x / 2, 1);
    expect(at.y).toBeCloseTo(was.y / 2, 1);
    expect(at.width).toBeCloseTo(was.width / 2, 1);
  }
  expect(small.map.height).toBeCloseTo(full.map.height / 2, 1);

  expect(problems).toEqual([]);
});

test('the design space follows a window moved to a monitor of another pixel density', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, settledOn(1));

  await hoppedTo(page, 1.5, 'dark');
  const first = await backingOf(page);
  expect(first.width).toBe(first.onWidth);
  expect(first.height).toBe(first.onHeight);

  await hoppedTo(page, 2, 'light');
  const second = await backingOf(page);
  expect(second.width).toBe(second.onWidth);
  expect(second.height).toBe(second.onHeight);

  expect(problems).toEqual([]);
});

test('on a wider window the chronicle screen takes its shape: the bar centred along its top at its size, the band a tray centred along its bottom, the Menu button and the Icons button at its corner, the map across it, a card at its size', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, settledOn(1));
  const today = await laidOut(page);

  await resizedTo(page, WIDE);
  const wide = await laidOut(page);
  const { pieces } = wide;

  const { band } = pieces;
  expect(band.x).toBeGreaterThan(0);
  expect(band.x + band.width).toBeLessThan(WIDE.width);
  expect(band.x + band.width / 2).toBeCloseTo(WIDE.width / 2, 3);
  expect(band.y + band.height).toBeGreaterThanOrEqual(WIDE.height);
  const bar = pieces['resource-bar'];
  expect(bar.y).toBeCloseTo(0, 3);
  expect(bar.x + bar.width / 2).toBeCloseTo(WIDE.width / 2, 3);
  expect(bar.width).toBeCloseTo(today.pieces['resource-bar'].width, 3);
  for (const button of ['menu-button', 'icons-button']) {
    expect(fromTheRight(pieces[button], WIDE.width), button).toBeCloseTo(
      fromTheRight(today.pieces[button], DESIGN_WINDOW.width),
      3,
    );
  }

  expect(wide.unit).toBeCloseTo(1, 6);
  expect(wide.card.width).toBeCloseTo(today.card.width, 3);
  expect(wide.map.x).toBeCloseTo(0, 3);
  expect(wide.map.width).toBeCloseTo(WIDE.width, 3);

  const cut = await cameraCuts(page);
  for (const key of ['ui', 'overlay', 'menu', 'console']) {
    expect(cut[key]).toEqual({ x: 0, y: 0, ...WIDE });
  }

  expect(problems).toEqual([]);
});

test('on a taller window the map’s frame grows by what the window grows, and no page is left bare', async ({
  page,
}) => {
  const problems = watch(page);
  const tall = { width: DESIGN_WINDOW.width, height: 900 };

  await page.setViewportSize(tall);
  await openSaved(page, settledOn(1));
  const grown = await mapFrame(page);
  expectCovering(await canvasOf(page), tall);

  await resizedTo(page, DESIGN_WINDOW);
  const today = await mapFrame(page);

  expect(grown.height - today.height).toBeCloseTo(tall.height - DESIGN_WINDOW.height, 3);

  expect(problems).toEqual([]);
});

test('a browse on a wider window keeps its columns centred under its title, the scrim over the whole window', async ({
  page,
}) => {
  const problems = watch(page);

  /** How far the title's middle and the first line's stand from the middle of a window that wide. */
  const offMiddle = async (width: number): Promise<{ title: number; line: number }> => {
    const seen = await readings(page, ['browse-title', 'browse-card-0', 'browse-card-7']);
    const title = seen('browse-title').boundsOnScreen;
    const first = seen('browse-card-0').placeOnScreen.x;
    const last = seen('browse-card-7').placeOnScreen.x;
    return { title: title.x + title.width / 2 - width / 2, line: (first + last) / 2 - width / 2 };
  };

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, overflowingPiles());
  await browse(page, 'draw-pile');
  await rested(page);
  const today = await offMiddle(DESIGN_WINDOW.width);

  await resizedTo(page, WIDE);
  const wide = await offMiddle(WIDE.width);
  expect(wide.title).toBeCloseTo(today.title, 3);
  expect(wide.line).toBeCloseTo(today.line, 3);

  expectCovering(await scrimOnPage(page), WIDE);

  expect(problems).toEqual([]);
});

test('the deal window on a wider window stands centred, the scrim over the whole window', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = firstDealt(1);
  const [deal] = opened.deals;
  if (deal === undefined) throw new Error('the chronicle waits on no deal');
  const entries = offered(CATALOGUE, opened, deal).length;

  await page.setViewportSize(WIDE);
  await openSaved(page, opened);
  await restedOnDeal(page);

  const lastEntry = `deal-card-${entries - 1}`;
  const seen = await readings(page, ['deal-title', 'deal-card-0', lastEntry]);
  const middle = WIDE.width / 2;
  const title = seen('deal-title').boundsOnScreen;
  expect(title.x + title.width / 2).toBeCloseTo(middle, 0);
  const first = seen('deal-card-0').boundsOnScreen;
  const last = seen(lastEntry).boundsOnScreen;
  expect((first.x + last.x + last.width) / 2).toBeCloseTo(middle, 0);

  expectCovering(await scrimOnPage(page), WIDE);

  expect(problems).toEqual([]);
});

test('the campaign screen on a taller window stands one 1280 by 720 design as large as the window allows, centred, the page bare above and below', async ({
  page,
}) => {
  const problems = watch(page);
  const taller = { width: 1920, height: 1200 };
  const drawn = {
    width: taller.width,
    height: (taller.width * DESIGN_WINDOW.height) / DESIGN_WINDOW.width,
  };

  await page.setViewportSize(taller);
  await readNames(page);
  await page.goto('/');
  await campaignShown(page);

  const cut = await cameraCuts(page);
  expect(Object.keys(cut).sort()).toEqual(['campaign', 'console', 'menu', 'overlay']);
  for (const frame of Object.values(cut)) {
    expect(frame).toEqual({ x: 0, y: (taller.height - drawn.height) / 2, ...drawn });
  }

  expect(problems).toEqual([]);
});
