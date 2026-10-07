import { expect, test } from 'vitest';
import {
  type Campaign,
  type CampaignCivilization,
  FIRST_CARD_NUMBER,
  newCampaign,
  paidInto,
  pinned,
  unpinned,
} from './campaign';
import { catalogued } from './catalogue';
import { apply, type Command, outcome, refusalOf } from './chronicle';
import {
  AGE,
  achievementIn,
  aimedAt,
  CATALOGUE,
  CENSUS,
  CITY,
  CIVILIZATION,
  CIVILIZATION_ID,
  chronicleSaved,
  cityOf,
  FROST,
  field,
  GRANARY,
  HOARD,
  hoardedVictory,
  NO_DEALS,
  QUIET,
  REGION,
  SURVEY,
  SURVEYED,
  standing,
  surveying,
  victoryOf,
} from './fixtures';
import { RESOURCES } from './resources';
import { type ChronicleSave, keptAfter, readSave, writeSave } from './save';
import { addedToDrawPileTop } from './schedule';
import { type Chronicle, type CitySection, type Counters, turnShown } from './state';
import { FIRST_UNIT_NUMBER, LEAST_STATS, type Unit } from './units';

/** A campaign a won chronicle has paid into: technologies, influence, and cards in no section. */
function campaign(): Campaign {
  return paidInto(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID), hoardedVictory()).campaign;
}

/** The fixture's civilization as the campaign holds it. */
function heldCivilization(held: Campaign): CampaignCivilization {
  return held.civilizations[CIVILIZATION_ID];
}

/** The campaign with the fixture's civilization changed. */
function withCivilization(
  held: Campaign,
  change: (civilization: CampaignCivilization) => object,
): object {
  return { ...held, civilizations: { [CIVILIZATION_ID]: change(heldCivilization(held)) } };
}

/** Where in the save the fixture's civilization stands. */
const CIVILIZATION_AT = `campaign.civilizations.${CIVILIZATION_ID}`;

/** The save's text with the chronicle it holds changed after it was written. */
function tampered(save: ChronicleSave, change: (chronicle: Chronicle) => object): string {
  const written = JSON.parse(writeSave(CATALOGUE, campaign(), save)) as ChronicleSave;
  return JSON.stringify({ ...written, chronicle: change(written.chronicle) });
}

/** What reading the text drops, the campaign beside the chronicle standing whole. */
function chronicleDropped(text: string): readonly string[] {
  const read = readSave(CATALOGUE, text);
  expect(read.campaign).toEqual(campaign());
  expect(read.chronicle).toBeUndefined();
  return read.dropped;
}

/** The save's text with the campaign it holds changed after it was written beside a chronicle. */
function campaignTampered(change: (campaign: Campaign) => object): string {
  const written = JSON.parse(writeSave(CATALOGUE, campaign(), chronicleSaved())) as {
    campaign: Campaign;
  };
  return JSON.stringify({ ...written, campaign: change(written.campaign) });
}

/** What reading the text refuses of the campaign, the chronicle beside it standing whole. */
function campaignRefused(text: string): readonly string[] {
  const read = readSave(CATALOGUE, text);
  expect(read.campaign).toBeUndefined();
  expect(read.chronicle).toEqual(chronicleSaved());
  return read.dropped;
}

test('a chronicle saved and read back is the chronicle, and plays the next command to the same outcome', () => {
  const save = chronicleSaved();
  const read = readSave(CATALOGUE, writeSave(CATALOGUE, campaign(), save));
  const command: Command = { type: 'end-turn' };

  expect(read).toEqual({ campaign: campaign(), chronicle: save, dropped: [] });
  if (read.chronicle === undefined) throw new Error('the chronicle was dropped');
  const played = outcome(apply(CATALOGUE, read.chronicle.chronicle, command));
  expect(played.turn).toBe(save.chronicle.turn + 1);
  expect(played).toEqual(outcome(apply(CATALOGUE, save.chronicle, command)));
});

test('a chronicle saved and read back keeps every achievement’s tally, and counts on from it', () => {
  const [plain, , forest] = SURVEYED;
  const surveyed = outcome(apply(CATALOGUE, surveying(), aimedAt(plain)));
  const save = { chronicle: surveyed, region: REGION, civilization: CIVILIZATION_ID };

  const read = readSave(CATALOGUE, writeSave(CATALOGUE, campaign(), save));

  expect(achievementIn(surveyed, SURVEY).tally).toEqual({ plain: 1 });
  expect(read.chronicle).toEqual(save);
  if (read.chronicle === undefined) throw new Error('the chronicle was dropped');
  const counted = outcome(apply(CATALOGUE, read.chronicle.chronicle, aimedAt(forest)));
  expect(achievementIn(counted, SURVEY).reached).toBe(true);
});

