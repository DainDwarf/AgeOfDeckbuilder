import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { built } from '../src/rules/cards';
import { ageOf, neutralOf, neutralScriptOf, unitKind } from '../src/rules/catalogue';
import { anythingByHand } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { chartedAt, inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { type Faction, unitAt } from '../src/rules/units';
import { glyphFileOf } from '../src/ui/cast';
import { LOOK, multiplied } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  campaignThenChronicle,
  campBeside,
  capstoneClosed,
  click,
  type DiscShown,
  enemyBesideCity,
  freeGround,
  inspected,
  neutralAge,
  neutralCampaign,
  onScreen,
  openSaved,
  panelFace,
  pieceOnScreen,
  pieceWorn,
  playerCityTile,
  pressContinue,
  readings,
  type SignsShown,
  signsOn,
  standing,
  tooltipLines,
  tooltipUp,
  unitEntered,
  WARRIOR,
  watch,
} from './chronicle-screen';

const CAMPAIGN = neutralCampaign();

const BUTTON = 'faction-signs-button';

/** The colour each faction is known by, and the ink its sign reads in on it. */
const COLOURS: Record<Faction, { readonly disc: number; readonly ink: number }> = {
  player: { disc: LOOK.civilization, ink: LOOK.civilizationSignInk },
  neutral: { disc: LOOK.neutral, ink: LOOK.neutralSignInk },
  enemy: { disc: LOOK.enemy, ink: LOOK.enemySignInk },
};

/** The faction's sign, every colour of it multiplied by the shade. */
function signOf(faction: Faction, shade = 0xffffff): DiscShown {
  return {
    disc: multiplied(COLOURS[faction].disc, shade),
    rim: multiplied(LOOK.mapOutline, shade),
    glyph: glyphFileOf(faction),
    ink: multiplied(COLOURS[faction].ink, shade),
  };
}

/** The tiles the spec reads, and what each wears with the signs on. */
type Signed = { readonly tiles: TileCoords[]; readonly worn: SignsShown[] };

/**
 * Seed 1's turn 1 reaching the neutral: a unit of the neutral's on a camp beside the city, an enemy and
 * a warrior of the player's beside it, and the neutral's city charted out of sight, in fog; the
 * warrior's tile, and what the signs on wear.
 */
function signedOnes(): {
  chronicle: Chronicle;
  warrior: TileCoords;
  city: TileCoords;
  signed: Signed;
} {
  const neutral = neutralOf(CATALOGUE, neutralAge());
  const kind = neutral.ratio.find((row) => !unitKind(CATALOGUE, row.kind).worker)?.kind;
  if (kind === undefined) throw new Error('the neutral fights with no kind');
  const script = neutralScriptOf(CATALOGUE, neutral, kind);
  const { chronicle: camped, camp } = campBeside(
    (tile) => ({ type: kind, faction: 'neutral', script, tile }),
    CAMPAIGN,
  );
  const beset = enemyBesideCity(camped);
  if (beset === undefined) throw new Error('seed 1 leaves no ground beside its city for an enemy');
  const [warrior] = freeGround(beset.chronicle, WARRIOR, 1);
  if (warrior === undefined)
    throw new Error('seed 1 leaves no ground beside its city for a warrior');
  const manned = unitEntered(beset.chronicle, { type: WARRIOR, faction: 'player', tile: warrior });
  const city = manned.neutral?.city;
  if (city === undefined) throw new Error('seed 1 opens with no neutral');
  if (inSight(CATALOGUE, manned).has(tileKey(city)))
    throw new Error('seed 1 sees the neutral’s city');
  const chronicle = chartedAt(CATALOGUE, manned, city);

  const standing = unitAt(chronicle.units, warrior);
  if (standing === undefined || !anythingByHand(CATALOGUE, chronicle, standing, false)) {
    throw new Error('the warrior beside the city has nothing to do: it stands dimmed');
  }
  const kept = chronicle.snapshots.find((snapshot) => tileKey(snapshot) === tileKey(city))?.unit;
  if (kept === undefined) throw new Error('the neutral’s city keeps no unit in fog');
  const own = playerCityTile(chronicle);
  const enemy = beset.enemy.tile;
  return {
    chronicle,
    warrior,
    city,
    signed: {
      tiles: [own, warrior, enemy, camp, city],
      worn: [
        { tile: signOf('player'), unit: undefined },
        { tile: undefined, unit: signOf('player') },
        { tile: undefined, unit: signOf('enemy') },
        { tile: signOf('enemy'), unit: signOf('neutral') },
        { tile: signOf('neutral', LOOK.fog), unit: signOf(kept.faction, LOOK.fog) },
      ],
    },
  };
}

