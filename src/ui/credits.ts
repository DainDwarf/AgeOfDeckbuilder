import type { LinkSign } from './cast';
import { type TextKey, text } from './text';

/** A stretch of a makers' line: words, or an address that opens its site. */
export type Stretch = { readonly reads: string; readonly opens?: string };

/** Who gave a thing, as one line reads it, stretch by stretch. */
export type MakersLine = readonly Stretch[];

/** A thing given, and the makers' lines under it. */
export type Credit = { readonly heading: string; readonly lines: readonly MakersLine[] };

/** A link of the menu: the mark it wears, the name its tooltip reads, and the address it opens. */
export type Link = { readonly sign: LinkSign; readonly reads: TextKey; readonly opens: string };

export const LINKS: readonly Link[] = [
  {
    sign: 'itch-io-link',
    reads: 'link.itch-io',
    opens: 'https://daindwarf.itch.io/age-of-deckbuilder',
  },
  {
    sign: 'github-link',
    reads: 'link.github',
    opens: 'https://github.com/DainDwarf/AgeOfDeckbuilder',
  },
  { sign: 'discord-link', reads: 'link.discord', opens: 'https://discord.gg/W2PnqbGgkv' },
];

const CREDIT = /^- \*\*Credit:\*\* (.*)$/;

const ADDRESS = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;

/** What a makers' line holds outside its addresses only where another link stands. */
const LINKISH = /[[\]]|:\/\//;

/** A makers' line as the record writes it, its addresses read off it; any other link is refused. */
function makersOf(written: string, credit: string): MakersLine {
  const line: Stretch[] = [];
  let from = 0;
  const words = (to: number): void => {
    const reads = written.slice(from, to);
    if (LINKISH.test(reads)) {
      throw new Error(
        `the credit "${credit}" holds an address that is no link to an https address`,
      );
    }
    if (reads.length > 0) line.push({ reads });
  };
  for (const found of written.matchAll(ADDRESS)) {
    words(found.index);
    line.push({ reads: found[1], opens: found[2] });
    from = found.index + found[0].length;
  }
  words(written.length);
  return line;
}

/** What a makers' line reads, its addresses by the words they show. */
export function lineRead(line: MakersLine): string {
  return line.map(({ reads }) => reads).join('');
}

/**
 * The credits the packs' licence record holds, in its order: the packs sharing a credit as one line,
 * the credits sharing a heading under one, at the place of the first. A credit naming no heading
 * before its first `: ` is refused.
 */
export function packCredits(record: string): Credit[] {
  const credits: { heading: string; lines: MakersLine[]; written: Set<string> }[] = [];
  for (const row of record.split('\n')) {
    const credit = CREDIT.exec(row)?.[1];
    if (credit === undefined) continue;
    const cut = credit.indexOf(': ');
    if (cut <= 0) throw new Error(`the credit "${credit}" names no heading before ": "`);
    const heading = credit.slice(0, cut);
    const written = credit.slice(cut + 2);
    const under = credits.find((each) => each.heading === heading);
    if (under === undefined) {
      credits.push({ heading, lines: [makersOf(written, credit)], written: new Set([written]) });
    } else if (!under.written.has(written)) {
      under.lines.push(makersOf(written, credit));
      under.written.add(written);
    }
  }
  return credits.map(({ heading, lines }) => ({ heading, lines }));
}

/** What the Credits window lists: the game's own maker, the packs' credits, and the engine. */
export function creditsListed(record: string): Credit[] {
  const own = (heading: TextKey, line: TextKey): Credit => ({
    heading: text(heading),
    lines: [[{ reads: text(line) }]],
  });
  return [
    own('credits.game', 'credits.maker'),
    ...packCredits(record),
    own('credits.engine', 'credits.phaser'),
  ];
}
