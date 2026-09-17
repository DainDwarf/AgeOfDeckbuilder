import type { Tile, TileCoords } from './map';
import {
  biomeKind,
  buildingKind,
  featureKind,
  held,
  type MapContent,
  refuse,
  terrainKind,
} from './map-kinds';
import type { Resources } from './resources';
import { type Block, type Chronicle, costsOf, type TileBlock } from './state';
import { type Landing, standsOn, type Unit, type UnitStats } from './units';

/**
 * What an enemy does in the enemy phase, asked of the enemy itself as the phase stands it. The phase
 * takes one enemy at a time — its move, then an attack for each of its action — and asks again on
 * the chronicle the last answer left; how either is chosen is the script's own business.
 */
export type EnemyScript = {
  /**
   * The landing it moves to, out of the tiles its move points reach and the one it already stands
   * on, which costs it nothing.
   */
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Landing;
  /** The unit it attacks now, and nothing when it attacks none. */
  attacks(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined;
};

/**
 * What a card is played at, and what it does with what it was played at. An aim of `none` lands
 * whole, and names what blocks it where the map or the city can hold it up; a `tile` aim answers the
 * first reason it refuses a tile for and nothing at all on one it admits, and hands its effect the
 * tile that was chosen; a `unit` aim is the same over the tiles a unit of the player's stands on,
 * which it is asked of before its own reasons; a `discard-pile` aim names what blocks it the way an
 * aim of `none` does, and hands its effect where in the discard pile the card that was chosen lies.
 * The effect takes the chronicle the card's cost is paid on.
 */
export type Aim =
  | {
      readonly aim: 'none';
      readonly blocked?: (catalogue: Catalogue, chronicle: Chronicle) => Block[];
      readonly effect: (catalogue: Catalogue, paid: Chronicle) => Chronicle;
    }
  | {
      readonly aim: 'tile';
      readonly refuses: (
        catalogue: Catalogue,
        chronicle: Chronicle,
        tile: Tile,
      ) => TileBlock | undefined;
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: TileCoords) => Chronicle;
    }
  | {
      readonly aim: 'unit';
      readonly refuses: (
        catalogue: Catalogue,
        chronicle: Chronicle,
        tile: Tile,
      ) => TileBlock | undefined;
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: TileCoords) => Chronicle;
    }
  | {
      readonly aim: 'discard-pile';
      readonly blocked: (catalogue: Catalogue, chronicle: Chronicle) => Block[];
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: number) => Chronicle;
    };

/**
 * A card: its kind, which a list of cards sorts and labels by, and its cost. The kinds the player's
 * deck holds declare the aim and effect they are played through, and the noun such a card names —
 * the unit it puts on the map, the building it builds — is named by its effect and nowhere else. A
 * settle card is played through whatever aim it declares, and one aimed at a tile asks its own
 * reasons of a tile once the kind has asked for it charted. A hazard declares its strike alone, its
 * kind fixing everything else about it.
 */
export type Card = { readonly cost: Partial<Resources> } & (
  | ({ readonly kind: 'settle' } & Aim)
  | ({
      readonly kind: 'unit' | 'building' | 'instant';
      readonly singleUse?: true;
    } & Aim)
  | {
      readonly kind: 'hazard';
      /** What it does to the chronicle at the end of a turn it is still in the hand. */
      readonly strikes: (catalogue: Catalogue, chronicle: Chronicle) => Chronicle;
    }
);

/** How a card the player picks a tile for is played: what the hand aims and the map lights for. */
export type AimedCard = Extract<Aim, { readonly aim: 'tile' | 'unit' }>;

/**
 * One answer an event deals: its cost, what its rules entry reads of the chronicle it is dealt on,
 * and what it does to the chronicle it lands on. A draw of its own steps the generator that chronicle
 * carries.
 */
