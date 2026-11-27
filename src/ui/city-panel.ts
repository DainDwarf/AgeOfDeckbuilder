import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { type Reckoning, reckoned } from '../rules/chronicle';
import { claimWaiting, unitsCounted } from '../rules/city';
import { type Chronicle, idle } from '../rules/state';
import {
  createChromeButton,
  createChromePanel,
  createChromeWell,
  hangChromePanel,
  PANEL_RIMS,
  takesThePointer,
} from './chrome';
import {
  CITY_BAR_STOCKS,
  type CityBar,
  type CityBarStock,
  cityBarOf,
  thresholdOf,
  turnsLeft,
} from './city-bar';
import {
  BAR_THICKNESS,
  type CellAsked,
  type CityPanelLayout,
  DISC,
  layOutCityPanel,
} from './city-panel-layout';
import {
  addText,
  BAR_HEIGHT,
  inked,
  NO_REACTION,
  onClick,
  onHover,
  onResize,
  ownBoxOf,
  type Pointing,
  RESTS,
  reactsTo,
  type Stratum,
  screenSize,
  UI_FONT,
} from './design-space';
import { asGlyph, glyphOf } from './glyphs';
import { css, LOOK } from './look';
import {
  asFactionDisc,
  asThresholdBar,
  thresholdBarMarker,
  UNDARKENED,
  unitDiscMarker,
} from './map-marks';
import {
  BAR_GLYPH,
  createReckoning,
  createValue,
  placeGlyphAndValue,
  type Reckoned,
  type Reckoner,
  readingTip,
  reckoningOf,
  type StandsOn,
  showReckoning,
  standReading,
  type Tip,
  valueSpace,
} from './resource-bar';
import { SIGN_ON_DISC } from './summary';
import { buildingName, civilizationName, text } from './text';
import { STANDOFF, type Tooltip } from './tooltip';

/** The type and the ink a name reads in on a panel hung from the resource bar's foot. */
export const HUNG_NAME_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  fontStyle: 'bold',
  color: css(LOOK.charcoalInk),
};
const CLOSE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '14px',
  fontStyle: 'bold',
  color: css(LOOK.metalInk),
};
const TURNS_STYLE = { fontFamily: UI_FONT, fontSize: '13px', color: css(LOOK.turnsLeftInk) };
const COUNT_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: css(LOOK.charcoalInk) };

/** The turns' hourglass, a side of its square, and how far after the number it stands. */
const HOURGLASS = 13;
const NUMBER_TO_HOURGLASS = 2;

/** A count's glyph, a side of its square. */
const COUNT_GLYPH = 18;

/**
 * Idle's Zs at population's shoulder, each a share of the glyph's side: their side, how far right of
 * the glyph's left edge they stand, and how far above its top.
 */
const ZS = { side: 0.62, across: 0.7, up: 0.12 };

/** The counts the population reads as, in the order the panel reads them. */
type CountKind = 'idle' | 'assigned' | 'units';
const COUNTS: readonly CountKind[] = ['idle', 'assigned', 'units'];

/**
 * A reading of a stock against its threshold, laid from its cell's left end: its row about the
 * readings' middle, and its bar and its zones in the cell.
 */
type Cell = Reckoner & {
  readonly stock: CityBarStock;
  readonly root: Phaser.GameObjects.Container;
  /** Everything the reading shows together, its bar among it: what the well presses down. */
  readonly face: Phaser.GameObjects.Container;
  readonly row: Phaser.GameObjects.Container;
  readonly chip: Phaser.GameObjects.Container;
  readonly bar: Phaser.GameObjects.Container;
  readonly turns: Phaser.GameObjects.Text;
  readonly hourglass: Phaser.GameObjects.Container;
  readonly hover: Phaser.GameObjects.Zone;
  readonly turnsHover: Phaser.GameObjects.Zone;
  /** The well or the gold the reading stands in, standing only while it does. */
  readonly well: Phaser.GameObjects.NineSlice;
  /** What the bar shows and what the reckoning reads, off the last chronicle rendered. */
  shown: CityBar;
  reckoned: Reckoned;
};

/** A count of the population: its number over its glyph, and the zone its tooltip is raised from. */
type Count = {
  readonly kind: CountKind;
  readonly number: Phaser.GameObjects.Text;
  readonly glyph: Phaser.GameObjects.Container;
  /** How wide the glyph stands. */
  readonly across: number;
  readonly hover: Phaser.GameObjects.Zone;
};

export type CityPanel = {
  render(chronicle: Chronicle): void;
  /** Whether the panel reads what ending the turn would do, or not. */
  live(on: boolean): void;
  /** The panel standing, or down. */
  show(on: boolean): void;
  /** Close's look read again, for a liveness that has moved. */
  dress(): void;
  /** Culture's reading sunk in its well while the claim is being aimed, or stood on what it reads. */
  aimed(on: boolean): void;
};

