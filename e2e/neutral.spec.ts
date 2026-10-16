import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf, cardOf, neutralOf, neutralWorkerKind, unitKind } from '../src/rules/catalogue';
import { apply, byHand, declaresWar, outcome, type UnitCommand } from '../src/rules/chronicle';
import { bordered, warDeclared, yielded } from '../src/rules/city';
import {
  movementCost,
  neighbours,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
} from '../src/rules/map';
import { neutralBuilding } from '../src/rules/map-kinds';
import { chartedAt, inSight } from '../src/rules/sight';
import { followed, walked } from '../src/rules/stages';
import { type Chronicle, type CityFaction, holderOf } from '../src/rules/state';
import { relationsOf, standsOn, unitAt } from '../src/rules/units';
import { tileYield } from '../src/rules/yields';
import { LOOK } from '../src/ui/look';
import { captureLore } from '../src/ui/lore';
import { buildingName, text, unitName } from '../src/ui/text';
import {
  admits,
  aimed,
  aimLine,
  budget,
  campaignWith,
  campBeside,
  chronicleOf,
  click,
  consoleKey,
  disembarkingAt,
  dragOut,
  EMBARK,
  endedTurn,
  endTurn,
  enter,
  firstSeed,
  idsOf,
  inside,
  litTiles,
  mapFrame,
  marksIn,
  neutralAge,
  neutralCampaign,
  onScreen,
  openSaved,
  paidFor,
  playedOn,
  playedOut,
  readings,
  rested,
  restedOnDeal,
  ringedTile,
  settledOn,
  shownCard,
  sitesOf,
  standing,
  stoppedTurn,
  take,
  textOf,
  tileOnScreen,
  unitEntered,
  WARRIOR,
  watch,
} from './chronicle-screen';

/** The warning a step onto a tile the neutral holds raises at peace. */
const WARNING = 'move-warning';

const AGE = neutralAge();

const CAMPAIGN = neutralCampaign();

/**
 * Carries the map by right-button drags from the middle of its frame, a third of the frame at most
 * each, until the tile stands in the frame's middle half.
 */
async function broughtIn(page: Page, coord: TileCoords): Promise<void> {
  const frame = await mapFrame(page);
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  const half = {
    x: frame.x + frame.width / 4,
    y: frame.y + frame.height / 4,
    width: frame.width / 2,
    height: frame.height / 2,
  };
  const step = (off: number, span: number): number => Math.max(-span / 3, Math.min(span / 3, off));
  for (let pass = 0; pass < 6; pass++) {
    const at = await tileOnScreen(page, coord);
    if (inside(at, half)) return;
    const to = {
      x: middle.x + step(middle.x - at.x, frame.width),
      y: middle.y + step(middle.y - at.y, frame.height),
    };
    await page.mouse.move(middle.x, middle.y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move((middle.x + to.x) / 2, (middle.y + to.y) / 2, { steps: 5 });
    await page.mouse.move(to.x, to.y, { steps: 5 });
    await page.mouse.up({ button: 'right' });
    await rested(page);
  }
  throw new Error(`the map never carried ${tileKey(coord)} into the middle of its frame`);
}

test('the map draws the neutral’s city once the uncharted veil is off, among the camps, the sites and the city, and its tile inspected heads its building card with its name', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = seedOneFreed();
  const { neutral } = opened;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const building = neutralBuilding(CATALOGUE, ageOf(CATALOGUE, AGE), `the age ${AGE}`);
  const camp = ageOf(CATALOGUE, opened.age).camp.building;
  const camps = opened.tiles.filter((tile) => tile.building === camp);
  const mark = `building-${tileKey(neutral.city)}`;
  expect(opened.age).toBe(AGE);

  await openSaved(page, opened, CAMPAIGN);
  expect(await standing(page, mark)).toBe(false);

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  expect(await standing(page, mark)).toBe(true);
  // The whole disc drawn, the buildings on it are the camps, the sites, the neutral's and the city's.
  expect(await marksIn(page, 'buildings')).toBe(camps.length + sitesOf(opened).length + 2);

  await broughtIn(page, neutral.city);
  const at = await tileOnScreen(page, neutral.city);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(await textOf(page, 'panel-name')).toBe(buildingName(building));

  expect(problems).toEqual([]);
});

