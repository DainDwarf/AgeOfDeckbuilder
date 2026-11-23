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
export type DisplayButton = {
  shown(): boolean;
  /** The display hidden if it is shown and shown if it is hidden, as a press on the button switches it. */
  switch(): void;
};

/**
 * A button at the screen's top right corner, drawn as the Menu button is, wearing the symbol's sign at
 * its place there and naming itself on the tooltip as `reads` has it; the display stands `shown`, and
 * `show` is told what it stands each time the button switches it.
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
  shown: boolean,
  show: (shown: boolean) => void,
): DisplayButton {
  let showing = shown;
  const sink = (): void => {
    button.latch(showing);
    if (showing) button.ink(LOOK.charcoalInk, SUNK);
    else button.ink();
  };
  const switched = (): void => {
    showing = !showing;
    show(showing);
    sink();
  };
  const button = createCornerButton(
    scene,
    on,
    { symbol, name: symbol, at },
    { tooltip, reads: text(reads) },
    switched,
  );
  sink();
  return { shown: () => showing, switch: switched };
}
