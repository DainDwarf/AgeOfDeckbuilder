import type { Entering } from '../rules/catalogue';
import { enemyEntering } from '../rules/enemies';
import type { TileCoords } from '../rules/map';
import type { TileBlock } from '../rules/state';
import { blockLine } from './refusal-lines';
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

/**
 * What `unit` reads on the screen under the console: whether its chronicle has ended, the tile
 * selected, whether the content holds a unit kind and a script, and why a tile refuses a kind.
 */
export type UnitReads = {
  readonly ended: boolean;
  readonly selected: TileCoords | undefined;
  readonly holdsKind: (kind: string) => boolean;
  readonly holdsScript: (script: string) => boolean;
  readonly refusal: (kind: string, tile: TileCoords) => TileBlock | undefined;
};

/**
 * The entries the screen under the console holds: `seed`, with the seed it reads there, where it holds
 * it, whether it holds the two switches, and `unit`, with what it reads there, where it holds it.
 */
export type Screen = {
  readonly seed: { readonly reads: number | undefined } | undefined;
  readonly switches: boolean;
  readonly unit: UnitReads | undefined;
};

/** What the screen does once a line has run: a chronicle launched on a seed, or a unit entered. */
export type Next =
  | { readonly kind: 'launch'; readonly seed: number }
  | { readonly kind: 'enter'; readonly entering: Entering };

/**
 * What a line left behind: the veils the map draws under, the one line the console answers, and
 * what the screen does next, where the line launches a chronicle or enters a unit.
 */
export type Ran = {
  readonly veils: Veils;
  readonly answer: string | undefined;
  readonly next?: Next;
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
  const unheld: Ran = { veils, answer: text('console.no-entry', { line: trimmed }) };
  if (word === 'seed')
    return screen.seed === undefined ? unheld : seeded(after, veils, screen.seed.reads);
  if (word === 'unit')
    return screen.unit === undefined ? unheld : unitRan(after, veils, screen.unit);

  const entry = SWITCHES.find((each) => each === word);
  if (entry === undefined || after.length > 0 || !screen.switches) return unheld;

  const thrown: Veils = { ...veils, [entry]: !veils[entry] };
  return { veils: thrown, answer: text(stateOf(entry, thrown[entry])) };
}

/** `seed` with what stood after it: the seed read where nothing did, and a launch on a seed typed. */
function seeded(after: string, veils: Veils, reads: number | undefined): Ran {
  if (after.length === 0) {
    const answer =
      reads === undefined ? text('console.no-chronicle') : text('console.seed', { seed: reads });
    return { veils, answer };
  }
  const seed = seedOf(after);
  if (seed === undefined) return { veils, answer: text('console.not-a-seed', { typed: after }) };
  return { veils, answer: undefined, next: { kind: 'launch', seed } };
}

/**
 * `unit` with what stood after it: the first refusal that holds, or the unit entered on the tile
 * selected, an enemy's on the script named and the player's where none is, and said so.
 */
function unitRan(after: string, veils: Veils, reads: UnitReads): Ran {
  const refused = (answer: string): Ran => ({ veils, answer });
  if (reads.ended) return refused(text('console.ended'));
  const words = after.length === 0 ? [] : after.split(/\s+/);
  if (words.length === 0 || words.length > 2) return refused(text('console.unit-takes'));
  const tile = reads.selected;
  if (tile === undefined) return refused(text('console.no-tile-selected'));
  const [type, script] = words;
  if (!reads.holdsKind(type)) return refused(text('console.no-unit-kind', { kind: type }));
  if (script !== undefined && !reads.holdsScript(script))
    return refused(text('console.no-script', { script }));
  const block = reads.refusal(type, tile);
  if (block !== undefined) return refused(blockLine(block));
  if (script === undefined) {
    const entering: Entering = { type, tile, faction: 'player' };
    return {
      veils,
      answer: text('console.entered', { kind: type }),
      next: { kind: 'enter', entering },
    };
  }
  const entering = enemyEntering(type, script, tile);
  return {
    veils,
    answer: text('console.entered-enemy', { kind: type, script }),
    next: { kind: 'enter', entering },
  };
}
