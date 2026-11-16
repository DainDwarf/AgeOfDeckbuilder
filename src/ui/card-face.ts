import type Phaser from 'phaser';
import type { Resource } from '../rules/resources';
import { playable, type Refusal } from '../rules/state';
import {
  BACK,
  BODY,
  BODY_RADIUS,
  CARDS_SHEET_KEY,
  DISC,
  frontOf,
  HIGHEST_RIM,
  HIGHEST_RISE,
  type PackPoint,
  PLATE,
  paleOf,
} from './card-frames';
import {
  addText,
  corners,
  DESIGN_HEIGHT,
  MARGIN,
  onClick,
  onHover,
  ownBoxOf,
  reactsToPress,
  type SizedStyle,
  UI_FONT,
} from './design-space';
import { type AnswerReading, type CardFamily, type Face, kindLabel, kindTooltip } from './face';
import { asGlyph, glyphMark } from './glyphs';
import { css, LOOK, multiplied, type Tone, unworn } from './look';
import type { CastSymbol } from './marks';
import { poolOf, rootedPoolOf, zonePoolOf } from './pool';
import { referenceName, text } from './text';
import { layOutRun, type Reference, type Run } from './text-run';
import type { Tooltip } from './tooltip';

export const CARD_WIDTH = 124;

/** How many units one of the pack's pixels is across a card that wide. */
function unitOf(width: number): number {
  return width / BODY.width;
}

/** The card's height at that width: the one aspect a card is drawn at, wherever it is drawn. */
export function heightOf(width: number): number {
  return Math.round(BODY.height * unitOf(width));
}

/** How many units one of the pack's pixels is down a card that wide, its body drawn `heightOf` tall. */
function downOf(width: number): number {
  return heightOf(width) / BODY.height;
}

export const CARD_HEIGHT = heightOf(CARD_WIDTH);

/** How far a card's corners are rounded wherever it stands but large. */
export const CARD_RADIUS = BODY_RADIUS * unitOf(CARD_WIDTH);

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

/**
 * How far the point over a card being aimed stands above the card's top edge: past its ring, and past
 * the frame's rim where that rises higher.
 */
function pointStandoff(rises: number, width: number): number {
  return Math.max(RING_STANDOFF, rises * downOf(width)) + RING_WEIGHT / 2;
}

/** How far the point on a card being aimed reaches above the card's own top edge, at the most. */
export const AIM_POINT_REACH = pointStandoff(HIGHEST_RIM, CARD_WIDTH) + POINT_HEIGHT;

/** How far a card's rim or a disc rises above its top edge, at the most: the room a line of cards keeps over it. */
export const CARD_RISE = HIGHEST_RISE * downOf(CARD_WIDTH);

/** The type on a face, in units of a card wherever it stands but large. */
const NAME_SIZE = 12;
const TEXT_SIZE = 11;
const DISC_NUMBER_SIZE = 15;

/** How wide a glyph on a disc stands, as a share of the number beside it, and the gap between. */
const DISC_GLYPH_SHARE = 0.72;
const DISC_GAP = 0.1;

/** How far below the plate's middle the text's box starts, in the pack's pixels. */
const TEXT_BELOW_PLATE = 49;

/**
 * A name a rules entry draws, which a face carries in its data as `names`: what it names, the
 * reading of the text it stands in, and its box.
 */
export type Name = {
  readonly reference: Reference;
  readonly reading: AnswerReading;
  /** Its middle, about the origin of the container it is drawn in. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  /** The run's line height. */
  readonly height: number;
};

/** Where a name stands on the surface its face is drawn on: its middle, and its line's two edges. */
export type Spot = { readonly x: number; readonly top: number; readonly bottom: number };

/**
 * Of the names drawn in the container, the one lying under a point of the surface it is drawn on,
 * and nothing where none does.
 */
export function namedAt(
  container: Phaser.GameObjects.Container,
  names: readonly Name[],
  x: number,
  y: number,
): Name | undefined {
  const local = container.getLocalPoint(x, y);
  return names.find(
    (name) =>
      Math.abs(local.x - name.x) <= name.width / 2 && Math.abs(local.y - name.y) <= name.height / 2,
  );
}

