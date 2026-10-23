# Military off the Hearth, onto flint

**Line:** Military off the Hearth, onto flint — the Hearth gives nothing on top of its terrain and flint gives military in place of production, the Village keeping its military and culture; measured on the starting deck in the Nomadic Age with the camps, the neutral and the events off, before the edit and after, the builder and the warlord over 20 seeds each, the measurement reported at the hand-back; `BALANCE.md` loses its entry. Doc-impact: `docs/ages/NOMADIC.md`.

**Spec:** `docs/ages/NOMADIC.md`, three edits:

- _The settle_, the two sentences "The player's city keeps the terrain it lands on, and its building, the **hearth**, gives **military** on top of that terrain and nothing else. Nothing on the map yields military, so the player's city is where warriors come from, and the culture the border grows by is the sites' alone, so the border stays a few tiles." become: "The player's city keeps the terrain it lands on, and its building, the **hearth**, gives nothing on top of that terrain. In this age nothing but flint yields military, so the flint hills are where warriors come from, and the culture the border grows by is the sites' alone, so the border stays a few tiles."
- _The land_, the table's hills row becomes `| hills | production | **flint** | military |`.
- _The capstone_, "production stored off the flint and the forest" becomes "production stored off the hills and the forest".

`docs/ages/STONE.md` stands: the Village gives military and culture, and the age's land is the Nomadic one "in the same shares". No player-facing text changes: the Hearth and the flint have names and no sentence of their own.

**Doc-impact:** `docs/ages/NOMADIC.md`.

**Scope:**

- In: the hearth's yield table entry empty; the flint feature's yield military in place of production; the three page edits; the entry **Military off the Hearth, onto flint** deleted from `workflow/BALANCE.md`'s Nomadic section; the measurement below, run and reported, not committed.
- Out: the Village, which keeps military and culture; flint's share, which stays; any floor or second source of military; the fixture's `PH_Flint`, which is the tests' own content and stays production.
- Decided here: flint is one feature across both ages, so its military reaches the Stone Age's regions as a second source beside the Village's, which is meant. A city settled on a flint hill gets the flint's military each turn, the city's tile yielding its feature as any tile does; nothing forbids the settle on a featured tile and nothing is added for it. A chronicle whose band never reaches flint has no military: no Warrior, no second Scout, no March, and that is accepted as the age's lesson; both raiding answers have a free sibling.
- Reconcile: nothing new is built, so nothing was found to merge. A building giving nothing is what the camp and the shelter are; a feature giving a resource is what every feature is.

**Traps:**

- The features table sits in the Nomadic slice's `brings`, the half every age shares: the one edit changes what the Stone Age's temperate and archipelago regions deal too. Intended; do not fork a Stone flint.
- Over 200 Nomadic temperate maps, flint is 3 to 7 tiles a map, the nearest at a median of 4 from the centre, none within 5 on 61 maps: a persona's military is scarce by design, and a cell where the warlord fields few units is the reading, not a defect.
- `--off neutral` on the Nomadic age, which has no neutral, is harmless: the switch empties the region's neutral band, already empty.
- No measurement is committed and none runs on CI: the CSVs go to the scratchpad.

**Plan:**

1. The measurement before: on the tree as it stands, the two cells below with `--out` into the scratchpad, `before-builder.csv` and `before-warlord.csv`.
2. `src/content/nomadic.ts`: the hearth's building entry yields nothing; the flint feature yields military, one, in place of its production. `npm run check`, `npm test`.
3. `docs/ages/NOMADIC.md`: the three edits of the Spec, verbatim. `workflow/BALANCE.md`: the Nomadic entry deleted. `npm run lint`.
4. The measurement after: the same two cells, `after-builder.csv` and `after-warlord.csv`. Read the four files with DuckDB as the sim skill does and report, per persona, before against after: the military stock at turns 5, 10, 15 and 20 and at the ending (median and range over the chronicles standing on that turn), the Warrior, Scout and March plays per chronicle, the endings and their turns. Numbers, no diagnosis.
5. The board line deleted, the dossier deleted, one commit.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The cells, run on the tree before step 2 and again after step 3, the persona and the file name the only difference between the four runs:
  - `npm run sim -- --age nomadic --region temperate --persona builder --off camps,neutral,events --seeds 20 --every 5 --out <scratchpad>/before-builder.csv`
  - `npm run sim -- --age nomadic --region temperate --persona warlord --off camps,neutral,events --seeds 20 --every 5 --out <scratchpad>/before-warlord.csv`
- Proof spec: none. The line reaches the screen only through yields every spec reads from the rules; no spec asserts the Hearth's military or a flint's production.
- CI proves the whole suite on the push; the specs that open a Nomadic chronicle plant their units through the rules and read their yields from the catalogue, so none is expected to move.
