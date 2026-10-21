import { BUILDER } from './builder';
import { IDLE } from './idle';
import type { Persona } from './sim-driver';
import { WARLORD } from './warlord';

/** Every persona, by name. */
export const PERSONAS: Readonly<Record<string, Persona>> = {
  idle: IDLE,
  builder: BUILDER,
  warlord: WARLORD,
};
