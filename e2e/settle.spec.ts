import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { admitted, apply, outcome } from '../src/rules/chronicle';
import { CENTRE, tileAt, tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import { glyphFileOf } from '../src/ui/cast';
import { LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  aimed,
  borderColours,
  borderStretches,
  campsWorn,
  chronicleOf,
  civilizationOpened,
  click,
  dragOut,
  drawnFaces,
  endTurnChip,
  endTurnHovered,
  faceCounts,
  hungFromTheBar,
  idsOf,
  launchedAs,
  marksIn,
  onScreen,
  openSaved,
  type PieceWorn,
  pieceWornOf,
  playedOn,
  playedOut,
  readings,
  rested,
  shows,
  standing,
  stoppedTurn,
  watch,
} from './chronicle-screen';

/**
 * What the chronicle screen shows of the settle phase: whether its frame stands, its panel's two
 * lines while it stands, whether a chip stands, and End turn's piece and the sign on it with its ink.
 */
type PhaseShown = {
  frame: boolean;
  panel: (string | undefined)[] | undefined;
  chip: boolean;
  endTurn: { piece: PieceWorn['piece']; signs: readonly string[]; inks: readonly number[] };
};

/** What the chronicle screen shows of the settle phase, in one question to the page. */
async function phaseShown(page: Page): Promise<PhaseShown> {
  const read = await readings(page, [
    'settle-phase-frame',
    'settle-phase',
    'settle-phase-name',
    'settle-phase-sentence',
    'settle-phase-chip',
    'end-turn',
    'end-turn-sign',
  ]);
  const sign = read('end-turn-sign');
  return {
    frame: read('settle-phase-frame').shows,
    panel: read('settle-phase').shows
      ? [read('settle-phase-name').text, read('settle-phase-sentence').text]
      : undefined,
    chip: read('settle-phase-chip').standing,
    endTurn: {
      piece: pieceWornOf(read('end-turn')).piece,
      signs: sign.glyphsDrawn,
      inks: sign.glyphColours,
    },
  };
}

/** What the settle phase shows out of city mode, End turn wearing that piece and its village in that ink. */
function onTheSettlePhase(piece: PieceWorn['piece'], ink: number): PhaseShown {
  return {
    frame: true,
    panel: [text('settle-panel.name'), text('settle-panel.banished')],
    chip: false,
    endTurn: { piece, signs: [glyphFileOf('end-settle-phase-button')], inks: [ink] },
  };
}

test('a chronicle opens on the settle phase with the city standing nowhere, and the settle card puts it on the tile it is aimed at', async ({
  page,
}) => {
  const problems = watch(page);
  const before = launchedAs(1);

  await openSaved(page, before);

  const opened = await chronicleOf(page);
  expect(opened).toEqual(before);
  expect(opened.turn).toBe(0);
  expect(opened.city).toBeUndefined();
  const civilization = civilizationOpened();
  expect(idsOf(opened.hand)).toEqual([civilization.city.card, ...civilization.settle]);
  expect(await standing(page, `hand-${opened.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${opened.hand.length}`)).toBe(false);

  expect((await faceCounts(page)).shown).toBe(opened.centre.length);
  for (const coord of opened.centre) {
    expect(await standing(page, `tile-${tileKey(coord)}`)).toBe(true);
  }
  expect(await marksIn(page, 'border')).toBe(0);

  expect(await endTurnChip(page)).toBeUndefined();
  expect(await phaseShown(page)).toEqual(onTheSettlePhase('steel', LOOK.greyedInk));
  const hung = await hungFromTheBar(page, 'settle-phase-panel');
  expect(hung.over).toBeGreaterThan(0);
  expect(hung.under).toBeGreaterThan(0);
  expect(hung.aside).toBeCloseTo(0, 1);
  await click(page, 'end-turn');
  await rested(page);
  await rested(page);
  expect(await endTurnChip(page)).toBeUndefined();
  expect(await chronicleOf(page)).toEqual(opened);

  const settle = opened.hand[0].id;
  const card = aimOf(cardOf(CATALOGUE, settle));
  if (card.aim !== 'tile') throw new Error(`${settle} is aimed at no tile`);
  const lit = admitted(CATALOGUE, opened, card);
  const at = lit.find((coord) => tileKey(coord) !== tileKey(CENTRE));
  if (at === undefined) throw new Error('the settle admits no tile off the centre');
  const settled = playedOn(before, 0, at);

  await dragOut(page, 0);
  await aimed(page);
  expect(await marksIn(page, 'aim-lit')).toBe(lit.length);

  await click(page, `tile-${tileKey(at)}`);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(settled);

  const standingCity = await chronicleOf(page);
  expect(standingCity.city).toEqual(at);
  expect(await phaseShown(page)).toEqual(onTheSettlePhase('gold', LOOK.metalInk));
  expect(tileAt(standingCity.tiles, at)?.building).toBe(civilization.city.building);
  expect(tileAt(standingCity.tiles, at)?.terrain).toBe(tileAt(opened.tiles, at)?.terrain);
  const sees = inSight(CATALOGUE, standingCity);
  expect(await borderColours(page)).toEqual(
    borderStretches([
      ...standingCity.held.map((tile) => ({ tile, whose: 'player' as const, inFog: false })),
      ...campsWorn(standingCity, drawnFaces(standingCity), (tile) => !sees.has(tileKey(tile))),
    ]),
  );

  const button = await onScreen(page, 'end-turn');
  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnHovered(page)).toBe(true);

  await stoppedTurn(page);
  const ticked = await chronicleOf(page);
  expect(ticked).toEqual(outcome(apply(CATALOGUE, settled, { type: 'end-turn' })));
  expect(ticked.turn).toBe(1);
  expect(await standing(page, 'capstone')).toBe(false);
  expect(await phaseShown(page)).toEqual({
    frame: false,
    panel: undefined,
    chip: false,
    endTurn: { piece: 'gold', signs: [glyphFileOf('end-turn-button')], inks: [LOOK.metalInk] },
  });
  expect(ticked.hand).toHaveLength(5);
  for (const pile of [ticked.hand, ticked.drawPile, ticked.discardPile, ticked.exhaustPile]) {
    for (const { id } of opened.hand) expect(idsOf(pile)).not.toContain(id);
  }

  expect(problems).toEqual([]);
});

test('city mode entered once the city stands takes the settle phase’s frame and panel down, and leaving it brings them back', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, launchedAs(1));

  await dragOut(page, 0);
  await aimed(page);
  await click(page, `tile-${tileKey(CENTRE)}`);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).city).toEqual(CENTRE);

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-mode')).toBe(true);
  expect(await shows(page, 'city-frame')).toBe(true);
  expect(await phaseShown(page)).toEqual({
    ...onTheSettlePhase('gold', LOOK.metalInk),
    frame: false,
    panel: undefined,
  });

  await page.keyboard.press('Escape');
  await expect.poll(() => shows(page, 'city-mode')).toBe(false);
  expect(await shows(page, 'city-frame')).toBe(false);
  expect(await phaseShown(page)).toEqual(onTheSettlePhase('gold', LOOK.metalInk));

  expect(problems).toEqual([]);
});
