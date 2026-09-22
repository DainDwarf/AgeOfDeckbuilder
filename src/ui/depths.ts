/**
 * What stands over what, in one order across both surfaces. The map and the UI are two scenes, the
 * UI's rendered second, so every UI object paints over every map object whatever their numbers: only
 * the map's rows coming first here makes one table read true across both.
 */
export const DEPTH = {
  /** The terrain and everything drawn flat on it, and the zone that takes the map's presses. */
  terrain: 0,
  /** The tiles lit for a move or an aim, and the units glowed for an attack. */
  lit: 100,
  buildings: 200,
  units: 300,
  fog: 400,
  cityMarks: 500,
  yieldDim: 600,
  /** What the map keeps at full strength through the yield overlay's dim. */
  throughDim: 700,
  ring: 800,
  yieldGlyphs: 900,
  cultureThreshold: 1000,
  infopanel: 1100,

  band: 1200,
  /** The frame and chip of the mode the chronicle screen stands in. */
  standing: 1300,
  piles: 1400,
  /** The cards of the hand where they rest, by their slot. */
  restingCards: 1500,
  resourceBar: 1600,
  endTurn: 1700,
  /** The cards in the air, by their place in the block. */
  inFlight: 1800,
  liftedCard: 1900,
  aimLine: 2000,
  refusalNote: 2100,

  tooltip: 2500,
} as const;
