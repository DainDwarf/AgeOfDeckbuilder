import { expect, test } from 'vitest';
import { newCampaign } from '../rules/campaign';
import { aimOf, playedThrough, struck } from '../rules/cards';
import {
  ageOf,
  capstoneOf,
  cardMade,
  cardOf,
  catalogued,
  civilizationOf,
  eventOf,
  firstCivilization,
  firstRegion,
  type Neutral,
  strikeOf,
  unitCardOf,
  unitScript,
  workerAim,
} from '../rules/catalogue';
import { admitted, apply, launched, refusalOf } from '../rules/chronicle';
import { claimable } from '../rules/city';
import { settledLaunch } from '../rules/fixtures';
import { tileAt, tileKey, tilesBeside } from '../rules/map';
import { biomeKind } from '../rules/map-kinds';
import { seedRng } from '../rules/rng';
import { writeSave } from '../rules/save';
import {
  answerCost,
  answerOf,
  answerRefusal,
  capstoneReading,
  timelineOf,
} from '../rules/schedule';
import type { Landed } from '../rules/stages';
import type { Chronicle, Rewards } from '../rules/state';
import { yieldParts } from '../rules/yields';
import { answerFace, answerFaceOfCase } from '../ui/face';
import { clustersOf } from '../ui/launch-layout';
import { capstoneLore, captureLore, eventLore } from '../ui/lore';
import {
  buildingColourOf,
  buildingMarkOf,
  featureColourOf,
  featureMarkOf,
  groundColourOf,
  improvementMarkOf,
  terrainColourOf,
  unitMarkOf,
} from '../ui/marks';
import {
  achievementGoal,
  ageName,
  answerName,
  buildingName,
  capstoneName,
  capstoneRules,
  cardName,
  cardRules,
  civilizationName,
  defeatLine,
  eventName,
  featureName,
  improvementName,
  referenceName,
  regionName,
  technologyName,
  terrainName,
  unitName,
  victoryLine,
} from '../ui/text';
import { layOutRun, type Reference, type ReferenceKind } from '../ui/text-run';
import { CATALOGUE } from './catalogue';

const AGES = Object.keys(CATALOGUE.ages);

/** A chronicle launched and settled in the age, on its first region and the catalogue's first civilization. */
function settledIn(age: string): Chronicle {
  const civilization = civilizationOf(CATALOGUE, firstCivilization(CATALOGUE));
  return settledLaunch(CATALOGUE, age, firstRegion(CATALOGUE, age), 1, civilization, []);
}

/** What a rules entry names, laid out as a run on a measure of one to the character. */
function namedIn(entry: string): Reference[] {
  const measure = (content: string): number => content.length;
  const metrics = { width: 24, glyph: 1, bearing: 0, space: 1 };
  return layOutRun(entry, measure, metrics, referenceName).names.map((name) => name.reference);
}

/** The ids of the table a name of that kind resolves in. */
function tableOf(kind: ReferenceKind): string[] {
  switch (kind) {
    case 'card':
      return Object.keys(CATALOGUE.cards);
    case 'terrain':
      return Object.keys(CATALOGUE.terrains);
    case 'feature':
      return Object.keys(CATALOGUE.features);
    case 'improvement':
      return Object.keys(CATALOGUE.improvements);
    case 'building':
      return Object.keys(CATALOGUE.buildings);
    case 'player':
    case 'enemy':
      return Object.keys(CATALOGUE.units);
  }
}

test('the catalogue holds together', () => {
  expect(catalogued(CATALOGUE)).toBe(CATALOGUE);
});

test('every unit kind of the catalogue has a name and a mark on the screen', () => {
  for (const id of Object.keys(CATALOGUE.units)) {
    expect(() => unitName(id)).not.toThrow();
    expect(() => unitMarkOf(id)).not.toThrow();
  }
});

test('every terrain of the catalogue has a name and a colour on the screen', () => {
  for (const id of Object.keys(CATALOGUE.terrains)) {
    expect(() => terrainName(id)).not.toThrow();
    expect(() => terrainColourOf(id)).not.toThrow();
  }
});

