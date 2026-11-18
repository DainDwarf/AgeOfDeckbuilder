import { describe, expect, it } from 'vitest';
import { builds, enters, placesImprovement } from '../rules/cards';
import { type Card, cardOf, catalogued, unitKind } from '../rules/catalogue';
import {
  CAMP,
  CATALOGUE,
  changed,
  cityOf,
  FREEZE,
  FROST,
  NEUTRAL,
  SHRINE,
  SILO,
  SITE,
  TILLAGE,
} from '../rules/fixtures';
import { MOVE_POINT } from '../rules/map';
import { answerOf } from '../rules/schedule';
import type { CardArt } from './art-box';
import {
  artPictureOf,
  buildingFacing,
  cardFront,
  cardStats,
  featureFace,
  freshUnit,
  improvementFacing,
  inMovePoints,
  labelledKind,
  namedCardMade,
  numbersRun,
  placedReading,
  statReading,
  terrainFace,
  type UnitReading,
  unitFacing,
  unitStats,
} from './face';
import { text } from './text';

describe('a card’s face', () => {
  it('is labelled by its card’s kind, an action card’s naming the worker it is played through', () => {
    const labelled = (id: string) => labelledKind(cardOf(CATALOGUE, id));

    expect(labelled('PH_Hunt')).toBe('worker-action');
    expect(labelled('PH_Mine')).toBe('improvement');
    expect(labelled('PH_Farm')).toBe('building');
    expect(labelled('PH_Harvest')).toBe('instant');
  });

  it('wears the plain front of its kind, the oval window where its play places a thing and the arched where it places nothing, and the decorated front where its play places the city', () => {
    const front = (id: string) => cardFront(cardOf(CATALOGUE, id));

    expect(front('PH_Worker')).toEqual({ front: 'plain', colour: 'unit', window: 'oval' });
    expect(front('PH_Band')).toEqual({ front: 'plain', colour: 'settle', window: 'oval' });
    expect(front('PH_Stores')).toEqual({ front: 'plain', colour: 'settle', window: 'arched' });
    expect(front(SILO)).toEqual({ front: 'plain', colour: 'action', window: 'oval' });
    expect(front('PH_Mine')).toEqual({ front: 'plain', colour: 'improvement', window: 'oval' });
    expect(front('PH_Hunt')).toEqual({ front: 'plain', colour: 'action', window: 'arched' });
    expect(front('PH_Harvest')).toEqual({ front: 'plain', colour: 'instant', window: 'arched' });
    expect(front('PH_Hunger')).toEqual({ front: 'plain', colour: 'hazard', window: 'arched' });
    expect(front('PH_Settle')).toEqual({ front: 'decorated', colour: 'settle' });
  });
});

describe('a face of a card that places a thing on the ground', () => {
  const reading = (id: string, city?: string) =>
    placedReading(CATALOGUE, cardOf(CATALOGUE, id), city);

  it('marks the building its thing is built over alone, else the features its kind names, else its terrains, and the river last where its kind asks for one; a settle card its city section’s building’s, and nothing under none', () => {
    expect(reading(SILO).goesOn).toEqual([{ kind: 'building', id: TILLAGE }]);
    expect(reading('PH_Smokehouse').goesOn).toEqual([
      { kind: 'feature', id: 'PH_Game' },
      { kind: 'feature', id: 'PH_Fertile' },
    ]);
    expect(reading('PH_Ditch').goesOn).toEqual([
      { kind: 'terrain', id: 'plain' },
      { kind: 'terrain', id: 'forest' },
      { kind: 'river' },
    ]);
    expect(reading('PH_Settle', 'PH_City').goesOn).toEqual([{ kind: 'terrain', id: 'urban' }]);
    expect(reading('PH_Settle').goesOn).toEqual([]);
    expect(reading('PH_Band', 'PH_City').goesOn).toEqual([]);
  });

  it('reads one resource to each point its thing gives and to each it takes, in the resource bar’s order', () => {
    expect(reading(SHRINE)).toMatchObject({
      gives: [],
      takes: ['production', 'production', 'production', 'culture'],
      footDisc: undefined,
    });
    expect(reading('PH_Mill')).toMatchObject({
      gives: ['production'],
      takes: [],
      footDisc: undefined,
    });
  });

  it('of a building giving to the tiles beside it and nothing on its own tile reads one text of what it gives, on which terrain, and what it takes, and a range of one on its foot’s disc, and no numbers', () => {
    const jetty = 'PH_Jetty';
    const beside = { terrain: 'coast', yields: { food: 2 } };
    const content = catalogued(
      changed({
        buildings: {
          ...CATALOGUE.buildings,
          [jetty]: { terrains: ['coast'], yields: {}, givesBeside: beside, upkeep: { money: 1 } },
        },
      }),
    );
    const card: Card = { kind: 'building', cost: {}, ...builds(jetty) };

    expect(placedReading(content, card, undefined)).toEqual({
      goesOn: [{ kind: 'terrain', id: 'coast' }],
      gives: [],
      takes: [],
      footDisc: { symbol: 'range', reading: '1' },
      leads: text('face.in-range-taking', {
        gives: numbersRun('gives', ['food', 'food']),
        terrain: 'coast',
        takes: numbersRun('takes', ['money']),
      }),
    });
  });
});

