import type { Campaign } from './campaign';
import type { Catalogue } from './catalogue';
import { refusal } from './map-kinds';
import { type ChronicleSave, readSave, type Save, writeSave } from './save';

/**
 * What a save file's text reads as: the save it holds, nothing where it is refused, and the reason
 * for everything refused or dropped on the way.
 */
export type SaveFileRead = { readonly save?: Save; readonly dropped: readonly string[] };

/** The save file's name, dated the player's own day. */
export function saveFileName(day: Date): string {
  const two = (count: number): string => String(count).padStart(2, '0');
  const date = `${day.getFullYear()}-${two(day.getMonth() + 1)}-${two(day.getDate())}`;
  return `age-of-deckbuilder-save-${date}.adbsave`;
}

/** A save as a save file's text: the save's own text, its UTF-8 bytes in base64. */
export function writeSaveFile(
  catalogue: Catalogue,
  campaign: Campaign,
  progress?: ChronicleSave,
): string {
  const bytes = new TextEncoder().encode(writeSave(catalogue, campaign, progress));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

/**
 * The save a save file's text holds, read as `readSave` reads a save: refused where it is not base64,
 * not UTF-8 text, or holds no campaign the reading takes, the chronicle beside such a one included.
 */
export function readSaveFile(catalogue: Catalogue, text: string): SaveFileRead {
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(text), (character) => character.charCodeAt(0));
  } catch {
    return { dropped: [refusal(catalogue, 'the save file is not base64')] };
  }
  let decoded: string;
  try {
    decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { dropped: [refusal(catalogue, 'the save file is not UTF-8 text')] };
  }
  const { campaign, chronicle, dropped } = readSave(catalogue, decoded);
  if (campaign === undefined) return { dropped };
  return { save: { campaign, chronicle }, dropped };
}
