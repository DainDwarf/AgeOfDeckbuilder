import { describe, expect, it } from 'vitest';
import RECORD from '../../public/assets/LICENSES.md?raw';
import { creditsListed, packCredits } from './credits';
import { text } from './text';

/** A record of the packs, each entry its name and its bullets, as the licence record writes one. */
function recordOf(entries: readonly (readonly [string, readonly string[]])[]): string {
  return entries
    .map(([name, bullets]) =>
      [`## ${name}`, '', ...bullets.map((bullet) => `- ${bullet}`)].join('\n'),
    )
    .join('\n\n');
}

function credited(credit: string): string {
  return `**Credit:** ${credit}`;
}

describe('the packs read off their licence record', () => {
  it('read in its order, the packs sharing a credit as one line, the credits sharing a heading under the first, and a pack with no credit taking no line', () => {
    const record = recordOf([
      ['First', ['**What:** a set', credited('Maps: Ann')]],
      ['Second', ['**What:** another', credited('Maps: Ann')]],
      ['Third', [credited('Frames: Bob')]],
      ['Fourth', ['**Licence:** none asked']],
      ['Fifth', [credited('Maps: Cid, Dee')]],
      ['Sixth', [credited('Type: Eve')]],
    ]);
    expect(packCredits(record)).toEqual([
      { heading: 'Maps', lines: [[{ reads: 'Ann' }], [{ reads: 'Cid, Dee' }]] },
      { heading: 'Frames', lines: [[{ reads: 'Bob' }]] },
      { heading: 'Type', lines: [[{ reads: 'Eve' }]] },
    ]);
  });

  it('reads an address on a line as the words it shows and the site it opens, the words around it kept', () => {
    const record = recordOf([
      ['First', [credited('Maps: Ann, [ann.example](https://ann.example) and Bob')]],
    ]);
    expect(packCredits(record)).toEqual([
      {
        heading: 'Maps',
        lines: [
          [
            { reads: 'Ann, ' },
            { reads: 'ann.example', opens: 'https://ann.example' },
            { reads: ' and Bob' },
          ],
        ],
      },
    ]);
  });

  it('refuses a credit naming no heading before its first ": "', () => {
    expect(() => packCredits(recordOf([['First', [credited('Ann')]]]))).toThrow('no heading');
    expect(() => packCredits(recordOf([['First', [credited(': Ann')]]]))).toThrow('no heading');
  });

  it('refuses an address that is no markdown link to an https address', () => {
    for (const line of [
      'Maps: Ann, [ann.example](http://ann.example)',
      'Maps: Ann, https://ann.example',
      'Maps: Ann, [ann.example]',
    ]) {
      expect(() => packCredits(recordOf([['First', [credited(line)]]]))).toThrow('https');
    }
  });
});

describe('the Credits window', () => {
  it('lists the game and its maker first, the engine last, and the packs of the record shipped between them, none refused', () => {
    const listed = creditsListed(RECORD);
    expect(listed[0]).toEqual({
      heading: text('credits.game'),
      lines: [[{ reads: text('credits.maker') }]],
    });
    expect(listed.at(-1)).toEqual({
      heading: text('credits.engine'),
      lines: [[{ reads: text('credits.phaser') }]],
    });
    expect(listed.slice(1, -1)).toEqual(packCredits(RECORD));
  });
});