/**
 * The chronicle the turns from this one leave once no unit stands on the neutral's city's tile, the
 * worker it opens with standing there until it steps off; nothing where the chronicle ends, the
 * neutral falls or the tenth turn passes first.
 */
function cityFreed(chronicle: Chronicle): Chronicle | undefined {
  let freeing = chronicle;
  while (freeing.ending === undefined && freeing.turn <= 10) {
    const { neutral } = freeing;
    if (neutral === undefined) return undefined;
    if (unitAt(freeing.units, neutral.city) === undefined) return freeing;
    freeing = endedTurn(freeing);
  }
  return undefined;
}

/** Seed 1's turn on the campaign once the neutral's city's tile is free. */
function seedOneFreed(): Chronicle {
  const freed = cityFreed(settledOn(1, [], CAMPAIGN));
  if (freed === undefined) throw new Error('no turn of seed 1 frees the neutral’s city’s tile');
  return freed;
}

/** The kind of the unit the neutral's script enters on this chronicle. */
function kindEntered(chronicle: Chronicle): string {
  const { script, ratio } = neutralOf(CATALOGUE, AGE);
  const card = script.enters(CATALOGUE, chronicle, ratio);
  const kind = ratio.find((row) => row.card === card)?.kind;
  if (kind === undefined) throw new Error(`the neutral of the age ${AGE} enters no unit`);
  return kind;
}

/** The colours the named unit's mark is filled in, its hull's among them where it stands embarked. */
function unitFills(page: Page, name: string): Promise<number[]> {
  return page.evaluate((target) => {
    const marker = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (marker === undefined) throw new Error(`nothing named ${target} stands on the screen`);
    const [mark] = marker.list as Phaser.GameObjects.Container[];
    return (mark.list as Phaser.GameObjects.Polygon[]).map((shape) => shape.fillColor);
  }, name);
}

test('a unit of the neutral’s entered on its city stands on the map in the neutral’s colour, and its tile inspected heads its unit card with its kind’s name', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = seedOneFreed();
  const { neutral } = opened;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const kind = kindEntered(opened);
  const guarded = unitEntered(opened, {
    type: kind,
    faction: 'neutral',
    script: neutralOf(CATALOGUE, AGE).scripts.guard,
    tile: neutral.city,
  });
  const mark = `unit-${tileKey(neutral.city)}`;

  await openSaved(page, guarded, CAMPAIGN);
  await consoleKey(page);
  await enter(page, 'uncharted');
  await enter(page, 'fog');
  await consoleKey(page);
  await broughtIn(page, neutral.city);

  expect(await unitFills(page, mark)).toEqual([LOOK.neutral]);

  const at = await tileOnScreen(page, neutral.city);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  expect(await textOf(page, 'panel-name')).toBe(unitName(kind));

  expect(problems).toEqual([]);
});

/** How many rings of the map's border stand stroked in each colour, by the colour's value. */
function ringsByColour(page: Page): Promise<Record<number, number>> {
  return page.evaluate(() => {
    const border = window.named?.('border')?.object as Phaser.GameObjects.Layer | undefined;
    if (border === undefined) throw new Error('there is no border on the chronicle screen');
    const counts: Record<number, number> = {};
    for (const ring of border.list as Phaser.GameObjects.Polygon[]) {
      counts[ring.strokeColor] = (counts[ring.strokeColor] ?? 0) + 1;
    }
    return counts;
  });
}

/** The colour a city's border is drawn in. */
function borderColour(holder: CityFaction): number {
  switch (holder) {
    case 'player':
      return LOOK.civilization;
    case 'neutral':
      return LOOK.neutral;
  }
}