test('a chronicle saved with a unit embarked reads back with it embarked', () => {
  const coast = { q: 1, r: 0 };
  const city = cityOf(['urban'], {
    tiles: field(2, [coast]),
    hand: ['PH_Embark'],
    units: [standing('player', CITY)],
  });
  const embarked = outcome(apply(CATALOGUE, city, aimedAt(coast)));
  const save = { chronicle: embarked, region: REGION, civilization: CIVILIZATION_ID };

  const read = readSave(CATALOGUE, writeSave(CATALOGUE, campaign(), save));

  expect(embarked.units[0].embarked).toBe(true);
  expect(read.chronicle).toEqual(save);
});

test('a chronicle saved with a turn shown reads back with it shown', () => {
  const city = cityOf(['urban'], {
    timeline: { ...NO_DEALS, next: 4 },
    hand: ['PH_Almanac', 'PH_Almanac'],
  });
  const shown = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));
  const save = { chronicle: shown, region: REGION, civilization: CIVILIZATION_ID };

  const read = readSave(CATALOGUE, writeSave(CATALOGUE, campaign(), save));

  expect(turnShown(shown)).toBe(city.timeline.next);
  expect(read.chronicle).toEqual(save);
  if (read.chronicle === undefined) throw new Error('the chronicle was dropped');
  expect(refusalOf(CATALOGUE, read.chronicle.chronicle, 'PH_Almanac').blocked).toEqual([
    'turn-shown',
  ]);
});

test('a campaign saved with no chronicle in progress reads back alone', () => {
  expect(readSave(CATALOGUE, writeSave(CATALOGUE, campaign()))).toEqual({
    campaign: campaign(),
    chronicle: undefined,
    dropped: [],
  });
});

test('a save carrying a card no catalogue holds drops its chronicle, and the campaign stands', () => {
  const text = tampered(chronicleSaved(), (chronicle) => ({
    ...chronicle,
    drawPile: [{ ...chronicle.drawPile[0], id: 'PH_Unheld' }, ...chronicle.drawPile.slice(1)],
  }));

  expect(chronicleDropped(text)).toEqual(['fixture: no card is named PH_Unheld']);
});

test('a chronicle carrying a card no catalogue holds is refused its save', () => {
  const save = chronicleSaved();
  const [card, ...rest] = save.chronicle.drawPile;
  const chronicle = { ...save.chronicle, drawPile: [{ ...card, id: 'PH_Unheld' }, ...rest] };

  expect(() => writeSave(CATALOGUE, campaign(), { ...save, chronicle })).toThrow(
    'fixture: no card is named PH_Unheld',
  );
});

test('a card in a save carries the counters its content declares, no fewer and no more', () => {
  const save = chronicleSaved();
  const chronicle = addedToDrawPileTop(CATALOGUE, save.chronicle, 'PH_Frost').chronicle;
  const [frost, ...rest] = chronicle.drawPile;
  const carrying = (counters: Counters): string =>
    tampered({ ...save, chronicle }, (written) => ({
      ...written,
      drawPile: [{ ...frost, counters }, ...rest],
    }));

  expect(readSave(CATALOGUE, carrying({ amount: FROST })).chronicle?.chronicle).toEqual(chronicle);
  expect(chronicleDropped(carrying({}))).toEqual([
    "fixture: the save's chronicle.drawPile[0].counters lacks the counter amount the card PH_Frost declares",
  ]);
  expect(chronicleDropped(carrying({ amount: FROST, thaw: 1 }))).toEqual([
    'fixture: the card PH_Frost declares no counter thaw',
  ]);
});

test('a save that is not JSON, or not an object, drops both its parts', () => {
  expect(readSave(CATALOGUE, '{"chronicle":')).toEqual({
    dropped: ['fixture: the save is not JSON'],
  });
  expect(readSave(CATALOGUE, '[]')).toEqual({ dropped: ['fixture: the save is not an object'] });
});

