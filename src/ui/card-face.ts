import type Phaser from 'phaser';
import type { Refusal } from '../rules/state';
import { ART_SHEET_KEY, artScaleOf, artWorn } from './art-sheet';
import {
  BACK,
  BADGES,
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
  BADGE_AT,
  backDrawsAt,
  cardDrawsAt,
  costAt,
  discScaleOf,
  downOf,
  frontDrawsAt,
  heightOf,
  type Laid,
  onFace,
  type Silhouettes,
  silhouettesIn,
  unitOf,
} from './card-shape';
import type { CastSymbol } from './cast';
import {
  addText,
  type Box,
  cutTexts,
  inked,
  onClick,
  onHover,
  ownBoxOf,
  reactsToPress,
  resolutionAt,
  type SizedStyle,
  TYPE_FLOOR,
  UI_FONT,
} from './design-space';
import {
  type AnswerReading,
  BADGE_STATS,
  type BadgeStat,
  BOX_STATS,
  type BoxStat,
  type CardFront,
  type CardStat,
  type Face,
  frontWindowOf,
  kindLabel,
  kindTooltip,
  numbersRun,
  statTooltip,
} from './face';
import { asGlyph, glyphMark } from './glyphs';
import { css, LOOK, multiplied, type Tone, untoned } from './look';
import { asUnit, unitMarker, unitPaintDrop } from './map-marks';
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
import { paintingsIn } from './sheet';
import { referenceName, text } from './text';
import { blockIn } from './text-room';
import { layOutRun, type Reference, type Run } from './text-run';
import type { Tooltip } from './tooltip';

export const CARD_HEIGHT = heightOf(CARD_WIDTH);

/** How far a card's corners are rounded wherever it stands but large. */
export const CARD_RADIUS = BODY_RADIUS * unitOf(CARD_WIDTH);

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

/** How many faces have been made: what names the texture of each one's own art box. */
let facesMade = 0;

/**
 * A measure of the content set at that size in a text's style. Measured a hundred times larger: the
 * canvas rounds a measure at the text's own size up to the pixel.
 */
function measureOf(
  label: Phaser.GameObjects.Text,
  content: string,
  size: number,
  read: (metrics: TextMetrics) => number,
): number {
  const { context, style } = label;
  const own = context.font;
  context.font = `${style.fontStyle} ${100 * size}px ${style.fontFamily}`;
  const measure = read(context.measureText(content)) / 100;
  context.font = own;
  return measure;
}

