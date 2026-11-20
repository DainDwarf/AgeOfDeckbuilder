import type Phaser from 'phaser';
import { store, stored } from './storage';
import { text } from './text';

/**
 * The sizes the chronicle screen is drawn at: a unit across that many hundredths of a CSS pixel, or
 * the largest size the window holds 1280 by 720 units at.
 */
export const INTERFACE_SIZES = [100, 125, 150, 200, 'largest'] as const;

export type InterfaceSize = (typeof INTERFACE_SIZES)[number];

/** Where the browser keeps the size, apart from what the Controls window's Default puts back. */
const INTERFACE_SIZE_ENTRY = 'age-of-deckbuilder.interface-size';

/** The size kept: whatever is not one of the sizes stands at 100%. */
export function parseInterfaceSize(stored: string | null): InterfaceSize {
  return INTERFACE_SIZES.find((size) => String(size) === stored) ?? 100;
}

export function serialiseInterfaceSize(size: InterfaceSize): string {
  return String(size);
}

/** The size a press moves that one to, Largest going back to the first. */
export function sizeAfter(size: InterfaceSize): InterfaceSize {
  return INTERFACE_SIZES[(INTERFACE_SIZES.indexOf(size) + 1) % INTERFACE_SIZES.length];
}

/** How many CSS pixels a unit is drawn across at the size where the window holds it: Largest asks for no end of them. */
export function pixelsAt(size: InterfaceSize): number {
  switch (size) {
    case 100:
    case 125:
    case 150:
    case 200:
      return size / 100;
    case 'largest':
      return Number.POSITIVE_INFINITY;
  }
}

/** What the Interface size row reads at the size. */
export function sizeRead(size: InterfaceSize): string {
  switch (size) {
    case 100:
    case 125:
    case 150:
    case 200:
      return text('graphics.size', { size });
    case 'largest':
      return text('graphics.largest');
  }
}

/** What the chronicle screen is drawn at, read from the browser the first time it is asked for. */
let sizeSet: InterfaceSize | undefined;

export function interfaceSize(): InterfaceSize {
  sizeSet ??= parseInterfaceSize(stored(INTERFACE_SIZE_ENTRY));
  return sizeSet;
}

// A change of size is no change of window: Phaser emits no RESIZE for it, and `refresh` does
// (docs/PHASER.md).
/** The size moved on and kept, and everything standing laid out again at it. */
export function pressInterfaceSize(scale: Phaser.Scale.ScaleManager): void {
  sizeSet = sizeAfter(interfaceSize());
  store(INTERFACE_SIZE_ENTRY, serialiseInterfaceSize(sizeSet));
  scale.refresh();
}
