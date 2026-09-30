import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { type CardId, NO_REFUSAL } from '../rules/state';
import { createCardFace, dashAlong, heightOf } from './card-face';
import type { CollectionStack, DeckRows } from './collection-layout';
import { CARD_WIDTH, type Cell, linesOf, spanOf, stackOf } from './collection-stack';
import { addText, type Box, ownBoxOf, UI_FONT } from './design-space';
import { cardFaceAtStart, type Face } from './face';
import { css, LOOK } from './look';
import type { Filled, Held } from './panel';
import { type Answers, answersOf, type Inspecting } from './stack';
import { type TextKey, text } from './text';

const SECTION_TOP = 6;
const UNDER_SECTION = 10;
const DECK_GAP = 16;
const COUNT_GAP = 12;

const ROW_HEIGHT = 30;
const ROWS_APART = 4;
const ROW_PAD = 10;
const COSTS_WIDTH = 46;
const ROW_GAP = 8;
const COPIES_WIDTH = 30;
const CHIP = 7.8;
const CHIP_MARGIN = 2;
const COST_GAP = 3;

const CITY_MARGIN = 4;
const CITY_EDGE = 2;
const CITY_EDGE_OFF = 2;

const EMPTY_PAD = 10;

const SECTION_SIZE = 13;
const SECTION_STYLE = {
  fontFamily: UI_FONT,
  fontSize: `${SECTION_SIZE}px`,
  color: css(LOOK.deckCounts),
  letterSpacing: 0.1 * SECTION_SIZE,
};
const COUNT_STYLE = {
  fontFamily: UI_FONT,
  fontSize: `${SECTION_SIZE}px`,
  color: css(LOOK.deckCounts),
};
const INK = css(LOOK.affordableCard.ink);
const COST_STYLE = { fontFamily: UI_FONT, fontSize: '13px', fontStyle: 'bold', color: INK };
const NAME_STYLE = { fontFamily: UI_FONT, fontSize: '14px', fontStyle: 'bold', color: INK };
const KIND_SIZE = 11;
const KIND_STYLE = {
  fontFamily: UI_FONT,
  fontSize: `${KIND_SIZE}px`,
  color: css(LOOK.faintInk),
  letterSpacing: 0.12 * KIND_SIZE,
};

/** What a row answers: the right click shows its card large, and it raises nothing small. */
function rowAnswersOf(face: Face, { large }: Inspecting): Answers {
  return {
    point() {},
    rests() {
      return false;
    },
    inspect() {
      large.show(face);
    },
  };
}

/**
 * One card as a row in the box, in a card's colours at the roundness handed: its cost, its name, its
 * kind and the copies the section holds, where it counts them.
 */
function rowOf(
  scene: Phaser.Scene,
  face: Face,
  copies: number | undefined,
  { x, y, width }: Box,
  radius: number,
  name: string,
): Phaser.GameObjects.Container {
  const middle = ROW_HEIGHT / 2;
  const surface = scene.add
    .graphics()
    .fillStyle(LOOK.affordableCard.face)
    .fillRoundedRect(0, 0, width, ROW_HEIGHT, radius)
    .lineStyle(1, LOOK.cardEdge)
    .strokeRoundedRect(0.5, 0.5, width - 1, ROW_HEIGHT - 1, radius);
  const costs: Phaser.GameObjects.GameObject[] = [];
  let at = ROW_PAD;
  for (const { resource, amount } of face.costs) {
    costs.push(
      scene.add
        .rectangle(at + CHIP_MARGIN + CHIP / 2, middle, CHIP, CHIP, LOOK.reading[resource])
        .setAngle(45),
    );
    at += CHIP + 2 * CHIP_MARGIN + COST_GAP;
    const value = addText(scene, at, middle, String(amount), COST_STYLE).setOrigin(0, 0.5);
    costs.push(value);
    at += value.width + COST_GAP;
  }
  const named = addText(
    scene,
    ROW_PAD + COSTS_WIDTH + ROW_GAP,
    middle,
    face.name,
    NAME_STYLE,
  ).setOrigin(0, 0.5);
  const kind = addText(
    scene,
    width - ROW_PAD - COPIES_WIDTH - ROW_GAP,
    middle,
    text(`kind.${face.kind}`).toUpperCase(),
    KIND_STYLE,
  ).setOrigin(1, 0.5);
  const counted =
    copies === undefined
      ? []
      : [
          addText(
            scene,
            width - ROW_PAD,
            middle,
            text('collection.row-copies', { copies }),
            NAME_STYLE,
          )
            .setOrigin(1, 0.5)
            .setName(`${name}-copies`),
        ];
  return scene.add
    .container(x, y, [surface, ...costs, named, kind, ...counted])
    .setName(name)
    .setData('card', face.id);
}