/** How many rings each colour stands for over the holders named, by the colour's value. */
function colouredBy(holders: readonly (CityFaction | undefined)[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const holder of holders) {
    if (holder === undefined) continue;
    const colour = borderColour(holder);
    counts[colour] = (counts[colour] ?? 0) + 1;
  }
  return counts;
}

/** The chronicle the turns from this one leave once the neutral's city has claimed a tile. */
function neutralClaimed(chronicle: Chronicle): Chronicle {
  let claiming = chronicle;
  while ((claiming.neutral?.held.length ?? 0) < 2) {
    if (claiming.ending !== undefined) {
      throw new Error(
        `the chronicle ends on turn ${claiming.turn} before the neutral claims a tile`,
      );
    }
    if (claiming.turn > 10) throw new Error('the neutral claims no tile by turn 10');
    claiming = endedTurn(claiming);
  }
  return claiming;
}

test('the map rings every tile the neutral holds in the neutral’s colour beside the city’s own border, a tile drawn in fog wearing the ring it wore when last seen', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1, [], CAMPAIGN);
  const [, first] = neutralClaimed(opened).neutral?.held ?? [];
  if (first === undefined) throw new Error('seed 1 opens with no neutral');
  const claimed = neutralClaimed(chartedAt(CATALOGUE, opened, first));
  const { neutral } = claimed;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const seen = inSight(CATALOGUE, claimed);
  const kept = new Map(claimed.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
  const worn = claimed.tiles.map((tile) => {
    const snapshot = kept.get(tileKey(tile));
    return seen.has(tileKey(tile)) || snapshot === undefined
      ? holderOf(claimed, tile)
      : snapshot.holder;
  });
  expect(holderOf(claimed, first)).toBe('neutral');
  expect(seen.has(tileKey(first))).toBe(false);
  expect(kept.get(tileKey(first))?.holder).toBeUndefined();

  await openSaved(page, claimed, CAMPAIGN);
  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);
  await rested(page);

  expect(await ringsByColour(page)).toEqual(colouredBy(worn));

  await consoleKey(page);
  await enter(page, 'fog');
  await consoleKey(page);
  await rested(page);

  expect(await ringsByColour(page)).toEqual(
    colouredBy([
      ...claimed.held.map((): CityFaction => 'player'),
      ...neutral.held.map((): CityFaction => 'neutral'),
    ]),
  );
  expect(problems).toEqual([]);
});

/**
 * Seed 1's turn with the neutral's city's tile free and a warrior of the player's entered on the
 * first tile beside it that its move lands it on the city's tile from, and the command that lands it
 * there.
 */
function besideTheNeutralCity(): { chronicle: Chronicle; move: UnitCommand; from: TileCoords } {
  const opened = seedOneFreed();
  const { neutral } = opened;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  for (const from of neighbours(neutral.city)) {
    if (tileAt(opened.tiles, from) === undefined || unitAt(opened.units, from) !== undefined) {
      continue;
    }
    if (holderOf(opened, from) !== undefined) continue;
    const chronicle = unitEntered(opened, { type: WARRIOR, faction: 'player', tile: from });
    const unit = unitAt(chronicle.units, from);
    if (unit === undefined) continue;
    const landsOn = byHand(CATALOGUE, chronicle, unit).landings.some(
      ({ tile }) => tileKey(tile) === tileKey(neutral.city),
    );
    if (landsOn) {
      return { chronicle, move: { type: 'move', unit: unit.id, tile: neutral.city }, from };
    }
  }
  throw new Error('no warrior of the player’s beside the neutral’s city on seed 1 lands on it');
}

