import type { Resource } from '../rules/resources';

/** What the resource bar reads: one resource, or the idle population. */
export type BarReading = Resource | 'idle';

/** A colour laid over what is under it, at the strength it rests at. */
export type Wash = { readonly colour: number; readonly strength: number };

/** How strongly a glow rests on the tile it is drawn over: its face, and the line around it. */
export type Glow = { readonly fill: number; readonly stroke: number };

/** The paper one card face is drawn on. */
export type Paper = {
  readonly face: number;
  readonly art: number;
  readonly artEdge: number;
  readonly ink: number;
};

/** Which role paints a building's mark. */
export type BuildingRole = 'built' | 'civilization' | 'enemy';

/** Every colour of the screen, by the role it paints. */
export type Look = {
  readonly button: number;
  readonly cityMode: number;
  readonly actWaiting: number;
  readonly civilization: number;
  readonly enemy: number;
  readonly pileCount: number;
  readonly selected: number;
  readonly selectedEdge: number;
  readonly thresholdInk: number;
  readonly settlePhase: number;
  readonly panelFill: number;
  readonly panelEdge: number;
  readonly ink: number;
  readonly faintInk: number;
  readonly paleInk: number;
  readonly answerInk: number;
  readonly page: number;
  readonly mapOutline: number;
  readonly mapRim: number;
  readonly lit: number;
  readonly river: number;
  readonly built: number;
  readonly population: number;
  readonly wellFill: number;
  readonly wellLight: number;
  readonly influence: number;
  readonly unknownFill: number;
  readonly unknownInk: number;
  readonly greyedFill: number;
  readonly greyedInk: number;
  /** The strength an option of the launch screen rests at while another of its row is selected. */
  readonly unselected: number;
  readonly arrowEdge: number;
  readonly regionEdge: number;
  readonly deckCounts: number;
  /** The edge between the two panels of the collection screen. */
  readonly panelDivide: number;
  /** The strength a stack of the collection stands at whose every copy the deck holds. */
  readonly whollyHeld: number;
  /** The edge around the city section's row of a deck. */
  readonly cityRowEdge: number;
  /** The edge of a button that changes the collection screen's mode. */
  readonly modeButtonEdge: number;
  readonly cardEdge: number;
  readonly cardBack: number;
  readonly aimSlab: number;
  readonly emptyEdge: number;
  readonly unaffordableMark: number;
  readonly affordableCard: Paper;
  readonly unaffordableCard: Paper;
  readonly mapDim: Wash;
  readonly scrim: Wash;
  readonly consolePanel: Wash;
  readonly litGlow: Glow;
  readonly targetGlow: Glow;
  readonly reading: Readonly<Record<Resource, number>>;
  readonly terrain: Readonly<Record<string, number>>;
  readonly feature: Readonly<Record<string, number>>;
  readonly building: Readonly<Record<string, BuildingRole>>;
  /** The ground each age stands on in the technology tree, by the age's id. */
  readonly ground: Readonly<Record<string, number>>;
};

// Roles that agree on a value today are still separate entries: one theme decision recolours one
// role, and a merge here would drag the others with it.
export const LOOK: Look = {
  button: 0xd9a441,
  cityMode: 0xd9a441,
  actWaiting: 0xd9a441,
  civilization: 0xd9a441,
  enemy: 0xb4453c,
  pileCount: 0xd9a441,
  selected: 0xf2f6ff,
  selectedEdge: 0x0d1014,
  thresholdInk: 0xf2f6ff,
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
  mapRim: 0x5c6068,
  lit: 0xf2f6ff,
  river: 0x62a9e0,
  built: 0xcfc6b4,
  population: 0x6b6b7d,
  wellFill: 0xb4b9c0,
  wellLight: 0xeef0f3,
  influence: 0xd9a441,
  unknownFill: 0x5c6068,
  unknownInk: 0x2a2e34,
  greyedFill: 0x5c6068,
  greyedInk: 0x2a2e34,
  unselected: 0.5,
  arrowEdge: 0x0d1117,
  regionEdge: 0x0d1014,
  deckCounts: 0x9aa1a9,
  panelDivide: 0x2c3340,
  whollyHeld: 0.5,
  cityRowEdge: 0xd4d7db,
  modeButtonEdge: 0x5c6068,
  cardEdge: 0x6f757d,
  cardBack: 0x232833,
  aimSlab: 0x232833,
  emptyEdge: 0x4a5058,
  unaffordableMark: 0xc0392b,
  affordableCard: { face: 0xd4d7db, art: 0xb6bbc2, artEdge: 0x9aa0a8, ink: 0x0d1014 },
  unaffordableCard: { face: 0xa7abb1, art: 0x8f959c, artEdge: 0x7c828a, ink: 0x3a3f45 },
  mapDim: { colour: 0x0d1014, strength: 0.6 },
  scrim: { colour: 0x0d1014, strength: 0.82 },
  consolePanel: { colour: 0x0d1014, strength: 0.9 },
  litGlow: { fill: 0.4, stroke: 0.9 },
  targetGlow: { fill: 0.4, stroke: 0.9 },
  reading: {
    food: 0x7d9c55,
    production: 0xb0834a,
    military: 0xb05252,
    money: 0xa08a1e,
    science: 0x5f8fc0,
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
  feature: {
    fertile: 0x4a7a2d,
    deer: 0x8a5a2b,
    cattle: 0xf2f6ff,
    flint: 0x4b4f58,
    oasis: 0x2f8f83,
  },
  building: {
    city: 'civilization',
    camp: 'enemy',
    shelter: 'built',
    farm: 'built',
  },
  ground: {
    nomadic: 0x2a5a41,
    stone: 0x4b4f58,
  },
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

/** A colour worn down as the discard pile's top card and a dry draw pile are: CSS `grayscale(0.35) brightness(0.75)`. */
export function worn(colour: number): number {
  const red = (colour >> 16) & 0xff;
  const green = (colour >> 8) & 0xff;
  const blue = colour & 0xff;
  const grey = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const wear = (channel: number): number => Math.round((channel * 0.65 + grey * 0.35) * 0.75);
  return (wear(red) << 16) | (wear(green) << 8) | wear(blue);
}
