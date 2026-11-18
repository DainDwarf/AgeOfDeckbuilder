import type { BuildingTypeId, Terrain } from '../rules/map';

/** The folder his resource and goods icons stand in, under the assets folder. */
export const GOODS_ICONS = 'store/icons-strategic-resources-and-goods/Icons';

/** The folder his arms and armour icons stand in, under the assets folder. */
export const ARMS_ICONS = 'store/icons-medieval-arms-and-armor/icons';

/**
 * What stands on the ground of a card's art box: a unit kind's painting, a building's paintings, or
 * one of his icons, by its file under the assets folder.
 */
export type ArtThing =
  | { readonly kind: 'unit'; readonly type: string }
  | { readonly kind: 'building'; readonly building: BuildingTypeId }
  | { readonly kind: 'icon'; readonly file: string };

/** What a card's art box holds: the terrain of its ground, and the thing its play places or one named. */
export type CardArt = { readonly ground: Terrain; readonly holds: ArtThing | 'placed' };

const CARD_ART: Readonly<Record<string, CardArt>> = {
  settle: { ground: 'plain', holds: 'placed' },
  'first-worker': { ground: 'plain', holds: 'placed' },
  worker: { ground: 'plain', holds: 'placed' },
  'first-scout': { ground: 'forest', holds: 'placed' },
  scout: { ground: 'forest', holds: 'placed' },
  warrior: { ground: 'hills', holds: 'placed' },
  shelter: { ground: 'plain', holds: 'placed' },
  gather: { ground: 'plain', holds: { kind: 'icon', file: `${GOODS_ICONS}/apples.png` } },
  hunt: { ground: 'forest', holds: { kind: 'icon', file: `${GOODS_ICONS}/venison.png` } },
  march: { ground: 'hills', holds: { kind: 'icon', file: `${ARMS_ICONS}/sandals.png` } },
  hunger: { ground: 'plain', holds: { kind: 'icon', file: `${ARMS_ICONS}/bone_club.png` } },
  stores: { ground: 'plain', holds: { kind: 'icon', file: `${GOODS_ICONS}/foods.png` } },
  'band-joins': { ground: 'plain', holds: { kind: 'building', building: 'camp' } },
  'cave-paintings': { ground: 'hills', holds: { kind: 'building', building: 'painted-cave' } },
  'honour-the-dead': { ground: 'plain', holds: { kind: 'building', building: 'old-cairn' } },
  'bone-carvings': { ground: 'plain', holds: { kind: 'building', building: 'beast-bones' } },
};

/** What a card's art box holds, and nothing for a card holding no painting. */
export function cardArtOf(card: string): CardArt | undefined {
  return Object.hasOwn(CARD_ART, card) ? CARD_ART[card] : undefined;
}
