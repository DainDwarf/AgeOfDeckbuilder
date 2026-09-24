import type Phaser from 'phaser';
import type { CardKind } from '../rules/cards';
import { type Catalogue, cardMade, cardOf } from '../rules/catalogue';
import { costOf } from '../rules/chronicle';
import { answerOf } from '../rules/schedule';
import {
  type CardId,
  type Chronicle,
  type ChronicleCard,
  type Cost,
  playable,
  type Refusal,
} from '../rules/state';
import {
  addText,
  answersPress,
  corners,
  DESIGN_HEIGHT,
  hexagon,
  MARGIN,
  onClick,
  onHover,
  TEXT_INSET,
  UI_FONT,
} from './design-space';
import { css, LOOK, type Paper, worn } from './look';
import {
  answerName,
  answerRules,
  capstoneName,
  capstoneRules,
  cardName,
  cardRules,
  referenceName,
  text,
} from './text';
import { layOutRun, type Reference, type Run } from './text-run';
import type { Tooltip } from './tooltip';

export const CARD_WIDTH = 130;

/** The card's height at that width: the one aspect a card is drawn at, wherever it is drawn. */
export function heightOf(width: number): number {
  return Math.round(width * 1.4);
}

/** Every measure inside a card is a multiple of `em`, so one width scales the whole face. */
export function metricsOf(width: number): {
  height: number;
  em: number;
  pad: number;
  radius: number;
} {
  const em = width * 0.13;
  return { height: heightOf(width), em, pad: 0.55 * em, radius: 0.45 * em };
}

/** The card as it lies on the chronicle screen: what anything in the card's language measures by. */
export const CARD_METRICS = metricsOf(CARD_WIDTH);
export const CARD_HEIGHT = CARD_METRICS.height;

/** Where a card lying on the chronicle screen rests: its bottom edge, one margin off the bottom. */
export const CARD_BASELINE = DESIGN_HEIGHT - MARGIN;

/** How far a card comes out of the lane it lies in: the lift a hover gives it, and the selection's. */
export const CARD_LIFT = 32;

/** The ring the selection wears: this far outside the card's own edge, stroked this wide. */
const RING_STANDOFF = 3.5;
const RING_WEIGHT = 3;

/** The point a card being aimed wears, its base on the ring's outer edge and its apex towards the map. */
const POINT_WIDTH = 18;
const POINT_HEIGHT = 12;

/** How far the point on a card being aimed reaches above the card's own top edge, ring included. */
export const AIM_POINT_REACH = RING_STANDOFF + RING_WEIGHT / 2 + POINT_HEIGHT;

/**
 * The paper and edge the card face, the card back and the infopanel with its ghosts are drawn on.
 * `x` and `y` are the box's top-left corner, as `fillRoundedRect` reads them — cards themselves are
 * drawn about their bottom centre, so a card passes its own corner.
 */
export function drawCardSurface(
  surface: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  {
    width = CARD_WIDTH,
    face = LOOK.affordableCard.face,
    edge = LOOK.cardEdge,
  }: { width?: number; face?: number; edge?: number } = {},
): void {
  const { height, radius } = metricsOf(width);
  surface.fillStyle(face);
  surface.fillRoundedRect(x, y, width, height, radius);
  surface.lineStyle(1, edge);
  surface.strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, radius);
}

/** What the label at a face's foot reads, and what its tooltip says. */
export type FaceKind = CardKind | 'event' | 'capstone';

/**
 * What a face reads: what it stands, for whoever reads that back off the object it is drawn on; its
 * name; the kind it is labelled by; its rules entry; and what it costs, in the order the resource
 * bar reads the resources.
 */
export type Face = {
  readonly id: string;
  readonly name: string;
  readonly kind: FaceKind;
  readonly rules: string;
  readonly costs: readonly Cost[];
};

/** The face a card in a chronicle is drawn as, its rules entry reading the counters it carries. */
export function cardFace(catalogue: Catalogue, card: ChronicleCard): Face {
  return {
    id: card.id,
    name: cardName(card.id),
    kind: cardOf(catalogue, card.id).kind,
    rules: cardRules(card),
    costs: costOf(catalogue, card.id),
  };
}

/** The face a card named is drawn as: the card as its content makes it, at the counters it starts with. */
export function namedCardFace(catalogue: Catalogue, id: CardId): Face {
  return cardFace(catalogue, cardMade(catalogue, id));
}

/** The face a capstone is drawn as: it costs nothing, and its rules entry reads no numbers. */
export function capstoneFace(id: string): Face {
  return {
    id,
    name: capstoneName(id),
    kind: 'capstone',
    rules: capstoneRules(id),
    costs: [],
  };
}

