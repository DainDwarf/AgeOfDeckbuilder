import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import { agesReached, type CampaignCivilization } from '../rules/campaign';
import { achievementOf, ageOf, type Catalogue } from '../rules/catalogue';
import { biomeKind } from '../rules/map-kinds';
import { type Chronicle, NO_REFUSAL, onSettlePhase } from '../rules/state';
import {
  createCardBack,
  createCardFace,
  createKindBubble,
  type KindBubble,
  metricsOf,
} from './card-face';
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
  onHover,
  type Stratum,
  UI_FONT,
} from './design-space';
import { cardFaceAtStart } from './face';
import { openingChoices, ringOf, withAge } from './launch-layout';
import { css, LOOK } from './look';
import { groundColourOf, terrainColourOf } from './marks';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { ROOM, wearNavbar } from './navbar';
import { overlayAhead, overlayOf } from './overlay-scene';
import { type Choices, campaignHeld, type Opening, savedOpening } from './save-entry';
import { createSmallCards, raiserOf, type SmallCards } from './small-card';
import { type ShownLarge, standLarge } from './stack';
import { ageName, civilizationName, regionName, type TextKey, technologyName, text } from './text';

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
const PILE_WIDTH = 100;
const PILE_BACKS = 3;
const BACK_STEP = 5;
const PILE_LIFT = 10;
const CIVILIZATION_NAME_Y = 645;
const DECK_COUNTS_Y = 667;

const BUTTON_WIDTH = 300;
const BUTTON_HEIGHT = 44;
const BUTTON_GAP = 24;
const LAUNCH_BOTTOM = 696;

const EDGE = 2;

const INK = css(LOOK.ink);
const PALE = css(LOOK.paleInk);
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };
const PALE_STYLE = { ...LABEL_STYLE, color: PALE };
const MYSTERY_STYLE = { ...LABEL_STYLE, color: css(LOOK.mysteryInk) };
const LINE_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };
const COUNTS_STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: css(LOOK.deckCounts) };

type Row = 'age' | 'region' | 'civilization';

/** A choice's drawing, the parts of it a press lands on, and how a press on it chooses. */
type Choice = {
  readonly row: Row;
  readonly option: string;
  readonly chosen: boolean;
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
      .map(({ id }) => text('launch.reached', { achievement: named(id) })),
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

/** The time arrow: one segment per age, in the order of history, a mystery for each not reached. */
function arrowOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  reached: readonly string[],
  age: string,
): { choices: Choice[]; mysteries: Phaser.GameObjects.Container[] } {
  const ages = Object.keys(catalogue.ages);
  const each = (RIGHT - LEFT - NOTCH) / ages.length;
  const choices: Choice[] = [];
  const mysteries: Phaser.GameObjects.Container[] = [];
  for (const [at, id] of ages.entries()) {
    const known = reached.includes(id);
    const chosen = id === age;
    const grow = chosen ? ARROW_GROWTH : 0;
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
    const segment = polygonOn(scene, raw, known ? groundColourOf(id) : LOOK.mysteryFill);
    const x = from + each / 2 + NOTCH / 2;
    if (!known) {
      segment.setStrokeStyle(EDGE, LOOK.arrowEdge);
      const mystery = addText(scene, x, middle, text('plate.mystery'), MYSTERY_STYLE).setOrigin(
        0.5,
      );
      mysteries.push(
        scene.add
          .container(0, 0, [segment, mystery])
          .setName(`launch-age-${id}`)
          .setData('chosen', false),
      );
      continue;
    }
    segment.setStrokeStyle(EDGE, chosen ? LOOK.chosenEdge : LOOK.arrowEdge);
    const name = addText(scene, x, middle, ageName(id), PALE_STYLE).setOrigin(0.5);
    choices.push({
      row: 'age',
      option: id,
      chosen,
      parts: [segment, name],
      hits: [pressedOnShape(segment)],
    });
  }
  return { choices, mysteries };
}

