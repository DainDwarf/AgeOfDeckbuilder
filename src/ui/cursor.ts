/** The pictures the pointer wears. */
export type Cursor =
  | 'arrow'
  | 'pointing hand'
  | 'open hand'
  | 'closed hand'
  | 'not-allowed sign'
  | 'help sign'
  | 'step sign'
  | 'attack sign'
  | 'aim sign';

import { assetAt } from './sheet';

/** The folder the pictures stand in under the assets folder, one folder in it for each size they are painted at. */
const CURSOR_FOLDER = 'store/fantasy-rpg-cursors-gold';

/** How wide the pointer is drawn, in CSS pixels, and how wide the pictures a screen of two device pixels to the CSS pixel takes are painted. */
const CURSOR_SIDE = 32;
const DENSE_SIDE = 64;

/** A picture: its file, the point it points with in the 32 px picture's pixels, and the browser's own it falls back to. */
type CursorPicture = {
  readonly file: string;
  readonly point: { readonly x: number; readonly y: number };
  readonly fallback: string;
};

const MIDDLE = { x: 16, y: 16 };

export const CURSORS: Readonly<Record<Cursor, CursorPicture>> = {
  arrow: { file: 'pointer002.png', point: { x: 1, y: 0 }, fallback: 'default' },
  'pointing hand': { file: 'hand002.png', point: { x: 1, y: 1 }, fallback: 'pointer' },
  'open hand': { file: 'hand004.png', point: MIDDLE, fallback: 'grab' },
  'closed hand': { file: 'hand003.png', point: MIDDLE, fallback: 'grabbing' },
  'not-allowed sign': { file: 'denied001.png', point: MIDDLE, fallback: 'not-allowed' },
  'help sign': { file: 'question002.png', point: MIDDLE, fallback: 'help' },
  'step sign': { file: 'walk001.png', point: MIDDLE, fallback: 'pointer' },
  'attack sign': { file: 'sword001.png', point: MIDDLE, fallback: 'pointer' },
  'aim sign': { file: 'pointer013.png', point: MIDDLE, fallback: 'pointer' },
};

/** Where a picture of that width stands, under the assets folder. */
function cursorFile(side: number, picture: CursorPicture): string {
  return `${CURSOR_FOLDER}/${side}/${picture.file}`;
}

/**
 * The canvas's cursor style for the picture, its files at the addresses `at` gives: the 64 px picture
 * drawn across 32 where `dense`, the 32 px picture otherwise.
 */
export function cursorStyle(cursor: Cursor, at: (file: string) => string, dense: boolean): string {
  const picture = CURSORS[cursor];
  const { x, y } = picture.point;
  const drawn = dense
    ? `image-set(url("${at(cursorFile(DENSE_SIDE, picture))}") ${DENSE_SIDE / CURSOR_SIDE}x)`
    : `url("${at(cursorFile(CURSOR_SIDE, picture))}")`;
  return `${drawn} ${x} ${y}, ${picture.fallback}`;
}

/** Whether the screen draws two device pixels or more to the CSS pixel, and takes the pack's 64 px pictures. */
export function dense(): boolean {
  return window.devicePixelRatio >= 2;
}

/** The pictures fetched once, kept so that the browser's cache keeps them. */
const fetched: HTMLImageElement[] = [];

/**
 * Every picture the pointer wears at the screen's density fetched: a browser fetches a cursor's
 * picture as it first shows it, and shows its fallback until then. One that fails leaves the fallback.
 */
export async function fetchCursors(): Promise<void> {
  const side = dense() ? DENSE_SIDE : CURSOR_SIDE;
  await Promise.all(
    Object.values(CURSORS).map((picture) => {
      const image = new Image();
      image.src = assetAt(cursorFile(side, picture));
      fetched.push(image);
      return image.decode().catch(() => undefined);
    }),
  );
}
