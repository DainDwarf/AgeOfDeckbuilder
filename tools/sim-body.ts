import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATALOGUE } from '../src/content/catalogue';
import { type Campaign, type Choices, civilizationIn, openingChoices } from '../src/rules/campaign';
import { type Catalogue, scheduleOf } from '../src/rules/catalogue';
import { launchedFromCampaign } from '../src/rules/chronicle';
import { freshCampaign } from '../src/rules/save';
import { type FlagValues, readFlags, stringFlag, wholeFlag } from './flags';
import { learnedWithNeeds, technologiesReaching, technologyUnlocking } from './learned-with-needs';
import { PERSONAS } from './personas';
import { type End, playedBy, type Walked } from './sim-driver';

const USAGE = [
  'usage: npm run sim -- [--age <age>] [--region <region>] [--civilization <name>] [--persona <name>]',
  '                      [--seeds <n>] [--turns <n>] [--out <path>] [<technology>...]',
  '       npm run sim -- [<cell flags>] [--turns <n>] --trace <seed> [<technology>...]',
  '       npm run sim -- --personas',
].join('\n');

const FLAGS = {
  age: { type: 'string' },
  region: { type: 'string' },
  civilization: { type: 'string' },
  persona: { type: 'string' },
  seeds: { type: 'string' },
  turns: { type: 'string' },
  out: { type: 'string' },
  trace: { type: 'string' },
  personas: { type: 'boolean' },
} as const;

const HEADER = 'age,region,civilization,learned,persona,seed,ending,cause,turn,ms';

/** What a chronicle of the cell is launched on and played by. */
type Cell = {
  readonly choices: Choices;
  readonly campaign: Campaign;
  readonly persona: string;
};

/** The simulator run on the game's content, on the command line's arguments. */
export function sim(args: readonly string[]): void {
  simulated(CATALOGUE, args);
}

/**
 * The simulator run on the content, on the command line's arguments: the personas printed, one seed
 * traced, or one row per seed of the cell written, the header first, each row as its chronicle ends,
 * to `--out` or else printed. A refusal is thrown before anything is written.
 */
export function simulated(
  catalogue: Catalogue,
  args: readonly string[],
  print: (line: string) => void = console.log,
): void {
  const { values, positionals } = readFlags(args, FLAGS, USAGE);
  if (values.personas !== undefined) {
    for (const line of personasPrinted()) print(line);
    return;
  }
  const cell = cellOf(catalogue, values, positionals);
  const turnCap = wholeFlag(values, 'turns', 1, USAGE) ?? 60;
  const seeds = wholeFlag(values, 'seeds', 1, USAGE) ?? 20;
  const traced = wholeFlag(values, 'trace', 1, USAGE);
  const out = stringFlag(values, 'out', USAGE);

  if (traced !== undefined) {
    if (out !== undefined)
      throw new Error(`--out beside --trace: the trace writes no row\n${USAGE}`);
    const { walked } = chronicleOf(catalogue, cell, traced, turnCap);
    for (const { turn, gambit, command } of walked.landed) {
      print(`turn ${turn} | ${gambit} | ${JSON.stringify(command)}`);
    }
    print(`turn ${walked.end.turn} | ${endRead(walked.end)}`);
    return;
  }

  const path = out === undefined ? undefined : resolve(out);
  const write =
    path === undefined
      ? print
      : (line: string): void => {
          appendFileSync(path, `${line}\n`);
        };
  if (path !== undefined) writeFileSync(path, '');
  write(HEADER);
  for (let seed = 1; seed <= seeds; seed++) {
    const { walked, ms } = chronicleOf(catalogue, cell, seed, turnCap);
    write(rowOf(cell, seed, walked.end, ms));
  }
}

/**
 * The cell the flags name: the age and the region, each defaulting to what the launch screen opens on,
 * on a new campaign that has learned what reaches them, then the technologies named, each with its
 * needs; the civilization, the campaign's first unless named; and the persona, the idle unless named.
 */
function cellOf(catalogue: Catalogue, values: FlagValues, positionals: readonly string[]): Cell {
  const fresh = freshCampaign(catalogue);
  const age = stringFlag(values, 'age', USAGE) ?? openingChoices(catalogue, fresh).age;
  const reached = learnedWithNeeds(catalogue, fresh, technologiesReaching(catalogue, age));
  const opening = openingChoices(catalogue, reached);
  const region = stringFlag(values, 'region', USAGE) ?? opening.region;
  scheduleOf(catalogue, age, region);
  const unlocking = technologyUnlocking(catalogue, region);
  const campaign = learnedWithNeeds(catalogue, reached, [
    ...(unlocking === undefined ? [] : [unlocking]),
    ...positionals,
  ]);
  const civilization = stringFlag(values, 'civilization', USAGE) ?? opening.civilization;
  civilizationIn(catalogue, campaign, civilization);
  const persona = stringFlag(values, 'persona', USAGE) ?? 'idle';
  if (!Object.hasOwn(PERSONAS, persona)) {
    throw new Error(`no persona ${persona}; the personas: ${Object.keys(PERSONAS).join(', ')}`);
  }
  return { choices: { age, region, civilization }, campaign, persona };
}

/** The seed's chronicle of the cell launched and walked by its persona, and the whole milliseconds it took. */
function chronicleOf(
  catalogue: Catalogue,
  { choices, campaign, persona }: Cell,
  seed: number,
  turnCap: number,
): { readonly walked: Walked; readonly ms: number } {
  const launch = Date.now();
  const launched = launchedFromCampaign(catalogue, campaign, choices, seed);
  const walked = playedBy(catalogue, PERSONAS[persona], launched, turnCap);
  return { walked, ms: Date.now() - launch };
}

function rowOf({ choices, campaign, persona }: Cell, seed: number, end: End, ms: number): string {
  return [
    choices.age,
    choices.region,
    choices.civilization,
    campaign.technologies.join(' '),
    persona,
    seed,
    end.outcome,
    causeOf(end) ?? '',
    end.turn,
    ms,
  ].join(',');
}

/** The defeat's cause or the stop's, and nothing for a victory. */
function causeOf(end: End): string | undefined {
  switch (end.outcome) {
    case 'victory':
      return undefined;
    case 'defeat':
    case 'stopped':
      return end.cause;
  }
}

/** The ending or the stop with its cause, a runtime error's naming the group it happened during. */
function endRead(end: End): string {
  switch (end.outcome) {
    case 'victory':
      return 'victory';
    case 'defeat':
      return `defeat ${end.cause}`;
    case 'stopped':
      return end.during === undefined
        ? `stopped ${end.cause}`
        : `stopped ${end.cause} during ${end.during}`;
  }
}

/** Every persona by name, then its gambits as their numbered sentences. */
function personasPrinted(): string[] {
  return Object.entries(PERSONAS).flatMap(([name, gambits]) => [
    `${name}:`,
    ...gambits.map(({ sentence }, at) => `${at + 1}. ${sentence}`),
  ]);
}
