# The frame and the settle phase

**Line:** **The frame and the settle phase** — city mode and the settle phase each wear the kit's rim round the screen with a glow from it, gold and silver; the settle phase's chip is gone and a panel under the resource bar names the phase and says the cards left in hand are banished; End turn on the settle phase wears a village, and the kit's steel while the player's city stands nowhere. Done when `e2e/settle.spec.ts` proves the panel, the chip gone, the steel and the sign, and the pages below say so. The board line **The settle cards left in hand** is folded in here and left the board with this intake.

**Spec:** the mockup the picks were made on is https://claude.ai/artifact/Ueixto3BKEKuk37gdCqKEF ("Your picks, with the glow" is the settled set; "the land at the edge" scenes show the glow over terrain). The pages, each sentence written out:

- `docs/MAP-SCREEN.md` _City mode_, the sentence on how the mode shows, becomes: "The frame round the screen in city mode's gold ([`LOOK.md`](LOOK.md)) and that panel ([`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)) are how the chronicle screen shows the mode is on."
- `docs/MAP-SCREEN.md` _The settle phase_, the whole paragraph becomes: "**On the settle phase** the chronicle screen shows the centre part and nothing else, the hand holds the settle cards, the player's city has no border, and the end-turn button wears no turn and is dead until the player's city stands. The frame round the screen in the settle phase's silver ([`LOOK.md`](LOOK.md)) and the settle phase's panel ([`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)) are how the chronicle screen shows the phase is on, and both go as the turn ticks to turn 1. City mode is not entered while the player's city stands nowhere: the city key and the two readings that enter it do nothing. Entered once the player's city stands, its own frame and its panel stand, the settle phase's frame and panel down, until it is left."
- `docs/CHRONICLE-SCREEN.md`, a new section after _City mode's panel_, `## The settle phase's panel ✅`: "On the settle phase a **panel** stands where city mode's stands, under the resource bar, in the middle of the screen's top, coming out from behind the bar's foot ([`LOOK.md`](LOOK.md)), at the same place on every window. It reads two lines, centred: the phase's name, `Settle phase`, and under it what the phase's end does to the hand, `A card left in hand is banished when it ends`. It stands from the moment the chronicle screen stands on the settle phase until the turn ticks to turn 1, whatever the hand holds, and is down while city mode is on, whose panel stands in its place. It reacts to no press and raises no tooltip, and stops a press as anything standing over the map does."
- `docs/CHRONICLE-SCREEN.md` _The end-turn button_, the first paragraph becomes: "The end-turn button is a square wearing its sign and no word: an hourglass, and a village on the settle phase. The turn the chronicle stands on reads on a chip at its top right corner, the bare number, as a pile's count reads; on the settle phase it wears no chip. A left click on it ends the turn, or the settle phase, a click on its chip being a click on it. On the settle phase, while the player's city stands nowhere, a press on it does nothing and it wears the kit's steel ([`LOOK.md`](LOOK.md)). The pointer resting on it raises a tooltip over it reading `End turn`, or `End settle phase` on the settle phase, dead or live. As the turn ticks, the number that stood rises out of the chip and the next rises in, and as the settle phase ends the village gives way to the hourglass."
- `docs/INTERFACE.md`, the sentence giving the UI's order: "the settle phase's chip, " leaves it, and "city mode's panel" becomes "city mode's panel and the settle phase's".
- `docs/LOOK.md`, the cast's table, a row after the end-turn button's: `| The end-turn button on the settle phase | a village | game-icons.net, Delapouite's Village |`.
- `docs/LOOK.md` _A panel_: "city mode's panel" in the list becomes "city mode's panel, the settle phase's panel", and the paragraph's last sentence becomes: "City mode's panel and the settle phase's hang from behind the resource bar's foot, so each shows its rim along its sides and its foot."
- `docs/LOOK.md` _A button_: "a dead button keeps its own look and wears no hover. End turn wears its gold on the settle phase as on any turn." becomes: "a dead button keeps its own look and wears no hover, End turn alone excepted: while the player's city stands nowhere it wears the kit's disabled button, a steel with no gold, its sign in a greyed ink. Once the city stands End turn wears its gold on the settle phase as on any turn."
- `docs/LOOK.md` _The summary_: its last sentence, on the settle phase's chip, is deleted.
- `docs/LOOK.md`, a new paragraph after _City mode's panel_: "**The settle phase's panel** is a panel as city mode's, hung at its place with its top hidden behind the resource bar's foot, as wide as its longer line asks. The phase's name stands bold, in the charcoal's ink and the type the city's name reads in, and under it its sentence, smaller, in the paler ink, both centred."
- `docs/LOOK.md`, a new paragraph after it: "**The frame of a mode** is the kit's rim drawn round the whole screen, far wider than a panel wears it, its outer corners rounded as the kit paints them and nothing of the piece's body drawn inside it: the gold rim of the kit's banner in city mode, the silver rim of its panel on the settle phase. From the rim's inner edge a glow of the rim's colour falls inward, strongest against the rim and fading to nothing, most of it close to the rim, round the rim's inner corners as along its sides. Rim and glow lie under everything else of the UI, so the chrome cuts them where it stands, and over the map, whose tiles along the screen's edges take the glow."
- `docs/LOOK.md`, the sources' entry on DRStudios' kits: "its panel, its window's gold band, its gold and bright silver buttons with their hover and pressed looks" becomes "its panel, its banner's rim, its window's gold band, its gold and bright silver buttons with their hover and pressed looks, its disabled gold button".
- `public/assets/LICENSES.md`, _game-icons.net_: ten glyphs, "Village by Delapouite" among them, `1x1/delapouite/village` among the sources, and "Village" among Delapouite's titles in the credit. _UIForge metal kit_, after the sentence on what the game changes as it draws: "It draws the banner's rim and the panel's without the body inside them."

