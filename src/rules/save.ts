import {
  type Campaign,
  type CampaignCard,
  type CampaignCivilization,
  dealt,
  FIRST_CARD_NUMBER,
  newCampaign,
  type Payment,
  paidInto,
} from './campaign';
import {
  achievementOf,
  ageOf,
  type Catalogue,
  capstoneOf,
  cardMade,
  cardOf,
  checkContent,
  civilizationOf,
  enemyScript,
  eventOf,
  firstCivilization,
  misfitIn,
  unitKind,
} from './catalogue';
import type { Corner, Tile, TileCoords } from './map';
import {
  buildingKind,
  featureKind,
  improvementKind,
  refusal,
  refuse,
  regionOf,
  terrainKind,
} from './map-kinds';
import { RESOURCES, type Resources } from './resources';
import type { Rng } from './rng';
import type {
  CardId,
  Chronicle,
  ChronicleCard,
  CitySection,
  Deal,
  DefeatCause,
  Ending,
  Snapshot,
  SnapshotUnit,
  Timeline,
} from './state';
import { type Faction, FIRST_UNIT_NUMBER, LEAST_STATS, type Unit, type UnitStats } from './units';

/** A chronicle's save: the chronicle, the region of its age it was launched on, by id, and the campaign's civilization, by name. */
export type ChronicleSave = {
  readonly chronicle: Chronicle;
  readonly region: string;
  readonly civilization: string;
};

/**
 * What a save's text reads as: the campaign, the chronicle in progress, each nothing where it could
 * not be read, and the reason for everything dropped on the way.
 */
export type SaveRead = {
  readonly campaign?: Campaign;
  readonly chronicle?: ChronicleSave;
  readonly dropped: readonly string[];
};

/**
 * A save as text: the campaign, beside the chronicle in progress where one is. One the reading would
 * drop anything of is refused, so a written save always reads back whole.
 */
export function writeSave(
  catalogue: Catalogue,
  campaign: Campaign,
  progress?: ChronicleSave,
): string {
  const text = JSON.stringify(
    progress === undefined
      ? { campaign }
      : {
          campaign,
          chronicle: progress.chronicle,
          region: progress.region,
          civilization: progress.civilization,
        },
  );
  const [reason] = readSave(catalogue, text).dropped;
  if (reason !== undefined) throw new Error(reason);
  return text;
}

/**
 * The save the text holds, read against the catalogue, each part with its own fate: the chronicle
 * whole or dropped, the campaign refused for its shape alone. A field no shape names goes unread.
 */
export function readSave(catalogue: Catalogue, text: string): SaveRead {
  const dropped: string[] = [];
  const field = kept(dropped, () => record(catalogue, { raw: parsed(catalogue, text), at: '' }));
  if (field === undefined) return { dropped };
  const campaign = kept(dropped, () => campaignOf(catalogue, field('campaign')));
  dropped.push(...(campaign?.dropped ?? []));
  const progress = field('chronicle');
  const standing = (): Campaign =>
    campaign?.campaign ?? newCampaign(catalogue, firstCivilization(catalogue));
  const chronicle =
    progress.raw === undefined
      ? undefined
      : kept(dropped, () => chronicleSaveOf(catalogue, progress, field, standing()));
  return { campaign: campaign?.campaign, chronicle, dropped };
}

/**
 * What a save keeps after a command: the campaign beside the chronicle, or, where the chronicle has
 * ended, the campaign it paid into, the payment, and no chronicle.
 */
export type Kept = {
  readonly campaign: Campaign;
  readonly chronicle?: ChronicleSave;
  readonly payment?: Payment;
};

/** The campaign and the chronicle as a save keeps them after a command. */
export function keptAfter(catalogue: Catalogue, campaign: Campaign, progress: ChronicleSave): Kept {
  if (progress.chronicle.ending === undefined) return { campaign, chronicle: progress };
  const payment = paidInto(catalogue, campaign, progress.chronicle);
  return { campaign: payment.campaign, payment };
}

function parsed(catalogue: Catalogue, text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return refuse(catalogue, 'the save is not JSON');
  }
}

