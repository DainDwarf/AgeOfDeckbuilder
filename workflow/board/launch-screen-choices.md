# The launch screen draws its choices

**Line:** The launch screen draws its choices — the age is chosen on a time arrow, the region among clusters of hexagons, the civilization among piles of cards, the chosen one larger and the others dimmed; the screen opens on the furthest age reached; Continue always stands, greyed while the save holds no chronicle; `npm run check`, `npm test`, `npm run lint` and `e2e/continue.spec.ts` pass, and the `visual-check` finds nothing broken.

**Mockup:** [`launch-screen-mockup.html`](launch-screen-mockup.html), beside this file, opened in a browser. The user approved it with every control on its recommended value: layout Bands, the chosen one larger with the others dimmed, a region as seven hexagons, an age not reached as a mystery on the arrow. It is the reference for the look; where it and this dossier disagree, the dossier wins. It dies with this line.

**Spec:** `docs/INTERFACE.md`, the section _The launch screen_, which becomes ✅ and is replaced whole by:

> ## The launch screen ✅
>
> **Chronicle** opens the **launch screen**, which wears the navbar and the bar. The room they leave holds the three choices on the page's ground, one band each under its word, top down — **Age**, **Region**, **Civilization** — and no title over them.
>
> The age is chosen on a **time arrow** across the room's width, pointing right: one segment per age the game holds, in the order of history, each in the colour of its ground on the tree and reading the age's name. An age the campaign has not reached is a mystery: greyed, reading ??? alone, and answering no press. The regions of the chosen age stand in a row, each a cluster of seven hexagons, one in the middle and six around it, its name under it: the middle one is in the colour of the terrain the centre's biome grows from, and the six around are handed to the biomes the region deals, one to each and the rest by their shares, each in the colour of the terrain its biome grows from, the hexagons of one biome side by side. The civilizations the campaign owns stand in a row, each a pile of cards under its city section's card, face up, the civilization's name under the pile and under that the count of its cards and of its settle cards.
>
> The chosen one of each row stands larger than the others, a pale edge around it, and the others are dimmed; a press on another chooses it. The screen opens on the furthest age the campaign has reached, on the first region and on the first civilization. Choosing another age keeps the region where that age holds one of its name, and takes the age's first region where it does not.
>
> **Continue** and **Launch** stand at the room's bottom right, Continue over Launch. Launch opens the chronicle on the choices, on a seed drawn fresh at every launch. While the save holds a chronicle, Continue reads where that chronicle stands — the settle phase, or its turn — and under that the achievements it has reached, and opens it where it stood; Launch then ends that chronicle, which pays nothing. While the save holds none, Continue stands greyed as a mystery does, reads its word alone and answers no press. The screen hears no key but the back key.
>
> The address is the developer's door and the test suite's: one that names `continue` opens the chronicle the save holds straight, and the boot fails where the save holds none; any other address boots on the campaign screen, whatever else it names; and the chronicle screen writes nothing into the address.

`docs/META.md`, _The loop_: the sentence "The launch screen offers the three choices of a launch and **Launch** under them, which opens the chronicle on its settle phase, and while a chronicle is in progress **Continue**, reading the turn it stands on and the achievements it has reached, which opens it where it stood." becomes "The launch screen offers the three choices of a launch, **Launch**, which opens the chronicle on its settle phase, and **Continue**, which while a chronicle is in progress reads the turn it stands on and the achievements it has reached, and opens it where it stood."

Player-facing text, every entry written out:

- `region.temperate`: `Temperate`
- `civilization.nomadic`: `Nomadic`
- `launch.deck`: `Cards: {cards} · Settle cards: {settle}` — the mockup's "17 cards · 2 settle cards" put a count in the subject, which the text rules forbid.
- `launch.mystery` reads `???` only where the tree's own entry for a mystery cannot be read from the launch screen; one entry serves both where it can.
- `launch.title` is deleted. `launch.age`, `launch.region`, `launch.civilization`, `launch.button`, `launch.continue`, `launch.turn`, `launch.settle-phase` and `launch.reached` stand as they are.

**Doc-impact:** `docs/INTERFACE.md`, `docs/META.md`.

**Scope:**

