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
  eventOf,
  type Region,
  type Schedule,
  scheduleOf,
} from '../src/rules/catalogue';
import { countOn, launched, outcome } from '../src/rules/chronicle';
import type { TileCoords } from '../src/rules/map';
import { entryOf } from '../src/rules/map-kinds';
import { RESOURCES } from '../src/rules/resources';
import { freshCampaign } from '../src/rules/save';
import { offered } from '../src/rules/schedule';
import { type Change, plays, type Sequence, walked } from '../src/rules/stages';
import { type Chronicle, cardsInPiles, type Deal } from '../src/rules/state';
import { type Faction, type Unit, unitAt } from '../src/rules/units';
import { type FlagValues, listFlag, readFlags, stringFlag, wholeFlag, wholeNumber } from './flags';
import {
  learnedWithNeeds,
  technologiesEarnedIn,
  technologiesReaching,
  technologyUnlocking,
} from './learned-with-needs';
import { PERSONAS } from './personas';
import {
  type Driven,
  type End,
  type FixedAnswer,
  fixedNamed,
  type Persona,
  playedBy,
} from './sim-driver';

const USAGE = [
  'usage: npm run sim -- [--age <age>] [--region <region>] [--civilization <json|path>] [--persona <name>]',
  '                      [--goal <technology>] [--without <n>[,<n>...]] [--off <switch>[,<switch>...]]',
  '                      [--event <id>[,<id>...]] [--capstone <id>] [--answer <event>:<answer>[,...]]',
  '                      [--seeds <n>|<a>-<b>] [--turns <n>] [--every <n>] [--out <path>] [<technology>...]',
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
  event: { type: 'string' },
  capstone: { type: 'string' },
  answer: { type: 'string' },
  seeds: { type: 'string' },
  turns: { type: 'string' },
  every: { type: 'string' },
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

/** What a cell cuts its region's schedule to: the events named and the capstone named, where any are. */
type Cut = { readonly events?: readonly string[]; readonly capstone?: string };

/** What a chronicle of the cell is launched on and played by. */
type Cell = {
  /**
   * The content the cell's chronicles are played on: the game's, its region switched off as `off`
   * names and its schedule cut as `cut` names.
   */
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
  /** The persona's gambits left out of its walk, by number as `--personas` prints it, in the order named. */
  readonly without: readonly number[] | undefined;
  /** The persona's gambits the chronicles are played by, the ones left out excepted. */
  readonly walk: Persona;
  /** What the cell is played with switched off, in the order `--off` names them. */
  readonly off: readonly Switch[];
  /** What the region's schedule is cut to, in the order `--event` names the events. */
  readonly cut: Cut;
  /** The answers taken whenever their event is dealt, in the order `--answer` names them. */
  readonly fixed: readonly FixedAnswer[];
};

/** The seeds of the cell, the first and the last included, and the flag as it was given. */
type Seeds = { readonly first: number; readonly last: number; readonly given: number | string };

/**
 * A chronicle driven as it stood at one moment: the chronicle, the commands landed by then, and how
 * it came to its end where the moment is its end.
 */
type Moment = Omit<Driven, 'end'> & { readonly end: End | undefined };

/** The simulator run on the game's content, on the command line's arguments. */
export function sim(args: readonly string[]): void {
  simulated(CATALOGUE, args);
}

/**
 * The simulator run on the content, on the command line's arguments: the personas printed, one seed
 * traced after the cell's record, or the rows of every seed of the cell written, the record then the
 * header first, each seed's as its chronicle ends, one per nth turn it opened where `--every` names n
 * and its ending's after them, to `--out` or else printed. A refusal is thrown before anything is
 * written.
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
  const every = wholeFlag(values, 'every', 1, USAGE);
  const seeds = seedsOf(values);
  const traced = wholeFlag(values, 'trace', 1, USAGE);
  const out = stringFlag(values, 'out', USAGE);

  if (traced !== undefined) {
    if (out !== undefined)
      throw new Error(`--out beside --trace: the trace writes no row\n${USAGE}`);
    if (every !== undefined)
      throw new Error(`--every beside --trace: the trace writes no row\n${USAGE}`);
    print(recordOf(cell, undefined, turnCap, { trace: traced }));
    const { driven } = chronicleOf(cell, traced, turnCap);
    for (const { turn, sentBy, command } of driven.landed) {
      print(`turn ${turn} | ${sentBy} | ${JSON.stringify(command)}`);
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
  write(recordOf(cell, every, turnCap, { seeds: seeds.given }));
  for (let seed = seeds.first; seed <= seeds.last; seed++) {
    const { launch, driven, ms } = chronicleOf(cell, seed, turnCap);
    const rows = [
      ...(every === undefined ? [] : openingsOf(driven, every)).map((opening) =>
        rowOf(cell, seed, launch, opening, ''),
      ),
      rowOf(cell, seed, launch, driven, ms),
    ];
    if (seed === seeds.first) write(rows[0].map(([name]) => name).join(','));
    for (const row of rows) write(row.map(([, value]) => value).join(','));
  }
}

/**
 * The chronicle driven as each nth turn opened, from turn n, with the commands landed by then: the
 * chronicle the command that moved the turn left, and none where that is the one the drive ended on.
 */
function openingsOf(driven: Driven, every: number): Moment[] {
  return driven.landed.flatMap(({ turn, stages }, at): Moment[] => {
    const opening = outcome(stages);
    if (opening.turn === turn || opening.turn % every !== 0 || opening === driven.chronicle) {
      return [];
    }
    return [{ chronicle: opening, landed: driven.landed.slice(0, at + 1), end: undefined }];
  });
}

/**
 * The row of the seed's chronicle of the cell at the moment: the seed, the end with its cause and its
 * turn where the moment is the end, the turn alone otherwise, the time the chronicle took, and the
 * columns read off the chronicle at the moment.
 */
function rowOf(
  cell: Cell,
  seed: number,
  launch: Sequence,
  moment: Moment,
  ms: number | '',
): Column[] {
  const { end } = moment;
  return [
    ['seed', seed],
    ['ending', end?.outcome ?? ''],
    ['cause', causeOf(end)],
    ['turn', end?.turn ?? moment.chronicle.turn],
    ['ms', ms],
    ...chronicleColumns(cell.catalogue, cell.campaign, launch, moment, cell.off),
  ];
}

/**
 * The cell the flags name: the age and the region, each defaulting to what the launch screen opens on,
 * on a new campaign that has learned what reaches them, then the technologies named, each with its
 * needs; the civilization, the campaign's first unless one is handed in; the persona, the idle
 * unless named, built for the goal `--goal` names, its gambits `--without` numbers left out of its walk;
 * the content, its region switched off as `--off` names and its schedule cut as `--event` and
 * `--capstone` name; and the answers `--answer` fixes.
 */
function cellOf(game: Catalogue, values: FlagValues, positionals: readonly string[]): Cell {
  const fresh = freshCampaign(game);
  const age = stringFlag(values, 'age', USAGE) ?? openingChoices(game, fresh).age;
  const reached = learnedWithNeeds(game, fresh, technologiesReaching(game, age));
  const opening = openingChoices(game, reached);
  const region = stringFlag(values, 'region', USAGE) ?? opening.region;
  const off = switchesOf(values);
  const schedule = scheduleOf(game, age, region);
  const cut = cutOf(values, schedule, off);
  const fixed = fixedOf(game, values, cut.events ?? Object.keys(schedule.entries), off);
  const catalogue = reshaped(game, age, region, off, cut);
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
  const without = listFlag(values, 'without', USAGE, (item) =>
    wholeNumber('without', item, 1, USAGE, gambits.length),
  );
  const walk = gambits.filter((_, at) => !without?.includes(at + 1));
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
    cut,
    fixed,
  };
}

