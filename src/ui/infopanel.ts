import type Phaser from 'phaser';
import { type Catalogue, damageOf } from '../rules/catalogue';
import { preparedAs } from '../rules/enemies';
import type { TilesBeside } from '../rules/map';
import { unitShown } from '../rules/sight';
import { type Chronicle, NO_REFUSAL } from '../rules/state';
import { relationsOf } from '../rules/units';
import {
  CARD_HEIGHT,
  type CardFace,
  createCardFace,
  createFootBubble,
  type Name,
  type SmallCards,
} from './card-face';
import { CARD_WIDTH } from './card-frames';
import { stopMotion } from './card-motion';
import type { Stratum } from './design-space';
import {
  buildingFace,
  type Face,
  type TerrainReading,
  terrainFace,
  terrainOnTile,
  type UnitReading,
  unitFace,
} from './face';
import { LOOK } from './look';
import type { Drawn, TileFace } from './map';
import type { Tooltip } from './tooltip';

/** A card waiting behind the one the panel stands: grey paper the size of a card, from its top-left corner. */
function drawGhost(surface: Phaser.GameObjects.Graphics, x: number, y: number): void {
  const radius = 0.0585 * CARD_WIDTH;
  surface.fillStyle(LOOK.affordableCard.face);
  surface.fillRoundedRect(x, y, CARD_WIDTH, CARD_HEIGHT, radius);
  surface.lineStyle(1, LOOK.cardEdge);
  surface.strokeRoundedRect(x + 0.5, y + 0.5, CARD_WIDTH - 1, CARD_HEIGHT - 1, radius);
}

/** One card an inspection steps through: the unit's, the building's and the terrain's, each a face. */
export type Card =
  | { readonly kind: 'unit'; readonly unit: UnitReading }
  | { readonly kind: 'building'; readonly building: string }
  | { readonly kind: 'terrain'; readonly terrain: TerrainReading };

/**
 * What the map draws of a tile, as the cards an inspection steps: the unit card, the building card,
 * and the terrain card, which always stands, its window's discs standing where `discs` says.
 */
export function cardsOf(
  catalogue: Catalogue,
  face: Drawn,
  chronicle: Pick<
    Chronicle,
    'city' | 'neutral' | 'relations' | 'turn' | 'timeline' | 'units' | 'rivers'
  >,
  beside: TilesBeside,
  discs: boolean,
): Card[] {
  const { tile } = face;
  const cards: Card[] = [];

  const unit = unitShown(chronicle.units, face);
  if (unit !== undefined) {
    const prepares = preparedAs(chronicle, unit);
    const hostile = unit.faction === 'neutral' && relationsOf(chronicle) === 'hostile';
    const damage = damageOf(catalogue, chronicle.units, unit);
    cards.push({ kind: 'unit', unit: { ...unit, damage, prepares, hostile } });
  }

  if (tile.building !== undefined) cards.push({ kind: 'building', building: tile.building });

  cards.push({
    kind: 'terrain',
    terrain: terrainOnTile(catalogue, chronicle, tile, beside, discs),
  });

  return cards;
}

export type InfoPanel = {
  /**
   * The card at `index`, beside the tile, over one ghost per card behind it. `cycling` dissolves it
   * out of the card already shown; anything else is instant.
   */
  show(cards: Card[], index: number, at: TileFace, cycling: boolean): void;
  /**
   * Stands what it is showing beside the same face again, at the size on screen it already had:
   * the map now measures in a different unit. Whatever a name or the foot had raised goes down.
   */
  rescale(): void;
  /** The card standing read again, in place, as `card` now reads; whatever it had raised goes down. */
  reread(card: Card): void;
  hide(): void;
};

/**
 * What the names on a card that is a face raise on the screen standing over the map: its small
 * cards, on the stratum they stand on, and the named thing shown large.
 */
export type PanelNames = {
  readonly small: Pick<SmallCards, 'over' | 'down'>;
  readonly on: Stratum;
  inspect(name: Name): void;
};

/** How far the panel stands clear of the face it reads, in design pixels. */
const STANDOFF = 12;

/** How far each card waiting behind the panel stands out of it, down and to the right. */
const GHOST_OFFSET = 4;

/** How long one card takes to dissolve into the next. */
const CYCLE_MS = 150;

/** The face the panel stands, which its root holds laid out from its top-left corner. */
type Shown = {
  readonly root: Phaser.GameObjects.Container;
  readonly face: CardFace;
};

/**
 * A tile inspected, one card at a time over the ghosts of the rest. It stands on the map, so a pan
 * carries it; every show rebuilds the card, so whatever changes the state dismisses the panel.
 */
