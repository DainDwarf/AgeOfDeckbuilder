import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { victoryTechnologyOf } from '../src/rules/catalogue';
import { launchedFromCampaign } from '../src/rules/chronicle';
import {
  AGE,
  CATALOGUE,
  CENSUS,
  CITY,
  CIVILIZATION_ID,
  cityOf,
  dealing,
  field,
  fullDraw,
  GRANARY,
  QUIET,
  REGION,
  regionsUnlocked,
  standing,
} from '../src/rules/fixtures';
import { neighbours } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import { unchanged } from '../src/rules/stages';
import { PERSONAS } from './personas';
import { simulated } from './sim-body';
import { type Persona, playedBy } from './sim-driver';

/** What the simulator prints on the fixture's content, or on the content handed in. */
function printed(args: readonly string[], catalogue = CATALOGUE): string[] {
  const lines: string[] = [];
  simulated(catalogue, args, (line) => lines.push(line));
  return lines;
}

/** The rows printed, each by its column's name. */
function rowsOf(lines: readonly string[]): Record<string, string>[] {
  const [header, ...rows] = lines;
  const columns = header.split(',');
  return rows.map((row) => {
    const values = row.split(',');
    return Object.fromEntries(columns.map((column, at) => [column, values[at]]));
  });
}

test('the idle walks each seed of the cell to the chronicle’s ending, one row per seed, the row reading the cell, the seed, and the ending with its cause and its turn', () => {
  const rows = rowsOf(printed(['--seeds', '2']));
  const campaign = freshCampaign(CATALOGUE);
  const choices = { age: AGE, region: REGION, civilization: CIVILIZATION_ID };

  expect(rows.map(({ ms, ...row }) => row)).toEqual(
    [1, 2].map((seed) => {
      const launched = launchedFromCampaign(CATALOGUE, campaign, choices, seed);
      const { ending } = playedBy(CATALOGUE, PERSONAS.idle, launched, 60).chronicle;
      if (ending === undefined) throw new Error(`the idle brings seed ${seed} to no ending`);
      return {
        age: AGE,
        region: REGION,
        civilization: CIVILIZATION_ID,
        learned: '',
        persona: 'idle',
        seed: `${seed}`,
        ending: ending.outcome,
        cause: 'cause' in ending ? ending.cause : '',
        turn: `${ending.turn}`,
      };
    }),
  );
  for (const { ms } of rows) expect(ms).toMatch(/^\d+$/);
});

test('a cell learns the victory of every age before its own and the technology that unlocks its region, then the technologies named; its region is the age’s first reached without it unless named', () => {
  const unlocking = regionsUnlocked({ [GRANARY]: REGION });
  const [aged] = rowsOf(
    printed(['--age', QUIET, '--region', REGION, '--seeds', '1', CENSUS], unlocking),
  );
  const [first] = rowsOf(printed(['--seeds', '1'], unlocking));

  expect(aged.learned).toBe(`${victoryTechnologyOf(unlocking, AGE)} ${GRANARY} ${CENSUS}`);
  expect(first.region).not.toBe(REGION);
  expect(first.learned).toBe('');
  expect(rowsOf(printed(['--region', REGION, '--seeds', '1'], unlocking))[0].learned).toBe(GRANARY);
});

test('a chronicle standing on the turn cap’s turn is stopped there, the turns before it played', () => {
  const [row] = rowsOf(printed(['--seeds', '1', '--turns', '2']));
  const { end, landed } = playedBy(CATALOGUE, PERSONAS.idle, unchanged(cityOf(['urban'])), 1);

  expect([row.ending, row.cause, row.turn]).toEqual(['stopped', 'turn-cap', '2']);
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
  const walked = playedBy(CATALOGUE, ending, launched, 60);

  expect(walked.end).toEqual({ outcome: 'stopped', cause: 'stuck', turn: 0 });
  expect(walked.chronicle).toBe(launched.chronicle);
});

test('a command whose stages hold a runtime error stops the chronicle on the one it left, naming the group it happened during', () => {
  const raided = cityOf(['urban'], {
    tiles: field(1),
    ...dealing({ turn: 2, event: 'PH_Hardship' }),
    drawPile: fullDraw(),
    units: neighbours(CITY).map((tile) => standing('player', tile)),
  });
  const walked = playedBy(CATALOGUE, PERSONAS.idle, unchanged(raided), 60);

  expect(walked.end).toEqual({
    outcome: 'stopped',
    cause: 'runtime-error',
    turn: 2,
    during: 'answer',
  });
  expect(walked.landed.map(({ command }) => command.type)).toEqual(['end-turn', 'take']);
  expect(walked.chronicle.deals).toEqual([]);
});

test('the simulator run on the game’s content writes the header and one row per seed, and its trace one line per command landed and one for the ending or the stop', () => {
  const entry = fileURLToPath(new URL('./sim.ts', import.meta.url));
  const run = (args: readonly string[]): string =>
    execFileSync(process.execPath, [entry, ...args], { encoding: 'utf8' });
  const folder = mkdtempSync(join(tmpdir(), 'sim-'));
  try {
    const out = join(folder, 'rows.csv');
    run(['--seeds', '1', '--out', out]);
    const [header, ...rows] = readFileSync(out, 'utf8').trimEnd().split('\n');
    expect(header).toBe('age,region,civilization,learned,persona,seed,ending,cause,turn,ms');
    expect(rows).toHaveLength(1);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }

  const trace = run(['--trace', '1']).trimEnd().split('\n');
  const last = trace.pop();
  for (const line of trace) expect(line).toMatch(/^turn \d+ \| [^|]+ \| \{.+\}$/);
  expect(last).toMatch(/^turn \d+ \| (victory|defeat \S+|stopped \S+( during \S+)?)$/);
}, 60_000);