test('every building of the catalogue has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(CATALOGUE.buildings)) {
    expect(() => buildingName(id)).not.toThrow();
    expect(() => buildingMarkOf(id)).not.toThrow();
    expect(() => buildingColourOf(id)).not.toThrow();
  }
});

test('every feature of the catalogue has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(CATALOGUE.features)) {
    expect(() => featureName(id)).not.toThrow();
    expect(() => featureMarkOf(id)).not.toThrow();
    expect(() => featureColourOf(id)).not.toThrow();
  }
});

test('every improvement of the catalogue has a name and a mark on the screen', () => {
  for (const id of Object.keys(CATALOGUE.improvements)) {
    expect(() => improvementName(id)).not.toThrow();
    expect(() => improvementMarkOf(id)).not.toThrow();
  }
});

/** Every city's building a card is drawn under: each civilization's, and each a technology unlocks. */
const CITIES = [
  ...Object.values(CATALOGUE.civilizations).map(({ city }) => city.building),
  ...Object.values(CATALOGUE.technologies).flatMap(({ unlocks }) =>
    unlocks.city === undefined ? [] : [unlocks.city.building],
  ),
];

/** The cards a civilization's city section holds, which a screen draws under a city section alone. */
const CITY_CARDS = new Set(Object.values(CATALOGUE.civilizations).map(({ city }) => city.card));

/**
 * A card's rules entry read at the counters it starts with, under each city's building, and under no
 * city section for a card no city section holds.
 */
function rulesAsDrawn(id: string): string[] {
  const cities = CITY_CARDS.has(id) ? CITIES : [...CITIES, undefined];
  return cities.map((city) => cardRules(cardMade(CATALOGUE, id), city));
}

test('every card of the catalogue has a name, and a rules entry read at the counters it starts with under each city’s building, and under no city section for a card no city section holds, on the screen', () => {
  for (const id of Object.keys(CATALOGUE.cards)) {
    expect(() => cardName(id)).not.toThrow();
    expect(() => rulesAsDrawn(id)).not.toThrow();
  }
});

/**
 * Every rules entry an answer's face reads on the chronicle: the entry of each case it declares, or
 * its one entry where it declares none.
 */
function answerEntries(chronicle: Chronicle, event: string, answer: string): string[] {
  const { cases } = answerOf(CATALOGUE, event, answer);
  const named = cases === undefined ? [undefined] : cases.declared;
  return named.map((which) => answerFaceOfCase(CATALOGUE, chronicle, event, answer, which).rules);
}

test('every rules entry and every goal of the catalogue lays out, and every name on it resolves in the catalogue’s table of its kind', () => {
  const entries = Object.keys(CATALOGUE.cards).flatMap(rulesAsDrawn);
  for (const age of AGES) {
    entries.push(
      ...Object.entries(ageOf(CATALOGUE, age).achievements).map(([id, { need }]) =>
        achievementGoal(id, need),
      ),
    );
    const chronicle = settledIn(age);
    for (const { schedule } of Object.values(ageOf(CATALOGUE, age).regions)) {
      for (const event of Object.keys(schedule.entries)) {
        for (const name of Object.keys(eventOf(CATALOGUE, event).answers)) {
          entries.push(...answerEntries(chronicle, event, name));
        }
      }
    }
    for (const id of Object.keys(CATALOGUE.capstones)) {
      entries.push(capstoneRules(id, capstoneReading(CATALOGUE, chronicle, id)));
    }
  }
  for (const entry of entries) {
    for (const { kind, id } of namedIn(entry)) expect(tableOf(kind)).toContain(id);
  }
});

