// The layers are the map's. This import is a type and has to stay one: a value taken from there
// would pull Phaser into the Node the tests on this module run in.
import type { Layer, Layers } from './map';
import { type TextKey, text } from './text';

/** Every entry the console knows, each the word that switches the layer it is named for. */
const ENTRIES: readonly Layer[] = ['uncharted', 'fog'];

/** How a layer reads once its switch has been thrown. */
function stateOf(layer: Layer, on: boolean): TextKey {
  switch (layer) {
    case 'uncharted':
      return on ? 'console.uncharted-on' : 'console.uncharted-off';
    case 'fog':
      return on ? 'console.fog-on' : 'console.fog-off';
  }
}

/** What a line left behind: the layers the map draws under, and the one line the console answers. */
export type Ran = { readonly layers: Layers; readonly answer: string | undefined };

/**
 * One line run at the console: a switch throws its layer and answers the state that layer stands in,
 * an empty line answers nothing at all, and any other word is answered as one the console holds no
 * entry for. The one place a line becomes an act. A line that threw no switch hands back the very
 * layers it was given, so whoever runs the line knows by that alone whether anything changed.
 */
export function runLine(line: string, layers: Layers): Ran {
  const word = line.trim();
  if (word.length === 0) return { layers, answer: undefined };

  const entry = ENTRIES.find((each) => each === word);
  if (entry === undefined) return { layers, answer: text('console.no-entry', { word }) };

  const thrown: Layers = { ...layers, [entry]: !layers[entry] };
  return { layers: thrown, answer: text(stateOf(entry, thrown[entry])) };
}
