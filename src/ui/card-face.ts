import type Phaser from 'phaser';
import type { Resource } from '../rules/resources';
import type { Refusal } from '../rules/state';
import {
  BACK,
  BADGES,
  BODY,
  BODY_RADIUS,
  CARD_WIDTH,
  CARDS_SHEET_KEY,
  DISC,
  frontOf,
  HIGHEST_RISE,
  type PackPoint,
  PLATE,
  paleOf,
  SHADOW,
} from './card-frames';
import {
  addText,
  cutTexts,
  DESIGN_HEIGHT,
  inked,
  MARGIN,
  onClick,
  onHover,
  ownBoxOf,
  reactsToPress,
  resolutionAt,
  type SizedStyle,
  UI_FONT,
} from './design-space';
import {
  type AnswerReading,
  BADGE_STATS,
  type BadgeStat,
  BOX_STATS,
  type BoxStat,
  type CardFamily,
  type CardStat,
  type Face,
  kindLabel,
  kindTooltip,
  numbersRun,
  statReading,
  statTooltip,
} from './face';
import { asGlyph, glyphMark } from './glyphs';
import { css, LOOK, multiplied, type Tone, unworn } from './look';
import type { CastSymbol } from './marks';
import {
  GOES_ON_GAP,
  GOES_ON_SIZE,
  goesOnMarkOf,
  NUMBERS_GLYPH,
  NUMBERS_TYPE,
  numbersRowOf,
  showGoesOn,
  showNumbers,
} from './placed-marks';
import { poolOf, rootedPoolOf, zonePoolOf } from './pool';
import { referenceName, text } from './text';
import { layOutRun, type Reference, type Run } from './text-run';
import type { Tooltip } from './tooltip';

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

/** How far a card's rim or a disc rises above its top edge, at the most: the room a line of cards keeps over it. */
export const CARD_RISE = HIGHEST_RISE * downOf(CARD_WIDTH);

/** The type on a face, in units of a card wherever it stands but large. */
const NAME_SIZE = 12;
const TEXT_SIZE = 11;
const DISC_NUMBER_SIZE = 15;

/** How wide the sign of a card nothing plays stands on its disc, in units of a card wherever it stands but large. */
const SIGN_SIZE = 16.5;

/** How wide a glyph on a disc stands, as a share of the number beside it, and the gap between. */
const DISC_GLYPH_SHARE = 0.72;
const DISC_GAP = 0.1;

/**
 * How wide the text wraps, how far under the plate's lower edge its room starts and over the kind
 * label it ends, and how far over the paper's foot the label's capitals stand, in units of a card
 * wherever it stands but large.
 */
const TEXT_WIDTH = 88.4;
const TEXT_UNDER_PLATE = 1;
const TEXT_OVER_LABEL = 1.5;
const LABEL_OVER_FOOT = 1.5;

/** How many lines of the text's type its room holds, its lines drawn closer where they would not fit. */
const TEXT_LINES = 3;

/**
 * How far a text's capitals rise over its baseline. Measured a hundred times larger: the canvas
 * rounds a measure at the text's own size up to the pixel.
 */
function capitalsOf(label: Phaser.GameObjects.Text): number {
  const { context, style } = label;
  const own = context.font;
  const size = 100 * Number.parseFloat(String(style.fontSize));
  context.font = `${style.fontStyle} ${size}px ${style.fontFamily}`;
  const rise = context.measureText(label.text).actualBoundingBoxAscent / 100;
  context.font = own;
  return rise;
}

/** How far over the plate's upper edge the middle of a mark of what a card goes on stands, in units of a card wherever it stands but large. */
const GOES_ON_OVER_PLATE = 10.5;

/**
 * How far past its letters the outline of a badge's number reaches, how far after a glyph in a unit's
 * card's text box its number stands, and how far apart the left edges of the two columns of those
 * stand, in units of a card wherever it stands but large.
 */
const BADGE_OUTLINE = 1.2;
const STAT_GAP = 1.7;
const STAT_COLUMNS = 32;