/** A section's word from the left and the top handed, and the count of its cards on its line, unplaced sideways. */
function sectionOf(
  scene: Phaser.Scene,
  word: TextKey,
  cards: number,
  { left, top }: { left: number; top: number },
  name: string,
): { label: Phaser.GameObjects.Text; count: Phaser.GameObjects.Text; bottom: number } {
  const label = addText(scene, left, top, text(word).toUpperCase(), SECTION_STYLE).setName(name);
  const count = addText(scene, 0, top, text('collection.cards', { cards }), COUNT_STYLE).setName(
    `${name}-count`,
  );
  return { label, count, bottom: top + Math.max(label.height, count.height) };
}

/** The pale edge around the city section's card, standing in the box at the roundness handed. */
function cityEdgeOf(scene: Phaser.Scene, box: Box, radius: number): Phaser.GameObjects.Graphics {
  const off = CITY_EDGE_OFF + CITY_EDGE / 2;
  return scene.add
    .graphics()
    .lineStyle(CITY_EDGE, LOOK.cityRowEdge)
    .strokeRoundedRect(
      box.x - off,
      box.y - off,
      box.width + 2 * off,
      box.height + 2 * off,
      radius + off,
    );
}

/** The dashed box from the top handed, between the left and the right, saying the deck holds no card. */
function emptyDeckOf(
  scene: Phaser.Scene,
  { left, right, top }: { left: number; right: number; top: number },
  name: string,
): { parts: Phaser.GameObjects.GameObject[]; bottom: number } {
  const empty = addText(
    scene,
    left + 1 + EMPTY_PAD,
    top + 1 + EMPTY_PAD,
    text('collection.empty-deck'),
    COUNT_STYLE,
  ).setName(name);
  const bottom = empty.y + empty.height + EMPTY_PAD + 1;
  const edge = scene.add.graphics().lineStyle(1, LOOK.emptyEdge);
  dashAlong(edge, [
    { x: left + 0.5, y: top + 0.5 },
    { x: right - 0.5, y: top + 0.5 },
    { x: right - 0.5, y: bottom - 0.5 },
    { x: left + 0.5, y: bottom - 0.5 },
    { x: left + 0.5, y: top + 0.5 },
  ]);
  return { parts: [edge, empty], bottom };
}

/**
 * The civilization's panel of the deck editing mode, from the top handed, between the left and the
 * right handed: its settle section under its word and count, the city section's card at its head in
 * a pale edge, then its deck under its word and count, or the sentence that says it holds no card.
 */
export function deckPanelOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  {
    city,
    deck,
    counts,
    remove,
    lands,
  }: {
    readonly city: CardId;
    readonly deck: DeckRows;
    readonly counts: { readonly cards: number; readonly settle: number };
    readonly remove: (card: CardId) => void;
    readonly lands: Box;
  },
  {
    left,
    right,
    top,
    radius,
  }: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly radius: number;
  },
  inspecting: Inspecting,
): Filled {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const held: Held[] = [];
  const width = right - left;

  const section = (word: TextKey, cards: number, from: number, name: string): number => {
    const { label, count, bottom } = sectionOf(scene, word, cards, { left, top: from }, name);
    count.setOrigin(1, 0).setX(right);
    parts.push(label, count);
    return bottom;
  };

  const row = (
    face: Face,
    copies: number | undefined,
    box: Box,
    name: string,
    press?: () => void,
  ): void => {
    parts.push(rowOf(scene, face, copies, box, radius, name));
    held.push({
      box,
      answers: rowAnswersOf(face, inspecting),
      press,
      carry: { copy: () => rowOf(scene, face, copies, box, radius, 'carried-card'), lands },
    });
  };

  const rows = (stacks: readonly CollectionStack[], from: number): number => {
    let y = from;
    for (const [at, { id, copies }] of stacks.entries()) {
      if (at > 0) y += ROWS_APART;
      row(
        cardFaceAtStart(catalogue, id),
        copies,
        { x: left, y, width, height: ROW_HEIGHT },
        `deck-row-${id}`,
        () => remove(id),
      );
      y += ROW_HEIGHT;
    }
    return y;
  };

  let y = section('collection.settle', counts.settle, top + SECTION_TOP, 'deck-section-settle');
  const cityTop = y + UNDER_SECTION + CITY_MARGIN;
  const cityBox = {
    x: left + CITY_MARGIN,
    y: cityTop,
    width: width - 2 * CITY_MARGIN,
    height: ROW_HEIGHT,
  };
  parts.push(cityEdgeOf(scene, cityBox, radius));
  row(cardFaceAtStart(catalogue, city), undefined, cityBox, 'deck-city');
  y = cityTop + ROW_HEIGHT + CITY_MARGIN;
  if (deck.settle.length > 0) y = rows(deck.settle, y + ROWS_APART);

  y = section('collection.deck', counts.cards, y + DECK_GAP, 'deck-section-cards') + UNDER_SECTION;
  if (deck.cards.length > 0) return { parts, held, foot: rows(deck.cards, y) };

  const empty = emptyDeckOf(scene, { left, right, top: y }, 'deck-empty');
  parts.push(...empty.parts);
  return { parts, held, foot: empty.bottom };
}

