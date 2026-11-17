import type { Resource } from '../rules/resources';
import type { CardFamily } from './face';

/**
 * A family's colour as a card's frame wears it: the hue its paper is turned to, in degrees, the
 * saturation that paper's own is scaled by, and how much its lightness is scaled by.
 */
export type FamilyColour = {
  readonly hue: number;
  readonly saturation: number;
  readonly darkness: number;
};

/** What the resource bar reads: one resource, or the idle population. */
export type BarReading = Resource | 'idle';

/** A colour laid over what is under it, at the strength it rests at. */
export type Wash = { readonly colour: number; readonly strength: number };

/** A grey paper and the ink on it. */
export type Paper = {
  readonly face: number;
  readonly ink: number;
};

/** A shadow in a colour at its strength, blurred over `blur` units and falling `fall` units under what casts it. */
export type Shadow = Wash & { readonly blur: number; readonly fall: number };

/** Every colour of the screen, by the role it paints. */
export type Look = {
  readonly button: number;
  readonly cityMode: number;
  readonly actWaiting: number;
  readonly civilization: number;
  readonly enemy: number;
  readonly neutral: number;
  /**
   * What the attack's marks are drawn in: the ring on a unit the selected unit can attack, the arrow
   * to it, and the health the attack would remove on its health bar.
   */
  readonly attack: number;
  readonly pileCount: number;
  readonly exhaustTab: number;
  readonly exhaustTabEdge: number;
  readonly exhaustTabInk: number;
  readonly selected: number;
  /** The strength the selection's rim rests at on the selected tile's edge and on a unit's ring. */
  readonly selectionRim: number;
  /** The strength the selection's line along the selected tile's edge and along a unit's ring rests at. */
  readonly selectionLine: number;
  readonly selectedEdge: number;
  /** The strength the reach's band rests at where it meets the reach's line. */
  readonly reachBand: number;
  /** The strength the reach's line along the region's edges rests at. */
  readonly reachLine: number;
  /** The strength a unit's path's chevrons rest at, and the dark edge under them. */
  readonly pathChevron: number;
  readonly pathEdge: number;
  readonly pin: number;
  /** The dark line on each side of a pinned plate's edge. */
  readonly pinEdge: number;
  /** The disc a pinned plate wears on its corner. */
  readonly pinMark: number;
  readonly thresholdInk: number;
  /** The ink the population badge on the player's city's tile reads in. */
  readonly civilizationCityBadgeInk: number;
  /** The ink the population badge on the neutral's city's tile reads in. */
  readonly neutralCityBadgeInk: number;
  /** The ink the glyph on a prepared unit's badge reads in, whoever's the unit is. */
  readonly unitBadgeInk: number;
  /** The ink the player's faction sign reads in, on the civilization's colour. */
  readonly civilizationSignInk: number;
  /** The ink the neutral's faction sign reads in, on the neutral's colour. */
  readonly neutralSignInk: number;
  /** The ink the enemies' faction sign reads in, on the enemies' colour. */
  readonly enemySignInk: number;
  /** The ink a site's sign reads in, on its pointer. */
  readonly siteSignInk: number;
  /** The health a unit holds on its health bar, and the rest of the bar, the health it lost. */
  readonly health: number;
  readonly healthLost: number;
  /** The heart at a health bar's foot, and the skull an attack that would kill sets in its place. */
  readonly heart: number;
  readonly skull: number;
  /** The dark outline every glyph is drawn over. */
  readonly glyphOutline: number;
  /** The rest of a city's bar past the stock, the grey of a threshold not yet met. */
  readonly thresholdNotMet: number;
  /**
   * The strength the part of a city's bar ending the turn would add rests at, in its resource's
   * colour over the grey of a threshold not yet met.
   */
  readonly addedByTurn: number;
  /**
   * The strength the plate of the yield a card being aimed would give stands at on a tile one of the
   * building's kind already gives to.
   */
  readonly givenAlready: number;
  readonly settlePhase: number;
  readonly panelFill: number;
  readonly panelEdge: number;
  readonly ink: number;
  readonly faintInk: number;
  readonly paleInk: number;
  readonly answerInk: number;
  readonly page: number;
  readonly mapOutline: number;
  /** The tint every painting and mark of a tile in fog is multiplied by. */
  readonly fog: number;
  /** The tint city mode multiplies every painting of a held tile nobody is assigned to by. */
  readonly unassigned: number;
  /** The strength a city's border band rests at where it meets the line. */
  readonly borderBand: number;
  /** The strength a unit's halo rests at on its painting's outline. */
  readonly unitHalo: number;
  readonly built: number;
  readonly population: number;
  readonly wellFill: number;
  readonly wellLight: number;
  readonly influence: number;
  readonly unknownFill: number;
  readonly unknownInk: number;
  readonly greyedFill: number;
  readonly greyedInk: number;
  /**
   * The ink a row of the ending screen's ledger reads in for a card kept that this ending does not
   * pay, and the line that crosses that row out.
   */
  readonly unpaidInk: number;
  /** The strength an option of the launch screen rests at while another of its row is selected. */
  readonly unselected: number;
  readonly arrowEdge: number;
  readonly regionEdge: number;
  readonly deckCounts: number;
  /** The edge between the two panels of the collection screen. */
  readonly panelDivide: number;
  readonly scrollbarTrack: number;
  readonly scrollbarThumb: number;
  /** The strength a stack of the collection stands at whose every copy the deck holds. */
  readonly whollyHeld: number;
  /** The edge around the city section's row of a deck. */
  readonly cityRowEdge: number;
  /** The edge of a button that changes the collection screen's mode. */
  readonly modeButtonEdge: number;
  readonly cardEdge: number;
  /** The ground of the badge reading a browse's stack's copies. */
  readonly copiesBadge: number;
  /** Each family's colour, on the frame of every card of that family. */
  readonly cardFamily: Readonly<Record<CardFamily, FamilyColour>>;
  /** The ink a card's name reads in on its plate. */
  readonly cardNameInk: number;
  /** The ink a card's text reads in on its paper, and its kind label. */
  readonly cardTextInk: number;
  /** The strength a card's kind label stands at in its text's ink. */
  readonly cardKindLabel: number;
  /** What reads on a card's disc: its cost's, its influence's or its range's number and glyph, and the sign of a card nothing plays. */
  readonly cardDiscInk: number;
  /** The strength the line round a terrain marked at the foot of a card's window stands at, in the map's outline. */
  readonly cardTerrainOutline: number;
  /** The tint a cost's disc is multiplied by where the player's city cannot pay it, and the disc of a card nothing plays. */
  readonly unaffordableDisc: number;
  /** How much larger than its own size a card lifted out of the hand's lane is drawn. */
  readonly liftedCard: number;
  /** The shadow under a card lifted out of the hand's lane, its numbers in units of the card at its own size. */
  readonly liftedShadow: Shadow;
  /** The strength a worn card is darkened by, every part of it alike. */
  readonly wornCard: number;
  readonly aimSlab: number;
  readonly emptyEdge: number;
  /** The ink of a stock ending the turn takes past nothing, and of the population it takes. */
  readonly takenPastNothing: number;
  readonly affordableCard: Paper;
  /** The paper an answer the player's city cannot pay for, or one refused, stands on, and its ink. */
  readonly refusedAnswer: Paper;
  /** The dark under a tile's yield glyphs, at its strength over its middle. */
  readonly yieldPatch: Wash;
  /** The strength every unit is drawn at while city mode is on. */
  readonly unitsInCityMode: number;
  /** The strength city mode draws the yield glyphs of a tile not giving its yield at income at. */
  readonly yieldNotGiven: number;
  /** The strength a dimmed unit of the player's is darkened by. */
  readonly unitDim: number;
  /** The disc a feature's icon stands on, and the rim around it. */
  readonly featureDisc: Wash;
  readonly featureDiscRim: Wash;
  /**
   * The strength the disc an improvement's icon stands on rests at, in the stone everything worked
   * is, and the strength of its rim, in the map's outline.
   */
  readonly improvementDisc: number;
  readonly improvementDiscRim: number;
  /** What a fertile plain's painting is re-painted under, and a flint hill's. */
  readonly fertileTint: Wash;
  readonly flintTint: Wash;
  /** The dark earth the monument's stages lie on, at its strength over its middle. */
  readonly monumentPatch: Wash;
  readonly scrim: Wash;
  readonly consolePanel: Wash;
  readonly reading: Readonly<Record<Resource, number>>;
  readonly terrain: Readonly<Record<string, number>>;
  /** The ground each age stands on in the technology tree, by the age's id. */
  readonly ground: Readonly<Record<string, number>>;
  /** The ground of the age after the last the technology tree holds, which the tree ends on. */
  readonly groundToCome: number;
};