/** Where a name drawn in the container stands on the surface the container is drawn on. */
export function spotOn(container: Phaser.GameObjects.Container, name: Name): Spot {
  const middle = container.getWorldTransformMatrix().transformPoint(name.x, name.y);
  return { x: middle.x, top: middle.y - name.height / 2, bottom: middle.y + name.height / 2 };
}

/** A glyph a run marks, a side of its square, as a share of the run's type. */
export const GLYPH_SHARE = 2 / 3;

/**
 * A label drawn as a run, the run its entry was last laid out as, and the width it wraps at, which
 * a change lays it out again at.
 */
export type RunLabel = {
  readonly label: Phaser.GameObjects.Text;
  readonly run: Run;
  wrapAt(width: number): void;
};

/**
 * An entry drawn in that style as a run wrapped at that width, its glyphs `GLYPH_SHARE` of its type:
 * the label leaves room for the glyphs, which are the caller's to draw.
 */
export function addRun(
  scene: Phaser.Scene,
  entry: string,
  style: SizedStyle,
  width: number,
): RunLabel {
  const size = Number.parseFloat(style.fontSize);
  let wrap = width;
  // Phaser runs the callback from inside updateText, on a context whose font it has just synced.
  let run!: Run;
  const label = addText(scene, 0, 0, entry, {
    ...style,
    wordWrap: {
      callback: (content, textObject) => {
        const measure = (drawn: string): number => textObject.context.measureText(drawn).width;
        run = layOutRun(
          content,
          measure,
          { width: wrap, glyph: GLYPH_SHARE * size, bearing: size / 4, space: measure(' ') },
          referenceName,
        );
        return run.content.split('\n');
      },
    },
  });
  return {
    label,
    get run() {
      return run;
    },
    wrapAt(next: number): void {
      if (next === wrap) return;
      wrap = next;
      label.updateText();
    },
  };
}

/**
 * Where a run's glyphs and names stand about its label's own space, the label centred on its lines:
 * each glyph's resource and middle, and each name's box, the reading handed carried by every name.
 */
export function centredMarks(
  { label, run }: Pick<RunLabel, 'label' | 'run'>,
  reading: AnswerReading,
): {
  glyphs: { readonly resource: Resource; readonly x: number; readonly y: number }[];
  names: Name[];
} {
  const own = ownBoxOf(label);
  const pitch = own.height / run.widths.length;
  const centre = own.x + own.width / 2;
  const middleOf = (line: number): number => own.y + (line + 0.5) * pitch;
  return {
    glyphs: run.glyphs.map(({ resource, x, line }) => ({
      resource,
      x: centre + x,
      y: middleOf(line),
    })),
    names: run.names.map(({ reference, from, to, line }) => ({
      reference,
      reading,
      x: centre + (from + to) / 2,
      y: middleOf(line),
      width: to - from,
      height: pitch,
    })),
  };
}

/** What stands at a face's foot and raises a tooltip: the kind label, and the influence it gains. */
export type FootLabel = 'kind' | 'influence';

/**
 * What a face handed these lays a zone over every name for: the pointer on it or off it, and the
 * right click. Handed `footOver`, it lays one over each label of its foot too, which reacts to no
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

/** A Text's ink, written where it moved: `setColor` redraws the Text whatever it is handed. */
function inked(label: Phaser.GameObjects.Text, colour: number): Phaser.GameObjects.Text {
  const ink = css(colour);
  return label.style.color === ink ? label : label.setColor(ink);
}

/** The tint a card's painted parts are multiplied by: white through the tone, darkened while refused. */
function paintedTint(refusal: Refusal, tone: Tone): number {
  const toned = tone(0xffffff);
  return playable(refusal) ? toned : multiplied(toned, LOOK.unaffordableFront);
}

/**
 * The image of the front a card of the family wears, at a card that wide, its body's top-left corner
 * where the image stands.
 */