export type Answer = {
  readonly cost: Partial<Resources>;
  readonly reads: (catalogue: Catalogue, chronicle: Chronicle) => Record<string, number>;
  readonly lands: (catalogue: Catalogue, chronicle: Chronicle) => Chronicle;
};

/** An event: its answers, dealt in the order declared. */
export type ScheduledEvent = { readonly answers: Readonly<Record<string, Answer>> };

/**
 * A capstone: what it does to the chronicle on the turn it lands, what it does on every turn after
 * that one, and whether the chronicle has passed it.
 */
export type Capstone = {
  readonly lands: (catalogue: Catalogue, chronicle: Chronicle) => Chronicle;
  readonly continues?: (catalogue: Catalogue, chronicle: Chronicle) => Chronicle;
  readonly passes: (catalogue: Catalogue, chronicle: Chronicle) => boolean;
};

/** The least and the most a span of turns rolls, both ends included. */
export type Span = readonly [number, number];

/**
 * An age's schedule: how far apart its deals are due, its capstone with the window its turn is
 * rolled from, and every entry a deal is drawn from with what it weighs on a turn — nothing at all
 * on a turn it may not be dealt on.
 */
export type Schedule = {
  readonly spacing: Span;
  readonly capstone: { readonly id: string; readonly window: Span };
  readonly entries: Readonly<Record<string, (turn: number) => number>>;
};

/** A deck's two sections: its cards, which the draw pile cycles, and its settle cards, in hand on turn 0. */
export type Deck = { readonly cards: readonly string[]; readonly settle: readonly string[] };

/**
 * The content a chronicle is played on: the stats a unit of each kind enters the map with, every
 * script an enemy can carry, the map content, the cards and the decks a chronicle is begun on,
 * the events, the capstones and the schedules its timeline is rolled from, what a camp is, enters
 * and gives on its capture, and the city: the building it stands as, how far it sees, and how many
 * idle inhabitants it opens with. Every one of them is named by its key.
 */
export type Catalogue = MapContent & {
  readonly units: Readonly<Record<string, UnitStats>>;
  readonly scripts: Readonly<Record<string, EnemyScript>>;
  readonly cards: Readonly<Record<string, Card>>;
  readonly decks: Readonly<Record<string, Deck>>;
  readonly events: Readonly<Record<string, ScheduledEvent>>;
  readonly capstones: Readonly<Record<string, Capstone>>;
  readonly schedules: Readonly<Record<string, Schedule>>;
  readonly camp: {
    readonly unit: string;
    readonly script: string;
    readonly building: string;
    /** What a capture deals, in the order dealt. */
    readonly rewards: readonly string[];
    /** The chance, at every enemy phase, that the camp's unit enters on a free camp. */
    readonly odds: number;
  };
  readonly city: {
    readonly building: string;
    readonly sight: number;
    /** How many inhabitants the chronicle opens with besides the one on the city's tile. */
    readonly idle: number;
  };
};

/**
 * The one way a catalogue is built, refused whole where it does not hold together: every unit kind
 * names itself by its key; every id a biome, a feature, a building, an improvement, a region, a deck,
 * a schedule, the camp and the city name is held; every biome rolls some rim width; no building or
 * improvement names a movement cost below one hundredth of a move point; no region keeps its camps
 * within the centre part's reach plus the city's sight; no section of a deck holds a hazard or any
 * of the camp's rewards, a deck's settle section holds settle cards alone and at least one, and its
 * cards none; a schedule deals one event at least, its capstone is held, and each of its spans rolls
 * from one at least to no less than its least; an event a schedule deals among its entries deals two
 * answers at least; every event deals an answer costing no stock, every amount its cost names
 * nought; no answer is dealt by two events; the camp deals one reward at least and rolls at odds
 * from nought to one; the camp's unit stands on every terrain its building names; and the city's
 * sight and its idle count are none below nought. The closures of a card, an answer and a capstone
 * are neither run nor read here.
 */
