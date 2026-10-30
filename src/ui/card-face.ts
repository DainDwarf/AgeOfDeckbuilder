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
import { css, LOOK, type Paper, type Tone, unworn } from './look';
import { poolOf, zonePoolOf } from './pool';
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
  /** The face read as this card, under this refusal and tone, unringed and with no point. */
  read(face: Face, refusal: Refusal, tone?: Tone): void;
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

/** The paper a face is drawn on: any refusal at all draws it unplayable. */
function paperOf(refusal: Refusal): Paper {
  return playable(refusal) ? LOOK.affordableCard : LOOK.unaffordableCard;
}

/** A Text's ink, written where it moved: `setColor` redraws the Text whatever it is handed. */
function inked(label: Phaser.GameObjects.Text, colour: number): Phaser.GameObjects.Text {
  const ink = css(colour);
  return label.style.color === ink ? label : label.setColor(ink);
}

/** An interactive zone of a face that a pool or a re-read gives its place and its size. */
function faceZone(scene: Phaser.Scene): Phaser.GameObjects.Zone {
  return answersPress(scene.add.zone(0, 0, 1, 1).setInteractive());
}

/** The zones over a face's names: handed the names, it lays one over each. */
function nameZonesOf(
  root: Phaser.GameObjects.Container,
  presses: NamePresses,
): (names: readonly Name[]) => void {
  const laidOver = new Map<Phaser.GameObjects.Zone, Name>();
  const zones = zonePoolOf(root, () => {
    const zone = faceZone(root.scene);
    onHover(
      zone,
      () => presses.over(laidOver.get(zone)),
      () => presses.over(undefined),
    );
    onClick(
      zone,
      () => {
        const name = laidOver.get(zone);
        if (name !== undefined) presses.inspect(name);
      },
      'right',
    );
    return zone;
  });
  return (names) => {
    zones.hide();
    for (const name of names) {
      const zone = zones.take().setPosition(name.x, name.y).setSize(name.width, name.height);
      laidOver.set(zone, name);
    }
  };
}

/** The zone over a label of a face's foot, answering no press. */
function footZoneOf(
  scene: Phaser.Scene,
  label: FootLabel,
  at: (label: FootLabel | undefined) => void,
): Phaser.GameObjects.Zone {
  const zone = faceZone(scene);
  onHover(
    zone,
    () => at(label),
    () => at(undefined),
  );
  return zone;
}

/**
 * A face, drawn about its own bottom centre so a container's angle fans it from that corner, every
 * colour of it through the tone. The refusal marks the costs the city cannot pay, and any refusal
 * at all draws the face unplayable. Its width and whether its names answer presses are its for life.
 */
