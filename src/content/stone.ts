import {
  builds,
  claimableTile,
  discarded,
  disembarks,
  embarks,
  enters,
  firstRefusal,
  gained,
  healed,
  healthLost,
  inside,
  placesImprovement,
  shocked,
} from '../rules/cards';
import type { Age, Card, Catalogue, Schedule, Slice } from '../rules/catalogue';
import {
  drawPileEmptied,
  gainedFrom,
  playsOn,
  terrainsPlayedOn,
  turnsPlaying,
  unitsKilledBy,
} from '../rules/chronicle';
import { arrived, bordered, populationTaken } from '../rules/city';
import { distance, MOVE_POINT, tileAt } from '../rules/map';
import type { BuildingKind, RiverFlow } from '../rules/map-kinds';
import {
  featureInside,
  featureRemovalInside,
  featuresRemovedInside,
  type Removal,
  removalInside,
  removedInside,
  rewarded,
  showsNextLanding,
  terraformedInside,
} from '../rules/schedule';
import { followed, type Landed, unchanged } from '../rules/stages';
import type { Chronicle } from '../rules/state';
import { NOMADIC } from './nomadic';
import { NEUTRAL_GUARD, NEUTRAL_WAVE, NEUTRAL_WORKER, PILLAGER, VILLAGER } from './scripts';

const { basePrice, camp } = NOMADIC.owns;

const NOMADIC_BIOMES = NOMADIC.brings.biomes;
if (NOMADIC_BIOMES === undefined) throw new Error('the Nomadic Age brings no biome');
const { land, sea } = NOMADIC_BIOMES;

/** The Nomadic Age's trophy of that id. */
function nomadicTrophy(id: string): Extract<Card, { readonly kind: 'trophy' }> {
  const card = NOMADIC.brings.cards?.[id];
  if (card?.kind !== 'trophy') throw new Error(`the Nomadic Age brings no trophy ${id}`);
  return card;
}

const RIVERS: RiverFlow = {
  source: 'mountain',
  relief: 1,
  roughness: 0.5,
  perRange: 2,
  climb: 0.5,
  meander: 1.5,
  curl: 0.75,
  edgesPerTile: 4,
  leastEdges: 6,
  draws: 60,
};

const TEMPERATE_SCHEDULE: Schedule = {
  spacing: [5, 8],
  window: [26, 34],
  capstones: ['first-shelter'],
  entries: {
    'rival-band': 1,
    wildfire: 1,
    herd: 1 / 3,
    departure: 1,
    flood: 1,
    'bad-air': 1,
    strangers: 1,
    predators: 1,
    drought: 1,
    travellers: 1 / 3,
  },
};

const ARCHIPELAGO_SCHEDULE: Schedule = {
  spacing: [5, 8],
  window: [26, 34],
  capstones: ['first-shelter'],
  entries: {
    'rival-band': 1,
    wildfire: 1,
    herd: 1 / 3,
    departure: 1,
    flood: 1,
    'bad-air': 1,
    strangers: 1,
    predators: 1,
    drought: 1,
    travellers: 1 / 3,
  },
};

