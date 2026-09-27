import { expect, test } from 'vitest';
import { aimOf } from '../rules/cards';
import {
  ageOf,
  capstoneOf,
  cardMade,
  cardOf,
  catalogued,
  counterOf,
  deckOf,
  enemyScript,
  eventOf,
} from '../rules/catalogue';
import { admitted, launched, refusalOf } from '../rules/chronicle';
import { settledLaunch } from '../rules/fixtures';
import { seedRng } from '../rules/rng';
import { answerCost, timelineOf } from '../rules/schedule';
import type { Chronicle } from '../rules/state';
import { campLore, capstoneLore, eventLore } from '../ui/lore';
import {
  buildingColourOf,
  buildingMarkOf,
  featureColourOf,
  featureMarkOf,
  improvementMarkOf,
  terrainColourOf,
  unitMarkOf,
} from '../ui/marks';
import {
  answerName,
  answerRules,
  buildingName,
  capstoneName,
  capstoneRules,
  cardName,
  cardRules,
  eventName,
  featureName,
  improvementName,
  referenceName,
  terrainName,
  unitName,
  victoryLine,
} from '../ui/text';
import { layOutRun, type Reference, type ReferenceKind } from '../ui/text-run';
import { CATALOGUE } from './catalogue';

const AGES = Object.keys(CATALOGUE.ages);

const [DECK] = Object.keys(CATALOGUE.decks);

/** The first region the age lists. */
function regionIn(age: string): string {
  const [region] = Object.keys(ageOf(CATALOGUE, age).regions);
  return region;
}

/** A chronicle launched and settled in the age, on its first region and the catalogue's first deck. */
function settledIn(age: string): Chronicle {
  return settledLaunch(CATALOGUE, age, regionIn(age), 1, deckOf(CATALOGUE, DECK), []);
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

test('every card of the catalogue has a name, and a rules entry read at the counters it starts with, on the screen', () => {
  for (const id of Object.keys(CATALOGUE.cards)) {
    expect(() => cardName(id)).not.toThrow();
    expect(() => cardRules(cardMade(CATALOGUE, id))).not.toThrow();
  }
});

test('every rules entry of the catalogue lays out, and every name on it resolves in the catalogue’s table of its kind', () => {
  const entries = [
    ...Object.keys(CATALOGUE.cards).map((id) => cardRules(cardMade(CATALOGUE, id))),
    ...Object.keys(CATALOGUE.capstones).map((id) => capstoneRules(id)),
  ];
  for (const age of AGES) {
    const chronicle = settledIn(age);
    for (const event of Object.keys(ageOf(CATALOGUE, age).schedule.entries)) {
      for (const [name, answer] of Object.entries(eventOf(CATALOGUE, event).answers)) {
        entries.push(answerRules(name, answer.reads(CATALOGUE, chronicle)));
      }
    }
  }
  for (const entry of entries) {
    for (const { kind, id } of namedIn(entry)) expect(tableOf(kind)).toContain(id);
  }
});

test('every card of the catalogue answers its refusal, and its admitted tiles, on a chronicle begun in each age on each deck', () => {
  for (const age of AGES) {
    for (const deck of Object.keys(CATALOGUE.decks)) {
      const chronicle = launched(CATALOGUE, age, regionIn(age), 1, deckOf(CATALOGUE, deck), []);
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
            break;
        }
      }
    }
  }
});

