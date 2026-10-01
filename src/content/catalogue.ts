import { type Catalogue, merged } from '../rules/catalogue';
import { NOMADIC } from './nomadic';
import { STONE } from './stone';

export const CATALOGUE: Catalogue = merged('1', [NOMADIC, STONE]);
