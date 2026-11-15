import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { neutralOf, neutralScriptOf, unitKind } from '../src/rules/catalogue';
import { anythingByHand } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import { chartedAt, inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { type Faction, unitAt } from '../src/rules/units';
import { FACTION_SIGNS_ENTRY, serialiseFactionSigns } from '../src/ui/faction-signs';
import { LOOK, multiplied } from '../src/ui/look';
import { glyphFileOf } from '../src/ui/marks';
import { text } from '../src/ui/text';
import {
  campBeside,
  capstoneClosed,
  click,
  type DiscShown,
  enemyBesideCity,
  freeGround,
  inspected,
  intoGraphics,
  neutralAge,
  neutralCampaign,
  openSaved,
  panelHeadSign,
  plantEntry,
  playerCityTile,
  reloadedOnCapstone,
  type SignsShown,
  signsOn,
  textOf,
  unitEntered,
  WARRIOR,
  watch,
} from './chronicle-screen';

const CAMPAIGN = neutralCampaign();

const ROW = 'graphics-faction-signs';

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
function signedOnes(): { chronicle: Chronicle; warrior: TileCoords; signed: Signed } {
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

/** What the tiles wear with the signs off: nothing. */
function bare({ tiles }: Signed): SignsShown[] {
  return tiles.map(() => ({ tile: undefined, unit: undefined }));
}

/** The Faction signs row, pressed, waited for until it reads that. */
async function pressedTo(page: Page, reads: 'graphics.on' | 'graphics.off'): Promise<void> {
  await click(page, ROW);
  await expect.poll(() => textOf(page, `${ROW}-label`)).toBe(text(reads));
}

test('with Faction signs on, every unit, both cities and the camp wear their faction’s sign, the city in fog darkened, and so does the infopanel’s unit card', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, warrior, signed } = signedOnes();
  await plantEntry(page, FACTION_SIGNS_ENTRY, serialiseFactionSigns(true));

  await openSaved(page, chronicle, CAMPAIGN);
  expect(await signsOn(page, signed.tiles)).toEqual(signed.worn);

  await inspected(page, warrior);
  expect(await panelHeadSign(page)).toEqual(signOf('player'));

  expect(problems).toEqual([]);
});

test('opened with nothing kept, nothing wears a sign; a press on the row over the chronicle screen puts every sign on at once, the infopanel’s card among them, and a reload finds it kept', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, warrior, signed } = signedOnes();

  await openSaved(page, chronicle, CAMPAIGN);
  expect(await signsOn(page, signed.tiles)).toEqual(bare(signed));
  await inspected(page, warrior);
  expect(await panelHeadSign(page)).toBeUndefined();

  await intoGraphics(page);
  expect(await textOf(page, `${ROW}-label`)).toBe(text('graphics.off'));
  await pressedTo(page, 'graphics.on');
  expect(await signsOn(page, signed.tiles)).toEqual(signed.worn);
  expect(await panelHeadSign(page)).toEqual(signOf('player'));

  await reloadedOnCapstone(page);
  await capstoneClosed(page);
  expect(await signsOn(page, signed.tiles)).toEqual(signed.worn);
  await intoGraphics(page);
  expect(await textOf(page, `${ROW}-label`)).toBe(text('graphics.on'));

  expect(problems).toEqual([]);
});
