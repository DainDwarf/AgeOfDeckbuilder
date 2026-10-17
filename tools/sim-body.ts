import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATALOGUE } from '../src/content/catalogue';
import {
  type Campaign,
  type Choices,
  civilizationIn,
  openingChoices,
  paidInto,
} from '../src/rules/campaign';
import { type Catalogue, scheduleOf } from '../src/rules/catalogue';
import { countOn, launchedFromCampaign } from '../src/rules/chronicle';
import type { TileCoords } from '../src/rules/map';
import { RESOURCES } from '../src/rules/resources';
import { freshCampaign } from '../src/rules/save';
import { offered } from '../src/rules/schedule';
import { type Change, plays, type Sequence, walked } from '../src/rules/stages';
import { type Chronicle, cardsInPiles, type Deal } from '../src/rules/state';
import { type Faction, type Unit, unitAt } from '../src/rules/units';
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

/** One column of a row: its name in the header, and what the chronicle reads in it. */
type Column = readonly [name: string, value: string | number];

/** Every faction, in the header's order. */
const FACTIONS = Object.keys({
  player: true,
  enemy: true,
  neutral: true,
} satisfies Record<Faction, true>) as Faction[];

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
  for (let seed = 1; seed <= seeds; seed++) {
    const { launch, walked, ms } = chronicleOf(catalogue, cell, seed, turnCap);
    const columns = [
      ...cellColumns(cell, seed, walked.end, ms),
      ...chronicleColumns(catalogue, cell.campaign, launch, walked),
    ];
    if (seed === 1) write(columns.map(([name]) => name).join(','));
    write(columns.map(([, value]) => value).join(','));
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

/**
 * The seed's chronicle of the cell launched, then walked by its persona, and the whole milliseconds
 * it took.
 */
function chronicleOf(
  catalogue: Catalogue,
  { choices, campaign, persona }: Cell,
  seed: number,
  turnCap: number,
): { readonly launch: Sequence; readonly walked: Walked; readonly ms: number } {
  const started = Date.now();
  const launch = launchedFromCampaign(catalogue, campaign, choices, seed);
  const walked = playedBy(catalogue, PERSONAS[persona], launch, turnCap);
  return { launch, walked, ms: Date.now() - started };
}

function cellColumns(
  { choices, campaign, persona }: Cell,
  seed: number,
  end: End,
  ms: number,
): Column[] {
  return [
    ['age', choices.age],
    ['region', choices.region],
    ['civilization', choices.civilization],
    ['learned', campaign.technologies.join(' ')],
    ['persona', persona],
    ['seed', seed],
    ['ending', end.outcome],
    ['cause', causeOf(end) ?? ''],
    ['turn', end.turn],
    ['ms', ms],
  ];
}

/**
 * The columns a row reads off a chronicle walked from its launch on the campaign: what its ending
 * paid, the chronicle it was left on, and what the launch and every command landed did on the way.
 */
export function chronicleColumns(
  catalogue: Catalogue,
  campaign: Campaign,
  launch: Sequence,
  { chronicle, end, landed }: Walked,
): Column[] {
  const stages = [...launch.stages, ...landed.flatMap((command) => command.stages)];
  const played = plays(stages).map(({ card }) => card);
  const killed: Unit[] = [];
  const reachedOn = new Map<string, number>();
  for (const stage of walked(stages)) {
    if (stage.kind !== 'change') continue;
    if (stage.name === 'killed') killed.push(unitKilled(stage));
    if (stage.name !== 'reached') continue;
    for (const [at, { id, reached }] of stage.chronicle.achievements.entries()) {
      if (reached && !stage.before.achievements[at].reached) {
        reachedOn.set(id, stage.chronicle.turn);
      }
    }
  }
  const deals = landed.flatMap(({ turn, command, stages: resolved }) =>
    command.type === 'take'
      ? [`${turn}:${dealTaken(catalogue, resolved[0].before.deals[0], command.at)}`]
      : [],
  );
  const unplayed = new Set(cardsInPiles(chronicle).map(({ id }) => id));
  for (const card of played) unplayed.delete(card);

  return [
    ['influence', influencePaid(catalogue, campaign, chronicle, end)],
    ['capstone', chronicle.timeline.capstone.id],
    ['capstone-turn', chronicle.timeline.capstone.turn],
    ...RESOURCES.map((resource): Column => [resource, chronicle.resources[resource]]),
    ['population', chronicle.population],
    ['held', chronicle.held.length],
    ['neutral-population', chronicle.neutral?.population ?? ''],
    ...FACTIONS.map((faction): Column => [`units:${faction}`, byKind(chronicle.units, faction)]),
    ...FACTIONS.map((faction): Column => [`killed:${faction}`, byKind(killed, faction)]),
    ['played', counted(played)],
    ['unplayed', [...unplayed].join(' ')],
    ['deals', deals.join(' ')],
    ...chronicle.achievements.flatMap((held): Column[] => [
      [`count:${held.id}`, countOn(catalogue, chronicle, held)],
      [`reached:${held.id}`, reachedOn.get(held.id) ?? ''],
    ]),
  ];
}

/** What the ending paid into the campaign, and nothing for a stop, which pays nothing. */
function influencePaid(
  catalogue: Catalogue,
  campaign: Campaign,
  chronicle: Chronicle,
  end: End,
): number | '' {
  switch (end.outcome) {
    case 'victory':
    case 'defeat':
      return paidInto(catalogue, campaign, chronicle).influence;
    case 'stopped':
      return '';
  }
}

/** The unit a `killed` change killed: the one standing on its tile on the chronicle it was raised on. */
function unitKilled({ before, tile }: Change & { readonly tile: TileCoords }): Unit {
  const unit = unitAt(before.units, tile);
  if (unit === undefined) throw new Error('a unit killed on a tile no unit stood on');
  return unit;
}

/** The deal and the entry taken of it, by its place in the order dealt. */
function dealTaken(catalogue: Catalogue, deal: Deal, at: number): string {
  const entry = offered(catalogue, deal)[at];
  switch (deal.of) {
    case 'event':
      return `${deal.event}>${entry}`;
    case 'capture':
      return `${deal.building}>${entry}`;
  }
}

/** The faction's units, by kind with their count. */
function byKind(units: readonly Unit[], faction: Faction): string {
  return counted(units.filter((unit) => unit.faction === faction).map(({ stats }) => stats.type));
}

/** Each name once, in the order first met, with the times it is met: `name:2 other:1`. */
function counted(names: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].map(([name, count]) => `${name}:${count}`).join(' ');
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
