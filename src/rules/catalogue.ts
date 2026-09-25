import { dealtBiomes, discTiles, sharedBiomes, type Tile, type TileCoords } from './map';
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
import type { Rng } from './rng';
import { changeOn, type Landed, landedAs } from './stages';
import {
  type Block,
  type CardId,
  type Chronicle,
  type ChronicleCard,
  type Counters,
  costsOf,
  type TileBlock,
} from './state';
import { type Landing, standsOn, type Unit, type UnitStats } from './units';

/**
 * What an enemy does in the enemy phase, asked of the enemy itself as the phase stands it. The phase
 * takes one enemy at a time — its move, then an attack for each of its action — and asks again on
 * the chronicle the last answer left; how either is chosen is the script's own business.
 */
export type EnemyScript = {
  /**
   * The landing it moves to, out of the tiles its move points reach and the one it already stands
   * on, which costs it nothing, and the chronicle's generator as its draws leave it.
   */
  moveTo(
    catalogue: Catalogue,
    chronicle: Chronicle,
    enemy: Unit,
  ): { readonly landing: Landing; readonly rng: Rng };
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
      readonly effect: (catalogue: Catalogue, paid: Chronicle) => Landed;
    }
  | {
      readonly aim: 'tile';
      readonly refuses: (
        catalogue: Catalogue,
        chronicle: Chronicle,
        tile: Tile,
      ) => TileBlock | undefined;
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: TileCoords) => Landed;
    }
  | {
      readonly aim: 'unit';
      readonly refuses: (
        catalogue: Catalogue,
        chronicle: Chronicle,
        tile: Tile,
      ) => TileBlock | undefined;
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: TileCoords) => Landed;
    }
  | {
      readonly aim: 'discard-pile';
      readonly blocked: (catalogue: Catalogue, chronicle: Chronicle) => Block[];
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: number) => Landed;
    };

/**
 * The noun a card names — the unit it puts on the map, the building it builds — is named by its
 * effect and nowhere else. A settle card aimed at a tile is asked its own reasons only of a tile
 * already charted.
 */
export type Card = { readonly cost: Partial<Resources>; readonly counters?: Counters } & (
  | ({ readonly kind: 'settle' } & Aim)
  | ({
      readonly kind: 'unit' | 'building' | 'instant';
      readonly singleUse?: true;
    } & Aim)
  | {
      readonly kind: 'hazard';
      readonly strikes: (catalogue: Catalogue, chronicle: Chronicle, counter: Counter) => Landed;
    }
);

/** A card's counters read by name. */
export type Counter = (name: string) => number;

/** How a card the player picks a tile for is played: what the hand aims and the map lights for. */
export type AimedCard = Extract<Aim, { readonly aim: 'tile' | 'unit' }>;

/**
 * One answer an event deals: its cost, flat or a reading of the chronicle it is asked on,
 * what its rules entry reads of the chronicle it is dealt on, and what it does to the chronicle it
 * lands on. A draw of its own steps the generator that chronicle carries.
 */
export type Answer = {
  readonly cost:
    | Partial<Resources>
    | ((catalogue: Catalogue, chronicle: Chronicle) => Partial<Resources>);
  readonly reads: (catalogue: Catalogue, chronicle: Chronicle) => Record<string, number>;
  readonly lands: (catalogue: Catalogue, chronicle: Chronicle) => Landed;
};

/**
 * An event: its answers, dealt in the order declared, and whether the chronicle meets its need, for
 * an event that names one.
 */
export type ScheduledEvent = {
  readonly answers: Readonly<Record<string, Answer>>;
  readonly needs?: (catalogue: Catalogue, chronicle: Chronicle) => boolean;
};

/**
 * A capstone: what it does to the chronicle on the turn it lands, what it does on every turn after
 * that one, and whether the chronicle has passed it.
 */
export type Capstone = {
  readonly lands: (catalogue: Catalogue, chronicle: Chronicle) => Landed;
  readonly continues?: (catalogue: Catalogue, chronicle: Chronicle) => Landed;
  readonly passes: (catalogue: Catalogue, chronicle: Chronicle) => boolean;
};

/** The two scripts a camp's warriors carry: one keeps its camp, one goes for the city. */
export type CampScript = 'guard' | 'raider';

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

/** A deck's two sections: its cards, which the draw pile cycles, and its settle cards, in hand on the settle phase. */
export type Deck = { readonly cards: readonly string[]; readonly settle: readonly string[] };

/**
 * The content a chronicle is played on: the stats a unit of each kind enters the map with, every
 * script an enemy can carry, the map content, the cards and the decks a chronicle is begun on,
 * the events, the capstones and the schedules its timeline is rolled from, what a camp is, enters
 * and gives on its capture, and the city: the building it stands as, how far it sees, and how many
 * idle population it opens with. Every one of them is named by its key.
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
    /** The script each warrior of the camp's carries, named by what enters it. */
    readonly scripts: Readonly<Record<CampScript, string>>;
    readonly building: string;
    /** What a capture deals, in the order dealt. */
    readonly rewards: readonly string[];
    /** The chance, at every enemy phase, that a camp standing enters a guard. */
    readonly odds: number;
    readonly raidCampOdds: number;
  };
  readonly city: {
    readonly building: string;
    readonly sight: number;
    /** How many population the chronicle opens with besides the one on the city's tile. */
    readonly idle: number;
  };
};

