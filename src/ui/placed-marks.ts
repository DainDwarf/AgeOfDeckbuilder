import type Phaser from 'phaser';
import { CENTRE } from '../rules/map';
import type { Resource } from '../rules/resources';
import { CARD_WIDTH } from './card-frames';
import { addText, corners, inked, ownBoxOf, UI_FONT } from './design-space';
import type { GoesOn } from './face';
import { asGlyph, glyphMark } from './glyphs';
import { LOOK, type Tone } from './look';
import { asBuildingAlone, hexagonOn, tileFace } from './map-marks';
import {
  DISC_RADIUS,
  DISC_RIM,
  type DiscLook,
  FACE_SHEET,
  FEATURE_DISC,
  FEATURE_SHEET_KEY,
  featureIconOf,
  ICON_WIDTH,
  IMPROVEMENT_DISC,
  PAINTING,
  paintingsOf,
  RIVER_CUT,
} from './marks';
import { type Pool, poolOf } from './pool';
import { text } from './text';

/**
 * How wide a mark of what a card goes on stands, how far apart two stand, and how wide the river's
 * cut and a building's paintings stand on its disc, in units of a card wherever it stands but large.
 */
export const GOES_ON_SIZE = 15;
export const GOES_ON_GAP = 1.5;
const RIVER_SIZE = 11;
const BUILDING_SIZE = 10.8;

/**
 * How far past a terrain's painted hexagon the pale under it reaches, and how much further the line
 * under that, in units of a card wherever it stands but large.
 */
const PALE_REACH = 1.1;
const LINE_REACH = 0.6;

/** A mark of what a card goes on, drawing nothing yet: each of the parts one of them draws. */
export type GoesOnMark = {
  readonly root: Phaser.GameObjects.Container;
  readonly line: Phaser.GameObjects.Polygon;
  readonly pale: Phaser.GameObjects.Polygon;
  readonly painting: Phaser.GameObjects.Image;
  readonly disc: Phaser.GameObjects.Arc;
  readonly icon: Phaser.GameObjects.Image;
  readonly pieces: Phaser.GameObjects.Container;
};

/** A convex polygon's corners with every edge moved outward along its normal by `by`. */
function grownBy(points: readonly { x: number; y: number }[], by: number): number[] {
  const at = (index: number): { x: number; y: number } =>
    points[(index + points.length) % points.length];
  let area = 0;
  for (const [index, { x, y }] of points.entries())
    area += x * at(index + 1).y - at(index + 1).x * y;
  const turn = Math.sign(area);
  const outward = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    return { x: (turn * (to.y - from.y)) / length, y: (-turn * (to.x - from.x)) / length };
  };
  return points.flatMap((point, index) => {
    const before = outward(at(index - 1), point);
    const after = outward(point, at(index + 1));
    const reach = by / (1 + before.x * after.x + before.y * after.y);
    return [point.x + (before.x + after.x) * reach, point.y + (before.y + after.y) * reach];
  });
}

/** The hexagon a terrain's painting `width` wide is painted on, grown by `by`, as a polygon's points. */
function paintedHexagon(width: number, by: number): number[] {
  return corners(grownBy(hexagonOn(CENTRE, width / Math.sqrt(3)), by));
}

/** A mark of what a card goes on, for a card that wide, drawing nothing yet, about its middle. */
export function goesOnMarkOf(scene: Phaser.Scene, width: number): GoesOnMark {
  const size = (units: number): number => (units * width) / CARD_WIDTH;
  const painted = size(GOES_ON_SIZE);
  const line = scene.add.polygon(0, 0, paintedHexagon(painted, size(PALE_REACH + LINE_REACH)));
  const pale = scene.add.polygon(0, 0, paintedHexagon(painted, size(PALE_REACH)));
  const painting = tileFace(scene).setScale(painted / PAINTING.width);
  const disc = scene.add.circle(0, 0, painted / 2);
  const icon = scene.add.image(0, 0, FEATURE_SHEET_KEY);
  const pieces = scene.add.container(0, 0);
  const root = scene.add.container(0, 0, [line, pale, painting, disc, icon, pieces]);
  return { root, line, pale, painting, disc, icon, pieces };
}

/** A disc of a mark in its look, its rim as wide as the map's on a disc of the map's, through the tone. */
function asDisc(disc: Phaser.GameObjects.Arc, { fill, rim }: DiscLook, tone: Tone): void {
  const rimWidth = (DISC_RIM * disc.radius) / DISC_RADIUS;
  disc
    .setFillStyle(tone(fill.colour), fill.strength)
    .setStrokeStyle(rimWidth, tone(rim.colour), rim.strength)
    .setVisible(true);
}

/**
 * A `goesOnMarkOf` made to draw one thing a card goes on, every colour through the tone: a terrain as
 * his painting over his hexagon in the pale over the line, a feature as its icon on its disc, the
 * river as its cut on the feature's disc, a building as its paintings on an improvement's disc.
 */