/** The faction sign the unit in the window of the infopanel's card wears, and nothing where it wears none. */
async function panelSign(page: Page): Promise<DiscShown | undefined> {
  return (await panelFace(page)).windowUnit?.sign;
}

/** What the tiles wear with the signs hidden: nothing. */
function bare({ tiles }: Signed): SignsShown[] {
  return tiles.map(() => ({ tile: undefined, unit: undefined }));
}

/** Whether the button stands sunk in its well. */
async function sunk(page: Page): Promise<boolean> {
  return (await pieceWorn(page, BUTTON)).piece === 'tab';
}

/** The button pressed, waited for until the tiles wear that. */
async function pressedTo(page: Page, tiles: TileCoords[], worn: SignsShown[]): Promise<void> {
  await click(page, BUTTON);
  await expect.poll(() => signsOn(page, tiles)).toEqual(worn);
}

test('with the signs shown by a press on the button, every unit, both cities and the camp wear their faction’s sign, the city in fog darkened, and so does the infopanel’s unit card', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, warrior, signed } = signedOnes();

  await openSaved(page, chronicle, CAMPAIGN);
  await pressedTo(page, signed.tiles, signed.worn);

  await inspected(page, warrior);
  expect(await panelSign(page)).toEqual(signOf('player'));

  expect(problems).toEqual([]);
});

test('a chronicle screen opens with nothing wearing a sign and the button standing left of the Icons button, naming itself on the rest under it; a press sinks it and puts every sign on at once, the infopanel’s card among them, a second takes them off and stands it again, and opened again by Continue with them shown, the chronicle screen shows none', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, warrior, signed } = signedOnes();

  await openSaved(page, chronicle, CAMPAIGN);
  expect(await signsOn(page, signed.tiles)).toEqual(bare(signed));
  expect(await sunk(page)).toBe(false);
  const button = await pieceOnScreen(page, BUTTON);
  const icons = await pieceOnScreen(page, 'icons-button');
  expect(button.x + button.width).toBeLessThan(icons.x);
  expect(button.y + button.height / 2).toBeCloseTo(icons.y + icons.height / 2, 1);

  const at = await onScreen(page, BUTTON);
  await page.mouse.move(at.x, at.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipLines(page, 'tooltip-ui')).toEqual([
    { text: text('button.faction-signs'), bold: false },
  ]);
  const bubble = (await readings(page, ['tooltip-ui']))('tooltip-ui').boundsOnScreen;
  expect(bubble.y).toBeGreaterThan(button.y + button.height);

  await inspected(page, warrior);
  expect(await panelSign(page)).toBeUndefined();

  await pressedTo(page, signed.tiles, signed.worn);
  expect(await sunk(page)).toBe(true);
  expect(await panelSign(page)).toEqual(signOf('player'));

  await pressedTo(page, signed.tiles, bare(signed));
  expect(await sunk(page)).toBe(false);
  expect(await panelSign(page)).toBeUndefined();

  await pressedTo(page, signed.tiles, signed.worn);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await campaignThenChronicle(page);
  await pressContinue(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await capstoneClosed(page);
  expect(await signsOn(page, signed.tiles)).toEqual(bare(signed));
  expect(await sunk(page)).toBe(false);

  expect(problems).toEqual([]);
});

test('the neutral’s city taken by the enemies while its tile is in fog keeps the neutral’s sign as last seen, the signs shown by a press on the button', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city, signed } = signedOnes();
  const { building: camp } = ageOf(CATALOGUE, chronicle.age).camp;
  const fallen = built(CATALOGUE, chronicle, city, camp, 'enemies').chronicle;
  expect(fallen.neutral).toBeUndefined();
  expect(tileAt(fallen.tiles, city)?.building).toBe(camp);
  expect(inSight(CATALOGUE, fallen).has(tileKey(city))).toBe(false);

  await openSaved(page, fallen, CAMPAIGN);
  await pressedTo(page, [city], [signed.worn[signed.tiles.indexOf(city)]]);

  expect(problems).toEqual([]);
});
