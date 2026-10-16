import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { paidInto } from '../src/rules/campaign';
import { achievementOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import { addedToDrawPileTop } from '../src/rules/schedule';
import type { CardId, Chronicle } from '../src/rules/state';
import { inCollectionOrder } from '../src/ui/collection-layout';
import { css, LOOK } from '../src/ui/look';
import { cardName, technologyName, text } from '../src/ui/text';
import {
  aimed,
  beforeTheFall,
  budget,
  campaignShown,
  chronicleButton,
  click,
  cursorOverCanvas,
  defeatShown,
  dragOut,
  heldSave,
  influenceCardGaining,
  landed,
  onScreen,
  openSaved,
  playedOn,
  playedOut,
  readings,
  rested,
  stoppedTurn,
  textOf,
  victoryShown,
  watch,
} from './chronicle-screen';

/** The cursor over something that answers a press. */
const HAND = 'pointer';

/** The chronicle opened and the play that wins it made: the ending screen rises from here. */
async function playTheWin(
  page: Page,
  chronicle: Chronicle,
  index: number,
  tile: TileCoords,
): Promise<void> {
  await openSaved(page, chronicle);
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
}

/** The alpha the victory screen stands at, and nothing where none stands. */
function victoryAlpha(page: Page): Promise<number | undefined> {
  return page.evaluate(
    () => (window.named?.('victory')?.object as Phaser.GameObjects.Container | undefined)?.alpha,
  );
}

/** The chronicle with each card added to the top of its draw pile, in turn. */
function withOnTop(chronicle: Chronicle, ids: readonly CardId[]): Chronicle {
  return ids.reduce((held, id) => addedToDrawPileTop(CATALOGUE, held, id).chronicle, chronicle);
}

test('the play that ends the chronicle pays it into the campaign: the ending screen reads what it paid, its achievements then the trophies it kept that carry influence, the save holds the campaign paid into and no chronicle, and the campaign screen its End chronicle opens reads the influence paid', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const landing = landed();
  const { index, tile } = landing;
  const gaining = influenceCardGaining('trophy', (influence) => influence > 0);
  const none = influenceCardGaining('trophy', (influence) => influence === 0);
  const chronicle = withOnTop(landing.chronicle, [gaining, gaining, none]);
  const won = playedOn(chronicle, index, tile);
  const paid = paidInto(CATALOGUE, freshCampaign(CATALOGUE), won);
  const carrying = paid.cards.filter(({ influence }) => influence > 0);
  const kept = inCollectionOrder(CATALOGUE, carrying, cardName);

  await playTheWin(page, chronicle, index, tile);
  await playedOut(page);
  await expect.poll(() => victoryShown(page)).toBe(true);

  expect(paid.achievements.length).toBeGreaterThan(0);
  expect(paid.influence).toBeGreaterThan(0);
  expect(paid.cards.map(({ id }) => id).sort()).toEqual([gaining, none].sort());
  expect(kept.map(({ id }) => id)).toEqual([gaining]);
  for (const [at, id] of paid.achievements.entries()) {
    const { technology, influence } = achievementOf(CATALOGUE, won.age, id);
    expect(await textOf(page, `ending-row-${at}`)).toBe(
      text('achievement.reached', { achievement: technologyName(technology) }),
    );
    expect(await textOf(page, `ending-row-${at}-influence`)).toBe(
      influence > 0 ? String(influence) : undefined,
    );
  }
  const rows = kept.map((_, at) => `ending-row-${paid.achievements.length + at}`);
  const seen = await readings(page, [
    ...rows.flatMap((row) => [row, `${row}-copies`, `${row}-influence`]),
    `ending-row-${paid.achievements.length + kept.length}`,
  ]);
  expect(
    rows.map((row) => [seen(row).text, seen(`${row}-copies`).text, seen(`${row}-influence`).text]),
  ).toEqual(
    kept.map(({ id, copies, influence }) => [
      cardName(id),
      copies > 1 ? text('collection.row-copies', { copies }) : undefined,
      String(influence),
    ]),
  );
  expect(seen(`ending-row-${paid.achievements.length + kept.length}`).standing).toBe(false);
  expect(await textOf(page, 'ending-total-label')).toBe(text('label.influence'));
  expect(await textOf(page, 'ending-total')).toBe(String(paid.influence));

  expect(await heldSave(page)).toEqual({
    campaign: paid.campaign,
    chronicle: undefined,
    dropped: [],
  });

  expect(await textOf(page, 'end-chronicle-label')).toBe(text('ending.end-chronicle'));
  await rested(page);
  await click(page, 'end-chronicle');
  await campaignShown(page);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(paid.campaign.influence));
  await chronicleButton(page);
  expect(await textOf(page, 'launch-continue-label')).toBe(text('launch.continue'));
  expect(await textOf(page, 'launch-continue-line-0')).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a defeat keeps on the ledger the challenge it kept, greyed, reading what its copies would have paid and crossed out end to end, while the trophy it kept reads as paid and the total reads what was paid', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const challenge = influenceCardGaining('challenge', (influence) => influence > 0);
  const trophy = influenceCardGaining('trophy', (influence) => influence > 0);
  const standing = withOnTop(beforeTheFall(), [challenge, challenge, trophy]);
  const fallen = outcome(apply(CATALOGUE, standing, { type: 'end-turn' }));
  const paid = paidInto(CATALOGUE, freshCampaign(CATALOGUE), fallen);
  const kept = inCollectionOrder(CATALOGUE, paid.cards, cardName);
  const rows = kept.map((_, at) => `ending-row-${paid.achievements.length + at}`);

  await openSaved(page, standing);
  await stoppedTurn(page);
  await expect.poll(() => defeatShown(page)).toBe(true);

  expect(fallen.ending?.outcome).toBe('defeat');
  expect(kept.map(({ id, paid }) => [id, paid]).sort()).toEqual(
    [
      [challenge, false],
      [trophy, true],
    ].sort(),
  );
  const seen = await readings(page, [
    ...rows.flatMap((row) => [row, `${row}-copies`, `${row}-influence`, `${row}-crossed`]),
    'ending-total',
  ]);
  expect(
    rows.map((row) => [
      seen(row).text,
      seen(`${row}-copies`).text,
      seen(`${row}-influence`).text,
      [seen(row).ink, seen(`${row}-influence`).ink],
      seen(`${row}-crossed`).standing,
    ]),
  ).toEqual(
    kept.map(({ id, copies, influence, paid }) => {
      const ink = css(paid ? LOOK.paleInk : LOOK.unpaidInk);
      return [
        cardName(id),
        copies > 1 ? text('collection.row-copies', { copies }) : undefined,
        String(influence),
        [ink, ink],
        !paid,
      ];
    }),
  );
  const crossed = rows[kept.findIndex(({ paid }) => !paid)];
  expect(seen(`${crossed}-crossed`).fill).toBe(LOOK.unpaidInk);
  expect(seen(`${crossed}-crossed`).across.left).toBe(seen(crossed).across.left);
  expect(seen(`${crossed}-crossed`).across.right).toBe(seen(`${crossed}-influence`).across.right);
  expect(seen('ending-total').text).toBe(String(paid.influence));

  expect(problems).toEqual([]);
});

