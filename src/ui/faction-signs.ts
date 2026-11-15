import type Phaser from 'phaser';
import { store, stored } from './storage';

/** Where the browser keeps whether the faction signs are on, apart from what the Controls window's Default puts back. */
export const FACTION_SIGNS_ENTRY = 'age-of-deckbuilder.faction-signs';

const ON = 'on';
const OFF = 'off';

/** Whether the signs kept are on: whatever is not `on` stands at off. */
export function parseFactionSigns(stored: string | null): boolean {
  return stored === ON;
}

export function serialiseFactionSigns(on: boolean): string {
  return on ? ON : OFF;
}

/** Whether every unit, city and camp wears its faction's sign, read from the browser the first time it is asked for. */
let signsSet: boolean | undefined;

export function factionSigns(): boolean {
  signsSet ??= parseFactionSigns(stored(FACTION_SIGNS_ENTRY));
  return signsSet;
}

/** What a press asks of the chronicle screen standing. */
export type DrawsSigns = Phaser.Scene & { drawSigns(): void };

/** The signs turned and kept, and drawn at once by a chronicle screen standing. */
export function pressFactionSigns(scenes: Phaser.Scenes.SceneManager): void {
  signsSet = !factionSigns();
  store(FACTION_SIGNS_ENTRY, serialiseFactionSigns(signsSet));
  if (scenes.isActive('ui')) scenes.getScene<DrawsSigns>('ui').drawSigns();
}
