import { CATALOGUE } from '../content/catalogue';
import { type Campaign, newCampaign } from '../rules/campaign';
import { firstDeck } from '../rules/catalogue';
import { readSave, writeSave } from '../rules/save';
import type { Chronicle } from '../rules/state';
import type { Choices, Opening } from './launch-page';

/** Where the browser keeps the save; the origin is shared with whatever else the host serves. */
export const SAVE_ENTRY = 'age-of-deckbuilder.save';

/** The campaign the save holds or a new one, from the boot's reading on. */
let held: Campaign | undefined;

function wordsOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The campaign held; asked before the boot has read the save, it throws. */
export function campaignHeld(): Campaign {
  if (held === undefined) throw new Error('the campaign is asked for before the save is read');
  return held;
}

/** The text kept as the save, over whatever stood; storage that refuses it leaves play going on. */
function kept(text: string): void {
  try {
    window.localStorage.setItem(SAVE_ENTRY, text);
  } catch (error) {
    console.warn(wordsOf(error));
  }
}

/** The chronicle kept as the save, beside the campaign held. */
export function keepChronicle({ region, deck }: Choices, chronicle: Chronicle): void {
  kept(writeSave(CATALOGUE, campaignHeld(), { chronicle, region, deck }));
}

/**
 * The save read at the boot: the campaign it holds, or a new one on the first deck, held from here
 * on, and the chronicle it holds, on the choices it was launched on, where one could be read. The
 * console says why each thing was dropped.
 */
export function openedSave(): Opening | undefined {
  held = newCampaign(CATALOGUE, firstDeck(CATALOGUE));
  let storage: Storage;
  let text: string | null;
  try {
    storage = window.localStorage;
    text = storage.getItem(SAVE_ENTRY);
  } catch {
    return undefined;
  }
  if (text === null) return undefined;
  const { campaign, chronicle: progress, dropped } = readSave(CATALOGUE, text);
  for (const reason of dropped) console.warn(reason);
  if (campaign !== undefined) {
    held = campaign;
    if (dropped.length > 0) kept(writeSave(CATALOGUE, campaign, progress));
  } else if (progress === undefined) {
    storage.removeItem(SAVE_ENTRY);
  }
  if (progress === undefined) return undefined;
  const { chronicle, region, deck } = progress;
  return { age: chronicle.age, region, deck, seed: chronicle.seed, resumed: chronicle };
}