export function catalogued(content: Catalogue): Catalogue {
  for (const [id, kind] of Object.entries(content.units)) {
    if (kind.type !== id) refuse(content, `the unit kind ${id} names itself ${kind.type}`);
  }
  for (const [id, biome] of Object.entries(content.biomes)) {
    terrainKind(content, biome.origin);
    for (const terrain of Object.keys(biome.interior)) terrainKind(content, terrain);
    for (const terrain of Object.keys(biome.rim)) terrainKind(content, terrain);
    if (biome.rimWidths.length === 0) refuse(content, `the biome ${id} rolls no rim width`);
  }
  for (const feature of Object.values(content.features)) terrainKind(content, feature.terrain);
  for (const layer of [
    ...Object.values(content.buildings),
    ...Object.values(content.improvements),
  ]) {
    for (const terrain of layer.terrains) terrainKind(content, terrain);
  }
  for (const [noun, table] of [
    ['building', content.buildings],
    ['improvement', content.improvements],
  ] as const) {
    for (const [id, layer] of Object.entries(table)) {
      if (layer.movementCost !== undefined && layer.movementCost < 1) {
        refuse(content, `the ${noun} ${id} names a movement cost of ${layer.movementCost}`);
      }
    }
  }
  for (const [id, region] of Object.entries(content.regions)) {
    biomeKind(content, region.centreBiome);
    biomeKind(content, region.rivers.source);
    for (const { biome } of region.biomeShares) biomeKind(content, biome);
    for (const { feature } of region.featureShares) featureKind(content, feature);
    const reach = region.centre + content.city.sight;
    if (region.campFromCentre <= reach) {
      refuse(
        content,
        `the region ${id} keeps its camps ${region.campFromCentre} from the centre, within the settle's reach of ${reach}`,
      );
    }
  }
  for (const [id, deck] of Object.entries(content.decks)) {
    for (const card of [...deck.cards, ...deck.settle]) {
      if (cardOf(content, card).kind === 'hazard') {
        refuse(content, `the deck ${id} holds the hazard ${card}`);
      }
      if (content.camp.rewards.includes(card)) {
        refuse(content, `the deck ${id} holds the camp's reward ${card}`);
      }
    }
    for (const card of deck.cards) {
      if (cardOf(content, card).kind === 'settle') {
        refuse(content, `the deck ${id} holds the settle card ${card} among its cards`);
      }
    }
    if (deck.settle.length === 0) {
      refuse(content, `the deck ${id} holds no settle card in its settle section`);
    }
    for (const card of deck.settle) {
      const { kind } = cardOf(content, card);
      if (kind !== 'settle') {
        refuse(content, `the deck ${id} holds the ${kind} ${card} in its settle section`);
      }
    }
  }

  for (const [id, schedule] of Object.entries(content.schedules)) {
    if (Object.keys(schedule.entries).length === 0) {
      refuse(content, `the schedule ${id} deals no event`);
    }
    for (const entry of Object.keys(schedule.entries)) {
      const answers = Object.keys(eventOf(content, entry).answers).length;
      if (answers < 2) refuse(content, `the schedule ${id} deals ${entry}, which deals ${answers}`);
    }
    capstoneOf(content, schedule.capstone.id);
    for (const [least, most] of [schedule.spacing, schedule.capstone.window]) {
      if (least < 1 || most < least) {
        refuse(content, `the schedule ${id} rolls a span from ${least} to ${most}`);
      }
    }
  }
  const dealtBy = new Map<string, string>();
  for (const [id, event] of Object.entries(content.events)) {
    for (const answer of Object.keys(event.answers)) {
      const other = dealtBy.get(answer);
      if (other !== undefined) {
        refuse(content, `the answer ${answer} is dealt by both ${other} and ${id}`);
      }
      dealtBy.set(answer, id);
    }
    const free = Object.values(event.answers).some((answer) => costsOf(answer.cost).length === 0);
    if (!free) refuse(content, `the event ${id} deals no answer costing no stock`);
  }

  const campUnit = unitKind(content, content.camp.unit);
  enemyScript(content, content.camp.script);
  if (content.camp.rewards.length === 0) refuse(content, 'the camp deals no reward');
  for (const reward of content.camp.rewards) cardOf(content, reward);
  const { odds } = content.camp;
  if (!(odds >= 0 && odds <= 1)) refuse(content, `the camp rolls at odds of ${odds}`);
  for (const terrain of buildingKind(content, content.camp.building).terrains) {
    if (!standsOn(content, campUnit, { q: 0, r: 0, terrain, improvements: [] })) {
      refuse(content, `the camp's unit ${content.camp.unit} cannot stand on ${terrain}`);
    }
  }
  buildingKind(content, content.city.building);
  const { sight, idle } = content.city;
  if (sight < 0) refuse(content, `the city sees ${sight}`);
  if (idle < 0) refuse(content, `the city opens with ${idle} idle`);
  return content;
}