test('End chronicle answers no press and reads an arrow while the ending screen rises, and reads the hand under a pointer resting on it once the screen has risen', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, index, tile } = landed();

  await playTheWin(page, chronicle, index, tile);
  // The rise is a tween on the overlay's clock, held in the first frame the screen shows at all, so
  // the press below lands mid-rise however slow the runner. Held at alpha 0 it would prove nothing:
  // Phaser hit-tests nothing that does not render.
  await page.waitForFunction(() => {
    const screen = window.named?.('victory')?.object as Phaser.GameObjects.Container | undefined;
    if (screen === undefined || screen.alpha === 0) return false;
    window.game?.scene.getScene('overlay').tweens.pauseAll();
    return true;
  });
  expect(await victoryAlpha(page)).toBeGreaterThan(0);
  expect(await victoryAlpha(page)).toBeLessThan(1);

  await rested(page);
  const at = await onScreen(page, 'end-chronicle');
  await page.mouse.move(at.x, at.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).not.toBe(HAND);
  await page.mouse.down();
  await page.mouse.up();
  await rested(page);
  expect(await victoryAlpha(page)).toBeLessThan(1);
  expect(await page.evaluate(() => window.game?.scene.isActive('campaign'))).toBe(false);
  expect(await cursorOverCanvas(page)).not.toBe(HAND);

  await page.evaluate(() => {
    window.game?.scene.getScene('overlay').tweens.resumeAll();
  });
  await expect.poll(() => victoryShown(page)).toBe(true);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe(HAND);
  await page.mouse.down();
  await page.mouse.up();
  await campaignShown(page);

  expect(problems).toEqual([]);
});