- In: the three bands, the chosen one's look, the opening choices, the region kept across an age change, the greyed Continue, the names of regions and civilizations as text entries, the title gone.
- In: the rule that says which ages a campaign has reached — the first age, and every age a technology the campaign has unlocked unlocks — as a rule of `src/rules/`, proven on the fixture's ages.
- Out: the city section's card on a pile answers no press and no rest in this line; the line after this one gives it the right click and the rest on its names.
- Out: a region reading what it pays. The warning Launch raises over a chronicle with achievements reached is the Stone Age rung's.
- Out: more ages, regions or civilizations than the room holds. Four ages, five regions and three civilizations fit at the mockup's measures; nothing scrolls, wraps or shrinks.
- Out: remembering the last launch's choices.
- Decided: the mystery on the arrow cannot show on the game's content until a second age ships, so no spec proves it; the reached-ages rule is proven by its Vitest on the fixture, and the user knows the mystery is first seen with the Stone Age.
- Decided: the chosen one spends no accent. Its edge is pale, the others dim; the accent stays on Continue and Launch, which are buttons.
- Decided: the six hexagons around. Each biome the region names in its shares gets one; the hexagons left go to the biomes by share, the largest share first, a tie going to the biome named first; a region naming more than six biomes draws its six largest. The Temperate region therefore reads three of land, one of sea, one of mountain, one of woodland, around a middle of the heartland's terrain.
- Decided: the counts under a pile are the campaign's civilization as it stands, its deck's cards and its settle section's cards, the city section's card counted in neither.
- Decided: the pointer over the greyed Continue and over a mystery is the arrow; over a choice it is what it is over a choice today.

**Measures**, in the design space of 1280 by 720, from the mockup; the room is x 240 to 1280, y 48 to 720, the margin 24:

- The band words: 18 bold, pale ink, left edge x 264, centred on y 84, 222 and 450.
- The arrow: x 264 to 1256, top y 110, 64 tall; every segment the same width; the point and each notch 0.4 of the height deep; the age's name 18 bold in pale ink, a mystery's ??? in the mystery's ink on the mystery's fill; the chosen segment 14% of the height taller above and below.
- The regions: clusters centred on y 310, the first on x 334, 170 apart; each hexagon pointy-topped as the map's, radius 21, the six around at the distance that makes them touch; the chosen cluster 1.15 times the size; the name 18 bold, pale ink, centred under the cluster.
- The piles: the first at x 294, top y 476, 190 apart; three card backs under the face, each 5 further right and down; the chosen pile's top card 10 higher; the name 18 bold then the counts 14 regular under the pile.
- The others rest at half strength.
- The buttons: 300 wide, right edge x 1256, Launch 44 tall with its bottom on y 696, Continue 24 above it, 44 tall and taller by its reading lines while a chronicle stands.

**Traps:**

- A card has exactly one renderer (`DOGMAS.md` _Stack_, "All UI is Phaser"): the city section's card on a pile is the game's card face, never a drawing of one. Its size is the renderer's own nearest the mockup's 100 by 140; the pile's backs take the face's size.
- Every colour comes through `src/ui/look.ts`, a role per use: the grounds are `ground`, a mystery is `mysteryFill` and `mysteryInk`, the terrains are `terrain`. The strength the others rest at is a strength something rests at, so it is a `LOOK` entry.
- A code-drawn placeholder is a flat polygon (`DOGMAS.md` _Design principles_): the arrow's segments and the hexagons are one fill and one outline each, no gradient, no wash between two ages.
- `docs/PHASER.md`: a polygon's corner list is read in min-(0, 0) space (`corners` in `src/ui/design-space.ts`), and a new object accepts a press only at the next frame.
- The specs press the screen by name: `launch-button`, `launch-continue`, `launch-continue-label`, `launch-continue-line-<n>`, and `launch-<row>-<option>` with its `chosen` data, which `e2e/menu.spec.ts` reads. The names and the data stand through the redraw. The greyed Continue stands under `launch-continue`, so the three specs that assert it is not standing change with this line.
- The campaign's civilizations are keyed by name and the catalogue's coherence test reads every id through the lookups the screen uses: the region's name and the civilization's name join it, or a name missing throws at the first draw.
- The layout is a pure function where it computes — which ages are mysteries, how the six hexagons are handed out, which region an age change keeps — and is tested by Vitest on fixture content, never on the game's numbers (`DOGMAS.md` _Testing_).
- Comments are for traps only.

**Plan:**

1. The rules: the ages a campaign has reached, with its test on the fixture. Leaves `npm test` passing and nothing drawn.
2. The text table: the three entries added, `launch.title` deleted, the coherence test reading the new names. Leaves `npm test` passing.
3. The screen's pure half: the opening choices, the region kept across an age change, the six hexagons handed out, each with its Vitest on fixture content.
4. The screen redrawn in the bands, top down: the arrow, the regions, the piles, then Continue and Launch, the chosen one's look across the three rows. Leaves the screen as the mockup shows it.
5. The specs: `e2e/continue.spec.ts` "with no save the page stands with no Continue" becomes "with no save Continue stands greyed, reads its word alone, and a press on it opens nothing", and the second test there asserts the same in place of `standing … false`; `e2e/ending.spec.ts` asserts Continue reads its word alone after an ending in place of not standing.
6. The docs: `docs/INTERFACE.md` and `docs/META.md` as the Spec writes them.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/continue.spec.ts`. Then the `visual-check` on the launch screen with and without a chronicle in the save. CI proves on the push: `e2e/boot.spec.ts`, `e2e/menu.spec.ts`, `e2e/campaign.spec.ts`, `e2e/ending.spec.ts`.
