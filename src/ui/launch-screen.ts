import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import { agesReached, type CampaignCivilization } from '../rules/campaign';
import { achievementOf, type Catalogue } from '../rules/catalogue';
import { biomeKind } from '../rules/map-kinds';
import { type Chronicle, onSettlePhase } from '../rules/state';
import { standBrowse } from './browse';
import { createKindBubble } from './card-face';
import { openChronicle } from './chronicle-scene';
import { createPile } from './civilization-pile';
import { offerEntries } from './debug-console';
import {
  addText,
  answersPress,
  awayUnder,
  COVERED,
  corners,
  DESIGN_WIDTH,
  hexagon,
  holdDesignSpace,
  MARGIN,
  onClick,
  UI_FONT,
} from './design-space';
import { clustersOf, openingChoices, withAge } from './launch-layout';
import { css, LOOK } from './look';
import { groundColourOf, terrainColourOf } from './marks';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { ROOM, wearNavbar } from './navbar';
import { overlayOf } from './overlay-scene';
import { type Choices, campaignHeld, type Opening, savedOpening } from './save-entry';
import { inspectedThrough, type Laying, layingOf } from './stack';
import { ageName, regionName, type TextKey, technologyName, text } from './text';

const LEFT = ROOM.x + MARGIN;
const RIGHT = DESIGN_WIDTH - MARGIN;

const ARROW_TOP = 110;
const ARROW_HEIGHT = 64;
const NOTCH = 0.4 * ARROW_HEIGHT;
const ARROW_GROWTH = 0.14 * ARROW_HEIGHT;

const CLUSTER_Y = 310;
const CLUSTER_FIRST = LEFT + 70;
const CLUSTER_APART = 170;
const HEX_RADIUS = 21;
const CLUSTER_GROWTH = 1.15;
const REGION_NAME_Y = 390;

const PILE_FIRST = LEFT + 30;
const PILE_APART = 190;
const PILE_TOP = 476;

const BUTTON_WIDTH = 300;
const BUTTON_HEIGHT = 44;
const BUTTON_GAP = 24;
const LAUNCH_BOTTOM = 696;

const EDGE = 2;

const INK = css(LOOK.ink);
const PALE = css(LOOK.paleInk);
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };
const PALE_STYLE = { ...LABEL_STYLE, color: PALE };
const UNKNOWN_STYLE = { ...LABEL_STYLE, color: css(LOOK.unknownInk) };
const GREYED_STYLE = { ...LABEL_STYLE, color: css(LOOK.greyedInk) };
const LINE_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };

type Row = 'age' | 'region' | 'civilization';

/** An option's drawing, the parts of it a press lands on, and how a press on it selects. */
type Option = {
  readonly row: Row;
  readonly option: string;
  readonly selected: boolean;
  readonly parts: readonly Phaser.GameObjects.GameObject[];
  readonly hits: readonly Phaser.GameObjects.GameObject[];
};

/**
 * What Continue reads under its label: where the chronicle stands, then each achievement it reached,
 * under its technology's name.
 */
function readingsOf(catalogue: Catalogue, chronicle: Chronicle): string[] {
  const named = (id: string): string =>
    technologyName(achievementOf(catalogue, chronicle.age, id).technology);
  return [
    onSettlePhase(chronicle)
      ? text('launch.settle-phase')
      : text('launch.turn', { turn: chronicle.turn }),
    ...chronicle.achievements
      .filter(({ reached }) => reached)
      .map(({ id }) => text('achievement.reached', { achievement: named(id) })),
  ];
}

/** A polygon standing on these corners, placed where they are. */
function polygonOn(
  scene: Phaser.Scene,
  raw: readonly (readonly [number, number])[],
  fill: number,
): Phaser.GameObjects.Polygon {
  const xs = raw.map(([x]) => x);
  const ys = raw.map(([, y]) => y);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;
  return scene.add.polygon(x, y, corners(raw.flat()), fill);
}

/** A polygon answering a press on its own shape, not on the box around it. */
function pressedOnShape(polygon: Phaser.GameObjects.Polygon): Phaser.GameObjects.Polygon {
  return polygon.setInteractive(polygon.geom, Phaser.Geom.Polygon.Contains);
}

