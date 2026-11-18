import { expect, test } from 'vitest';
import { newCampaign } from '../rules/campaign';
import { aimOf, struck } from '../rules/cards';
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
import { type Chronicle, keysDealt, type Rewards } from '../rules/state';
import { yieldParts } from '../rules/yields';
import { artFrameOf, artSheet } from '../ui/art-sheet';
import { CARDS_SHEET, frontOf } from '../ui/card-frames';
import {
  answerLinesOfCase,
  answerName,
  answerShown,
  capstoneLines,
  capstoneName,
  eventName,
} from '../ui/event-text';
import {
  bareTerrain,
  buildingFace,
  cardFaceAtStart,
  citySectionBuildings,
  featureFace,
  freshUnit,
  frontWindowOf,
  improvementFace,
  terrainFace,
  unitFace,
} from '../ui/face';
import { clustersOf } from '../ui/launch-layout';
import { capstoneLore, captureLore, eventLore } from '../ui/lore';
import {
  buildingPaintingsOf,
  featureIconOf,
  groundColourOf,
  improvementLookOf,
  liesOf,
  paintingsOf,
  terrainColourOf,
  unitPaintingOf,
} from '../ui/marks';
import {
  achievementGoal,
  ageName,
  buildingName,
  cardName,
  civilizationName,
  defeatLine,
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

test('every unit kind of the catalogue has a name and a painting on the screen', () => {
  for (const id of Object.keys(CATALOGUE.units)) {
    expect(() => unitName(id)).not.toThrow();
    expect(() => unitPaintingOf(id)).not.toThrow();
  }
});

test('every terrain of the catalogue has a name and a painting on the screen', () => {
  for (const id of Object.keys(CATALOGUE.terrains)) {
    expect(() => terrainName(id)).not.toThrow();
    expect(() => paintingsOf(id)).not.toThrow();
  }
});

test('every building of the catalogue has a name and paintings on the screen', () => {
  for (const id of Object.keys(CATALOGUE.buildings)) {
    expect(() => buildingName(id)).not.toThrow();
    expect(() => buildingPaintingsOf(id)).not.toThrow();
  }
});

test('every feature of the catalogue has a name and an icon on the screen', () => {
  for (const id of Object.keys(CATALOGUE.features)) {
    expect(() => featureName(id)).not.toThrow();
    expect(() => featureIconOf(id)).not.toThrow();
  }
});

test('every improvement of the catalogue has a name and, on the screen, its icon on a disc of its own with its painting or its ditches, or its feature’s disc turned pale with its painting', () => {
  for (const id of Object.keys(CATALOGUE.improvements)) {
    expect(() => improvementName(id)).not.toThrow();
    expect(() => improvementLookOf(id)).not.toThrow();
  }
});

/** Every city's building a card is drawn under. */
const CITIES = citySectionBuildings(CATALOGUE);

/** The cards a civilization's city section holds, which a screen draws under a city section alone. */
const CITY_CARDS = new Set(Object.values(CATALOGUE.civilizations).map(({ city }) => city.card));

/** The cities a card is drawn under: each city's building, and no city section for a card none holds. */
function citiesUnder(id: string): (string | undefined)[] {
  return CITY_CARDS.has(id) ? CITIES : [...CITIES, undefined];
}

/**
 * The text a card's face reads at the counters it starts with, under each city's building, and under
 * no city section for a card no city section holds, each thing it marks at its window's foot named.
 */
function rulesAsDrawn(id: string): string[] {
  return citiesUnder(id).map((city) => {
    const face = cardFaceAtStart(CATALOGUE, id, city);
    for (const mark of face.goesOn) if (mark.kind !== 'river') referenceName(mark);
    return face.rules;
  });
}

test('every card of the catalogue has a name, and a text on its face read at the counters it starts with under each city’s building, and under no city section for a card no city section holds, and a name for each thing it marks, on the screen', () => {
  for (const id of Object.keys(CATALOGUE.cards)) {
    expect(() => cardName(id)).not.toThrow();
    expect(() => rulesAsDrawn(id)).not.toThrow();
  }
});

test('every card of the catalogue holds a painting in its art box under each city’s building, and under no city section for a card no city section holds; each names a ground, a unit, a building, an improvement or a file the screen draws, or nothing on its ground, and the art sheet paints it', () => {
  const sheet = artSheet(CATALOGUE);
  const made = new Set((sheet.made ?? []).map(({ frame }) => frame));
  for (const id of Object.keys(CATALOGUE.cards)) {
    for (const city of citiesUnder(id)) {
      const face = cardFaceAtStart(CATALOGUE, id, city);
      const picture = face.art;
      if (picture === undefined) throw new Error(`the card ${id} holds no painting under ${city}`);
      const { ground, holds } = picture;

      expect(() => paintingsOf(ground)).not.toThrow();
      switch (holds.kind) {
        case 'unit':
          expect(() => unitPaintingOf(holds.type)).not.toThrow();
          break;
        case 'building':
          expect(() => buildingPaintingsOf(holds.building)).not.toThrow();
          break;
        case 'improvement':
          expect(() => liesOf(holds.improvement)).not.toThrow();
          break;
        case 'icon':
          expect(sheet.files).toContain(holds.file);
          break;
        case 'tile': {
          const { feature } = holds;
          if (feature !== undefined) expect(() => featureIconOf(feature)).not.toThrow();
          break;
        }
        case 'nothing':
          break;
      }
      expect(made).toContain(artFrameOf(picture, frontWindowOf(face.front)));
    }
  }
});

test('every building of the catalogue wears one face, the face of the one card whose play places it or one of its own, holding a painting the art sheet paints and a name for each thing it marks', () => {
  const made = new Set((artSheet(CATALOGUE).made ?? []).map(({ frame }) => frame));
  for (const id of Object.keys(CATALOGUE.buildings)) {
    const face = buildingFace(CATALOGUE, id);
    if (face.art === undefined) throw new Error(`the face of the building ${id} holds no painting`);

    expect(made).toContain(artFrameOf(face.art, frontWindowOf(face.front)));
    for (const mark of face.goesOn) if (mark.kind !== 'river') referenceName(mark);
  }
});

test('every unit kind of the catalogue wears one face, the face of the one unit card whose play places it or one of its own, holding a picture the art sheet paints, ashore and embarked', () => {
  const made = new Set((artSheet(CATALOGUE).made ?? []).map(({ frame }) => frame));
  for (const id of Object.keys(CATALOGUE.units)) {
    for (const embarked of [false, true]) {
      const face = unitFace(CATALOGUE, { ...freshUnit(CATALOGUE, id, 'player'), embarked });
      if (face.art === undefined)
        throw new Error(`the face of the unit kind ${id} holds no picture`);

      expect(made).toContain(artFrameOf(face.art, frontWindowOf(face.front)));
    }
  }
});

test('every improvement of the catalogue wears the face of the one card whose play places it', () => {
  for (const id of Object.keys(CATALOGUE.improvements)) {
    expect(() => improvementFace(CATALOGUE, id)).not.toThrow();
  }
});

test('every terrain and every feature of the catalogue wears a face of its own, on a front and a shadow the cards sheet makes, holding a picture the art sheet paints', () => {
  const painted = new Set((artSheet(CATALOGUE).made ?? []).map(({ frame }) => frame));
  const made = new Set((CARDS_SHEET.made ?? []).map(({ frame }) => frame));
  const faces = [
    ...Object.keys(CATALOGUE.terrains).map((id) => terrainFace(bareTerrain(CATALOGUE, id))),
    ...Object.keys(CATALOGUE.features).map((id) => featureFace(CATALOGUE, id)),
  ];
  for (const face of faces) {
    if (face.art === undefined) throw new Error(`the face of ${face.id} holds no picture`);
    const { frame, shadow } = frontOf(face.front);

    expect(painted).toContain(artFrameOf(face.art, frontWindowOf(face.front)));
    expect(made).toContain(frame);
    expect(made).toContain(shadow);
  }
});

test('every card of the catalogue wears a front and a shadow the cards sheet makes', () => {
  const made = new Set((CARDS_SHEET.made ?? []).map(({ frame }) => frame));
  for (const id of Object.keys(CATALOGUE.cards)) {
    const { frame, shadow } = frontOf(cardFaceAtStart(CATALOGUE, id, undefined).front);

    expect(made).toContain(frame);
    expect(made).toContain(shadow);
  }
});

/**
 * Every line an answer's text reads on the chronicle, those its numbers leave out included: the lines
 * of each case it declares, or of its one text where it declares none.
 */
function answerEntries(chronicle: Chronicle, event: string, answer: string): string[] {
  const { cases } = answerOf(CATALOGUE, event, answer);
  const named = cases === undefined ? [undefined] : cases.declared;
  return named.flatMap((which) =>
    answerLinesOfCase(CATALOGUE, chronicle, event, answer, which).map(({ line }) => line),
  );
}

test('every rules entry, every line of every answer’s and every capstone’s text and every goal of the catalogue lays out, and every name on it resolves in the catalogue’s table of its kind', () => {
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
      entries.push(
        ...capstoneLines(id, capstoneReading(CATALOGUE, chronicle, id)).map(({ line }) => line),
      );
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
          case 'hand':
            break;
        }
      }
    }
  }
});

