import { parseArgs } from 'node:util';

/** The flags a tool reads, by name. */
export type FlagTable = Readonly<Record<string, { readonly type: 'string' | 'boolean' }>>;

/** What the command line set of each flag. */
export type FlagValues = Readonly<Record<string, string | boolean | undefined>>;

/**
 * The command line read against the tool's flags, and the arguments beside them; a flag no table holds
 * is refused.
 */
export function readFlags(
  args: readonly string[],
  flags: FlagTable,
  usage: string,
): { readonly values: FlagValues; readonly positionals: readonly string[] } {
  // Non-strict, so a bare string flag reads `true`; an unknown flag is then accepted and refused below.
  const { values, positionals } = parseArgs({
    args: [...args],
    options: flags,
    strict: false,
    allowPositionals: true,
  });
  const unknown = Object.keys(values).find((flag) => !Object.hasOwn(flags, flag));
  if (unknown !== undefined) throw new Error(`no flag --${unknown}\n${usage}`);
  return { values, positionals };
}

/** What a string flag names, and nothing where it is not set; one set bare is refused. */
export function stringFlag(values: FlagValues, flag: string, usage: string): string | undefined {
  const value = values[flag];
  if (typeof value === 'boolean') throw new Error(`--${flag} names nothing\n${usage}`);
  return value;
}

/**
 * The whole number a flag names, `least` or more and `most` at most where one is given, and nothing
 * where it is not set; any other is refused.
 */
export function wholeFlag(
  values: FlagValues,
  flag: string,
  least: number,
  usage: string,
  most?: number,
): number | undefined {
  const value = stringFlag(values, flag, usage);
  if (value === undefined) return undefined;
  return wholeNumber(flag, value, least, usage, most);
}

/**
 * The whole number a value of the flag names, `least` or more and `most` at most where one is given;
 * any other is refused.
 */
export function wholeNumber(
  flag: string,
  value: string,
  least: number,
  usage: string,
  most?: number,
): number {
  const whole = Number(value);
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(whole) ||
    whole < least ||
    (most !== undefined && whole > most)
  ) {
    const bounds = most === undefined ? `of ${least} or more` : `from ${least} to ${most}`;
    throw new Error(`--${flag} is not a whole number ${bounds}: ${value}\n${usage}`);
  }
  return whole;
}

/**
 * What a flag's comma list names, each item read in the order named, and nothing where it is not set;
 * one read twice is refused.
 */
export function listFlag<Item extends string | number>(
  values: FlagValues,
  flag: string,
  usage: string,
  read: (item: string) => Item,
): Item[] | undefined {
  const value = stringFlag(values, flag, usage);
  if (value === undefined) return undefined;
  const items: Item[] = [];
  for (const item of value.split(',')) {
    const named = read(item);
    if (items.includes(named)) throw new Error(`--${flag} names ${named} twice`);
    items.push(named);
  }
  return items;
}