test('a unit of the player’s pressed onto the neutral’s city at peace raises the Declare War warning over the map; Back, the back key and a press on the scrim each take it down with nothing moved, the unit selected and lit as it was, and the press gone through lands the unit there with the neutral hostile', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, move, from } = besideTheNeutralCity();
  const landed = outcome(apply(CATALOGUE, chronicle, move));
  const city = tileKey(move.tile);
  expect(declaresWar(CATALOGUE, chronicle, move)).toBe(true);
  expect(relationsOf(landed)).toBe('hostile');
  expect(unitAt(landed.units, move.tile)?.id).toBe(move.unit);

  await openSaved(page, chronicle, CAMPAIGN);
  await broughtIn(page, move.tile);
  const unit = await tileOnScreen(page, from);
  await page.mouse.click(unit.x, unit.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(from));
  const lit = await litTiles(page);
  expect(lit).toContain(city);

  const pressed = async (): Promise<void> => {
    await rested(page);
    const at = await tileOnScreen(page, move.tile);
    await page.mouse.click(at.x, at.y);
    await expect.poll(() => standing(page, WARNING)).toBe(true);
    await rested(page);
  };

  await pressed();
  const seen = await readings(page, [
    `${WARNING}-title`,
    'declare-war.warning',
    `${WARNING}-through-label`,
    `${WARNING}-back-label`,
  ]);
  expect(seen(`${WARNING}-title`).text).toBe(text('declare-war.title'));
  expect(seen('declare-war.warning').text).toBe(text('declare-war.warning'));
  expect(seen(`${WARNING}-through-label`).text).toBe(text('declare-war.move'));
  expect(seen(`${WARNING}-back-label`).text).toBe(text('control.back'));

  const takenDown = async (): Promise<void> => {
    await expect.poll(() => standing(page, WARNING)).toBe(false);
    expect(await chronicleOf(page)).toEqual(chronicle);
    expect(await ringedTile(page)).toBe(tileKey(from));
    expect(await litTiles(page)).toEqual(lit);
  };

  await click(page, `${WARNING}-back`);
  await takenDown();

  await pressed();
  await page.keyboard.press('Escape');
  await takenDown();

  await pressed();
  // The Menu button stands under the scrim, clear of the window's box.
  const scrim = await onScreen(page, 'menu-button');
  await page.mouse.click(scrim.x, scrim.y);
  await takenDown();

  await pressed();
  await click(page, `${WARNING}-through`);
  await playedOut(page);
  expect(await standing(page, WARNING)).toBe(false);
  expect(await chronicleOf(page)).toEqual(landed);

  expect(problems).toEqual([]);
});

/** A new campaign whose deck holds Embark. */
const SAILING = campaignWith([EMBARK]);

/**
 * The first seed's turn with the neutral's city's tile free and a warrior of the player's embarked by
 * Embark beside it, Disembark in hand and paid for, admitting the city's tile; where Disembark lies,
 * and the city's tile.
 */
function offTheNeutralCity(): { chronicle: Chronicle; index: number; city: TileCoords } {
  const warrior = unitKind(CATALOGUE, WARRIOR);
  return firstSeed(
    `frees the neutral’s city with ${EMBARK} in hand beside water beside it`,
    (seed) => {
      const opened = cityFreed(settledOn(seed, [], SAILING));
      const neutral = opened?.neutral;
      if (opened === undefined || neutral === undefined || !idsOf(opened.hand).includes(EMBARK)) {
        return undefined;
      }
      const free = (coord: TileCoords): boolean =>
        unitAt(opened.units, coord) === undefined && holderOf(opened, coord) === undefined;
      for (const water of neighbours(neutral.city)) {
        if (
          !free(water) ||
          movementCost(CATALOGUE, tileAt(opened.tiles, water), true) === undefined
        ) {
          continue;
        }
        for (const bank of neighbours(water)) {
          if (!free(bank) || !standsOn(CATALOGUE, warrior, false, tileAt(opened.tiles, bank))) {
            continue;
          }
          const manned = unitEntered(opened, { type: WARRIOR, faction: 'player', tile: bank });
          const paid = paidFor(manned, EMBARK);
          if (!admits(paid.chronicle, paid.index, water)) continue;
          const disembarking = disembarkingAt(paid, water, neutral.city, SAILING);
          if (disembarking !== undefined) return { ...disembarking, city: neutral.city };
        }
      }
      return undefined;
    },
  );
}

