import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATALOGUE } from '../src/content/catalogue';
import { freshCampaign } from '../src/rules/save';
import { saveFileName, writeSaveFile } from '../src/rules/save-file';
import { readFlags, stringFlag, wholeFlag } from './flags';
import { learnedWithNeeds, technologiesEarnedIn } from './learned-with-needs';

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
  const { values, positionals } = readFlags(args, FLAGS, USAGE);

  if (values.list !== undefined) {
    console.log(technologiesByAge(typeof values.list === 'string' ? values.list : undefined));
    return;
  }
  if (positionals.length === 0) throw new Error(USAGE);

  const influence = wholeFlag(values, 'influence', 0, USAGE);
  const out = resolve(stringFlag(values, 'out', USAGE) ?? saveFileName(new Date()));

  const fresh = freshCampaign(CATALOGUE);
  const learned = learnedWithNeeds(CATALOGUE, fresh, positionals);
  const campaign = influence === undefined ? learned : { ...learned, influence };
  writeFileSync(out, writeSaveFile(CATALOGUE, campaign));

  for (const technology of campaign.technologies.slice(fresh.technologies.length)) {
    console.log(`learned ${technology}`);
  }
  console.log(`wrote ${out}`);
}

/**
 * Every age's section, or the one age's, in the catalogue's order: the age, then each technology its
 * achievements earn, in the order the catalogue's technologies table lists them.
 */
function technologiesByAge(only: string | undefined): string {
  const ages = only === undefined ? Object.keys(CATALOGUE.ages) : [only];
  return ages
    .flatMap((age) => [
      `${age}:`,
      ...technologiesEarnedIn(CATALOGUE, age).map((technology) => `- ${technology}`),
    ])
    .join('\n');
}