/** Whether a left click on the stock's reading is the claim's: culture's is, food's reacts to none. */
function aimsTheClaim(stock: CityBarStock): boolean {
  switch (stock) {
    case 'food':
      return false;
    case 'culture':
      return true;
  }
}

/** The ink the turns left and their hourglass read in on what their reading stands on. */
function turnsInk(on: StandsOn): number {
  switch (on) {
    case 'gold':
      return LOOK.metalInk;
    case 'charcoal':
    case 'inactive-tab':
      return LOOK.turnsLeftInk;
  }
}

/**
 * City mode's panel on the stratum, named `city-mode`, hidden: the city's name, food, culture and
 * population read off each chronicle rendered, a rest on a reading raising its tooltip; Close is
 * `leave` while `leaves` holds, and a left click on culture's reading `claim` while `claims` does.
 */
export function createCityPanel(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  tooltip: Tooltip,
  city: {
    readonly civilization: string;
    readonly leave: () => void;
    readonly leaves: () => boolean;
    readonly claim: () => void;
    readonly claims: () => boolean;
  },
): CityPanel {
  // Taking the pointer, though it reacts to no press, so no press reaches the map under it.
  const panel = takesThePointer(createChromePanel(scene, PANEL_RIMS.plate)).setName(
    'city-mode-panel',
  );
  const disc = unitDiscMarker(scene, DISC);
  asFactionDisc(disc, 'player', 'player', SIGN_ON_DISC * DISC, UNDARKENED);
  const name = addText(scene, 0, 0, '', HUNG_NAME_STYLE).setOrigin(0.5).setName('city-mode-name');
  const close = createChromeButton(
    scene,
    'gold',
    { x: 0, y: 0, width: 1, height: 1 },
    'city-mode-close',
    { live: city.leaves },
  );
  onClick(close.face, city.leave);
  const closeLabel = addText(scene, 0, 0, text('button.close'), CLOSE_STYLE)
    .setOrigin(0.5)
    .setName('city-mode-close-label');
  const root = scene.add
    .container(0, BAR_HEIGHT, [panel, ...disc, name, close.face, closeLabel])
    .setName('city-mode')
    .setVisible(false);
  on.layer.add(root);

  /** The chronicle last rendered, whether the panel reads what ending the turn would do, and how it was last laid. */
  let rendered: Chronicle | undefined;
  let live = true;
  let laid: CityPanelLayout | undefined;
  let aimed = false;

  const chronicleRead = (): Chronicle => {
    if (rendered === undefined) throw new Error('the panel raised a tooltip before it rendered');
    return rendered;
  };
  const footNow = (): number => {
    if (laid === undefined) throw new Error('the panel raised a tooltip before it was laid');
    return root.y + laid.height;
  };
  const tipped = (
    zone: Phaser.GameObjects.Zone,
    tip: () => Tip,
    pointing: () => Pointing = () => RESTS,
  ): void => {
    reactsTo(zone, pointing);
    onHover(
      zone,
      () => {
        const { title, message } = tip();
        tooltip.under(message, zone.getBounds().x, footNow() + STANDOFF, title);
      },
      () => {
        tooltip.hide();
      },
    );
  };

  const cells = CITY_BAR_STOCKS.map((stock): Cell => {
    const named = `city-mode-${stock}`;
    const value = createValue(scene, named);
    const chip = glyphOf(scene, stock, BAR_GLYPH);
    const { reckoning, pill } = createReckoning(scene, named, 0);
    const turns = addText(scene, 0, 0, '', TURNS_STYLE)
      .setOrigin(0, 0.5)
      .setName(`${named}-turns-value`);
    const hourglass = glyphOf(scene, 'turns-left', HOURGLASS).setName(`${named}-turns-glyph`);
    const bar = thresholdBarMarker(scene).setName(`${named}-bar`);
    const hover = scene.add.zone(0, 0, 1, 1).setOrigin(0, 0).setName(named).setInteractive();
    const turnsHover = scene.add
      .zone(0, 0, 1, 1)
      .setOrigin(0, 0)
      .setName(`${named}-turns`)
      .setInteractive();
    const aims = aimsTheClaim(stock);
    const pointing = (): Pointing => {
      if (!aims) return RESTS;
      return city.claims() ? { clicks: true, rests: true } : NO_REACTION;
    };
    tipped(hover, () => readingTip(chronicleRead(), stock), pointing);
    tipped(
      turnsHover,
      () => ({ title: text('label.turns-left'), message: text('tooltip.turns-left') }),
      pointing,
    );
    if (aims) {
      for (const zone of [hover, turnsHover]) {
        onClick(zone, () => {
          if (city.claims()) city.claim();
        });
      }
    }
    const row = scene.add.container(0, 0, [chip, value, pill, reckoning, turns, hourglass]);
    const face = scene.add.container(0, 0, [bar, row]);
    const cell = scene.add.container(0, 0, [face, hover, turnsHover]);
    // Added before the cell, so the reading is painted inside it.
    const well = createChromeWell(scene, `${named}-well`).setVisible(false);
    root.add([well, cell]);
    return {
      stock,
      root: cell,
      face,
      row,
      chip,
      value,
      reckoning,
      pill,
      bar,
      turns,
      hourglass,
      hover,
      turnsHover,
      well,
      shown: { held: 0, added: 0 },
      reckoned: reckoningOf(undefined, stock),
    };
  });

  const counts = COUNTS.map((kind): Count => {
    const number = addText(scene, 0, 0, '', COUNT_STYLE)
      .setOrigin(0.5)
      .setName(`city-mode-${kind}-value`);
    const { glyph, across } = countGlyphOf(scene, kind);
    const hover = scene.add
      .zone(0, 0, 1, 1)
      .setOrigin(0, 0)
      .setName(`city-mode-${kind}`)
      .setInteractive();
    tipped(hover, () => countTip(chronicleRead(), kind));
    root.add([glyph.setName(`city-mode-${kind}-glyph`), number, hover]);
    return { kind, number, glyph, across, hover };
  });

  const space = valueSpace(scene);
  const closeWord = ownBoxOf(closeLabel).width;

  /** A reading read off the chronicle, laid from its cell's left end: what it asks of its cell. */
  const readCell = (cell: Cell, chronicle: Chronicle, read: Reckoning | undefined): CellAsked => {
    const { stock, value, reckoning, pill, turns } = cell;
    const held = chronicle.resources[stock];
    const threshold = thresholdOf(chronicle, stock);
    value.setText(text('reading.over', { count: held, over: threshold }));
    placeGlyphAndValue(cell.chip, value, BAR_GLYPH, 0, 0);
    cell.reckoned = reckoningOf(read, stock);
    showReckoning(cell, cell.reckoned, space);
    cell.shown = cityBarOf(chronicle, stock, read?.stocks[stock]);

    const reads = [ownBoxOf(value), ownBoxOf(reckoning)].map(({ x, width }) => x + width);
    if (pill.visible) reads.push(pill.x + pill.width / 2);
    turns.setVisible(read !== undefined);
    cell.hourglass.setVisible(read !== undefined);
    cell.turnsHover.setVisible(read !== undefined);
    if (read === undefined) return { reading: Math.max(...reads), turns: 0 };
    const left = turnsLeft(stock, held, threshold, read.stocks[stock]);
    turns.setText(left === undefined ? text('reading.never') : String(left));
    return {
      reading: Math.max(...reads),
      turns: ownBoxOf(turns).width + NUMBER_TO_HOURGLASS + HOURGLASS,
    };
  };

  /** A count read off the chronicle: how wide it stands, its number or its glyph. */
  const readCount = (count: Count, chronicle: Chronicle): number => {
    count.number.setText(String(countOf(chronicle, count.kind)));
    return Math.max(ownBoxOf(count.number).width, count.across);
  };

  const centre = (): void => {
    if (laid !== undefined) root.setX((screenSize().width - laid.width) / 2);
  };
  onResize(scene, centre);

  /**
   * What a reading stands on: culture's in its well while the claim is being aimed, else on the gold
   * while the claim's act waits; food's on the charcoal.
   */
  const standsOn = ({ stock }: Cell, chronicle: Chronicle): StandsOn => {
    if (!aimsTheClaim(stock)) return 'charcoal';
    if (aimed) return 'inactive-tab';
    return claimWaiting(catalogue, chronicle) ? 'gold' : 'charcoal';
  };

  /** Every reading stood on what it stands on, over the box the layout gives its well. */
  const stand = (layout: CityPanelLayout, chronicle: Chronicle): void => {
    for (const [index, cell] of cells.entries()) {
      const on = standsOn(cell, chronicle);
      standReading(cell, on, layout.wells[index], cell.reckoned);
      inked(cell.turns, turnsInk(on));
      asGlyph(cell.hourglass, 'turns-left', HOURGLASS, { colour: turnsInk(on) });
    }
  };

  /** Everything the panel reads where the layout stands it, the panel and Close laid again where its width moved. */
  const lay = (layout: CityPanelLayout): void => {
    if (laid?.width !== layout.width) {
      hangChromePanel(panel, 0, layout.width, layout.height);
      close.place(layout.close);
    }
    laid = layout;
    centre();
    for (const part of disc) part.setPosition(layout.disc, layout.firstLine);
    name.setPosition(layout.name, layout.firstLine);
    const box = layout.close;
    closeLabel.setPosition(box.x + box.width / 2, box.y + box.height / 2);

    for (const [index, cell] of cells.entries()) {
      layCell(cell, layout, layout.cells[index]);
    }
    for (const [index, count] of counts.entries()) {
      const middle = layout.counts[index];
      count.number.setPosition(middle, layout.readings);
      count.glyph.setPosition(middle, layout.bars);
      const width = Math.max(ownBoxOf(count.number).width, count.across);
      count.hover
        .setPosition(middle - width / 2, layout.secondLine)
        .setSize(width, layout.secondLineHeight);
    }
  };

  const render = (chronicle: Chronicle): void => {
    rendered = chronicle;
    name.setText(
      text('city-panel.name', {
        civilization: civilizationName(city.civilization),
        building: buildingName(chronicle.citySection.building),
      }),
    );
    const read = live ? reckoned(catalogue, chronicle) : undefined;
    const layout = layOutCityPanel({
      name: ownBoxOf(name).width,
      close: closeWord,
      cells: cells.map((cell) => readCell(cell, chronicle, read)),
      counts: counts.map((count) => readCount(count, chronicle)),
    });
    lay(layout);
    stand(layout, chronicle);
  };

  return {
    render,
    live(on: boolean): void {
      live = on;
      if (rendered !== undefined) render(rendered);
    },
    show(on: boolean): void {
      root.setVisible(on);
    },
    dress(): void {
      close.dress();
    },
    aimed(on: boolean): void {
      aimed = on;
      if (laid !== undefined && rendered !== undefined) stand(laid, rendered);
    },
  };
}

