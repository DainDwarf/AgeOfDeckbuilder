import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf } from '../src/rules/catalogue';
import { freshCampaign } from '../src/rules/save';
import { saveFileName, writeSaveFile } from '../src/rules/save-file';
import { learnedWithNeeds } from './learned-with-needs';

const USAGE = [
  'usage: npm run forge -- [--influence <n>] [--out <path>] <technology>...',
  '       npm run forge -- --list [<age>]',
].join('\n');

const FLAGS = {
  influence: { type: 'string' },
  out: { type: 'string' },
  list: { type: 'string' },
} as const;

/**
 * The forge run on the command line's arguments: the list printed, or the save file written and
 * what it learned printed. A refusal is thrown, nothing written.
 */
export function forgeSave(args: readonly string[]): void {
  // Non-strict, so a bare `--list` reads `true`; an unknown flag is then accepted and refused below.
  const { values, positionals } = parseArgs({
    args: [...args],
    options: FLAGS,
    strict: false,
    allowPositionals: true,
  });
  const unknown = Object.keys(values).find((flag) => !Object.hasOwn(FLAGS, flag));
  if (unknown !== undefined) throw new Error(`no flag --${unknown}\n${USAGE}`);

  if (values.list !== undefined) {
    console.log(technologiesByAge(typeof values.list === 'string' ? values.list : undefined));
    return;
  }
  if (positionals.length === 0) throw new Error(USAGE);

  const influence = influenceOf(values.influence);
  const named = values.out ?? saveFileName(new Date());
  if (typeof named !== 'string') throw new Error(`--out names no path\n${USAGE}`);
  const out = resolve(named);

  const fresh = freshCampaign(CATALOGUE);
  const learned = learnedWithNeeds(CATALOGUE, fresh, positionals);
  const campaign = influence === undefined ? learned : { ...learned, influence };
  writeFileSync(out, writeSaveFile(CATALOGUE, campaign));

  for (const technology of campaign.technologies.slice(fresh.technologies.length)) {
    console.log(`learned ${technology}`);
  }
  console.log(`wrote ${out}`);
}

function influenceOf(flag: string | boolean | undefined): number | undefined {
  if (flag === undefined) return undefined;
  const influence = Number(flag);
  if (typeof flag !== 'string' || !/^\d+$/.test(flag) || !Number.isSafeInteger(influence)) {
    throw new Error(`--influence is not a non-negative integer: ${flag}\n${USAGE}`);
  }
  return influence;
}

/**
 * Every age's section, or the one age's, in the catalogue's order: the age, then each technology its
 * achievements earn, in the order the catalogue's technologies table lists them.
 */
function technologiesByAge(only: string | undefined): string {
  const ages = only === undefined ? Object.keys(CATALOGUE.ages) : [only];
  return ages
    .flatMap((age) => {
      const earned = new Set(
        Object.values(ageOf(CATALOGUE, age).achievements).map(({ technology }) => technology),
      );
      const technologies = Object.keys(CATALOGUE.technologies).filter((id) => earned.has(id));
      return [`${age}:`, ...technologies.map((technology) => `- ${technology}`)];
    })
    .join('\n');
}
