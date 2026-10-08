/** One of the two hidings a tile stands under, named by the word that draws it back. */
export type Veil = 'uncharted' | 'fog';

/** Which veils the map still draws under: one taken off draws what it was hiding. */
export type Veils = Readonly<Record<Veil, boolean>>;

/** Both veils standing: the map as the game is played on it, and where a chronicle opens. */
export const VEILS_ON: Veils = { uncharted: true, fog: true };
