import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { paidInto } from '../src/rules/campaign';
import { ageOf, type Civilization, victoryTechnologyOf } from '../src/rules/catalogue';
import { countOn, launched, launchedFromCampaign } from '../src/rules/chronicle';
import { growthThreshold } from '../src/rules/city';
import {
  AGE,
  AMBUSH,
  achieved,
  CAMP,
  CATALOGUE,
  CENSUS,
  CITY,
  CIVILIZATION,
  CIVILIZATION_ID,
  CROWD,
  CROWD_NEED,
  camped,
  cityOf,
  dealing,
  FEAST,
  field,
  fullDraw,
  GRANARY,
  HOARD,
  NO_GROWTH,
  QUIET,
  REGION,
  reaching,
  regionsUnlocked,
  standing,
  UPHEAVAL,
} from '../src/rules/fixtures';
import { neighbours } from '../src/rules/map';
import { RESOURCES } from '../src/rules/resources';
import { freshCampaign } from '../src/rules/save';
import { offered } from '../src/rules/schedule';
import { unchanged } from '../src/rules/stages';
import { cardsInPiles } from '../src/rules/state';
import type { Faction } from '../src/rules/units';
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
  const untimed = (row: Record<string, string>): Record<string, string> =>
    Object.fromEntries(Object.entries(row).filter(([column]) => column !== 'ms'));

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
    for (const [value, refusal] of misfits) {
      const seen: string[] = [];
      expect(() =>
        simulated(CATALOGUE, ['--civilization', value], (line) => seen.push(line)),
      ).toThrow(refusal);
      expect(seen).toEqual([]);
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
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