test('each deck of the catalogue settles its city on the centre tile and reaches turn 1 in each age', () => {
  for (const age of AGES) {
    for (const deck of Object.keys(CATALOGUE.decks)) {
      const chronicle = settledLaunch(
        CATALOGUE,
        age,
        regionIn(age),
        1,
        deckOf(CATALOGUE, deck),
        [],
      );

      expect(chronicle.turn).toBe(1);
      expect(chronicle.city).toBeDefined();
    }
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

test('every age’s camp has a lore on the screen, keyed on its building', () => {
  for (const age of AGES) {
    expect(() => campLore(ageOf(CATALOGUE, age).camp.building)).not.toThrow();
  }
});

test('every reward of every age’s camp has a name, and a rules entry read at the counters it starts with, on the screen', () => {
  for (const age of AGES) {
    for (const id of ageOf(CATALOGUE, age).camp.rewards) {
      expect(() => cardName(id)).not.toThrow();
      expect(() => cardRules(cardMade(CATALOGUE, id))).not.toThrow();
    }
  }
});

test('every capstone of the catalogue has a name, a rules entry, a lore at each raising of its window and a victory line on the screen', () => {
  for (const id of Object.keys(CATALOGUE.capstones)) {
    expect(() => capstoneName(id)).not.toThrow();
    expect(() => capstoneRules(id)).not.toThrow();
    expect(() => capstoneLore(id, 'opening')).not.toThrow();
    expect(() => capstoneLore(id, 'landing')).not.toThrow();
    expect(() => victoryLine(id)).not.toThrow();
  }
});

test('every enemy script of the catalogue answers its move and its attack for an enemy standing on a chronicle launched and settled in each age', () => {
  for (const age of AGES) {
    const chronicle = settledIn(age);
    const enemy = chronicle.units.find((unit) => unit.faction === 'enemy');
    if (enemy === undefined) throw new Error(`no enemy stands on the chronicle of ${age}`);
    for (const id of Object.keys(CATALOGUE.scripts)) {
      const script = enemyScript(CATALOGUE, id);
      expect(() => script.moveTo(CATALOGUE, chronicle, enemy)).not.toThrow();
      expect(() => script.attacks(CATALOGUE, chronicle, enemy)).not.toThrow();
    }
  }
});

test('every age’s schedule rolls a timeline', () => {
  for (const age of AGES) {
    expect(() => timelineOf(CATALOGUE, age, seedRng(1))).not.toThrow();
  }
});

test('every answer of every event of an age’s schedule costs, lands and reads a rules entry on the numbers it reads, and the age’s capstone lands, continues and is not passed, on a chronicle launched and settled in that age', () => {
  for (const age of AGES) {
    const { schedule } = ageOf(CATALOGUE, age);
    const chronicle = settledIn(age);
    for (const id of Object.keys(schedule.entries)) {
      expect(() => eventOf(CATALOGUE, id).needs?.(CATALOGUE, chronicle)).not.toThrow();
      for (const [name, answer] of Object.entries(eventOf(CATALOGUE, id).answers)) {
        expect(() => answerCost(CATALOGUE, chronicle, answer)).not.toThrow();
        expect(() => answer.reads(CATALOGUE, chronicle)).not.toThrow();
        expect(() => answerRules(name, answer.reads(CATALOGUE, chronicle))).not.toThrow();
        expect(() => answer.lands(CATALOGUE, chronicle)).not.toThrow();
      }
    }
    const capstone = capstoneOf(CATALOGUE, schedule.capstone.id);
    expect(() => capstone.lands(CATALOGUE, chronicle)).not.toThrow();
    expect(() => capstone.continues?.(CATALOGUE, chronicle)).not.toThrow();
    expect(capstone.passes(CATALOGUE, chronicle)).toBe(false);
  }
});

test('every achievement of an age answers its count as an integer, on a chronicle launched and settled in that age', () => {
  for (const age of AGES) {
    const chronicle = settledIn(age);
    for (const achievement of Object.values(ageOf(CATALOGUE, age).achievements)) {
      expect(Number.isInteger(achievement.count(CATALOGUE, chronicle))).toBe(true);
    }
  }
});

test('every hazard of the catalogue strikes at the counters it starts with, on a chronicle launched and settled in each age', () => {
  for (const age of AGES) {
    const chronicle = settledIn(age);
    for (const id of Object.keys(CATALOGUE.cards)) {
      const card = cardOf(CATALOGUE, id);
      if (card.kind === 'hazard') {
        const counter = counterOf(CATALOGUE, cardMade(CATALOGUE, id));
        expect(() => card.strikes(CATALOGUE, chronicle, counter)).not.toThrow();
      }
    }
  }
});