test('a card played at peace that lands a unit of the player’s on the neutral’s city raises the Declare War warning, reading Play; Back leaves the card being aimed with nothing paid, and the press gone through plays it, the unit landed there and the neutral hostile', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, index, city } = offTheNeutralCity();
  const play = { type: 'play', index, aim: 'tile', tile: city } as const;
  const landed = playedOn(chronicle, index, city);
  const warning = 'play-warning';
  expect(declaresWar(CATALOGUE, chronicle, play)).toBe(true);
  expect(relationsOf(landed)).toBe('hostile');
  expect(unitAt(landed.units, city)?.faction).toBe('player');

  await openSaved(page, chronicle, SAILING);
  await broughtIn(page, city);
  await dragOut(page, index);
  await aimed(page);
  const line = await aimLine(page);
  expect(line).toBeDefined();

  const pressed = async (): Promise<void> => {
    await aimed(page);
    const at = await tileOnScreen(page, city);
    await page.mouse.click(at.x, at.y);
    await expect.poll(() => standing(page, warning)).toBe(true);
    await rested(page);
  };

  await pressed();
  const seen = await readings(page, [`${warning}-title`, `${warning}-through-label`]);
  expect(seen(`${warning}-title`).text).toBe(text('declare-war.title'));
  expect(seen(`${warning}-through-label`).text).toBe(text('declare-war.play'));

  await click(page, `${warning}-back`);
  await expect.poll(() => standing(page, warning)).toBe(false);
  expect(await chronicleOf(page)).toEqual(chronicle);
  expect(await aimLine(page)).toBe(line);

  await pressed();
  await click(page, `${warning}-through`);
  await playedOut(page);
  expect(await standing(page, warning)).toBe(false);
  expect(await chronicleOf(page)).toEqual(landed);

  expect(problems).toEqual([]);
});

test('a unit of the neutral’s standing on a camp through the enemy phase captures it: the camp’s mark gone and no window dealt', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const kind = kindEntered(settledOn(1, [], CAMPAIGN));
  const { wave } = neutralOf(CATALOGUE, AGE).scripts;
  const { chronicle, camp } = campBeside(
    (tile) => ({ type: kind, faction: 'neutral', script: wave, tile }),
    CAMPAIGN,
  );
  const captured = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));
  const mark = `building-${tileKey(camp)}`;
  expect(unitAt(captured.units, camp)?.faction).toBe('neutral');
  expect(tileAt(captured.tiles, camp)?.building).toBeUndefined();
  expect(captured.deals).toEqual([]);

  await openSaved(page, chronicle, CAMPAIGN);
  expect(await standing(page, mark)).toBe(true);
  await stoppedTurn(page);
  await playedOut(page);

  const read = await readings(page, [mark, 'deal']);
  expect(read(mark).standing).toBe(false);
  expect(read('deal').standing).toBe(false);
  expect(await chronicleOf(page)).toEqual(captured);
  expect(problems).toEqual([]);
});

/**
 * The first seed's turn 1 with the neutral's border taken onto a tile beside its city, its stocks
 * given the cost of the first building card its workers play by a tile yielding production, and a
 * worker of its entered on that tile, which the end of turn builds on; and the tile.
 */
