import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { paidInto } from '../src/rules/campaign';
import { featureAmong, featureRemoved, gained, throughWorker } from '../src/rules/cards';
import {
  type Answer,
  ageOf,
  type Catalogue,
  type Civilization,
  victoryTechnologyOf,
} from '../src/rules/catalogue';
import {
  apply,
  type Command,
  countOn,
  declaresWar,
  launched,
  launchedFromCampaign,
  outcome,
} from '../src/rules/chronicle';
import { growthThreshold, populationTaken, warDeclared } from '../src/rules/city';
import {
  AGE,
  AMBUSH,
  achieved,
  besideTheNeutral,
  builtOn,
  CAMP,
  CATALOGUE,
  type Carrying,
  CENSUS,
  CITY,
  CIVILIZATION,
  CIVILIZATION_ID,
  CROWD,
  CROWD_NEED,
  camped,
  changed,
  cityOf,
  dealing,
  deepBut,
  enemyStanding,
  FEAST,
  featured,
  field,
  fullDraw,
  GRANARY,
  HOARD,
  madeOf,
  NEUTRAL_TILE,
  NO_GROWTH,
  neutralStanding,
  onlyStocks,
  opening,
  plains,
  QUIET,
  REGION,
  reaching,
  regionsUnlocked,
  ringed,
  type Standing,
  settledOn,
  standing,
  TILLAGE,
  UPHEAVAL,
  withUnits,
  worker,
} from '../src/rules/fixtures';
import { MOVE_POINT, neighbours, type Tile, type TileCoords, tileKey } from '../src/rules/map';
import { RESOURCES } from '../src/rules/resources';
import { freshCampaign } from '../src/rules/save';
import { addedToDrawPileTop, offered } from '../src/rules/schedule';
import { chartedAt } from '../src/rules/sight';
import { followed, type Stage, unchanged, walked } from '../src/rules/stages';
import { type Chronicle, cardsInPiles } from '../src/rules/state';
import { type Faction, unitAt } from '../src/rules/units';
import { chartingWalks } from './builder';
import { PERSONAS } from './personas';
import { chronicleColumns, simulated } from './sim-body';
import { type Driven, type Persona, playedBy } from './sim-driver';

/** What the simulator prints on the fixture's content, or on the content handed in. */
function printed(args: readonly string[], catalogue = CATALOGUE): string[] {
  const lines: string[] = [];
  simulated(catalogue, args, (line) => lines.push(line));
  return lines;
}

/** The cell's record, the first line printed, read back. */
function recordRead([line]: readonly string[]): Record<string, unknown> {
  const json = /^# (\{.*\})$/.exec(line)?.[1];
  if (json === undefined) throw new Error(`the first line holds no record: ${line}`);
  return JSON.parse(json);
}

/** The rows printed after the record, each by its column's name. */
function rowsOf(lines: readonly string[]): Record<string, string>[] {
  const [, header, ...rows] = lines;
  const columns = header.split(',');
  return rows.map((row) => {
    const values = row.split(',');
    return Object.fromEntries(columns.map((column, at) => [column, values[at]]));
  });
}

/** The row without the time its chronicle took. */
function untimed(row: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(row).filter(([column]) => column !== 'ms'));
}

/** The arguments refused with that refusal on the fixture's content, nothing printed before it. */
function expectRefused(args: readonly string[], refusal: RegExp): void {
  const seen: string[] = [];
  expect(() => simulated(CATALOGUE, args, (line) => seen.push(line))).toThrow(refusal);
  expect(seen).toEqual([]);
}

/** The names a cell lists, each as many times as the number beside it, sorted. */
function namesListed(cell: string): string[] {
  if (cell === '') return [];
  return cell
    .split(' ')
    .flatMap((entry) => {
      const [name, times] = entry.split(':');
      return Array<string>(Number(times)).fill(name);
    })
    .sort();
}

/** The cards the play commands played, by id: each the card of the hand it named when it was sent. */
function cardsPlayed(landed: Driven['landed']): string[] {
  return landed.flatMap(({ command, stages }) =>
    command.type === 'play' ? [stages[0].before.hand[command.index].id] : [],
  );
}

test('the idle drives each seed of the cell to the chronicle’s ending, the cell printed first as the command that made it, then one row per seed, the row reading the seed, the ending with its cause and its turn, what the ending paid, the chronicle it left and what its commands did on the way', () => {
  const lines = printed(['--seeds', '2']);
  const rows = rowsOf(lines);
  const campaign = freshCampaign(CATALOGUE);
  const choices = { age: AGE, region: REGION, civilization: CIVILIZATION_ID };
  const turnCap = 60;
  const drives = [1, 2].map((seed) => ({
    seed,
    ...playedBy(
      CATALOGUE,
      PERSONAS.idle,
      launchedFromCampaign(CATALOGUE, campaign, choices, seed),
      turnCap,
    ),
  }));
  const listing = (column: string): boolean =>
    ['ms', 'played', 'unplayed', 'deals'].includes(column) ||
    /^(units|killed|reached):/.test(column);

  expect(lines[0]).toBe(
    `# ${JSON.stringify({ ...choices, learned: [], persona: 'idle', turns: turnCap, seeds: 2 })}`,
  );
  expect(
    rows.map((row) =>
      Object.fromEntries(Object.entries(row).filter(([column]) => !listing(column))),
    ),
  ).toEqual(
    drives.map(({ seed, chronicle }) => {
      const { ending } = chronicle;
      if (ending === undefined) throw new Error(`the idle brings seed ${seed} to no ending`);
      return {
        seed: `${seed}`,
        ending: ending.outcome,
        cause: 'cause' in ending ? ending.cause : '',
        turn: `${ending.turn}`,
        influence: `${paidInto(CATALOGUE, campaign, chronicle).influence}`,
        capstone: chronicle.timeline.capstone.id,
        'capstone-turn': `${chronicle.timeline.capstone.turn}`,
        ...Object.fromEntries(
          RESOURCES.map((resource) => [resource, `${chronicle.resources[resource]}`]),
        ),
        population: `${chronicle.population}`,
        held: `${chronicle.held.length}`,
        'neutral-population': `${chronicle.neutral?.population ?? ''}`,
        ...Object.fromEntries(
          chronicle.achievements.map((held) => [
            `count:${held.id}`,
            `${countOn(CATALOGUE, chronicle, held)}`,
          ]),
        ),
      };
    }),
  );
  for (const [at, row] of rows.entries()) {
    const { chronicle, landed } = drives[at];
    const factions: Record<Faction, true> = { player: true, enemy: true, neutral: true };
    for (const faction of Object.keys(factions) as Faction[]) {
      expect(namesListed(row[`units:${faction}`])).toEqual(
        chronicle.units
          .filter((unit) => unit.faction === faction)
          .map(({ stats }) => stats.type)
          .sort(),
      );
    }
    const played = cardsPlayed(landed);
    expect(namesListed(row.played)).toEqual([...played].sort());
    expect(namesListed(row.unplayed)).toEqual(
      cardsInPiles(chronicle)
        .map(({ id }) => id)
        .filter((id) => !played.includes(id))
        .sort(),
    );
    expect(row.ms).toMatch(/^\d+$/);
  }
});

