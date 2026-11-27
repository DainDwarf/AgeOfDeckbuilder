import { LOOK } from './look';
import { blankCanvas, type Made, type Retouched, type Sheet } from './sheet';

/** The folder DRStudios' metal kit stands in, under the assets folder, at the scale the game loads. */
const KIT = 'store/uiforge-metal-ui-kit/png/2x';

/** The key of the sheet the kit's pieces are drawn into. */
export const CHROME_SHEET_KEY = 'chrome';

/** How far every file of the kit reaches past its piece on each side, for the piece's shadow, in its pixels. */
export const SHADOW_MARGIN = 10;

/** Where a file of the kit is cut: its corners stand outside these lines, in its pixels from each edge. */
export type Cuts = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

/** One drawing of the kit: its frame of the sheet, and where it is cut. */
export type Piece = { readonly frame: string; readonly cuts: Cuts };

/** A piece drawn at the height something stands, fitted to it by its own height under its shadow. */
export type Fitted = Piece & { readonly height: number };

/** The looks a button of the kit wears. */
export type ButtonLook = 'normal' | 'hover' | 'pressed';

/** The kit's buttons the chrome draws: its gold, and its bright silver. */
export type ButtonPiece = 'gold' | 'silver';

/**
 * The rows of a button's file the kit paints its shaded strip across, in its pixels: the face's last
 * row above it, the row a line falls on between them where the kit draws one, and the strip's first
 * and last rows.
 */
type ButtonStrip = {
  readonly face: number;
  readonly line?: number;
  readonly first: number;
  readonly last: number;
};

/** A button of the kit: its file in each look, where it is cut, and the rows of its strip. */
type Button = {
  readonly looks: Readonly<Record<ButtonLook, string>>;
  readonly cuts: Cuts;
  readonly height: number;
  readonly strip: ButtonStrip;
};

/** How many pixels in from each end of a row's opaque span the lift leaves alone, and over how many more it fades in. */
const LIFT_EDGE = { kept: 4, fading: 2 };

/**
 * A button's file with its strip lifted, in place, column by column and channel by channel, the lift
 * fading in from the ends of each row's opaque span.
 */
function liftStrip({ face, line, first, last }: ButtonStrip): (pixels: ImageData) => void {
  return ({ data, width }) => {
    const at = (x: number, y: number): number => 4 * (y * width + x);
    /** For each column and colour channel, the face's last row over that row, held between 1 and 2. */
    const ratiosOver = (row: number): Float64Array =>
      Float64Array.from({ length: 3 * width }, (_, cell) => {
        const x = Math.floor(cell / 3);
        const channel = cell % 3;
        const ratio = data[at(x, face) + channel] / data[at(x, row) + channel];
        return Math.min(2, Math.max(1, ratio));
      });
    // Every ratio is read before any row is written: the strip's first row is lifted with the rest.
    const strip = ratiosOver(first);
    const lifts = [
      ...(line === undefined ? [] : [{ row: line, ratios: ratiosOver(line) }]),
      ...Array.from({ length: last - first + 1 }, (_, by) => ({ row: first + by, ratios: strip })),
    ];
    for (const { row, ratios } of lifts) {
      const opaque = (x: number): boolean => data[at(x, row) + 3] === 0xff;
      let from = 0;
      while (!opaque(from)) from++;
      let to = width - 1;
      while (!opaque(to)) to--;
      for (let x = from; x <= to; x++) {
        const inside = Math.min(x - from, to - x) - LIFT_EDGE.kept + 1;
        const weight = Math.min(1, Math.max(0, inside / LIFT_EDGE.fading));
        for (let channel = 0; channel < 3; channel++) {
          data[at(x, row) + channel] *= 1 + weight * (ratios[3 * x + channel] - 1);
        }
      }
    }
  };
}

/** How far inside a piece's edge its rim reaches, and the radius of the rim's inner corners, in its file's pixels. */
export const RIM = { breadth: 11.5, corner: 23 };

/** The kit's panel, and the radius of its outer corners in its file's pixels. */
export const PANEL: Piece & { readonly corner: number } = {
  frame: `${KIT}/panel_normal.png`,
  cuts: { left: 68, top: 68, right: 68, bottom: 68 },
  corner: RIM.breadth + RIM.corner,
};

/** The kit's inactive tab, a well, and the radius of its corners in its file's pixels. */
export const INACTIVE_TAB: Fitted & { readonly corner: number } = {
  frame: `${KIT}/tab_inactive.png`,
  cuts: { left: 44, top: 44, right: 44, bottom: 52 },
  height: 92,
  corner: 12,
};

/** The kit's focused input field. */
export const FIELD: Fitted = {
  frame: `${KIT}/input_focus.png`,
  cuts: { left: 46, top: 46, right: 46, bottom: 54 },
  height: 108,
};

/** The placeholder bar the kit paints in its field: the first and last columns and rows it covers, in its file's pixels. */
const FIELD_BAR = { left: 42, right: 315, top: 55, bottom: 68 };