/**
 * The civilization's panel of the civilization mode, a block `across` stacks wide from the left and
 * the top handed: each section under its word, its count beside it, each card a stack reading the
 * copies held over those the collection owns, the city section's card a face alone at the head.
 */
export function civilizationPanelOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  {
    city,
    deck,
    counts,
    collection,
  }: {
    readonly city: CardId;
    readonly deck: DeckRows;
    readonly counts: { readonly cards: number; readonly settle: number };
    readonly collection: readonly { readonly id: CardId }[];
  },
  {
    left,
    top,
    across,
    radius,
  }: {
    readonly left: number;
    readonly top: number;
    readonly across: number;
    readonly radius: number;
  },
  inspecting: Inspecting,
): Filled {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const held: Held[] = [];
  const right = left + spanOf(across);

  const section = (word: TextKey, cards: number, from: number, name: string): number => {
    const { label, count, bottom } = sectionOf(scene, word, cards, { left, top: from }, name);
    const end = ownBoxOf(label);
    count.setX(count.x + end.x + end.width + COUNT_GAP - ownBoxOf(count).x);
    parts.push(label, count);
    return bottom + UNDER_SECTION;
  };

  const stack =
    (row: CollectionStack): Cell =>
    (at) =>
      stackOf(
        scene,
        catalogue,
        row,
        at,
        'civilization',
        {
          reads: text('collection.in-deck', {
            held: row.copies,
            copies: collection.filter(({ id }) => id === row.id).length,
          }),
          dimmed: false,
        },
        undefined,
        inspecting,
        undefined,
        undefined,
      );

  const cityCell: Cell = ({ left: x, top: y }) => {
    const shown = cardFaceAtStart(catalogue, city);
    const card = createCardFace(scene, shown, NO_REFUSAL, { width: CARD_WIDTH });
    const box = { x, y, width: CARD_WIDTH, height: heightOf(CARD_WIDTH) };
    card.root
      .setPosition(x + CARD_WIDTH / 2, y + box.height)
      .setName('civilization-city')
      .setData('card', city);
    return {
      parts: [cityEdgeOf(scene, box, radius), card.root],
      held: [{ box, answers: answersOf(card, shown, inspecting) }],
      bottom: y + box.height + CITY_EDGE_OFF + CITY_EDGE,
    };
  };

  const lines = (cells: readonly Cell[], from: number): number => {
    const laid = linesOf(cells, { left, top: from, across });
    parts.push(...laid.parts);
    held.push(...laid.held);
    return laid.foot;
  };

  let y = section(
    'collection.settle',
    counts.settle,
    top + SECTION_TOP,
    'civilization-section-settle',
  );
  y = lines([cityCell, ...deck.settle.map(stack)], y);
  y = section('collection.deck', counts.cards, y + DECK_GAP, 'civilization-section-cards');
  if (deck.cards.length > 0) return { parts, held, foot: lines(deck.cards.map(stack), y) };

  const empty = emptyDeckOf(scene, { left, right, top: y }, 'civilization-empty');
  parts.push(...empty.parts);
  return { parts, held, foot: empty.bottom };
}
