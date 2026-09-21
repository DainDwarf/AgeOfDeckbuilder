import type { Resource } from '../rules/resources';

/** What the resource bar reads: one resource, or the population. */
export type Reading = Resource | 'population';

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
export type BuildingRole = 'built' | 'enemyRed';

/** Every colour of the screen, by the role it paints. */
export type Look = {
  readonly accent: number;
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
  readonly enemyRed: number;
  readonly built: number;
  readonly wellFill: number;
  readonly wellLight: number;
  readonly cardEdge: number;
  readonly cardBack: number;
  readonly aimSlab: number;
  readonly aimPointEdge: number;
  readonly emptyEdge: number;
  readonly unaffordableMark: number;
  readonly affordableCard: Paper;
  readonly unaffordableCard: Paper;
  readonly mapDim: Wash;
  readonly scrim: Wash;
  readonly consolePanel: Wash;
  readonly litGlow: Glow;
  readonly targetGlow: Glow;
  readonly reading: Readonly<Record<Reading, number>>;
  readonly terrain: Readonly<Record<string, number>>;
  readonly feature: Readonly<Record<string, number>>;
  readonly building: Readonly<Record<string, BuildingRole>>;
};

// Roles that agree on a value today are still separate entries: one theme decision recolours one
// role, and a merge here would drag the others with it.
export const LOOK: Look = {
  accent: 0xd9a441,
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
  enemyRed: 0xb4453c,
  built: 0xcfc6b4,
  wellFill: 0xb4b9c0,
  wellLight: 0xeef0f3,
  cardEdge: 0x6f757d,
  cardBack: 0x232833,
  aimSlab: 0x232833,
  aimPointEdge: 0x0d1014,
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
    population: 0x6b6b7d,
  },
  terrain: {
    plain: 0x7d9c55,
    forest: 0x2f6f4e,
    hills: 0x9a8555,
    mountain: 0x6b5f57,
    coast: 0x3d6d9e,
    deep: 0x2b4f7a,
    ocean: 0x2b4f7a,
    urban: 0x8f8f9c,
  },
  feature: {
    PH_Fertile: 0x4a7a2d,
    fertile: 0x4a7a2d,
    wildlife: 0x8a5a2b,
    flint: 0x4b4f58,
  },
  building: {
    PH_City: 'built',
    PH_Farm: 'built',
    PH_Camp: 'enemyRed',
    city: 'built',
    camp: 'enemyRed',
    shelter: 'built',
  },
};

/** A colour in the notation a text style takes it in. */
export function css(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
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
