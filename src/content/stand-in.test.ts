import { expect, test } from 'vitest';
import { aimOf } from '../rules/cards';
import {
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
import { STAND_IN, STAND_IN_REGION, STAND_IN_SCHEDULE } from './stand-in';

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
      return Object.keys(STAND_IN.cards);
    case 'terrain':
      return Object.keys(STAND_IN.terrains);
    case 'feature':
      return Object.keys(STAND_IN.features);
    case 'improvement':
      return Object.keys(STAND_IN.improvements);
    case 'building':
      return Object.keys(STAND_IN.buildings);
    case 'player':
    case 'enemy':
      return Object.keys(STAND_IN.units);
  }
}

test('the stand-in holds together', () => {
  expect(catalogued(STAND_IN)).toBe(STAND_IN);
});

test('every unit kind of the stand-in has a name and a mark on the screen', () => {
  for (const id of Object.keys(STAND_IN.units)) {
    expect(() => unitName(id)).not.toThrow();
    expect(() => unitMarkOf(id)).not.toThrow();
  }
});

test('every terrain of the stand-in has a name and a colour on the screen', () => {
  for (const id of Object.keys(STAND_IN.terrains)) {
    expect(() => terrainName(id)).not.toThrow();
    expect(() => terrainColourOf(id)).not.toThrow();
  }
});

test('every building of the stand-in has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(STAND_IN.buildings)) {
    expect(() => buildingName(id)).not.toThrow();
    expect(() => buildingMarkOf(id)).not.toThrow();
    expect(() => buildingColourOf(id)).not.toThrow();
  }
});

test('every feature of the stand-in has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(STAND_IN.features)) {
    expect(() => featureName(id)).not.toThrow();
    expect(() => featureMarkOf(id)).not.toThrow();
    expect(() => featureColourOf(id)).not.toThrow();
  }
});

test('every improvement of the stand-in has a name and a mark on the screen', () => {
  for (const id of Object.keys(STAND_IN.improvements)) {
    expect(() => improvementName(id)).not.toThrow();
    expect(() => improvementMarkOf(id)).not.toThrow();
  }
});

test('every card of the stand-in has a name, and a rules entry read at the counters it starts with, on the screen', () => {
  for (const id of Object.keys(STAND_IN.cards)) {
    expect(() => cardName(id)).not.toThrow();
    expect(() => cardRules(cardMade(STAND_IN, id))).not.toThrow();
  }
});

test('every rules entry of the stand-in lays out, and every name on it resolves in the stand-in’s table of its kind', () => {
  const entries = [
    ...Object.keys(STAND_IN.cards).map((id) => cardRules(cardMade(STAND_IN, id))),
    ...Object.keys(STAND_IN.capstones).map((id) => capstoneRules(id)),
  ];
  for (const schedule of Object.keys(STAND_IN.schedules)) {
    const deck = deckOf(STAND_IN, 'PH_Deck');
    const chronicle = settledLaunch(STAND_IN, STAND_IN_REGION, schedule, 1, deck);
    for (const event of Object.values(STAND_IN.events)) {
      for (const [name, answer] of Object.entries(event.answers)) {
        entries.push(answerRules(name, answer.reads(STAND_IN, chronicle)));
      }
    }
  }
  for (const entry of entries) {
    for (const { kind, id } of namedIn(entry)) expect(tableOf(kind)).toContain(id);
  }
});

test('every card of the stand-in answers its refusal, and its admitted tiles, on a chronicle begun on each deck', () => {
  for (const deck of Object.keys(STAND_IN.decks)) {
    const chronicle = launched(
      STAND_IN,
      STAND_IN_REGION,
      STAND_IN_SCHEDULE,
      1,
      deckOf(STAND_IN, deck),
    );
    for (const id of Object.keys(STAND_IN.cards)) {
      expect(() => refusalOf(STAND_IN, chronicle, id)).not.toThrow();
      const card = aimOf(cardOf(STAND_IN, id));
      switch (card.aim) {
        case 'tile':
        case 'unit':
          expect(() => admitted(STAND_IN, chronicle, card)).not.toThrow();
          break;
        case 'none':
        case 'discard-pile':
          break;
      }
    }
  }
});

test('each deck of the stand-in settles its city on the centre tile and reaches turn 1', () => {
  for (const deck of Object.keys(STAND_IN.decks)) {
    const chronicle = settledLaunch(
      STAND_IN,
      STAND_IN_REGION,
      STAND_IN_SCHEDULE,
      1,
      deckOf(STAND_IN, deck),
    );

    expect(chronicle.turn).toBe(1);
    expect(chronicle.city).toBeDefined();
  }
});

