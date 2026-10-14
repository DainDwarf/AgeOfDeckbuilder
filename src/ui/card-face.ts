import type Phaser from 'phaser';
import { playable, type Refusal } from '../rules/state';
import {
  addText,
  answersPress,
  corners,
  DESIGN_HEIGHT,
  hexagon,
  MARGIN,
  onClick,
  onHover,
  ownBoxOf,
  UI_FONT,
} from './design-space';
import { type AnswerReading, type Face, kindLabel, kindTooltip } from './face';
import { css, LOOK, type Paper, worn } from './look';
import { referenceName, text } from './text';
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

/** The point a card being aimed wears over its ring, its apex towards the map. */
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

/**
 * A name a rules entry draws, which a face carries in its data as `names`: what it names, the
 * reading of the face it stands on, and its box.
 */
export type Name = {
  readonly reference: Reference;
  readonly reading: AnswerReading;
  /** Its middle, about the face's own bottom centre. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  /** The run's line height. */
  readonly height: number;
};

/** Where a name stands on the surface its face is drawn on: its middle, and its line's two edges. */
export type Spot = { readonly x: number; readonly top: number; readonly bottom: number };

/** What stands at a face's foot and raises a tooltip: the kind label, and the influence it gains. */
export type FootLabel = 'kind' | 'influence';

/**
 * What a face handed these lays a zone over every name for: the pointer on it or off it, and the
 * right click. Handed `footOver`, it lays one over each label of its foot too, which answers no
 * press.
 */
export type NamePresses = {
  over(name: Name | undefined): void;
  inspect(name: Name): void;
  footOver?(label: FootLabel | undefined): void;
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
  /**
   * The label of the foot lying under a point of the surface the face is drawn on, and nothing where
   * none does.
   */
  footAt(x: number, y: number): FootLabel | undefined;
  /** Whether the card lies under a point of the surface the face is drawn on. */
  cardAt(x: number, y: number): boolean;
  /**
   * The label's tooltip raised on the bubble, beside the label as it stands when the bubble is
   * painted.
   */
  explainFoot(tooltip: Tooltip, label: FootLabel): void;
};

/**
 * A face, drawn about its own bottom centre so a container's angle fans it from that corner, every
 * colour of it through the tone. The refusal marks the costs the city cannot pay, and any refusal
 * at all draws the face unplayable.
 */