/**
 * The face an answer of an event is drawn as: its rules entry, read on the chronicle it was dealt
 * on. What the answer costs reads in that entry, so the face wears no chip for it.
 */
export function answerFace(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  id: string,
): Face {
  const answer = answerOf(catalogue, event, id);
  return {
    id,
    name: answerName(id),
    kind: 'event',
    rules: answerRules(id, answer.reads(catalogue, chronicle)),
    costs: [],
  };
}

/** A name a rules entry draws, which a face carries in its data as `names`: what it names, and its box. */
export type Name = {
  readonly reference: Reference;
  /** Its middle, about the face's own bottom centre. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  /** The run's line height. */
  readonly height: number;
};

/** Where a name stands on the surface its face is drawn on: its middle, and its line's two edges. */
export type Spot = { readonly x: number; readonly top: number; readonly bottom: number };

/**
 * What a face handed these lays a zone over every name for: the pointer on it or off it, and the
 * right click. Handed `kind`, it lays one over its kind label too, which answers no press.
 */
export type NamePresses = {
  over(name: Name | undefined): void;
  inspect(name: Name): void;
  kind?(over: boolean): void;
};

export type CardFace = {
  readonly root: Phaser.GameObjects.Container;
  /** Draws the card as the selection, or as one more card lying where it lies. */
  select(selected: boolean): void;
  /** Draws the card as the one being aimed: the point on its ring, or no point at all. */
  aim(beingAimed: boolean): void;
  /** The name lying under a point of the surface the face is drawn on, and nothing where none does. */
  nameAt(x: number, y: number): Name | undefined;
  /** Where one of the face's names stands on the surface the face is drawn on. */
  spotOf(name: Name): Spot;
  /** Whether the kind label lies under a point of the surface the face is drawn on. */
  kindAt(x: number, y: number): boolean;
  /** The kind's tooltip raised on the bubble, beside the label as it stands when the bubble is painted. */
  explainKind(tooltip: Tooltip): void;
};

/**
 * A face, drawn about its own bottom centre so a container's angle fans it from that corner. The
 * refusal marks the costs the city cannot pay, and any refusal at all draws the face unplayable.
 */