describe('a face of a card that places a unit', () => {
  it('reads the stats of the kind its card places, a unit card’s and a settle card’s alike, and a card placing no unit reads none', () => {
    const statsOf = (kind: string) => {
      const { damage, health, move, action, range, sight } = unitKind(CATALOGUE, kind);
      return {
        damage: statReading('damage', damage),
        health: statReading('health', health),
        move: statReading('move', move),
        action: statReading('action', action),
        range: statReading('range', range),
        sight: statReading('sight', sight),
      };
    };
    const stats = (id: string) => cardStats(CATALOGUE, cardOf(CATALOGUE, id));

    expect(stats('PH_Warrior')).toEqual(statsOf('PH_Warrior'));
    expect(stats('PH_Band')).toEqual(statsOf('PH_Worker'));
    expect(stats('PH_Farm')).toBeUndefined();
  });
});

describe('a unit’s face', () => {
  /** A unit fresh of the kind, of the player's, changed as handed. */
  const unitOf = (kind: string, change: Partial<UnitReading> = {}): UnitReading => ({
    ...freshUnit(CATALOGUE, kind, 'player'),
    ...change,
  });

  it('is the face of the one unit card whose play places its kind, a settle card placing it counting for nothing, and its own for a kind no card places', () => {
    expect(unitFacing(CATALOGUE, 'PH_Warrior')).toEqual({ wears: 'card', card: 'PH_Warrior' });
    expect(unitFacing(CATALOGUE, 'PH_Worker')).toEqual({ wears: 'card', card: 'PH_Worker' });
    expect(unitFacing(CATALOGUE, 'PH_Chief')).toEqual({ wears: 'own' });
  });

  it('is refused for a kind two unit cards place', () => {
    const twice = changed({
      cards: { ...CATALOGUE.cards, PH_Levy: { kind: 'unit', cost: {}, ...enters('PH_Warrior') } },
    });

    expect(() => unitFacing(twice, 'PH_Warrior')).toThrow();
  });

  it('reads the health, the move and the action the unit holds over its kind’s own, at full too, and its damage with the bonus it carries after a plus sign', () => {
    const kind = unitKind(CATALOGUE, 'PH_Warrior');
    const over = (count: string, own: string) => text('reading.over', { count, over: own });
    const wounded = unitOf('PH_Warrior', {
      stats: { ...kind, health: kind.health - 1 },
      movePoints: 0,
      damage: kind.damage + 1,
    });

    expect(unitStats(CATALOGUE, wounded)).toEqual({
      health: over(statReading('health', kind.health - 1), statReading('health', kind.health)),
      move: over(statReading('move', 0), statReading('move', kind.move)),
      action: over(statReading('action', kind.action), statReading('action', kind.action)),
      damage: `${statReading('damage', kind.damage)}${text('reading.plus', { count: 1 })}`,
      range: statReading('range', kind.range),
      sight: statReading('sight', kind.sight),
    });
    expect(unitStats(CATALOGUE, unitOf('PH_Warrior')).damage).toBe(
      statReading('damage', kind.damage),
    );
  });

  it('embarked, reads a damage and a range of nought', () => {
    expect(unitStats(CATALOGUE, unitOf('PH_Warrior', { embarked: true, damage: 3 }))).toMatchObject(
      { damage: statReading('damage', 0), range: statReading('range', 0) },
    );
  });
});

describe('a card’s art box', () => {
  it('on the card whose play places the city holds the building of the city section it is drawn under, on its ground in the oval window, and nothing under no city section', () => {
    const art: CardArt = { ground: 'plain', holds: 'placed' };

    expect(artPictureOf(CATALOGUE, 'PH_Settle', art, 'PH_City')).toEqual({
      window: 'oval',
      ground: 'plain',
      holds: { kind: 'building', building: 'PH_City' },
    });
    expect(artPictureOf(CATALOGUE, 'PH_Settle', art, undefined)).toBeUndefined();
  });

  it('on a card whose play places an improvement holds that improvement, on its ground in the oval window', () => {
    const art: CardArt = { ground: 'hills', holds: 'placed' };

    expect(artPictureOf(CATALOGUE, 'PH_Mine', art, undefined)).toEqual({
      window: 'oval',
      ground: 'hills',
      holds: { kind: 'improvement', improvement: 'PH_Mine' },
    });
  });
});

