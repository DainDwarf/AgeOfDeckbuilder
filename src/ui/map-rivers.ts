import type Phaser from 'phaser';
import {
  ARMS,
  type Corner,
  cornerKey,
  type River,
  riversAlong,
  type TilesBeside,
  tileKey,
  tilesAtCorner,
  tilesOfEdge,
  water,
} from '../rules/map';
import type { MapContent } from '../rules/map-kinds';
import { asDarkened, cornerAt, SQUASH, TILE_SIZE } from './map-marks';
import {
  mouthPaintingsOf,
  PAINTING,
  paintingAtCorner,
  riverPaintingsOf,
  STRAIGHT_RIVER,
} from './marks';

/** How much smaller than his file a piece is drawn: his leg, the apothem, half an edge. */
const PIECE_SCALE = TILE_SIZE / PAINTING.width;

/** The middles of his edges about his hexagon's middle, in his pixels, in the order his masks name them. */
const EDGE_MIDDLES: readonly { readonly x: number; readonly y: number }[] = [
  { x: -64, y: -96 },
  { x: 64, y: -96 },
  { x: 128, y: 0 },
  { x: 64, y: 96 },
  { x: -64, y: 96 },
  { x: -128, y: 0 },
];

/**
 * What a corner of a river wears: his piece whose edges are the river's arms there, or, where the
 * river reaches the water, his mouth and his straight river pressed along the arm it arrived by;
 * in fog where no tile at the corner is in sight.
 */
export type RiverPiece =
  | {
      readonly kind: 'piece';
      readonly corner: Corner;
      readonly painting: string;
      readonly inFog: boolean;
    }
  | {
      readonly kind: 'mouth';
      readonly corner: Corner;
      /** The place in his masks of the arm the river arrived by. */
      readonly arrived: number;
      readonly painting: string;
      readonly inFog: boolean;
    };

/** The arm from a corner to one an edge away, by its place in the rules' list: the place of his edge in his masks. */
function armOf(from: Corner, to: Corner): number {
  return ARMS.findIndex((arm) => arm.x === to.x - from.x && arm.y === to.y - from.y);
}

/**
 * The piece every corner of the rivers' runs along the drawn tiles wears, by its key, in fog where no
 * tile at it is drawn live: his mouth at a river's last corner the run reaches with water drawn
 * straight ahead of the edge it arrived by, else the one whose arms are the drawn edges leaving it.
 */
export function riverPieces(
  catalogue: MapContent,
  rivers: readonly River[],
  drawn: ReadonlySet<string>,
  live: ReadonlySet<string>,
  faces: TilesBeside,
): Map<string, RiverPiece> {
  const armed = new Map<string, { corner: Corner; arms: Set<number> }>();
  const leaves = (corner: Corner, to: Corner): void => {
    const key = cornerKey(corner);
    const at = armed.get(key) ?? { corner, arms: new Set<number>() };
    at.arms.add(armOf(corner, to));
    armed.set(key, at);
  };
  const mouths = new Map<string, number>();
  for (const river of rivers) {
    const runs = riversAlong([river], drawn);
    for (const run of runs) {
      for (let at = 1; at < run.length; at++) {
        leaves(run[at - 1], run[at]);
        leaves(run[at], run[at - 1]);
      }
    }
    const last = runs.at(-1);
    const end = river[river.length - 1];
    if (last === undefined || cornerKey(last[last.length - 1]) !== cornerKey(end)) continue;
    const before = last[last.length - 2];
    const banks = new Set(tilesOfEdge(before, end).map(tileKey));
    const ahead = tilesAtCorner(end).find((coord) => !banks.has(tileKey(coord)));
    if (ahead !== undefined && water(catalogue, faces(ahead)?.terrain)) {
      mouths.set(cornerKey(end), armOf(end, before));
    }
  }
  return new Map(
    [...armed].map(([key, { corner, arms }]): [string, RiverPiece] => {
      const inFog = !tilesAtCorner(corner).some((tile) => live.has(tileKey(tile)));
      const arrived = mouths.get(key);
      if (arrived === undefined) {
        const painting = paintingAtCorner(riverPaintingsOf(arms), corner);
        return [key, { kind: 'piece', corner, painting, inFog }];
      }
      const painting = paintingAtCorner(mouthPaintingsOf(arrived), corner);
      return [key, { kind: 'mouth', corner, arrived, painting, inFog }];
    }),
  );
}

/**
 * An image from the river sheet made to wear a corner's painting, darkened in fog, held at that point
 * of his file, turned a quarter turn onto the corner lattice and squashed across it as the lattice is.
 */
function onCorner(
  image: Phaser.GameObjects.Image,
  { corner, painting, inFog }: RiverPiece,
  held: { readonly x: number; readonly y: number },
): Phaser.GameObjects.Image {
  const { x, y } = cornerAt(corner);
  return asDarkened(image, inFog)
    .setFrame(painting)
    .setOrigin(0.5 + held.x / PAINTING.width, (PAINTING.middle + held.y) / PAINTING.height)
    .setPosition(x, y)
    .setRotation(Math.PI / 2)
    .setScale(PIECE_SCALE * SQUASH, PIECE_SCALE / SQUASH);
}

/** An image from the river sheet made to wear a corner's piece, held about his hexagon's middle. */
export function asRiverPiece(
  image: Phaser.GameObjects.Image,
  piece: RiverPiece,
): Phaser.GameObjects.Image {
  return onCorner(image, piece, { x: 0, y: 0 }).setName('river');
}

/** An image from the river sheet made to wear a mouth, held at the middle of the edge it arrived by. */
export function asRiverMouth(
  image: Phaser.GameObjects.Image,
  mouth: Extract<RiverPiece, { kind: 'mouth' }>,
): Phaser.GameObjects.Image {
  return onCorner(image, mouth, EDGE_MIDDLES[mouth.arrived]).setName('river-mouth');
}

// Phaser scales an object before it turns it, and a container's transform over its child's
// (`TransformMatrix.js:892-907`, `ContainerWebGLRenderer.js:42-55`): the straight is pressed on the
// regular lattice and squashed onto the map's by its container.
/**
 * A container holding one image from the river sheet made to wear his straight river pressed into
 * the half edge a mouth arrived by, its east end on the corner, darkened where the mouth is in fog.
 */
export function asPressedStraight(
  container: Phaser.GameObjects.Container,
  { corner, arrived, inFog }: Extract<RiverPiece, { kind: 'mouth' }>,
): Phaser.GameObjects.Container {
  const at = cornerAt(corner);
  const arm = ARMS[arrived];
  const before = cornerAt({ x: corner.x + arm.x, y: corner.y + arm.y });
  asDarkened(container.getAt<Phaser.GameObjects.Image>(0), inFog)
    .setFrame(STRAIGHT_RIVER)
    .setOrigin(1, PAINTING.middle / PAINTING.height)
    .setPosition(0, 0)
    .setScale(PIECE_SCALE / 2, PIECE_SCALE / SQUASH)
    .setRotation(Math.atan2((at.y - before.y) / SQUASH, at.x - before.x))
    .setName('river');
  return container.setPosition(at.x, at.y).setScale(1, SQUASH);
}
