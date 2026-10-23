import { appendFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATALOGUE } from '../src/content/catalogue';
import {
  available,
  type Campaign,
  civilizationIn,
  openingChoices,
  paidInto,
} from '../src/rules/campaign';
import {
  ageOf,
  type Catalogue,
  type Civilization,
  catalogued,
  civilizationMisfit,
  type Region,
} from '../src/rules/catalogue';
import { countOn, launched } from '../src/rules/chronicle';
import type { TileCoords } from '../src/rules/map';
import { entryOf } from '../src/rules/map-kinds';
import { RESOURCES } from '../src/rules/resources';
import { freshCampaign } from '../src/rules/save';
import { offered } from '../src/rules/schedule';
import { type Change, plays, type Sequence, walked } from '../src/rules/stages';
import { type Chronicle, cardsInPiles, type Deal } from '../src/rules/state';
import { type Faction, type Unit, unitAt } from '../src/rules/units';
import { type FlagValues, readFlags, stringFlag, wholeFlag } from './flags';
import {
  learnedWithNeeds,
  technologiesEarnedIn,
  technologiesReaching,
  technologyUnlocking,
} from './learned-with-needs';
import { PERSONAS } from './personas';
import { type Driven, type End, type Persona, playedBy } from './sim-driver';

const USAGE = [
  'usage: npm run sim -- [--age <age>] [--region <region>] [--civilization <json|path>] [--persona <name>]',
  '                      [--goal <technology>] [--without <n>] [--off <switch>[,<switch>...]] [--seeds <n>|<a>-<b>]',
  '                      [--turns <n>] [--out <path>] [<technology>...]',
  '       npm run sim -- [<cell flags>] [--turns <n>] --trace <seed> [<technology>...]',
  '       npm run sim -- --personas',
].join('\n');