/** The stats a unit of that kind enters the map with; a kind the catalogue does not hold is refused. */
export function unitKind(catalogue: Catalogue, id: string): UnitStats {
  return held(catalogue, catalogue.units, id, 'unit kind');
}

/** The script an enemy names; a script the catalogue does not hold is refused. */
export function enemyScript(catalogue: Catalogue, id: string): EnemyScript {
  return held(catalogue, catalogue.scripts, id, 'enemy script');
}

/** The card an id names; a card the catalogue does not hold is refused. */
export function cardOf(catalogue: Catalogue, id: string): Card {
  return held(catalogue, catalogue.cards, id, 'card');
}

/** The two sections a deck lists; a deck the catalogue does not hold is refused. */
export function deckOf(catalogue: Catalogue, id: string): Deck {
  return held(catalogue, catalogue.decks, id, 'deck');
}

/** The event an id names; an event the catalogue does not hold is refused. */
export function eventOf(catalogue: Catalogue, id: string): ScheduledEvent {
  return held(catalogue, catalogue.events, id, 'event');
}

/** The capstone an id names; a capstone the catalogue does not hold is refused. */
export function capstoneOf(catalogue: Catalogue, id: string): Capstone {
  return held(catalogue, catalogue.capstones, id, 'capstone');
}

/** The schedule an id names; a schedule the catalogue does not hold is refused. */
export function scheduleOf(catalogue: Catalogue, id: string): Schedule {
  return held(catalogue, catalogue.schedules, id, 'schedule');
}

/** A chronicle begun on any other version of the content than this catalogue's is refused. */
export function checkContent(catalogue: Catalogue, chronicle: Chronicle): void {
  if (chronicle.content === catalogue.version) return;
  refuse(catalogue, `a chronicle begun on ${chronicle.content} is played on no other content`);
}

/** What a unit entering the map is: its kind, the tile it stands on, and who it acts for. */
export type Entering = { readonly type: string; readonly tile: TileCoords } & (
  | { readonly faction: 'player' }
  | { readonly faction: 'enemy'; readonly script: string }
);

/**
 * The one way a unit enters the map: it takes the next number off the chronicle's counter, carries
 * its own copy of its kind's stats, and stands with its move points and its action full.
 */
export function entered(catalogue: Catalogue, chronicle: Chronicle, entering: Entering): Chronicle {
  const stats = { ...unitKind(catalogue, entering.type) };
  const carried = {
    id: chronicle.nextUnit,
    stats,
    tile: entering.tile,
    movePoints: stats.move,
    action: stats.action,
  };
  const dealt = (unit: Unit): Chronicle => ({
    ...chronicle,
    nextUnit: chronicle.nextUnit + 1,
    units: [...chronicle.units, unit],
  });

  switch (entering.faction) {
    case 'player':
      return dealt({ ...carried, faction: 'player' });
    case 'enemy':
      return dealt({ ...carried, faction: 'enemy', script: entering.script });
  }
}