test('a civilization handed in, inline or in a file, is the one the chronicles are launched on, its city section and its deck as written, and the record carries it whole; a misfit is refused before anything is printed', () => {
  const handed: Civilization = {
    city: { ...CIVILIZATION.city, idle: CIVILIZATION.city.idle + 1 },
    settle: [],
    cards: CIVILIZATION.cards.filter((_, at) => at % 2 === 0),
  };
  const inline = JSON.stringify(handed);
  const lines = printed(['--seeds', '1', '--civilization', inline]);
  const launch = launched(CATALOGUE, AGE, REGION, 1, handed, []);
  const driven = playedBy(CATALOGUE, PERSONAS.idle, launch, 60);

  expect(recordRead(lines).civilization).toEqual(handed);
  expect(rowsOf(lines)[0]).toMatchObject({
    ending: driven.end.outcome,
    turn: `${driven.end.turn}`,
    ...Object.fromEntries(
      chronicleColumns(CATALOGUE, freshCampaign(CATALOGUE), launch, driven).map(
        ([column, value]) => [column, `${value}`],
      ),
    ),
  });
  expect(recordRead(printed(['--trace', '1', '--civilization', inline])).civilization).toEqual(
    handed,
  );

  const folder = mkdtempSync(join(tmpdir(), 'sim-'));
  try {
    const file = join(folder, 'civilization.json');
    writeFileSync(file, JSON.stringify({ name: 'unread', ...handed }));
    const fromFile = printed(['--seeds', '1', '--civilization', file]);
    expect(recordRead(fromFile)).toEqual(recordRead(lines));
    expect(rowsOf(fromFile).map(untimed)).toEqual(rowsOf(lines).map(untimed));

    const [card] = handed.cards;
    const city = (field: Partial<Civilization['city']>): string =>
      JSON.stringify({ ...handed, city: { ...handed.city, ...field } });
    const misfits: [string, RegExp][] = [
      [join(folder, 'none.json'), /names no file/],
      [folder, /names no file/],
      ['{"city"', /is not JSON/],
      [JSON.stringify({ city: handed.city, settle: handed.settle }), /holds no civilization/],
      [JSON.stringify({ ...handed, cards: ['PH_None'] }), /names no card PH_None/],
      [JSON.stringify({ ...handed, settle: [card] }), new RegExp(`${card} in its settle section`)],
      [city({ building: 'PH_None' }), /names no building PH_None/],
      [city({ building: 'PH_Mill' }), /names the building PH_Mill, which names the river/],
      [city({ card }), new RegExp(`${card} in its city section`)],
      [city({ sight: -1 }), /city sees -1/],
      [city({ idle: -1 }), /city opens with -1 idle/],
    ];
    for (const [value, refusal] of misfits) expectRefused(['--civilization', value], refusal);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('a seed range plays its seeds from the first to the last, each the chronicle a count plays on that seed, the header before the range’s first row and the record carrying the range as written; anything but a count of one or more or a range running forward from one is refused', () => {
  const ranged = printed(['--seeds', '2-3']);
  const counted = printed(['--seeds', '3']);

  expect(recordRead(ranged).seeds).toBe('2-3');
  expect(ranged[1]).toBe(counted[1]);
  expect(rowsOf(ranged).map(untimed)).toEqual(rowsOf(counted).slice(1).map(untimed));
  for (const value of ['0', '0-2', '3-2', '2-', '-2', 'two', '1-2-3']) {
    expectRefused(['--seeds', value], /^--seeds is neither/);
  }
});

test('a gambit left out leaves the persona’s walk, the record carrying its number after the persona, and the trace plays the same walk: the idle without its settle stops stuck on the settle phase, and without its take stuck on its first deal', () => {
  const choices = { age: AGE, region: REGION, civilization: CIVILIZATION_ID };
  const whole = playedBy(
    CATALOGUE,
    PERSONAS.idle,
    launchedFromCampaign(CATALOGUE, freshCampaign(CATALOGUE), choices, 1),
    60,
  );
  const firstTake = whole.landed.find(({ command }) => command.type === 'take');
  if (firstTake === undefined) throw new Error('the idle takes no deal on seed 1');
  const unsettled = printed(['--seeds', '1', '--without', '2']);
  const stopOf = (lines: readonly string[]): string[] => {
    const [{ ending, cause, turn }] = rowsOf(lines);
    return [ending, cause, turn];
  };

  expect(unsettled[0]).toBe(
    `# ${JSON.stringify({ ...choices, learned: [], persona: 'idle', without: 2, turns: 60, seeds: 1 })}`,
  );
  expect(stopOf(unsettled)).toEqual(['stopped', 'stuck', '0']);
  expect(stopOf(printed(['--seeds', '1', '--without', '1']))).toEqual([
    'stopped',
    'stuck',
    `${firstTake.turn}`,
  ]);
  const [traced, ...trace] = printed(['--trace', '1', '--without', '2']);
  expect(recordRead([traced]).without).toBe(2);
  expect(trace).toEqual(['turn 0 | stopped stuck']);
});

test('a gambit number from none or past the persona’s gambit count is refused, the refusal naming the count', () => {
  const count = new RegExp(`from 1 to ${PERSONAS.builder.length}: `);

  for (const value of ['0', `${PERSONAS.builder.length + 1}`, 'one']) {
    expectRefused(['--persona', 'builder', '--without', value], count);
  }
});

test('an achievement the launch reaches reads the settle phase’s turn, and one reached as the turn moves the turn it moved to', () => {
  const { achievements } = ageOf(CATALOGUE, AGE);
  const early = achieved({
    [FEAST]: { ...achievements[FEAST], count: () => 1, need: 1 },
    [HOARD]: { ...achievements[HOARD], count: (_catalogue, chronicle) => chronicle.turn, need: 3 },
  });
  const [row] = rowsOf(printed(['--seeds', '1'], early));

  expect([row[`reached:${FEAST}`], row[`reached:${HOARD}`]]).toEqual(['0', '3']);
});

test('an achievement reached during an end of turn, before the turn moves, reads the turn the end of turn was on, not the one it left', () => {
  const crowding = (food: number) =>
    reaching([GRANARY], {
      population: CROWD_NEED - 1,
      resources: { food, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    });
  const city = crowding(growthThreshold(crowding(0), 'player'));
  const ending: Persona = [{ sentence: 'End the turn', command: () => ({ type: 'end-turn' }) }];
  const launch = unchanged(city);
  const driven = playedBy(CATALOGUE, ending, launch, city.turn + 1);
  const columns = Object.fromEntries(
    chronicleColumns(CATALOGUE, freshCampaign(CATALOGUE), launch, driven),
  );

  expect(driven.chronicle.turn).not.toBe(city.turn);
  expect(columns[`reached:${CROWD}`]).toBe(city.turn);
});

test('a unit killed is read under its faction by kind, and a deal taken with the entry taken and the turn it was taken on', () => {
  const enemy = standing('enemy', UPHEAVAL, { health: AMBUSH }, 0, 0);
  const event = 'PH_Upheaval';
  const answer = 'PH_Ambush';
  const turn = 2;
  const ambushed = cityOf(['urban', 'plain'], {
    ...dealing({ turn, event }),
    units: [enemy],
  });
  const ambushing: Persona = [
    {
      sentence: 'While a deal stands, take the ambush',
      command: (catalogue, chronicle) => {
        const [deal] = chronicle.deals;
        if (deal === undefined) return undefined;
        return { type: 'take', at: offered(catalogue, deal).indexOf(answer) };
      },
    },
    { sentence: 'End the turn', command: () => ({ type: 'end-turn' }) },
  ];
  const launch = unchanged(ambushed);
  const columns = Object.fromEntries(
    chronicleColumns(
      CATALOGUE,
      freshCampaign(CATALOGUE),
      launch,
      playedBy(CATALOGUE, ambushing, launch, 3),
    ),
  );

  expect([columns['killed:player'], columns['killed:enemy'], columns['killed:neutral']]).toEqual([
    '',
    `${enemy.stats.type}:1`,
    '',
  ]);
  expect(columns.deals).toBe(`${event}>${answer}:${turn}`);
  expect(columns.influence).toBe('');
});

test('a capture’s deal taken is read with the building captured, the reward taken and the turn it was taken on', () => {
  const camp = { q: 4, r: 0 };
  const capturing = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });
  const launch = unchanged(capturing);
  const columns = Object.fromEntries(
    chronicleColumns(
      CATALOGUE,
      freshCampaign(CATALOGUE),
      launch,
      playedBy(CATALOGUE, PERSONAS.idle, launch, capturing.turn + 1),
    ),
  );
  const [first] = Object.keys(CAMP.rewards);

  expect(columns.deals).toBe(`${CAMP.building}>${first}:${capturing.turn}`);
});

test('a cell learns the victory of every age before its own and the technology that unlocks its region, then the technologies named; its region is the age’s first reached without it unless named', () => {
  const unlocking = regionsUnlocked({ [GRANARY]: REGION });
  const aged = recordRead(
    printed(['--age', QUIET, '--region', REGION, '--seeds', '1', CENSUS], unlocking),
  );
  const first = recordRead(printed(['--seeds', '1'], unlocking));

  expect(aged.learned).toEqual([victoryTechnologyOf(unlocking, AGE), GRANARY, CENSUS]);
  expect(first.region).not.toBe(REGION);
  expect(first.learned).toEqual([]);
  expect(recordRead(printed(['--region', REGION, '--seeds', '1'], unlocking)).learned).toEqual([
    GRANARY,
  ]);
});

test('a chronicle standing on the turn cap’s turn is stopped there, the turns before it played', () => {
  const lines = printed(['--seeds', '1', '--turns', '2']);
  const [row] = rowsOf(lines);
  const { end, landed } = playedBy(CATALOGUE, PERSONAS.idle, unchanged(cityOf(['urban'])), 1);

  expect([recordRead(lines).turns, row.ending, row.cause, row.turn]).toEqual([
    2,
    'stopped',
    'turn-cap',
    '2',
  ]);
  expect(end).toEqual({ outcome: 'stopped', cause: 'turn-cap', turn: 1 });
  expect(landed).toEqual([]);
});

test('a hundred commands landed in one turn stop the chronicle on the hundredth', () => {
  const worked = { q: 1, r: 0 };
  const idle = { q: 2, r: 0 };
  const shuffling: Persona = [
    {
      sentence: 'Reassign the population between the two tiles',
      command: (_catalogue, chronicle) => {
        const from = chronicle.assigned.some(({ q, r }) => q === worked.q && r === worked.r)
          ? worked
          : idle;
        return { type: 'reassign', from, to: from === worked ? idle : worked };
      },
    },
    { sentence: 'End the turn', command: () => ({ type: 'end-turn' }) },
  ];
  const city = cityOf(['urban', 'plain', 'plain'], { population: 2, assigned: [CITY, worked] });
  const { end, landed } = playedBy(CATALOGUE, shuffling, unchanged(city), 60);

  expect(end).toEqual({ outcome: 'stopped', cause: 'command-cap', turn: city.turn });
  expect(landed).toHaveLength(100);
});

test('a decision where every gambit’s command is dropped stops the chronicle as stuck', () => {
  const ending: Persona = [{ sentence: 'End the turn', command: () => ({ type: 'end-turn' }) }];
  const launched = launchedFromCampaign(
    CATALOGUE,
    freshCampaign(CATALOGUE),
    { age: AGE, region: REGION, civilization: CIVILIZATION_ID },
    1,
  );
  const driven = playedBy(CATALOGUE, ending, launched, 60);

  expect(driven.end).toEqual({ outcome: 'stopped', cause: 'stuck', turn: 0 });
  expect(driven.chronicle).toBe(launched.chronicle);
});

test('a command whose stages hold a runtime error stops the chronicle on the one it left, naming the group it happened during', () => {
  const raided = cityOf(['urban'], {
    tiles: field(1),
    ...dealing({ turn: 2, event: 'PH_Hardship' }),
    drawPile: fullDraw(),
    units: neighbours(CITY).map((tile) => standing('player', tile)),
  });
  const driven = playedBy(CATALOGUE, PERSONAS.idle, unchanged(raided), 60);

  expect(driven.end).toEqual({
    outcome: 'stopped',
    cause: 'runtime-error',
    turn: 2,
    during: 'answer',
  });
  expect(driven.landed.map(({ command }) => command.type)).toEqual(['end-turn', 'take']);
  expect(driven.chronicle.deals).toEqual([]);
});

test('the simulator run on the game’s content writes the cell’s record, the header and one row per seed, and its trace the record carrying the seed traced, one line per command landed and one for the ending or the stop', () => {
  const entry = fileURLToPath(new URL('./sim.ts', import.meta.url));
  const run = (args: readonly string[]): string =>
    execFileSync(process.execPath, [entry, ...args], { encoding: 'utf8' });
  const record = (closing: string): RegExp =>
    new RegExp(
      `^# \\{"age":"[^"]+","region":"[^"]+","civilization":"[^"]+","learned":\\[[^\\]]*\\],"persona":"idle","turns":60,${closing}\\}$`,
    );
  const folder = mkdtempSync(join(tmpdir(), 'sim-'));
  try {
    const out = join(folder, 'rows.csv');
    run(['--seeds', '1', '--out', out]);
    const [cell, header, ...rows] = readFileSync(out, 'utf8').trimEnd().split('\n');
    expect(cell).toMatch(record('"seeds":1'));
    expect(header).toMatch(
      new RegExp(
        [
          '^seed,ending,cause,turn,ms,',
          'influence,capstone,capstone-turn,',
          'food,production,military,money,science,culture,population,held,neutral-population,',
          'units:player,units:enemy,units:neutral,killed:player,killed:enemy,killed:neutral,',
          'played,unplayed,deals',
          '(,count:([^,]+),reached:\\2)*$',
        ].join(''),
      ),
    );
    expect(rows).toHaveLength(1);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }

  const [traced, ...trace] = run(['--trace', '1']).trimEnd().split('\n');
  expect(traced).toMatch(record('"trace":1'));
  const last = trace.pop();
  for (const line of trace) expect(line).toMatch(/^turn \d+ \| [^|]+ \| \{.+\}$/);
  expect(last).toMatch(/^turn \d+ \| (victory|defeat \S+|stopped \S+( during \S+)?)$/);
}, 60_000);

/** What the persona's gambit of that number, as `--personas` numbers them, answers on the chronicle. */
function answerOf(
  persona: string,
  gambit: number,
  chronicle: Chronicle,
  catalogue: Catalogue = CATALOGUE,
): Command | undefined {
  return PERSONAS[persona][gambit - 1].command(catalogue, chronicle);
}

/** What the persona's gambit of that number answers, each answer applied, until it answers nothing. */
function answersOf(persona: string, gambit: number, chronicle: Chronicle): Command[] {
  const answers: Command[] = [];
  let standing = chronicle;
  for (let answer = answerOf(persona, gambit, standing); answer !== undefined; ) {
    if (answers.length === 20) throw new Error(`gambit ${gambit} answers without end`);
    answers.push(answer);
    standing = outcome(apply(CATALOGUE, standing, answer));
    answer = answerOf(persona, gambit, standing);
  }
  return answers;
}

/** A row of plain east of the city's urban tile, the city's building on it. */
function strip(length: number): Tile[] {
  return Array.from(
    { length },
    (_, q): Tile =>
      q === 0
        ? { q, r: 0, terrain: 'urban', improvements: [], building: 'PH_City' }
        : { q, r: 0, terrain: 'plain', improvements: [] },
  );
}

/** The number of the unit standing on the tile. */
function unitNumberOn(chronicle: Chronicle, tile: TileCoords): number {
  const id = unitAt(chronicle.units, tile)?.id;
  if (id === undefined) throw new Error(`no unit stands on ${tileKey(tile)}`);
  return id;
}

test('the builder takes of a deal the entry leaving the most stock, never one adding a card that strikes, and the first not refused where every entry draws or strikes', () => {
  const dealt = (event: string): Chronicle =>
    outcome(
      apply(
        CATALOGUE,
        cityOf(['urban', 'plain'], {
          ...dealing({ turn: 2, event }),
          resources: onlyStocks({ production: 10 }),
        }),
        { type: 'end-turn' },
      ),
    );
  const blight = dealt('PH_Blight');
  const [deal] = blight.deals;

  expect(answerOf('builder', 1, blight)).toEqual({
    type: 'take',
    at: offered(CATALOGUE, deal).indexOf('PH_Levy'),
  });
  expect(answerOf('builder', 1, dealt('PH_Hardship'))).toEqual({ type: 'take', at: 0 });
});

test('the builder settles on the charted tile whose yield summed with its six neighbours’ is the most, the nearest the centre of equals', () => {
  const rich = { q: -1, r: 0 };
  const settling = opening(
    featured(plains(3), 'PH_Fertile', [
      { q: -2, r: 0 },
      { q: -2, r: 1 },
    ]),
    { reach: 3 },
  );

  expect(answerOf('builder', 2, settling)).toEqual({
    type: 'play',
    index: 0,
    aim: 'tile',
    tile: rich,
  });
});

test('the builder reads an uncharted neighbour as yielding nothing when it settles', () => {
  const settling = opening(
    featured(plains(3), 'PH_Fertile', [
      { q: 2, r: 0 },
      { q: 2, r: -1 },
    ]),
    { reach: 1 },
  );

  expect(answerOf('builder', 2, settling)).toEqual({
    type: 'play',
    index: 0,
    aim: 'tile',
    tile: CITY,
  });
});

test('once the city stands, the builder plays the settle card that enters a unit, on the tile beside the city that yields most', () => {
  const fertile = { q: 0, r: 1 };
  const settled = settledOn(
    opening(featured(plains(3), 'PH_Fertile', [fertile]), {
      civilization: { ...CIVILIZATION, settle: ['PH_Claim', 'PH_Band'] },
    }),
    CITY,
  );

  expect(answerOf('builder', 3, settled)).toEqual({
    type: 'play',
    index: settled.hand.findIndex(({ id }) => id === 'PH_Band'),
    aim: 'tile',
    tile: fertile,
  });
});

test('the builder pays a hazard in hand once the stocks cover it', () => {
  const holding = (production: number): Chronicle =>
    cityOf(['urban'], {
      hand: ['PH_Harvest', 'PH_Hunger'],
      resources: onlyStocks({ production }),
    });

  expect(answerOf('builder', 4, holding(2))).toBeUndefined();
  expect(answerOf('builder', 4, holding(3))).toEqual({ type: 'play', index: 1, aim: 'none' });
});

test('the builder assigns an idle population to the free held tile yielding the most food, the most of everything together of equals', () => {
  const idleOne = cityOf(['urban', 'glade', 'forest', 'hills'], {
    population: 2,
    assigned: [CITY],
  });

  expect(answerOf('builder', 5, idleOne)).toEqual({ type: 'assign', tile: { q: 2, r: 0 } });
});

test('the builder reassigns the population off a worked tile onto a free held one yielding more', () => {
  const glade = { q: 1, r: 0 };
  const plain = { q: 2, r: 0 };
  const working = cityOf(['urban', 'glade', 'plain'], { population: 1, assigned: [glade] });

  expect(answerOf('builder', 6, working)).toEqual({ type: 'reassign', from: glade, to: plain });
});

test('the builder claims the tile that yields most, the nearest a charted tile yielding more of equals', () => {
  const toward = { q: 1, r: 0 };
  const away = { q: -1, r: 0 };
  const claiming = cityOf(['urban'], {
    tiles: madeOf(featured(field(3), 'PH_Fertile', [toward, away]), 'urban', [{ q: 2, r: 0 }]),
    resources: onlyStocks({ culture: 2 }),
  });

  expect(answerOf('builder', 7, claiming)).toEqual({ type: 'claim', tile: toward });
});

test('where no entry of a deal qualifies, the builder takes the first not refused that declares no war, one bringing defeat last', () => {
  const answer = (lands: Answer['lands']): Answer => ({ cost: {}, reads: () => ({}), lands });
  const striking = answer((catalogue, chronicle) =>
    addedToDrawPileTop(catalogue, chronicle, 'PH_Hunger'),
  );
  const fallingBack = changed({
    events: {
      ...CATALOGUE.events,
      PH_Rivals: {
        answers: {
          PH_Escalate: answer((_catalogue, chronicle) => warDeclared(chronicle)),
          PH_Tribute: striking,
        },
      },
      PH_Exodus: {
        answers: {
          PH_Leave: answer((_catalogue, chronicle) => populationTaken(chronicle, 'player')),
          PH_Stay: striking,
        },
      },
    },
  });
  const grudge = withUnits(
    besideTheNeutral({ catalogue: fallingBack, ...dealing({ turn: 1, event: 'PH_Rivals' }) }),
    [neutralStanding({ q: 2, r: -1 })],
  );
  const exodus = outcome(
    apply(fallingBack, cityOf(['urban'], dealing({ turn: 2, event: 'PH_Exodus' }), fallingBack), {
      type: 'end-turn',
    }),
  );

  expect(answerOf('builder', 1, grudge, fallingBack)).toEqual({ type: 'take', at: 1 });
  expect(answerOf('builder', 1, exodus, fallingBack)).toEqual({ type: 'take', at: 1 });
});

test('a worker an enemy in sight could reach next turn walks to its landing nearest the city', () => {
  const beset = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 2, r: 0 }), enemyStanding({ q: 4, r: 0 }, undefined)],
  });

  expect(answerOf('builder', 8, beset)).toEqual({
    type: 'move',
    unit: unitNumberOn(beset, { q: 2, r: 0 }),
    tile: CITY,
  });
});