/** The chosen age's regions in a row, each a cluster of seven hexagons over its name. */
function regionsOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  age: string,
  region: string,
): Choice[] {
  const touching = Math.sqrt(3) * HEX_RADIUS;
  const colourOf = (biome: string): number => terrainColourOf(biomeKind(catalogue, biome).origin);
  return Object.entries(ageOf(catalogue, age).regions).map(([id, held], at): Choice => {
    const chosen = id === region;
    const x = CLUSTER_FIRST + at * CLUSTER_APART;
    const hexagons = [held.centreBiome, ...ringOf(held)].map((biome, place) => {
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
          .setStrokeStyle(chosen ? EDGE : 1, chosen ? LOOK.chosenEdge : LOOK.regionEdge),
      );
    });
    const cluster = scene.add
      .container(x, CLUSTER_Y, hexagons)
      .setScale(chosen ? CLUSTER_GROWTH : 1);
    const name = addText(scene, x, REGION_NAME_Y, regionName(id), PALE_STYLE)
      .setOrigin(0.5)
      .setInteractive();
    return { row: 'region', option: id, chosen, parts: [cluster, name], hits: [...hexagons, name] };
  });
}

/** What the city section's card on a pile answers the rest and the right click with. */
type CityCardPresses = {
  readonly on: Stratum;
  readonly small: SmallCards;
  readonly kinds: KindBubble;
  readonly large: ShownLarge;
};

/**
 * The campaign's civilizations in a row, each a pile of card backs under its city section's card,
 * face up, over its name and the counts of its cards and of its settle cards.
 */
function pilesOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  civilizations: Readonly<Record<string, CampaignCivilization>>,
  civilization: string,
  { on, small, kinds, large }: CityCardPresses,
): Choice[] {
  const { height, radius } = metricsOf(PILE_WIDTH);
  const foot = PILE_TOP + height;
  return Object.entries(civilizations).map(([id, owned], at): Choice => {
    const chosen = id === civilization;
    const x = PILE_FIRST + at * PILE_APART + PILE_WIDTH / 2;
    const backs = Array.from({ length: PILE_BACKS }, (_, under) => {
      const step = (PILE_BACKS - under) * BACK_STEP;
      return createCardBack(scene, { width: PILE_WIDTH }).setPosition(x + step, foot + step);
    });
    const lift = chosen ? PILE_LIFT : 0;
    const shown = cardFaceAtStart(catalogue, owned.city.card.id);
    const card = createCardFace(scene, shown, NO_REFUSAL, { width: PILE_WIDTH });
    const face = card.root
      .setPosition(x, foot - lift)
      .setName(`launch-civilization-${id}-card`)
      .setData('card', shown.id);
    const edge = chosen
      ? [
          scene.add
            .graphics({ x, y: foot - lift })
            .lineStyle(EDGE, LOOK.chosenEdge)
            .strokeRoundedRect(-PILE_WIDTH / 2, -height, PILE_WIDTH, height, radius),
        ]
      : [];
    const name = addText(scene, x, CIVILIZATION_NAME_Y, civilizationName(id), PALE_STYLE).setOrigin(
      0.5,
    );
    const counts = addText(
      scene,
      x,
      DECK_COUNTS_Y,
      text('launch.deck', { cards: owned.cards.length, settle: owned.settle.length }),
      COUNTS_STYLE,
    ).setOrigin(0.5);
    const parts = [...backs, face, ...edge, name, counts];
    const bounds = Phaser.Geom.Rectangle.Union(
      new Phaser.Geom.Rectangle(
        x - PILE_WIDTH / 2,
        PILE_TOP - lift,
        PILE_WIDTH + PILE_BACKS * BACK_STEP,
        height + lift + PILE_BACKS * BACK_STEP,
      ),
      Phaser.Geom.Rectangle.Union(name.getBounds(), counts.getBounds()),
    );
    const zone = scene.add
      .zone(bounds.centerX, bounds.centerY, bounds.width, bounds.height)
      .setInteractive();

    zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const at = on.at(pointer.x, pointer.y);
      const named = card.nameAt(at.x, at.y);
      small.over(named === undefined ? undefined : raiserOf(card, named));
      kinds.over(card, card.kindAt(at.x, at.y));
    });
    onHover(
      zone,
      () => {},
      () => {
        small.over(undefined);
        kinds.over(card, false);
      },
    );
    onClick(
      zone,
      (pointer) => {
        const at = on.at(pointer.x, pointer.y);
        const named = card.nameAt(at.x, at.y);
        if (named !== undefined) {
          large.named(named);
          return;
        }
        if (card.cardAt(at.x, at.y)) large.show(shown);
      },
      'right',
    );
    return { row: 'civilization', option: id, chosen, parts: [...parts, zone], hits: [zone] };
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
    const large = standLarge(
      overlay,
      CATALOGUE,
      (up) => {
        away('overlay', up);
      },
      () => false,
    );
    resetMenu(this, (under) => {
      away('menu', under);
      if (under) overlay.input.emit(COVERED);
    });
    const kinds = createKindBubble(tooltip);
    const presses = {
      on: bubbles,
      small: createSmallCards(this, bubbles, CATALOGUE, kinds, large.named),
      kinds,
      large,
    };
    const campaign = campaignHeld();
    const reached = agesReached(CATALOGUE, campaign);
    let chosen: Choices = openingChoices(CATALOGUE, campaign);
    let root: Phaser.GameObjects.Container | undefined;

    const open = (opening: Opening): void => {
      overlayAhead(this.scene);
      // Queued ahead of the start below, so the map is up before the ui scene reaches into it.
      this.scene.launch('map');
      this.scene.start('ui', opening);
    };

    const choose = (row: Row, option: string): void => {
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
      chosen: held,
      parts,
      hits,
    }: Choice): Phaser.GameObjects.Container => {
      for (const hit of hits) {
        answersPress(hit);
        onClick(hit, () => choose(row, option));
      }
      return this.add
        .container(0, 0, [...parts])
        .setName(`launch-${row}-${option}`)
        .setData('chosen', held)
        .setAlpha(held ? 1 : LOOK.unchosen);
    };

    const word = (key: TextKey, y: number): Phaser.GameObjects.Text =>
      addText(this, LEFT, y, text(key), PALE_STYLE).setOrigin(0, 0.5);

    const lay = (): void => {
      presses.small.down();
      root?.destroy();
      root = this.add.container(0, 0).setName('launch');
      content.add(root);

      const arrow = arrowOf(this, CATALOGUE, reached, chosen.age);
      const lastChosen = (choices: Choice[]): Choice[] => [
        ...choices.filter(({ chosen: held }) => !held),
        ...choices.filter(({ chosen: held }) => held),
      ];
      root.add([
        word('launch.age', 84),
        ...arrow.mysteries,
        ...lastChosen(arrow.choices).map(drawn),
        word('launch.region', 222),
        ...regionsOf(this, CATALOGUE, chosen.age, chosen.region).map(drawn),
        word('launch.civilization', 450),
        ...pilesOf(this, CATALOGUE, campaign.civilizations, chosen.civilization, presses).map(
          drawn,
        ),
        ...buttonsOf(this, CATALOGUE, open, () => chosen),
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
  scene: Phaser.Scene,
  catalogue: Catalogue,
  open: (opening: Opening) => void,
  choices: () => Choices,
): Phaser.GameObjects.GameObject[] {
  const middle = RIGHT - BUTTON_WIDTH / 2;
  const launchY = LAUNCH_BOTTOM - BUTTON_HEIGHT / 2;
  const launch = scene.add
    .rectangle(middle, launchY, BUTTON_WIDTH, BUTTON_HEIGHT, LOOK.accent)
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
    saved === undefined ? MYSTERY_STYLE : LABEL_STYLE,
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
      saved === undefined ? LOOK.mysteryFill : LOOK.accent,
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
