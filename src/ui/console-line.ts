import { type TextKey, text } from './text';
import type { Veil, Veils } from './veils';

/** Every switch the console knows, each the word that switches the veil it is named for. */
const SWITCHES: readonly Veil[] = ['uncharted', 'fog'];

/** How a veil reads once its switch has been thrown. */
function stateOf(veil: Veil, on: boolean): TextKey {
  switch (veil) {
    case 'uncharted':
      return on ? 'console.uncharted-veil-on' : 'console.uncharted-veil-off';
    case 'fog':
      return on ? 'console.fog-veil-on' : 'console.fog-veil-off';
  }
}

/** The seed a text names, never wrapped into range: a seed is a signed 32-bit integer. */
function seedOf(typed: string): number | undefined {
  if (!/^-?\d+$/.test(typed)) return undefined;
  const read = Number(typed);
  if (read < -(2 ** 31) || read >= 2 ** 31) return undefined;
  // A negative zero would stand in the chronicle and come back from the save as zero.
  return read === 0 ? 0 : read;
}

/** What the screen under the console holds for `seed`: the seed it reads, and whether it launches. */
export type Screen = { readonly seed: number | undefined; readonly launches: boolean };

/**
 * What a line left behind: the veils the map draws under, the one line the console answers, and the
 * seed a chronicle is launched on, where the line launches one.
 */
export type Ran = {
  readonly veils: Veils;
  readonly answer: string | undefined;
  readonly launch?: number;
};

/**
 * One line run at the console. A line that threw no switch hands back the very veils it was given,
 * so whoever runs the line knows by that alone whether anything changed.
 */
export function runLine(line: string, veils: Veils, screen: Screen): Ran {
  const trimmed = line.trim();
  if (trimmed.length === 0) return { veils, answer: undefined };

  const [word] = trimmed.split(/\s/, 1);
  const after = trimmed.slice(word.length).trim();
  if (word === 'seed') return seeded(after, veils, screen);

  const entry = SWITCHES.find((each) => each === word);
  if (entry === undefined || after.length > 0) {
    return { veils, answer: text('console.no-entry', { line: trimmed }) };
  }

  const thrown: Veils = { ...veils, [entry]: !veils[entry] };
  return { veils: thrown, answer: text(stateOf(entry, thrown[entry])) };
}

/** `seed` with what stood after it: the seed read where nothing did, and a launch on a seed typed. */
function seeded(after: string, veils: Veils, screen: Screen): Ran {
  if (after.length === 0) {
    const answer =
      screen.seed === undefined
        ? text('console.no-chronicle')
        : text('console.seed', { seed: screen.seed });
    return { veils, answer };
  }
  const seed = seedOf(after);
  if (seed === undefined) return { veils, answer: text('console.not-a-seed', { typed: after }) };
  if (!screen.launches) return { veils, answer: text('console.no-launch') };
  return { veils, answer: undefined, launch: seed };
}