export function createCardFace(
  scene: Phaser.Scene,
  face: Face,
  refusal: Refusal,
  {
    tone = unworn,
    width = CARD_WIDTH,
    names: presses,
  }: { tone?: Tone; width?: number; names?: NamePresses } = {},
): CardFace {
  const { height, em, pad, radius } = metricsOf(width);
  const palette = paperOf(refusal);

  const left = -width / 2 + 1 + pad;
  const right = width / 2 - 1 - pad;
  const top = -height + 1 + pad;

  const root = scene.add.container(0, 0);
  const paper = scene.add.graphics();
  root.add(paper);

  const middle = top + 0.55 * em;

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

  const influence = addText(scene, right, kindMiddle, String(face.influence), {
    fontFamily: UI_FONT,
    fontSize: `${0.65 * em}px`,
    fontStyle: 'bold',
    color: css(tone(palette.ink)),
  })
    .setOrigin(1, 0.5)
    .setName('influence-label');
  const diamond = scene.add.rectangle(0, kindMiddle, 0.55 * em, 0.55 * em).setAngle(45);

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

  const artTop = middle + 1.15 * em;
  const art = scene.add.graphics();

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

  const point = scene.add
    .polygon(
      0,
      -height - RING_STANDOFF - RING_WEIGHT / 2 - POINT_HEIGHT / 2,
      corners([-POINT_WIDTH / 2, POINT_HEIGHT, POINT_WIDTH / 2, POINT_HEIGHT, 0, 0]),
      LOOK.selected,
    )
    .setStrokeStyle(1, LOOK.selectedEdge)
    .setName('aim-point')
    .setVisible(false);

  root.add([art, name, kind, diamond, influence, rules, ring, point]);

  // A long name runs over the costs, and stands over them.
  const underName = {
    scene,
    add: (object: Phaser.GameObjects.GameObject) => root.addAt(object, root.getIndex(name)),
  };
  const chips = poolOf(underName, () =>
    scene.add.rectangle(0, middle, 0.8 * em, 0.8 * em).setAngle(45),
  );
  const chipRings = poolOf(underName, () =>
    scene.add.rectangle(0, middle, 1.15 * em, 1.15 * em).setAngle(45),
  );
  const amounts = poolOf(underName, () =>
    addText(scene, 0, middle, '', {
      fontFamily: UI_FONT,
      fontSize: `${em}px`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5),
  );
  const glyphs = poolOf(root, () =>
    scene.add.rectangle(0, 0, span / Math.SQRT2, span / Math.SQRT2).setAngle(45),
  );
  const layNameZones = presses === undefined ? undefined : nameZonesOf(root, presses);
  const footZones =
    presses?.footOver === undefined
      ? undefined
      : {
          kind: footZoneOf(scene, 'kind', presses.footOver),
          influence: footZoneOf(scene, 'influence', presses.footOver),
        };
  if (footZones !== undefined) root.add([footZones.kind, footZones.influence]);

  /** What the face reads now. */
  let reads = face;
  /** The names its rules draw. */
  let names: Name[] = [];
  /** Where the influence it gains starts along its foot. */
  let gainsLeft = right;

  const read = (next: Face, refused: Refusal, toned: Tone = unworn): void => {
    reads = next;
    const paint = paperOf(refused);

    paper.clear();
    drawCardSurface(paper, -width / 2, -height, {
      width,
      face: toned(paint.face),
      edge: toned(LOOK.cardEdge),
    });

    chips.hide();
    chipRings.hide();
    amounts.hide();
    let x = left;
    for (const { resource, amount } of next.costs) {
      const marked = refused.unaffordable.includes(resource);
      chips
        .take()
        .setX(x + 0.4 * em)
        .setFillStyle(toned(LOOK.reading[resource]));
      if (marked) {
        chipRings
          .take()
          .setX(x + 0.4 * em)
          .setStrokeStyle(0.12 * em, toned(LOOK.unaffordableMark));
      }
      const value = inked(amounts.take(), toned(marked ? LOOK.unaffordableMark : paint.ink))
        .setX(x + 1.3 * em)
        .setText(String(amount));
      x = value.x + value.width + 0.35 * em;
    }

    inked(name, toned(paint.ink)).setText(next.name);
    inked(kind, toned(LOOK.faintInk)).setText(kindLabel(next.kind).toUpperCase());

    const gains = next.influence !== 0;
    influence.setVisible(gains);
    diamond.setVisible(gains);
    if (gains) {
      inked(influence, toned(paint.ink)).setText(String(next.influence));
      diamond.setX(influence.x - influence.width - 0.3 * em).setFillStyle(toned(LOOK.influence));
      gainsLeft = diamond.x - 0.4 * em;
    }

    inked(rules, toned(paint.ink)).setText(next.rules);
    const ownRules = ownBoxOf(rules);
    const lineHeight = ownRules.height / run.widths.length;
    const runTop = ownRules.y;
    glyphs.hide();
    for (const glyph of run.glyphs) {
      glyphs
        .take()
        .setPosition(glyph.x, runTop + (glyph.line + 0.5) * lineHeight)
        .setFillStyle(toned(LOOK.reading[glyph.resource]));
    }

    names = run.names.map((named) => ({
      reference: named.reference,
      reading: next.reading,
      x: (named.from + named.to) / 2,
      y: runTop + (named.line + 0.5) * lineHeight,
      width: named.to - named.from,
      height: lineHeight,
    }));
    root.setData({ card: next.id, names });
    layNameZones?.(names);
    if (footZones !== undefined) {
      footZones.kind.setPosition(0, kindMiddle).setSize(kind.width, kind.height);
      footZones.influence
        .setVisible(gains)
        .setPosition((gainsLeft + right) / 2, kindMiddle)
        .setSize(right - gainsLeft, kind.height);
    }

    const artHeight = rules.y - rules.height - 0.45 * em - artTop;
    art.clear();
    art.fillStyle(toned(paint.art));
    art.fillRoundedRect(left, artTop, right - left, artHeight, 0.2 * em);
    art.lineStyle(1, toned(paint.artEdge));
    art.strokeRoundedRect(left + 0.5, artTop + 0.5, right - left - 1, artHeight - 1, 0.2 * em);

    ring.setVisible(false);
    point.setVisible(false);
  };
  read(face, refusal, tone);

  return {
    root,
    read,
    select(on: boolean): void {
      ring.setVisible(on);
    },
    aim(on: boolean): void {
      point.setVisible(on);
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
      if (reads.influence !== 0 && local.x >= gainsLeft && local.x <= right) return 'influence';
      return undefined;
    },
    cardAt(x: number, y: number): boolean {
      const local = root.getLocalPoint(x, y);
      return Math.abs(local.x) <= width / 2 && local.y <= 0 && local.y >= -height;
    },
    explainFoot(tooltip: Tooltip, label: FootLabel): void {
      const besideOf = (part: Phaser.GameObjects.Text, saying: string): void => {
        tooltip.beside(saying, () => {
          const own = ownBoxOf(part);
          return root.getWorldTransformMatrix().transformPoint(own.x + own.width, kindMiddle);
        });
      };
      switch (label) {
        case 'kind':
          besideOf(kind, kindTooltip(reads.kind));
          return;
        case 'influence':
          if (reads.influence !== 0) besideOf(influence, text('tooltip.influence'));
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

export type CardBack = {
  readonly root: Phaser.GameObjects.Container;
  /** The back drawn again, every colour of it through the tone. */
  wear(tone: Tone): void;
};

/** A face-down card, about its own bottom centre. */
export function createCardBack(
  scene: Phaser.Scene,
  { width = CARD_WIDTH }: { width?: number } = {},
): CardBack {
  const height = heightOf(width);
  const paper = scene.add.graphics();
  const emblem = scene.add.polygon(0, -height / 2, hexagon(width * 0.28 - 3), 0, 0);

  const wear = (tone: Tone): void => {
    paper.clear();
    drawCardSurface(paper, -width / 2, -height, {
      width,
      face: tone(LOOK.cardBack),
      edge: tone(LOOK.cardEdge),
    });
    emblem.setStrokeStyle(3, tone(LOOK.civilization));
  };
  wear(unworn);

  return { root: scene.add.container(0, 0, [paper, emblem]), wear };
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