export function catalogued(content: Catalogue): Catalogue {
  for (const [id, kind] of Object.entries(content.units)) {
    if (kind.type !== id) refuse(content, `the unit kind ${id} names itself ${kind.type}`);
  }
  for (const [id, biome] of Object.entries(content.biomes)) {
    terrainKind(content, biome.origin);
    for (const terrain of Object.keys(biome.interior)) terrainKind(content, terrain);
    for (const terrain of Object.keys(biome.rim)) terrainKind(content, terrain);
    if (biome.rimWidths.length === 0) refuse(content, `the biome ${id} rolls no rim width`);
    if (biome.compactness < 0) {
      refuse(content, `the biome ${id} grows at a compactness of ${biome.compactness}`);
    }
    switch (biome.growth.kind) {
      case 'weight':
        if (biome.growth.weight <= 0) {
          refuse(content, `the biome ${id} grows at a growth weight of ${biome.growth.weight}`);
        }
        break;
      case 'size':
        if (!Number.isInteger(biome.growth.size) || biome.growth.size < 1) {
          refuse(content, `the biome ${id} is dealt to a size of ${biome.growth.size}`);
        }
        break;
    }
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
    const shared = sharedBiomes(region);
    for (const { biome } of region.biomeShares) {
      if (!shared.includes(biome))
        refuse(content, `the region ${id} deals its share of ${biome} no biome`);
    }
    const dealt = dealtBiomes(region);
    const leftover = dealt.length - shared.length;
    if (biomeKind(content, region.centreBiome).growth.kind === 'size' && leftover > 0) {
      refuse(
        content,
        `the region ${id} leaves ${leftover} biomes over its shares, and its centre kind ${region.centreBiome} is dealt to a size`,
      );
    }
    let sized = 0;
    for (const kind of [region.centreBiome, ...dealt]) {
      const { growth } = biomeKind(content, kind);
      if (growth.kind === 'size') sized += growth.size;
    }
    if (sized >= discTiles(region.radius)) {
      refuse(
        content,
        `the region ${id} deals sized biomes of ${sized} tiles on a disc of ${discTiles(region.radius)}`,
      );
    }
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
    const free = Object.values(event.answers).some(({ cost }) => freeWhateverTheChronicle(cost));
    if (!free) refuse(content, `the event ${id} deals no answer costing no stock`);
  }

  const campUnit = unitKind(content, content.camp.unit);
  enemyScript(content, content.camp.scripts.guard);
  enemyScript(content, content.camp.scripts.raider);
  if (content.camp.rewards.length === 0) refuse(content, 'the camp deals no reward');
  for (const reward of content.camp.rewards) cardOf(content, reward);
  const { odds, raidCampOdds } = content.camp;
  if (!(odds >= 0 && odds <= 1)) refuse(content, `the camp rolls at odds of ${odds}`);
  if (!(raidCampOdds >= 0 && raidCampOdds <= 1)) {
    refuse(content, `a raid enters through a camp at odds of ${raidCampOdds}`);
  }
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

function freeWhateverTheChronicle(cost: Answer['cost']): boolean {
  switch (typeof cost) {
    case 'function':
      return false;
    case 'object':
      return costsOf(cost).length === 0;
  }
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

/**
 * A card made in a chronicle at the counters its content declares, each one set taking the value
 * handed instead; a card the catalogue does not hold, and a counter set that its content does not
 * declare, are refused.
 */
export function cardMade(catalogue: Catalogue, id: CardId, set: Counters = {}): ChronicleCard {
  const declared = cardOf(catalogue, id).counters ?? {};
  for (const counter of Object.keys(set)) {
    if (!Object.hasOwn(declared, counter)) {
      refuse(catalogue, `the card ${id} declares no counter ${counter}`);
    }
  }
  return { id, counters: { ...declared, ...set } };
}

/** The value a card carries under a counter's name; a name its content does not declare is refused. */
export function counterOf(catalogue: Catalogue, card: ChronicleCard): Counter {
  const declared = cardOf(catalogue, card.id).counters ?? {};
  return (name) => {
    if (!Object.hasOwn(declared, name)) {
      refuse(catalogue, `the card ${card.id} declares no counter ${name}`);
    }
    return card.counters[name];
  };
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
export function checkContent(catalogue: Catalogue, { content }: Pick<Chronicle, 'content'>): void {
  if (content === catalogue.version) return;
  refuse(catalogue, `a chronicle begun on ${content} is played on no other content`);
}

/** What a unit entering the map is: its kind, the tile it stands on, and who it acts for. */
export type Entering = { readonly type: string; readonly tile: TileCoords } & (
  | { readonly faction: 'player' }
  | { readonly faction: 'enemy'; readonly script: string }
);

/**
 * The one way a unit enters the map: it takes the next number the chronicle deals a unit, carries
 * its own copy of its kind's stats, and stands with its move points and its action full.
 */
export function entered(catalogue: Catalogue, chronicle: Chronicle, entering: Entering): Landed {
  const stats = { ...unitKind(catalogue, entering.type) };
  const carried = {
    id: chronicle.nextUnit,
    stats,
    tile: entering.tile,
    movePoints: stats.move,
    action: stats.action,
  };
  const dealt = (unit: Unit): Landed =>
    landedAs(
      changeOn('enter', entering.tile, {
        ...chronicle,
        nextUnit: chronicle.nextUnit + 1,
        units: [...chronicle.units, unit],
      }),
    );

  switch (entering.faction) {
    case 'player':
      return dealt({ ...carried, faction: 'player' });
    case 'enemy':
      return dealt({ ...carried, faction: 'enemy', script: entering.script });
  }
}