describe('a building’s face', () => {
  it('is the face of the card whose play places it, the city’s card drawn under it where it is a city section’s building', () => {
    expect(buildingFacing(CATALOGUE, 'PH_Farm')).toEqual({
      wears: 'card',
      card: 'PH_Farm',
      city: undefined,
    });
    expect(buildingFacing(CATALOGUE, 'PH_City')).toEqual({
      wears: 'card',
      card: 'PH_Settle',
      city: 'PH_City',
    });
  });

  it('of a building no card places is its own, reading what it is in its age: a camp, a site or a neutral’s city', () => {
    expect(buildingFacing(CATALOGUE, CAMP.building)).toEqual({ wears: 'own', captured: 'camp' });
    expect(buildingFacing(CATALOGUE, SITE)).toEqual({ wears: 'own', captured: 'site' });
    expect(buildingFacing(CATALOGUE, NEUTRAL)).toEqual({ wears: 'own', captured: 'neutral-city' });
  });

  it('is refused for a building two cards place, and for one no card places that no age holds', () => {
    const twice = changed({
      cards: { ...CATALOGUE.cards, PH_Barn: { kind: 'building', cost: {}, ...builds('PH_Farm') } },
    });
    const unplaced = changed({
      buildings: { ...CATALOGUE.buildings, PH_Hut: { terrains: ['plain'], yields: {} } },
    });

    expect(() => buildingFacing(twice, 'PH_Farm')).toThrow();
    expect(() => buildingFacing(unplaced, 'PH_Hut')).toThrow();
  });
});

describe('a terrain’s face', () => {
  const content = changed({
    terrains: {
      ...CATALOGUE.terrains,
      ocean: { yields: { food: 1 }, water: true, elevation: 0 },
      desert: { yields: {}, movementCost: MOVE_POINT, water: false, elevation: 0 },
    },
  });
  const face = (terrain: string) => terrainFace(content, terrain);

  it('reads one resource to each point a bare tile of it gives, and on its foot’s disc what entering it costs a unit in move points', () => {
    expect(face('forest')).toMatchObject({
      kind: 'terrain',
      gives: ['food', 'production'],
      takes: [],
      footDisc: { symbol: 'move', reading: inMovePoints(2 * MOVE_POINT) },
      rules: '',
    });
  });

  it('reads on its disc what entering it costs an embarked unit where no unit ashore enters it', () => {
    expect(face('coast').footDisc).toEqual({ symbol: 'move', reading: inMovePoints(MOVE_POINT) });
  });

  it('reads a dash on its disc and Impassable as its text where nothing enters it, ashore or embarked', () => {
    expect(face('ocean')).toMatchObject({
      footDisc: { symbol: 'move', reading: text('face.no-movement-cost') },
      rules: text('face.impassable'),
    });
  });

  it('of a terrain giving nothing reads no resource and no text', () => {
    expect(face('desert')).toMatchObject({ gives: [], takes: [], rules: '' });
  });

  it('wears the plain oval front in a terrain’s face’s colour and holds its tile, lit and carrying nothing', () => {
    expect(face('plain').front).toEqual({ front: 'plain', colour: 'terrain', window: 'oval' });
    expect(face('plain').art).toEqual({
      window: 'oval',
      ground: 'plain',
      holds: { kind: 'tile', feature: undefined },
    });
  });
});

describe('a feature’s face', () => {
  const content = changed({
    features: { ...CATALOGUE.features, deer: { terrain: 'forest', yields: { food: 2 } } },
  });

  it('reads one resource to each point it gives and nothing on its disc, on the decorated front in a terrain’s face’s colour, holding its terrain’s tile carrying it', () => {
    expect(featureFace(content, 'deer')).toMatchObject({
      kind: 'feature',
      front: { front: 'decorated', colour: 'terrain' },
      gives: ['food', 'food'],
      takes: [],
      footDisc: undefined,
      rules: '',
      art: { window: 'oval', ground: 'forest', holds: { kind: 'tile', feature: 'deer' } },
    });
  });
});

describe('an improvement’s face', () => {
  it('is the face of the card whose play places it', () => {
    expect(improvementFacing(CATALOGUE, 'PH_Mine')).toBe('PH_Mine');
  });

  it('is refused for an improvement two cards place, and for one no card places', () => {
    const twice = changed({
      cards: {
        ...CATALOGUE.cards,
        PH_Quarry: { kind: 'improvement', cost: {}, ...placesImprovement('PH_Mine') },
      },
    });
    const unplaced = changed({
      improvements: { ...CATALOGUE.improvements, PH_Peat: { terrains: ['plain'], yields: {} } },
    });

    expect(() => improvementFacing(twice, 'PH_Mine')).toThrow();
    expect(() => improvementFacing(unplaced, 'PH_Peat')).toThrow();
  });
});

describe('a card named on a face', () => {
  it('is made at the counters an answer reads under the names the card declares, a value read under any other name setting nothing, and at its start on any other face', () => {
    const chronicle = cityOf(['urban']);
    const reading = answerOf(CATALOGUE, 'PH_Cold', 'PH_Freeze').reads(CATALOGUE, chronicle);

    const onAnswer = namedCardMade(CATALOGUE, 'PH_Frost', reading);
    const onCard = namedCardMade(CATALOGUE, 'PH_Frost', {});

    expect(reading).toEqual({ amount: FREEZE, cards: 1 });
    expect(onAnswer.counters).toEqual({ amount: FREEZE });
    expect(onCard.counters).toEqual({ amount: FROST });
  });
});