test('every card of the catalogue answers its refusal, and its admitted tiles, on a chronicle begun in each age on each civilization', () => {
  for (const age of AGES) {
    for (const civilization of Object.keys(CATALOGUE.civilizations)) {
      const region = firstRegion(CATALOGUE, age);
      const chronicle = launched(
        CATALOGUE,
        age,
        region,
        1,
        civilizationOf(CATALOGUE, civilization),
        [],
      ).chronicle;
      for (const id of Object.keys(CATALOGUE.cards)) {
        expect(() => refusalOf(CATALOGUE, chronicle, id)).not.toThrow();
        const card = aimOf(cardOf(CATALOGUE, id));
        switch (card.aim) {
          case 'tile':
          case 'unit':
            expect(() => admitted(CATALOGUE, chronicle, card)).not.toThrow();
            break;
          case 'none':
          case 'discard-pile':
          case 'hand':
            break;
        }
      }
    }
  }
});

/**
 * What a card's effect lands on the chronicle at its cheapest answer: at nothing where nothing blocks
 * it, at the first tile its aim admits, at the first card of the pile it is aimed at; and nothing at
 * all where the rules leave it nothing to land on.
 */
function cheapestEffect(chronicle: Chronicle, id: string): Landed | undefined {
  const card = aimOf(cardOf(CATALOGUE, id));
  switch (card.aim) {
    case 'none':
      return refusalOf(CATALOGUE, chronicle, id).blocked.length === 0
        ? card.effect(CATALOGUE, chronicle)
        : undefined;
    case 'tile':
    case 'unit': {
      const [at] = admitted(CATALOGUE, chronicle, card);
      const tile = at === undefined ? undefined : tileAt(chronicle.tiles, at);
      if (at === undefined || tile === undefined) return undefined;
      if (card.aim === 'unit' || card.through === undefined) {
        return card.effect(CATALOGUE, chronicle, at);
      }
      const [through] = playedThrough(CATALOGUE, chronicle, card, tile);
      return through === undefined
        ? undefined
        : card.effect(CATALOGUE, chronicle, at, through.tile);
    }
    case 'discard-pile':
      return chronicle.discardPile.length === 0 ? undefined : card.effect(CATALOGUE, chronicle, 0);
    case 'hand':
      return chronicle.hand.length <= 1 ? undefined : card.effect(CATALOGUE, chronicle, 0);
  }
}

test('every card of the catalogue lands its effect at its cheapest answer, on a chronicle begun and on one settled in each age on each civilization', () => {
  for (const age of AGES) {
    for (const civilization of Object.keys(CATALOGUE.civilizations)) {
      const region = firstRegion(CATALOGUE, age);
      const civilized = civilizationOf(CATALOGUE, civilization);
      const chronicles = [
        launched(CATALOGUE, age, region, 1, civilized, []).chronicle,
        settledLaunch(CATALOGUE, age, region, 1, civilized, []),
      ];
      for (const chronicle of chronicles) {
        for (const id of Object.keys(CATALOGUE.cards)) {
          expect(() => cheapestEffect(chronicle, id)).not.toThrow();
        }
      }
    }
  }
});

test('each civilization of the catalogue settles its city on the centre tile and reaches turn 1 in each age', () => {
  for (const age of AGES) {
    for (const civilization of Object.keys(CATALOGUE.civilizations)) {
      const chronicle = settledLaunch(
        CATALOGUE,
        age,
        firstRegion(CATALOGUE, age),
        1,
        civilizationOf(CATALOGUE, civilization),
        [],
      );

      expect(chronicle.turn).toBe(1);
      expect(chronicle.city).toBeDefined();
    }
  }
});

test('a new campaign opens on each civilization of the catalogue, and its save reads back whole', () => {
  for (const civilization of Object.keys(CATALOGUE.civilizations)) {
    expect(() => writeSave(CATALOGUE, newCampaign(CATALOGUE, civilization))).not.toThrow();
  }
});

test('every event of the catalogue has a name and a lore on the screen, and every answer it deals a name', () => {
  for (const [id, event] of Object.entries(CATALOGUE.events)) {
    expect(() => eventName(id)).not.toThrow();
    expect(() => eventLore(id)).not.toThrow();
    for (const answer of Object.keys(event.answers)) {
      expect(() => answerName(answer)).not.toThrow();
    }
  }
});