function wearFront(
  image: Phaser.GameObjects.Image,
  family: CardFamily,
  width: number,
): Phaser.GameObjects.Image {
  const { frame, body } = frontOf(family);
  return image
    .setTexture(CARDS_SHEET_KEY, frame)
    .setScale(unitOf(width), downOf(width))
    .setDisplayOrigin(body.x, body.y);
}

/**
 * The front of a card of the family drawn alone, as a copy under a stack's face shows it, at a card
 * of the hand's size, its body's top-left corner at its place, every colour through the tone.
 */
export function addFront(
  scene: Phaser.Scene,
  family: CardFamily,
  tone: Tone,
): Phaser.GameObjects.Image {
  return wearFront(scene.add.image(0, 0, CARDS_SHEET_KEY), family, CARD_WIDTH).setTint(
    tone(0xffffff),
  );
}

/** An interactive zone of a face that a pool or a re-read gives its place and its size. */
function faceZone(scene: Phaser.Scene): Phaser.GameObjects.Zone {
  return reactsToPress(scene.add.zone(0, 0, 1, 1).setInteractive());
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

/** The zone over a label of a face's foot, reacting to no press. */
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

/** The pack's disc with a symbol's glyph and a number side by side on it, about its middle. */
type DiscMark = {
  readonly root: Phaser.GameObjects.Container;
  readonly disc: Phaser.GameObjects.Image;
  readonly glyph: Phaser.GameObjects.Container;
  readonly number: Phaser.GameObjects.Text;
};

/** A disc drawing nothing yet, for a card that wide, its number set that large. */
function discMarkOf(scene: Phaser.Scene, width: number, numberSize: number): DiscMark {
  const disc = scene.add.image(0, 0, CARDS_SHEET_KEY, DISC.file);
  disc.setScale((DISC.width * unitOf(width)) / disc.width);
  const glyph = glyphMark(scene);
  const number = addText(scene, 0, 0, '', {
    fontFamily: UI_FONT,
    fontSize: `${numberSize}px`,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  return { root: scene.add.container(0, 0, [disc, glyph, number]), disc, glyph, number };
}

/**
 * A disc made to read the symbol's glyph and the amount at its middle, the pair centred on it, the
 * disc under the tint, the number in its ink, both through the tone.
 */
function showDisc(
  { root, disc, glyph, number }: DiscMark,
  {
    symbol,
    amount,
    ink,
    tint,
    tone,
    at,
  }: {
    readonly symbol: CastSymbol;
    readonly amount: number;
    readonly ink: number;
    readonly tint: number;
    readonly tone: Tone;
    readonly at: { readonly x: number; readonly y: number };
  },
): void {
  disc.setTint(tint);
  inked(number, tone(ink)).setText(String(amount));
  const size = Number.parseFloat(number.style.fontSize as string);
  const square = DISC_GLYPH_SHARE * size;
  const gap = DISC_GAP * size;
  const wide = ownBoxOf(number).width;
  const span = square + gap + wide;
  asGlyph(glyph, symbol, square, { tone, outlined: false }).setX(-span / 2 + square / 2);
  number.setX(span / 2 - wide / 2);
  root.setPosition(at.x, at.y);
}

/**
 * A face, drawn about its own bottom centre so a container's angle fans it from that corner, every
 * colour of it through the tone. The refusal marks the costs the city cannot pay, and any refusal
 * at all draws the face unplayable. Its width and whether its names react to presses are its for
 * life.
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
  const unit = unitOf(width);
  const down = downOf(width);
  const height = heightOf(width);
  const size = (units: number): number => (units * width) / CARD_WIDTH;
  const discNumber = size(DISC_NUMBER_SIZE);
  /** A point of the pack's pixels, from the body's top-left corner, about the face's bottom centre. */
  const placed = ({ x, y }: PackPoint): { x: number; y: number } => ({
    x: -width / 2 + x * unit,
    y: -height + y * down,
  });

  const root = scene.add.container(0, 0);
  const window = scene.add.rectangle(0, 0, 1, 1, 0).setOrigin(0, 0);
  const front = scene.add.image(0, 0, CARDS_SHEET_KEY);
  const plate = scene.add.image(0, -height + PLATE.middle * down, CARDS_SHEET_KEY, PLATE.file);
  plate.setScale((PLATE.width * unit) / plate.width);

  const name = addText(scene, 0, plate.y, face.name, {
    fontFamily: UI_FONT,
    fontSize: `${size(NAME_SIZE)}px`,
    fontStyle: 'bold',
    color: css(tone(LOOK.cardNameInk)),
  }).setOrigin(0.5);

  const type = size(TEXT_SIZE);
  const kind = addText(scene, 0, 0, kindLabel(face.kind).toUpperCase(), {
    fontFamily: UI_FONT,
    fontSize: `${type}px`,
    letterSpacing: 0.14 * type,
  })
    .setOrigin(0.5, 1)
    .setAlpha(LOOK.cardKindLabel)
    .setName('kind-label');

  const ruled = addRun(
    scene,
    face.rules,
    { fontFamily: UI_FONT, fontSize: `${type}px`, align: 'center' },
    frontOf(face.family).paper.width * unit,
  );
  const rules = ruled.label.setOrigin(0.5).setName('rules');

  const influence = discMarkOf(scene, width, discNumber);
  influence.number.setName('influence-label');

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
      BODY_RADIUS * unit + RING_STANDOFF,
    );
  }

  const point = scene.add
    .polygon(
      0,
      0,
      corners([-POINT_WIDTH / 2, POINT_HEIGHT, POINT_WIDTH / 2, POINT_HEIGHT, 0, 0]),
      LOOK.selected,
    )
    .setStrokeStyle(1, LOOK.selectedEdge)
    .setName('aim-point')
    .setVisible(false);

  root.add([window, front, plate, name, rules, kind, influence.root, ring, point]);

  const underRing = {
    scene,
    add: (object: Phaser.GameObjects.GameObject) => root.addAt(object, root.getIndex(ring)),
  };
  const costs = rootedPoolOf(underRing, () => discMarkOf(scene, width, discNumber));
  const glyphs = poolOf(underRing, () => glyphMark(scene));
  const layNameZones = presses === undefined ? undefined : nameZonesOf(root, presses);
  const footZones =
    presses?.footOver === undefined
      ? undefined
      : {
          kind: footZoneOf(scene, 'kind', presses.footOver),
          influence: footZoneOf(scene, 'influence', presses.footOver),
        };
  if (footZones !== undefined) root.add([footZones.kind, footZones.influence]);

  const influenceAt = placed(DISC.influence);
  const painted = DISC.painted * unit;

  /** What the face reads now. */
  let reads = face;
  /** The names its rules draw. */
  let names: Name[] = [];
  /** The middle of its kind label. */
  let kindMiddle = 0;

  const read = (next: Face, refused: Refusal, toned: Tone = unworn): void => {
    reads = next;
    const shape = frontOf(next.family);
    const tint = paintedTint(refused, toned);
    const textInk = toned(playable(refused) ? LOOK.cardTextInk : LOOK.unaffordableCard.ink);

    const glass = placed(shape.window);
    window
      .setPosition(glass.x, glass.y)
      .setSize(shape.window.width * unit, shape.window.height * down)
      .setFillStyle(multiplied(paleOf(next.family), tint));
    wearFront(front, next.family, width)
      .setPosition(-width / 2, -height)
      .setTint(tint);
    plate.setTint(tint);

    inked(name, toned(LOOK.cardNameInk)).setText(next.name);

    const paper = placed(shape.paper);
    const paperMiddle = paper.x + (shape.paper.width * unit) / 2;
    const foot = paper.y + shape.paper.height * down;
    inked(kind, textInk).setText(kindLabel(next.kind).toUpperCase()).setPosition(paperMiddle, foot);
    kindMiddle = foot - kind.height / 2;

    const textTop = plate.y + TEXT_BELOW_PLATE * down;
    ruled.wrapAt(shape.paper.width * unit);
    inked(rules, textInk)
      .setText(next.rules)
      .setPosition(paperMiddle, (textTop + foot - kind.height) / 2);
    const marks = centredMarks(ruled, {});
    glyphs.hide();
    for (const glyph of marks.glyphs) {
      asGlyph(glyphs.take(), glyph.resource, GLYPH_SHARE * type, { tone: toned }).setPosition(
        glyph.x,
        glyph.y,
      );
    }
    names = marks.names;
    root.setData({ card: next.id, names });
    layNameZones?.(names);

    costs.hide();
    const first = placed(shape.cost);
    for (const [at, { resource, amount }] of next.costs.entries()) {
      showDisc(costs.take(), {
        symbol: resource,
        amount,
        ink: refused.unaffordable.includes(resource) ? LOOK.unaffordableMark : LOOK.cardDiscInk,
        tint,
        tone: toned,
        at: { x: first.x, y: first.y + at * DISC.below * down },
      });
    }

    const gains = next.influence !== 0;
    influence.root.setVisible(gains);
    if (gains) {
      showDisc(influence, {
        symbol: 'influence',
        amount: next.influence,
        ink: LOOK.cardDiscInk,
        tint,
        tone: toned,
        at: influenceAt,
      });
    }

    if (footZones !== undefined) {
      footZones.kind.setPosition(kind.x, kindMiddle).setSize(kind.width, kind.height);
      footZones.influence
        .setVisible(gains)
        .setPosition(influenceAt.x, influenceAt.y)
        .setSize(painted, painted);
    }

    point.setY(-height - pointStandoff(shape.rises, width) - POINT_HEIGHT / 2);
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
      return namedAt(root, names, x, y);
    },
    spotOf(name: Name): Spot {
      return spotOn(root, name);
    },
    footAt(x: number, y: number): FootLabel | undefined {
      const local = root.getLocalPoint(x, y);
      if (
        Math.abs(local.y - kindMiddle) <= kind.height / 2 &&
        Math.abs(local.x - kind.x) <= kind.width / 2
      ) {
        return 'kind';
      }
      if (
        reads.influence !== 0 &&
        Math.abs(local.x - influenceAt.x) <= painted / 2 &&
        Math.abs(local.y - influenceAt.y) <= painted / 2
      ) {
        return 'influence';
      }
      return undefined;
    },
    cardAt(x: number, y: number): boolean {
      const local = root.getLocalPoint(x, y);
      return Math.abs(local.x) <= width / 2 && local.y <= 0 && local.y >= -height;
    },
    explainFoot(tooltip: Tooltip, label: FootLabel): void {
      const besideAt = (saying: string, at: () => { x: number; y: number }): void => {
        tooltip.beside(saying, () => {
          const { x, y } = at();
          return root.getWorldTransformMatrix().transformPoint(x, y);
        });
      };
      switch (label) {
        case 'kind':
          besideAt(kindTooltip(reads.kind), () => {
            const own = ownBoxOf(kind);
            return { x: own.x + own.width, y: kindMiddle };
          });
          return;
        case 'influence':
          if (reads.influence !== 0) {
            besideAt(text('tooltip.influence'), () => ({
              x: influenceAt.x + painted / 2,
              y: influenceAt.y,
            }));
          }
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

/** How wide the crown on a back stands, as a share of the card's width. */
const CROWN_SHARE = 0.6;

/** A face-down card, about its own bottom centre: the pack's back with the player's crown on it. */
export function createCardBack(scene: Phaser.Scene): CardBack {
  const back = scene.add
    .image(-CARD_WIDTH / 2, -CARD_HEIGHT, CARDS_SHEET_KEY, BACK.file)
    .setScale(unitOf(CARD_WIDTH), downOf(CARD_WIDTH))
    .setDisplayOrigin(BACK.body.x, BACK.body.y);
  const crown = glyphMark(scene).setY(-CARD_HEIGHT / 2);

  const wear = (tone: Tone): void => {
    back.setTint(tone(0xffffff));
    asGlyph(crown, 'player', CROWN_SHARE * CARD_WIDTH, { tone, colour: LOOK.civilization });
  };
  wear(unworn);

  return { root: scene.add.container(0, 0, [back, crown]), wear };
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
  const r = CARD_RADIUS;
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