/** What `--off` switches off, in the order named; nothing where it is not set. */
function switchesOf(values: FlagValues): Switch[] {
  return (
    listFlag(values, 'off', USAGE, (name) => {
      const named = SWITCHES.find((each) => each === name);
      if (named === undefined) {
        throw new Error(`--off names no switch ${name}; the switches: ${SWITCHES.join(', ')}`);
      }
      return named;
    }) ?? []
  );
}

/**
 * What `--event` and `--capstone` cut the region's schedule to; an event the schedule does not deal, a
 * capstone it does not name, and an event cut beside the events switched off are refused.
 */
function cutOf(values: FlagValues, schedule: Schedule, off: readonly Switch[]): Cut {
  refusedBesideEventsOff(values, 'event', off);
  const dealt = Object.keys(schedule.entries);
  const events = listFlag(values, 'event', USAGE, (event) => eventDealt('event', event, dealt));
  const capstone = stringFlag(values, 'capstone', USAGE);
  if (capstone !== undefined && !schedule.capstones.includes(capstone)) {
    throw new Error(
      `--capstone names no capstone ${capstone} the region's schedule names; its capstones: ${schedule.capstones.join(', ')}`,
    );
  }
  return { events, capstone };
}

/**
 * The answers `--answer` fixes, each `<event>:<answer>`, in the order named; an item without the colon,
 * an event the cell does not deal, an answer its event does not deal, an event fixed twice, and an
 * answer fixed beside the events switched off are refused.
 */
function fixedOf(
  catalogue: Catalogue,
  values: FlagValues,
  dealt: readonly string[],
  off: readonly Switch[],
): FixedAnswer[] {
  refusedBesideEventsOff(values, 'answer', off);
  const fixed = (listFlag(values, 'answer', USAGE, (item) => item) ?? []).map(
    (named): FixedAnswer => {
      const colon = named.indexOf(':');
      if (colon === -1) throw new Error(`--answer is not <event>:<answer>: ${named}\n${USAGE}`);
      const event = eventDealt('answer', named.slice(0, colon), dealt);
      const answer = named.slice(colon + 1);
      const answers = Object.keys(eventOf(catalogue, event).answers);
      if (!answers.includes(answer)) {
        throw new Error(
          `--answer names no answer ${answer} of ${event}; its answers: ${answers.join(', ')}`,
        );
      }
      return { event, answer };
    },
  );
  const twice = fixed.find(
    ({ event }, at) => fixed.findIndex((other) => other.event === event) !== at,
  );
  if (twice !== undefined) throw new Error(`--answer names ${twice.event} twice`);
  return fixed;
}