// Roles that agree on a value today are still separate entries: one theme decision recolours one
// role, and a merge here would drag the others with it.
export const LOOK: Look = {
  button: 0xd9a441,
  cityMode: 0xd9a441,
  actWaiting: 0xd9a441,
  civilization: 0xd9a441,
  enemy: 0xb4453c,
  neutral: 0x2b4f7a,
  attack: 0xb4453c,
  pileCount: 0xd9a441,
  exhaustTab: 0xd4d7db,
  exhaustTabEdge: 0x6f757d,
  exhaustTabInk: 0x0d1014,
  selected: 0xf2f6ff,
  selectionRim: 0.8,
  selectionLine: 0.9,
  selectedEdge: 0x0d1014,
  reachBand: 0.6,
  reachLine: 0.9,
  pathChevron: 0.9,
  pathEdge: 0.63,
  pin: 0xf2f6ff,
  pinEdge: 0x0d1014,
  pinMark: 0xb4453c,
  thresholdInk: 0xf2f6ff,
  civilizationCityBadgeInk: 0x0d1014,
  neutralCityBadgeInk: 0xd4d7db,
  unitBadgeInk: 0xf2f6ff,
  civilizationSignInk: 0x0d1014,
  neutralSignInk: 0xf2f6ff,
  enemySignInk: 0xf2f6ff,
  siteSignInk: 0xece2cc,
  health: 0x7fd14f,
  healthLost: 0x3a4049,
  heart: 0xef4739,
  skull: 0xf2f6ff,
  glyphOutline: 0x0d1014,
  thresholdNotMet: 0x3a4049,
  addedByTurn: 0.45,
  givenAlready: 0.45,
  settlePhase: 0x9fbb3a,
  panelFill: 0xd4d7db,
  panelEdge: 0x6f757d,
  ink: 0x0d1014,
  faintInk: 0x4a5058,
  paleInk: 0xd4d7db,
  answerInk: 0x9aa1a9,
  // `index.html`'s style reset holds this value too, for the letterbox around the canvas.
  page: 0x0d1117,
  mapOutline: 0x0d1014,
  fog: 0x4d4d4d,
  unassigned: 0x4d4d4d,
  borderBand: 0.6,
  unitHalo: 0.9,
  built: 0xcfc6b4,
  population: 0xf092b5,
  wellFill: 0xb4b9c0,
  wellLight: 0xeef0f3,
  influence: 0xd9a441,
  unknownFill: 0x5c6068,
  unknownInk: 0x2a2e34,
  greyedFill: 0x5c6068,
  greyedInk: 0x2a2e34,
  unpaidInk: 0x9aa1a9,
  unselected: 0.5,
  arrowEdge: 0x0d1117,
  regionEdge: 0x0d1014,
  deckCounts: 0x9aa1a9,
  panelDivide: 0x2c3340,
  scrollbarTrack: 0x2c3340,
  scrollbarThumb: 0x9aa1a9,
  whollyHeld: 0.5,
  cityRowEdge: 0xd4d7db,
  modeButtonEdge: 0x5c6068,
  cardEdge: 0x6f757d,
  copiesBadge: 0x232833,
  cardFamily: {
    unit: { hue: 46, saturation: 0.85, darkness: 0.84 },
    building: { hue: 176, saturation: 0.5, darkness: 0.52 },
    improvement: { hue: 70, saturation: 0.45, darkness: 0.58 },
    'thing-done': { hue: 42, saturation: 0.14, darkness: 1.12 },
    hazard: { hue: 356, saturation: 0.78, darkness: 0.6 },
    challenge: { hue: 344, saturation: 0.6, darkness: 0.38 },
    trophy: { hue: 38, saturation: 0.7, darkness: 0.78 },
  },
  cardNameInk: 0x34240f,
  cardTextInk: 0x2a2010,
  cardKindLabel: 0.72,
  cardDiscInk: 0xf2f6ff,
  cardTerrainOutline: 0.85,
  unaffordableDisc: 0xff6b66,
  liftedCard: 1.1,
  liftedShadow: { colour: 0x000000, strength: 0.5, blur: 9, fall: 5 },
  wornCard: 0.5,
  aimSlab: 0x232833,
  emptyEdge: 0x4a5058,
  takenPastNothing: 0xc0392b,
  affordableCard: { face: 0xd4d7db, ink: 0x0d1014 },
  refusedAnswer: { face: 0xa7abb1, ink: 0x3a3f45 },
  yieldPatch: { colour: 0x0d1014, strength: 0.7 },
  unitsInCityMode: 0.5,
  yieldNotGiven: 0.5,
  unitDim: 0.6,
  featureDisc: { colour: 0x0d1014, strength: 0.72 },
  featureDiscRim: { colour: 0xece2cc, strength: 0.55 },
  improvementDisc: 0.94,
  improvementDiscRim: 0.9,
  fertileTint: { colour: 0x3c9a3a, strength: 0.4 },
  flintTint: { colour: 0x5c6370, strength: 0.65 },
  monumentPatch: { colour: 0x302418, strength: 0.9 },
  scrim: { colour: 0x0d1014, strength: 0.82 },
  consolePanel: { colour: 0x0d1014, strength: 0.9 },
  reading: {
    food: 0x9ac464,
    production: 0xd37b09,
    military: 0xb05252,
    money: 0xefd039,
    science: 0x5093d8,
    culture: 0x9a6fb8,
  },
  terrain: {
    plain: 0x7d9c55,
    forest: 0x2f6f4e,
    hills: 0x9a8555,
    mountain: 0x6b5f57,
    coast: 0x3d6d9e,
    ocean: 0x2b4f7a,
    desert: 0xd6c08a,
  },
  ground: {
    nomadic: 0x2a5a41,
    stone: 0x4b4f58,
  },
  groundToCome: 0x6b4a26,
};

