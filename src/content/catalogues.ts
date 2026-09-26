import type { Catalogue } from '../rules/catalogue';
import { NOMADIC } from './nomadic';

/** The ages' catalogues, in the order a launch lists them. */
export const CATALOGUES: readonly Catalogue[] = [NOMADIC];

/** The catalogue of that version among the ages'; a version none of them holds is refused. */
export function catalogueOf(version: string): Catalogue {
  const found = CATALOGUES.find((catalogue) => catalogue.version === version);
  if (found === undefined) throw new Error(`no catalogue is named ${version}`);
  return found;
}
