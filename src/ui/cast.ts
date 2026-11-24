import type { PreparedAs } from '../rules/enemies';
import type { Resource } from '../rules/resources';
import type { Faction } from '../rules/units';

/** The chronicle screen's three piles, each a symbol of the cast. */
export type PileKind = 'draw-pile' | 'discard-pile' | 'exhaust-pile';

/** The buttons that wear a sign and no word, each a symbol of the cast. */
export type ButtonSign =
  | 'end-turn-button'
  | 'menu-button'
  | 'icons-button'
  | 'faction-signs-button'
  | 'hex-grid-button'
  | 'minimize-button'
  | 'pinned-achievements-tab';

/**
 * What a glyph of the cast is drawn for: a resource, population, influence, a unit's health, a range,
 * a unit's move, action, sight or damage, an attack that would kill, what a prepare lands as, a unit
 * of the neutral's while it is hostile, a faction, a site, a card nothing plays, a pile, or a button.
 */
export type CastSymbol =
  | Resource
  | 'population'
  | 'influence'
  | 'health'
  | 'range'
  | 'move'
  | 'action'
  | 'sight'
  | 'damage'
  | 'killed'
  | PreparedAs
  | 'hostile'
  | Faction
  | 'site'
  | 'played-by-nothing'
  | PileKind
  | ButtonSign;

/** The file each symbol's glyph is drawn from, white for a tint to colour, under the assets folder. */
const GLYPH_FILES: Readonly<Record<CastSymbol, string>> = {
  food: 'material-design-icons/food-apple.svg',
  production: 'material-design-icons/hammer.svg',
  military: 'material-design-icons/sword-cross.svg',
  money: 'game-icons/two-coins.svg',
  science: 'material-design-icons/lightbulb-on.svg',
  culture: 'material-design-icons/music.svg',
  population: 'material-design-icons/account.svg',
  influence: 'material-design-icons/star.svg',
  health: 'material-design-icons/heart.svg',
  range: 'material-design-icons/target.svg',
  move: 'material-design-icons/arrow-all.svg',
  action: 'game-icons/fist.svg',
  sight: 'material-design-icons/eye.svg',
  damage: 'material-design-icons/sword.svg',
  killed: 'game-icons/death-skull.svg',
  pillage: 'game-icons/fire.svg',
  capture: 'material-design-icons/flag-variant.svg',
  hostile: 'game-icons/crossed-axes.svg',
  player: 'material-design-icons/crown.svg',
  neutral: 'material-design-icons/scale-balance.svg',
  enemy: 'material-design-icons/axe-battle.svg',
  site: 'material-design-icons/star-four-points.svg',
  'played-by-nothing': 'material-design-icons/block-helper.svg',
  'draw-pile': 'game-icons/stack.svg',
  'discard-pile': 'game-icons/card-discard.svg',
  'exhaust-pile': 'material-design-icons/archive.svg',
  'end-turn-button': 'game-icons/hourglass.svg',
  'menu-button': 'game-icons/hamburger-menu.svg',
  'icons-button': 'material-design-icons/map-marker.svg',
  'faction-signs-button': 'material-design-icons/shield-crown.svg',
  'hex-grid-button': 'material-design-icons/hexagon-multiple-outline.svg',
  'minimize-button': 'material-design-icons/eye-off.svg',
  'pinned-achievements-tab': 'material-design-icons/menu-left.svg',
};

/** The file a symbol's glyph is drawn from, and the frame of the glyphs sheet it stands in. */
export function glyphFileOf(symbol: CastSymbol): string {
  return GLYPH_FILES[symbol];
}

/** Every symbol's glyph file. */
export const EVERY_GLYPH_FILE: readonly string[] = Object.values(GLYPH_FILES);

/** Whether a key names a symbol of the cast. */
export function isCastSymbol(key: string): key is CastSymbol {
  return Object.hasOwn(GLYPH_FILES, key);
}