test('a worker reads an enemy’s walk on what the player knows: a unit standing in fog blocks nothing', () => {
  const corridor = Array.from({ length: 10 }, (_, q) => ({ q, r: 0 }));
  const fog = [4, 5, 6].map((q) => ({ q, r: 0 }));
  const charted = fog.reduce(
    (chronicle, at) => chartedAt(CATALOGUE, chronicle, at),
    cityOf(['urban'], { tiles: deepBut(field(9), corridor) }),
  );
  const workerAt = { q: 1, r: 0 };
  const beset = withUnits(charted, [
    worker(workerAt),
    standing('player', { q: 9, r: 0 }),
    enemyStanding({ q: 7, r: 0 }, undefined, { stats: { move: 5 * MOVE_POINT } }),
    neutralStanding({ q: 5, r: 0 }),
  ]);

  expect(answerOf('builder', 8, beset)).toEqual({
    type: 'move',
    unit: unitNumberOn(beset, workerAt),
    tile: CITY,
  });
});

test('a worker with nothing to play where it stands walks to the landing where a card that places something lands, ahead of one where a card gains', () => {
  const plain = { q: -1, r: 1 };
  const forests = neighbours(CITY).filter((tile) => tileKey(tile) !== tileKey(plain));
  const standing = { q: 1, r: 0 };
  const walking = ringed(3, {
    tiles: madeOf(field(3), 'forest', [...forests, { q: 2, r: 0 }]),
    units: [worker(standing)],
    hand: ['PH_Forage', 'PH_Farm'],
    resources: onlyStocks({ production: 3 }),
  });

  expect(answerOf('builder', 9, walking)).toEqual({
    type: 'move',
    unit: unitNumberOn(walking, standing),
    tile: plain,
  });
});