function workerBeside(): { chronicle: Chronicle; tile: TileCoords } {
  const neutral = neutralOf(CATALOGUE, AGE);
  const kind = neutralWorkerKind(CATALOGUE, neutral);
  const card = neutral.workers?.cards.find((id) => cardOf(CATALOGUE, id).kind === 'building');
  if (kind === undefined || neutral.workers === undefined || card === undefined) {
    throw new Error(`the neutral of the age ${AGE} builds nothing`);
  }
  const { script } = neutral.workers;
  const { production = 0 } = cardOf(CATALOGUE, card).cost;
  return firstSeed('builds on a tile beside the neutral’s city at the end of turn 1', (seed) => {
    const opened = settledOn(seed, [], CAMPAIGN);
    const city = opened.neutral?.city;
    const beside = tilesBeside(opened.tiles);
    const source = opened.tiles.find(
      (tile) => (tileYield(CATALOGUE, opened, tile, beside).production ?? 0) > 0,
    );
    if (city === undefined || source === undefined) return undefined;
    const gives = tileYield(CATALOGUE, opened, source, beside).production ?? 0;
    for (const tile of neighbours(city)) {
      const there = tileAt(opened.tiles, tile);
      if (there === undefined || there.building !== undefined) continue;
      if (holderOf(opened, tile) !== undefined || unitAt(opened.units, tile) !== undefined)
        continue;
      let paying = bordered(opened, 'neutral', tile);
      for (let paid = 0; paid < production; paid += gives) {
        paying = followed(paying, (left) => yielded(CATALOGUE, left, 'neutral', source));
      }
      const chronicle = unitEntered(paying.chronicle, {
        type: kind,
        faction: 'neutral',
        script,
        tile,
      });
      if (tileAt(endedTurn(chronicle).tiles, tile)?.building !== undefined) {
        return { chronicle, tile };
      }
    }
    return undefined;
  });
}

test('a worker of the neutral’s standing on a tile its city holds builds there at the end of turn, the veils off: the building’s mark rises on the tile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, tile } = workerBeside();
  const built = endedTurn(chronicle);
  const mark = `building-${tileKey(tile)}`;

  await openSaved(page, chronicle, CAMPAIGN);
  await consoleKey(page);
  await enter(page, 'uncharted');
  await enter(page, 'fog');
  await consoleKey(page);
  await rested(page);
  expect(await standing(page, mark)).toBe(false);

  await endTurn(page);
  await expect.poll(() => chronicleOf(page)).toEqual(built);
  expect(await standing(page, mark)).toBe(true);

  expect(problems).toEqual([]);
});

test('a warrior of the player’s standing on the neutral’s city through the enemy phase captures it: the city’s mark gone, the window rising under its building’s name and lore with each reward of several copies a stack whose badge reads them, and the take adding every copy to the discard pile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const opened = seedOneFreed();
  const { neutral } = opened;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const { city } = neutral;
  const chronicle = warDeclared(
    unitEntered(opened, { type: WARRIOR, faction: 'player', tile: city }),
  ).chronicle;
  const dealt = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));
  const [deal] = dealt.deals;
  if (deal?.of !== 'capture') throw new Error('the neutral’s city’s capture deals nothing');
  const rewards = Object.entries(deal.rewards);
  const [[card, copies]] = rewards;
  const taking = apply(CATALOGUE, dealt, { type: 'take', at: 0 });
  const added = [...walked(taking)].find((stage) => stage.name === 'added');
  const mark = `building-${tileKey(city)}`;
  const faces = rewards.map((_, at) => `deal-card-${at}`);
  const badges = faces.map((face) => `${face}-copies`);
  expect(dealt.neutral).toBeUndefined();
  expect(idsOf(added?.chronicle.discardPile ?? []).slice(-copies)).toEqual(
    Array.from({ length: copies }, () => card),
  );

  await openSaved(page, chronicle, CAMPAIGN);
  expect(await standing(page, mark)).toBe(true);
  await stoppedTurn(page);
  await restedOnDeal(page);

  const read = await readings(page, [mark, 'deal-title', 'deal-lore', ...faces, ...badges]);
  expect(read(mark).standing).toBe(false);
  expect(read('deal-title').text).toBe(buildingName(deal.building));
  expect(read('deal-lore').text).toBe(captureLore(deal.building));
  for (const [at, [, each]] of rewards.entries()) {
    expect(read(faces[at]).standing).toBe(true);
    expect(read(badges[at]).text).toBe(
      each > 1 ? text('collection.row-copies', { copies: each }) : undefined,
    );
  }
  expect(await chronicleOf(page)).toEqual(dealt);

  await take(page, 0);
  expect(await chronicleOf(page)).toEqual(outcome(taking));
  expect(problems).toEqual([]);
});