test('a chronicle that is not a chronicle’s shape is dropped', () => {
  const save = chronicleSaved();
  const [unit, ...others] = save.chronicle.units;
  const dropped = (change: (chronicle: Chronicle) => object): readonly string[] =>
    chronicleDropped(tampered(save, change));

  expect(dropped((chronicle) => ({ ...chronicle, rng: undefined }))).toEqual([
    "fixture: the save's chronicle.rng is not a list",
  ]);
  expect(dropped((chronicle) => ({ ...chronicle, turn: String(chronicle.turn) }))).toEqual([
    "fixture: the save's chronicle.turn is not an integer",
  ]);
  expect(dropped((chronicle) => ({ ...chronicle, seed: chronicle.seed + 0.5 }))).toEqual([
    "fixture: the save's chronicle.seed is not an integer",
  ]);
  expect(
    dropped((chronicle) => ({ ...chronicle, resources: { ...chronicle.resources, wood: 1 } })),
  ).toEqual(["fixture: the save's chronicle.resources names no resource wood"]);
  expect(
    dropped((chronicle) => ({
      ...chronicle,
      units: [{ ...unit, stats: { ...unit.stats, health: 1.5 } }, ...others],
    })),
  ).toEqual(["fixture: the save's chronicle.units[0].stats.health is not an integer"]);
  expect(
    dropped((chronicle) => ({ ...chronicle, units: [{ ...unit, faction: 'neutral' }, ...others] })),
  ).toEqual(["fixture: the save's chronicle.units[0].faction names no faction neutral"]);
});

/** The chronicle with its first unit changed. */
function firstUnit(chronicle: Chronicle, change: (unit: Unit) => object): Chronicle {
  const [unit, ...others] = chronicle.units;
  return { ...chronicle, units: [change(unit) as Unit, ...others] };
}

test.each<[string, (chronicle: Chronicle) => object, string]>([
  [
    'a city that sees a negative sight',
    (chronicle) => ({ ...chronicle, citySection: { ...chronicle.citySection, sight: -1 } }),
    'chronicle.citySection sees -1',
  ],
  [
    'a city that opens with a negative idle',
    (chronicle) => ({ ...chronicle, citySection: { ...chronicle.citySection, idle: -1 } }),
    'chronicle.citySection opens with -1 idle',
  ],
  ['a negative turn', (chronicle) => ({ ...chronicle, turn: -1 }), 'chronicle stands on turn -1'],
  [
    'a timeline dealing next on a negative turn',
    (chronicle) => ({ ...chronicle, timeline: { ...chronicle.timeline, next: -1 } }),
    'chronicle.timeline deals next on turn -1',
  ],
  [
    'a capstone landing on a negative turn',
    (chronicle) => ({
      ...chronicle,
      timeline: {
        ...chronicle.timeline,
        capstone: { ...chronicle.timeline.capstone, turn: -1 },
      },
    }),
    'chronicle.timeline.capstone lands on turn -1',
  ],
  ...RESOURCES.map((resource): [string, (chronicle: Chronicle) => object, string] => [
    `a negative stock of ${resource}`,
    (chronicle) => ({ ...chronicle, resources: { ...chronicle.resources, [resource]: -1 } }),
    `chronicle.resources holds a stock of -1 ${resource}`,
  ]),
  [
    'a turn shown that is negative',
    (chronicle) => ({ ...chronicle, shownTurn: -1 }),
    'chronicle shows turn -1',
  ],
  [
    'a negative population',
    (chronicle) => ({ ...chronicle, population: -1 }),
    'chronicle holds -1 population',
  ],
  [
    'a next unit number below the first unit number',
    (chronicle) => ({ ...chronicle, nextUnit: FIRST_UNIT_NUMBER - 1 }),
    `chronicle holds the next unit number ${FIRST_UNIT_NUMBER - 1}, below the first unit number ${FIRST_UNIT_NUMBER}`,
  ],
  [
    'a unit numbered below the first unit number',
    (chronicle) => firstUnit(chronicle, (unit) => ({ ...unit, id: FIRST_UNIT_NUMBER - 1 })),
    `chronicle.units[0] is numbered ${FIRST_UNIT_NUMBER - 1}, below the first unit number ${FIRST_UNIT_NUMBER}`,
  ],
  [
    'a unit with negative move points left',
    (chronicle) => firstUnit(chronicle, (unit) => ({ ...unit, movePoints: -1 })),
    'chronicle.units[0] has -1 move points left',
  ],
  [
    'a unit with negative action left',
    (chronicle) => firstUnit(chronicle, (unit) => ({ ...unit, action: -1 })),
    'chronicle.units[0] has -1 action left',
  ],
  ...Object.entries(LEAST_STATS).map(
    ([stat, least]): [string, (chronicle: Chronicle) => object, string] => [
      `a unit with a ${stat} below ${least}`,
      (chronicle) =>
        firstUnit(chronicle, (unit) => ({ ...unit, stats: { ...unit.stats, [stat]: least - 1 } })),
      `chronicle.units[0].stats has a ${stat} of ${least - 1}`,
    ],
  ),
  [
    'an ending on a negative turn',
    (chronicle) => ({ ...chronicle, ending: { outcome: 'victory', turn: -1 } }),
    'chronicle.ending ended on turn -1',
  ],
])('a save whose chronicle holds %s drops it', (_, change, reason) => {
  expect(chronicleDropped(tampered(chronicleSaved(), change))).toEqual([
    `fixture: the save's ${reason}`,
  ]);
});