/** How many things inside the border the flood removes on this turn: one, and one more for every ten turns. */
function floodRemoves(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/** What the flood would take on the chronicle as it stands. */
function floodTakes(chronicle: Chronicle): Removal {
  return removalInside(chronicle, floodRemoves(chronicle.turn));
}

/** The production digging channels costs: three for each thing the flood would take, the city counted. */
function channels(chronicle: Chronicle): number {
  const { improvements, buildings, city } = floodTakes(chronicle);
  return 3 * (improvements + buildings + city);
}

/** How many population the sickness kills on this turn: one, and one more for every ten turns. */
function sicknessKills(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/** The science helping the healers costs: two for each population the sickness would kill. */
function healers(chronicle: Chronicle): number {
  return 2 * sicknessKills(chronicle.turn);
}

/** The population the sickness kills on this turn taken from the player's city, one after another. */
function buried(chronicle: Chronicle): Landed {
  const kills = sicknessKills(chronicle.turn);
  let landing = unchanged(chronicle);
  for (let killed = 0; killed < kills; killed++) {
    landing = followed(landing, (left) => populationTaken(left, 'player'));
  }
  return landing;
}

/** How many population the strangers bring on this turn: one, and one more for every ten turns. */
function strangersArrive(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/** The strangers' population arrived idle one after another, then their challenge added. */
function takenIn(catalogue: Catalogue, chronicle: Chronicle): Landed {
  const brought = strangersArrive(chronicle.turn);
  let landing = unchanged(chronicle);
  for (let arrival = 0; arrival < brought; arrival++) {
    landing = followed(landing, (left) => arrived(left, 'player'));
  }
  return followed(landing, (left) => rewarded(catalogue, left, 'misunderstandings', 1));
}

/** The features the wolves take inside the border. */
const DEER_AND_CATTLE = ['deer', 'cattle'];

/** How many herds the wolves take on this turn: one, and one more for every ten turns. */
function wolvesTake(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/** The military defending the herds costs: three for each herd the wolves would take, whatever the border holds. */
function defence(chronicle: Chronicle): number {
  return 3 * wolvesTake(chronicle.turn);
}

/** The terrains the drought dries inside the border. */
const PLAIN_AND_FOREST = ['plain', 'forest'];

/** How hard the drought bites on this turn: one, and one more for every five turns. */
function droughtBites(turn: number): number {
  return 1 + Math.floor(turn / 5);
}

/** The food rationing costs, and the money buying grain costs: two for each the drought bites. */
function shortfall(chronicle: Chronicle): number {
  return 2 * droughtBites(chronicle.turn);
}

/** How much the travellers give on this turn: two, and one more for every ten turns. */
function travellersGive(turn: number): number {
  return 2 + Math.floor(turn / 10);
}

/** The money trading with the travellers gains: two for each they give. */
function traded(chronicle: Chronicle): number {
  return 2 * travellersGive(chronicle.turn);
}

const REGIONS: Age['regions'] = {
  temperate: {
    radius: 12,
    centre: 3,
    tilesPerBiome: 30,
    centreBiome: 'heartland',
    biomeShares: [
      { biome: 'sea', share: 0.2 },
      { biome: 'mountain', share: 0.1 },
      { biome: 'woodland', share: 0.1 },
      { biome: 'desert', share: 0.07, keepsAwayFrom: ['sea'] },
      { biome: 'land', share: 0.53 },
    ],
    featureShares: [
      { feature: 'fertile', share: 0.05 },
      { feature: 'deer', share: 0.05 },
      { feature: 'cattle', share: 0.05 },
      { feature: 'flint', share: 0.1 },
      { feature: 'oasis', share: 0.05 },
    ],
    camps: 5,
    campFromCentre: 7,
    campsApart: 4,
    sites: ['painted-cave', 'old-cairn', 'beast-bones'],
    siteFromCentre: 7,
    sitesApart: 4,
    neutralFromCentre: { least: 7, most: 9 },
    rivers: RIVERS,
    schedule: TEMPERATE_SCHEDULE,
  },
  archipelago: {
    radius: 12,
    centre: 3,
    tilesPerBiome: 25,
    centreBiome: 'heartland',
    biomeShares: [
      { biome: 'island', share: 0.5 },
      { biome: 'open-sea', share: 0.33 },
      { biome: 'shallows', share: 0.17 },
    ],
    featureShares: [
      { feature: 'fertile', share: 0.05 },
      { feature: 'deer', share: 0.05 },
      { feature: 'cattle', share: 0.05 },
      { feature: 'flint', share: 0.1 },
    ],
    camps: 5,
    campFromCentre: 7,
    campsApart: 4,
    sites: ['painted-cave', 'old-cairn', 'beast-bones'],
    siteFromCentre: 7,
    sitesApart: 4,
    neutralFromCentre: { least: 5, most: 8 },
    rivers: RIVERS,
    schedule: ARCHIPELAGO_SCHEDULE,
  },
};

const VILLAGE: BuildingKind = {
  terrains: ['plain', 'forest', 'hills', 'desert'],
  yields: { military: 1, culture: 1 },
};

/** The move a unit has embarked: the Embark card's and the camp's enemies' alike. */
const EMBARKED_MOVE = MOVE_POINT;

/** The Stone Age: what it owns, and what it brings to the tables every age shares. */
export const STONE: Slice = {
  id: 'stone',
  owns: {
    basePrice,
    camp: {
      ...camp,
      building: 'stone-camp',
      opening: [{ kind: 'warrior', script: 'guard', weight: 1 }],
      roll: [
        { kind: 'archer', script: 'guard', weight: 2 },
        { kind: 'warrior', script: 'guard', weight: 3 },
        { kind: 'warrior', script: 'pillager', weight: 1 },
      ],
      rewards: { 'stone-stores': 1, 'stone-band-joins': 1 },
      odds: 0.08,
      acrossWater: true,
      embarkedMove: EMBARKED_MOVE,
      wave: { gathered: 3, sent: 2 },
    },
    neutral: {
      building: 'neutral-village',
      script: VILLAGER,
      scripts: { guard: 'neutral-guard', wave: 'neutral-wave' },
      ratio: [
        { card: 'warrior', kind: 'warrior', share: 2 },
        { card: 'archer', kind: 'archer', share: 1 },
        { card: 'worker', kind: 'worker', share: 1 },
      ],
      wave: { gathered: 6, sent: 3 },
      workers: {
        script: 'neutral-worker',
        cards: ['farm', 'clay-pit', 'irrigation', 'pasture', 'trapping'],
      },
      rewards: { 'stone-band-joins': 3, 'their-land': 3, 'their-stores': 3 },
    },
    sites: {
      'painted-cave': {
        building: 'stone-painted-cave',
        rewards: { 'stone-cave-paintings': 1, 'old-stories': 1 },
      },
      'old-cairn': {
        building: 'stone-old-cairn',
        rewards: { 'stone-honour-the-dead': 1, 'dig-the-graves': 1 },
      },
      'beast-bones': {
        building: 'stone-beast-bones',
        rewards: { 'stone-bone-carvings': 1, 'bone-tools': 1 },
      },
    },
    regions: REGIONS,
    achievements: {
      herbalism: {
        ...terrainsPlayedOn('gather'),
        need: 4,
        technology: 'herbalism',
        influence: 1,
      },
      agriculture: {
        count: (_catalogue, chronicle) =>
          chronicle.held.filter((coord) => tileAt(chronicle.tiles, coord)?.terrain === 'plain')
            .length,
        need: 5,
        technology: 'agriculture',
        influence: 1,
      },
      trapping: {
        ...playsOn('hunt', { on: 'anywhere' }),
        need: 6,
        technology: 'trapping',
        influence: 1,
      },
      fire: { ...turnsPlaying(5), need: 3, technology: 'fire', influence: 1 },
      irrigation: {
        ...playsOn('farm', { on: 'river' }),
        need: 2,
        technology: 'irrigation',
        influence: 1,
      },
      domestication: {
        ...playsOn('gather', { on: 'feature', feature: 'cattle' }),
        need: 10,
        technology: 'domestication',
        influence: 1,
      },
      'bow-and-arrow': {
        ...unitsKilledBy('scout'),
        need: 3,
        technology: 'bow-and-arrow',
        influence: 1,
      },
      pottery: {
        ...gainedFrom('production', 'hills'),
        need: 50,
        technology: 'pottery',
        influence: 1,
      },
      calendar: { ...drawPileEmptied(), need: 12, technology: 'calendar', influence: 1 },
      bread: {
        count: (_catalogue, chronicle) => chronicle.population,
        need: 12,
        technology: 'bread',
        influence: 1,
      },
      tanning: {
        count: (_catalogue, chronicle) =>
          chronicle.held.filter((coord) =>
            tileAt(chronicle.tiles, coord)?.improvements.some(
              (improvement) => improvement === 'pasture' || improvement === 'trapping',
            ),
          ).length,
        need: 2,
        technology: 'tanning',
        influence: 1,
      },
      raft: {
        count: (_catalogue, chronicle) =>
          chronicle.snapshots.filter((snapshot) => snapshot.tile.terrain === 'coast').length,
        need: 30,
        technology: 'raft',
        influence: 1,
      },
      megalith: {
        count: (_catalogue, chronicle) => {
          const { city } = chronicle;
          if (city === undefined) return 0;
          return Math.max(...chronicle.held.map((coord) => distance(coord, city)));
        },
        need: 5,
        technology: 'megalith',
        influence: 1,
      },
      bartering: {
        count: (_catalogue, chronicle) => chronicle.resources.money,
        need: 30,
        technology: 'bartering',
        influence: 1,
      },
      fishing: {
        ...gainedFrom('food', 'coast'),
        need: 50,
        technology: 'fishing',
        influence: 1,
      },
    },
  },
  brings: {
    units: {
      archer: {
        type: 'archer',
        worker: false,
        health: 3,
        damage: 2,
        range: 2,
        move: 2 * MOVE_POINT,
        action: 1,
        sight: 2,
      },
    },
    scripts: {
      pillager: PILLAGER,
      'neutral-guard': NEUTRAL_GUARD,
      'neutral-wave': NEUTRAL_WAVE,
      'neutral-worker': NEUTRAL_WORKER,
    },
    cards: {
      farm: {
        kind: 'building',
        cost: { production: 4 },
        ...builds('farm'),
      },
      trapping: { kind: 'action', cost: { production: 2 }, ...placesImprovement('trapping') },
      irrigation: { kind: 'action', cost: { production: 2 }, ...placesImprovement('irrigation') },
      pasture: { kind: 'action', cost: { production: 2 }, ...placesImprovement('pasture') },
      archer: { kind: 'unit', cost: { military: 2 }, ...enters('archer') },
      'clay-pit': { kind: 'action', cost: { production: 2 }, ...placesImprovement('clay-pit') },
      calendar: { kind: 'instant', cost: { science: 2 }, ...showsNextLanding() },
      bread: {
        kind: 'instant',
        cost: { food: 2 },
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 2 }),
      },
      tannery: {
        kind: 'building',
        cost: { production: 4 },
        ...builds('tannery'),
      },
      fire: {
        kind: 'instant',
        cost: {},
        aim: 'hand',
        effect: (_catalogue, paid, at) =>
          followed(discarded(paid, [at]), (left) => gained(left, { science: 1 })),
      },
      heal: {
        kind: 'instant',
        cost: { food: 2 },
        aim: 'unit',
        refuses: (catalogue, chronicle, tile) =>
          firstRefusal(inside(chronicle, tile, 'player'), healthLost(catalogue, chronicle, tile)),
        effect: (catalogue, paid, at) => healed(catalogue, paid, at),
      },
      embark: {
        kind: 'action',
        cost: { production: 1 },
        becomes: 'disembark',
        ...embarks(EMBARKED_MOVE),
      },
      disembark: { kind: 'action', cost: {}, becomes: 'embark', ...disembarks() },
      'food-trade': {
        kind: 'instant',
        cost: { money: 2 },
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { food: 3 }),
      },
      'goods-trade': {
        kind: 'instant',
        cost: { money: 2 },
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { production: 3 }),
      },
      fishery: {
        kind: 'building',
        cost: { production: 4 },
        ...builds('fishery'),
      },
      megalith: {
        kind: 'building',
        cost: { production: 4 },
        ...builds('megalith'),
      },
      'stone-cave-paintings': {
        kind: 'trophy',
        cost: {},
        influence: 1,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 4 }),
      },
      'old-stories': {
        kind: 'instant',
        cost: {},
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 1 }),
      },
      'stone-honour-the-dead': {
        kind: 'trophy',
        cost: {},
        influence: 1,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 4 }),
      },
      'dig-the-graves': {
        kind: 'trophy',
        cost: {},
        influence: 1,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { money: 4 }),
      },
      'stone-bone-carvings': {
        kind: 'trophy',
        cost: {},
        influence: 1,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 4 }),
      },
      'bone-tools': {
        kind: 'instant',
        cost: {},
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { production: 2 }),
      },
      'stone-stores': { ...nomadicTrophy('stores'), influence: 1 },
      'stone-band-joins': { ...nomadicTrophy('band-joins'), influence: 1 },
      'their-land': {
        kind: 'trophy',
        cost: {},
        influence: 1,
        aim: 'tile',
        refuses: claimableTile,
        effect: (_catalogue, paid, at) => bordered(paid, 'player', at),
      },
      'their-stores': {
        kind: 'trophy',
        cost: {},
        influence: 1,
        aim: 'none',
        effect: (_catalogue, paid) =>
          gained(paid, { food: 2, production: 2, military: 2, money: 2, science: 2 }),
      },
      floodplain: {
        kind: 'challenge',
        cost: {},
        influence: 3,
        strikes: (_catalogue, chronicle) => removedInside(chronicle, 1),
      },
      sickness: {
        kind: 'challenge',
        cost: {},
        influence: 3,
        strikes: (_catalogue, chronicle) => populationTaken(chronicle, 'player'),
      },
      misunderstandings: {
        kind: 'challenge',
        cost: {},
        influence: 3,
        strikes: (_catalogue, chronicle) => shocked(chronicle, 'culture', 3),
      },
      wolves: {
        kind: 'challenge',
        cost: {},
        influence: 3,
        strikes: (_catalogue, chronicle) => populationTaken(chronicle, 'player'),
      },
      'rain-dance': {
        kind: 'challenge',
        cost: {},
        influence: 3,
        strikes: (catalogue, chronicle) =>
          terraformedInside(catalogue, chronicle, PLAIN_AND_FOREST, 'desert', 1),
      },
    },
    events: {
      departure: {
        answers: {
          'let-them-go': {
            cost: {},
            reads: () => ({}),
            lands: (_catalogue, chronicle) => populationTaken(chronicle, 'player'),
          },
          'keep-them': {
            cost: (_catalogue, chronicle) => ({ culture: chronicle.population }),
            reads: (_catalogue, chronicle) => ({ culture: chronicle.population }),
            lands: (_catalogue, chronicle) => unchanged(chronicle),
          },
        },
      },
      flood: {
        answers: {
          'lose-the-fields': {
            cost: {},
            reads: (_catalogue, chronicle) => floodTakes(chronicle),
            lands: (_catalogue, chronicle) =>
              removedInside(chronicle, floodRemoves(chronicle.turn)),
          },
          'settle-the-floodplain': {
            cost: {},
            reads: () => ({}),
            lands: (catalogue, chronicle) => rewarded(catalogue, chronicle, 'floodplain', 1),
          },
          'dig-channels': {
            cost: (_catalogue, chronicle) => ({ production: channels(chronicle) }),
            reads: (_catalogue, chronicle) => ({ production: channels(chronicle) }),
            lands: (_catalogue, chronicle) => unchanged(chronicle),
          },
        },
      },
      'bad-air': {
        answers: {
          'bury-the-dead': {
            cost: {},
            reads: (_catalogue, chronicle) => ({ population: sicknessKills(chronicle.turn) }),
            lands: (_catalogue, chronicle) => buried(chronicle),
          },
          'live-with-it': {
            cost: {},
            reads: () => ({}),
            lands: (catalogue, chronicle) => rewarded(catalogue, chronicle, 'sickness', 1),
          },
          'help-the-healers': {
            cost: (_catalogue, chronicle) => ({ science: healers(chronicle) }),
            reads: (_catalogue, chronicle) => ({ science: healers(chronicle) }),
            lands: (_catalogue, chronicle) => unchanged(chronicle),
          },
        },
      },
      strangers: {
        answers: {
          'take-them-in': {
            cost: {},
            reads: (_catalogue, chronicle) => ({ population: strangersArrive(chronicle.turn) }),
            lands: (catalogue, chronicle) => takenIn(catalogue, chronicle),
          },
          'refuse-them': {
            cost: {},
            reads: () => ({}),
            lands: (_catalogue, chronicle) => unchanged(chronicle),
          },
        },
      },
      predators: {
        answers: {
          'abandon-a-herd': {
            cost: {},
            blocked: (catalogue, chronicle) =>
              featureInside(catalogue, chronicle, DEER_AND_CATTLE) ? [] : ['no-deer-or-cattle'],
            reads: (catalogue, chronicle) =>
              featureRemovalInside(
                catalogue,
                chronicle,
                DEER_AND_CATTLE,
                wolvesTake(chronicle.turn),
              ),
            lands: (catalogue, chronicle) =>
              featuresRemovedInside(
                catalogue,
                chronicle,
                DEER_AND_CATTLE,
                wolvesTake(chronicle.turn),
              ),
          },
          'let-the-farmers-handle-it': {
            cost: {},
            reads: () => ({}),
            lands: (catalogue, chronicle) => rewarded(catalogue, chronicle, 'wolves', 1),
          },
          'defend-the-herds': {
            cost: (_catalogue, chronicle) => ({ military: defence(chronicle) }),
            reads: (_catalogue, chronicle) => ({ military: defence(chronicle) }),
            lands: (_catalogue, chronicle) => unchanged(chronicle),
          },
        },
      },
      drought: {
        answers: {
          'rain-dance': {
            cost: {},
            reads: () => ({}),
            lands: (catalogue, chronicle) => rewarded(catalogue, chronicle, 'rain-dance', 1),
          },
          rationing: {
            cost: (_catalogue, chronicle) => ({ food: shortfall(chronicle) }),
            reads: (_catalogue, chronicle) => ({ food: shortfall(chronicle) }),
            lands: (_catalogue, chronicle) => unchanged(chronicle),
          },
          'buy-grain': {
            cost: (_catalogue, chronicle) => ({ money: shortfall(chronicle) }),
            reads: (_catalogue, chronicle) => ({ money: shortfall(chronicle) }),
            lands: (_catalogue, chronicle) => unchanged(chronicle),
          },
        },
      },
      travellers: {
        answers: {
          'trade-with-them': {
            cost: {},
            reads: (_catalogue, chronicle) => ({ money: traded(chronicle) }),
            lands: (_catalogue, chronicle) => gained(chronicle, { money: traded(chronicle) }),
          },
          'share-stories': {
            cost: {},
            reads: (_catalogue, chronicle) => ({ culture: travellersGive(chronicle.turn) }),
            lands: (_catalogue, chronicle) =>
              gained(chronicle, { culture: travellersGive(chronicle.turn) }),
          },
        },
      },
    },
    technologies: {
      herbalism: { needs: ['settlement'], unlocks: { cards: { heal: 1 } } },
      agriculture: { needs: ['settlement'], unlocks: { cards: { farm: 1 } } },
      trapping: { needs: ['settlement'], unlocks: { cards: { trapping: 1 } } },
      fire: { needs: ['settlement'], unlocks: { cards: { fire: 1 } } },
      irrigation: { needs: ['agriculture', 'herbalism'], unlocks: { cards: { irrigation: 1 } } },
      domestication: { needs: ['trapping', 'agriculture'], unlocks: { cards: { pasture: 1 } } },
      'bow-and-arrow': { needs: ['trapping'], unlocks: { cards: { archer: 1 } } },
      pottery: { needs: ['fire'], unlocks: { cards: { 'clay-pit': 1 } } },
      calendar: { needs: ['irrigation'], unlocks: { cards: { calendar: 1 } } },
      bread: { needs: ['irrigation'], unlocks: { cards: { bread: 1 } } },
      tanning: { needs: ['domestication'], unlocks: { cards: { tannery: 1 } } },
      raft: {
        needs: ['bow-and-arrow'],
        unlocks: { cards: { embark: 1 }, region: 'archipelago' },
      },
      megalith: { needs: ['calendar'], unlocks: { cards: { megalith: 1 } } },
      bartering: {
        needs: ['tanning', 'bread'],
        unlocks: { cards: { 'food-trade': 1, 'goods-trade': 1 } },
      },
      fishing: { needs: ['raft'], unlocks: { cards: { fishery: 1 } } },
    },
    terrains: {
      desert: {
        yields: {},
        movementCost: MOVE_POINT,
        water: false,
        elevation: 0,
      },
    },
    features: {
      oasis: { terrain: 'desert', yields: { food: 1 } },
    },
    buildings: {
      village: VILLAGE,
      'neutral-village': VILLAGE,
      'stone-camp': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
      farm: { terrains: ['plain'], yields: { food: 2 } },
      tannery: {
        terrains: ['forest', 'plain'],
        features: ['deer', 'cattle'],
        yields: { money: 2 },
      },
      fishery: {
        terrains: ['coast'],
        yields: {},
        givesBeside: { terrain: 'coast', yields: { food: 1 } },
      },
      megalith: { terrains: ['plain', 'hills', 'desert'], yields: { culture: 1 } },
      'stone-painted-cave': { terrains: ['hills'], yields: {} },
      'stone-old-cairn': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
      'stone-beast-bones': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
    },
    improvements: {
      trapping: { terrains: ['forest'], features: ['deer'], yields: { food: 1 } },
      irrigation: { terrains: ['plain', 'desert'], river: true, yields: { food: 1 } },
      pasture: { terrains: ['plain'], features: ['cattle'], yields: { food: 1 } },
      'clay-pit': { terrains: ['hills'], yields: { production: 1 } },
    },
    biomes: {
      desert: {
        origin: 'desert',
        interior: { desert: 0.9, hills: 0.1 },
        rim: { desert: 0.9, hills: 0.1 },
        rimWidths: [1],
        growth: { kind: 'weight', weight: 1 },
        compactness: 1,
      },
      island: {
        origin: 'plain',
        interior: land.interior,
        rim: land.rim,
        rimWidths: [1],
        growth: { kind: 'size', size: 8 },
        compactness: 2,
      },
      'open-sea': {
        origin: 'ocean',
        interior: { ocean: 1 },
        rim: { coast: 1 },
        rimWidths: sea.rimWidths,
        growth: sea.growth,
        compactness: 0,
      },
      shallows: {
        origin: 'coast',
        interior: { coast: 1 },
        rim: { coast: 1 },
        rimWidths: [1],
        growth: { kind: 'weight', weight: 1 },
        compactness: -3,
      },
    },
  },
};