test('the builder places through a worker what adds the most food to the yield, and places what adds nothing rather than nothing', () => {
  const plain = { q: 1, r: 0 };
  const hills = { q: -1, r: 0 };
  const placing = (hand: string[]): Chronicle =>
    ringed(3, {
      tiles: madeOf(field(3), 'hills', [hills]),
      units: [worker(plain), worker(hills)],
      hand,
      resources: onlyStocks({ production: 6 }),
    });

  expect(answerOf('builder', 10, placing(['PH_Mine', 'PH_Farm']))).toEqual({
    type: 'play',
    index: 1,
    aim: 'tile',
    tile: plain,
  });
  expect(answerOf('builder', 10, placing(['PH_Road']))).toEqual({
    type: 'play',
    index: 0,
    aim: 'tile',
    tile: hills,
  });
});

test('the builder places nothing through a worker that lowers the yield of the tile it lands on', () => {
  const farm = { q: 1, r: 0 };
  const farmed = ringed(3, {
    tiles: builtOn(field(3), TILLAGE, [farm]),
    units: [worker(farm)],
    hand: ['PH_Silo'],
    resources: onlyStocks({ production: 3 }),
  });

  expect(answerOf('builder', 10, farmed)).toBeUndefined();
});

test('the builder plays through a worker the card raising the stocks the most, never one that lowers a tile’s yield', () => {
  const hunting = changed({
    cards: {
      ...CATALOGUE.cards,
      PH_Hunt: {
        kind: 'action',
        cost: {},
        ...throughWorker(
          (catalogue, _chronicle, tile) => featureAmong(catalogue, tile, ['PH_Fertile']),
          (catalogue, paid, at) =>
            followed(featureRemoved(catalogue, paid, at), (left) => gained(left, { food: 6 })),
        ),
      },
    },
  });
  const fertile = { q: 1, r: 0 };
  const gathering = cityOf(
    ['urban'],
    {
      tiles: featured(field(2), 'PH_Fertile', [fertile]),
      units: [worker(fertile), worker({ q: -1, r: 0 })],
      hand: ['PH_Hunt', 'PH_Forage'],
    },
    hunting,
  );

  expect(answerOf('builder', 11, gathering, hunting)).toEqual({
    type: 'play',
    index: 1,
    aim: 'tile',
    tile: fertile,
  });
});