const FLAGS = {
  age: { type: 'string' },
  region: { type: 'string' },
  civilization: { type: 'string' },
  persona: { type: 'string' },
  goal: { type: 'string' },
  without: { type: 'string' },
  off: { type: 'string' },
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

/** What a cell may be played with switched off, in the order `--off`'s refusal lists them. */
const SWITCHES = ['camps', 'neutral', 'events', 'capstone'] as const;

/** One thing a cell may be played with switched off. */
type Switch = (typeof SWITCHES)[number];

/** What a chronicle of the cell is launched on and played by. */
type Cell = {
  /** The content the cell's chronicles are played on: the game's, its region switched off as `off` names. */
  readonly catalogue: Catalogue;
  readonly age: string;
  readonly region: string;
  readonly campaign: Campaign;
  readonly civilization: Civilization;
  /** The civilization as the record carries it: whole where it was handed in, by name otherwise. */
  readonly recorded: string | Civilization;
  readonly persona: string;
  /** The technology whose achievement the persona's goal gambits go for, where one is named. */
  readonly goal: string | undefined;
  /** The number of the persona's gambit left out of its walk, as `--personas` numbers them. */
  readonly without: number | undefined;
  /** The persona's gambits the chronicles are played by, the one left out excepted. */
  readonly walk: Persona;
  /** What the cell is played with switched off, in the order `--off` names them. */
  readonly off: readonly Switch[];
};

/** The seeds of the cell, the first and the last included, and the flag as it was given. */
type Seeds = { readonly first: number; readonly last: number; readonly given: number | string };

/** The simulator run on the game's content, on the command line's arguments. */
export function sim(args: readonly string[]): void {
  simulated(CATALOGUE, args);
}

/**
 * The simulator run on the content, on the command line's arguments: the personas printed, one seed
 * traced after the cell's record, or one row per seed of the cell written, the record then the header
 * first, each row as its chronicle ends, to `--out` or else printed. A refusal is thrown before
 * anything is written.
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
  const seeds = seedsOf(values);
  const traced = wholeFlag(values, 'trace', 1, USAGE);
  const out = stringFlag(values, 'out', USAGE);

  if (traced !== undefined) {
    if (out !== undefined)
      throw new Error(`--out beside --trace: the trace writes no row\n${USAGE}`);
    print(recordOf(cell, turnCap, { trace: traced }));
    const { driven } = chronicleOf(cell, traced, turnCap);
    for (const { turn, gambit, command } of driven.landed) {
      print(`turn ${turn} | ${gambit} | ${JSON.stringify(command)}`);
    }
    print(`turn ${driven.end.turn} | ${endRead(driven.end)}`);
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
  write(recordOf(cell, turnCap, { seeds: seeds.given }));
  for (let seed = seeds.first; seed <= seeds.last; seed++) {
    const { launch, driven, ms } = chronicleOf(cell, seed, turnCap);
    const columns: Column[] = [
      ['seed', seed],
      ['ending', driven.end.outcome],
      ['cause', causeOf(driven.end) ?? ''],
      ['turn', driven.end.turn],
      ['ms', ms],
      ...chronicleColumns(cell.catalogue, cell.campaign, launch, driven, cell.off),
    ];
    if (seed === seeds.first) write(columns.map(([name]) => name).join(','));
    write(columns.map(([, value]) => value).join(','));
  }
}

/**
 * The cell the flags name: the age and the region, each defaulting to what the launch screen opens on,
 * on a new campaign that has learned what reaches them, then the technologies named, each with its
 * needs; the civilization, the campaign's first unless one is handed in; the persona, the idle
 * unless named, built for the goal `--goal` names, its gambit `--without` numbers left out of its walk;
 * and the content, its region switched off as `--off` names.
 */
function cellOf(game: Catalogue, values: FlagValues, positionals: readonly string[]): Cell {
  const fresh = freshCampaign(game);
  const age = stringFlag(values, 'age', USAGE) ?? openingChoices(game, fresh).age;
  const reached = learnedWithNeeds(game, fresh, technologiesReaching(game, age));
  const opening = openingChoices(game, reached);
  const region = stringFlag(values, 'region', USAGE) ?? opening.region;
  const off = switchesOf(values);
  const catalogue = switchedOff(game, age, region, off);
  const unlocking = technologyUnlocking(catalogue, region);
  const campaign = learnedWithNeeds(catalogue, reached, [
    ...(unlocking === undefined ? [] : [unlocking]),
    ...positionals,
  ]);
  const handedIn = stringFlag(values, 'civilization', USAGE);
  const civilization =
    handedIn === undefined
      ? civilizationIn(catalogue, campaign, opening.civilization)
      : civilizationHandedIn(catalogue, handedIn);
  const recorded = handedIn === undefined ? opening.civilization : civilization;
  const persona = stringFlag(values, 'persona', USAGE) ?? 'idle';
  if (!Object.hasOwn(PERSONAS, persona)) {
    throw new Error(`no persona ${persona}; the personas: ${Object.keys(PERSONAS).join(', ')}`);
  }
  const goal = stringFlag(values, 'goal', USAGE);
  if (goal !== undefined) {
    const read = technologiesEarnedIn(catalogue, age).filter((technology) =>
      available(catalogue, technology, campaign.technologies),
    );
    if (!read.includes(goal)) {
      throw new Error(
        `no goal ${goal}; the technologies the cell's chronicles read: ${read.join(', ')}`,
      );
    }
  }
  const gambits = PERSONAS[persona](goal);
  const without = wholeFlag(values, 'without', 1, USAGE, gambits.length);
  const walk = gambits.filter((_, at) => at + 1 !== without);
  return {
    catalogue,
    age,
    region,
    campaign,
    civilization,
    recorded,
    persona,
    goal,
    without,
    walk,
    off,
  };
}

/** What `--off` switches off, in the order named; nothing where it is not set. */
function switchesOf(values: FlagValues): Switch[] {
  const value = stringFlag(values, 'off', USAGE);
  if (value === undefined) return [];
  const off: Switch[] = [];
  for (const name of value.split(',')) {
    const named = SWITCHES.find((each) => each === name);
    if (named === undefined) {
      throw new Error(`--off names no switch ${name}; the switches: ${SWITCHES.join(', ')}`);
    }
    if (off.includes(named)) throw new Error(`--off names ${named} twice`);
    off.push(named);
  }
  return off;
}

/**
 * The content handed in, the region of the age switched off as named, validated as the content is.
 * An age or a region the content does not hold is refused.
 */
export function switchedOff(
  catalogue: Catalogue,
  age: string,
  region: string,
  off: readonly Switch[],
): Catalogue {
  const owned = ageOf(catalogue, age);
  const switched = off.reduce(
    regionSwitchedOff,
    entryOf(catalogue, owned.regions, region, 'region'),
  );
  const regions = { ...owned.regions, [region]: switched };
  return catalogued({ ...catalogue, ages: { ...catalogue.ages, [age]: { ...owned, regions } } });
}

/**
 * The region with one thing switched off: no camp dealt, no band for the neutral's city, its first
 * deal or its capstone's turn due past any turn a chronicle reaches.
 */
function regionSwitchedOff(region: Region, off: Switch): Region {
  // Past every turn `--turns` admits, a safe integer, and still past it once the capstone's landing
  // turn is added to it as the next deal's.
  const past = [2 ** 53, 2 ** 53] as const;
  switch (off) {
    case 'camps':
      return { ...region, camps: 0 };
    case 'neutral':
      return { ...region, neutralFromCentre: undefined };
    case 'events':
      return { ...region, schedule: { ...region.schedule, spacing: past } };
    case 'capstone':
      return { ...region, schedule: { ...region.schedule, window: past } };
  }
}

/** The seeds `--seeds` names: 1 to a count, or a range `<a>-<b>`, both included; 1 to 20 where it is not set. */
function seedsOf(values: FlagValues): Seeds {
  const value = stringFlag(values, 'seeds', USAGE);
  if (value === undefined) return { first: 1, last: 20, given: 20 };
  const read = /^(?:(\d+)-)?(\d+)$/.exec(value);
  if (read !== null) {
    const [, from, to] = read;
    const first = from === undefined ? 1 : Number(from);
    const last = Number(to);
    if (Number.isSafeInteger(last) && first >= 1 && first <= last) {
      return { first, last, given: from === undefined ? last : value };
    }
  }
  throw new Error(
    `--seeds is neither a count of 1 or more nor a range <a>-<b> with 1 <= a <= b: ${value}\n${USAGE}`,
  );
}

/**
 * The civilization `--civilization` hands in: the JSON itself where the value opens on `{`, and the
 * text of the file it names otherwise, read in the content's shape; a field the shape does not name
 * goes unread.
 */
function civilizationHandedIn(catalogue: Catalogue, value: string): Civilization {
  const inline = value.startsWith('{');
  if (!inline && statSync(value, { throwIfNoEntry: false })?.isFile() !== true) {
    throw new Error(`--civilization names no file ${value}\n${USAGE}`);
  }
  const text = inline ? value : readFileSync(value, 'utf8');
  let read: unknown;
  try {
    read = JSON.parse(text);
  } catch {
    throw new Error(`--civilization is not JSON: ${text}\n${USAGE}`);
  }
  const civilization = inContentShape(read);
  if (civilization === undefined) {
    throw new Error(
      `--civilization holds no civilization {"city":{"building":<id>,"sight":<n>,"idle":<n>,"card":<id>},"settle":[<id>...],"cards":[<id>...]}\n${USAGE}`,
    );
  }
  const misfit = civilizationMisfit(catalogue, civilization, '--civilization');
  if (misfit !== undefined) throw new Error(misfit);
  return civilization;
}

/** The civilization a value read from JSON holds, its fields alone, and nothing where it holds none. */
function inContentShape(read: unknown): Civilization | undefined {
  if (!isObject(read) || !isObject(read.city)) return undefined;
  const { building, sight, idle, card } = read.city;
  const { settle, cards } = read;
  if (
    typeof building !== 'string' ||
    !isInteger(sight) ||
    !isInteger(idle) ||
    typeof card !== 'string' ||
    !isIds(settle) ||
    !isIds(cards)
  ) {
    return undefined;
  }
  return { city: { building, sight, idle, card }, settle, cards };
}

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function isIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

/**
 * The seed's chronicle of the cell launched, then driven by its persona, and the whole milliseconds
 * it took.
 */
function chronicleOf(
  { catalogue, age, region, campaign, civilization, walk }: Cell,
  seed: number,
  turnCap: number,
): { readonly launch: Sequence; readonly driven: Driven; readonly ms: number } {
  const started = Date.now();
  const launch = launched(catalogue, age, region, seed, civilization, campaign.technologies);
  const driven = playedBy(catalogue, walk, launch, turnCap);
  return { launch, driven, ms: Date.now() - started };
}

/**
 * The cell as the command that made it, one comment line of JSON, the campaign's technologies whole;
 * `without` is dropped by the JSON where no gambit is left out, `goal` where none is named, and `off`
 * where nothing is switched off.
 */
function recordOf(
  { age, region, campaign, recorded: civilization, persona, without, goal, off }: Cell,
  turns: number,
  run: { readonly seeds: Seeds['given'] } | { readonly trace: number },
): string {
  const learned = campaign.technologies;
  const cell = {
    age,
    region,
    civilization,
    learned,
    persona,
    without,
    goal,
    off: off.length === 0 ? undefined : off,
    turns,
    ...run,
  };
  return `# ${JSON.stringify(cell)}`;
}

/**
 * The columns a row reads off a chronicle driven from its launch on the campaign, with what is
 * switched off: what its ending paid, the chronicle it was left on, and what the launch and every
 * command landed did on the way.
 */
export function chronicleColumns(
  catalogue: Catalogue,
  campaign: Campaign,
  launch: Sequence,
  { chronicle, end, landed }: Driven,
  off: readonly Switch[],
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
  const deals = landed.flatMap(({ turn, command, stages: resolved }): [string, number][] =>
    command.type === 'take'
      ? [[dealTaken(catalogue, resolved[0].before.deals[0], command.at), turn]]
      : [],
  );
  const unplayed = cardsInPiles(chronicle)
    .map(({ id }) => id)
    .filter((id) => !played.includes(id));

  return [
    ['influence', influencePaid(catalogue, campaign, chronicle, end)],
    ['capstone', chronicle.timeline.capstone.id],
    ['capstone-turn', off.includes('capstone') ? '' : chronicle.timeline.capstone.turn],
    ...RESOURCES.map((resource): Column => [resource, chronicle.resources[resource]]),
    ['population', chronicle.population],
    ['held', chronicle.held.length],
    ['neutral-population', chronicle.neutral?.population ?? ''],
    ...FACTIONS.map((faction): Column => [`units:${faction}`, byKind(chronicle.units, faction)]),
    ...FACTIONS.map((faction): Column => [`killed:${faction}`, byKind(killed, faction)]),
    ['played', counted(played)],
    ['unplayed', counted(unplayed)],
    ['deals', listingOf(deals)],
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
  return listingOf(counts);
}

/** Each name with its number: `name:2 other:1`. */
function listingOf(entries: Iterable<readonly [name: string, number: number]>): string {
  return [...entries].map(([name, number]) => `${name}:${number}`).join(' ');
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
  return Object.entries(PERSONAS).flatMap(([name, persona]) => [
    `${name}:`,
    ...persona().map(({ sentence }, at) => `${at + 1}. ${sentence}`),
  ]);
}
