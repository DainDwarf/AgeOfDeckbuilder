import { CATALOGUE } from '../content/catalogue';
import type { Campaign, Payment } from '../rules/campaign';
import { type ChronicleSave, freshCampaign, keptAfter, readSave, writeSave } from '../rules/save';
import type { Chronicle } from '../rules/state';

/** What a chronicle is launched on: an age, one of its regions and a civilization of the campaign, and a seed or nothing for a fresh one. */
export type Choices = {
  readonly age: string;
  readonly region: string;
  readonly civilization: string;
  readonly seed: number | undefined;
};

/** What the chronicle screen opens on: the choices a chronicle begins on, and the one resumed on them. */
export type Opening = Choices & { readonly resumed?: Chronicle };

/** Where the browser keeps the save; the origin is shared with whatever else the host serves. */
export const SAVE_ENTRY = 'age-of-deckbuilder.save';

/** The chronicle in progress, on the choices it was launched on. */
type Saved = Opening & { readonly resumed: Chronicle };

/** What the save holds: the campaign, and the chronicle in progress, where one stands. */
type Held = { readonly campaign: Campaign; readonly opening: Saved | undefined };

let held: Held | undefined;

function wordsOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The save as it stands: read the first time anything asks for it, and every write kept in it after. */
function read(): Held {
  held ??= readEntry();
  return held;
}

/** The campaign the save holds, or a new one on the first civilization. */
export function campaignHeld(): Campaign {
  return read().campaign;
}

/** The chronicle the save holds as it stands now, on the choices it was launched on, where one stands. */
export function savedOpening(): Saved | undefined {
  return read().opening;
}

function openingOf({ chronicle, region, civilization }: ChronicleSave): Saved {
  return { age: chronicle.age, region, civilization, seed: chronicle.seed, resumed: chronicle };
}

/** The text kept as the save, over whatever stood; storage that refuses it leaves play going on. */
function kept(text: string): void {
  try {
    window.localStorage.setItem(SAVE_ENTRY, text);
  } catch (error) {
    console.warn(wordsOf(error));
  }
}

/**
 * The chronicle kept as the save, beside the campaign held; an ended one is kept as the campaign it
 * paid into, and the payment is answered.
 */
export function keepChronicle(
  { region, civilization }: Choices,
  chronicle: Chronicle,
): Payment | undefined {
  const after = keptAfter(CATALOGUE, read().campaign, { chronicle, region, civilization });
  held = {
    campaign: after.campaign,
    opening: after.chronicle === undefined ? undefined : openingOf(after.chronicle),
  };
  kept(writeSave(CATALOGUE, after.campaign, after.chronicle));
  return after.payment;
}

/**
 * The save the browser keeps, read: the console says why each thing was dropped, and the entry is
 * rewritten without it, or removed where nothing of it stands.
 */
function readEntry(): Held {
  const fresh = {
    campaign: freshCampaign(CATALOGUE),
    opening: undefined,
  };
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
  return {
    campaign: campaign ?? fresh.campaign,
    opening: progress === undefined ? undefined : openingOf(progress),
  };
}
