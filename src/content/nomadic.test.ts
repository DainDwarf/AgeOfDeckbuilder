import { expect, test } from 'vitest';
import { aimOf } from '../rules/cards';
import { capstoneOf, cardOf, catalogued, deckOf, eventOf } from '../rules/catalogue';
import { admitted, launched, refusalOf } from '../rules/chronicle';
import { settledLaunch } from '../rules/fixtures';
import { seedRng } from '../rules/rng';
import { answerCost, timelineOf } from '../rules/schedule';
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
  terrainName,
  unitName,
  victoryLine,
} from '../ui/text';
import { NOMADIC } from './nomadic';

const REGION = 'temperate';
const SCHEDULE = 'nomadic';

/** What `text` leaves on the screen where an entry marks a value its caller handed none for. */
const UNFILLED = 'undefined';

test('the Nomadic Age holds together', () => {
  expect(catalogued(NOMADIC)).toBe(NOMADIC);
});

test('every unit kind of the Nomadic Age has a name and a mark on the screen', () => {
  for (const id of Object.keys(NOMADIC.units)) {
    expect(unitName(id)).not.toContain(UNFILLED);
    expect(() => unitMarkOf(id)).not.toThrow();
  }
});

test('every terrain of the Nomadic Age has a name and a colour on the screen', () => {
  for (const id of Object.keys(NOMADIC.terrains)) {
    expect(terrainName(id)).not.toContain(UNFILLED);
    expect(() => terrainColourOf(id)).not.toThrow();
  }
});

test('every building of the Nomadic Age has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(NOMADIC.buildings)) {
    expect(buildingName(id)).not.toContain(UNFILLED);
    expect(() => buildingMarkOf(id)).not.toThrow();
    expect(() => buildingColourOf(id)).not.toThrow();
  }
});

test('every feature of the Nomadic Age has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(NOMADIC.features)) {
    expect(featureName(id)).not.toContain(UNFILLED);
    expect(() => featureMarkOf(id)).not.toThrow();
    expect(() => featureColourOf(id)).not.toThrow();
  }
});

test('every improvement of the Nomadic Age has a name and a mark on the screen', () => {
  for (const id of Object.keys(NOMADIC.improvements)) {
    expect(improvementName(id)).not.toContain(UNFILLED);
    expect(() => improvementMarkOf(id)).not.toThrow();
  }
});

test('every card of the Nomadic Age has a name and a rules entry on the screen', () => {
  for (const id of Object.keys(NOMADIC.cards)) {
    expect(cardName(id)).not.toContain(UNFILLED);
    expect(cardRules(id)).not.toContain(UNFILLED);
  }
});

test('every card of the Nomadic Age answers its refusal, and its admitted tiles, on a chronicle begun on each deck', () => {
  for (const deck of Object.keys(NOMADIC.decks)) {
    const chronicle = launched(NOMADIC, REGION, SCHEDULE, 1, deckOf(NOMADIC, deck));
    for (const id of Object.keys(NOMADIC.cards)) {
      expect(() => refusalOf(NOMADIC, chronicle, id)).not.toThrow();
      const card = aimOf(cardOf(NOMADIC, id));
      switch (card.aim) {
        case 'tile':
        case 'unit':
          expect(() => admitted(NOMADIC, chronicle, card)).not.toThrow();
          break;
        case 'none':
        case 'discard-pile':
          break;
      }
    }
  }
});

test('each deck of the Nomadic Age settles its city on the centre tile and reaches turn 1', () => {
  for (const deck of Object.keys(NOMADIC.decks)) {
    const chronicle = settledLaunch(NOMADIC, REGION, SCHEDULE, 1, deckOf(NOMADIC, deck));

    expect(chronicle.turn).toBe(1);
    expect(chronicle.city).toBeDefined();
  }
});

test('every event of the Nomadic Age has a name on the screen, and every answer it deals a name', () => {
  for (const [id, event] of Object.entries(NOMADIC.events)) {
    expect(eventName(id)).not.toContain(UNFILLED);
    for (const answer of Object.keys(event.answers)) {
      expect(answerName(answer)).not.toContain(UNFILLED);
    }
  }
});

test('every reward of the Nomadic Age’s camp has a name and a rules entry on the screen', () => {
  for (const id of NOMADIC.camp.rewards) {
    expect(cardName(id)).not.toContain(UNFILLED);
    expect(cardRules(id)).not.toContain(UNFILLED);
  }
});

test('every capstone of the Nomadic Age has a name, a rules entry and a victory line on the screen', () => {
  for (const id of Object.keys(NOMADIC.capstones)) {
    expect(capstoneName(id)).not.toContain(UNFILLED);
    expect(capstoneRules(id)).not.toContain(UNFILLED);
    expect(victoryLine(id)).not.toContain(UNFILLED);
  }
});

test('every schedule of the Nomadic Age rolls a timeline', () => {
  for (const id of Object.keys(NOMADIC.schedules)) {
    expect(() => timelineOf(NOMADIC, id, seedRng(1))).not.toThrow();
  }
});

test('every answer of every event of the Nomadic Age costs, lands and reads a rules entry on the numbers it reads, and every capstone lands, continues and is not passed, on a chronicle launched and settled on each schedule', () => {
  for (const schedule of Object.keys(NOMADIC.schedules)) {
    const deck = deckOf(NOMADIC, 'nomadic');
    const chronicle = settledLaunch(NOMADIC, REGION, schedule, 1, deck);
    for (const id of Object.keys(NOMADIC.events)) {
      expect(() => eventOf(NOMADIC, id).needs?.(NOMADIC, chronicle)).not.toThrow();
      for (const [name, answer] of Object.entries(eventOf(NOMADIC, id).answers)) {
        expect(() => answerCost(NOMADIC, chronicle, answer)).not.toThrow();
        expect(() => answer.reads(NOMADIC, chronicle)).not.toThrow();
        expect(answerRules(name, answer.reads(NOMADIC, chronicle))).not.toContain(UNFILLED);
        expect(() => answer.lands(NOMADIC, chronicle)).not.toThrow();
      }
    }
    for (const id of Object.keys(NOMADIC.capstones)) {
      const capstone = capstoneOf(NOMADIC, id);
      expect(() => capstone.lands(NOMADIC, chronicle)).not.toThrow();
      expect(() => capstone.continues?.(NOMADIC, chronicle)).not.toThrow();
      expect(capstone.passes(NOMADIC, chronicle)).toBe(false);
    }
  }
});
