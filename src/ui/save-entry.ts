import { CATALOGUE } from '../content/catalogue';
import { type Campaign, newCampaign } from '../rules/campaign';
import { firstDeck } from '../rules/catalogue';
import { readSave, writeSave } from '../rules/save';
import type { Chronicle } from '../rules/state';
import type { Choices, Opening } from './launch-page';

/** Where the browser keeps the save; the origin is shared with whatever else the host serves. */
export const SAVE_ENTRY = 'age-of-deckbuilder.save';

/** What the save was read as: the campaign held, and the chronicle it resumes on, where one was read. */
type Reading = { readonly campaign: Campaign; readonly resumed: Opening | undefined };

let reading: Reading | undefined;

function wordsOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The save as read the first time anything asks for it; every later ask answers that reading. */
function read(): Reading {
  reading ??= readEntry();
  return reading;
}

/** The campaign the save holds, or a new one on the first deck. */
export function campaignHeld(): Campaign {
  return read().campaign;
}

/** The chronicle the save holds, on the choices it was launched on, where one could be read. */
export function savedOpening(): Opening | undefined {
  return read().resumed;
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
 * The save the browser keeps, read: the console says why each thing was dropped, and the entry is
 * rewritten without it, or removed where nothing of it stands.
 */
function readEntry(): Reading {
  const fresh = { campaign: newCampaign(CATALOGUE, firstDeck(CATALOGUE)), resumed: undefined };
  let storage: Storage;
  let text: string | null;
  try {
    storage = window.localStorage;
    text = storage.getItem(SAVE_ENTRY);
  } catch {
    return fresh;
  }
  if (text === null) return fresh;
  const { campaign, chronicle: progress, dropped } = readSave(CATALOGUE, text);
  for (const reason of dropped) console.warn(reason);
  if (campaign !== undefined) {
    if (dropped.length > 0) kept(writeSave(CATALOGUE, campaign, progress));
  } else if (progress === undefined) {
    storage.removeItem(SAVE_ENTRY);
  }
  const resumed =
    progress === undefined
      ? undefined
      : {
          age: progress.chronicle.age,
          region: progress.region,
          deck: progress.deck,
          seed: progress.chronicle.seed,
          resumed: progress.chronicle,
        };
  return { campaign: campaign ?? fresh.campaign, resumed };
}
