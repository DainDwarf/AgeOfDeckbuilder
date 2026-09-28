import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { paidInto } from '../src/rules/campaign';
import { achievementOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import type { Chronicle } from '../src/rules/state';
import { technologyName, text } from '../src/ui/text';
import {
  aimed,
  budget,
  campaignShown,
  chronicleButton,
  click,
  cursorOverCanvas,
  dragOut,
  heldSave,
  idsOf,
  landed,
  onScreen,
  openSaved,
  playedOut,
  rested,
  SHELTER,
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

test('the play that ends the chronicle pays it into the campaign: the ending screen reads what it paid, the save holds the campaign paid into and no chronicle, and the campaign screen its End chronicle opens reads the influence paid', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  const paid = paidInto(CATALOGUE, freshCampaign(CATALOGUE), won);

  await playTheWin(page, chronicle, index, tile);
  await playedOut(page);
  await expect.poll(() => victoryShown(page)).toBe(true);

  expect(paid.achievements.length).toBeGreaterThan(0);
  expect(paid.influence).toBeGreaterThan(0);
  for (const [at, id] of paid.achievements.entries()) {
    const { technology, influence } = achievementOf(CATALOGUE, won.age, id);
    expect(await textOf(page, `ending-row-${at}`)).toBe(
      text('ending.reached', { achievement: technologyName(technology) }),
    );
    expect(await textOf(page, `ending-row-${at}-influence`)).toBe(
      influence > 0 ? String(influence) : undefined,
    );
  }
  expect(await textOf(page, `ending-row-${paid.achievements.length}`)).toBeUndefined();
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

test('End chronicle answers no press and reads an arrow while the ending screen rises, and reads the hand under a pointer resting on it once the screen has risen', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);

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