/** A colour in the notation a text style takes it in. */
export function css(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

/** A colour as it shows laid at this strength over the page's own colour. */
export function overPage(colour: number, strength: number): number {
  const channel = (shift: number): number => {
    const over = (colour >> shift) & 0xff;
    const under = (LOOK.page >> shift) & 0xff;
    return Math.round(over * strength + under * (1 - strength));
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** A colour multiplied by a tint, channel by channel, as a tint is multiplied into a texture. */
export function multiplied(colour: number, tint: number): number {
  const channel = (shift: number): number =>
    Math.round((((colour >> shift) & 0xff) * ((tint >> shift) & 0xff)) / 0xff);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** The tint that darkens a painting by as much as a wash of that strength darkens what lies under it. */
export function darkeningOf(strength: number): number {
  const channel = Math.round(0xff * (1 - strength));
  return (channel << 16) | (channel << 8) | channel;
}

/** What a card's every colour goes through as it is drawn. */
export type Tone = (colour: number) => number;

/** A colour as a card lying anywhere but worn shows it. */
export function unworn(colour: number): number {
  return colour;
}

/** A colour worn as the discard pile's top card and a dry draw pile are: darkened by a worn card's strength. */
export function worn(colour: number): number {
  return multiplied(colour, darkeningOf(LOOK.wornCard));
}

/**
 * The tone of a thing dimmed as one, every colour of it over the page at that strength: a container's
 * alpha fades each child alone, so what lies under a part would show through it.
 */
export function dimmedTo(strength: number): Tone {
  return (colour) => overPage(colour, strength);
}