/** The field's file with its placeholder bar painted out, each row of it in the field's colour right of the bar. */
function paintOutBar({ data, width }: ImageData): void {
  const { left, right, top, bottom } = FIELD_BAR;
  for (let row = top; row <= bottom; row++) {
    const field = 4 * (row * width + right + 1);
    for (let x = left; x <= right; x++) {
      data.copyWithin(4 * (row * width + x), field, field + 4);
    }
  }
}

/** The kit's counter chip, its cuts meeting in its middle: a box as wide as tall draws it round. */
export const COUNTER: Fitted = {
  frame: `${KIT}/currency_normal.png`,
  cuts: { left: 62, top: 62, right: 62, bottom: 62 },
  height: 104,
};

/** The kit's ribbon, a notched tail inside each of its side cuts. */
export const RIBBON: Fitted = {
  frame: `${KIT}/ribbon_normal.png`,
  cuts: { left: 56, top: 46, right: 56, bottom: 54 },
  height: 104,
};

export const BUTTONS: Readonly<Record<ButtonPiece, Button>> = {
  gold: {
    looks: {
      normal: `${KIT}/btn_cta_normal.png`,
      hover: `${KIT}/btn_cta_hover.png`,
      pressed: `${KIT}/btn_cta_pressed.png`,
    },
    cuts: { left: 54, top: 54, right: 54, bottom: 62 },
    height: 164,
    strip: { face: 127, first: 128, last: 166 },
  },
  silver: {
    looks: {
      normal: `${KIT}/btn_primary_normal.png`,
      hover: `${KIT}/btn_primary_hover.png`,
      pressed: `${KIT}/btn_primary_pressed.png`,
    },
    cuts: { left: 46, top: 46, right: 46, bottom: 54 },
    height: 108,
    strip: { face: 86, line: 87, first: 88, last: 110 },
  },
};

/**
 * The kit's disabled gold button, its steel: cut as the gold, its strip on the gold's rows, and the
 * radius of its corners at its own box's edge in its file's pixels.
 */
export const STEEL: Fitted & { readonly corner: number } = {
  frame: `${KIT}/btn_cta_disabled.png`,
  cuts: BUTTONS.gold.cuts,
  height: BUTTONS.gold.height,
  corner: 20,
};

/** What a frame round the screen is drawn for: city mode, or the settle phase. */
export type ModeFrame = 'city-mode' | 'settle-phase';

/**
 * How far in from its file's edge the outer edge of the rim of the kit's panel and of its banner
 * stands, in its pixels, the shadow outside it: a piece's box, `SHADOW_MARGIN` in, cuts into the rim.
 */
export const FRAME_MARGIN = 8.5;

/** How many units a pixel of a frame's file is drawn across: its rim 12 units wide. */
export const FRAME_SCALE = 12 / RIM.breadth;

/** The glow inside a frame: its strength against the rim, how many units in it is gone, and the power its fall is raised to. */
const GLOW = { strength: 0.8, reach: 64, fall: 2.4 };

/** How far in from each edge of a frame's file its corners are cut, in its pixels: past the glow's reach. */
const FRAME_CUT = Math.ceil(FRAME_MARGIN + RIM.breadth + GLOW.reach / FRAME_SCALE) + 1;
const FRAME_CUTS: Cuts = { left: FRAME_CUT, top: FRAME_CUT, right: FRAME_CUT, bottom: FRAME_CUT };

/**
 * A file of the kit made a frame of that colour, in place: everything inside the rim's inner edge
 * taken out, and from that edge a glow of the colour falling inward, round the rim's inner corners as
 * along its sides, the pixels across the edge shared between the two.
 */
function framed(colour: number): (pixels: ImageData) => void {
  const channels = [(colour >> 16) & 0xff, (colour >> 8) & 0xff, colour & 0xff];
  return ({ data, width, height }) => {
    const inset = FRAME_MARGIN + RIM.breadth;
    const straight = { x: width / 2 - inset - RIM.corner, y: height / 2 - inset - RIM.corner };
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const across = Math.abs(x + 0.5 - width / 2) - straight.x;
        const down = Math.abs(y + 0.5 - height / 2) - straight.y;
        const outside =
          Math.hypot(Math.max(across, 0), Math.max(down, 0)) +
          Math.min(Math.max(across, down), 0) -
          RIM.corner;
        const inside = Math.min(1, Math.max(0, 0.5 - outside));
        if (inside === 0) continue;
        const depth = (Math.max(0, -outside) * FRAME_SCALE) / GLOW.reach;
        const glow = depth >= 1 ? 0 : inside * GLOW.strength * (1 - depth) ** GLOW.fall;
        const at = 4 * (y * width + x);
        const rim = (1 - inside) * (data[at + 3] / 0xff);
        const alpha = rim + glow;
        for (const [channel, value] of channels.entries()) {
          data[at + channel] = alpha === 0 ? 0 : (data[at + channel] * rim + value * glow) / alpha;
        }
        data[at + 3] = 0xff * alpha;
      }
    }
  };
}