/**
 * A name a rules entry draws, or a mark at the foot of a face's window, which a face carries in its
 * data as `names`: what it names, the reading of the text it stands in, and its box.
 */
export type Name = {
  readonly reference: Reference;
  readonly reading: AnswerReading;
  /** Its middle, about the origin of the container it is drawn in. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  /** The run's line height, or the mark's. */
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
  const matrix = container.getWorldTransformMatrix();
  const top = matrix.transformPoint(name.x, name.y - name.height / 2);
  const bottom = matrix.transformPoint(name.x, name.y + name.height / 2);
  return { x: (top.x + bottom.x) / 2, top: top.y, bottom: bottom.y };
}

/** A glyph a run marks, a side of its square, as a share of the run's type. */
export const GLYPH_SHARE = 2 / 3;

/**
 * A label drawn as a run, the run its entry was last laid out as, and how tall another entry would
 * stand laid out as the label lays out its own.
 */
export type RunLabel = {
  readonly label: Phaser.GameObjects.Text;
  readonly run: Run;
  heightOf(entry: string): number;
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
  const laidOut = (content: string, context: CanvasRenderingContext2D): Run => {
    const measure = (drawn: string): number => context.measureText(drawn).width;
    return layOutRun(
      content,
      measure,
      { width, glyph: GLYPH_SHARE * size, bearing: size / 4, space: measure(' ') },
      referenceName,
    );
  };
  // Phaser runs the callback from inside updateText, on a context whose font it has just synced.
  let run!: Run;
  const label = addText(scene, 0, 0, entry, {
    ...style,
    wordWrap: {
      callback: (content, textObject) => {
        run = laidOut(content, textObject.context);
        return run.content.split('\n');
      },
    },
  });
  return {
    label,
    get run() {
      return run;
    },
    heightOf(other: string): number {
      const { ascent, descent } = label.getTextMetrics();
      const lines = laidOut(other, label.context).widths.length;
      return lines * (ascent + descent) + (lines - 1) * label.lineSpacing;
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
  const pitch = (own.height + label.lineSpacing) / run.widths.length;
  const centre = own.x + own.width / 2;
  const middleOf = (line: number): number => own.y + line * pitch + (pitch - label.lineSpacing) / 2;
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

/** A face's text with the numbers of what its thing gives and takes run in it, ahead of it. */
function inlineOf({ gives, takes, rules }: Face): string {
  const runs = [
    ...(gives.length === 0 ? [] : [numbersRun('gives', gives)]),
    ...(takes.length === 0 ? [] : [numbersRun('takes', takes)]),
  ];
  return [...runs, rules].join(' ');
}

/**
 * What stands at a face's foot and raises a tooltip: the kind label, the influence it gains, and a
 * stat a unit's card reads, on a badge at the foot or in the text box.
 */
export type FootLabel = 'kind' | 'influence' | CardStat;

const FOOT_LABELS = Object.keys({
  kind: true,
  influence: true,
  damage: true,
  health: true,
  move: true,
  action: true,
  range: true,
  sight: true,
} satisfies Record<FootLabel, true>) as FootLabel[];

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
  /** The face read as this card, under this refusal and tone. */
  read(face: Face, refusal: Refusal, tone?: Tone): void;
  /**
   * Draws the card lifted out of the hand's lane, larger about the middle of its bottom edge, over
   * its shadow and its texts cut for that size, or at its own size.
   */
  lift(lifted: boolean): void;
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

/** The image of the shadow of the front a card of the family wears, laid as `wearFront` lays it. */
function wearShadow(
  image: Phaser.GameObjects.Image,
  family: CardFamily,
  width: number,
): Phaser.GameObjects.Image {
  const { shadow, body } = frontOf(family);
  const { pixels, room } = SHADOW;
  return image
    .setTexture(CARDS_SHEET_KEY, shadow)
    .setScale(unitOf(width) / pixels, downOf(width) / pixels)
    .setDisplayOrigin(room + body.x * pixels, room + body.y * pixels);
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

/** How much the pack's steel disc is scaled by on a card that wide, and a badge with it. */
function discScaleOf(scene: Phaser.Scene, width: number): number {
  return (DISC.width * unitOf(width)) / scene.textures.getFrame(CARDS_SHEET_KEY, DISC.file).width;
}

/** The pack's steel disc for a card that wide, about its middle. */
function discOf(scene: Phaser.Scene, width: number): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, CARDS_SHEET_KEY, DISC.file).setScale(discScaleOf(scene, width));
}

/** A stat a unit's card reads: its sign, a badge or a glyph, and its number, named after the stat. */
type StatMark<Sign> = {
  readonly root: Phaser.GameObjects.Container;
  readonly sign: Sign;
  readonly number: Phaser.GameObjects.Text;
};

/** A badge drawn at that scale reading nothing yet, about its number's middle, its number set that large. */
function badgeOf(
  scene: Phaser.Scene,
  stat: BadgeStat,
  scale: number,
  numberSize: number,
): StatMark<Phaser.GameObjects.Image> {
  const { frame, number: middle } = BADGES[stat];
  const sign = scene.add
    .image(0, 0, CARDS_SHEET_KEY, frame)
    .setScale(scale)
    .setDisplayOrigin(middle.x, middle.y);
  const number = addText(scene, 0, 0, '', {
    fontFamily: UI_FONT,
    fontSize: `${numberSize}px`,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  const root = scene.add.container(0, 0, [sign, number]).setName(`stat-${stat}`);
  return { root, sign, number };
}

/** A stat of a unit's card's text box reading nothing yet, its number set that large. */
function boxStatOf(
  scene: Phaser.Scene,
  stat: BoxStat,
  numberSize: number,
): StatMark<Phaser.GameObjects.Container> {
  const sign = glyphMark(scene);
  const number = addText(scene, 0, 0, '0', {
    fontFamily: UI_FONT,
    fontSize: `${numberSize}px`,
  }).setOrigin(0, 0.5);
  const root = scene.add.container(0, 0, [sign, number]).setName(`stat-${stat}`);
  return { root, sign, number };
}

/** A box on a face, its middle and its size. */
type FaceBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Whether a point stands inside a box. */
function insideBox({ x, y }: { x: number; y: number }, box: FaceBox): boolean {
  return Math.abs(x - box.x) <= box.width / 2 && Math.abs(y - box.y) <= box.height / 2;
}

/** A disc drawing nothing yet, for a card that wide, its number set that large. */
function discMarkOf(scene: Phaser.Scene, width: number, numberSize: number): DiscMark {
  const disc = discOf(scene, width);
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
 * colour of it through the tone, the costs the refusal names unaffordable on red discs. Its width and
 * whether its names react to presses are its for life.
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
  const shadow = scene.add.image(0, 0, CARDS_SHEET_KEY).setVisible(false);
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
  })
    .setOrigin(0.5, 1)
    .setAlpha(LOOK.cardKindLabel)
    .setName('kind-label');

  const ruled = addRun(
    scene,
    face.rules,
    { fontFamily: UI_FONT, fontSize: `${type}px`, align: 'center' },
    size(TEXT_WIDTH),
  );
  const rules = ruled.label.setOrigin(0.5).setName('rules');
  const plateEdge = (row: number): number => plate.y + (row - plate.height / 2) * plate.scaleY;
  const textTop = plateEdge(PLATE.edges.bottom) + size(TEXT_UNDER_PLATE);
  const numbers = numbersRowOf(scene, width);

  const influence = discMarkOf(scene, width, discNumber);
  influence.number.setName('influence-label');
  const range = discMarkOf(scene, width, discNumber);

  const signDisc = discOf(scene, width);
  const signGlyph = glyphMark(scene);
  const sign = scene.add.container(0, 0, [signDisc, signGlyph]);

  const influenceAt = placed(DISC.influence);
  const painted = DISC.painted * unit;
  const badgeAt: Readonly<Record<BadgeStat, { x: number; y: number }>> = {
    damage: placed({ x: BODY.width - DISC.influence.x, y: DISC.influence.y }),
    health: influenceAt,
  };
  const badgeScale = discScaleOf(scene, width);
  const badges = BADGE_STATS.map((stat) => ({
    stat,
    ...badgeOf(scene, stat, badgeScale, discNumber),
  }));
  const boxed = BOX_STATS.flatMap((stats, line) =>
    stats.map((stat, column) => ({
      stat,
      line,
      column,
      ...boxStatOf(scene, stat, size(NUMBERS_TYPE)),
    })),
  );
  const statRow = ownBoxOf(boxed[0].number).height;
  const statGlyph = size(NUMBERS_GLYPH);
  /** Where a badge's picture stands on the face. */
  const badgeBox = (stat: BadgeStat): FaceBox => {
    const { x, y } = badgeAt[stat];
    const { painted: picture, number: middle } = BADGES[stat];
    return {
      x: x + (picture.x + picture.width / 2 - middle.x) * badgeScale,
      y: y + (picture.y + picture.height / 2 - middle.y) * badgeScale,
      width: picture.width * badgeScale,
      height: picture.height * badgeScale,
    };
  };
  for (const { stat, root: badge } of badges) badge.setPosition(badgeAt[stat].x, badgeAt[stat].y);
  const unlaid: FaceBox = { x: 0, y: 0, width: 0, height: 0 };
  /** Where each stat stands on the face: its badge's picture, or its glyph and its number as last laid out. */
  const statBoxes: Record<CardStat, FaceBox> = {
    damage: badgeBox('damage'),
    health: badgeBox('health'),
    move: unlaid,
    action: unlaid,
    range: unlaid,
    sight: unlaid,
  };

  root.add([
    shadow,
    window,
    front,
    plate,
    name,
    rules,
    numbers.root,
    ...boxed.map(({ root: stat }) => stat),
    kind,
    influence.root,
    range.root,
    ...badges.map(({ root: badge }) => badge),
    sign,
  ]);

  const underPlate = {
    scene,
    add: (object: Phaser.GameObjects.GameObject) => root.addAt(object, root.getIndex(plate)),
  };
  const goesOn = rootedPoolOf(underPlate, () => goesOnMarkOf(scene, width));
  const markAcross = size(GOES_ON_SIZE);
  const markPitch = markAcross + size(GOES_ON_GAP);
  const markY = plateEdge(PLATE.edges.top) - size(GOES_ON_OVER_PLATE);
  const underSign = {
    scene,
    add: (object: Phaser.GameObjects.GameObject) => root.addAt(object, root.getIndex(sign)),
  };
  const costs = rootedPoolOf(underSign, () => discMarkOf(scene, width, discNumber));
  const glyphs = poolOf(underSign, () => glyphMark(scene));
  const layNameZones = presses === undefined ? undefined : nameZonesOf(root, presses);
  const footOver = presses?.footOver;
  const footZones =
    footOver === undefined
      ? []
      : FOOT_LABELS.map((label) => ({ label, zone: footZoneOf(scene, label, footOver) }));
  root.add(footZones.map(({ zone }) => zone));

  /** What the face reads now. */
  let reads = face;
  /** The names its rules draw. */
  let names: Name[] = [];
  /** The middle of its kind label. */
  let kindMiddle = 0;

  /** Whether the face as it reads now shows the label. */
  const shows = (label: FootLabel): boolean => {
    switch (label) {
      case 'kind':
        return true;
      case 'influence':
        return reads.influence !== 0;
      case 'damage':
      case 'health':
      case 'move':
      case 'action':
      case 'range':
      case 'sight':
        return reads.stats !== undefined;
    }
  };

  /** Where the label stands on the face as it was last laid out, its middle and its size. */
  const boxOf = (label: FootLabel): FaceBox => {
    switch (label) {
      case 'kind':
        return { x: kind.x, y: kindMiddle, width: kind.width, height: kind.height };
      case 'influence':
        return { x: influenceAt.x, y: influenceAt.y, width: painted, height: painted };
      case 'damage':
      case 'health':
      case 'move':
      case 'action':
      case 'range':
      case 'sight':
        return statBoxes[label];
    }
  };

  const read = (next: Face, refused: Refusal, toned: Tone = unworn): void => {
    reads = next;
    const shape = frontOf(next.family);
    const tint = toned(0xffffff);
    const textInk = toned(LOOK.cardTextInk);

    wearShadow(shadow, next.family, width).setPosition(-width / 2, -height);
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
    const capitals = foot - size(LABEL_OVER_FOOT);
    inked(kind, textInk).setText(kindLabel(next.kind).toUpperCase()).setPosition(paperMiddle, 0);
    const own = ownBoxOf(kind);
    kind.setY(capitals + kind.getTextMetrics().descent - (own.y + own.height));
    kindMiddle = kind.y - kind.height / 2;
    const textBottom = capitals - capitalsOf(kind) - size(TEXT_OVER_LABEL);
    const { ascent, descent } = rules.getTextMetrics();
    const room = textBottom - textTop;
    const spacing = Math.min(0, (room - TEXT_LINES * (ascent + descent)) / (TEXT_LINES - 1));
    if (rules.lineSpacing !== spacing) rules.setLineSpacing(spacing);

    const numbered = next.gives.length + next.takes.length > 0;
    const inline =
      numbered && next.rules !== '' && numbers.height + ruled.heightOf(next.rules) > room;
    const reading = inline ? inlineOf(next) : next.rules;
    const rowShown = numbered && !inline;
    inked(rules, textInk)
      .setText(reading)
      .setVisible(reading !== '');
    const rowTall = rowShown ? numbers.height : 0;
    const statsTall = next.stats === undefined ? 0 : BOX_STATS.length * statRow;
    const textTall = reading === '' ? 0 : ownBoxOf(rules).height;
    const blockTop = (textTop + textBottom - rowTall - statsTall - textTall) / 2;
    numbers.root.setVisible(rowShown).setPosition(0, blockTop + rowTall / 2);
    if (rowShown) showNumbers(numbers, next.gives, next.takes, toned);
    for (const { root: stat } of boxed) stat.setVisible(next.stats !== undefined);
    if (next.stats !== undefined) layStats(next.stats, blockTop + rowTall, toned);
    rules.setPosition(0, blockTop + rowTall + statsTall + textTall / 2);
    const marks = centredMarks(ruled, {});
    glyphs.hide();
    for (const glyph of marks.glyphs) {
      asGlyph(glyphs.take(), glyph.resource, GLYPH_SHARE * type, { tone: toned }).setPosition(
        glyph.x,
        glyph.y,
      );
    }

    goesOn.hide();
    const marked: Name[] = [];
    for (const [at, thing] of next.goesOn.entries()) {
      const x = (at - (next.goesOn.length - 1) / 2) * markPitch;
      const mark = goesOn.take();
      showGoesOn(mark, thing, toned);
      mark.root.setPosition(x, markY);
      if (thing.kind !== 'river') {
        marked.push({
          reference: thing,
          reading: {},
          x,
          y: markY,
          width: markAcross,
          height: markAcross,
        });
      }
    }
    names = [...marks.names, ...marked];
    root.setData({ card: next.id, names });
    layNameZones?.(names);

    costs.hide();
    const first = placed(shape.cost);
    for (const [at, { resource, amount }] of next.costs.entries()) {
      showDisc(costs.take(), {
        symbol: resource,
        amount,
        ink: LOOK.cardDiscInk,
        tint: refused.unaffordable.includes(resource) ? toned(LOOK.unaffordableDisc) : tint,
        tone: toned,
        at: { x: first.x, y: first.y + at * DISC.below * down },
      });
    }

    sign.setVisible(next.playedByNothing);
    if (next.playedByNothing) {
      signDisc.setTint(toned(LOOK.unaffordableDisc));
      asGlyph(signGlyph, 'played-by-nothing', size(SIGN_SIZE), { tone: toned, outlined: false });
      sign.setPosition(first.x, first.y);
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

    const ranged = next.range !== 0;
    range.root.setVisible(ranged);
    if (ranged) {
      showDisc(range, {
        symbol: 'range',
        amount: next.range,
        ink: LOOK.cardDiscInk,
        tint,
        tone: toned,
        at: influenceAt,
      });
    }

    for (const { stat, root: badge, sign: picture, number } of badges) {
      badge.setVisible(next.stats !== undefined);
      if (next.stats === undefined) continue;
      picture.setTint(tint);
      inked(number, toned(LOOK.cardDiscInk))
        .setStroke(css(toned(LOOK.mapOutline)), size(2 * BADGE_OUTLINE))
        .setText(statReading(stat, next.stats[stat]));
    }

    for (const { label, zone } of footZones) {
      const box = boxOf(label);
      zone.setVisible(shows(label)).setPosition(box.x, box.y).setSize(box.width, box.height);
    }
  };

  /**
   * The stats of the text box laid out over the room from `top` down, a row to each line of their
   * type, the columns' left edges `STAT_COLUMNS` apart and the block centred across.
   */
  const layStats = (stats: NonNullable<Face['stats']>, top: number, toned: Tone): void => {
    const cellOf = ({ number }: { number: Phaser.GameObjects.Text }): number =>
      statGlyph + size(STAT_GAP) + ownBoxOf(number).width;
    for (const { stat, number } of boxed) {
      inked(number, toned(LOOK.cardTextInk)).setText(statReading(stat, stats[stat]));
    }
    const columns = size(STAT_COLUMNS);
    const across = Math.max(...boxed.map((cell) => cell.column * columns + cellOf(cell)));
    for (const cell of boxed) {
      const left = -across / 2 + cell.column * columns;
      const middle = top + (cell.line + 0.5) * statRow;
      asGlyph(cell.sign, cell.stat, statGlyph, {
        tone: toned,
        colour: LOOK.cardTextInk,
        outlined: false,
      });
      cell.sign.setPosition(left + statGlyph / 2, middle);
      const own = ownBoxOf(cell.number.setPosition(0, middle));
      cell.number.setX(left + statGlyph + size(STAT_GAP) - own.x);
      const width = cellOf(cell);
      statBoxes[cell.stat] = { x: left + width / 2, y: middle, width, height: statRow };
    }
  };
  read(face, refusal, tone);

  return {
    root,
    read,
    lift(lifted: boolean): void {
      const scale = lifted ? LOOK.liftedCard : 1;
      root.setScale(scale);
      shadow.setVisible(lifted);
      cutTexts(root.list, resolutionAt(scale));
    },
    nameAt(x: number, y: number): Name | undefined {
      return namedAt(root, names, x, y);
    },
    spotOf(name: Name): Spot {
      return spotOn(root, name);
    },
    footAt(x: number, y: number): FootLabel | undefined {
      const local = root.getLocalPoint(x, y);
      return FOOT_LABELS.find((label) => shows(label) && insideBox(local, boxOf(label)));
    },
    cardAt(x: number, y: number): boolean {
      const local = root.getLocalPoint(x, y);
      return Math.abs(local.x) <= width / 2 && local.y <= 0 && local.y >= -height;
    },
    explainFoot(tooltip: Tooltip, label: FootLabel): void {
      if (!shows(label)) return;
      const besideAt = (
        saying: string,
        at: () => { x: number; y: number },
        title?: string,
      ): void => {
        tooltip.beside(
          saying,
          () => {
            const { x, y } = at();
            return root.getWorldTransformMatrix().transformPoint(x, y);
          },
          title,
        );
      };
      const besideBox = (saying: string, title?: string): void => {
        besideAt(
          saying,
          () => {
            const box = boxOf(label);
            return { x: box.x + box.width / 2, y: box.y };
          },
          title,
        );
      };
      switch (label) {
        case 'kind':
          besideAt(kindTooltip(reads.kind), () => {
            const own = ownBoxOf(kind);
            return { x: own.x + own.width, y: kindMiddle };
          });
          return;
        case 'influence':
          besideBox(text('tooltip.influence'));
          return;
        case 'damage':
        case 'health':
        case 'move':
        case 'action':
        case 'range':
        case 'sight': {
          const { name: titled, sentence } = statTooltip(label);
          besideBox(sentence, titled);
          return;
        }
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
