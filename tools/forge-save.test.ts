import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { CATALOGUE } from '../src/content/catalogue';
import { technologyOf } from '../src/rules/catalogue';
import { readSaveFile } from '../src/rules/save-file';

function forged(args: readonly string[]): string {
  const entry = fileURLToPath(new URL('./forge-save.ts', import.meta.url));
  return execFileSync(process.execPath, [entry, ...args], { encoding: 'utf8' });
}

function needsOf(technology: string): string[] {
  return technologyOf(CATALOGUE, technology).needs.flatMap((need) => [need, ...needsOf(need)]);
}

test('the forge writes a save file the game reads whole, holding the technology named, every need of it and the influence given; its list holds each age and the technologies its achievements earn', () => {
  const technology = Object.keys(CATALOGUE.technologies).find(
    (id) => technologyOf(CATALOGUE, id).needs.length > 0,
  );
  if (technology === undefined) throw new Error('no technology needs another');
  const folder = mkdtempSync(join(tmpdir(), 'forge-save-'));
  try {
    const out = join(folder, 'forged.adbsave');
    forged(['--influence', '7', '--out', out, technology]);
    const { save, dropped } = readSaveFile(CATALOGUE, readFileSync(out, 'utf8'));
    expect(dropped).toEqual([]);
    expect(save?.campaign.technologies).toEqual(
      expect.arrayContaining([technology, ...needsOf(technology)]),
    );
    expect(save?.campaign.influence).toBe(7);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }

  const sections: [string, string[]][] = [];
  for (const line of forged(['--list']).trim().split('\n')) {
    if (line.startsWith('- ')) sections[sections.length - 1][1].push(line.slice(2));
    else sections.push([line.slice(0, -1), []]);
  }
  expect(sections).toEqual(
    Object.entries(CATALOGUE.ages).map(([id, { achievements }]) => {
      const earned = Object.values(achievements).map((each) => each.technology);
      return [id, Object.keys(CATALOGUE.technologies).filter((each) => earned.includes(each))];
    }),
  );
}, 60_000);
