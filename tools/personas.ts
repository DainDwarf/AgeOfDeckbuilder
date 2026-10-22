import { builder } from './builder';
import { IDLE } from './idle';
import type { Persona } from './sim-driver';
import { warlord } from './warlord';

/** Every persona by name, built for the goal of the technology named, the capstone where none is. */
export const PERSONAS: Readonly<Record<string, (goal?: string) => Persona>> = {
  idle: () => IDLE,
  builder,
  warlord,
};