/** The kit's banner, its gold rim a frame's in city mode. */
const BANNER = `${KIT}/banner_normal.png`;

/** The kit's panel's file, as large as it is painted. */
const PANEL_FILE = { width: 760, height: 520 };

/** The kit's panel's silver rim, the settle phase's frame, made off a copy of the panel. */
const PANEL_FRAME: Made = {
  frame: 'panel-rim',
  ...PANEL_FILE,
  paint: (context, paintingIn) => {
    const { canvas, x, y, width, height } = paintingIn(CHROME_SHEET_KEY, PANEL.frame);
    if (width !== PANEL_FILE.width || height !== PANEL_FILE.height) {
      throw new Error(`the kit's panel is painted ${width} by ${height}`);
    }
    const on = blankCanvas(width, height);
    on.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    const pixels = on.getImageData(0, 0, width, height);
    framed(LOOK.settlePhase)(pixels);
    on.putImageData(pixels, 0, 0);
    context.drawImage(on.canvas, 0, 0);
  },
};

/** The frame round the screen each standing is drawn as. */
export const MODE_FRAMES: Readonly<Record<ModeFrame, Piece>> = {
  'city-mode': { frame: BANNER, cuts: FRAME_CUTS },
  'settle-phase': { frame: PANEL_FRAME.frame, cuts: FRAME_CUTS },
};

/** The kit's window, whose gold band a window of the menu wears. */
const MODAL = `${KIT}/modal_normal.png`;

/**
 * The window's gold band in the kit's window file: the column it is read down and how wide, the row
 * it starts on, how many rows reach the dark line under it, and how many more that line takes.
 */
const MODAL_BAND = { column: 420, across: 4, top: 21, rows: 118, line: 8 };

/** How many design units a pixel of the kit's files is drawn across on a window of the menu. */
export const WINDOW_RIM = 0.24;

/** How far under a window's top the gold band reaches, the dark line left out. */
export const WINDOW_BAND_FOOT = 54;

/** How tall the kit's dark line under the band is drawn, in units, and in the band's pixels. */
const LINE_UNDER = 4;
const LINE_PIXELS = Math.round(LINE_UNDER / WINDOW_RIM);

/** How tall the gold band is painted inside the rim, at a window's rim, in the kit's pixels. */
const BAND_PIXELS = Math.round((WINDOW_BAND_FOOT - RIM.breadth * WINDOW_RIM) / WINDOW_RIM);

/**
 * The gold band laid inside a window's top edge, the dark line under it: the kit window's band read
 * down one column, its top corners rounded as the rim's inner corner, cut above the line.
 */
export const WINDOW_BAND: Piece & { readonly width: number; readonly height: number } = {
  frame: 'window-band',
  cuts: { left: RIM.corner, top: RIM.corner, right: RIM.corner, bottom: LINE_PIXELS },
  width: 2 * RIM.corner + 2,
  height: BAND_PIXELS + LINE_PIXELS,
};

const BUTTON_FILES: readonly Retouched[] = [
  ...Object.values(BUTTONS).flatMap(({ looks, strip }) =>
    Object.values(looks).map((file) => ({ file, retouch: liftStrip(strip) })),
  ),
  { file: STEEL.frame, retouch: liftStrip(BUTTONS.gold.strip) },
];

export const CHROME_SHEET: Sheet = {
  key: CHROME_SHEET_KEY,
  files: [
    PANEL.frame,
    MODAL,
    ...BUTTON_FILES.map(({ file }) => file),
    INACTIVE_TAB.frame,
    COUNTER.frame,
    RIBBON.frame,
    FIELD.frame,
    BANNER,
  ],
  retouched: [
    ...BUTTON_FILES,
    { file: FIELD.frame, retouch: paintOutBar },
    { file: BANNER, retouch: framed(LOOK.cityMode) },
  ],
  made: [
    PANEL_FRAME,
    {
      frame: WINDOW_BAND.frame,
      width: WINDOW_BAND.width,
      height: WINDOW_BAND.height,
      paint: (context, paintingIn) => {
        const modal = paintingIn(CHROME_SHEET_KEY, MODAL);
        const { width, height } = WINDOW_BAND;
        const { column, across, top, rows, line } = MODAL_BAND;
        const pitch = BAND_PIXELS / rows;
        context.beginPath();
        context.roundRect(0, 0, width, height, [RIM.corner, RIM.corner, 0, 0]);
        context.clip();
        context.drawImage(
          modal.canvas,
          modal.x + column,
          modal.y + top,
          across,
          rows + line,
          0,
          0,
          width,
          (rows + line) * pitch,
        );
      },
    },
  ],
  side: 2048,
  rowGap: 16,
  columnGap: 16,
  anisotropic: true,
};
