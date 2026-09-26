import { type Catalogue, merged } from '../rules/catalogue';
import { NOMADIC } from './nomadic';

export const CATALOGUE: Catalogue = merged('1', [NOMADIC]);