/** The event a flag names, among the ones the cell deals; any other is refused naming those. */
function eventDealt(flag: string, event: string, dealt: readonly string[]): string {
  if (!dealt.includes(event)) {
    throw new Error(
      `--${flag} names no event ${event} the cell deals; the events it deals: ${dealt.join(', ')}`,
    );
  }
  return event;
}

/** Refused where the flag is set beside the events switched off. */
function refusedBesideEventsOff(values: FlagValues, flag: string, off: readonly Switch[]): void {
  if (values[flag] !== undefined && off.includes('events')) {
    throw new Error(`--${flag} beside --off events: the cell deals no event\n${USAGE}`);
  }
}

/**
 * The content handed in, the region of the age switched off and its schedule cut as named, validated
 * as the content is. An age or a region the content does not hold is refused.
 */
export function reshaped(
  catalogue: Catalogue,
  age: string,
  region: string,
  off: readonly Switch[],
  cut: Cut,
): Catalogue {
  const owned = ageOf(catalogue, age);
  const switched = off.reduce(
    regionSwitchedOff,
    regionCut(entryOf(catalogue, owned.regions, region, 'region'), cut),
  );
  const regions = { ...owned.regions, [region]: switched };
  return catalogued({ ...catalogue, ages: { ...catalogue.ages, [age]: { ...owned, regions } } });
}

/**
 * The region with its schedule cut to the events named, each at the weight the schedule gives it, and
 * to the capstone named, where any are.
 */
function regionCut(region: Region, { events, capstone }: Cut): Region {
  const { schedule } = region;
  const entries =
    events === undefined
      ? schedule.entries
      : Object.fromEntries(
          Object.entries(schedule.entries).filter(([event]) => events.includes(event)),
        );
  const capstones = capstone === undefined ? schedule.capstones : [capstone];
  return { ...region, schedule: { ...schedule, entries, capstones } };
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
 * The seed's chronicle of the cell launched, then driven by its persona and its fixed answers, and the
 * whole milliseconds it took.
 */
function chronicleOf(
  { catalogue, age, region, campaign, civilization, walk, fixed }: Cell,
  seed: number,
  turnCap: number,
): { readonly launch: Sequence; readonly driven: Driven; readonly ms: number } {
  const started = Date.now();
  const launch = launched(catalogue, age, region, seed, civilization, campaign.technologies);
  const driven = playedBy(catalogue, walk, launch, turnCap, fixed);
  return { launch, driven, ms: Date.now() - started };
}

/**
 * The cell as the command that made it, one comment line of JSON, the campaign's technologies whole;
 * `without` is dropped by the JSON where no gambit is left out, `goal` where none is named, `off`
 * where nothing is switched off, `event`, `capstone` and `answer` where nothing is cut, named or
 * fixed, and `every` where no row is read over the turns.
 */
function recordOf(
  { age, region, campaign, recorded: civilization, persona, without, goal, off, cut, fixed }: Cell,
  every: number | undefined,
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
    event: cut.events,
    capstone: cut.capstone,
    answer: fixed.length === 0 ? undefined : fixed.map(fixedNamed),
    every,
    turns,
    ...run,
  };
  return `# ${JSON.stringify(cell)}`;
}

/**
 * The columns a row reads off a chronicle driven from its launch on the campaign, at a moment, with
 * what is switched off: what its ending paid where the moment is its end, the chronicle as it stood
 * then, and what the launch and every command landed by then did on the way.
 */
export function chronicleColumns(
  catalogue: Catalogue,
  campaign: Campaign,
  launch: Sequence,
  { chronicle, end, landed }: Moment,
  off: readonly Switch[],
): Column[] {
  const stages = [...launch.stages, ...landed.flatMap((command) => command.stages)];
  const played = plays(stages).map(({ card }) => card);
  const killed: Unit[] = [];
  const neutralFell: [string, number][] = [];
  const reachedOn = new Map<string, number>();
  for (const stage of walked(stages)) {
    if (stage.kind !== 'change') continue;
    if (stage.name === 'killed') killed.push(unitKilled(stage));
    if (stage.name === 'neutral-fallen') neutralFell.push([stage.cause, stage.chronicle.turn]);
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
    ['neutral-fell', listingOf(neutralFell)],
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

/** What the ending paid into the campaign, and nothing for a stop, which pays nothing, or before the end. */
function influencePaid(
  catalogue: Catalogue,
  campaign: Campaign,
  chronicle: Chronicle,
  end: End | undefined,
): number | '' {
  if (end === undefined) return '';
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

/** The defeat's cause or the stop's, and nothing for a victory or before the end. */
function causeOf(end: End | undefined): string {
  if (end === undefined) return '';
  switch (end.outcome) {
    case 'victory':
      return '';
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
