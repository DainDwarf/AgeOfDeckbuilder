import Phaser from 'phaser';
import { CARD_KINDS, CARDS, type CardId } from '../rules/cards';
import type { Chronicle, Resource } from '../rules/chronicle';
import { createCardFace } from './card-face';
import { addText, DESIGN_HEIGHT, DESIGN_WIDTH, MARGIN, onClick, UI_FONT } from './design-space';
import { BAR_HEIGHT } from './resource-bar';
import { text } from './text';

const SCRIM = 0x0d1014;
const SCRIM_ALPHA = 0.82;

/** Above the tooltip, the end-turn button and every lifted hand card. */
const DEPTH = 100;

const TITLE_INK = '#d4d7db';
const BROWSE_WIDTH = 180;
const BROWSE_GAP = 26;
const ZOOM_WIDTH = 380;

export type PileKind = 'draw-pile' | 'discard-pile';

export type Overlay = {
  browse(pile: PileKind, chronicle: Chronicle): void;
  zoom(id: CardId, unaffordable: readonly Resource[]): void;
};

/**
 * The scrim and what stands on it: a pile's cards laid out, or one card large. The scrim swallows
 * every pointer beneath it, so the table is inert while either is open.
 */
export function createOverlay(scene: Phaser.Scene): Overlay {
  const scrim = scene.add
    .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, SCRIM, SCRIM_ALPHA)
    .setOrigin(0, 0)
    .setDepth(DEPTH)
    .setVisible(false);

  let shown: Phaser.GameObjects.GameObject[] = [];
  let browsing: { pile: PileKind; cards: readonly CardId[] } | undefined;
  let zoomed = false;

  const wipe = (): void => {
    for (const object of shown) object.destroy();
    shown = [];
  };

  const close = (): void => {
    wipe();
    browsing = undefined;
    zoomed = false;
    scrim.setVisible(false).disableInteractive();
  };

  const showZoom = (id: CardId, unaffordable: readonly Resource[]): void => {
    wipe();
    scrim.setVisible(true).setInteractive();
    zoomed = true;
    const { root } = createCardFace(scene, id, unaffordable, { width: ZOOM_WIDTH });
    root
      .setPosition(DESIGN_WIDTH / 2, (DESIGN_HEIGHT + Math.round(ZOOM_WIDTH * 1.4)) / 2)
      .setDepth(DEPTH + 1);
    shown.push(root);
  };

  const showBrowse = (pile: PileKind, cards: readonly CardId[]): void => {
    wipe();
    scrim.setVisible(true).setInteractive();
    browsing = { pile, cards };
    zoomed = false;

    const title = addText(
      scene,
      DESIGN_WIDTH / 2,
      BAR_HEIGHT + MARGIN,
      text(`browse.${pile}`, { count: cards.length }),
      { fontFamily: UI_FONT, fontSize: '26px', fontStyle: 'bold', color: TITLE_INK },
    )
      .setOrigin(0.5, 0)
      .setDepth(DEPTH + 1);
    shown.push(title);

    const height = Math.round(BROWSE_WIDTH * 1.4);
    const top = title.y + title.height + MARGIN;
    const columns = Math.max(
      1,
      Math.floor((DESIGN_WIDTH - 2 * MARGIN + BROWSE_GAP) / (BROWSE_WIDTH + BROWSE_GAP)),
    );
    const rows = Math.max(1, Math.ceil(cards.length / columns));
    const spanY = rows * height + (rows - 1) * BROWSE_GAP;
    const firstY = top + Math.max(0, (DESIGN_HEIGHT - MARGIN - top - spanY) / 2);

    cards.forEach((id, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const inRow = Math.min(columns, cards.length - row * columns);
      const spanX = inRow * BROWSE_WIDTH + (inRow - 1) * BROWSE_GAP;
      const { root } = createCardFace(scene, id, [], { width: BROWSE_WIDTH });
      root
        .setPosition(
          (DESIGN_WIDTH - spanX) / 2 + column * (BROWSE_WIDTH + BROWSE_GAP) + BROWSE_WIDTH / 2,
          firstY + row * (height + BROWSE_GAP) + height,
        )
        .setDepth(DEPTH + 1)
        .setInteractive({
          hitArea: new Phaser.Geom.Rectangle(-BROWSE_WIDTH / 2, -height, BROWSE_WIDTH, height),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          cursor: 'pointer',
        });
      onClick(root, () => showZoom(id, []));
      shown.push(root);
    });
  };

  const back = (): void => {
    if (zoomed && browsing !== undefined) showBrowse(browsing.pile, browsing.cards);
    else close();
  };

  onClick(scrim, back);
  scene.input.keyboard?.on('keydown-ESC', () => {
    if (scrim.visible) back();
  });

  return {
    browse(pile: PileKind, chronicle: Chronicle): void {
      showBrowse(pile, cardsOf(pile, chronicle));
    },
    zoom: showZoom,
  };
}

/** The draw pile gives its draw order away to no one: it reads by kind, then by name. */
function cardsOf(pile: PileKind, chronicle: Chronicle): readonly CardId[] {
  if (pile === 'discard-pile') return [...chronicle.discardPile].reverse();
  return [...chronicle.drawPile].sort(
    (a, b) =>
      CARD_KINDS.indexOf(CARDS[a].kind) - CARD_KINDS.indexOf(CARDS[b].kind) ||
      text(`card.${a}`).localeCompare(text(`card.${b}`)),
  );
}