/** What an age's captures take, its neutral's city among them, each a building and its rewards. */
function capturedIn(age: string): { building: string; rewards: Rewards }[] {
  const { camp, sites, neutral } = ageOf(CATALOGUE, age);
  return [camp, ...Object.values(sites), ...(neutral === undefined ? [] : [neutral])];
}

test('every age’s camp, site and neutral’s city has a lore on the screen, keyed on its building', () => {
  for (const age of AGES) {
    for (const { building } of capturedIn(age)) {
      expect(() => captureLore(building)).not.toThrow();
    }
  }
});

test('every reward of every age’s camp, site and neutral’s city has a name, and a rules entry read at the counters it starts with under each city’s building, and under no city section for a card no city section holds, on the screen', () => {
  for (const age of AGES) {
    for (const { rewards } of capturedIn(age)) {
      for (const id of Object.keys(rewards)) {
        expect(() => cardName(id)).not.toThrow();
        expect(() => rulesAsDrawn(id)).not.toThrow();
      }
    }
  }
});

test('every capstone of the catalogue has a name, a rules entry read on the numbers it reads of a chronicle launched and settled in each age, a lore at each raising of its window, a victory line and, naming what fails it, a defeat line on the screen', () => {
  const chronicles = AGES.map(settledIn);
  for (const [id, { fails }] of Object.entries(CATALOGUE.capstones)) {
    expect(() => capstoneName(id)).not.toThrow();
    for (const chronicle of chronicles) {
      expect(() => capstoneRules(id, capstoneReading(CATALOGUE, chronicle, id))).not.toThrow();
    }
    expect(() => capstoneLore(id, 'opening')).not.toThrow();
    expect(() => capstoneLore(id, 'landing')).not.toThrow();
    expect(() => victoryLine(id)).not.toThrow();
    if (fails !== undefined) expect(() => defeatLine(id, 1)).not.toThrow();
  }
});

test('every unit script of the catalogue answers its move and its act for an enemy standing on a chronicle launched and settled in each age', () => {
  for (const age of AGES) {
    const chronicle = settledIn(age);
    const enemy = chronicle.units.find((unit) => unit.faction === 'enemy');
    if (enemy === undefined) throw new Error(`no enemy stands on the chronicle of ${age}`);
    for (const id of Object.keys(CATALOGUE.scripts)) {
      const script = unitScript(CATALOGUE, id);
      expect(() => script.moveTo(CATALOGUE, chronicle, enemy)).not.toThrow();
      expect(() => script.acts(CATALOGUE, chronicle, enemy)).not.toThrow();
    }
  }
});

/**
 * Every age naming a neutral, with it and a chronicle launched and settled in the age on its first
 * region dealing the neutral, on the catalogue's first civilization.
 */
function neutralAges(): { neutral: Neutral; chronicle: Chronicle }[] {
  const civilization = civilizationOf(CATALOGUE, firstCivilization(CATALOGUE));
  return AGES.flatMap((age) => {
    const { neutral, regions } = ageOf(CATALOGUE, age);
    if (neutral === undefined) return [];
    const region = Object.keys(regions).find((id) => regions[id].neutralFromCentre !== undefined);
    if (region === undefined) throw new Error(`no region of the age ${age} deals its neutral`);
    return [{ neutral, chronicle: settledLaunch(CATALOGUE, age, region, 1, civilization, []) }];
  });
}

test('every age’s neutral’s script answers a claim among the tiles its city may claim, and the tiles its population works among those its city holds, on a chronicle launched and settled in that age, on a region dealing it', () => {
  for (const { neutral, chronicle } of neutralAges()) {
    const offered = claimable(CATALOGUE, chronicle, 'neutral');
    const held = chronicle.neutral?.held ?? [];

    expect(offered).not.toEqual([]);
    expect(offered.map(tileKey)).toContain(
      tileKey(neutral.script.claims(CATALOGUE, chronicle, offered)),
    );
    for (const tile of neutral.script.assigns(CATALOGUE, chronicle, held)) {
      expect(held.map(tileKey)).toContain(tileKey(tile));
    }
  }
});