test('a save whose chronicle holds a unit number the next unit number does not exceed drops it', () => {
  const { nextUnit } = chronicleSaved().chronicle;

  expect(
    chronicleDropped(
      tampered(chronicleSaved(), (chronicle) =>
        firstUnit(chronicle, (unit) => ({ ...unit, id: nextUnit })),
      ),
    ),
  ).toEqual([
    `fixture: the save's chronicle.units[0] is numbered ${nextUnit}, not below the next unit number ${nextUnit}`,
  ]);
});

test('a save whose chronicle holds two units of one number drops it', () => {
  const [unit] = chronicleSaved().chronicle.units;

  expect(
    chronicleDropped(
      tampered(chronicleSaved(), (chronicle) => ({
        ...chronicle,
        units: [unit, ...chronicle.units],
      })),
    ),
  ).toEqual([
    `fixture: the save's chronicle.units[1] is numbered ${unit.id}, a number another unit holds`,
  ]);
});

test('a save whose chronicle names no age, or an age the catalogue does not hold, drops it', () => {
  const save = chronicleSaved();

  expect(
    chronicleDropped(tampered(save, (chronicle) => ({ ...chronicle, age: undefined }))),
  ).toEqual(["fixture: the save's chronicle.age is not a string"]);
  expect(
    chronicleDropped(tampered(save, (chronicle) => ({ ...chronicle, age: 'PH_Unheld' }))),
  ).toEqual(['fixture: no age is named PH_Unheld']);
});

test('a save whose chronicle carries no city section, or one naming a building or a card the catalogue does not hold, drops it', () => {
  const save = chronicleSaved();
  const reading = (citySection: object | undefined): readonly string[] =>
    chronicleDropped(tampered(save, (chronicle) => ({ ...chronicle, citySection })));
  const section = save.chronicle.citySection;

  expect(reading(undefined)).toEqual([
    "fixture: the save's chronicle.citySection is not an object",
  ]);
  expect(reading({ ...section, building: 'PH_Fort' })).toEqual([
    'fixture: no building is named PH_Fort',
  ]);
  expect(reading({ ...section, card: 'PH_Unheld' })).toEqual([
    'fixture: no card is named PH_Unheld',
  ]);
  expect(reading({ ...section, sight: 1.5 })).toEqual([
    "fixture: the save's chronicle.citySection.sight is not an integer",
  ]);
});

test('a save whose chronicle carries no achievements, one its age does not own, one reached neither true nor false, or one carrying no tally, drops it', () => {
  const save = chronicleSaved();
  const reading = (achievements: object | undefined): readonly string[] =>
    chronicleDropped(tampered(save, (chronicle) => ({ ...chronicle, achievements })));
  const [first, ...rest] = save.chronicle.achievements;

  expect(save.chronicle.age).toBe(AGE);
  expect(first.id).toBe(HOARD);
  expect(reading(undefined)).toEqual(["fixture: the save's chronicle.achievements is not a list"]);
  expect(reading([{ ...first, id: 'PH_Unheld' }, ...rest])).toEqual([
    'fixture: no achievement is named PH_Unheld',
  ]);
  expect(reading([{ ...first, id: victoryOf(QUIET) }, ...rest])).toEqual([
    `fixture: no achievement is named ${victoryOf(QUIET)}`,
  ]);
  expect(reading([{ ...first, reached: 1 }, ...rest])).toEqual([
    "fixture: the save's chronicle.achievements[0].reached is not true or false",
  ]);
  expect(reading([{ ...first, tally: undefined }, ...rest])).toEqual([
    "fixture: the save's chronicle.achievements[0].tally is not an object",
  ]);
});