/**
 * What a card's effect lands on the chronicle at its cheapest answer: at nothing where nothing blocks
 * it, at the first tile its aim admits, at the first card of the hand; and nothing at all where the
 * rules leave it nothing to land on.
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
      return at === undefined ? undefined : card.effect(CATALOGUE, chronicle, at);
    }
    case 'hand':
      return chronicle.hand.length <= 1
        ? undefined
        : card.effect(CATALOGUE, chronicle, chronicle.hand[0].key);
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

test('every capstone of the catalogue has a name, a text read on the numbers it reads of a chronicle launched and settled in each age, a lore at each raising of its window, a victory line and, naming what fails it, a defeat line on the screen', () => {
  const chronicles = AGES.map(settledIn);
  for (const [id, { fails }] of Object.entries(CATALOGUE.capstones)) {
    expect(() => capstoneName(id)).not.toThrow();
    for (const chronicle of chronicles) {
      expect(() => capstoneLines(id, capstoneReading(CATALOGUE, chronicle, id))).not.toThrow();
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

test('every answer of every event of a region’s schedule costs, answers what blocks it, lands and reads a text on the numbers it reads, of the case it names and every line of every case it declares, and every capstone of its schedule lands, continues, answers its rule over every part of every tile’s yield, counts below its need and is not failed, on a chronicle launched and settled in that region’s age', () => {
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
          expect(() => answerShown(CATALOGUE, chronicle, id, name)).not.toThrow();
          expect(() => answerEntries(chronicle, id, name)).not.toThrow();
          expect(() => answer.lands(CATALOGUE, chronicle)).not.toThrow();
        }
      }
      for (const id of schedule.capstones) {
        const capstone = capstoneOf(CATALOGUE, id);
        expect(() => capstone.lands(CATALOGUE, chronicle)).not.toThrow();
        expect(() => capstone.continues?.(CATALOGUE, chronicle)).not.toThrow();
        for (const part of parts) expect(() => capstone.yieldRule?.(part)).not.toThrow();
        expect(capstone.count(CATALOGUE, chronicle)).toBeLessThan(capstone.need);
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
      const { cards, nextKey } = keysDealt(chronicle.nextKey, [cardMade(CATALOGUE, id)]);
      const holding = { ...chronicle, nextKey, hand: cards };
      expect(() => struck(CATALOGUE, holding)).not.toThrow();
    }
  }
});