test('every age’s neutral’s script enters through a card of its ratio or none, every card of its ratio answers its block for the neutral and its effect enters a unit of the neutral’s of the kind its row names, and its guard’s and its wave’s scripts answer the move and the act of that unit, on a chronicle launched and settled in that age, on a region dealing it', () => {
  for (const { neutral, chronicle } of neutralAges()) {
    const named = neutral.script.enters(CATALOGUE, chronicle, neutral.ratio);
    if (named !== undefined) expect(neutral.ratio.map(({ card }) => card)).toContain(named);
    for (const { card, kind } of neutral.ratio) {
      const entry = unitCardOf(CATALOGUE, card);
      expect(() => entry.blocked(CATALOGUE, chronicle, 'neutral')).not.toThrow();
      const standing = entry.effect(CATALOGUE, chronicle, 'neutral').chronicle;
      const unit = standing.units.at(-1);
      expect(unit).toMatchObject({ faction: 'neutral', stats: { type: kind } });
      if (unit === undefined) throw new Error(`the card ${card} entered no unit`);
      for (const id of Object.values(neutral.scripts)) {
        const script = unitScript(CATALOGUE, id);
        expect(() => script.moveTo(CATALOGUE, standing, unit)).not.toThrow();
        expect(() => script.acts(CATALOGUE, standing, unit)).not.toThrow();
      }
    }
  }
});

test('every age’s neutral naming workers opens with one on its city’s tile, whose script answers its move and its act, and every card its workers play answers its refusal for the neutral on every tile its city holds and lands its effect through that worker, on a chronicle launched and settled in that age, on a region dealing it', () => {
  for (const { neutral, chronicle } of neutralAges()) {
    const { workers } = neutral;
    if (workers === undefined) continue;
    const city = chronicle.neutral;
    if (city === undefined) throw new Error('the chronicle holds no neutral');
    const worker = chronicle.units.find(
      (unit) =>
        unit.faction === 'neutral' &&
        unit.stats.worker &&
        tileKey(unit.tile) === tileKey(city.city),
    );
    if (worker === undefined)
      throw new Error('the neutral opens with no worker on its city’s tile');
    const script = unitScript(CATALOGUE, workers.script);
    expect(() => script.moveTo(CATALOGUE, chronicle, worker)).not.toThrow();
    expect(() => script.acts(CATALOGUE, chronicle, worker)).not.toThrow();
    for (const id of workers.cards) {
      const aim = workerAim(cardOf(CATALOGUE, id));
      if (aim === undefined) throw new Error(`the neutral’s workers play ${id}, no worker’s card`);
      for (const at of city.held) {
        const tile = tileAt(chronicle.tiles, at);
        if (tile === undefined) throw new Error(`the neutral holds ${tileKey(at)}, off the map`);
        expect(() => aim.refuses(CATALOGUE, chronicle, tile, 'neutral')).not.toThrow();
      }
      expect(() => aim.effect(CATALOGUE, chronicle, worker.tile)).not.toThrow();
    }
  }
});

test('every region’s schedule rolls a timeline', () => {
  for (const age of AGES) {
    for (const region of Object.keys(ageOf(CATALOGUE, age).regions)) {
      expect(() => timelineOf(CATALOGUE, age, region, seedRng(1))).not.toThrow();
    }
  }
});