test('a save written on one content version drops its chronicle on a catalogue of another, and its campaign stands', () => {
  const text = writeSave(CATALOGUE, campaign(), chronicleSaved());
  const next = catalogued({ ...CATALOGUE, version: 'fixture-next' });

  expect(readSave(next, text)).toEqual({
    campaign: campaign(),
    chronicle: undefined,
    dropped: ['fixture-next: a chronicle begun on fixture is played on no other content'],
  });
});

test('a campaign that is not a campaign’s shape is refused whole, and the chronicle beside it stands', () => {
  const refused = (change: (campaign: Campaign) => object): readonly string[] =>
    campaignRefused(campaignTampered(change));

  expect(refused(() => ({}))).toEqual(["fixture: the save's campaign.nextCard is not an integer"]);
  expect(
    campaignRefused(
      JSON.stringify({
        ...JSON.parse(writeSave(CATALOGUE, campaign(), chronicleSaved())),
        campaign: 1,
      }),
    ),
  ).toEqual(["fixture: the save's campaign is not an object"]);
  expect(refused((held) => ({ ...held, influence: String(held.influence) }))).toEqual([
    "fixture: the save's campaign.influence is not an integer",
  ]);
  expect(refused((held) => ({ ...held, technologies: {} }))).toEqual([
    "fixture: the save's campaign.technologies is not a list",
  ]);
  expect(refused((held) => ({ ...held, collection: [...held.collection, 'PH_Worker'] }))).toEqual([
    `fixture: the save's campaign.collection[${campaign().collection.length}] is not an object`,
  ]);
  expect(
    refused(({ civilizations, ...held }) => ({
      ...held,
      civilization: civilizations[CIVILIZATION_ID],
    })),
  ).toEqual(["fixture: the save's campaign.civilizations is not an object"]);
  expect(refused((held) => ({ ...held, civilizations: {} }))).toEqual([
    "fixture: the save's campaign.civilizations holds no civilization",
  ]);
  expect(
    refused((held) => withCivilization(held, (civilization) => ({ ...civilization, settle: 1 }))),
  ).toEqual([`fixture: the save's ${CIVILIZATION_AT}.settle is not a list`]);
  expect(
    refused((held) =>
      withCivilization(held, (civilization) => ({
        ...civilization,
        city: { ...civilization.city, sight: 1.5 },
      })),
    ),
  ).toEqual([`fixture: the save's ${CIVILIZATION_AT}.city.sight is not an integer`]);
  expect(
    refused((held) =>
      withCivilization(held, (civilization) => ({
        ...civilization,
        city: { ...civilization.city, idle: 'two' },
      })),
    ),
  ).toEqual([`fixture: the save's ${CIVILIZATION_AT}.city.idle is not an integer`]);
});

test('a campaign holding a card number the next number does not exceed, or a number two cards hold, is refused whole', () => {
  const held = campaign();
  const last = held.collection.length - 1;
  const [first, second, ...rest] = held.collection;

  expect(
    campaignRefused(
      campaignTampered((written) => ({ ...written, nextCard: written.nextCard - 1 })),
    ),
  ).toEqual([
    `fixture: the save's campaign.collection[${last}] is numbered ${held.nextCard - 1}, not below the next number ${held.nextCard - 1}`,
  ]);
  expect(
    campaignRefused(
      campaignTampered((written) => ({
        ...written,
        collection: [first, { ...second, number: first.number }, ...rest],
      })),
    ),
  ).toEqual([
    `fixture: the save's campaign.collection[1] is numbered ${first.number}, a number another card holds`,
  ]);
  expect(
    campaignRefused(
      campaignTampered((written) => ({
        ...written,
        collection: [
          { ...first, number: heldCivilization(held).city.card.number },
          second,
          ...rest,
        ],
      })),
    ),
  ).toEqual([
    `fixture: the save's campaign.collection[0] is numbered ${heldCivilization(held).city.card.number}, a number another card holds`,
  ]);
});