/** The time arrow: one segment per age in the order of history, each age not reached unknown. */
function arrowOf(
  { scene, catalogue }: Laying,
  reached: readonly string[],
  age: string,
): { options: Option[]; unknownAges: Phaser.GameObjects.Container[] } {
  const ages = Object.keys(catalogue.ages);
  const each = (RIGHT - LEFT - NOTCH) / ages.length;
  const options: Option[] = [];
  const unknownAges: Phaser.GameObjects.Container[] = [];
  for (const [at, id] of ages.entries()) {
    const known = reached.includes(id);
    const selected = id === age;
    const grow = selected ? ARROW_GROWTH : 0;
    const from = LEFT + at * each;
    const to = from + each;
    const top = ARROW_TOP - grow;
    const bottom = ARROW_TOP + ARROW_HEIGHT + grow;
    const middle = ARROW_TOP + ARROW_HEIGHT / 2;
    const raw: [number, number][] = [
      [from, top],
      [to, top],
      [to + NOTCH, middle],
      [to, bottom],
      [from, bottom],
      ...(at > 0 ? [[from + NOTCH, middle] as [number, number]] : []),
    ];
    const segment = polygonOn(scene, raw, known ? groundColourOf(id) : LOOK.unknownFill);
    const x = from + each / 2 + NOTCH / 2;
    if (!known) {
      segment.setStrokeStyle(EDGE, LOOK.arrowEdge);
      const label = addText(scene, x, middle, text('launch.unknown-age'), UNKNOWN_STYLE).setOrigin(
        0.5,
      );
      unknownAges.push(
        scene.add
          .container(0, 0, [segment, label])
          .setName(`launch-age-${id}`)
          .setData('selected', false),
      );
      continue;
    }
    segment.setStrokeStyle(EDGE, selected ? LOOK.selected : LOOK.arrowEdge);
    const name = addText(scene, x, middle, ageName(id), PALE_STYLE).setOrigin(0.5);
    options.push({
      row: 'age',
      option: id,
      selected,
      parts: [segment, name],
      hits: [pressedOnShape(segment)],
    });
  }
  return { options, unknownAges };
}

/** The selected age's regions in a row, each a cluster of seven hexagons over its name. */
function regionsOf({ scene, catalogue }: Laying, age: string, region: string): Option[] {
  const touching = Math.sqrt(3) * HEX_RADIUS;
  const colourOf = (biome: string): number => terrainColourOf(biomeKind(catalogue, biome).origin);
  return clustersOf(catalogue, age).map(({ region: id, biomes }, at): Option => {
    const selected = id === region;
    const x = CLUSTER_FIRST + at * CLUSTER_APART;
    const hexagons = biomes.map((biome, place) => {
      const angle = (Math.PI / 3) * (place - 1);
      const away = place === 0 ? 0 : touching;
      return pressedOnShape(
        scene.add
          .polygon(
            away * Math.cos(angle),
            away * Math.sin(angle),
            hexagon(HEX_RADIUS),
            colourOf(biome),
          )
          .setStrokeStyle(selected ? EDGE : 1, selected ? LOOK.selected : LOOK.regionEdge),
      );
    });
    const cluster = scene.add
      .container(x, CLUSTER_Y, hexagons)
      .setScale(selected ? CLUSTER_GROWTH : 1);
    const name = addText(scene, x, REGION_NAME_Y, regionName(id), PALE_STYLE)
      .setOrigin(0.5)
      .setInteractive();
    return {
      row: 'region',
      option: id,
      selected,
      parts: [cluster, name],
      hits: [...hexagons, name],
    };
  });
}

/** The campaign's civilizations in a row, each its pile, a right click on it raising its browse. */
function pilesOf(
  laying: Laying,
  civilizations: Readonly<Record<string, CampaignCivilization>>,
  civilization: string,
  browse: (civilization: string) => void,
): Option[] {
  const { scene, inspecting } = laying;
  return Object.entries(civilizations).map(([id, owned], at): Option => {
    const selected = id === civilization;
    const pile = createPile(
      laying,
      owned,
      { left: PILE_FIRST + at * PILE_APART, top: PILE_TOP, selected },
      `launch-civilization-${id}`,
      () => {
        browse(id);
      },
    );
    const zone = inspectedThrough(scene, pile.box, pile.answers, inspecting.on);
    return {
      row: 'civilization',
      option: id,
      selected,
      parts: [...pile.parts, zone],
      hits: [zone],
    };
  });
}

