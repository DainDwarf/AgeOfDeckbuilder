import type Phaser from 'phaser';
import type { ButtonSign } from './cast';
import type { CornerLayout } from './corner-layout';
import type { Stratum } from './design-space';
import { LOOK } from './look';
import { createCornerButton } from './menu';
import { SUNK } from './resource-bar';
import { type TextKey, text } from './text';
import type { Tooltip } from './tooltip';

/** A button showing and hiding a display: sunk in its well while it is shown, standing on its face while it is not. */
export type DisplayButton = { sink(sunk: boolean): void };

/**
 * A button at the screen's top right corner, drawn as the Menu button is, wearing the symbol's sign at
 * its place there and naming itself on the tooltip as `reads` has it; a press on it is `pressed`.
 */
export function createDisplayButton(
  scene: Phaser.Scene,
  on: Stratum,
  tooltip: Tooltip,
  {
    symbol,
    at,
    reads,
  }: { readonly symbol: ButtonSign; readonly at: keyof CornerLayout; readonly reads: TextKey },
  pressed: () => void,
): DisplayButton {
  const button = createCornerButton(
    scene,
    on,
    { symbol, name: symbol, at },
    { tooltip, reads: text(reads) },
    pressed,
  );
  return {
    sink(sunk: boolean): void {
      button.latch(sunk);
      if (sunk) button.ink(LOOK.charcoalInk, SUNK);
      else button.ink();
    },
  };
}