export function createInfoPanel(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  tooltip: Tooltip,
  names: PanelNames,
): InfoPanel {
  const ghosts = scene.add.graphics();
  // Interactive, so no press reaches the map's catchers under it, and never marked as reacting to one.
  const stop = scene.add.zone(0, 0, CARD_WIDTH, CARD_HEIGHT).setOrigin(0, 0).setInteractive();
  const panel = scene.add.container(0, 0, [ghosts, stop]).setName('infopanel').setVisible(false);
  on.layer.add(panel);
  const footBubble = createFootBubble(tooltip);

  let standing: Shown | undefined;
  let leaving: Shown | undefined;
  /** How many cards wait behind the one standing: the ghosts, and the room they ask for. */
  let behind = 0;
  /** The face the panel is standing beside, and nothing while it stands nowhere. */
  let beside: TileFace | undefined;
  /** Whether the small cards were last told the pointer is on a name of the face standing. */
  let onName = false;
  /** Whether the small cards standing were raised off a name of the face standing. */
  let chained = false;

  /** What the standing card's names and foot raised, taken down. */
  const letGo = (): void => {
    if (standing !== undefined) footBubble.over(standing.face, undefined);
    if (onName) names.small.over(undefined);
    if (chained) names.small.down();
    onName = false;
    chained = false;
  };

  /** Where a point of the map stands on the screen the small cards stand on. */
  const onScreen = (x: number, y: number): { x: number; y: number } => {
    const canvas = on.onCanvas(x, y);
    return names.on.at(canvas.x, canvas.y);
  };

  /**
   * A face drawn as a card is in the hand, its top-left corner where the panel's cards stand theirs;
   * its names raise the screen's small cards while it stands, and its foot the map's bubble.
   */
  const faceOf = (shown: Face): Shown => {
    const face: CardFace = createCardFace(scene, shown, NO_REFUSAL, {
      names: {
        over: (name) => {
          onName = name !== undefined;
          names.small.over(
            name === undefined
              ? undefined
              : {
                  name,
                  where: () => {
                    const spot = face.spotOf(name);
                    const top = onScreen(spot.x, spot.top);
                    const bottom = onScreen(spot.x, spot.bottom);
                    return { x: top.x, top: top.y, bottom: bottom.y };
                  },
                  hold: (held) => {
                    chained = held;
                  },
                },
          );
        },
        inspect: (name) => {
          names.inspect(name);
        },
        footOver: (label) => {
          footBubble.over(face, label);
        },
      },
    });
    face.root.setPosition(CARD_WIDTH / 2, CARD_HEIGHT);
    return { root: scene.add.container(0, 0, [face.root]), face };
  };

  /** The face the panel stands a card as: its unit's, its building's or its terrain's. */
  const faceFor = (card: Card): Face => {
    switch (card.kind) {
      case 'unit':
        return unitFace(catalogue, card.unit);
      case 'building':
        return buildingFace(catalogue, card.building);
      case 'terrain':
        return terrainFace(card.terrain);
    }
  };

  /**
   * Level with the face it reads, clear of its rim, at the size on screen the card was laid out at,
   * each ghost behind it the size of the card standing.
   */
  const stand = (at: TileFace): void => {
    beside = at;
    const unit = on.unit();
    ghosts.clear();
    for (let ghost = behind; ghost >= 1; ghost--) {
      drawGhost(ghosts, ghost * GHOST_OFFSET, ghost * GHOST_OFFSET);
    }
    stop.setSize(CARD_WIDTH + behind * GHOST_OFFSET, CARD_HEIGHT + behind * GHOST_OFFSET);
    panel
      .setScale(unit)
      .setPosition(at.x + at.radius + STANDOFF * unit, at.y - (CARD_HEIGHT / 2) * unit);
  };

  /** Ends a dissolve where it was headed: the card coming in stands in place, the old one is gone. */
  const settle = (): void => {
    if (leaving !== undefined) {
      stopMotion(scene, leaving.root);
      leaving.root.destroy();
      leaving = undefined;
    }
    if (standing !== undefined) {
      stopMotion(scene, standing.root);
      standing.root.setPosition(0, 0).setAlpha(1);
    }
  };

  const hide = (): void => {
    letGo();
    settle();
    standing?.root.destroy();
    standing = undefined;
    beside = undefined;
    ghosts.clear();
    panel.setVisible(false);
  };

  return {
    hide,

    show(cards: Card[], index: number, at: TileFace, cycling: boolean): void {
      letGo();
      settle();

      const outgoing = standing;
      if (!cycling) outgoing?.root.destroy();

      const shown = faceOf(faceFor(cards[index]));
      behind = cards.length - 1;
      stand(at);
      // Under the card it replaces, so the dissolve uncovers it, and over the stop either way.
      panel.addAt(shown.root, panel.getIndex(stop) + 1);
      standing = shown;

      if (cycling && outgoing !== undefined) {
        leaving = outgoing;
        outgoing.face.deaden();
        shown.root.setPosition(GHOST_OFFSET, GHOST_OFFSET).setAlpha(0);
        scene.tweens.add({ targets: shown.root, x: 0, y: 0, alpha: 1, duration: CYCLE_MS });
        scene.tweens.add({
          targets: outgoing.root,
          alpha: 0,
          duration: CYCLE_MS,
          onComplete: () => {
            outgoing.root.destroy();
            leaving = undefined;
          },
        });
      }

      panel.setData('card', cards[index].kind).setVisible(true);
    },

    rescale(): void {
      if (beside === undefined || standing === undefined) return;
      letGo();
      stand(beside);
    },

    reread(card: Card): void {
      if (standing === undefined) return;
      letGo();
      standing.face.read(faceFor(card), NO_REFUSAL);
    },
  };
}