export function showGoesOn(mark: GoesOnMark, goesOn: GoesOn, tone: Tone): void {
  const { line, pale, painting, disc, icon, pieces } = mark;
  for (const part of [line, pale, painting, disc, icon, pieces]) part.setVisible(false);
  const tint = tone(0xffffff);
  const across = 2 * disc.radius;
  switch (goesOn.kind) {
    case 'terrain':
      line.setFillStyle(tone(LOOK.mapOutline), LOOK.cardTerrainOutline).setVisible(true);
      pale.setFillStyle(tone(LOOK.featureDiscRim.colour)).setVisible(true);
      painting.setTexture(FACE_SHEET.key, paintingsOf(goesOn.id)[0]).setTint(tint).setVisible(true);
      return;
    case 'feature': {
      asDisc(disc, FEATURE_DISC, tone);
      const wide = (ICON_WIDTH * across) / (2 * DISC_RADIUS);
      icon
        .setTexture(FEATURE_SHEET_KEY, featureIconOf(goesOn.id))
        .setDisplaySize(wide, wide)
        .setTint(tint)
        .setVisible(true);
      return;
    }
    case 'river': {
      asDisc(disc, FEATURE_DISC, tone);
      const wide = (RIVER_SIZE * across) / GOES_ON_SIZE;
      icon
        .setTexture(FEATURE_SHEET_KEY, RIVER_CUT.frame)
        .setDisplaySize(wide, wide)
        .setTint(tint)
        .setVisible(true);
      return;
    }
    case 'building': {
      asDisc(disc, IMPROVEMENT_DISC, tone);
      const box = asBuildingAlone(pieces, goesOn.id);
      for (const piece of pieces.list as Phaser.GameObjects.Image[]) piece.setTint(tint);
      const wide = (BUILDING_SIZE * across) / GOES_ON_SIZE;
      pieces.setScale(wide / Math.max(box.width, box.height)).setVisible(true);
      return;
    }
  }
}

/**
 * The numbers' type, their glyph's width, the gap after a sign, and how far after the last glyph
 * given the sign of what is taken stands, in units of a card wherever it stands but large.
 */
export const NUMBERS_TYPE = 13;
export const NUMBERS_GLYPH = 10;
const SIGN_GAP = 2;
const TAKES_AFTER = 11.7;

/** The row of what a card's thing gives and takes, drawing nothing yet: its two signs, its glyphs. */
export type NumbersRow = {
  readonly root: Phaser.GameObjects.Container;
  readonly gives: Phaser.GameObjects.Text;
  readonly takes: Phaser.GameObjects.Text;
  readonly glyphs: Pool<Phaser.GameObjects.Container>;
  /** How tall the row stands: one line of its type. */
  readonly height: number;
  /** A length in units of a card wherever it stands but large, at the card's width. */
  size(units: number): number;
};

/** A row of what a card's thing gives and takes, for a card that wide, about its middle. */
export function numbersRowOf(scene: Phaser.Scene, width: number): NumbersRow {
  const size = (units: number): number => (units * width) / CARD_WIDTH;
  const style = { fontFamily: UI_FONT, fontSize: `${size(NUMBERS_TYPE)}px` };
  const gives = addText(scene, 0, 0, text('face.gives'), style).setOrigin(0, 0.5);
  const takes = addText(scene, 0, 0, text('face.takes'), style).setOrigin(0, 0.5);
  const root = scene.add.container(0, 0, [gives, takes]).setName('numbers');
  const glyphs = poolOf(root, () => glyphMark(scene));
  return { root, gives, takes, glyphs, height: ownBoxOf(gives).height, size };
}

/**
 * A row made to read one glyph to each point given after the sign of what is given and one to each
 * point taken after the sign of what is taken, a sign with no glyph after it left out, centred across
 * on the row's middle, the signs in the card's text ink and every colour through the tone.
 */
export function showNumbers(
  { gives, takes, glyphs, size }: NumbersRow,
  given: readonly Resource[],
  taken: readonly Resource[],
  tone: Tone,
): void {
  glyphs.hide();
  const square = size(NUMBERS_GLYPH);
  const placed: { readonly x: number; readonly resource: Resource }[] = [];
  let x = 0;
  const lay = (sign: Phaser.GameObjects.Text, points: readonly Resource[]): void => {
    sign.setVisible(points.length > 0);
    if (points.length === 0) return;
    if (x > 0) x += size(TAKES_AFTER);
    const own = ownBoxOf(inked(sign, tone(LOOK.cardTextInk)).setX(0));
    sign.setX(x - own.x);
    x += own.width + size(SIGN_GAP);
    for (const resource of points) {
      placed.push({ x: x + square / 2, resource });
      x += square;
    }
  };
  lay(gives, given);
  lay(takes, taken);
  const middle = x / 2;
  for (const sign of [gives, takes]) sign.setX(sign.x - middle);
  for (const { x: at, resource } of placed) {
    asGlyph(glyphs.take(), resource, square, { tone }).setPosition(at - middle, 0);
  }
}
