import type { Catalogue } from '../rules/catalogue';
import { NOMADIC } from './nomadic';
import { STAND_IN } from './stand-in';

/** The ages' catalogues, in the order a launch lists them. */
export const CATALOGUES: readonly Catalogue[] = [NOMADIC];

/** The catalogue of that version, the stand-in included; a version no catalogue the game ships holds is refused. */
export function catalogueOf(version: string): Catalogue {
  const found = [...CATALOGUES, STAND_IN].find((catalogue) => catalogue.version === version);
  if (found === undefined) throw new Error(`no catalogue is named ${version}`);
  return found;
}