/** A reading's cell where the layout stands it: its row and its bar, its turns left at its right end. */
function layCell(cell: Cell, layout: CityPanelLayout, left: number): void {
  const { root, row, bar, turns, hourglass, hover, turnsHover, stock } = cell;
  const width = layout.cell;
  root.setX(left);
  row.setY(layout.readings);
  asThresholdBar(bar, { length: width, width: BAR_THICKNESS }, stock, cell.shown).setPosition(
    width / 2,
    layout.bars,
  );
  hourglass.setPosition(width - HOURGLASS / 2, 0);
  const own = ownBoxOf(turns.setX(0));
  turns.setX(width - HOURGLASS - NUMBER_TO_HOURGLASS - (own.x + own.width));
  const reachesTo = turns.visible ? ownBoxOf(turns).x : width;
  hover.setPosition(0, layout.secondLine).setSize(reachesTo, layout.secondLineHeight);
  turnsHover
    .setPosition(reachesTo, layout.secondLine)
    .setSize(width - reachesTo, layout.secondLineHeight);
}

/** A count's glyph, about its middle, and how wide it stands: idle's Zs at population's shoulder. */
function countGlyphOf(
  scene: Phaser.Scene,
  kind: CountKind,
): { glyph: Phaser.GameObjects.Container; across: number } {
  switch (kind) {
    case 'idle':
      return idleGlyphOf(scene, COUNT_GLYPH);
    case 'assigned':
      return { glyph: glyphOf(scene, 'population', COUNT_GLYPH), across: COUNT_GLYPH };
    case 'units':
      return { glyph: glyphOf(scene, 'units', COUNT_GLYPH), across: COUNT_GLYPH };
  }
}