test('a campaign holding a card numbered below the first number is refused whole', () => {
  expect(
    campaignRefused(
      campaignTampered((written) => {
        const [first, ...rest] = written.collection;
        return { ...written, collection: [{ ...first, number: FIRST_CARD_NUMBER - 1 }, ...rest] };
      }),
    ),
  ).toEqual([
    `fixture: the save's campaign.collection[0] is numbered ${FIRST_CARD_NUMBER - 1}, below the first number ${FIRST_CARD_NUMBER}`,
  ]);
});

test('a campaign holding a next number below the first number is refused whole', () => {
  const below = FIRST_CARD_NUMBER - 1;

  expect(campaignRefused(campaignTampered((written) => ({ ...written, nextCard: below })))).toEqual(
    [
      `fixture: the save's campaign holds the next number ${below}, below the first number ${FIRST_CARD_NUMBER}`,
    ],
  );
});

test('a campaign holding negative influence is refused whole', () => {
  expect(campaignRefused(campaignTampered((written) => ({ ...written, influence: -1 })))).toEqual([
    "fixture: the save's campaign holds -1 influence",
  ]);
});

test('a campaign whose city sees a negative sight is refused whole', () => {
  expect(
    campaignRefused(
      campaignTampered((written) =>
        withCivilization(written, (civilization) => ({
          ...civilization,
          city: { ...civilization.city, sight: -1 },
        })),
      ),
    ),
  ).toEqual([`fixture: the save's ${CIVILIZATION_AT}.city sees -1`]);
});

test('a campaign whose city opens with a negative idle is refused whole', () => {
  expect(
    campaignRefused(
      campaignTampered((written) =>
        withCivilization(written, (civilization) => ({
          ...civilization,
          city: { ...civilization.city, idle: -1 },
        })),
      ),
    ),
  ).toEqual([`fixture: the save's ${CIVILIZATION_AT}.city opens with -1 idle`]);
});

/** What reading the text leaves of the campaign, and the reasons it dropped, the chronicle standing. */
function campaignRead(text: string): { campaign?: Campaign; dropped: readonly string[] } {
  const { chronicle, ...read } = readSave(CATALOGUE, text);
  expect(chronicle).toEqual(chronicleSaved());
  return read;
}

test('a technology the catalogue does not bring, or one named a second time, is dropped with its reason, and the rest stands', () => {
  const held = campaign();
  const [technology] = held.technologies;
  const at = held.technologies.length;

  expect(
    campaignRead(
      campaignTampered((written) => ({
        ...written,
        technologies: [...written.technologies, 'PH_Unheld', technology],
      })),
    ),
  ).toEqual({
    campaign: held,
    dropped: [
      `fixture: the save's campaign.technologies[${at}] names no technology PH_Unheld`,
      `fixture: the save's campaign.technologies[${at + 1}] names the technology ${technology} a second time`,
    ],
  });
});

test('a campaign’s pins write as a save and read back', () => {
  const held = campaign();
  const [technology] = held.pins;
  const moved = pinned(CATALOGUE, unpinned(held, technology), technology);

  expect(held.pins.length).toBeGreaterThan(1);
  expect(moved.pins).not.toEqual(held.pins);
  expect(readSave(CATALOGUE, writeSave(CATALOGUE, moved))).toEqual({
    campaign: moved,
    chronicle: undefined,
    dropped: [],
  });
});

test('a pin naming a technology the catalogue does not hold, one learned, one unknown or one named a second time is dropped with its reason, and the rest stand', () => {
  const held = campaign();
  const [technology] = held.pins;
  const at = held.pins.length;
  const read = (change: (written: Campaign) => object): ReturnType<typeof campaignRead> =>
    campaignRead(campaignTampered(change));

  expect(held.technologies).toContain(GRANARY);
  expect(held.pins).toContain(CENSUS);
  expect(
    read((written) => ({
      ...written,
      pins: [...written.pins, 'PH_Unheld', GRANARY, technology],
    })),
  ).toEqual({
    campaign: held,
    dropped: [
      `fixture: the save's campaign.pins[${at}] names no technology PH_Unheld`,
      `fixture: the save's campaign.pins[${at + 1}] names the learned technology ${GRANARY}`,
      `fixture: the save's campaign.pins[${at + 2}] names the technology ${technology} a second time`,
    ],
  });
  expect(read((written) => ({ ...written, technologies: [] }))).toEqual({
    campaign: { ...held, technologies: [], pins: held.pins.filter((pin) => pin !== CENSUS) },
    dropped: [
      `fixture: the save's campaign.pins[${held.pins.indexOf(CENSUS)}] names the unknown technology ${CENSUS}`,
    ],
  });
});

