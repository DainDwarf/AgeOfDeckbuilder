import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { type Civilization, cardOf, unitKind } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import {
  distance,
  movementCost,
  neighbours,
  type TileCoords,
  tileAt,
  tileKey,
} from '../src/rules/map';
import type { CardId, Chronicle } from '../src/rules/state';
import { standsOn, unitAt } from '../src/rules/units';
import { cardName, text } from '../src/ui/text';
import {
  admits,
  aimed,
  aimLine,
  cardOnFace,
  chronicleOf,
  cityTileOf,
  click,
  dragOut,
  endedTurn,
  firstSeed,
  idsOf,
  openSaved,
  playedOn,
  playedOut,
  settledOn,
  unitEntered,
  WARRIOR,
  watch,
  withCard,
} from './chronicle-screen';

/** The card that embarks a unit, and the card it becomes. */
const EMBARK = 'embark';
const DISEMBARK = becomes(EMBARK);

function becomes(card: CardId): CardId {
  const named = cardOf(CATALOGUE, card).becomes;
  if (named === undefined) throw new Error(`${card} becomes no card`);
  return named;
}

/**
 * A turn 1 with Embark in hand, a tile embarked units enter, free, and two free tiles beside it a
 * warrior stands on.
 */
type Shore = {
  readonly opened: Chronicle;
  readonly water: TileCoords;
  readonly banks: readonly [TileCoords, TileCoords];
};

/**
 * What `made` makes of the first seed's turn 1 with Embark in hand, on the shore nearest the city
 * whose tiles stand no further south than one row below the city, clear of the line over the hand.
 */
function onShore<T>(civilization: Civilization, made: (shore: Shore) => T | undefined): T {
  const warrior = unitKind(CATALOGUE, WARRIOR);
  return firstSeed(`opens turn 1 on ${EMBARK} in hand with a shore near its city`, (seed) => {
    const opened = settledOn(seed, [], civilization);
    if (!idsOf(opened.hand).includes(EMBARK)) return undefined;
    const city = cityTileOf(opened);
    const clear = (coord: TileCoords): boolean =>
      coord.r <= city.r + 1 && unitAt(opened.units, coord) === undefined;
    const nearest = [...opened.tiles].sort((a, b) => distance(a, city) - distance(b, city));
    for (const water of nearest) {
      if (movementCost(CATALOGUE, water, true) === undefined || !clear(water)) continue;
      const banks = neighbours(water).filter(
        (coord) => clear(coord) && standsOn(CATALOGUE, warrior, false, tileAt(opened.tiles, coord)),
      );
      if (banks.length < 2) continue;
      const found = made({
        opened,
        water: { q: water.q, r: water.r },
        banks: [banks[0], banks[1]],
      });
      if (found !== undefined) return found;
    }
    return undefined;
  });
}

/** The chronicle with a warrior of the player's entered on each tile. */
function manned(chronicle: Chronicle, tiles: readonly TileCoords[]): Chronicle {
  return tiles.reduce(
    (standing, tile) => unitEntered(standing, { type: WARRIOR, faction: 'player', tile }),
    chronicle,
  );
}

/** The chronicle with the card's cost gained, and where the card lies in its hand. */
function paidFor(chronicle: Chronicle, card: CardId): { chronicle: Chronicle; index: number } {
  const paid = gained(chronicle, cardOf(CATALOGUE, card).cost).chronicle;
  return { chronicle: paid, index: idsOf(paid.hand).indexOf(card) };
}

test('Embark played at a tile beside one unit embarks that unit onto it, its action spent, and the discard pile’s top card reads the card Embark becomes', async ({
  page,
}) => {
  const problems = watch(page);
  const ground = onShore(withCard(EMBARK), ({ opened, water, banks: [bank] }) => {
    const { chronicle, index } = paidFor(manned(opened, [bank]), EMBARK);
    return admits(chronicle, index, water) ? { chronicle, index, water } : undefined;
  });
  const embarked = playedOn(ground.chronicle, ground.index, ground.water);

  await openSaved(page, ground.chronicle);
  await dragOut(page, ground.index);
  await aimed(page);
  await click(page, `tile-${tileKey(ground.water)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(embarked);
  expect(unitAt(embarked.units, ground.water)).toMatchObject({ embarked: true, action: 0 });
  expect(idsOf(embarked.discardPile).at(-1)).toBe(DISEMBARK);
  await expect.poll(() => cardOnFace(page, 'discard-pile-top')).toBe(DISEMBARK);
  expect(problems).toEqual([]);
});

test('Embark played at a tile two units stand beside plays nothing and is aimed at a unit, and a click on one of the two embarks that one', async ({
  page,
}) => {
  const problems = watch(page);
  const ground = onShore(withCard(EMBARK), ({ opened, water, banks }) => {
    const { chronicle, index } = paidFor(manned(opened, banks), EMBARK);
    return admits(chronicle, index, water) ? { chronicle, index, water, banks } : undefined;
  });
  const { chronicle, index, water } = ground;
  const [, picked] = ground.banks;
  const sent = outcome(
    apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile: water, through: picked }),
  );

  await openSaved(page, chronicle);
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(water)}`);
  await expect.poll(() => aimLine(page)).toBe(text('aim.unit', { card: cardName(EMBARK) }));
  expect(await chronicleOf(page)).toEqual(chronicle);

  await aimed(page);
  await click(page, `tile-${tileKey(picked)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(sent);
  expect(unitAt(sent.units, water)?.id).toBe(unitAt(chronicle.units, picked)?.id);
  expect(problems).toEqual([]);
});

test('Disembark played at a tile beside an embarked unit puts it ashore there as itself, and the discard pile’s top card reads the card Disembark becomes', async ({
  page,
}) => {
  const problems = watch(page);
  const civilization = withCard(EMBARK);
  const ground = onShore(civilization, ({ opened, water, banks: [bank] }) => {
    const paid = paidFor(manned(opened, [bank]), EMBARK);
    if (!admits(paid.chronicle, paid.index, water)) return undefined;
    // The deck cycles back to the card Embark lay as well within as many turns as it holds cards.
    let afloat = playedOn(paid.chronicle, paid.index, water);
    for (let turn = 0; turn < civilization.cards.length && afloat.ending === undefined; turn++) {
      afloat = endedTurn(afloat);
      const { chronicle, index } = paidFor(afloat, DISEMBARK);
      if (admits(chronicle, index, bank)) return { chronicle, index, bank };
    }
    return undefined;
  });
  const ashore = playedOn(ground.chronicle, ground.index, ground.bank);

  await openSaved(page, ground.chronicle);
  await dragOut(page, ground.index);
  await aimed(page);
  await click(page, `tile-${tileKey(ground.bank)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(ashore);
  expect(unitAt(ashore.units, ground.bank)?.embarked).toBe(false);
  expect(idsOf(ashore.discardPile).at(-1)).toBe(becomes(DISEMBARK));
  await expect.poll(() => cardOnFace(page, 'discard-pile-top')).toBe(becomes(DISEMBARK));
  expect(problems).toEqual([]);
});