/** Idle's sign that wide, about its middle: population's glyph with idle's Zs at its shoulder, and how wide it stands. */
function idleGlyphOf(
  scene: Phaser.Scene,
  side: number,
): { glyph: Phaser.GameObjects.Container; across: number } {
  const zs = ZS.side * side;
  const across = ZS.across * side + zs;
  const left = -across / 2;
  const person = glyphOf(scene, 'population', side).setPosition(left + side / 2, 0);
  const asleep = glyphOf(scene, 'sleep', zs).setPosition(
    left + ZS.across * side + zs / 2,
    -side / 2 - ZS.up * side + zs / 2,
  );
  return { glyph: scene.add.container(0, 0, [person, asleep]), across };
}

/** What a count reads on the chronicle. */
function countOf(chronicle: Chronicle, kind: CountKind): number {
  switch (kind) {
    case 'idle':
      return idle(chronicle);
    case 'assigned':
      return chronicle.population - idle(chronicle);
    case 'units':
      return unitsCounted(chronicle, 'player');
  }
}

/** What a count's tooltip reads: idle's the resource bar's idle reading's, the others' their own. */
function countTip(chronicle: Chronicle, kind: CountKind): Tip {
  switch (kind) {
    case 'idle':
      return readingTip(chronicle, 'idle');
    case 'assigned':
      return { title: text('label.assigned'), message: text('tooltip.assigned') };
    case 'units':
      return { title: text('label.units'), message: text('tooltip.units') };
  }
}