test('a worker with nothing to play walks to the landing outside the border that yields most, the cheapest of equals', () => {
  const near = { q: 0, r: 1 };
  const standing = { q: 1, r: 0 };
  const roaming = cityOf(['urban'], {
    tiles: featured(field(2), 'PH_Fertile', [{ q: -1, r: 0 }, near]),
    units: [worker(standing)],
  });

  expect(answerOf('builder', 12, roaming)).toEqual({
    type: 'move',
    unit: unitNumberOn(roaming, standing),
    tile: near,
  });
});

test('with a population idle and no held tile free, the builder plays the unit card that enters a worker while fewer than three stand, and the one that enters a unit that attacks while fewer than two stand', () => {
  const entering = (hand: string[]): Chronicle =>
    cityOf(['urban'], { population: 2, hand, resources: onlyStocks({ food: 2, military: 2 }) });

  expect(answerOf('builder', 13, entering(['PH_Warrior', 'PH_Worker']))).toEqual({
    type: 'play',
    index: 1,
    aim: 'none',
  });
  expect(answerOf('builder', 14, entering(['PH_Worker', 'PH_Warrior']))).toEqual({
    type: 'play',
    index: 1,
    aim: 'none',
  });
});

test('a unit that attacks walks to the held tile it reaches the enemy of least health from, then attacks it', () => {
  const guarding = { q: -1, r: 0 };
  const from = { q: 1, r: 0 };
  const weak = { q: 2, r: 0 };
  const beset = ringed(3, {
    units: [
      standing('player', guarding),
      enemyStanding({ q: 0, r: 2 }, undefined, { stats: { health: 4 } }),
      enemyStanding(weak, undefined, { stats: { health: 2 } }),
    ],
  });
  const unit = unitNumberOn(beset, guarding);
  const walk = answerOf('builder', 15, beset);

  expect(walk).toEqual({ type: 'move', unit, tile: from });
  if (walk === undefined) throw new Error('the unit walks nowhere');
  expect(answerOf('builder', 15, outcome(apply(CATALOGUE, beset, walk)))).toEqual({
    type: 'attack',
    unit,
    tile: weak,
  });
});

