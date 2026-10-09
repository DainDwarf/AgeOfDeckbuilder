import { expect, test } from 'vitest';
import { embarks, placesImprovement } from './cards';
import {
  type Age,
  type Answer,
  achievementOf,
  ageOf,
  type Camp,
  type Card,
  type Catalogue,
  cardAge,
  cardOf,
  catalogued,
  entered,
  FIRST_STEPS,
  merged,
  type Schedule,
  type Slice,
  type Technology,
  technologyOf,
  type UnitEntryTable,
  type Wave,
} from './catalogue';
import { apply, beginChronicle, launched } from './chronicle';
import {
  AGE,
  achieved,
  aged,
  CAMP,
  CATALOGUE,
  CENSUS,
  CITY,
  CIVILIZATION,
  CLEARING,
  camping,
  changed,
  cityOf,
  field,
  GRANARY,
  HOARD,
  NO_DEALS,
  QUIET,
  REGION,
  REGIONS,
  regionsUnlocked,
  SITE,
  SITES,
  SLICES,
  SLOW_SLINGER,
  victoryOf,
  WARY,
  WELL,
} from './fixtures';
import { discTiles, generateMap, tileKey } from './map';
import { buildingKind, type LayerKind, type Region } from './map-kinds';
import { seedRng } from './rng';
import { timelineOf } from './schedule';
import { unchanged } from './stages';
import { LEAST_STATS } from './units';

/** The fixture's content with its first age's schedule changed as the test lays it over. */
function rescheduled(schedule: Partial<Schedule>): Catalogue {
  return aged({ schedule: { ...ageOf(CATALOGUE, AGE).schedule, ...schedule } });
}

/** The fixture's content with its first age's camp changed as the test lays it over. */
function encamped(camp: Partial<Camp>): Catalogue {
  return aged({ camp: { ...CAMP, ...camp } });
}

/** The fixture's content with its first age's sites replaced by the ones the test names. */
function sited(sites: Age['sites']): Catalogue {
  return aged({ sites });
}

/** The fixture's content with its first age's regions replaced by the ones the test names. */
function regioned(regions: Readonly<Record<string, Region>>): Partial<Catalogue> {
  return { ages: { ...CATALOGUE.ages, [AGE]: { ...ageOf(CATALOGUE, AGE), regions } } };
}

/** The fixture's content with its technologies laid over as the test lays them. */
function withTechnologies(technologies: Catalogue['technologies']): Catalogue {
  return changed({ technologies: { ...CATALOGUE.technologies, ...technologies } });
}

const HOARD_DECLARED = achievementOf(CATALOGUE, AGE, HOARD);

const GRANARY_DECLARED = technologyOf(CATALOGUE, GRANARY);

test('a catalogue whose achievement needs a count below one, or pays influence below nought, is refused', () => {
  for (const off of [{ need: 0 }, { need: 1.5 }, { influence: -1 }]) {
    expect(() => catalogued(achieved({ [HOARD]: { ...HOARD_DECLARED, ...off } }))).toThrow(
      /^fixture: /,
    );
  }
  expect(() =>
    catalogued(achieved({ [HOARD]: { ...HOARD_DECLARED, influence: 0 } })),
  ).not.toThrow();
});

test('a catalogue whose age sets a base price that is not a whole number of at least one is refused', () => {
  for (const basePrice of [0, -1, 1.5]) {
    expect(() => catalogued(aged({ basePrice }))).toThrow(
      `fixture: the age ${AGE} sets a base price of ${basePrice}`,
    );
  }
  expect(() => catalogued(aged({ basePrice: 1 }))).not.toThrow();
});

test('a catalogue whose achievement earns a technology it does not hold is refused', () => {
  const content = achieved({ [HOARD]: { ...HOARD_DECLARED, technology: 'PH_Unheld' } });

  expect(() => catalogued(content)).toThrow('fixture: no technology is named PH_Unheld');
});

test('a catalogue where two ages own one achievement is refused', () => {
  const quiet = ageOf(CATALOGUE, QUIET);
  const content = changed({
    ages: {
      ...CATALOGUE.ages,
      [QUIET]: { ...quiet, achievements: { ...quiet.achievements, [HOARD]: HOARD_DECLARED } },
    },
  });

  expect(() => catalogued(content)).toThrow(
    `fixture: the ages ${AGE} and ${QUIET} both own ${HOARD}`,
  );
});

test('a catalogue whose technology is earned by no achievement, or by two, is refused', () => {
  const unearned = withTechnologies({ PH_Unearned: { needs: [], unlocks: { cards: {} } } });
  const twice = achieved({ PH_Twice: HOARD_DECLARED });

  expect(() => catalogued(unearned)).toThrow(
    'fixture: the technology PH_Unearned is earned by no achievement',
  );
  expect(() => catalogued(twice)).toThrow(
    `fixture: the technology ${GRANARY} is earned by both ${HOARD} and PH_Twice`,
  );
});