export function createCardFace(
  scene: Phaser.Scene,
  face: Face,
  refusal: Refusal,
  {
    faded = false,
    width = CARD_WIDTH,
    names: presses,
  }: { faded?: boolean; width?: number; names?: NamePresses } = {},
): CardFace {
  const { height, em, pad, radius } = metricsOf(width);
  const tone = faded ? worn : (colour: number): number => colour;
  const palette: Paper = playable(refusal) ? LOOK.affordableCard : LOOK.unaffordableCard;

  const left = -width / 2 + 1 + pad;
  const right = width / 2 - 1 - pad;
  const top = -height + 1 + pad;

  const root = scene.add.container(0, 0);
  const paper = scene.add.graphics();
  drawCardSurface(paper, -width / 2, -height, {
    width,
    face: tone(palette.face),
    edge: tone(LOOK.cardEdge),
  });
  root.add(paper);

  const middle = top + 0.55 * em;
  let x = left;
  for (const { resource, amount } of face.costs) {
    const marked = refusal.unaffordable.includes(resource);
    const chip = scene.add
      .rectangle(x + 0.4 * em, middle, 0.8 * em, 0.8 * em, tone(LOOK.reading[resource]))
      .setAngle(45);
    root.add(chip);
    if (marked) {
      const ring = scene.add
        .rectangle(x + 0.4 * em, middle, 1.15 * em, 1.15 * em)
        .setStrokeStyle(0.12 * em, tone(LOOK.unaffordableMark))
        .setAngle(45);
      root.add(ring);
    }
    const value = addText(scene, x + 1.3 * em, middle, String(amount), {
      fontFamily: UI_FONT,
      fontSize: `${em}px`,
      fontStyle: 'bold',
      color: css(tone(marked ? LOOK.unaffordableMark : palette.ink)),
    }).setOrigin(0, 0.5);
    root.add(value);
    x = value.x + value.width + 0.35 * em;
  }

  const name = addText(scene, right, middle, face.name, {
    fontFamily: UI_FONT,
    fontSize: `${0.75 * em}px`,
    fontStyle: 'bold',
    color: css(tone(palette.ink)),
  }).setOrigin(1, 0.5);

  const kind = addText(scene, 0, -1 - pad, text(`kind.${face.kind}`).toUpperCase(), {
    fontFamily: UI_FONT,
    fontSize: `${0.65 * em}px`,
    color: css(tone(LOOK.faintInk)),
    letterSpacing: 0.14 * 0.65 * em,
  })
    .setOrigin(0.5, 1)
    .setName('kind-label');
  const kindMiddle = kind.y - kind.height / 2;

  const size = 0.62 * em;
  const span = (2 / 3) * size;
  // Phaser runs the callback from inside updateText, on a context whose font it has just synced.
  let run!: Run;
  const rules = addText(scene, 0, kind.y - kind.height - 0.45 * em, face.rules, {
    fontFamily: UI_FONT,
    fontSize: `${size}px`,
    color: css(tone(palette.ink)),
    align: 'center',
    wordWrap: {
      callback: (content, textObject) => {
        const measure = (drawn: string): number => textObject.context.measureText(drawn).width;
        run = layOutRun(
          content,
          measure,
          { width: right - left, glyph: span, bearing: size / 4, space: measure(' ') },
          referenceName,
        );
        return run.content.split('\n');
      },
    },
  }).setOrigin(0.5, 1);

  const lineHeight = (rules.height - 2 * TEXT_INSET.y) / run.lines;
  const runTop = rules.y - rules.height + TEXT_INSET.y;
  const glyphs = run.glyphs.map((glyph) =>
    scene.add
      .rectangle(
        glyph.x,
        runTop + (glyph.line + 0.5) * lineHeight,
        span / Math.SQRT2,
        span / Math.SQRT2,
        tone(LOOK.reading[glyph.resource]),
      )
      .setAngle(45),
  );

  const names: Name[] = run.names.map((named) => ({
    reference: named.reference,
    x: (named.from + named.to) / 2,
    y: runTop + (named.line + 0.5) * lineHeight,
    width: named.to - named.from,
    height: lineHeight,
  }));
  root.setData('names', names);
  const zones: Phaser.GameObjects.Zone[] =
    presses === undefined
      ? []
      : names.map((name) => {
          const zone = answersPress(
            scene.add.zone(name.x, name.y, name.width, name.height).setInteractive(),
          );
          onHover(
            zone,
            () => presses.over(name),
            () => presses.over(undefined),
          );
          onClick(zone, () => presses.inspect(name), 'right');
          return zone;
        });
  if (presses?.kind !== undefined) {
    const over = presses.kind;
    const zone = answersPress(
      scene.add.zone(0, kindMiddle, kind.width, kind.height).setInteractive(),
    );
    onHover(
      zone,
      () => over(true),
      () => over(false),
    );
    zones.push(zone);
  }

  const artTop = middle + 1.15 * em;
  const artHeight = rules.y - rules.height - 0.45 * em - artTop;
  const art = scene.add.graphics();
  art.fillStyle(tone(palette.art));
  art.fillRoundedRect(left, artTop, right - left, artHeight, 0.2 * em);
  art.lineStyle(1, tone(palette.artEdge));
  art.strokeRoundedRect(left + 0.5, artTop + 0.5, right - left - 1, artHeight - 1, 0.2 * em);

  const ring = scene.add.graphics().setName('ring').setVisible(false);
  ring.lineStyle(RING_WEIGHT, LOOK.accent);
  ring.strokeRoundedRect(
    -width / 2 - RING_STANDOFF,
    -height - RING_STANDOFF,
    width + 2 * RING_STANDOFF,
    height + 2 * RING_STANDOFF,
    radius + RING_STANDOFF,
  );

  root.add([art, name, kind, rules, ...glyphs, ring, ...zones]);

  /** The point while the card is being aimed, and nothing at all on the card while it is not. */
  let point: Phaser.GameObjects.Polygon | undefined;

  return {
    root,
    select(on: boolean): void {
      ring.setVisible(on);
    },
    aim(on: boolean): void {
      point?.destroy();
      point = undefined;
      if (!on) return;
      point = scene.add
        .polygon(
          0,
          -height - RING_STANDOFF - RING_WEIGHT / 2 - POINT_HEIGHT / 2,
          corners([-POINT_WIDTH / 2, POINT_HEIGHT, POINT_WIDTH / 2, POINT_HEIGHT, 0, 0]),
          LOOK.accent,
        )
        .setStrokeStyle(1, LOOK.aimPointEdge)
        .setName('aim-point');
      root.add(point);
    },
    nameAt(x: number, y: number): Name | undefined {
      const local = root.getLocalPoint(x, y);
      return names.find(
        (name) =>
          Math.abs(local.x - name.x) <= name.width / 2 &&
          Math.abs(local.y - name.y) <= name.height / 2,
      );
    },
    spotOf(name: Name): Spot {
      const middle = root.getWorldTransformMatrix().transformPoint(name.x, name.y);
      return { x: middle.x, top: middle.y - name.height / 2, bottom: middle.y + name.height / 2 };
    },
    kindAt(x: number, y: number): boolean {
      const local = root.getLocalPoint(x, y);
      return (
        Math.abs(local.x) <= kind.width / 2 && Math.abs(local.y - kindMiddle) <= kind.height / 2
      );
    },
    explainKind(tooltip: Tooltip): void {
      tooltip.beside(text(`tooltip.${face.kind}`), () =>
        root.getWorldTransformMatrix().transformPoint(kind.width / 2 - TEXT_INSET.x, kindMiddle),
      );
    },
  };
}