test('a campaign carrying no list of pins reads with nothing pinned, and a single pin beside it goes unread', () => {
  const held = campaign();
  const [technology] = held.pins;

  expect(
    campaignRead(campaignTampered(({ pins: _, ...written }) => ({ ...written, pin: technology }))),
  ).toEqual({ campaign: { ...held, pins: [] }, dropped: [] });
});

test('a card of the collection the catalogue does not hold is dropped, and every number the deck names it by with it', () => {
  const held = campaign();
  const [number] = heldCivilization(held).cards;
  const at = held.collection.findIndex((card) => card.number === number);

  expect(
    campaignRead(
      campaignTampered((written) => ({
        ...written,
        collection: written.collection.map((card, other) =>
          other === at ? { ...card, id: 'PH_Unheld' } : card,
        ),
      })),
    ),
  ).toEqual({
    campaign: {
      ...withCivilization(held, (civilization) => ({
        ...civilization,
        cards: civilization.cards.slice(1),
      })),
      collection: held.collection.filter((_, other) => other !== at),
    },
    dropped: [
      `fixture: the save's campaign.collection[${at}] names no card PH_Unheld`,
      `fixture: the save's ${CIVILIZATION_AT}.cards[0] names no card of the collection numbered ${number}`,
    ],
  });
});

test('a deck number naming no card of the collection, or naming one a second time, is dropped with its reason', () => {
  const held = campaign();
  const { cards, city } = heldCivilization(held);
  const [number] = cards;
  const at = cards.length;

  expect(
    campaignRead(
      campaignTampered((written) =>
        withCivilization(written, (civilization) => ({
          ...civilization,
          cards: [...civilization.cards, city.card.number, number],
        })),
      ),
    ),
  ).toEqual({
    campaign: held,
    dropped: [
      `fixture: the save's ${CIVILIZATION_AT}.cards[${at}] names no card of the collection numbered ${city.card.number}`,
      `fixture: the save's ${CIVILIZATION_AT}.cards[${at + 1}] names the card numbered ${number} a second time`,
    ],
  });
});

test('a card in a section its kind does not fit is dropped from the deck and kept in the collection', () => {
  const held = campaign();
  const [settle] = heldCivilization(held).settle;
  const [card, ...cards] = heldCivilization(held).cards;
  const idOf = (number: number): string | undefined =>
    held.collection.find((owned) => owned.number === number)?.id;

  expect(
    campaignRead(
      campaignTampered((written) =>
        withCivilization(written, (civilization) => ({
          ...civilization,
          settle: [card],
          cards: [settle, ...cards],
        })),
      ),
    ),
  ).toEqual({
    campaign: withCivilization(held, (civilization) => ({ ...civilization, settle: [], cards })),
    dropped: [
      `fixture: the save's ${CIVILIZATION_AT}.settle[0] holds the unit ${idOf(card)} in its settle section`,
      `fixture: the save's ${CIVILIZATION_AT}.cards[0] holds the settle card ${idOf(settle)} among its cards`,
    ],
  });
});

test('a copy of a hazard or of a camp’s reward is dropped from the collection, and every number the deck names it by with it', () => {
  const held = campaign();
  const owned = [
    { number: held.nextCard, id: 'PH_Hunger' },
    { number: held.nextCard + 1, id: 'PH_Spoils' },
  ];
  const at = held.collection.length;
  const cardsAt = heldCivilization(held).cards.length;
  const nextCard = held.nextCard + 2;

  expect(
    campaignRead(
      campaignTampered(() =>
        withCivilization(
          { ...held, nextCard, collection: [...held.collection, ...owned] },
          (civilization) => ({
            ...civilization,
            cards: [...civilization.cards, ...owned.map(({ number }) => number)],
          }),
        ),
      ),
    ),
  ).toEqual({
    campaign: { ...held, nextCard },
    dropped: [
      `fixture: the save's campaign.collection[${at}] names the hazard PH_Hunger`,
      `fixture: the save's campaign.collection[${at + 1}] names the age ${AGE}'s camp's reward PH_Spoils`,
      `fixture: the save's ${CIVILIZATION_AT}.cards[${cardsAt}] names no card of the collection numbered ${held.nextCard}`,
      `fixture: the save's ${CIVILIZATION_AT}.cards[${cardsAt + 1}] names no card of the collection numbered ${held.nextCard + 1}`,
    ],
  });
});

