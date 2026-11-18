import type { BuildingTypeId, ImprovementId, Terrain } from '../rules/map';

/** The folder his resource and goods icons stand in, under the assets folder. */
export const GOODS_ICONS = 'store/icons-strategic-resources-and-goods/Icons';

/** The folder his arms and armour icons stand in, under the assets folder. */
export const ARMS_ICONS = 'store/icons-medieval-arms-and-armor/icons';

/** The folder his crafting and foraging icons stand in, under the assets folder. */
const CRAFTING_ICONS = 'store/icons-crafting-tools-foraging-herbalism/icons';

/**
 * What stands on the ground of a card's art box: a unit kind's painting, a building's paintings, an
 * improvement as the map lays it, one of his icons by its file under the assets folder, or nothing.
 */
export type ArtThing =
  | { readonly kind: 'unit'; readonly type: string }
  | { readonly kind: 'building'; readonly building: BuildingTypeId }
  | { readonly kind: 'improvement'; readonly improvement: ImprovementId }
  | { readonly kind: 'icon'; readonly file: string }
  | { readonly kind: 'nothing' };

/** What a card's art box holds: the terrain of its ground, and the thing its play places or one named. */
export type CardArt = { readonly ground: Terrain; readonly holds: ArtThing | 'placed' };

/** One of his icons on a ground. */
function iconOn(ground: Terrain, file: string): CardArt {
  return { ground, holds: { kind: 'icon', file } };
}

/**
 * The ground an art box holds a building no card places on: on the face of its own it wears, and on
 * a trophy holding it.
 */
const BUILDING_GROUNDS: Readonly<Record<BuildingTypeId, Terrain>> = {
  'painted-cave': 'hills',
  'old-cairn': 'plain',
  'beast-bones': 'plain',
  camp: 'plain',
  'stone-painted-cave': 'hills',
  'stone-old-cairn': 'plain',
  'stone-beast-bones': 'plain',
  'stone-camp': 'plain',
  'neutral-village': 'plain',
};

/** The ground an art box holds a building no card places on, and nothing for any other building. */
export function buildingGroundOf(building: BuildingTypeId): Terrain | undefined {
  return Object.hasOwn(BUILDING_GROUNDS, building) ? BUILDING_GROUNDS[building] : undefined;
}

/** The ground an art box holds a unit kind no card places on, on the face of its own it wears. */
const UNIT_GROUNDS: Readonly<Record<string, Terrain>> = {
  leader: 'plain',
};

/** The ground an art box holds a unit kind no card places on, and nothing for any other kind. */
export function unitGroundOf(kind: string): Terrain | undefined {
  return Object.hasOwn(UNIT_GROUNDS, kind) ? UNIT_GROUNDS[kind] : undefined;
}

/** A building no card places, its paintings on its ground. */
function buildingArt(id: BuildingTypeId): CardArt {
  return { ground: BUILDING_GROUNDS[id], holds: { kind: 'building', building: id } };
}

const RED_OCHRE = iconOn('hills', `${CRAFTING_ICONS}/red_ocher_pigment.png`);
const FOODS = iconOn('plain', `${GOODS_ICONS}/foods.png`);

const CARD_ART: Readonly<Record<string, CardArt>> = {
  settle: { ground: 'plain', holds: 'placed' },
  'first-worker': { ground: 'plain', holds: 'placed' },
  worker: { ground: 'plain', holds: 'placed' },
  'first-scout': { ground: 'forest', holds: 'placed' },
  scout: { ground: 'forest', holds: 'placed' },
  warrior: { ground: 'hills', holds: 'placed' },
  shelter: { ground: 'plain', holds: 'placed' },
  gather: iconOn('plain', `${GOODS_ICONS}/apples.png`),
  hunt: iconOn('forest', `${GOODS_ICONS}/venison.png`),
  march: iconOn('hills', `${ARMS_ICONS}/sandals.png`),
  hunger: iconOn('plain', `${ARMS_ICONS}/bone_club.png`),
  stores: FOODS,
  'band-joins': buildingArt('camp'),
  'cave-paintings': RED_OCHRE,
  'honour-the-dead': buildingArt('old-cairn'),
  'bone-carvings': buildingArt('beast-bones'),
  farm: { ground: 'plain', holds: 'placed' },
  tannery: { ground: 'forest', holds: 'placed' },
  fishery: { ground: 'coast', holds: 'placed' },
  megalith: { ground: 'plain', holds: 'placed' },
  foundations: { ground: 'plain', holds: 'placed' },
  'great-stones': { ground: 'plain', holds: 'placed' },
  ornaments: { ground: 'plain', holds: 'placed' },
  archer: { ground: 'plain', holds: 'placed' },
  raft: { ground: 'coast', holds: 'placed' },
  trapping: { ground: 'forest', holds: 'placed' },
  irrigation: { ground: 'plain', holds: 'placed' },
  pasture: { ground: 'plain', holds: 'placed' },
  'clay-pit': { ground: 'hills', holds: 'placed' },
  calendar: iconOn('plain', 'store/hex-medieval-fantasy-locations/Decor/obelisk00.png'),
  bread: iconOn('plain', `${GOODS_ICONS}/bread.png`),
  fire: iconOn('forest', `${CRAFTING_ICONS}/bonfire.png`),
  heal: iconOn('plain', `${CRAFTING_ICONS}/medicines.png`),
  'food-trade': iconOn('plain', `${CRAFTING_ICONS}/kola_nuts.png`),
  'goods-trade': iconOn('plain', `${GOODS_ICONS}/pottery.png`),
  'old-stories': buildingArt('stone-painted-cave'),
  'bone-tools': iconOn('plain', `${CRAFTING_ICONS}/horn.png`),
  'stone-cave-paintings': RED_OCHRE,
  'stone-honour-the-dead': buildingArt('stone-old-cairn'),
  'stone-bone-carvings': buildingArt('stone-beast-bones'),
  'stone-stores': FOODS,
  'stone-band-joins': buildingArt('stone-camp'),
  'dig-the-graves': iconOn('hills', `${CRAFTING_ICONS}/jewelry.png`),
  'their-land': buildingArt('neutral-village'),
  'their-stores': iconOn('plain', `${GOODS_ICONS}/barrel.png`),
  floodplain: iconOn('plain', `${GOODS_ICONS}/water.png`),
  sickness: iconOn('plain', `${CRAFTING_ICONS}/manure.png`),
  misunderstandings: iconOn('plain', `${ARMS_ICONS}/wooden_club.png`),
  wolves: iconOn('forest', `${CRAFTING_ICONS}/bones.png`),
  'rain-dance': { ground: 'desert', holds: { kind: 'nothing' } },
  embers: iconOn('forest', `${CRAFTING_ICONS}/campfire.png`),
  tribute: FOODS,
  'cold-night': iconOn('forest', `${GOODS_ICONS}/ice_and_snow.png`),
  unrest: iconOn('hills', `${ARMS_ICONS}/pitchfork.png`),
  thieves: iconOn('plain', `${ARMS_ICONS}/plain_dagger.png`),
  'weary-builders': iconOn('plain', `${CRAFTING_ICONS}/blunt_tool_pieces.png`),
};

/** What a card's art box holds, and nothing for a card holding no painting. */
export function cardArtOf(card: string): CardArt | undefined {
  return Object.hasOwn(CARD_ART, card) ? CARD_ART[card] : undefined;
}
