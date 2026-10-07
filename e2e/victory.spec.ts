import { expect, test } from '@playwright/test';
import { tileAt, tileKey } from '../src/rules/map';
import {
  aimed,
  budget,
  chronicleOf,
  click,
  dragOut,
  landed,
  openSaved,
  playedOut,
  SHELTER,
  victoryShown,
  watch,
} from './chronicle-screen';

test('the play whose building passes the capstone wins on the play, and the victory screen rises', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, index, tile, won } = landed();

  await openSaved(page, chronicle);
  expect(await victoryShown(page)).toBe(false);
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);

  expect(await chronicleOf(page)).toEqual(won);
  expect(tileAt(won.tiles, tile)?.building).toBe(SHELTER);
  expect(won.ending).toEqual({ outcome: 'victory', turn: chronicle.turn });
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