/** The launch screen: the three choices in bands under their words, and Continue over Launch. */
export class LaunchScreen extends Phaser.Scene {
  constructor() {
    super('launch');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    const { content, bubbles, tooltip } = wearNavbar(this, 'launch');
    backRaisesMenu(this);
    const away = awayUnder(this);
    const overlay = overlayOf(this);
    const { large, open: browse } = standBrowse(overlay, CATALOGUE, (up) => {
      away('overlay', up);
    });
    resetMenu(this, (under) => {
      away('menu', under);
      if (under) overlay.input.emit(COVERED);
    });
    const laying = layingOf(this, CATALOGUE, {
      on: bubbles,
      smallOn: bubbles,
      kinds: createKindBubble(tooltip),
      large,
    });
    const campaign = campaignHeld();
    const reached = agesReached(CATALOGUE, campaign);
    let chosen: Choices = openingChoices(CATALOGUE, campaign);
    let root: Phaser.GameObjects.Container | undefined;

    const open = (opening: Opening): void => {
      openChronicle(this.scene, opening);
    };
    offerEntries(this, {
      seed: {
        reads: () => savedOpening()?.resumed.seed,
        launch: (seed) => {
          open({ ...chosen, seed });
        },
      },
      veiled: undefined,
    });

    const select = (row: Row, option: string): void => {
      switch (row) {
        case 'age':
          chosen = withAge(CATALOGUE, chosen, option);
          lay();
          return;
        case 'region':
          chosen = { ...chosen, region: option };
          lay();
          return;
        case 'civilization':
          chosen = { ...chosen, civilization: option };
          lay();
          return;
      }
      const unlisted: never = row;
      throw new Error(`no launch row is ${JSON.stringify(unlisted)}`);
    };

    const drawn = ({
      row,
      option,
      selected,
      parts,
      hits,
    }: Option): Phaser.GameObjects.Container => {
      for (const hit of hits) {
        answersPress(hit);
        onClick(hit, () => select(row, option));
      }
      return this.add
        .container(0, 0, [...parts])
        .setName(`launch-${row}-${option}`)
        .setData('selected', selected)
        .setAlpha(selected ? 1 : LOOK.unselected);
    };

    const word = (key: TextKey, y: number): Phaser.GameObjects.Text =>
      addText(this, LEFT, y, text(key), PALE_STYLE).setOrigin(0, 0.5);

    const lay = (): void => {
      laying.inspecting.small.down();
      root?.destroy();
      root = this.add.container(0, 0).setName('launch');
      content.add(root);

      const arrow = arrowOf(laying, reached, chosen.age);
      const lastSelected = (options: Option[]): Option[] => [
        ...options.filter(({ selected }) => !selected),
        ...options.filter(({ selected }) => selected),
      ];
      root.add([
        word('launch.age', 84),
        ...arrow.unknownAges,
        ...lastSelected(arrow.options).map(drawn),
        word('launch.region', 222),
        ...regionsOf(laying, chosen.age, chosen.region).map(drawn),
        word('launch.civilization', 450),
        ...pilesOf(laying, campaign.civilizations, chosen.civilization, (civilization) => {
          browse(campaignHeld(), civilization);
        }).map(drawn),
        ...buttonsOf(laying, open, () => chosen),
      ]);
    };

    lay();
  }
}

/**
 * Continue over Launch at the room's bottom right, Launch opening the chronicle on the choices as
 * they stand; Continue greyed and answering no press while the save holds no chronicle.
 */
function buttonsOf(
  { scene, catalogue }: Laying,
  open: (opening: Opening) => void,
  choices: () => Choices,
): Phaser.GameObjects.GameObject[] {
  const middle = RIGHT - BUTTON_WIDTH / 2;
  const launchY = LAUNCH_BOTTOM - BUTTON_HEIGHT / 2;
  const launch = scene.add
    .rectangle(middle, launchY, BUTTON_WIDTH, BUTTON_HEIGHT, LOOK.button)
    .setName('launch-button')
    .setInteractive();
  answersPress(launch);
  onClick(launch, () => open(choices()));
  const launchLabel = addText(scene, middle, launchY, text('launch.button'), LABEL_STYLE)
    .setOrigin(0.5)
    .setName('launch-button-label');

  const saved = savedOpening();
  const label = addText(
    scene,
    middle,
    0,
    text('launch.continue'),
    saved === undefined ? GREYED_STYLE : LABEL_STYLE,
  )
    .setOrigin(0.5, 0)
    .setName('launch-continue-label');
  const lines = (saved === undefined ? [] : readingsOf(catalogue, saved.resumed)).map(
    (reading, index) =>
      addText(scene, middle, 0, reading, LINE_STYLE)
        .setOrigin(0.5, 0)
        .setName(`launch-continue-line-${index}`),
  );
  const height = BUTTON_HEIGHT + lines.reduce((sum, line) => sum + line.height, 0);
  const top = LAUNCH_BOTTOM - BUTTON_HEIGHT - BUTTON_GAP - height;
  const face = scene.add
    .rectangle(
      middle,
      top + height / 2,
      BUTTON_WIDTH,
      height,
      saved === undefined ? LOOK.greyedFill : LOOK.button,
    )
    .setName('launch-continue');
  if (saved !== undefined) {
    face.setInteractive();
    answersPress(face);
    onClick(face, () => open(saved));
  }
  let y = top + (BUTTON_HEIGHT - label.height) / 2;
  for (const line of [label, ...lines]) {
    line.setY(y);
    y += line.height;
  }
  return [launch, launchLabel, face, label, ...lines];
}
