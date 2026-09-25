import { catalogueOf } from '../content/catalogues';
import { contentNamed, readSave, writeSave } from '../rules/save';
import type { Chronicle } from '../rules/state';
import type { Choices, Opening } from './launch-page';

/** Where the browser keeps the save; the origin is shared with whatever else the host serves. */
export const SAVE_ENTRY = 'age-of-deckbuilder.save';

function wordsOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The chronicle kept as the save, over whatever stood; storage that refuses it leaves play going on. */
export function keepChronicle({ catalogue, region, deck }: Choices, chronicle: Chronicle): void {
  const text = writeSave(catalogue, { chronicle, region, deck });
  try {
    window.localStorage.setItem(SAVE_ENTRY, text);
  } catch (error) {
    console.warn(wordsOf(error));
  }
}

/**
 * The chronicle the save holds, on the choices it was launched on, and nothing where no save stands
 * or the storage cannot be reached. A save that cannot be read whole is dropped, and the console says
 * why.
 */
export function savedChronicle(): Opening | undefined {
  let storage: Storage;
  let text: string | null;
  try {
    storage = window.localStorage;
    text = storage.getItem(SAVE_ENTRY);
  } catch {
    return undefined;
  }
  if (text === null) return undefined;
  try {
    const catalogue = catalogueOf(contentNamed(text));
    const { chronicle, region, deck } = readSave(catalogue, text);
    return {
      catalogue,
      region,
      schedule: chronicle.timeline.schedule,
      deck,
      seed: chronicle.seed,
      resumed: chronicle,
    };
  } catch (error) {
    storage.removeItem(SAVE_ENTRY);
    console.warn(wordsOf(error));
    return undefined;
  }
}
