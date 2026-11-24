import { expect, test } from 'vitest';
import { entered } from '../rules/catalogue';
import { apply, incomeOf } from '../rules/chronicle';
import {
  aimedAt,
  attackOn,
  besideTheNeutral,
  buildingAt,
  builtOn,
  CATALOGUE,
  CITY,
  CURSE,
  cityOf,
  field,
  madeOf,
  NEUTRAL_TILE,
  NO_GROWTH,
  naming,
  onlyStocks,
  opening,
  plains,
  preparing,
  ringed,
  SITE,
  settledOn,
  standing,
  withUnits,
} from '../rules/fixtures';
import { sameTile, type TileCoords, tileKey } from '../rules/map';
import { RESOURCES } from '../rules/resources';
import { type Stage, walked } from '../rules/stages';
import type { Chronicle } from '../rules/state';
import type { Unit } from '../rules/units';
import { type LogReading, logReaders } from './log-lines';
import type { SightOn } from './map-motion';

/** The map playing every stage on every tile. */
const EVERYWHERE: SightOn = () => true;

/** The map playing no stage on these tiles, and every stage on every other. */
function hiding(...tiles: TileCoords[]): SightOn {
  return (tile) => !tiles.some((hidden) => sameTile(hidden, tile));
}

/** The lines the stages read, in the order they play, with the turn each stands under. */
function linesOf(
  stages: readonly Stage[],
  sight: SightOn = EVERYWHERE,
): { turn: number; reads: LogReading }[] {
  const readers = logReaders(stages);
  return [...walked(stages)].flatMap((stage) => {
    const reader = readers.get(stage);
    const reads = reader?.read(sight);
    return reader === undefined || reads === undefined ? [] : [{ turn: reader.turn, reads }];
  });
}

/** What reads a unit on a line: its faction and its kind. */
function named(unit: Unit): { faction: Unit['faction']; kind: string } {
  return { faction: unit.faction, kind: unit.stats.type };
}

const MINE: TileCoords = { q: 1, r: 0 };
const THEIRS: TileCoords = { q: 2, r: 0 };

/** A city with a unit of the player's beside an enemy, the enemy that healthy; the two units. */
function besideAnEnemy(health = 4): { chronicle: Chronicle; mine: Unit; theirs: Unit } {
  const chronicle = ringed(3, {
    ...NO_GROWTH,
    units: [standing('player', MINE), standing('enemy', THEIRS, { health })],
  });
  const [mine, theirs] = chronicle.units;
  return { chronicle, mine, theirs };
}

test('an attack the map plays on both its tiles reads the attacker, the unit attacked and the damage, under the turn it was made on; one that kills reads the kill alone', () => {
  const { chronicle, mine, theirs } = besideAnEnemy();
  const killing = besideAnEnemy(mine.stats.damage);

  expect(linesOf(apply(CATALOGUE, chronicle, attackOn(mine.id, THEIRS)))).toEqual([
    {
      turn: chronicle.turn,
      reads: {
        kind: 'attack',
        attacker: named(mine),
        target: named(theirs),
        damage: mine.stats.damage,
      },
    },
  ]);
  expect(linesOf(apply(CATALOGUE, killing.chronicle, attackOn(killing.mine.id, THEIRS)))).toEqual([
    {
      turn: chronicle.turn,
      reads: { kind: 'kill', attacker: named(killing.mine), target: named(killing.theirs) },
    },
  ]);
});

test('an attack the map plays on one of its tiles alone names the unit on that tile alone, and one it plays on neither reads nothing', () => {
  const { chronicle, mine, theirs } = besideAnEnemy();
  const killing = besideAnEnemy(mine.stats.damage);
  const attack = apply(CATALOGUE, chronicle, attackOn(mine.id, THEIRS));
  const kill = apply(CATALOGUE, killing.chronicle, attackOn(killing.mine.id, THEIRS));
  const reads = (stages: readonly Stage[], sight: SightOn): LogReading[] =>
    linesOf(stages, sight).map((line) => line.reads);

  expect(reads(attack, hiding(MINE))).toEqual([
    { kind: 'attacked', target: named(theirs), damage: mine.stats.damage },
  ]);
  expect(reads(kill, hiding(MINE))).toEqual([{ kind: 'killed', target: named(killing.theirs) }]);
  expect(reads(attack, hiding(THEIRS))).toEqual([{ kind: 'attacks', attacker: named(mine) }]);
  expect(reads(kill, hiding(THEIRS))).toEqual([{ kind: 'attacks', attacker: named(mine) }]);
  expect(reads(attack, hiding(MINE, THEIRS))).toEqual([]);
});