export function createCardFace(
  scene: Phaser.Scene,
  face: Face,
  refusal: Refusal,
  {
    tone = (colour: number): number => colour,
    width = CARD_WIDTH,
    names: presses,
  }: { tone?: (colour: number) => number; width?: number; names?: NamePresses } = {},
): CardFace {
  const { height, em, pad, radius } = metricsOf(width);
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

  const kind = addText(scene, 0, -1 - pad, kindLabel(face.kind).toUpperCase(), {
    fontFamily: UI_FONT,
    fontSize: `${0.65 * em}px`,
    color: css(tone(LOOK.faintInk)),
    letterSpacing: 0.14 * 0.65 * em,
  })
    .setOrigin(0.5, 1)
    .setName('kind-label');
  const kindMiddle = kind.y - kind.height / 2;

  const gains = (():
    | { number: Phaser.GameObjects.Text; diamond: Phaser.GameObjects.Rectangle; left: number }
    | undefined => {
    if (face.influence === 0) return undefined;
    const number = addText(scene, right, kindMiddle, String(face.influence), {
      fontFamily: UI_FONT,
      fontSize: `${0.65 * em}px`,
      fontStyle: 'bold',
      color: css(tone(palette.ink)),
    })
      .setOrigin(1, 0.5)
      .setName('influence-label');
    const diamond = scene.add
      .rectangle(
        number.x - number.width - 0.3 * em,
        kindMiddle,
        0.55 * em,
        0.55 * em,
        tone(LOOK.influence),
      )
      .setAngle(45);
    return { number, diamond, left: diamond.x - 0.4 * em };
  })();

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
  })
    .setOrigin(0.5, 1)
    .setName('rules');

  const ownRules = ownBoxOf(rules);
  const lineHeight = ownRules.height / run.widths.length;
  const runTop = ownRules.y;
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
    reading: face.reading,
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
  if (presses?.footOver !== undefined) {
    const at = presses.footOver;
    const footZone = (label: FootLabel, x: number, width: number): Phaser.GameObjects.Zone => {
      const zone = answersPress(scene.add.zone(x, kindMiddle, width, kind.height).setInteractive());
      onHover(
        zone,
        () => at(label),
        () => at(undefined),
      );
      return zone;
    };
    zones.push(footZone('kind', 0, kind.width));
    if (gains !== undefined) {
      zones.push(footZone('influence', (gains.left + right) / 2, right - gains.left));
    }
  }

  const artTop = middle + 1.15 * em;
  const artHeight = rules.y - rules.height - 0.45 * em - artTop;
  const art = scene.add.graphics();
  art.fillStyle(tone(palette.art));
  art.fillRoundedRect(left, artTop, right - left, artHeight, 0.2 * em);
  art.lineStyle(1, tone(palette.artEdge));
  art.strokeRoundedRect(left + 0.5, artTop + 0.5, right - left - 1, artHeight - 1, 0.2 * em);

  const ring = scene.add.graphics().setName('ring').setVisible(false);
  for (const [weight, colour] of [
    [RING_WEIGHT + 2, LOOK.selectedEdge],
    [RING_WEIGHT, LOOK.selected],
  ] as const) {
    ring.lineStyle(weight, colour);
    ring.strokeRoundedRect(
      -width / 2 - RING_STANDOFF,
      -height - RING_STANDOFF,
      width + 2 * RING_STANDOFF,
      height + 2 * RING_STANDOFF,
      radius + RING_STANDOFF,
    );
  }

  root.add([
    art,
    name,
    kind,
    ...(gains === undefined ? [] : [gains.diamond, gains.number]),
    rules,
    ...glyphs,
    ring,
    ...zones,
  ]);

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
          LOOK.selected,
        )
        .setStrokeStyle(1, LOOK.selectedEdge)
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
    footAt(x: number, y: number): FootLabel | undefined {
      const local = root.getLocalPoint(x, y);
      if (Math.abs(local.y - kindMiddle) > kind.height / 2) return undefined;
      if (Math.abs(local.x) <= kind.width / 2) return 'kind';
      if (gains !== undefined && local.x >= gains.left && local.x <= right) return 'influence';
      return undefined;
    },
    cardAt(x: number, y: number): boolean {
      const local = root.getLocalPoint(x, y);
      return Math.abs(local.x) <= width / 2 && local.y <= 0 && local.y >= -height;
    },
    explainFoot(tooltip: Tooltip, label: FootLabel): void {
      const besideOf = (part: Phaser.GameObjects.Text, reads: string): void => {
        tooltip.beside(reads, () => {
          const own = ownBoxOf(part);
          return root.getWorldTransformMatrix().transformPoint(own.x + own.width, kindMiddle);
        });
      };
      switch (label) {
        case 'kind':
          besideOf(kind, kindTooltip(face.kind));
          return;
        case 'influence':
          if (gains !== undefined) besideOf(gains.number, text('tooltip.influence'));
          return;
      }
      const unlisted: never = label;
      throw new Error(`no label of the foot is ${JSON.stringify(unlisted)}`);
    },
  };
}

/** Which label of which face's foot has raised the surface's one bubble. */
export type FootBubble = {
  /** The pointer is on this face, on a label of its foot or off them. */
  over(face: CardFace, label: FootLabel | undefined): void;
};

/**
 * The labels of the feet of one surface's faces over the bubble they raise: it goes down as the
 * pointer leaves the label, and with the face it stands beside.
 */
export function createFootBubble(tooltip: Tooltip): FootBubble {
  let raised:
    | { readonly face: CardFace; readonly label: FootLabel; readonly gone: () => void }
    | undefined;

  const down = (): void => {
    if (raised === undefined) return;
    raised.face.root.off('destroy', raised.gone);
    raised = undefined;
    tooltip.hide();
  };

  return {
    over(face: CardFace, label: FootLabel | undefined): void {
      if (label === undefined) {
        if (raised?.face === face) down();
        return;
      }
      if (raised?.face === face && raised.label === label) return;
      down();
      const gone = (): void => {
        raised = undefined;
        tooltip.hide();
      };
      face.root.once('destroy', gone);
      raised = { face, label, gone };
      face.explainFoot(tooltip, label);
    },
  };
}

/** The face-down card the draw pile shows, about its own bottom centre; worn when the pile is dry. */
export function createCardBack(
  scene: Phaser.Scene,
  { faded = false, width = CARD_WIDTH }: { faded?: boolean; width?: number } = {},
): Phaser.GameObjects.Container {
  const tone = faded ? worn : (colour: number): number => colour;
  const height = heightOf(width);
  const paper = scene.add.graphics();
  drawCardSurface(paper, -width / 2, -height, {
    width,
    face: tone(LOOK.cardBack),
    edge: tone(LOOK.cardEdge),
  });

  const emblem = scene.add
    .polygon(0, -height / 2, hexagon(width * 0.28 - 3), 0, 0)
    .setStrokeStyle(3, tone(LOOK.civilization));

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
export function dashAlong(
  outline: Phaser.GameObjects.Graphics,
  points: { x: number; y: number }[],
): void {
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