/** Which face's kind label has raised the surface's one bubble. */
export type KindBubble = {
  /** The pointer is on this face, on its kind label or off it. */
  over(face: CardFace, onLabel: boolean): void;
};

/**
 * The kind labels of one surface's faces over the bubble they raise: it goes down as the pointer
 * leaves the label, and with the face it stands beside.
 */
export function createKindBubble(tooltip: Tooltip): KindBubble {
  let raised: { readonly face: CardFace; readonly gone: () => void } | undefined;

  const down = (): void => {
    if (raised === undefined) return;
    raised.face.root.off('destroy', raised.gone);
    raised = undefined;
    tooltip.hide();
  };

  return {
    over(face: CardFace, onLabel: boolean): void {
      if (!onLabel) {
        if (raised?.face === face) down();
        return;
      }
      if (raised?.face === face) return;
      down();
      const gone = (): void => {
        raised = undefined;
        tooltip.hide();
      };
      face.root.once('destroy', gone);
      raised = { face, gone };
      face.explainKind(tooltip);
    },
  };
}

/** The face-down card the draw pile shows, about its own bottom centre; worn when the pile is dry. */
export function createCardBack(scene: Phaser.Scene, faded = false): Phaser.GameObjects.Container {
  const tone = faded ? worn : (colour: number): number => colour;
  const paper = scene.add.graphics();
  drawCardSurface(paper, -CARD_WIDTH / 2, -CARD_HEIGHT, {
    face: tone(LOOK.cardBack),
    edge: tone(LOOK.cardEdge),
  });

  const emblem = scene.add
    .polygon(0, -CARD_HEIGHT / 2, hexagon(CARD_WIDTH * 0.28 - 3), 0, 0)
    .setStrokeStyle(3, tone(LOOK.accent));

  return scene.add.container(0, 0, [paper, emblem]);
}

/** Where a pile's top card would be: the card's own rounded outline, dashed. */
export function createEmptySlot(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const outline = scene.add.graphics();
  outline.lineStyle(2, LOOK.emptyEdge);
  dashAlong(outline, cardOutline());
  return scene.add.container(0, 0, [outline]);
}

/** The card's outline as a closed polyline, corner arcs sampled into short chords. */
function cardOutline(): { x: number; y: number }[] {
  const half = CARD_WIDTH / 2;
  const r = CARD_METRICS.radius;
  const points: { x: number; y: number }[] = [];
  const corner = (cx: number, cy: number, from: number): void => {
    for (let i = 0; i <= 6; i++) {
      const angle = from + (Math.PI / 2) * (i / 6);
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
  };
  points.push({ x: -half + r, y: -CARD_HEIGHT });
  corner(half - r, -CARD_HEIGHT + r, -Math.PI / 2);
  corner(half - r, -r, 0);
  corner(-half + r, -r, Math.PI / 2);
  corner(-half + r, -CARD_HEIGHT + r, Math.PI);
  points.push({ x: -half + r, y: -CARD_HEIGHT });
  return points;
}

/** Dashes of six on, five off, stretched so a whole number of them spans the outline. */
function dashAlong(outline: Phaser.GameObjects.Graphics, points: { x: number; y: number }[]): void {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    lengths.push(Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y));
    total += lengths[i];
  }
  const step = total / Math.max(1, Math.round(total / 11));
  const on = (step * 6) / 11;

  let travelled = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const at = (t: number): { x: number; y: number } => ({
      x: points[i].x + (points[i + 1].x - points[i].x) * t,
      y: points[i].y + (points[i + 1].y - points[i].y) * t,
    });
    let along = 0;
    while (along < lengths[i]) {
      const phase = (travelled + along) % step;
      const until = phase < on ? on - phase : step - phase;
      const next = Math.min(lengths[i], along + until);
      if (phase < on) {
        const from = at(along / lengths[i]);
        const to = at(next / lengths[i]);
        outline.lineBetween(from.x, from.y, to.x, to.y);
      }
      along = next + 1e-6;
    }
    travelled += lengths[i];
  }
}