/** What a read answers, and nothing where it is refused, the refusal kept among the reasons. */
function kept<T>(dropped: string[], read: () => T): T | undefined {
  try {
    return read();
  } catch (error) {
    dropped.push(error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/**
 * The chronicle part of a save, its civilization named among the campaign's that stands. An ended
 * chronicle is refused.
 */
function chronicleSaveOf(
  catalogue: Catalogue,
  slot: Slot,
  field: (name: string) => Slot,
  campaign: Campaign,
): ChronicleSave {
  const chronicle = chronicleOf(catalogue, slot);
  if (chronicle.ending !== undefined) refused(catalogue, slot, 'has ended');
  const age = ageOf(catalogue, chronicle.age);
  const region = id(catalogue, field('region'), (held, named) => regionOf(held, age, named));
  const civilizationSlot = field('civilization');
  const civilization = string(catalogue, civilizationSlot);
  if (!Object.hasOwn(campaign.civilizations, civilization)) {
    refused(
      catalogue,
      civilizationSlot,
      `names no civilization of the campaign named ${civilization}`,
    );
  }
  return { chronicle, region, civilization };
}

/** One value of the parsed text, and where in the save it stands. */
type Slot = { readonly raw: unknown; readonly at: string };

function where({ at }: Slot): string {
  return at === '' ? 'the save' : `the save's ${at}`;
}

function refused(catalogue: Catalogue, slot: Slot, reason: string): never {
  return refuse(catalogue, `${where(slot)} ${reason}`);
}

/**
 * The campaign part of a save, and the reasons for what the catalogue could not resolve of it. A card
 * number below the first, held twice or not below the next number is its shape broken, and so is a
 * next number below the first, a negative influence, sight or idle, and no civilization held.
 */
function campaignOf(
  catalogue: Catalogue,
  slot: Slot,
): { readonly campaign: Campaign; readonly dropped: readonly string[] } {
  const dropped: string[] = [];
  const stands = (item: Slot, misfit: string | undefined): boolean => {
    if (misfit === undefined) return true;
    dropped.push(refusal(catalogue, `${where(item)} ${misfit}`));
    return false;
  };
  const field = record(catalogue, slot);
  let nextCard = count(
    catalogue,
    field('nextCard'),
    slot,
    (next) => `holds the next number ${next}, below the first number ${FIRST_CARD_NUMBER}`,
    FIRST_CARD_NUMBER,
  );
  const cardIn = (item: Slot): { readonly slot: Slot; readonly card: CampaignCard } => {
    const held = record(catalogue, item);
    const number = count(
      catalogue,
      held('number'),
      item,
      (below) => `is numbered ${below}, below the first number ${FIRST_CARD_NUMBER}`,
      FIRST_CARD_NUMBER,
    );
    return { slot: item, card: { number, id: string(catalogue, held('id')) } };
  };
  const collection = list(catalogue, field('collection'), cardIn);
  const civilizationsSlot = field('civilizations');
  const civilizationsHeld = record(catalogue, civilizationsSlot);
  const names = Object.keys(object(catalogue, civilizationsSlot));
  if (names.length === 0) refused(catalogue, civilizationsSlot, 'holds no civilization');
  const civilizations = names.map((name) => {
    const civilization = record(catalogue, civilizationsHeld(name));
    const citySlot = civilization('city');
    const city = record(catalogue, citySlot);
    const numbered = (section: 'settle' | 'cards'): { slot: Slot; number: number }[] =>
      list(catalogue, civilization(section), (item) => ({
        slot: item,
        number: integer(catalogue, item),
      }));
    return {
      name,
      citySlot,
      cityCard: cardIn(city('card')),
      section: {
        building: string(catalogue, city('building')),
        ...cityCounts(catalogue, citySlot, city),
      },
      settle: numbered('settle'),
      cards: numbered('cards'),
    };
  });
  const technologies = list(catalogue, field('technologies'), (item) => ({
    slot: item,
    id: string(catalogue, item),
  }));
  const influence = count(catalogue, field('influence'), slot, (held) => `holds ${held} influence`);

  dealtOnce(
    catalogue,
    [...civilizations.map(({ cityCard }) => cityCard), ...collection].map(
      ({ slot: item, card }) => ({ slot: item, number: card.number }),
    ),
    nextCard,
    { next: 'the next number', holder: 'card' },
  );

  const unlocked: string[] = [];
  for (const { slot: item, id: technology } of technologies) {
    const misfit = !Object.hasOwn(catalogue.technologies, technology)
      ? `names no technology ${technology}`
      : unlocked.includes(technology)
        ? `names the technology ${technology} a second time`
        : undefined;
    if (stands(item, misfit)) unlocked.push(technology);
  }

  const owned = new Map<number, CardId>();
  for (const { slot: item, card } of collection) {
    if (
      stands(item, Object.hasOwn(catalogue.cards, card.id) ? undefined : `names no card ${card.id}`)
    ) {
      owned.set(card.number, card.id);
    }
  }

  const held: [string, CampaignCivilization][] = [];
  for (const { name, citySlot, cityCard, section, settle, cards } of civilizations) {
    const named = new Set<number>();
    const sectionOf = (
      kind: 'settle' | 'cards',
      numbers: readonly { slot: Slot; number: number }[],
    ): number[] =>
      numbers.flatMap(({ slot: item, number }) => {
        const card = owned.get(number);
        const misfit =
          card === undefined
            ? `names no card of the collection numbered ${number}`
            : named.has(number)
              ? `names the card numbered ${number} a second time`
              : misfitIn(catalogue, kind, card);
        if (!stands(item, misfit)) return [];
        named.add(number);
        return [number];
      });
    const settleHeld = sectionOf('settle', settle);
    const cardsHeld = sectionOf('cards', cards);

    let cityHeld: CampaignCivilization['city'];
    const cityMisfit = !Object.hasOwn(catalogue.buildings, section.building)
      ? `names no building ${section.building}`
      : !Object.hasOwn(catalogue.cards, cityCard.card.id)
        ? `names no card ${cityCard.card.id}`
        : misfitIn(catalogue, 'city', cityCard.card.id);
    if (stands(citySlot, cityMisfit)) {
      cityHeld = { ...section, card: cityCard.card };
    } else {
      const authored = Object.hasOwn(catalogue.civilizations, name)
        ? name
        : firstCivilization(catalogue);
      const { city } = civilizationOf(catalogue, authored);
      const restored = dealt(nextCard, [city.card]);
      cityHeld = { ...city, card: restored.cards[0] };
      nextCard = restored.nextCard;
    }
    held.push([name, { city: cityHeld, settle: settleHeld, cards: cardsHeld }]);
  }

  return {
    campaign: {
      technologies: unlocked,
      influence,
      nextCard,
      collection: collection.flatMap(({ card }) => (owned.has(card.number) ? [card] : [])),
      civilizations: Object.fromEntries(held),
    },
    dropped,
  };
}

function integer(catalogue: Catalogue, slot: Slot): number {
  if (!Number.isInteger(slot.raw)) refused(catalogue, slot, 'is not an integer');
  return slot.raw as number;
}

/** An integer counting something, refused below its least with the reason said of what holds it. */
function count(
  catalogue: Catalogue,
  slot: Slot,
  holder: Slot,
  reason: (value: number) => string,
  least = 0,
): number {
  const value = integer(catalogue, slot);
  if (value < least) refused(catalogue, holder, reason(value));
  return value;
}

/** Numbers dealt from a next number: each is refused unless it is below that one and held once. */
function dealtOnce(
  catalogue: Catalogue,
  held: readonly { readonly slot: Slot; readonly number: number }[],
  next: number,
  names: { readonly next: string; readonly holder: string },
): void {
  const seen = new Set<number>();
  for (const { slot, number } of held) {
    if (number >= next) {
      refused(catalogue, slot, `is numbered ${number}, not below ${names.next} ${next}`);
    }
    if (seen.has(number)) {
      refused(catalogue, slot, `is numbered ${number}, a number another ${names.holder} holds`);
    }
    seen.add(number);
  }
}

/** How far a city section's city sees and the idle population it opens with. */
function cityCounts(
  catalogue: Catalogue,
  slot: Slot,
  field: (name: string) => Slot,
): { readonly sight: number; readonly idle: number } {
  return {
    sight: count(catalogue, field('sight'), slot, (sight) => `sees ${sight}`),
    idle: count(catalogue, field('idle'), slot, (idle) => `opens with ${idle} idle`),
  };
}

function flag(catalogue: Catalogue, slot: Slot): boolean {
  if (typeof slot.raw !== 'boolean') refused(catalogue, slot, 'is not true or false');
  return slot.raw;
}

function string(catalogue: Catalogue, slot: Slot): string {
  if (typeof slot.raw !== 'string') refused(catalogue, slot, 'is not a string');
  return slot.raw;
}

/** An id, resolved through the lookup of what it names: one the catalogue does not hold is refused. */
function id(
  catalogue: Catalogue,
  slot: Slot,
  lookup: (catalogue: Catalogue, id: string) => unknown,
): string {
  const named = string(catalogue, slot);
  lookup(catalogue, named);
  return named;
}

function object(catalogue: Catalogue, slot: Slot): Readonly<Record<string, unknown>> {
  const { raw } = slot;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    refused(catalogue, slot, 'is not an object');
  }
  return raw as Record<string, unknown>;
}

/** The fields of an object of the save, by name; one it does not carry is absent. */
function record(catalogue: Catalogue, slot: Slot): (name: string) => Slot {
  const fields = object(catalogue, slot);
  return (name) => ({
    raw: Object.hasOwn(fields, name) ? fields[name] : undefined,
    at: slot.at === '' ? name : `${slot.at}.${name}`,
  });
}

function list<T>(catalogue: Catalogue, slot: Slot, each: (item: Slot) => T): T[] {
  if (!Array.isArray(slot.raw)) refused(catalogue, slot, 'is not a list');
  return slot.raw.map((raw, index) => each({ raw, at: `${slot.at}[${index}]` }));
}

function optional<T>(slot: Slot, read: (slot: Slot) => T): T | undefined {
  return slot.raw === undefined ? undefined : read(slot);
}

function chronicleOf(catalogue: Catalogue, slot: Slot): Chronicle {
  const field = record(catalogue, slot);
  const content = string(catalogue, field('content'));
  checkContent(catalogue, { content });
  const card = (item: Slot): ChronicleCard => cardIn(catalogue, item);
  const coords = (item: Slot): TileCoords => coordsIn(catalogue, record(catalogue, item));
  const age = id(catalogue, field('age'), ageOf);
  const units = list(catalogue, field('units'), (item) => ({
    slot: item,
    unit: unitOf(catalogue, item),
  }));
  const nextUnit = count(
    catalogue,
    field('nextUnit'),
    slot,
    (next) =>
      `holds the next unit number ${next}, below the first unit number ${FIRST_UNIT_NUMBER}`,
    FIRST_UNIT_NUMBER,
  );
  dealtOnce(
    catalogue,
    units.map(({ slot: item, unit }) => ({ slot: item, number: unit.id })),
    nextUnit,
    { next: 'the next unit number', holder: 'unit' },
  );
  return {
    content,
    age,
    seed: integer(catalogue, field('seed')),
    rng: rngOf(catalogue, field('rng')),
    tiles: list(catalogue, field('tiles'), (item) => tileOf(catalogue, item)),
    snapshots: list(catalogue, field('snapshots'), (item) => snapshotOf(catalogue, item)),
    rivers: list(catalogue, field('rivers'), (river) =>
      list(catalogue, river, (item) => cornerOf(catalogue, item)),
    ),
    centre: list(catalogue, field('centre'), coords),
    citySection: citySectionOf(catalogue, field('citySection')),
    city: optional(field('city'), coords),
    held: list(catalogue, field('held'), coords),
    turn: count(catalogue, field('turn'), slot, (turn) => `stands on turn ${turn}`),
    timeline: timelineOf(catalogue, field('timeline')),
    deals: list(catalogue, field('deals'), (item) => dealOf(catalogue, item)),
    resources: resourcesOf(catalogue, field('resources')),
    population: count(catalogue, field('population'), slot, (held) => `holds ${held} population`),
    assigned: list(catalogue, field('assigned'), coords),
    units: units.map(({ unit }) => unit),
    nextUnit,
    drawPile: list(catalogue, field('drawPile'), card),
    hand: list(catalogue, field('hand'), card),
    discardPile: list(catalogue, field('discardPile'), card),
    achievements: list(catalogue, field('achievements'), (item) => {
      const held = record(catalogue, item);
      return {
        id: id(catalogue, held('id'), (read, named) => achievementOf(read, age, named)),
        reached: flag(catalogue, held('reached')),
      };
    }),
    ending: optional(field('ending'), (item) => endingOf(catalogue, item)),
  };
}

function rngOf(catalogue: Catalogue, slot: Slot): Rng {
  const words = list(catalogue, slot, (item) => integer(catalogue, item));
  if (words.length !== 4) refused(catalogue, slot, `holds ${words.length} words, not 4`);
  const [a, b, c, d] = words;
  return [a, b, c, d];
}

function coordsIn(catalogue: Catalogue, field: (name: string) => Slot): TileCoords {
  return { q: integer(catalogue, field('q')), r: integer(catalogue, field('r')) };
}

function citySectionOf(catalogue: Catalogue, slot: Slot): CitySection {
  const field = record(catalogue, slot);
  return {
    building: id(catalogue, field('building'), buildingKind),
    ...cityCounts(catalogue, slot, field),
    card: id(catalogue, field('card'), cardOf),
  };
}

function cornerOf(catalogue: Catalogue, slot: Slot): Corner {
  const field = record(catalogue, slot);
  return { x: integer(catalogue, field('x')), y: integer(catalogue, field('y')) };
}

function tileOf(catalogue: Catalogue, slot: Slot): Tile {
  const field = record(catalogue, slot);
  return {
    ...coordsIn(catalogue, field),
    terrain: id(catalogue, field('terrain'), terrainKind),
    feature: optional(field('feature'), (item) => id(catalogue, item, featureKind)),
    improvements: list(catalogue, field('improvements'), (item) =>
      id(catalogue, item, improvementKind),
    ),
    building: optional(field('building'), (item) => id(catalogue, item, buildingKind)),
  };
}

function snapshotOf(catalogue: Catalogue, slot: Slot): Snapshot {
  const field = record(catalogue, slot);
  return {
    ...coordsIn(catalogue, field),
    tile: tileOf(catalogue, field('tile')),
    unit: optional(field('unit'), (item): SnapshotUnit => {
      const standing = record(catalogue, item);
      return {
        type: id(catalogue, standing('type'), unitKind),
        faction: factionOf(catalogue, standing('faction')),
      };
    }),
  };
}

function timelineOf(catalogue: Catalogue, slot: Slot): Timeline {
  const field = record(catalogue, slot);
  const capstoneSlot = field('capstone');
  const capstone = record(catalogue, capstoneSlot);
  return {
    rng: rngOf(catalogue, field('rng')),
    next: count(catalogue, field('next'), slot, (turn) => `deals next on turn ${turn}`),
    capstone: {
      id: id(catalogue, capstone('id'), capstoneOf),
      turn: count(catalogue, capstone('turn'), capstoneSlot, (turn) => `lands on turn ${turn}`),
    },
  };
}

function dealOf(catalogue: Catalogue, slot: Slot): Deal {
  const field = record(catalogue, slot);
  const kind = field('of');
  const of = string(catalogue, kind) as Deal['of'];
  switch (of) {
    case 'event':
      return { of, event: id(catalogue, field('event'), eventOf) };
    case 'camp':
      return {
        of,
        rewards: list(catalogue, field('rewards'), (item) => id(catalogue, item, cardOf)),
      };
  }
  const unlisted: never = of;
  return refused(catalogue, kind, `names no kind of deal ${unlisted}`);
}

function resourcesOf(catalogue: Catalogue, slot: Slot): Resources {
  const names: readonly string[] = RESOURCES;
  for (const name of Object.keys(object(catalogue, slot))) {
    if (!names.includes(name)) refused(catalogue, slot, `names no resource ${name}`);
  }
  const field = record(catalogue, slot);
  const stock = {} as Resources;
  for (const resource of RESOURCES) {
    stock[resource] = count(
      catalogue,
      field(resource),
      slot,
      (held) => `holds a stock of ${held} ${resource}`,
    );
  }
  return stock;
}

function factionOf(catalogue: Catalogue, slot: Slot): Faction {
  const faction = string(catalogue, slot) as Faction;
  switch (faction) {
    case 'player':
    case 'enemy':
      return faction;
  }
  const unlisted: never = faction;
  return refused(catalogue, slot, `names no faction ${unlisted}`);
}

function unitOf(catalogue: Catalogue, slot: Slot): Unit {
  const field = record(catalogue, slot);
  const standing = {
    id: count(
      catalogue,
      field('id'),
      slot,
      (number) => `is numbered ${number}, below the first unit number ${FIRST_UNIT_NUMBER}`,
      FIRST_UNIT_NUMBER,
    ),
    stats: statsOf(catalogue, field('stats')),
    tile: coordsIn(catalogue, record(catalogue, field('tile'))),
    movePoints: count(
      catalogue,
      field('movePoints'),
      slot,
      (points) => `has ${points} move points left`,
    ),
    action: count(catalogue, field('action'), slot, (action) => `has ${action} action left`),
  };
  const faction = factionOf(catalogue, field('faction'));
  switch (faction) {
    case 'player':
      return { ...standing, faction };
    case 'enemy':
      return { ...standing, faction, script: id(catalogue, field('script'), enemyScript) };
  }
}

function statsOf(catalogue: Catalogue, slot: Slot): UnitStats {
  const field = record(catalogue, slot);
  const stat = (name: keyof typeof LEAST_STATS): number =>
    count(catalogue, field(name), slot, (value) => `has a ${name} of ${value}`, LEAST_STATS[name]);
  return {
    type: id(catalogue, field('type'), unitKind),
    worker: flag(catalogue, field('worker')),
    health: stat('health'),
    damage: stat('damage'),
    range: stat('range'),
    move: stat('move'),
    action: stat('action'),
    sight: stat('sight'),
  };
}

/** A card of a pile, carrying every counter its content declares and no other. */
function cardIn(catalogue: Catalogue, slot: Slot): ChronicleCard {
  const field = record(catalogue, slot);
  const card = string(catalogue, field('id'));
  const declared = cardOf(catalogue, card).counters ?? {};
  const counters = field('counters');
  const carried = Object.fromEntries(
    Object.entries(object(catalogue, counters)).map(([name, raw]) => [
      name,
      integer(catalogue, { raw, at: `${counters.at}.${name}` }),
    ]),
  );
  for (const name of Object.keys(declared)) {
    if (!Object.hasOwn(carried, name)) {
      refused(catalogue, counters, `lacks the counter ${name} the card ${card} declares`);
    }
  }
  return cardMade(catalogue, card, carried);
}

function endingOf(catalogue: Catalogue, slot: Slot): Ending {
  const field = record(catalogue, slot);
  const turn = count(catalogue, field('turn'), slot, (ended) => `ended on turn ${ended}`);
  const named = field('outcome');
  const outcome = string(catalogue, named) as Ending['outcome'];
  switch (outcome) {
    case 'victory':
      return { turn, outcome };
    case 'defeat':
      return { turn, outcome, cause: causeOf(catalogue, field('cause')) };
  }
  const unlisted: never = outcome;
  return refused(catalogue, named, `names no outcome ${unlisted}`);
}

function causeOf(catalogue: Catalogue, slot: Slot): DefeatCause {
  const cause = string(catalogue, slot) as DefeatCause;
  switch (cause) {
    case 'capture':
    case 'population':
      return cause;
  }
  const unlisted: never = cause;
  return refused(catalogue, slot, `names no cause of defeat ${unlisted}`);
}
