import { type TextKey, text } from './text';
import type { Veil, Veils } from './veils';

/** Every entry the console knows, each the word that switches the veil it is named for. */
const ENTRIES: readonly Veil[] = ['uncharted', 'fog'];

/** How a veil reads once its switch has been thrown. */
function stateOf(veil: Veil, on: boolean): TextKey {
  switch (veil) {
    case 'uncharted':
      return on ? 'console.uncharted-veil-on' : 'console.uncharted-veil-off';
    case 'fog':
      return on ? 'console.fog-veil-on' : 'console.fog-veil-off';
  }
}

/** What a line left behind: the veils the map draws under, and the one line the console answers. */
export type Ran = { readonly veils: Veils; readonly answer: string | undefined };

/**
 * One line run at the console: a switch throws its veil and answers the state that veil stands in,
 * an empty line answers nothing at all, and any other word is answered as one the console holds no
 * entry for. The one place a line becomes an act. A line that threw no switch hands back the very
 * veils it was given, so whoever runs the line knows by that alone whether anything changed.
 */
export function runLine(line: string, veils: Veils): Ran {
  const word = line.trim();
  if (word.length === 0) return { veils, answer: undefined };

  const entry = ENTRIES.find((each) => each === word);
  if (entry === undefined) return { veils, answer: text('console.no-entry', { word }) };

  const thrown: Veils = { ...veils, [entry]: !veils[entry] };
  return { veils: thrown, answer: text(stateOf(entry, thrown[entry])) };
}
