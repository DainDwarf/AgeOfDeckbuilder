import { dealtBiomes, discTiles, sharedBiomes, type Tile, type TileCoords } from './map';
import {
  biomeKind,
  buildingKind,
  entryOf,
  featureKind,
  type LayerKind,
  type MapContent,
  type Region,
  refuse,
  terrainKind,
} from './map-kinds';
import type { Resources } from './resources';
import type { Rng } from './rng';
import { changeOn, type Landed, landedAs, type Stage } from './stages';
import {
  type Block,
  type CardId,
  type Chronicle,
  type ChronicleCard,
  type CitySection,
  type Counters,
  costsOf,
  type Tally,
  type TileBlock,
} from './state';
import { type Landing, LEAST_STATS, standsOn, type Unit, type UnitStats } from './units';

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
 * which it is asked of before its own reasons; a `discard-pile` or a `hand` aim hands its effect
 * where in that pile the card chosen lies on the chronicle the card's cost is paid on, which the
 * effect takes.
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
      /**
       * For a card played through a unit beside the tile, the units that can be the one; the play
       * hands the effect the tile of the one it went through.
       */
      readonly through?: (catalogue: Catalogue, chronicle: Chronicle, tile: Tile) => Unit[];
      readonly effect: (
        catalogue: Catalogue,
        paid: Chronicle,
        at: TileCoords,
        through?: TileCoords,
      ) => Landed;
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
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: number) => Landed;
    }
  | {
      readonly aim: 'hand';
      readonly effect: (catalogue: Catalogue, paid: Chronicle, at: number) => Landed;
    };

/**
 * The noun a card names — the unit it puts on the map, the building it builds — is named by its
 * effect and nowhere else. A settle card aimed at a tile is asked its own reasons only of a tile
 * already charted.
 */
