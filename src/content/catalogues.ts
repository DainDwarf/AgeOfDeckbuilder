import type { Catalogue } from '../rules/catalogue';
import { NOMADIC } from './nomadic';
import { STAND_IN } from './stand-in';

/** Every catalogue the game ships, in the order a launch lists them. */
export const CATALOGUES: readonly Catalogue[] = [NOMADIC, STAND_IN];

/** The catalogue of that version; a version no catalogue the game ships holds is refused. */
export function catalogueOf(version: string): Catalogue {
  const found = CATALOGUES.find((catalogue) => catalogue.version === version);
  if (found === undefined) throw new Error(`no catalogue is named ${version}`);
  return found;
}