test('a unit that attacks walks to the cheapest landing within five tiles of the city whose trial charts a tile, ahead of a dearer one charting more, and to none beyond the five', () => {
  const near = { q: 2, r: 0 };
  const far = { q: 5, r: 0 };
  const charting = (at: TileCoords): Chronicle =>
    cityOf(['urban'], { tiles: strip(10), units: [standing('player', at)] });

  for (const [persona, gambit] of [
    ['builder', 16],
    ['warlord', 19],
  ] as const) {
    expect(answerOf(persona, gambit, charting(near))).toEqual({
      type: 'move',
      unit: unitNumberOn(charting(near), near),
      tile: { q: 3, r: 0 },
    });
    expect(answerOf(persona, gambit, charting(far))).toBeUndefined();
  }
});

test('a unit that attacks walks to the landing the city may claim that stands highest, yields least of equals, nearest the city’s tile of equals, and stays on that ring with no other of its tiles to land on', () => {
  const west = { q: -1, r: 1 };
  const glade = { q: -1, r: 2 };
  const corner = { q: -2, r: 2 };
  const restingOn = (
    tiles: Tile[],
    units = [standing('player', CITY, { move: 3 * MOVE_POINT })],
  ): Chronicle =>
    cityOf(['urban'], {
      tiles,
      held: [CITY, west],
      population: 2,
      assigned: [CITY, west],
      units,
    });
  const walksTo = (chronicle: Chronicle, tile: TileCoords): Command[] => [
    { type: 'move', unit: unitNumberOn(chronicle, CITY), tile },
  ];
  const plain = restingOn(field(2));
  const poor = restingOn(madeOf(field(2), 'glade', [glade]));
  const high = restingOn(madeOf(madeOf(field(2), 'glade', [glade]), 'forest', [corner]));
  const hemmed = restingOn(madeOf(field(2), 'forest', [{ q: -2, r: 1 }, glade]), [
    worker(CITY),
    standing('player', corner, {}, MOVE_POINT),
  ]);
  const besideCamp = restingOn(
    camped(madeOf(field(2), 'forest', [{ q: -2, r: 0 }, corner]), [{ q: -1, r: 0 }]),
    [worker(CITY), standing('player', { q: -2, r: 1 }, {}, MOVE_POINT)],
  );

  for (const [persona, gambit] of [
    ['builder', 17],
    ['warlord', 20],
  ] as const) {
    expect(answersOf(persona, gambit, plain)).toEqual(walksTo(plain, { q: -1, r: 0 }));
    expect(answersOf(persona, gambit, poor)).toEqual(walksTo(poor, glade));
    expect(answersOf(persona, gambit, high)).toEqual(walksTo(high, corner));
    expect(answerOf(persona, gambit, hemmed)).toBeUndefined();
    expect(answerOf(persona, gambit, besideCamp)).toBeUndefined();
  }
});