test('a catalogue whose technology needs one it does not hold, or needs itself through the others, is refused', () => {
  const needing = (needs: readonly string[]): Catalogue =>
    withTechnologies({ [GRANARY]: { ...GRANARY_DECLARED, needs } });

  expect(technologyOf(CATALOGUE, CENSUS).needs).toEqual([GRANARY]);
  expect(() => catalogued(needing(['PH_Unheld']))).toThrow(
    'fixture: no technology is named PH_Unheld',
  );
  expect(() => catalogued(needing([GRANARY]))).toThrow(
    `fixture: the technology ${GRANARY} needs itself: ${GRANARY} needs ${GRANARY}`,
  );
  expect(() => catalogued(needing([CENSUS]))).toThrow(
    `fixture: the technology ${GRANARY} needs itself: ${GRANARY} needs ${CENSUS} needs ${GRANARY}`,
  );
});

test('a catalogue whose technology unlocks a card it does not hold, a card by fewer than one copy, or an age it does not hold, is refused', () => {
  const unlocking: Technology['unlocks'][] = [
    { cards: { PH_Scout: 2 } },
    { cards: { PH_Harvest: 0 } },
    { cards: {}, age: 'PH_Unheld' },
  ];
  for (const unlocks of unlocking) {
    const content = withTechnologies({ [GRANARY]: { ...GRANARY_DECLARED, unlocks } });

    expect(() => catalogued(content)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose technology unlocks a hazard or a camp’s reward is refused', () => {
  const [reward] = CAMP.rewards;
  const unlocking = (card: string): Catalogue =>
    withTechnologies({
      [GRANARY]: {
        ...GRANARY_DECLARED,
        unlocks: { ...GRANARY_DECLARED.unlocks, cards: { [card]: 1 } },
      },
    });

  expect(cardOf(CATALOGUE, 'PH_Hunger').kind).toBe('hazard');
  expect(() => catalogued(unlocking('PH_Hunger'))).toThrow(
    `fixture: the technology ${GRANARY} unlocks the hazard PH_Hunger`,
  );
  expect(() => catalogued(unlocking(reward))).toThrow(
    `fixture: the technology ${GRANARY} unlocks the age ${AGE}'s camp's reward ${reward}`,
  );
});

test('a catalogue whose age but the first is unlocked by no technology or by two, or whose first age is unlocked by one, is refused', () => {
  const { technology } = achievementOf(CATALOGUE, AGE, victoryOf(AGE));
  const past = technologyOf(CATALOGUE, technology);
  const unlocking = (age: string): Catalogue =>
    withTechnologies({ [GRANARY]: { ...GRANARY_DECLARED, unlocks: { cards: {}, age } } });

  expect(past.unlocks.age).toBe(QUIET);
  expect(() =>
    catalogued(withTechnologies({ [technology]: { ...past, unlocks: { cards: {} } } })),
  ).toThrow(`fixture: the age ${QUIET} is unlocked by nothing`);
  expect(() => catalogued(unlocking(QUIET))).toThrow(
    `fixture: the age ${QUIET} is unlocked by both ${GRANARY} and ${technology}`,
  );
  expect(() => catalogued(unlocking(AGE))).toThrow(
    `fixture: the first age ${AGE} is unlocked by ${GRANARY}`,
  );
});

test('a catalogue whose technology unlocks a region no age holds, whose region is unlocked by two technologies, or whose age holds no region reached from the first chronicle, is refused', () => {
  expect(() => regionsUnlocked({ [GRANARY]: 'PH_Unheld' })).toThrow(
    `fixture: the technology ${GRANARY} unlocks the region PH_Unheld, which no age holds`,
  );
  expect(() => regionsUnlocked({ [GRANARY]: REGION, [CENSUS]: REGION })).toThrow(
    `fixture: the region ${REGION} is unlocked by both ${GRANARY} and ${CENSUS}`,
  );
  expect(() => regionsUnlocked({ [GRANARY]: REGION, [CENSUS]: CLEARING })).toThrow(
    `fixture: the age ${AGE} holds no region reached from the first chronicle`,
  );
  expect(() => regionsUnlocked({ [GRANARY]: REGION })).not.toThrow();
});

test('a catalogue whose technology needs one earned in a later age is refused, and one needing a technology of an earlier age is not', () => {
  const { technology: later } = achievementOf(CATALOGUE, QUIET, victoryOf(QUIET));
  const past = technologyOf(CATALOGUE, later);

  expect(() =>
    catalogued(withTechnologies({ [GRANARY]: { ...GRANARY_DECLARED, needs: [later] } })),
  ).toThrow(
    `fixture: the technology ${GRANARY} of the age ${AGE} needs ${later} of the later age ${QUIET}`,
  );
  expect(() =>
    catalogued(withTechnologies({ [later]: { ...past, needs: [GRANARY] } })),
  ).not.toThrow();
});

test('a catalogue whose technology unlocks an age other than the one right after its own is refused', () => {
  const { technology: first } = achievementOf(CATALOGUE, AGE, victoryOf(AGE));
  const { technology: second } = achievementOf(CATALOGUE, QUIET, victoryOf(QUIET));
  expect(technologyOf(CATALOGUE, first).unlocks.age).toBe(QUIET);
  expect(technologyOf(CATALOGUE, second).unlocks.age).toBe(WARY);
  const swapped = withTechnologies({
    [first]: { ...technologyOf(CATALOGUE, first), unlocks: { cards: {}, age: WARY } },
    [second]: { ...technologyOf(CATALOGUE, second), unlocks: { cards: {}, age: QUIET } },
  });

  expect(() => catalogued(swapped)).toThrow(
    `fixture: the technology ${first} of the age ${AGE} unlocks the age ${WARY}, not the one after it`,
  );
});

test('a catalogue whose camp’s opening or roll holds no row, a row of a kind or a script it does not hold, or a row at a weight not above nought is refused', () => {
  const [row] = CAMP.roll;
  const refusals = (owner: string): [UnitEntryTable, string][] => [
    [[], `${owner} holds no row`],
    [[row, { ...row, kind: 'PH_Scout' }], 'no unit kind is named PH_Scout'],
    [[row, { ...row, script: 'retreat' }], 'no enemy script is named retreat'],
    [[row, { ...row, weight: 0 }], `${owner} enters ${row.kind} as ${row.script} at a weight of 0`],
    [
      [row, { ...row, weight: -1 }],
      `${owner} enters ${row.kind} as ${row.script} at a weight of -1`,
    ],
  ];

  for (const table of ['opening', 'roll'] as const) {
    for (const [rows, refusal] of refusals(`the age ${AGE}'s camp's ${table}`)) {
      expect(() => catalogued(encamped({ [table]: rows }))).toThrow(`fixture: ${refusal}`);
    }
    expect(() => catalogued(encamped({ [table]: [row, { ...row, weight: 0.5 }] }))).not.toThrow();
  }
});

test('a catalogue whose camp names a guard’s or a raider’s script it does not hold is refused', () => {
  const { scripts } = CAMP;
  const guard = encamped({ scripts: { ...scripts, guard: 'retreat' } });
  const raider = encamped({ scripts: { ...scripts, raider: 'retreat' } });

  expect(() => catalogued(guard)).toThrow(/^fixture: /);
  expect(() => catalogued(raider)).toThrow(/^fixture: /);
});

test('a catalogue whose camp rolls at odds below nought or above one is refused', () => {
  const below = encamped({ odds: -0.1 });
  const above = encamped({ odds: 1.1 });

  expect(() => catalogued(below)).toThrow(/^fixture: /);
  expect(() => catalogued(above)).toThrow(/^fixture: /);
});

test('a catalogue whose raids enter through a camp at odds below nought or above one is refused', () => {
  const below = encamped({ raidCampOdds: -0.1 });
  const above = encamped({ raidCampOdds: 1.1 });

  expect(() => catalogued(below)).toThrow(/^fixture: /);
  expect(() => catalogued(above)).toThrow(/^fixture: /);
});

test('a catalogue whose camp is dealt across the water and names no embarked move, or names one below one, is refused', () => {
  const ashore = encamped({ acrossWater: true });
  const stuck = encamped({ acrossWater: true, embarkedMove: 0 });

  expect(() => catalogued(ashore)).toThrow(/^fixture: /);
  expect(() => catalogued(stuck)).toThrow(/^fixture: /);
  expect(() => catalogued(encamped({ acrossWater: true, embarkedMove: 1 }))).not.toThrow();
});

test('a catalogue whose camp’s wave names a count gathered or sent below one, or more sent than gathered, is refused', () => {
  const wave: Wave = { gathered: 3, sent: 2 };
  const waving = (laid: Partial<Wave>): Catalogue => encamped({ wave: { ...wave, ...laid } });
  const refusals: [Catalogue, string][] = [
    [waving({ gathered: 0, sent: 0 }), 'sends a wave once 0 have gathered'],
    [waving({ sent: 0 }), 'sends 0 of 3 gathered'],
    [waving({ sent: 4 }), 'sends 4 of 3 gathered'],
  ];

  for (const [content, refusal] of refusals) {
    expect(() => catalogued(content)).toThrow(`fixture: the age ${AGE}'s camp ${refusal}`);
  }
  expect(() => catalogued(waving({ sent: 3 }))).not.toThrow();
});

test('a catalogue whose camp lies on a terrain none of its opening’s kinds stands on is refused, and one that one of them stands on is not, whatever its roll’s kinds', () => {
  const [row] = CAMP.opening;
  const slinger = { ...row, kind: 'PH_Slinger' };
  expect(buildingKind(CATALOGUE, CAMP.building).terrains).toContain('forest');
  expect(() => camping({ opening: [slinger], roll: [row] }, SLOW_SLINGER)).toThrow(
    `fixture: none of the kinds of the age ${AGE}'s camp's opening stands on forest`,
  );
  expect(() => camping({ opening: [row, slinger], roll: [slinger] }, SLOW_SLINGER)).not.toThrow();
});

test('a catalogue whose unit kind names itself by another key is refused', () => {
  const content = changed({
    units: { ...CATALOGUE.units, PH_Guard: CATALOGUE.units.PH_Warrior },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test.each(Object.entries(LEAST_STATS))(
  'a catalogue whose unit kind has a %s below %i is refused',
  (stat, least) => {
    const kind = { ...CATALOGUE.units.PH_Warrior, [stat]: least - 1 };
    const content = changed({ units: { ...CATALOGUE.units, PH_Warrior: kind } });

    expect(() => catalogued(content)).toThrow(
      `fixture: the unit kind PH_Warrior has a ${stat} of ${least - 1}`,
    );
  },
);

test('a catalogue whose unit kind has a stat that is not a whole number is refused', () => {
  const kind = { ...CATALOGUE.units.PH_Warrior, damage: 1.5 };
  const content = changed({ units: { ...CATALOGUE.units, PH_Warrior: kind } });

  expect(() => catalogued(content)).toThrow(
    'fixture: the unit kind PH_Warrior has a damage of 1.5',
  );
});

test('a catalogue whose biome names a terrain it does not hold is refused', () => {
  const { sea } = CATALOGUE.biomes;
  const content = changed({ biomes: { ...CATALOGUE.biomes, sea: { ...sea, rim: { shoal: 1 } } } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose biome grows at a growth weight of nought or to a size of nought is refused', () => {
  const { sea, clearing } = CATALOGUE.biomes;
  for (const biome of [
    { ...sea, growth: { kind: 'weight', weight: 0 } } as const,
    { ...clearing, growth: { kind: 'size', size: 0 } } as const,
  ]) {
    const content = changed({ biomes: { ...CATALOGUE.biomes, sea: biome } });

    expect(() => catalogued(content)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose region deals sized biomes, its centre’s and those by share, as large as its disc together is refused', () => {
  const { clearing } = CATALOGUE.biomes;
  const disc = REGIONS[CLEARING];
  const sized = (size: number): Catalogue =>
    changed({
      version: 'sized',
      biomes: { ...CATALOGUE.biomes, clearing: { ...clearing, growth: { kind: 'size', size } } },
      ...regioned({
        [CLEARING]: {
          ...disc,
          biomeShares: [
            { biome: 'sea', share: 0.2 },
            { biome: 'mountain', share: 0.2 },
            { biome: 'land', share: 0.2 },
            { biome: 'clearing', share: 0.4 },
          ],
        },
      }),
    });
  const tiles = discTiles(disc.radius);

  expect(() => catalogued(sized(Math.ceil(tiles / 3)))).toThrow(/^sized: /);
  expect(catalogued(sized(Math.floor((tiles - 1) / 3))).version).toBe('sized');
});

test('a catalogue whose region leaves biomes over its shares to a centre kind dealt to a size is refused', () => {
  const disc = REGIONS[CLEARING];
  const landing = (share: number): Catalogue =>
    changed({
      version: 'landing',
      ...regioned({
        [CLEARING]: {
          ...disc,
          biomeShares: [
            { biome: 'sea', share: 0.2 },
            { biome: 'mountain', share: 0.2 },
            { biome: 'land', share },
          ],
        },
      }),
    });

  expect(() => catalogued(landing(0.4))).toThrow(/^landing: /);
  expect(catalogued(landing(0.6)).version).toBe('landing');
});

test('a catalogue whose region deals a share of a biome that rounds to no biome is refused', () => {
  const disc = REGIONS[REGION];
  const content = changed(
    regioned({
      [REGION]: {
        ...disc,
        biomeShares: [
          { biome: 'sea', share: 0.3 },
          { biome: 'mountain', share: 0.01 },
        ],
      },
    }),
  );

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose feature lies on a terrain it does not hold is refused', () => {
  const content = changed({ features: { PH_Fertile: { terrain: 'marsh', yields: {} } } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose building gives to a terrain it does not hold is refused', () => {
  const well = CATALOGUE.buildings[WELL];
  const content = changed({
    buildings: {
      ...CATALOGUE.buildings,
      [WELL]: { ...well, givesBeside: { terrain: 'marsh', yields: {} } },
    },
  });

  expect(() => catalogued(content)).toThrow('fixture: no terrain is named marsh');
});

test('a catalogue whose region names a biome or a feature it does not hold is refused', () => {
  const disc = REGIONS[REGION];
  const tundra = changed(regioned({ [REGION]: { ...disc, centreBiome: 'tundra' } }));
  const ruins = changed(
    regioned({ [REGION]: { ...disc, featureShares: [{ feature: 'PH_Ruins', share: 1 }] } }),
  );
  const kept = changed(
    regioned({
      [REGION]: {
        ...disc,
        biomeShares: [{ biome: 'sea', share: 0.3, keepsAwayFrom: ['tundra'] }],
      },
    }),
  );

  expect(() => catalogued(tundra)).toThrow(/^fixture: /);
  expect(() => catalogued(ruins)).toThrow(/^fixture: /);
  expect(() => catalogued(kept)).toThrow(/^fixture: /);
});

test('a catalogue whose region keeps a biome away from its own kind is refused', () => {
  const disc = REGIONS[REGION];
  const keeping = (kind: string): Catalogue =>
    changed({
      version: 'keeping',
      ...regioned({
        [REGION]: {
          ...disc,
          biomeShares: [
            { biome: 'sea', share: 0.3, keepsAwayFrom: [kind] },
            { biome: 'mountain', share: 0.1 },
          ],
        },
      }),
    });

  expect(() => catalogued(keeping('sea'))).toThrow(/^keeping: /);
  expect(catalogued(keeping('mountain')).version).toBe('keeping');
});

test('a catalogue whose layer names a movement cost of zero is refused', () => {
  const content = changed({
    improvements: {
      ...CATALOGUE.improvements,
      PH_Road: { ...CATALOGUE.improvements.PH_Road, movementCost: 0 },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose terrain names a movement cost of zero, ashore or embarked, is refused', () => {
  const { terrains } = CATALOGUE;
  const ashore = changed({
    terrains: { ...terrains, plain: { ...terrains.plain, movementCost: 0 } },
  });
  const embarked = changed({
    terrains: { ...terrains, coast: { ...terrains.coast, embarkedMovementCost: 0 } },
  });

  expect(() => catalogued(ashore)).toThrow(/^fixture: /);
  expect(() => catalogued(embarked)).toThrow(/^fixture: /);
});

test('a catalogue whose layer names no terrain, or a feature list holding none, is refused', () => {
  const { improvements, buildings } = CATALOGUE;
  for (const content of [
    changed({
      improvements: { ...improvements, PH_Mine: { ...improvements.PH_Mine, terrains: [] } },
    }),
    changed({ buildings: { ...buildings, PH_Farm: { ...buildings.PH_Farm, terrains: [] } } }),
  ]) {
    expect(() => catalogued(content)).toThrow(/^fixture: .* names no terrain$/);
  }
  for (const content of [
    changed({
      improvements: { ...improvements, PH_Snare: { ...improvements.PH_Snare, features: [] } },
    }),
    changed({ buildings: { ...buildings, PH_Lodge: { ...buildings.PH_Lodge, features: [] } } }),
  ]) {
    expect(() => catalogued(content)).toThrow(/^fixture: .* names a feature list holding none$/);
  }
});

test('a catalogue whose layer names a feature it does not hold, or one lying on a terrain the layer does not name, is refused', () => {
  const snare = CATALOGUE.improvements.PH_Snare;
  const lodge = CATALOGUE.buildings.PH_Lodge;
  for (const content of [
    changed({
      improvements: { ...CATALOGUE.improvements, PH_Snare: { ...snare, features: ['PH_Ruins'] } },
    }),
    changed({
      improvements: { ...CATALOGUE.improvements, PH_Snare: { ...snare, terrains: ['plain'] } },
    }),
    changed({
      buildings: { ...CATALOGUE.buildings, PH_Lodge: { ...lodge, features: ['PH_Ruins'] } },
    }),
    changed({ buildings: { ...CATALOGUE.buildings, PH_Lodge: { ...lodge, terrains: ['plain'] } } }),
    changed({
      buildings: {
        ...CATALOGUE.buildings,
        PH_Lodge: { ...lodge, features: ['PH_Game', 'PH_Fertile'] },
      },
    }),
  ]) {
    expect(() => catalogued(content)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose civilization’s city or whose camp is a building naming a feature or the river is refused, and the same building naming neither is not', () => {
  const { features, ...unnamed } = CATALOGUE.buildings.PH_Lodge;
  const named: LayerKind[] = [
    { ...unnamed, features },
    { ...unnamed, river: true },
  ];
  for (const lodge of [unnamed, ...named]) {
    const buildings = { ...CATALOGUE.buildings, PH_Lodge: lodge };
    const city = changed({
      buildings,
      civilizations: {
        civilization: { ...CIVILIZATION, city: { ...CIVILIZATION.city, building: 'PH_Lodge' } },
      },
    });
    const camp = changed({ ...encamped({ building: 'PH_Lodge' }), buildings });

    for (const content of [city, camp]) {
      if (lodge === unnamed) expect(catalogued(content).version).toBe('fixture');
      else expect(() => catalogued(content)).toThrow(/^fixture: /);
    }
  }
});

test('a catalogue whose camp is a building it does not hold is refused', () => {
  const content = encamped({ building: 'PH_Fort' });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose site is a building it does not hold, or one naming a feature or the river, is refused, and the same building naming neither is not', () => {
  const { features, ...unnamed } = CATALOGUE.buildings.PH_Lodge;
  const lodged = (lodge: LayerKind): Catalogue =>
    changed({
      ...sited({ [SITE]: { ...SITES[SITE], building: 'PH_Lodge' } }),
      buildings: { ...CATALOGUE.buildings, PH_Lodge: lodge },
    });

  expect(() => catalogued(sited({ [SITE]: { ...SITES[SITE], building: 'PH_Fort' } }))).toThrow(
    'fixture: no building is named PH_Fort',
  );
  expect(() => catalogued(lodged({ ...unnamed, features }))).toThrow(
    `fixture: the age ${AGE}'s site ${SITE} PH_Lodge names the features ${features?.join(', ')}`,
  );
  expect(() => catalogued(lodged({ ...unnamed, river: true }))).toThrow(
    `fixture: the age ${AGE}'s site ${SITE} PH_Lodge names the river`,
  );
  expect(catalogued(lodged(unnamed)).version).toBe('fixture');
});

test('a catalogue whose site is its camp’s building or another site’s is refused', () => {
  const site = SITES[SITE];

  expect(() => catalogued(sited({ [SITE]: { ...site, building: CAMP.building } }))).toThrow(
    `fixture: the age ${AGE}'s camp and site ${SITE} are both the building ${CAMP.building}`,
  );
  expect(() => catalogued(sited({ ...SITES, PH_Twin: site }))).toThrow(
    `fixture: the age ${AGE}'s site ${SITE} and site PH_Twin are both the building ${site.building}`,
  );
});

test('a catalogue whose site deals a reward it does not hold, or no reward at all, is refused', () => {
  const site = SITES[SITE];

  expect(() =>
    catalogued(sited({ [SITE]: { ...site, rewards: [...site.rewards, 'PH_Loot'] } })),
  ).toThrow('fixture: no card is named PH_Loot');
  expect(() => catalogued(sited({ [SITE]: { ...site, rewards: [] } }))).toThrow(
    `fixture: the age ${AGE}'s site ${SITE} deals no reward`,
  );
});

test('a catalogue whose region deals a site its age does not own is refused', () => {
  const disc = REGIONS[REGION];
  const content = changed(regioned({ [REGION]: { ...disc, sites: [...disc.sites, 'PH_Barrow'] } }));

  expect(() => catalogued(content)).toThrow(
    `fixture: no site of the age ${AGE} is named PH_Barrow`,
  );
});

test('a catalogue whose region deals one site twice is refused', () => {
  const disc = REGIONS[REGION];
  const content = changed(regioned({ [REGION]: { ...disc, sites: [SITE, SITE] } }));

  expect(() => catalogued(content)).toThrow(
    `fixture: the region ${REGION} deals the site ${SITE} twice`,
  );
});

test('a catalogue whose deck holds a site’s reward, or whose technology unlocks one, is refused', () => {
  const [reward] = SITES[SITE].rewards;
  const decked = changed({
    civilizations: { civilization: { ...CIVILIZATION, cards: [...CIVILIZATION.cards, reward] } },
  });
  const unlocked = withTechnologies({
    [GRANARY]: { ...GRANARY_DECLARED, unlocks: { cards: { [reward]: 1 } } },
  });

  expect(() => catalogued(decked)).toThrow(
    `fixture: the civilization civilization holds the age ${AGE}'s site ${SITE}'s reward ${reward}`,
  );
  expect(() => catalogued(unlocked)).toThrow(
    `fixture: the technology ${GRANARY} unlocks the age ${AGE}'s site ${SITE}'s reward ${reward}`,
  );
});

test('a catalogue whose civilization’s city section names a building it does not hold, or a city that sees or opens with idle population below nought, is refused', () => {
  for (const off of [{ building: 'PH_Fort' }, { sight: -1 }, { idle: -1 }]) {
    const content = changed({
      civilizations: { civilization: { ...CIVILIZATION, city: { ...CIVILIZATION.city, ...off } } },
    });

    expect(() => catalogued(content)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose civilization’s city section holds a card of another kind than settle is refused', () => {
  const content = changed({
    civilizations: {
      civilization: { ...CIVILIZATION, city: { ...CIVILIZATION.city, card: 'PH_Harvest' } },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose deck names a card it does not hold is refused', () => {
  const content = changed({
    civilizations: {
      civilization: { ...CIVILIZATION, cards: [...CIVILIZATION.cards, 'PH_Scout'] },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose deck holds a hazard in either section is refused', () => {
  const cards = changed({
    civilizations: {
      civilization: { ...CIVILIZATION, cards: [...CIVILIZATION.cards, 'PH_Hunger'] },
    },
  });
  const settle = changed({
    civilizations: {
      civilization: { ...CIVILIZATION, settle: [...CIVILIZATION.settle, 'PH_Hunger'] },
    },
  });

  expect(() => catalogued(cards)).toThrow(/^fixture: /);
  expect(() => catalogued(settle)).toThrow(/^fixture: /);
});

test('a catalogue whose deck holds any of the camp’s rewards in either section is refused', () => {
  for (const reward of CAMP.rewards) {
    const cards = changed({
      civilizations: { civilization: { ...CIVILIZATION, cards: [...CIVILIZATION.cards, reward] } },
    });
    const settle = changed({
      civilizations: {
        civilization: { ...CIVILIZATION, settle: [...CIVILIZATION.settle, reward] },
      },
    });

    expect(() => catalogued(cards)).toThrow(/^fixture: /);
    expect(() => catalogued(settle)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose card no deck holds carries exhaust is refused, and one carrying banish is not', () => {
  const [reward] = CAMP.rewards;
  const carrying = (keyword: { exhaust: true } | { banish: true }): Catalogue =>
    changed({
      cards: {
        ...CATALOGUE.cards,
        [reward]: {
          kind: 'instant',
          cost: {},
          ...keyword,
          aim: 'none',
          effect: (_c, paid) => unchanged(paid),
        },
      },
    });

  expect(() => catalogued(carrying({ exhaust: true }))).toThrow(
    `fixture: the age ${AGE}'s camp's reward ${reward} carries exhaust`,
  );
  expect(() => catalogued(carrying({ banish: true }))).not.toThrow();
});

test('a catalogue whose card becomes one it does not hold is refused', () => {
  const content = changed({
    cards: {
      ...CATALOGUE.cards,
      PH_Flood: { ...cardOf(CATALOGUE, 'PH_Flood'), becomes: 'PH_Unheld' },
    },
  });

  expect(() => catalogued(content)).toThrow('fixture: no card is named PH_Unheld');
});

test('a catalogue whose action no unit’s action goes to, or whose instant a worker’s or any unit’s action goes to, is refused', () => {
  const misfits: Readonly<Record<string, Card>> = {
    PH_Idle: { kind: 'action', cost: {}, aim: 'none', effect: (_c, paid) => unchanged(paid) },
    PH_Dug: { kind: 'instant', cost: {}, ...placesImprovement('PH_Mine') },
    PH_Rowed: { kind: 'instant', cost: {}, ...embarks(0) },
  };
  for (const [id, card] of Object.entries(misfits)) {
    const content = changed({
      cards: { ...CATALOGUE.cards, [id]: card },
      cardAges: { ...CATALOGUE.cardAges, [id]: AGE },
    });

    expect(() => catalogued(content)).toThrow(new RegExp(`^fixture: the card ${id} is an `));
  }
});

test('a catalogue whose deck’s settle section holds a card of another kind is refused', () => {
  for (const settle of [['PH_Harvest'], ['PH_Settle', 'PH_Harvest'], ['PH_Settle', 'PH_Worker']]) {
    const content = changed({ civilizations: { civilization: { ...CIVILIZATION, settle } } });

    expect(() => catalogued(content)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose deck’s settle section is empty is built', () => {
  const content = changed({ civilizations: { civilization: { ...CIVILIZATION, settle: [] } } });

  expect(() => catalogued(content)).not.toThrow();
});

test('a catalogue whose deck holds a settle card among its cards is refused', () => {
  const content = changed({
    civilizations: {
      civilization: { ...CIVILIZATION, cards: [...CIVILIZATION.cards, 'PH_Settle'] },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose region’s camps keep within the centre part’s reach plus the first steps is refused, whatever the city sees', () => {
  const disc = REGIONS[REGION];
  const reach = disc.centre + FIRST_STEPS;
  const near = changed(regioned({ [REGION]: { ...disc, campFromCentre: reach } }));
  const far = changed({
    version: 'far',
    ...regioned({ [REGION]: { ...disc, campFromCentre: reach + 1 } }),
  });
  const sight = disc.campFromCentre - disc.centre;
  const seeing = changed({
    version: 'seeing',
    civilizations: { civilization: { ...CIVILIZATION, city: { ...CIVILIZATION.city, sight } } },
  });

  expect(() => catalogued(near)).toThrow(/^fixture: /);
  expect(catalogued(far)).toBe(far);
  expect(catalogued(seeing)).toBe(seeing);
});

test('a catalogue whose camp deals a reward it does not hold, or no reward at all, is refused', () => {
  const loot = encamped({ rewards: [...CAMP.rewards, 'PH_Loot'] });
  const none = encamped({ rewards: [] });

  expect(() => catalogued(loot)).toThrow(/^fixture: /);
  expect(() => catalogued(none)).toThrow(/^fixture: /);
});

test('a catalogue whose schedule deals an event of fewer than two answers is refused', () => {
  const { PH_Hardship } = CATALOGUE.events;
  const { PH_Raid } = PH_Hardship.answers;
  const content = changed({
    events: { ...CATALOGUE.events, PH_Hardship: { ...PH_Hardship, answers: { PH_Raid } } },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose two events deal the same answer is refused', () => {
  const { PH_Blight, PH_Hardship } = CATALOGUE.events;
  const content = changed({
    events: {
      ...CATALOGUE.events,
      PH_Blight: {
        ...PH_Blight,
        answers: { ...PH_Blight.answers, PH_Raid: PH_Hardship.answers.PH_Raid },
      },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose event deals no answer costing no stock is refused, an answer costing nought of a stock costing none and one whose cost reads the chronicle never counting', () => {
  const { PH_Blight } = CATALOGUE.events;
  const { PH_Endure, PH_Explosion } = PH_Blight.answers;
  const blighted = (endure: Answer['cost']): Catalogue =>
    changed({
      version: 'blighted',
      events: {
        ...CATALOGUE.events,
        PH_Blight: {
          ...PH_Blight,
          answers: { PH_Endure: { ...PH_Endure, cost: endure }, PH_Explosion },
        },
      },
    });

  expect(() => catalogued(blighted({ food: 1 }))).toThrow(/^blighted: /);
  expect(() => catalogued(blighted({ food: 0, money: 2 }))).toThrow(/^blighted: /);
  expect(catalogued(blighted({ food: 0, money: 0 })).version).toBe('blighted');
  expect(catalogued(blighted({})).version).toBe('blighted');
  expect(() => catalogued(blighted(() => ({})))).toThrow(/^blighted: /);
});

test('a catalogue whose schedule deals an event it does not hold is refused', () => {
  const { entries } = ageOf(CATALOGUE, AGE).schedule;

  expect(() => catalogued(rescheduled({ entries: { ...entries, PH_Plague: () => 1 } }))).toThrow(
    /^fixture: /,
  );
});

test('a catalogue whose schedule deals no event is refused', () => {
  expect(() => catalogued(rescheduled({ entries: {} }))).toThrow(/^fixture: /);
});

test('a catalogue whose schedule names a capstone it does not hold is refused', () => {
  const { capstone } = ageOf(CATALOGUE, AGE).schedule;
  const flood = rescheduled({ capstone: { ...capstone, id: 'PH_Flood' } });
  const event = rescheduled({ capstone: { ...capstone, id: 'PH_Hardship' } });

  expect(() => catalogued(flood)).toThrow(/^fixture: /);
  expect(() => catalogued(event)).toThrow(/^fixture: /);
});

test('a catalogue whose schedule rolls a span from below one, or to less than its least, is refused', () => {
  const { capstone } = ageOf(CATALOGUE, AGE).schedule;

  expect(() => catalogued(rescheduled({ spacing: [0, 7] }))).toThrow(/^fixture: /);
  expect(() => catalogued(rescheduled({ capstone: { ...capstone, window: [33, 27] } }))).toThrow(
    /^fixture: /,
  );
});

test('a timeline of an age the catalogue does not hold is refused', () => {
  expect(() => timelineOf(CATALOGUE, 'seasons', seedRng(1))).toThrow(/^fixture: /);
});

test('a catalogue that holds together builds', () => {
  const content = changed({ version: 'coherent' });

  expect(catalogued(content)).toBe(content);
});

test('a catalogue holding no age is refused', () => {
  expect(() => catalogued(changed({ ages: {} }))).toThrow(/^fixture: /);
});

test('a catalogue whose age holds no region is refused', () => {
  expect(() => catalogued(changed(regioned({})))).toThrow(/^fixture: /);
});

test('the merge refuses an id two ages bring to one table and an age two slices name, and holds the ages in the slices’ order', () => {
  const later: Slice = {
    id: 'PH_Later',
    owns: ageOf(CATALOGUE, AGE),
    brings: { cards: { PH_Harvest: cardOf(CATALOGUE, 'PH_Harvest') } },
  };
  const { version } = CATALOGUE;

  expect(() => merged(version, [...SLICES, later])).toThrow(/^fixture: /);
  expect(() => merged(version, [...SLICES, { ...later, id: AGE, brings: {} }])).toThrow(
    /^fixture: /,
  );
  expect(Object.keys(merged(version, SLICES).ages)).toEqual(SLICES.map(({ id }) => id));
});

test('a card is of the age whose slice brings it, a catalogue holding a card of no age it holds is refused when it is built, and a card it does not hold is refused its age', () => {
  const harvest = cardOf(CATALOGUE, 'PH_Harvest');
  const later = merged(
    CATALOGUE.version,
    SLICES.map((slice) =>
      slice.id === QUIET ? { ...slice, brings: { cards: { PH_Novel: harvest } } } : slice,
    ),
  );
  const unaged = changed({ cards: { ...CATALOGUE.cards, PH_Novel: harvest } });
  const unheld = changed({ cardAges: { ...CATALOGUE.cardAges, PH_Harvest: 'PH_Unheld' } });
  const stray = changed({ cardAges: { ...CATALOGUE.cardAges, PH_Novel: AGE } });

  expect(cardAge(later, 'PH_Harvest')).toBe(AGE);
  expect(cardAge(later, 'PH_Novel')).toBe(QUIET);
  expect(() => catalogued(unaged)).toThrow('fixture: the card PH_Novel is of no age');
  expect(() => catalogued(unheld)).toThrow('fixture: no age is named PH_Unheld');
  expect(() => catalogued(stray)).toThrow('fixture: no card is named PH_Novel');
  expect(() => cardAge(CATALOGUE, 'PH_Scout')).toThrow('fixture: no card is named PH_Scout');
});

test('a map of a region the age does not hold is refused', () => {
  expect(() => generateMap(CATALOGUE, ageOf(CATALOGUE, AGE), 'tundra', seedRng(1))).toThrow(
    /^fixture: /,
  );
});

test('the opening on a map whose centre part names a tile the map does not hold is refused', () => {
  const holed = field(2).filter((tile) => tileKey(tile) !== tileKey(CITY));
  const map = { tiles: holed, rivers: [], centre: [CITY] };

  expect(() => beginChronicle(CATALOGUE, AGE, 1, CIVILIZATION, map, NO_DEALS, [])).toThrow(
    /^fixture: /,
  );
});

test('a catalogue whose region’s rivers rise in a biome it does not hold is refused', () => {
  const disc = REGIONS[REGION];
  const content = changed(
    regioned({ [REGION]: { ...disc, rivers: { ...disc.rivers, source: 'glacier' } } }),
  );

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a chronicle begun on another version of the content is refused by apply', () => {
  const other = catalogued(changed({ version: 'other' }));
  const begun = launched(other, AGE, REGION, 1234, CIVILIZATION, []);

  expect(() => apply(CATALOGUE, begun, { type: 'end-turn' })).toThrow(/^fixture: /);
  expect(apply(other, begun, { type: 'end-turn' }).length).toBeGreaterThan(0);
});

test('a unit entering as a kind the catalogue does not hold is refused', () => {
  const city = cityOf(['urban']);

  expect(() =>
    entered(CATALOGUE, city, { type: 'PH_Scout', tile: { q: 0, r: 0 }, faction: 'player' }),
  ).toThrow(/^fixture: /);
});
