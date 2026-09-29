import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import type { CardId } from '../rules/state';
import { dashAlong } from './card-face';
import type { CollectionStack, DeckRows } from './collection-layout';
import { addText, type Box, UI_FONT } from './design-space';
import { cardFaceAtStart, type Face } from './face';
import { css, LOOK } from './look';
import type { Filled, Held } from './panel';
import type { Answers, Inspecting } from './stack';
import { type TextKey, text } from './text';

const SECTION_TOP = 6;
const UNDER_SECTION = 10;
const DECK_GAP = 16;

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
function answersOf(face: Face, { large }: Inspecting): Answers {
  return {
    point() {},
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
  }: {
    readonly city: CardId;
    readonly deck: DeckRows;
    readonly counts: { readonly cards: number; readonly settle: number };
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
    const label = addText(scene, left, from, text(word).toUpperCase(), SECTION_STYLE).setName(name);
    const count = addText(scene, right, from, text('collection.cards', { cards }), COUNT_STYLE)
      .setOrigin(1, 0)
      .setName(`${name}-count`);
    parts.push(label, count);
    return from + Math.max(label.height, count.height);
  };

  const row = (face: Face, copies: number | undefined, box: Box, name: string): void => {
    parts.push(rowOf(scene, face, copies, box, radius, name));
    held.push({ box, answers: answersOf(face, inspecting) });
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
  const off = CITY_EDGE_OFF + CITY_EDGE / 2;
  parts.push(
    scene.add
      .graphics()
      .lineStyle(CITY_EDGE, LOOK.cityRowEdge)
      .strokeRoundedRect(
        cityBox.x - off,
        cityBox.y - off,
        cityBox.width + 2 * off,
        ROW_HEIGHT + 2 * off,
        radius + off,
      ),
  );
  row(cardFaceAtStart(catalogue, city), undefined, cityBox, 'deck-city');
  y = cityTop + ROW_HEIGHT + CITY_MARGIN;
  if (deck.settle.length > 0) y = rows(deck.settle, y + ROWS_APART);

  y = section('collection.deck', counts.cards, y + DECK_GAP, 'deck-section-cards') + UNDER_SECTION;
  if (deck.cards.length > 0) return { parts, held, foot: rows(deck.cards, y) };

  const empty = addText(
    scene,
    left + 1 + EMPTY_PAD,
    y + 1 + EMPTY_PAD,
    text('collection.empty-deck'),
    COUNT_STYLE,
  ).setName('deck-empty');
  const bottom = empty.y + empty.height + EMPTY_PAD + 1;
  const edge = scene.add.graphics().lineStyle(1, LOOK.emptyEdge);
  dashAlong(edge, [
    { x: left + 0.5, y: y + 0.5 },
    { x: right - 0.5, y: y + 0.5 },
    { x: right - 0.5, y: bottom - 0.5 },
    { x: left + 0.5, y: bottom - 0.5 },
    { x: left + 0.5, y: y + 0.5 },
  ]);
  parts.push(edge, empty);
  return { parts, held, foot: bottom };
}