test('a unit that attacks outside the border and off the tiles the city may claim walks to its unheld landing nearest the city’s tile, stands where none is nearer, and walks nowhere from inside the border or from that ring', () => {
  const far = { q: 4, r: 0 };
  const near = { q: 3, r: 0 };
  const outside = (tiles: Tile[], unit: Standing): Chronicle =>
    cityOf(['urban'], { tiles, units: [unit] });
  const walking = outside(field(4), standing('player', far));
  const hemmed = outside(
    madeOf(field(4), 'forest', [{ q: 2, r: 0 }]),
    standing('player', near, {}, MOVE_POINT),
  );
  const inside = cityOf(['urban', 'plain', 'plain', 'plain'], {
    tiles: field(4),
    units: [standing('player', near)],
  });
  const onRing = cityOf(['urban', 'plain'], {
    tiles: field(4),
    units: [standing('player', { q: 2, r: 0 })],
  });

  for (const [persona, gambit] of [
    ['builder', 18],
    ['warlord', 21],
  ] as const) {
    expect(answerOf(persona, gambit, walking)).toEqual({
      type: 'move',
      unit: unitNumberOn(walking, far),
      tile: { q: 2, r: 0 },
    });
    expect(answerOf(persona, gambit, hemmed)).toBeUndefined();
    expect(answerOf(persona, gambit, inside)).toBeUndefined();
    expect(answerOf(persona, gambit, onRing)).toBeUndefined();
  }
});

test('the builder plays the card aimed at nothing whose trial raises the stocks’ sum, passing one that raises nothing and a unit card', () => {
  const gaining = cityOf(['urban'], {
    population: 2,
    hand: ['PH_Almanac', 'PH_Worker', 'PH_Harvest'],
    resources: onlyStocks({ food: 2, science: 1 }),
  });

  expect(answerOf('builder', 19, gaining)).toEqual({ type: 'play', index: 2, aim: 'none' });
});

test('the builder plays a card aimed at the hand on a hazard in hand, else on its first other card', () => {
  const discarding = (hand: string[]): Chronicle =>
    cityOf(['urban'], { hand, resources: onlyStocks({ science: 1 }) });

  expect(answerOf('builder', 20, discarding(['PH_Discard', 'PH_Harvest', 'PH_Hunger']))).toEqual({
    type: 'play',
    index: 0,
    aim: 'hand',
    card: 2,
  });
  expect(answerOf('builder', 20, discarding(['PH_Harvest', 'PH_Discard']))).toEqual({
    type: 'play',
    index: 1,
    aim: 'hand',
    card: 0,
  });
});

test('the builder sends no command that declares war: a worker passes the landing yielding most outside the border where it is the neutral’s', () => {
  const standingAt = { q: 2, r: 0 };
  const beside = withUnits(besideTheNeutral(), [worker(standingAt)]);
  const driven = playedBy(CATALOGUE, PERSONAS.builder, unchanged(beside), beside.turn + 1);

  expect(
    declaresWar(CATALOGUE, beside, {
      type: 'move',
      unit: unitNumberOn(beside, standingAt),
      tile: NEUTRAL_TILE,
    }),
  ).toBe(true);
  expect(answerOf('builder', 12, beside)).toBeUndefined();
  expect(driven.landed.length).toBeGreaterThan(0);
  expect(stagesNamed(driven, 'relations')).toEqual([]);
});

/** Every stage of that name among the commands landed. */
function stagesNamed(driven: Driven, name: Stage['name']): Stage[] {
  return driven.landed.flatMap(({ stages }) =>
    [...walked(stages)].filter((stage) => stage.name === name),
  );
}

/** A city holding its own tile alone, the population named, the unit cards in hand and the stocks for each. */
function entering(population: number, hand: string[], carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], {
    population,
    hand,
    resources: onlyStocks({ food: 2, military: 2 }),
    ...carrying,
  });
}

test('while a population is idle and more than three stand, the warlord plays the unit card that enters a unit that attacks, and none at three', () => {
  expect(answerOf('warlord', 5, entering(4, ['PH_Worker', 'PH_Warrior']))).toEqual({
    type: 'play',
    index: 1,
    aim: 'none',
  });
  expect(answerOf('warlord', 5, entering(3, ['PH_Worker', 'PH_Warrior']))).toBeUndefined();
});

test('with none idle and more than three standing, the warlord unassigns the worked tile yielding the least of everything together, the least food of equals, for the unit card the idle alone holds back, which it then plays', () => {
  const forest = { q: 2, r: 0 };
  const working = (population: number, hand: string[]): Chronicle =>
    cityOf(['urban', 'plain', 'forest', 'urban'].slice(0, population), {
      hand,
      resources: onlyStocks({ food: 2, military: 2 }),
    });
  const unassign = answerOf('warlord', 6, working(4, ['PH_Warrior']));

  expect(unassign).toEqual({ type: 'assign', tile: forest });
  if (unassign === undefined) throw new Error('the warlord unassigns nothing');
  expect(
    answerOf('warlord', 5, outcome(apply(CATALOGUE, working(4, ['PH_Warrior']), unassign))),
  ).toEqual({ type: 'play', index: 0, aim: 'none' });
  expect(answerOf('warlord', 6, working(3, ['PH_Warrior']))).toBeUndefined();
  expect(answerOf('warlord', 6, working(4, ['PH_Worker']))).toBeUndefined();
});

test('the warlord plays the unit card that enters a worker while no worker stands, and none once one does', () => {
  const hand = ['PH_Warrior', 'PH_Worker'];

  expect(answerOf('warlord', 15, entering(2, hand))).toEqual({
    type: 'play',
    index: 1,
    aim: 'none',
  });
  expect(answerOf('warlord', 15, entering(2, hand, { units: [worker({ q: 1, r: 0 })] }))).toBe(
    undefined,
  );
});

test('a unit of the warlord’s walks beyond the border to the cheapest landing it reaches the enemy of least health from, then attacks it', () => {
  const from = { q: 2, r: 0 };
  const weak = { q: 3, r: 0 };
  const beset = ringed(3, {
    units: [
      standing('player', { q: 1, r: 0 }),
      enemyStanding(weak, undefined, { stats: { health: 2 } }),
    ],
  });
  const unit = unitNumberOn(beset, { q: 1, r: 0 });
  const walk = answerOf('warlord', 16, beset);

  expect(answerOf('builder', 15, beset)).toBeUndefined();
  expect(walk).toEqual({ type: 'move', unit, tile: from });
  if (walk === undefined) throw new Error('the unit walks nowhere');
  expect(answerOf('warlord', 16, outcome(apply(CATALOGUE, beset, walk)))).toEqual({
    type: 'attack',
    unit,
    tile: weak,
  });
});

