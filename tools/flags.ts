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

/** The whole number a flag names, `least` or more, and nothing where it is not set; any other is refused. */
export function wholeFlag(
  values: FlagValues,
  flag: string,
  least: number,
  usage: string,
): number | undefined {
  const value = stringFlag(values, flag, usage);
  if (value === undefined) return undefined;
  const whole = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(whole) || whole < least) {
    throw new Error(`--${flag} is not a whole number of ${least} or more: ${value}\n${usage}`);
  }
  return whole;
}
