import {
  type Catalogue,
  capstoneOf,
  cardMade,
  cardOf,
  checkContent,
  deckOf,
  enemyScript,
  eventOf,
  scheduleOf,
  unitKind,
} from './catalogue';
import type { Corner, Tile, TileCoords } from './map';
import {
  buildingKind,
  featureKind,
  improvementKind,
  refuse,
  regionOf,
  terrainKind,
} from './map-kinds';
import { RESOURCES, type Resources } from './resources';
import type { Rng } from './rng';
import type {
  Chronicle,
  ChronicleCard,
  Deal,
  DefeatCause,
  Ending,
  Snapshot,
  SnapshotUnit,
  Timeline,
} from './state';
import type { Faction, Unit, UnitStats } from './units';

/** A chronicle's save: the chronicle, and the region and the deck it was launched on, by id. */
export type ChronicleSave = {
  readonly chronicle: Chronicle;
  readonly region: string;
  readonly deck: string;
};

/** A save as text; one the reading would refuse is refused, so a written save always reads back. */
export function writeSave(
  catalogue: Catalogue,
  { chronicle, region, deck }: ChronicleSave,
): string {
  const text = JSON.stringify({ chronicle, region, deck });
  readSave(catalogue, text);
  return text;
}

/**
 * The save the text holds, read against the catalogue: a chronicle's whole or nothing. Text that is
 * not a chronicle's shape, a chronicle of another content, and an id or a counter the catalogue does
 * not hold are refused; a field the shape does not name is dropped.
 */
export function readSave(catalogue: Catalogue, text: string): ChronicleSave {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return refuse(catalogue, 'the save is not JSON');
  }
  const field = record(catalogue, { raw: parsed, at: '' });
  return {
    chronicle: chronicleOf(catalogue, field('chronicle')),
    region: id(catalogue, field('region'), regionOf),
    deck: id(catalogue, field('deck'), deckOf),
  };
}

/** One value of the parsed text, and where in the save it stands. */
type Slot = { readonly raw: unknown; readonly at: string };

function refused(catalogue: Catalogue, { at }: Slot, reason: string): never {
  return refuse(catalogue, `${at === '' ? 'the save' : `the save's ${at}`} ${reason}`);
}

function integer(catalogue: Catalogue, slot: Slot): number {
  if (!Number.isInteger(slot.raw)) refused(catalogue, slot, 'is not an integer');
  return slot.raw as number;
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
  return {
    content,
    seed: integer(catalogue, field('seed')),
    rng: rngOf(catalogue, field('rng')),
    tiles: list(catalogue, field('tiles'), (item) => tileOf(catalogue, item)),
    snapshots: list(catalogue, field('snapshots'), (item) => snapshotOf(catalogue, item)),
    rivers: list(catalogue, field('rivers'), (river) =>
      list(catalogue, river, (item) => cornerOf(catalogue, item)),
    ),
    centre: list(catalogue, field('centre'), coords),
    city: optional(field('city'), coords),
    held: list(catalogue, field('held'), coords),
    turn: integer(catalogue, field('turn')),
    timeline: timelineOf(catalogue, field('timeline')),
    deals: list(catalogue, field('deals'), (item) => dealOf(catalogue, item)),
    resources: resourcesOf(catalogue, field('resources')),
    population: integer(catalogue, field('population')),
    assigned: list(catalogue, field('assigned'), coords),
    units: list(catalogue, field('units'), (item) => unitOf(catalogue, item)),
    nextUnit: integer(catalogue, field('nextUnit')),
    drawPile: list(catalogue, field('drawPile'), card),
    hand: list(catalogue, field('hand'), card),
    discardPile: list(catalogue, field('discardPile'), card),
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
  const capstone = record(catalogue, field('capstone'));
  return {
    schedule: id(catalogue, field('schedule'), scheduleOf),
    rng: rngOf(catalogue, field('rng')),
    next: integer(catalogue, field('next')),
    capstone: {
      id: id(catalogue, capstone('id'), capstoneOf),
      turn: integer(catalogue, capstone('turn')),
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
  for (const resource of RESOURCES) stock[resource] = integer(catalogue, field(resource));
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
    id: integer(catalogue, field('id')),
    stats: statsOf(catalogue, field('stats')),
    tile: coordsIn(catalogue, record(catalogue, field('tile'))),
    movePoints: integer(catalogue, field('movePoints')),
    action: integer(catalogue, field('action')),
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
  return {
    type: id(catalogue, field('type'), unitKind),
    worker: flag(catalogue, field('worker')),
    health: integer(catalogue, field('health')),
    damage: integer(catalogue, field('damage')),
    range: integer(catalogue, field('range')),
    move: integer(catalogue, field('move')),
    action: integer(catalogue, field('action')),
    sight: integer(catalogue, field('sight')),
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
  const turn = integer(catalogue, field('turn'));
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