test('a city section whose building or card the catalogue does not hold, or whose card is not a settle card, is the one its civilization was authored with again, its card a new card', () => {
  const held = campaign();
  const restored = withCivilization({ ...held, nextCard: held.nextCard + 1 }, (civilization) => ({
    ...civilization,
    city: { ...CIVILIZATION.city, card: { number: held.nextCard, id: CIVILIZATION.city.card } },
  }));
  const cityRead = (city: object): ReturnType<typeof campaignRead> =>
    campaignRead(
      campaignTampered((written) =>
        withCivilization(written, (civilization) => ({
          ...civilization,
          city: { ...civilization.city, sight: CIVILIZATION.city.sight + 1, ...city },
        })),
      ),
    );
  const { card } = heldCivilization(held).city;

  expect(cityRead({ building: 'PH_Fort' })).toEqual({
    campaign: restored,
    dropped: [`fixture: the save's ${CIVILIZATION_AT}.city names no building PH_Fort`],
  });
  expect(cityRead({ card: { ...card, id: 'PH_Unheld' } })).toEqual({
    campaign: restored,
    dropped: [`fixture: the save's ${CIVILIZATION_AT}.city names no card PH_Unheld`],
  });
  expect(cityRead({ card: { ...card, id: 'PH_Harvest' } })).toEqual({
    campaign: restored,
    dropped: [
      `fixture: the save's ${CIVILIZATION_AT}.city holds the instant PH_Harvest in its city section`,
    ],
  });
});

test('a city section the save cannot resolve is the catalogue’s civilization’s of that name, and the catalogue’s first where it holds none of that name', () => {
  const first = { ...CIVILIZATION.city, sight: CIVILIZATION.city.sight + 3 };
  const catalogue = catalogued({
    ...CATALOGUE,
    civilizations: { first: { ...CIVILIZATION, city: first }, ...CATALOGUE.civilizations },
  });
  const held = campaign();
  const civilization = heldCivilization(held);
  const named = (name: string, city: CampaignCivilization['city'], nextCard: number): Campaign => ({
    ...held,
    nextCard,
    civilizations: { [name]: { ...civilization, city } },
  });
  const read = (name: string): Campaign | undefined =>
    readSave(
      catalogue,
      JSON.stringify({
        campaign: named(name, { ...civilization.city, building: 'PH_Fort' }, held.nextCard),
      }),
    ).campaign;
  const restored = (name: string, city: CitySection): Campaign =>
    named(name, { ...city, card: { number: held.nextCard, id: city.card } }, held.nextCard + 1);

  expect(read(CIVILIZATION_ID)).toEqual(restored(CIVILIZATION_ID, CIVILIZATION.city));
  expect(read('PH_Unheld')).toEqual(restored('PH_Unheld', first));
});

test('a chronicle naming a civilization the campaign does not hold is dropped, and the campaign stands', () => {
  const text = JSON.stringify({
    ...JSON.parse(writeSave(CATALOGUE, campaign(), chronicleSaved())),
    civilization: 'PH_Unheld',
  });

  expect(chronicleDropped(text)).toEqual([
    "fixture: the save's civilization names no civilization of the campaign named PH_Unheld",
  ]);
});

test('an ended chronicle is kept as the campaign it paid into and no chronicle; one in progress is kept beside the campaign, which it has not paid', () => {
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const won = hoardedVictory();
  const progress = chronicleSaved();

  expect(keptAfter(CATALOGUE, opened, { ...progress, chronicle: won })).toEqual({
    campaign: paidInto(CATALOGUE, opened, won).campaign,
    payment: paidInto(CATALOGUE, opened, won),
  });
  expect(keptAfter(CATALOGUE, opened, progress)).toEqual({
    campaign: opened,
    chronicle: progress,
  });
});

test('a campaign the reading would drop anything of, or refuse whole, is refused its save', () => {
  const held = campaign();

  expect(() =>
    writeSave(CATALOGUE, { ...held, technologies: [...held.technologies, 'PH_Unheld'] }),
  ).toThrow(
    `fixture: the save's campaign.technologies[${held.technologies.length}] names no technology PH_Unheld`,
  );
  expect(() => writeSave(CATALOGUE, { ...held, influence: -1 })).toThrow(
    "fixture: the save's campaign holds -1 influence",
  );
});