test('a unit that walks to bring an enemy in range and attacks it reads the attack alone, and the enemy attacking at the end of turn reads its attack too', () => {
  const far = ringed(3, {
    ...NO_GROWTH,
    units: [standing('player', CITY), standing('enemy', THEIRS, { move: 0 })],
  });
  const [mine, theirs] = far.units;

  const lines = linesOf(apply(CATALOGUE, far, attackOn(mine.id, THEIRS)));
  expect(lines.map(({ reads }) => reads.kind)).toEqual(['attack']);

  const near = ringed(3, {
    ...NO_GROWTH,
    units: [standing('player', MINE), standing('enemy', THEIRS, { move: 0 })],
  });
  const ended = linesOf(apply(CATALOGUE, near, { type: 'end-turn' }));
  expect(ended).toContainEqual({
    turn: near.turn,
    reads: {
      kind: 'attack',
      attacker: named(theirs),
      target: named(mine),
      damage: theirs.stats.damage,
    },
  });
});

test('a unit entering the map reads where the map plays its tile, and nothing where it does not', () => {
  const city = ringed(3, NO_GROWTH);
  const { stages, chronicle } = entered(CATALOGUE, city, {
    type: 'PH_Warrior',
    faction: 'enemy',
    script: 'PH_Beeline',
    tile: THEIRS,
  });
  const unit = chronicle.units[chronicle.units.length - 1];

  expect(linesOf(stages).map(({ reads }) => reads)).toEqual([
    { kind: 'enters', unit: named(unit) },
  ]);
  expect(linesOf(stages, hiding(THEIRS))).toEqual([]);
});