test('every answer of every event of a region’s schedule costs, answers what blocks it, lands and reads a rules entry on the numbers it reads, of the case it names and of every case it declares, and every capstone of its schedule lands, continues, answers its rule over every part of every tile’s yield and is neither passed nor failed, on a chronicle launched and settled in that region’s age', () => {
  for (const age of AGES) {
    const chronicle = settledIn(age);
    const beside = tilesBeside(chronicle.tiles);
    const parts = chronicle.tiles.flatMap((tile) => yieldParts(CATALOGUE, chronicle, tile, beside));
    for (const { schedule } of Object.values(ageOf(CATALOGUE, age).regions)) {
      for (const id of Object.keys(schedule.entries)) {
        for (const [name, answer] of Object.entries(eventOf(CATALOGUE, id).answers)) {
          expect(() => answerCost(CATALOGUE, chronicle, answer)).not.toThrow();
          expect(() => answerRefusal(CATALOGUE, chronicle, id, name)).not.toThrow();
          expect(() => answer.reads(CATALOGUE, chronicle)).not.toThrow();
          expect(() => answerFace(CATALOGUE, chronicle, id, name)).not.toThrow();
          expect(() => answerEntries(chronicle, id, name)).not.toThrow();
          expect(() => answer.lands(CATALOGUE, chronicle)).not.toThrow();
        }
      }
      for (const id of schedule.capstones) {
        const capstone = capstoneOf(CATALOGUE, id);
        expect(() => capstone.lands(CATALOGUE, chronicle)).not.toThrow();
        expect(() => capstone.continues?.(CATALOGUE, chronicle)).not.toThrow();
        for (const part of parts) expect(() => capstone.yieldRule?.(part)).not.toThrow();
        expect(capstone.passes(CATALOGUE, chronicle)).toBe(false);
        expect(capstone.fails?.(CATALOGUE, chronicle, chronicle) ?? false).toBe(false);
      }
    }
  }
});

test('every age of the catalogue has a name and a ground colour on the screen, every achievement it owns a goal, and every technology a name', () => {
  for (const age of AGES) {
    expect(() => ageName(age)).not.toThrow();
    expect(() => groundColourOf(age)).not.toThrow();
    for (const [id, { need }] of Object.entries(ageOf(CATALOGUE, age).achievements)) {
      expect(() => achievementGoal(id, need)).not.toThrow();
    }
  }
  for (const id of Object.keys(CATALOGUE.technologies)) {
    expect(() => technologyName(id)).not.toThrow();
  }
});

test('every region of every age has a name on the screen, and a colour for its middle hexagon and each around it', () => {
  const campaign = newCampaign(CATALOGUE, firstCivilization(CATALOGUE));
  for (const age of AGES) {
    for (const { region, biomes } of clustersOf(CATALOGUE, campaign, age)) {
      expect(() => regionName(region)).not.toThrow();
      for (const biome of biomes) {
        expect(() => terrainColourOf(biomeKind(CATALOGUE, biome).origin)).not.toThrow();
      }
    }
  }
});

test('every civilization of the catalogue has a name on the screen', () => {
  for (const id of Object.keys(CATALOGUE.civilizations)) {
    expect(() => civilizationName(id)).not.toThrow();
  }
});

test('every achievement of an age answers the tally a turn ended leaves it and its count on that tally as integers, on a chronicle launched and settled in that age', () => {
  for (const age of AGES) {
    const chronicle = settledIn(age);
    const stages = apply(CATALOGUE, chronicle, { type: 'end-turn' });
    for (const achievement of Object.values(ageOf(CATALOGUE, age).achievements)) {
      const tally = achievement.tallies?.(CATALOGUE, chronicle, stages, {}) ?? {};
      for (const value of Object.values(tally)) expect(Number.isInteger(value)).toBe(true);
      expect(Number.isInteger(achievement.count(CATALOGUE, chronicle, tally))).toBe(true);
    }
  }
});

test('every card of the catalogue carrying a strike strikes at the counters it starts with, held alone in the hand of a chronicle launched and settled in each age', () => {
  for (const age of AGES) {
    const chronicle = settledIn(age);
    for (const id of Object.keys(CATALOGUE.cards)) {
      if (strikeOf(cardOf(CATALOGUE, id)) === undefined) continue;
      const holding = { ...chronicle, hand: [cardMade(CATALOGUE, id)] };
      expect(() => struck(CATALOGUE, holding)).not.toThrow();
    }
  }
});
