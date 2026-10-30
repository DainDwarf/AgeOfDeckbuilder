import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { type Chronicle, cardsInPiles, NO_REFUSAL } from '../rules/state';
import { type CardFace, createCardFace } from './card-face';
import type { Stratum } from './design-space';
import { cardFace } from './face';

/** One face per card of the chronicle, by key, standing hidden until a piece of the screen shows it. */
export type ChronicleFaces = {
  of(key: number): CardFace;
  /** A face made for every card the chronicle holds and no face stands for. */
  fillIn(chronicle: Chronicle): void;
  /** Every face whose card lies in none of the chronicle's piles destroyed. */
  lose(chronicle: Chronicle): void;
};

export function createChronicleFaces(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  opening: Chronicle,
): ChronicleFaces {
  const faces = new Map<number, CardFace>();

  const fillIn = (chronicle: Chronicle): void => {
    for (const card of cardsInPiles(chronicle)) {
      if (faces.has(card.key)) continue;
      const shown = cardFace(catalogue, card, chronicle.citySection.building);
      const face = createCardFace(scene, shown, NO_REFUSAL);
      on.layer.add(face.root.setVisible(false));
      faces.set(card.key, face);
    }
  };
  fillIn(opening);

  return {
    of(key: number): CardFace {
      const face = faces.get(key);
      if (face === undefined) throw new Error(`no face stands for the card of key ${key}`);
      return face;
    },
    fillIn,
    lose(chronicle: Chronicle): void {
      const held = new Set(cardsInPiles(chronicle).map(({ key }) => key));
      for (const [key, face] of faces) {
        if (held.has(key)) continue;
        face.root.destroy();
        faces.delete(key);
      }
    },
  };
}