test('an enemy preparing on the player’s city’s tile reads its prepare to capture the city', () => {
  const city = cityOf(['urban'], { tiles: field(2), units: [standing('enemy', CITY)] });
  const [enemy] = city.units;

  const lines = linesOf(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(lines.map(({ reads }) => reads)).toContainEqual({
    kind: 'prepares-to-capture-your-city',
    unit: named(enemy),
  });
});

/** The fixture's content, its enemies staying where they stand and preparing there. */
const PREPARING = naming(() => ({ act: 'prepare' }));

/** The preparing the end of turn reads on the chronicle under `PREPARING`, the map playing as `sight` says. */
function preparesOf(chronicle: Chronicle, sight: SightOn = EVERYWHERE): LogReading[] {
  return linesOf(apply(PREPARING, chronicle, { type: 'end-turn' }), sight)
    .map(({ reads }) => reads)
    .filter(({ kind }) => kind.startsWith('prepares'));
}

test('an enemy preparing on a tile it will pillage reads its prepare to pillage, where the map plays its tile', () => {
  const STAKED = { q: 2, r: 0 };
  const tiles = field(3).map((tile) =>
    tileKey(tile) === tileKey(STAKED) ? { ...tile, improvements: ['PH_Stake'] } : tile,
  );
  const city = cityOf(['urban'], { tiles, units: [standing('enemy', STAKED)] });
  const [enemy] = city.units;

  expect(preparesOf(city)).toEqual([{ kind: 'prepares-to-pillage', unit: named(enemy) }]);
  expect(preparesOf(city, hiding(STAKED))).toEqual([]);
});

test('an enemy preparing on the tile of a city not the player’s reads its prepare to capture that city’s building', () => {
  const beside = withUnits(besideTheNeutral(), [standing('enemy', NEUTRAL_TILE)]);
  const enemy = beside.units[beside.units.length - 1];

  expect(preparesOf(beside)).toEqual([
    {
      kind: 'prepares-to-capture',
      unit: named(enemy),
      building: buildingAt(beside, NEUTRAL_TILE),
    },
  ]);
});

test('a unit of the player’s capturing a site reads the capture with what it captured, where the map plays its tile', () => {
  const site = { q: 2, r: 0 };
  const sited = ringed(3, {
    ...NO_GROWTH,
    tiles: builtOn(madeOf(field(3), 'hills', [site]), SITE, [site]),
    units: [standing('player', site)],
  });
  const [mine] = sited.units;
  const stages = apply(CATALOGUE, sited, { type: 'end-turn' });
  const captures = (sight: SightOn): LogReading[] =>
    linesOf(stages, sight)
      .map(({ reads }) => reads)
      .filter(({ kind }) => kind === 'captures');

  expect(captures(EVERYWHERE)).toEqual([{ kind: 'captures', unit: named(mine), building: SITE }]);
  expect(captures(hiding(site))).toEqual([]);
});

test('the player’s city growing reads the population it gained, wherever the map plays', () => {
  const city = ringed(3, { resources: onlyStocks({ food: 999 }) });

  const grows = linesOf(apply(CATALOGUE, city, { type: 'end-turn' }), () => false)
    .map(({ reads }) => reads)
    .filter(({ kind }) => kind === 'grows');

  expect(grows).toEqual([{ kind: 'grows', moved: [{ symbol: 'population', count: 1 }] }]);
});

test('a pillage reads the building it removed, or else the improvements, where the map plays its tile', () => {
  const FARMED = { q: 2, r: 0 };
  const STAKED = { q: -2, r: 0 };
  const tiles = field(3).map((tile) => {
    if (tileKey(tile) === tileKey(FARMED)) {
      return { ...tile, building: 'PH_Farm', improvements: ['PH_Stake'] };
    }
    if (tileKey(tile) === tileKey(STAKED)) return { ...tile, improvements: ['PH_Stake'] };
    return tile;
  });
  const pillaging = cityOf(['urban'], {
    tiles,
    units: [
      preparing(standing('enemy', FARMED, { move: 0 })),
      preparing(standing('enemy', STAKED, { move: 0 })),
    ],
  });
  const [farmer, staker] = pillaging.units;
  const stages = apply(CATALOGUE, pillaging, { type: 'end-turn' });
  const pillages = (sight: SightOn): LogReading[] =>
    linesOf(stages, sight)
      .map(({ reads }) => reads)
      .filter(({ kind }) => kind === 'pillages');

  expect(pillages(EVERYWHERE)).toEqual([
    { kind: 'pillages', unit: named(farmer), removed: { building: 'PH_Farm' } },
    { kind: 'pillages', unit: named(staker), removed: { improvements: ['PH_Stake'] } },
  ]);
  expect(pillages(hiding(FARMED))).toEqual([
    { kind: 'pillages', unit: named(staker), removed: { improvements: ['PH_Stake'] } },
  ]);
});

test('the income reads each stock it moved in the resource bar’s order, and a strike reads its card and what it took, wherever the map plays', () => {
  const city = ringed(3, {
    ...NO_GROWTH,
    hand: ['PH_Curse'],
    resources: onlyStocks({ food: 2 * CURSE }),
  });
  const income = incomeOf(CATALOGUE, city, 'player');

  const lines = linesOf(apply(CATALOGUE, city, { type: 'end-turn' }), () => false);

  expect(lines.map(({ reads }) => reads)).toEqual([
    {
      kind: 'income',
      moved: RESOURCES.flatMap((symbol) =>
        income[symbol] === 0 ? [] : [{ symbol, count: income[symbol] }],
      ),
    },
    { kind: 'strikes', card: 'PH_Curse', moved: [{ symbol: 'food', count: -CURSE }] },
  ]);
});

test('nothing reads on the settle phase, the unit its settle enters among it', () => {
  const settling = opening(plains(3));
  const settled = settledOn(settling, CITY);

  expect(linesOf(apply(CATALOGUE, settling, aimedAt(settling, CITY)))).toEqual([]);
  expect(
    linesOf(apply(CATALOGUE, settled, { type: 'end-turn' })).filter(({ turn }) => turn === 0),
  ).toEqual([]);
});