test('while no camp and no site is charted, a unit of the warlord’s walks to the cheapest landing charting a tile however far from the city, ahead of a dearer one charting more, and once one is charted it does not', () => {
  const at = { q: 4, r: 0 };
  const scouting = (tiles: Tile[]): Chronicle =>
    cityOf(['urban'], { tiles, units: [standing('player', at)] });
  const uncharted = scouting(strip(10));

  expect(answerOf('warlord', 17, uncharted)).toEqual({
    type: 'move',
    unit: unitNumberOn(uncharted, at),
    tile: { q: 5, r: 0 },
  });
  expect(answerOf('warlord', 17, scouting(camped(strip(10), [{ q: 1, r: 0 }])))).toBeUndefined();
});

test('with three units that attack standing, all but the one nearest the city march on the nearest charted camp, each to the landing the cheapest way there weighs least from', () => {
  const camp = { q: 4, r: 0 };
  const ahead = { q: 2, r: 0 };
  const behind = { q: 0, r: 2 };
  const marching = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [
      standing('player', { q: -1, r: 0 }, { sight: 8 }),
      standing('player', ahead),
      standing('player', behind),
    ],
  });

  expect(answersOf('warlord', 18, marching)).toEqual([
    { type: 'move', unit: unitNumberOn(marching, ahead), tile: camp },
    { type: 'move', unit: unitNumberOn(marching, behind), tile: ahead },
  ]);
});

test('the warlord’s garrison walk governs the unit that attacks nearest the city alone while three stand, and every one while fewer do', () => {
  const garrison = standing('player', CITY);
  const out = [standing('player', { q: 3, r: 0 }), standing('player', { q: -3, r: 0 })];
  const walking = (units: Standing[]): Chronicle => ringed(3, { units });
  const movedBy = (chronicle: Chronicle): number[] =>
    answersOf('warlord', 20, chronicle).flatMap((command) =>
      command.type === 'move' ? [command.unit] : [],
    );
  const three = walking([garrison, ...out]);
  const two = walking([garrison, out[0]]);

  expect([...new Set(movedBy(three))]).toEqual([unitNumberOn(three, CITY)]);
  expect([...new Set(movedBy(two))]).toEqual([
    unitNumberOn(two, CITY),
    unitNumberOn(two, { q: 3, r: 0 }),
  ]);
});

test('the warlord refreshes the move points of the unit that attacks furthest from the city that has spent them, passing one on a camp', () => {
  const furthest = { q: 3, r: 0 };
  const camp = { q: 4, r: 0 };
  const spent = ringed(4, {
    tiles: camped(field(4), [camp]),
    units: [
      standing('player', { q: 1, r: 0 }, {}, 0),
      standing('player', furthest, {}, 0),
      standing('player', camp, {}, 0),
      standing('player', { q: -3, r: 0 }),
    ],
    hand: ['PH_March'],
  });

  expect(answerOf('warlord', 22, spent)).toEqual({
    type: 'play',
    index: 0,
    aim: 'unit',
    tile: furthest,
  });
});

test('the warlord heals the unit that attacks that has lost the most health', () => {
  const hurt = { q: 1, r: 0 };
  const healing = ringed(2, {
    units: [
      standing('player', { q: -1, r: 0 }, { health: 4 }),
      standing('player', hurt, { health: 2 }),
    ],
    hand: ['PH_Heal'],
  });

  expect(answerOf('warlord', 23, healing)).toEqual({
    type: 'play',
    index: 0,
    aim: 'unit',
    tile: hurt,
  });
});

test('a unit of the warlord’s standing on a camp attacks from it, walks off it for nothing, and holds it to the capture', () => {
  const camp = { q: 4, r: 0 };
  const onCamp = (others: Standing[] = []): Chronicle =>
    cityOf(['urban'], {
      ...NO_GROWTH,
      tiles: camped(field(4), [camp]),
      drawPile: fullDraw(),
      units: [standing('player', camp), ...others],
    });
  const holding = onCamp();
  const unit = unitNumberOn(holding, camp);
  const drivenBy = (persona: Persona): Driven =>
    playedBy(CATALOGUE, persona, unchanged(holding), holding.turn + 1);
  const movesOf = ({ landed }: Driven): Driven['landed'] =>
    landed.filter(({ command }) => command.type === 'move' && command.unit === unit);
  const driven = drivenBy(PERSONAS.warlord);

  expect(answerOf('warlord', 16, onCamp([enemyStanding({ q: 4, r: -1 }, undefined)]))).toEqual({
    type: 'attack',
    unit,
    tile: { q: 4, r: -1 },
  });
  expect(answerOf('warlord', 16, onCamp([enemyStanding({ q: 2, r: 0 }, undefined)]))).toBe(
    undefined,
  );
  expect(movesOf(drivenBy(PERSONAS.builder))).not.toEqual([]);
  expect(movesOf(driven)).toEqual([]);
  expect(stagesNamed(driven, 'capture')).toEqual([expect.objectContaining({ tile: camp })]);
});

test('the warlord sends no command that declares war: a worker and a unit that attacks pass the landing that is the neutral’s, the one landing where the unit charts anything', () => {
  const workerAt = { q: 2, r: 0 };
  const attackerAt = { q: -1, r: 0 };
  const row = Array.from({ length: 7 }, (_, at) => ({ q: at - 3, r: 0 }));
  const working = withUnits(besideTheNeutral(), [worker(workerAt)]);
  const scouting = withUnits(besideTheNeutral({}, deepBut(plains(3), row)), [
    standing('player', attackerAt),
  ]);
  const onTheNeutral = (chronicle: Chronicle, at: TileCoords): Command => ({
    type: 'move',
    unit: unitNumberOn(chronicle, at),
    tile: NEUTRAL_TILE,
  });
  const attacker = unitAt(scouting.units, attackerAt);
  if (attacker === undefined) throw new Error('no unit that attacks stands');

  expect(declaresWar(CATALOGUE, working, onTheNeutral(working, workerAt))).toBe(true);
  expect([...chartingWalks(CATALOGUE, scouting, [attacker])]).toEqual([
    onTheNeutral(scouting, attackerAt),
  ]);
  expect(declaresWar(CATALOGUE, scouting, onTheNeutral(scouting, attackerAt))).toBe(true);
  expect(answerOf('warlord', 17, scouting)).toBeUndefined();
  for (const beside of [working, scouting]) {
    const driven = playedBy(CATALOGUE, PERSONAS.warlord, unchanged(beside), beside.turn + 1);
    expect(driven.landed.length).toBeGreaterThan(0);
    expect(stagesNamed(driven, 'relations')).toEqual([]);
  }
});