test('every event of the stand-in has a name and a lore on the screen, and every answer it deals a name', () => {
  for (const [id, event] of Object.entries(STAND_IN.events)) {
    expect(() => eventName(id)).not.toThrow();
    expect(() => eventLore(id)).not.toThrow();
    for (const answer of Object.keys(event.answers)) {
      expect(() => answerName(answer)).not.toThrow();
    }
  }
});

test('the stand-in’s camp has a lore on the screen, keyed on its building', () => {
  expect(() => campLore(STAND_IN.camp.building)).not.toThrow();
});

test('every reward of the stand-in’s camp has a name, and a rules entry read at the counters it starts with, on the screen', () => {
  for (const id of STAND_IN.camp.rewards) {
    expect(() => cardName(id)).not.toThrow();
    expect(() => cardRules(cardMade(STAND_IN, id))).not.toThrow();
  }
});

test('every capstone of the stand-in has a name, a rules entry, a lore at each raising of its window and a victory line on the screen', () => {
  for (const id of Object.keys(STAND_IN.capstones)) {
    expect(() => capstoneName(id)).not.toThrow();
    expect(() => capstoneRules(id)).not.toThrow();
    expect(() => capstoneLore(id, 'opening')).not.toThrow();
    expect(() => capstoneLore(id, 'landing')).not.toThrow();
    expect(() => victoryLine(id)).not.toThrow();
  }
});

test('every enemy script of the stand-in answers its move and its attack for an enemy standing on a chronicle launched and settled', () => {
  const [schedule] = Object.keys(STAND_IN.schedules);
  const chronicle = settledLaunch(
    STAND_IN,
    STAND_IN_REGION,
    schedule,
    1,
    deckOf(STAND_IN, 'PH_Deck'),
  );
  const enemy = chronicle.units.find((unit) => unit.faction === 'enemy');
  if (enemy === undefined) throw new Error('no enemy stands on the chronicle');
  for (const id of Object.keys(STAND_IN.scripts)) {
    const script = enemyScript(STAND_IN, id);
    expect(() => script.moveTo(STAND_IN, chronicle, enemy)).not.toThrow();
    expect(() => script.attacks(STAND_IN, chronicle, enemy)).not.toThrow();
  }
});

test('every schedule of the stand-in rolls a timeline', () => {
  for (const id of Object.keys(STAND_IN.schedules)) {
    expect(() => timelineOf(STAND_IN, id, seedRng(1))).not.toThrow();
  }
});

test('every answer of every event of the stand-in costs, lands and reads a rules entry on the numbers it reads, and every capstone lands, continues and is not passed, on a chronicle launched and settled on each schedule', () => {
  for (const schedule of Object.keys(STAND_IN.schedules)) {
    const deck = deckOf(STAND_IN, 'PH_Deck');
    const chronicle = settledLaunch(STAND_IN, STAND_IN_REGION, schedule, 1, deck);
    for (const id of Object.keys(STAND_IN.events)) {
      expect(() => eventOf(STAND_IN, id).needs?.(STAND_IN, chronicle)).not.toThrow();
      for (const [name, answer] of Object.entries(eventOf(STAND_IN, id).answers)) {
        expect(() => answerCost(STAND_IN, chronicle, answer)).not.toThrow();
        expect(() => answer.reads(STAND_IN, chronicle)).not.toThrow();
        expect(() => answerRules(name, answer.reads(STAND_IN, chronicle))).not.toThrow();
        expect(() => answer.lands(STAND_IN, chronicle)).not.toThrow();
      }
    }
    for (const id of Object.keys(STAND_IN.capstones)) {
      const capstone = capstoneOf(STAND_IN, id);
      expect(() => capstone.lands(STAND_IN, chronicle)).not.toThrow();
      expect(() => capstone.continues?.(STAND_IN, chronicle)).not.toThrow();
      expect(capstone.passes(STAND_IN, chronicle)).toBe(false);
    }
  }
});

test('every hazard of the stand-in strikes at the counters it starts with, on a chronicle launched and settled on each schedule', () => {
  for (const schedule of Object.keys(STAND_IN.schedules)) {
    const chronicle = settledLaunch(
      STAND_IN,
      STAND_IN_REGION,
      schedule,
      1,
      deckOf(STAND_IN, 'PH_Deck'),
    );
    for (const id of Object.keys(STAND_IN.cards)) {
      const card = cardOf(STAND_IN, id);
      if (card.kind === 'hazard') {
        const counter = counterOf(STAND_IN, cardMade(STAND_IN, id));
        expect(() => card.strikes(STAND_IN, chronicle, counter)).not.toThrow();
      }
    }
  }
});