Player-facing entries: the panel's name is the standing `Settle phase` entry the chip reads; one new entry, `A card left in hand is banished when it ends`; `End settle phase` and the Settle kind's tooltip `Played on the settle phase only` stay as they are.

The measures, in design units, for the code and for no page:

- The rim 12 wide, so the kit's file is drawn at 12 / 11.5 units to one of its pixels (its rim is 11.5 of its pixels wide), the rim's outer edge on the screen's edge, the file's shadow margin off the screen.
- The glow from the rim's inner edge, strength 0.8 there, gone 64 further in, falling as `(1 − depth / 64) ^ 2.4`, following the rim's inner corner (23 of the file's pixels, 24 units). Gold `0xd9a441`, city mode's standing value, and silver `0xc3c7cd` for the settle phase.
- The panel: the plate's rim; 10 behind the bar's foot as city mode's; 24 from its widest line to each side; the name 18 bold in the charcoal's ink, its middle 18 under the bar's foot; the sentence 14 in `0xd4d7db`, its middle 39 under the bar's foot; the panel's foot 48 under the bar's foot.
- The steel: `btn_cta_disabled.png`, cut as the gold button, its foot strip lifted as every button's; the sign on it in `0x2a2e34`.
- The village at the share of the square every sign stands at.

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`, `public/assets/LICENSES.md`.

**Scope:** In: the frame of both modes, the settle phase's panel, the chip's removal with its place in the corner's layout, End turn's sign and steel, the three new files, the lime leaving the look. Out: every other dead button, which keeps its own look; the transition into a mode and out of it (Motion); city mode's panel, untouched; the meta screens; the launch screen's `Settle phase` reading on Continue.

Decided here:

- The two panels stay apart, two panels on one place and never up together, sharing the kit's panel and the place behind the bar's foot.
- City mode entered on the settle phase takes the settle phase's frame and panel down, so the sentence is off the screen for as long as the mode is on: accepted.
- The panel stands with an empty hand, sentence and all.
- The rim's outer corners stay rounded, a sliver of the map showing in each corner of the screen.
- The frame stays the lowest thing of the UI and see-through to a press; the glow is part of it and follows both.
- The glow tints the tiles along the screen's edges where the map runs under it: seen on the page and kept.
- The steel is worn while the player's city stands nowhere and at no other time: through a play-out and under a minimized deal window End turn keeps its gold. After a fall the city stands nowhere again, so End turn wears the steel under the ending screen's scrim: the rule as stated, no case made for it.
- The sign is the village for as long as the chronicle stands on the settle phase, on the steel and on the gold, and the hourglass from turn 1; the turns left of city mode's panel keep the hourglass.
- The lime has no use left and leaves the look; the settle phase's colour is the silver, read by its glow.
- The chip's place under the summary is freed and nothing moves into it.

**Traps:**

- Two files enter the store from the bought kit, `C:\Users\daind\OneDrive\Bureau\Bought Assets\DRStudios\uiforge-metal-ui-kit\png\2x\banner_normal.png` (920 × 380) and `btn_cta_disabled.png` (600 × 184): the store is committed and pushed before the pointer moves on `main` (`DOGMAS.md` _Stack_). `village.svg` enters `public/assets/game-icons/` in the form its neighbours have, one white path on nothing in a 512 square.
- The banner's file paints a star, a teal quarter disc and two placeholder bars on its body, and the panel's a charcoal body: everything inside the rim leaves. Whether a nine-slice can leave its middle undrawn is read in the pinned package before it is assumed (`DOGMAS.md` _Stack_, the Phaser claim rule); the sheet already retouches a file as it draws it.
- The chrome's sheet is 2048 a side and gains two files and the glow's painted pieces: its room is checked.
- The glow is computed pixel by pixel or painted by a gradient, never a painting squeezed along one axis (`docs/PHASER.md`, the canvas squeeze entry).
- The settle phase's standing is shown and hidden from one place a render calls, because the phase ends under the player on the turn's tick; the panel goes through that same door. City mode has its two doors.
- End turn's liveness is two facts, whether the screen wants it live and whether the city stands: the steel reads the second alone.
- A button's look is one of a closed set the specs' helper reads back by the kit's frame (`pieceWornOf` in `e2e/chronicle-screen.ts` throws on a frame it does not know): the steel is a new member there.
- The chip was interactive only while it stood, so no press reached the map under it; the panel stops a press the same way, and `docs/PHASER.md` holds when an object made interactive starts being hit-tested.
- The frame and the chip each had a stratum; the chip's is left with nothing on it.
- Specs name `settle-phase-frame`, `settle-phase-chip` and `city-frame`.

**Plan:**

1. The assets: the two kit files in the store, pushed; the village in `public/assets/game-icons/`; `public/assets/LICENSES.md`. Leaves the files standing, drawn by nothing.
2. `src/ui/chrome-kit.ts`, `src/ui/cast.ts`, `src/ui/look.ts`, `src/ui/text.ts`: the two rims without their body, the disabled button with its strip lifted, the glow's pieces, the village as a symbol of the cast, the silver and the greyed sign ink in the lime's place, the sentence's entry. Leaves the pieces in the sheet and the game unchanged on screen.
3. `src/ui/standing.ts`, `src/ui/corner-layout.ts` with its test, `src/ui/chronicle-scene.ts`: the frame drawn from the kit with its glow, the chip and its place gone, the settle phase's panel standing and going with the frame. Leaves both modes framed and the phase named.
4. `src/ui/chrome.ts`, `src/ui/chronicle-scene.ts`: End turn's village and steel. Leaves the button as the pages say.
5. `e2e/chronicle-screen.ts` and the specs: `settle.spec.ts` proving the line, the others following the names and the looks that moved.
6. The five pages, as written above.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/settle.spec.ts -x`, asserting on the game's content, every reading from the rules: the panel standing with its two entries as the chronicle opens, down in city mode and back when it is left, gone at turn 1; no chip; End turn wearing the steel and the village before the city stands, the gold and the village once it stands, the gold and the hourglass at turn 1. CI proves on the push: `press.spec.ts` (the chip's press test becomes the panel's), `reference.spec.ts`, `city-mode.spec.ts`, `buttons.spec.ts`, `chrome.spec.ts`, `cursor.spec.ts`, `hover.spec.ts`.