export type Card = {
  readonly cost: Partial<Resources>;
  readonly counters?: Counters;
  readonly becomes?: CardId;
} & (
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

/**
 * A civilization: its city section, and its deck in two sections, its settle cards, in hand on the
 * settle phase behind the city section's card, and its cards, which the draw pile cycles.
 */
export type Civilization = {
  readonly city: CitySection;
  readonly settle: readonly string[];
  readonly cards: readonly string[];
};

/** What a camp is, what it enters, and what its capture gives. */
export type Camp = {
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

/**
 * An achievement: its count on the chronicle and its tally, read toward its need, the technology it
 * earns, the influence it pays, and, for one that keeps a tally, the tally a command leaves it, read
 * off the chronicle the command started on, the stages it resolved as and the tally as it stood.
 */
export type Achievement = {
  readonly count: (catalogue: Catalogue, chronicle: Chronicle, tally: Tally) => number;
  readonly need: number;
  readonly technology: string;
  readonly influence: number;
  readonly tallies?: (
    catalogue: Catalogue,
    started: Chronicle,
    stages: readonly Stage[],
    tally: Tally,
  ) => Tally;
};

/**
 * A technology: the technologies it needs, and what it unlocks — cards, each with the copies added
 * to the collection, and at most one age.
 */
export type Technology = {
  readonly needs: readonly string[];
  readonly unlocks: { readonly cards: Readonly<Record<string, number>>; readonly age?: string };
};

/**
 * What an age owns: its schedule, its camp, its regions by key, its achievements by key in order, and
 * the base price of its cards.
 */
export type Age = {
  readonly basePrice: number;
  readonly schedule: Schedule;
  readonly camp: Camp;
  readonly regions: Readonly<Record<string, Region>>;
  readonly achievements: Readonly<Record<string, Achievement>>;
};

/**
 * The content a chronicle is played on, every entry named by its key: the tables every age shares,
 * and the ages in the order of history.
 */
export type Catalogue = MapContent & {
  readonly units: Readonly<Record<string, UnitStats>>;
  readonly scripts: Readonly<Record<string, EnemyScript>>;
  readonly cards: Readonly<Record<string, Card>>;
  readonly civilizations: Readonly<Record<string, Civilization>>;
  readonly events: Readonly<Record<string, ScheduledEvent>>;
  readonly capstones: Readonly<Record<string, Capstone>>;
  readonly technologies: Readonly<Record<string, Technology>>;
  readonly ages: Readonly<Record<string, Age>>;
  /** The age of every card of the cards table, by the card's id. */
  readonly cardAges: Readonly<Record<string, string>>;
};

/** The tables every age brings its content to. */
export type Tables = Omit<Catalogue, 'version' | 'ages' | 'cardAges'>;

/** The steps past the centre part's reach within which no region keeps its camps. */
export const FIRST_STEPS = 2;

/** One age's content: its id, what it owns, and what it brings to the tables every age shares. */
export type Slice = {
  readonly id: string;
  readonly owns: Age;
  readonly brings: Partial<Tables>;
};

/**
 * The catalogue built from the slices, in the order of history: each table the union of what they
 * bring, each card of its slice's age, and the ages table what each owns under its id. An id two
 * slices bring to one table, and an age two slices name, are refused before it is validated.
 */
export function merged(version: string, slices: readonly Slice[]): Catalogue {
  const ages: Record<string, Age> = {};
  for (const { id, owns } of slices) {
    if (Object.hasOwn(ages, id)) refuse({ version }, `two slices name the age ${id}`);
    ages[id] = owns;
  }
  const union = <Table extends keyof Tables>(table: Table) => {
    const entries: Record<string, unknown> = {};
    const broughtBy: Record<string, string> = {};
    for (const { id: age, brings } of slices) {
      for (const [id, entry] of Object.entries(brings[table] ?? {})) {
        if (Object.hasOwn(broughtBy, id)) {
          refuse(
            { version },
            `the ages ${broughtBy[id]} and ${age} both bring ${id} to the ${table}`,
          );
        }
        broughtBy[id] = age;
        entries[id] = entry;
      }
    }
    return { entries: entries as Tables[Table], broughtBy };
  };
  const cards = union('cards');
  return catalogued({
    version,
    units: union('units').entries,
    scripts: union('scripts').entries,
    cards: cards.entries,
    civilizations: union('civilizations').entries,
    events: union('events').entries,
    capstones: union('capstones').entries,
    technologies: union('technologies').entries,
    terrains: union('terrains').entries,
    biomes: union('biomes').entries,
    buildings: union('buildings').entries,
    features: union('features').entries,
    improvements: union('improvements').entries,
    ages,
    cardAges: cards.broughtBy,
  });
}

export function catalogued(content: Catalogue): Catalogue {
  for (const [id, kind] of Object.entries(content.units)) {
    if (kind.type !== id) refuse(content, `the unit kind ${id} names itself ${kind.type}`);
    for (const [stat, least] of Object.entries(LEAST_STATS) as [
      keyof typeof LEAST_STATS,
      number,
    ][]) {
      const value = kind[stat];
      if (!Number.isInteger(value) || value < least) {
        refuse(content, `the unit kind ${id} has a ${stat} of ${value}`);
      }
    }
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
      if (layer.terrains.length === 0) refuse(content, `the ${noun} ${id} names no terrain`);
      if (layer.features?.length === 0) {
        refuse(content, `the ${noun} ${id} names a feature list holding none`);
      }
      if (layer.movementCost !== undefined && layer.movementCost < 1) {
        refuse(content, `the ${noun} ${id} names a movement cost of ${layer.movementCost}`);
      }
      for (const feature of layer.features ?? []) {
        const { terrain } = featureKind(content, feature);
        if (!layer.terrains.includes(terrain)) {
          refuse(
            content,
            `the ${noun} ${id} names the feature ${feature}, which lies on ${terrain}, a terrain it does not name`,
          );
        }
      }
    }
  }
  const ages = Object.entries(content.ages);
  if (ages.length === 0) refuse(content, 'no age is held');
  for (const [id, age] of ages) ageHeld(content, id, age);
  treeHeld(content);
  for (const id of Object.keys(content.cards)) {
    if (!Object.hasOwn(content.cardAges, id)) refuse(content, `the card ${id} is of no age`);
    ageOf(content, content.cardAges[id]);
  }
  for (const id of Object.keys(content.cardAges)) cardOf(content, id);
  for (const { becomes } of Object.values(content.cards)) {
    if (becomes !== undefined) cardOf(content, becomes);
  }
  for (const [id, civilization] of Object.entries(content.civilizations)) {
    const { city } = civilization;
    const cityNames = groundNamed(buildingKind(content, city.building));
    if (cityNames !== undefined) {
      refuse(content, `the civilization ${id}'s city ${city.building} names ${cityNames}`);
    }
    if (city.sight < 0) refuse(content, `the civilization ${id}'s city sees ${city.sight}`);
    if (city.idle < 0) {
      refuse(content, `the civilization ${id}'s city opens with ${city.idle} idle`);
    }
    const sections = [
      ['city', [city.card]],
      ['settle', civilization.settle],
      ['cards', civilization.cards],
    ] as const;
    for (const [section, cards] of sections) {
      for (const card of cards) {
        const misfit = misfitIn(content, section, card);
        if (misfit !== undefined) refuse(content, `the civilization ${id} ${misfit}`);
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
  return content;
}

/** What one age owns, checked against the tables of the catalogue holding it. */
function ageHeld(
  content: Catalogue,
  id: string,
  { basePrice, schedule, camp, regions }: Age,
): void {
  if (!Number.isInteger(basePrice) || basePrice < 1) {
    refuse(content, `the age ${id} sets a base price of ${basePrice}`);
  }
  if (Object.keys(schedule.entries).length === 0) {
    refuse(content, `the age ${id}'s schedule deals no event`);
  }
  for (const entry of Object.keys(schedule.entries)) {
    const answers = Object.keys(eventOf(content, entry).answers).length;
    if (answers < 2) {
      refuse(content, `the age ${id}'s schedule deals ${entry}, which deals ${answers}`);
    }
  }
  capstoneOf(content, schedule.capstone.id);
  for (const [least, most] of [schedule.spacing, schedule.capstone.window]) {
    if (least < 1 || most < least) {
      refuse(content, `the age ${id}'s schedule rolls a span from ${least} to ${most}`);
    }
  }

  const campUnit = unitKind(content, camp.unit);
  enemyScript(content, camp.scripts.guard);
  enemyScript(content, camp.scripts.raider);
  if (camp.rewards.length === 0) refuse(content, `the age ${id}'s camp deals no reward`);
  for (const reward of camp.rewards) cardOf(content, reward);
  const { odds, raidCampOdds } = camp;
  if (!(odds >= 0 && odds <= 1)) refuse(content, `the age ${id}'s camp rolls at odds of ${odds}`);
  if (!(raidCampOdds >= 0 && raidCampOdds <= 1)) {
    refuse(content, `a raid of the age ${id} enters through a camp at odds of ${raidCampOdds}`);
  }
  const campKind = buildingKind(content, camp.building);
  const campNames = groundNamed(campKind);
  if (campNames !== undefined) {
    refuse(content, `the age ${id}'s camp ${camp.building} names ${campNames}`);
  }
  for (const terrain of campKind.terrains) {
    if (!standsOn(content, campUnit, false, { q: 0, r: 0, terrain, improvements: [] })) {
      refuse(content, `the age ${id}'s camp's unit ${camp.unit} cannot stand on ${terrain}`);
    }
  }

  const held = Object.entries(regions);
  if (held.length === 0) refuse(content, `the age ${id} holds no region`);
  for (const [name, region] of held) {
    biomeKind(content, region.centreBiome);
    biomeKind(content, region.rivers.source);
    for (const { biome, keepsAwayFrom = [] } of region.biomeShares) {
      biomeKind(content, biome);
      for (const kind of keepsAwayFrom) biomeKind(content, kind);
      if (keepsAwayFrom.includes(biome)) {
        refuse(content, `the region ${name} keeps its share of ${biome} away from ${biome}`);
      }
    }
    for (const { feature } of region.featureShares) featureKind(content, feature);
    const shared = sharedBiomes(region).map(({ biome }) => biome);
    for (const { biome } of region.biomeShares) {
      if (!shared.includes(biome))
        refuse(content, `the region ${name} deals its share of ${biome} no biome`);
    }
    const dealt = dealtBiomes(region);
    const leftover = dealt.length - shared.length;
    if (biomeKind(content, region.centreBiome).growth.kind === 'size' && leftover > 0) {
      refuse(
        content,
        `the region ${name} leaves ${leftover} biomes over its shares, and its centre kind ${region.centreBiome} is dealt to a size`,
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
        `the region ${name} deals sized biomes of ${sized} tiles on a disc of ${discTiles(region.radius)}`,
      );
    }
    const reach = region.centre + FIRST_STEPS;
    if (region.campFromCentre <= reach) {
      refuse(
        content,
        `the region ${name} keeps its camps ${region.campFromCentre} from the centre, within the first steps' reach of ${reach}`,
      );
    }
  }
}

/**
 * The features or the river a building names, in a refusal's words, and nothing where it names
 * neither: the settle and a camp's placing never ask the ground a layer goes on, so a city's or a
 * camp's building naming either is refused.
 */
function groundNamed({ features, river }: LayerKind): string | undefined {
  if (features !== undefined) return `the features ${features.join(', ')}`;
  return river === true ? 'the river' : undefined;
}

/** The technology tree, checked against the achievements every age owns. */
function treeHeld(content: Catalogue): void {
  const ownedBy = new Map<string, string>();
  const earnedBy = new Map<string, string>();
  /** Where the age of the achievement that earns a technology stands in the order of history. */
  const earnedIn = new Map<string, number>();
  const ages = Object.entries(content.ages);
  for (const [at, [age, { achievements }]] of ages.entries()) {
    for (const [id, { need, influence, technology }] of Object.entries(achievements)) {
      const owner = ownedBy.get(id);
      if (owner !== undefined) refuse(content, `the ages ${owner} and ${age} both own ${id}`);
      ownedBy.set(id, age);
      if (!Number.isInteger(need) || need < 1) {
        refuse(content, `the achievement ${id} needs a count of ${need}`);
      }
      if (!Number.isInteger(influence) || influence < 0) {
        refuse(content, `the achievement ${id} pays ${influence} influence`);
      }
      technologyOf(content, technology);
      const earner = earnedBy.get(technology);
      if (earner !== undefined) {
        refuse(content, `the technology ${technology} is earned by both ${earner} and ${id}`);
      }
      earnedBy.set(technology, id);
      earnedIn.set(technology, at);
    }
  }

  const unlockedBy = new Map<string, string>();
  for (const [id, { needs, unlocks }] of Object.entries(content.technologies)) {
    if (!earnedBy.has(id)) refuse(content, `the technology ${id} is earned by no achievement`);
    for (const need of needs) technologyOf(content, need);
    for (const [card, copies] of Object.entries(unlocks.cards)) {
      const unheld = heldByNoDeck(content, card);
      if (unheld !== undefined) refuse(content, `the technology ${id} unlocks ${unheld}`);
      if (!Number.isInteger(copies) || copies < 1) {
        refuse(content, `the technology ${id} unlocks ${copies} copies of ${card}`);
      }
    }
    if (unlocks.age === undefined) continue;
    ageOf(content, unlocks.age);
    const other = unlockedBy.get(unlocks.age);
    if (other !== undefined) {
      refuse(content, `the age ${unlocks.age} is unlocked by both ${other} and ${id}`);
    }
    unlockedBy.set(unlocks.age, id);
  }
  for (const [at, [age]] of ages.entries()) {
    const unlocker = unlockedBy.get(age);
    if (at === 0 && unlocker !== undefined) {
      refuse(content, `the first age ${age} is unlocked by ${unlocker}`);
    }
    if (at > 0 && unlocker === undefined) refuse(content, `the age ${age} is unlocked by nothing`);
  }

  const settled = new Set<string>();
  const needed = (id: string, path: readonly string[]): void => {
    if (settled.has(id)) return;
    if (path.includes(id)) {
      const ring = [...path.slice(path.indexOf(id)), id].join(' needs ');
      refuse(content, `the technology ${id} needs itself: ${ring}`);
    }
    for (const need of technologyOf(content, id).needs) needed(need, [...path, id]);
    settled.add(id);
  };
  for (const id of Object.keys(content.technologies)) needed(id, []);

  const placeOf = (id: string): number => {
    const at = earnedIn.get(id);
    if (at === undefined) refuse(content, `the technology ${id} is earned by no achievement`);
    return at;
  };
  for (const [id, { needs, unlocks }] of Object.entries(content.technologies)) {
    const own = placeOf(id);
    const [age] = ages[own];
    for (const need of needs) {
      const later = placeOf(need);
      if (later <= own) continue;
      refuse(
        content,
        `the technology ${id} of the age ${age} needs ${need} of the later age ${ages[later][0]}`,
      );
    }
    if (unlocks.age === undefined || unlocks.age === ages[own + 1]?.[0]) continue;
    refuse(
      content,
      `the technology ${id} of the age ${age} unlocks the age ${unlocks.age}, not the one after it`,
    );
  }
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
  return entryOf(catalogue, catalogue.units, id, 'unit kind');
}

/** A unit's full health: its kind's, read off the catalogue by the type the unit carries. */
export function fullHealth(catalogue: Catalogue, stats: UnitStats): number {
  return unitKind(catalogue, stats.type).health;
}

/** The script an enemy names; a script the catalogue does not hold is refused. */
export function enemyScript(catalogue: Catalogue, id: string): EnemyScript {
  return entryOf(catalogue, catalogue.scripts, id, 'enemy script');
}

/** The card an id names; a card the catalogue does not hold is refused. */
export function cardOf(catalogue: Catalogue, id: string): Card {
  return entryOf(catalogue, catalogue.cards, id, 'card');
}

/** The age a card is of: the age whose slice brought it. A card the catalogue does not hold is refused. */
export function cardAge(catalogue: Catalogue, id: string): string {
  return entryOf(catalogue, catalogue.cardAges, id, 'card');
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

/** The civilization an id names; a civilization the catalogue does not hold is refused. */
export function civilizationOf(catalogue: Catalogue, id: string): Civilization {
  return entryOf(catalogue, catalogue.civilizations, id, 'civilization');
}

/** The civilization the catalogue lists first. A catalogue listing none is refused. */
export function firstCivilization(catalogue: Catalogue): string {
  return firstListed(catalogue, catalogue.civilizations, 'civilization');
}

/** The age the catalogue lists first. A catalogue listing none is refused. */
export function firstAge(catalogue: Catalogue): string {
  return firstListed(catalogue, catalogue.ages, 'age');
}

/** The region the age lists first; an age the catalogue does not hold, or one listing none, is refused. */
export function firstRegion(catalogue: Catalogue, age: string): string {
  return firstListed(catalogue, ageOf(catalogue, age).regions, 'region');
}

function firstListed(
  catalogue: Catalogue,
  table: Readonly<Record<string, unknown>>,
  noun: string,
): string {
  const [first] = Object.keys(table);
  if (first === undefined) refuse(catalogue, `no ${noun} is listed`);
  return first;
}

/** A section of a civilization, by the name the civilization lists it under. */
export type CivilizationSection = keyof Civilization;

/**
 * A card no deck holds, named as what it is — a hazard, an age's camp's reward — and nothing for a
 * card a deck may hold. A card the catalogue does not hold is refused.
 */
export function heldByNoDeck(catalogue: Catalogue, card: CardId): string | undefined {
  if (cardOf(catalogue, card).kind === 'hazard') return `the hazard ${card}`;
  for (const [age, { camp }] of Object.entries(catalogue.ages)) {
    if (camp.rewards.includes(card)) return `the age ${age}'s camp's reward ${card}`;
  }
  return undefined;
}

/**
 * What keeps a card out of a section of a civilization, and nothing where it fits there: none holds
 * a card no deck holds, the cards no settle card, and the city and the settle section nothing else.
 * A card the catalogue does not hold is refused.
 */
export function misfitIn(
  catalogue: Catalogue,
  section: CivilizationSection,
  card: CardId,
): string | undefined {
  const unheld = heldByNoDeck(catalogue, card);
  if (unheld !== undefined) return `holds ${unheld}`;
  const { kind } = cardOf(catalogue, card);
  switch (section) {
    case 'cards':
      return kind === 'settle' ? `holds the settle card ${card} among its cards` : undefined;
    case 'city':
    case 'settle':
      return kind === 'settle' ? undefined : `holds the ${kind} ${card} in its ${section} section`;
  }
}

/** The event an id names; an event the catalogue does not hold is refused. */
export function eventOf(catalogue: Catalogue, id: string): ScheduledEvent {
  return entryOf(catalogue, catalogue.events, id, 'event');
}

/** The capstone an id names; a capstone the catalogue does not hold is refused. */
export function capstoneOf(catalogue: Catalogue, id: string): Capstone {
  return entryOf(catalogue, catalogue.capstones, id, 'capstone');
}

/** What the age an id names owns; an age the catalogue does not hold is refused. */
export function ageOf(catalogue: Catalogue, id: string): Age {
  return entryOf(catalogue, catalogue.ages, id, 'age');
}

/** The technology an id names; a technology the catalogue does not hold is refused. */
export function technologyOf(catalogue: Catalogue, id: string): Technology {
  return entryOf(catalogue, catalogue.technologies, id, 'technology');
}

/** The achievement an id names among an age's; one the age does not own is refused. */
export function achievementOf(catalogue: Catalogue, age: string, id: string): Achievement {
  return entryOf(catalogue, ageOf(catalogue, age).achievements, id, 'achievement');
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
 * its own copy of its kind's stats, and stands ashore with its move points and its action full.
 */
export function entered(catalogue: Catalogue, chronicle: Chronicle, entering: Entering): Landed {
  const stats = { ...unitKind(catalogue, entering.type) };
  const carried = {
    id: chronicle.nextUnit,
    stats,
    tile: entering.tile,
    movePoints: stats.move,
    action: stats.action,
    embarked: false,
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