/** How far a text's capitals rise over its baseline. */
function capitalsOf(label: Phaser.GameObjects.Text): number {
  return measureOf(
    label,
    label.text,
    Number.parseFloat(String(label.style.fontSize)),
    (metrics) => metrics.actualBoundingBoxAscent,
  );
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

/** A name the pointer is on, as whoever drew it hands it over to the small cards. */
export type Raiser = {
  readonly name: Name;
  /** Where the name stands on the stratum the small cards stand on, as it stands when asked. */
  where(): Spot;
  /** Told a chain raised off the name stands, and that it has come down. */
  hold?(on: boolean): void;
};

/** The chain of small cards the names of one surface raise (`createSmallCards`). */
export type SmallCards = {
  /** The pointer is on this name of the surface under the chain, or on none of its names. */
  over(raiser: Raiser | undefined): void;
  /** Every small card moved with its name as the name now stands, on the side of it it rose on. */
  follow(): void;
  /** The whole chain taken down at once. */
  down(): void;
};

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
 * each glyph's symbol and middle and the left edge of the number written against it, and each name's
 * box, the reading handed carried by every name.
 */
export function centredMarks(
  { label, run }: Pick<RunLabel, 'label' | 'run'>,
  reading: AnswerReading,
): {
  glyphs: {
    readonly symbol: CastSymbol;
    readonly x: number;
    readonly y: number;
    readonly number?: { readonly reads: string; readonly left: number };
  }[];
  names: Name[];
} {
  const own = ownBoxOf(label);
  const pitch = (own.height + label.lineSpacing) / run.widths.length;
  const centre = own.x + own.width / 2;
  const middleOf = (line: number): number => own.y + line * pitch + (pitch - label.lineSpacing) / 2;
  return {
    glyphs: run.glyphs.map(({ symbol, x, line, number }) => ({
      symbol,
      x: centre + x,
      y: middleOf(line),
      number:
        number === undefined ? undefined : { reads: number.reads, left: centre + number.from },
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
 * What stands at a face's foot and raises a tooltip: the kind label, the influence it gains, the
 * movement cost a terrain's face reads on its disc, and a stat a unit's card reads, on a badge at the
 * foot or in the text box.
 */
export type FootLabel = 'kind' | 'influence' | 'movement-cost' | CardStat;

const FOOT_LABELS = Object.keys({
  kind: true,
  influence: true,
  'movement-cost': true,
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
  /**
   * Whether a point of its own space lands on what the face draws as it reads now, its body reaching
   * that much further down, or up where the reach is negative.
   */
  drawsAt(x: number, y: number, reach?: number): boolean;
  /** Whether what the face draws lies under a point of the surface it is drawn on. */
  cardAt(x: number, y: number): boolean;
  /**
   * The label's tooltip raised on the bubble, beside the label as it stands when the bubble is
   * painted.
   */
  explainFoot(tooltip: Tooltip, label: FootLabel): void;
  /** Its names and its foot react to nothing from now on: the face is on its way out. */
  deaden(): void;
};

const silhouettesRead = new WeakMap<Phaser.Textures.TextureManager, Silhouettes>();

/** The silhouettes of the cards sheet the textures hold, read the first time they are asked for. */
function silhouettesOf(textures: Phaser.Textures.TextureManager): Silhouettes {
  const read = silhouettesRead.get(textures) ?? silhouettesIn(paintingsIn(textures));
  silhouettesRead.set(textures, read);
  return read;
}

/**
 * The image of a card's front, at a card that wide, its body's top-left corner where the image
 * stands.
 */
function wearFront(
  image: Phaser.GameObjects.Image,
  front: CardFront,
  width: number,
): Phaser.GameObjects.Image {
  const { frame, body } = frontOf(front);
  return image
    .setTexture(CARDS_SHEET_KEY, frame)
    .setScale(unitOf(width), downOf(width))
    .setDisplayOrigin(body.x, body.y);
}

/** The image of the shadow of a card's front, laid as `wearFront` lays it. */
function wearShadow(
  image: Phaser.GameObjects.Image,
  front: CardFront,
  width: number,
): Phaser.GameObjects.Image {
  const { shadow, body } = frontOf(front);
  const { pixels, room } = SHADOW;
  return image
    .setTexture(CARDS_SHEET_KEY, shadow)
    .setScale(unitOf(width) / pixels, downOf(width) / pixels)
    .setDisplayOrigin(room + body.x * pixels, room + body.y * pixels);
}

/**
 * A card's front drawn alone, as a copy under a stack's face shows it, at a card of the hand's size,
 * its body's top-left corner at its place, every colour through the tone.
 */
export function addFront(
  scene: Phaser.Scene,
  front: CardFront,
  tone: Tone,
): Phaser.GameObjects.Image {
  return wearFront(scene.add.image(0, 0, CARDS_SHEET_KEY), front, CARD_WIDTH).setTint(
    tone(0xffffff),
  );
}

/** Whether a front `addFront` drew lies under a point of the surface it is drawn on. */
export function frontAt(
  image: Phaser.GameObjects.Image,
  front: CardFront,
  x: number,
  y: number,
): boolean {
  return frontDrawsAt(silhouettesOf(image.scene.textures), front, image.getLocalPoint(x, y));
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

/** `discScaleOf` a card that wide, read off the disc's picture the scene's textures hold. */
function discScaled(scene: Phaser.Scene, width: number): number {
  return discScaleOf(width, scene.textures.getFrame(CARDS_SHEET_KEY, DISC.file).width);
}

/** The pack's steel disc for a card that wide, about its middle. */
function discOf(scene: Phaser.Scene, width: number): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, CARDS_SHEET_KEY, DISC.file).setScale(discScaled(scene, width));
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
 * A disc made to read the symbol's glyph and the reading at its middle, the pair centred on it, the
 * disc under the tint, the number in its ink, the glyph in its symbol's colour unless told, all
 * through the tone.
 */
function showDisc(
  { root, disc, glyph, number }: DiscMark,
  {
    symbol,
    reading,
    ink,
    glyphColour,
    tint,
    tone,
    at,
  }: {
    readonly symbol: CastSymbol;
    readonly reading: string;
    readonly ink: number;
    readonly glyphColour?: number;
    readonly tint: number;
    readonly tone: Tone;
    readonly at: { readonly x: number; readonly y: number };
  },
): void {
  disc.setTint(tint);
  inked(number, tone(ink)).setText(reading);
  const size = Number.parseFloat(number.style.fontSize as string);
  const square = DISC_GLYPH_SHARE * size;
  const gap = DISC_GAP * size;
  const wide = ownBoxOf(number).width;
  const span = square + gap + wide;
  asGlyph(glyph, symbol, square, { tone, colour: glyphColour, outlined: false }).setX(
    -span / 2 + square / 2,
  );
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
    tone = untoned,
    width = CARD_WIDTH,
    names: presses,
  }: { tone?: Tone; width?: number; names?: NamePresses } = {},
): CardFace {
  const unit = unitOf(width);
  const down = downOf(width);
  const height = heightOf(width);
  const size = (units: number): number => (units * width) / CARD_WIDTH;
  const discNumber = size(DISC_NUMBER_SIZE);

  const root = scene.add.container(0, 0);
  const shadow = scene.add.image(0, 0, CARDS_SHEET_KEY).setVisible(false);
  const art = scene.add
    .image(0, 0, ART_SHEET_KEY)
    .setOrigin(0, 0)
    .setScale(unit, down)
    .setName('art-box');
  /** The texture a picture its art box paints as it is read stands under, let go with the face. */
  const ownArt = `face-art-${facesMade++}`;
  root.once('destroy', () => {
    if (scene.textures.exists(ownArt)) scene.textures.remove(ownArt);
  });
  /** The unit its window holds, made the first time the face reads one. */
  let windowUnit: Phaser.GameObjects.Container | undefined;
  const frontImage = scene.add.image(0, 0, CARDS_SHEET_KEY);
  const plate = scene.add.image(0, -height + PLATE.middle * down, CARDS_SHEET_KEY, PLATE.file);
  plate.setScale((PLATE.width * unit) / plate.width);
  /** The room between the plate's rivets, in units of a card wherever it stands but large. */
  const nameRoom =
    ((PLATE.rivets.right - PLATE.rivets.left) * PLATE.width * unitOf(CARD_WIDTH)) / plate.width;

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
  const footDisc = discMarkOf(scene, width, discNumber);

  const signDisc = discOf(scene, width);
  const signGlyph = glyphMark(scene);
  const sign = scene.add.container(0, 0, [signDisc, signGlyph]);

  const influenceAt = onFace(width, DISC.influence);
  const painted = DISC.painted * unit;
  const badgeAt: Readonly<Record<BadgeStat, { x: number; y: number }>> = {
    damage: onFace(width, BADGE_AT.damage),
    health: onFace(width, BADGE_AT.health),
  };
  const badgeScale = discScaled(scene, width);
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
    art,
    frontImage,
    plate,
    name,
    rules,
    numbers.root,
    ...boxed.map(({ root: stat }) => stat),
    kind,
    influence.root,
    footDisc.root,
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
  /** What of it reaches past its body, as the last read laid it. */
  let laid: Laid;

  /** Whether the face as it reads now shows the label. */
  const shows = (label: FootLabel): boolean => {
    switch (label) {
      case 'kind':
        return true;
      case 'influence':
        return reads.influence !== 0;
      case 'movement-cost':
        return reads.footDisc?.symbol === 'move';
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
      case 'movement-cost':
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

  const read = (next: Face, refused: Refusal, toned: Tone = untoned): void => {
    reads = next;
    const shape = frontOf(next.front);
    const tint = toned(0xffffff);
    const textInk = toned(LOOK.cardTextInk);

    wearShadow(shadow, next.front, width).setPosition(-width / 2, -height);
    const glass = onFace(width, shape.glass);
    const worn = artWorn(scene.textures, next.art, frontWindowOf(next.front), ownArt);
    art
      .setTexture(worn.key, worn.frame)
      .setPosition(glass.x, glass.y)
      .setTint(next.art === undefined ? multiplied(paleOf(next.front), tint) : tint);
    const held = next.unit;
    windowUnit?.setVisible(held !== undefined);
    if (held !== undefined) {
      if (windowUnit === undefined) {
        windowUnit = unitMarker(scene);
        // Under the front, whose body and glass lie over what of the unit reaches past the window.
        root.addAt(windowUnit, root.getIndex(art) + 1);
      }
      const middle = onFace(width, {
        x: shape.window.x + shape.window.width / 2,
        y: shape.window.y + shape.window.height / 2,
      });
      const scale = artScaleOf(frontWindowOf(next.front));
      const { canoed } = held;
      asUnit(
        windowUnit,
        held.type,
        held.faction,
        canoed,
        'clear',
        held.prepares,
        undefined,
        held.signed,
      )
        .setScale(scale * unit, scale * down)
        .setPosition(middle.x, middle.y - unitPaintDrop(canoed) * scale * down);
    }
    wearFront(frontImage, next.front, width)
      .setPosition(-width / 2, -height)
      .setTint(tint);
    plate.setTint(tint);

    const nameWide = measureOf(name, next.name, NAME_SIZE, (metrics) => metrics.width);
    name.setFontSize(size(nameWide > nameRoom ? TYPE_FLOOR : NAME_SIZE));
    inked(name, toned(LOOK.cardNameInk)).setText(next.name);

    const paper = onFace(width, shape.paper);
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
    const statLines = next.stats === undefined ? 0 : BOX_STATS.length;
    const rowTall = rowShown ? numbers.height : 0;
    const textTall = reading === '' ? 0 : ownBoxOf(rules).height;
    const starts = blockIn(textTop, textBottom, [
      ...Array<number>(statLines).fill(statRow),
      ...(rowTall + textTall === 0 ? [] : [rowTall + textTall]),
    ]);
    const rowTop = starts[statLines];
    numbers.root.setVisible(rowShown);
    if (rowShown) {
      numbers.root.setPosition(0, rowTop + rowTall / 2);
      showNumbers(numbers, next.gives, next.takes, toned);
    }
    for (const { root: stat } of boxed) stat.setVisible(next.stats !== undefined);
    if (next.stats !== undefined) layStats(next.stats, starts[0], starts[1] - starts[0], toned);
    if (reading !== '') rules.setPosition(0, rowTop + rowTall + textTall / 2);
    const marks = centredMarks(ruled, {});
    glyphs.hide();
    for (const glyph of marks.glyphs) {
      asGlyph(glyphs.take(), glyph.symbol, GLYPH_SHARE * type, { tone: toned }).setPosition(
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
      marked.push({
        reference: thing,
        reading: {},
        x,
        y: markY,
        width: markAcross,
        height: markAcross,
      });
    }
    names = [...marks.names, ...marked];
    root.setData({ card: next.id, names });
    layNameZones?.(names);

    /** The middle of every disc laid, in the pack's pixels. */
    const discs: PackPoint[] = [];
    costs.hide();
    for (const [at, { resource, amount }] of next.costs.entries()) {
      const middle = costAt(next.front, at);
      discs.push(middle);
      showDisc(costs.take(), {
        symbol: resource,
        reading: String(amount),
        ink: LOOK.cardDiscInk,
        tint: refused.unaffordable.includes(resource) ? toned(LOOK.unaffordable) : tint,
        tone: toned,
        at: onFace(width, middle),
      });
    }

    sign.setVisible(next.playedByNothing);
    if (next.playedByNothing) {
      signDisc.setTint(toned(LOOK.unaffordable));
      asGlyph(signGlyph, 'played-by-nothing', size(SIGN_SIZE), { tone: toned, outlined: false });
      const middle = costAt(next.front, 0);
      discs.push(middle);
      const first = onFace(width, middle);
      sign.setPosition(first.x, first.y);
    }

    const gains = next.influence !== 0;
    influence.root.setVisible(gains);
    if (gains) {
      discs.push(DISC.influence);
      showDisc(influence, {
        symbol: 'influence',
        reading: String(next.influence),
        ink: LOOK.cardDiscInk,
        tint,
        tone: toned,
        at: influenceAt,
      });
    }

    const corner = next.footDisc;
    footDisc.root.setVisible(corner !== undefined);
    if (corner !== undefined) {
      discs.push(DISC.influence);
      showDisc(footDisc, {
        symbol: corner.symbol,
        reading: corner.reading,
        ink: LOOK.cardDiscInk,
        glyphColour: LOOK.cardDiscInk,
        tint,
        tone: toned,
        at: influenceAt,
      });
    }

    const badged = next.stats !== undefined;
    for (const { stat, root: badge, sign: picture, number } of badges) {
      badge.setVisible(badged);
      if (next.stats === undefined) continue;
      picture.setTint(tint);
      inked(number, toned(LOOK.cardDiscInk))
        .setStroke(css(toned(LOOK.mapOutline)), size(2 * BADGE_OUTLINE))
        .setText(next.stats[stat]);
    }
    laid = { front: next.front, discs, badged };

    for (const { label, zone } of footZones) {
      const box = boxOf(label);
      zone.setVisible(shows(label)).setPosition(box.x, box.y).setSize(box.width, box.height);
    }
  };

  /**
   * The stats of the text box laid out over the room from `top` down, a row to each line of their
   * type, the rows' tops `pitch` apart, the columns' left edges `STAT_COLUMNS` apart and the block
   * centred across.
   */
  const layStats = (
    stats: NonNullable<Face['stats']>,
    top: number,
    pitch: number,
    toned: Tone,
  ): void => {
    const cellOf = ({ number }: { number: Phaser.GameObjects.Text }): number =>
      statGlyph + size(STAT_GAP) + ownBoxOf(number).width;
    for (const { stat, number } of boxed) {
      inked(number, toned(LOOK.cardTextInk)).setText(stats[stat]);
    }
    const columns = size(STAT_COLUMNS);
    const across = Math.max(...boxed.map((cell) => cell.column * columns + cellOf(cell)));
    for (const cell of boxed) {
      const left = -across / 2 + cell.column * columns;
      const middle = top + cell.line * pitch + statRow / 2;
      asGlyph(cell.sign, cell.stat, statGlyph, {
        tone: toned,
        colour: LOOK.cardTextInk,
        outlined: false,
      });
      cell.sign.setPosition(left + statGlyph / 2, middle);
      const own = ownBoxOf(cell.number.setPosition(0, middle));
      cell.number.setX(left + statGlyph + size(STAT_GAP) - own.x);
      const width = cellOf(cell);
      statBoxes[cell.stat] = { x: left + width / 2, y: middle, width, height: pitch };
    }
  };
  read(face, refusal, tone);

  const drawsAt = (x: number, y: number, reach = 0): boolean =>
    cardDrawsAt(silhouettesOf(scene.textures), laid, width, { x, y }, reach);

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
    drawsAt,
    cardAt(x: number, y: number): boolean {
      const local = root.getLocalPoint(x, y);
      return drawsAt(local.x, local.y);
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
        case 'movement-cost':
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
    deaden(): void {
      for (const part of root.list) part.disableInteractive();
    },
  };
}

/**
 * The face's root made interactive on what the face draws, its body reaching `reach()` further down
 * at each hit test, or up where it is negative, and draggable where told.
 */
export function pressedOnFace(
  face: CardFace,
  { reach = () => 0, draggable = false }: { reach?: () => number; draggable?: boolean } = {},
): Phaser.GameObjects.Container {
  return face.root.setInteractive({
    hitArea: {},
    hitAreaCallback: (_area: object, x: number, y: number) => face.drawsAt(x, y, reach()),
    draggable,
  });
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
  /** Whether what the back draws lies under a point of the surface it is drawn on. */
  cardAt(x: number, y: number): boolean;
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
  wear(untoned);
  const root = scene.add.container(0, 0, [back, crown]);

  return {
    root,
    wear,
    cardAt(x: number, y: number): boolean {
      return backDrawsAt(silhouettesOf(scene.textures), CARD_WIDTH, root.getLocalPoint(x, y));
    },
  };
}

/**
 * A card of the hand's size about its own bottom centre, grown that far on every side: its box, and
 * how far its corners are rounded.
 */
export function cardGrown(off: number): { readonly box: Box; readonly radius: number } {
  return {
    box: {
      x: -CARD_WIDTH / 2 - off,
      y: -CARD_HEIGHT - off,
      width: CARD_WIDTH + 2 * off,
      height: CARD_HEIGHT + 2 * off,
    },
    radius: CARD_RADIUS + off,
  };
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
