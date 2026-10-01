# The accent is split into the meanings it paints

**Line:** **The accent is split into the meanings it paints** — `LOOK` holds no `accent`, `enemyRed`, `chosenEdge` or `aimPointEdge`, and every use that read one reads an entry named for what it means; the selection wears one white on the map, in the hand, on a deal and on the launch screen, a card's ring and its point edged dark; the city's mark is in the civilization's colour; and no other pixel moves. Doc-impact: `docs/GLOSSARY.md`, `docs/CHRONICLE-SCREEN.md`, `docs/META-SCREENS.md`.

**Spec:** `DOGMAS.md` _Code_, "A colour is named for what it means, never for its value", is the rule the line applies. The meanings, each one entry of `LOOK` (`src/ui/look.ts`); the names are suggestions, the grouping is settled:

| Entry | Value | What reads it |
| --- | --- | --- |
| `button` | `0xd9a441`, the accent's | The face of a filled button: End turn outside the settle phase, Launch, Continue while the save holds a chronicle, every button of a window, every navbar button but the one sunk. |
| `cityMode` | `0xd9a441` | City mode's frame and chip, as `settlePhase` is the settle phase's. |
| `actWaiting` | `0xd9a441` | The well of a reading whose act in city mode is waiting. |
| `civilization` | `0xd9a441` | A unit of the player's, the ring on every tile the city holds, the emblem on a card's back, and the city's mark. |
| `enemy` | `0xb4453c`, `enemyRed`'s | A unit of the enemies', a camp's mark, the glow on a unit an attack reaches. |
| `pileCount` | `0xd9a441` | The pill behind the count of a chronicle pile. |
| `selected` | `0xf2f6ff`, `lit`'s | The ring around a selected card, the point on it, the aim line's ink, the ring around the selected tile, the edge of the selected age and of the selected region on the launch screen. |
| `selectedEdge` | `0x0d1014`, `aimPointEdge`'s | The dark edge of a card's ring and of its point. |
| `thresholdInk` | `0xf2f6ff`, `lit`'s | The culture threshold's number on a tile. |

`accent`, `enemyRed`, `chosenEdge` and `aimPointEdge` leave `LOOK`. `lit` stays, for the tiles a unit's move or a card's aim reaches; `influence`, `settlePhase`, `cityRowEdge`, `deckCounts` and every other entry stay as they are. `unchosen` keeps its value and is renamed with the launch screen's wording below.

The sentences, written out.

`docs/GLOSSARY.md`, the **select** row, its definition alone; the forbidden column stays:

- "To make one thing the selection: the one held, among those offered with it."

`docs/META-SCREENS.md`, _The navbar and the bar_:

- "the others stand in the accent, and a press opens their screen." becomes "the others stand as buttons, and a press opens their screen."
- "a diamond in the accent, the word, the number." becomes "a diamond in the influence's colour, the word, the number."

`docs/META-SCREENS.md`, _The launch screen_:

- "The age is chosen on a time arrow" becomes "The age is selected on a time arrow".
- "The regions of the chosen age stand in a row" becomes "The regions of the selected age stand in a row".
- "The chosen age and the chosen region stand larger than the others and the chosen civilization's pile stands raised over them, each with a pale edge around it, and the others are dimmed; a press on another chooses it." becomes "The selected age and the selected region stand larger than the others and the selected civilization's pile stands raised over them, the age and the region edged in the selection's colour and the pile's card in the ring a selected card wears, and the others are dimmed; a press on another selects it."
- "and chooses nothing;" becomes "and selects nothing;".
- "A left click anywhere on the pile chooses its civilization." becomes "A left click anywhere on the pile selects its civilization."
- "Choosing another age keeps the region" becomes "Selecting another age keeps the region".
- "the three choices" and "Launch opens the chronicle on the choices" stay: a choice is the decision, selected is the state an option stands in.

`docs/CHRONICLE-SCREEN.md`:

- _The pointer and the tile's marks_, at the end of the paragraph opening "A tile's marks stand in three places.": "The units of the player's, the city's mark, the ring on every tile the city holds and the emblem on a card's back are in the civilization's colour."
- _The hand and the aim_, in the paragraph opening "A card aimed at a tile or at a unit says so on the card itself.", after the sentence ending "a tile or a unit.": "The ring, the point and the line are in the selection's colour, the one the map rings the selected tile in."
- _City mode_: "the map's frame drawn in the accent and that chip" becomes "the map's frame drawn in city mode's own colour and that chip".
- _The resource bar_: "each fills its well in the accent while city mode has that act waiting:" becomes "each fills its well in a colour of its own while city mode has that act waiting:"; "in the accent in place of grey;" becomes "in that colour in place of grey;"; "a reading latched and filled at once is in the accent." becomes "a reading latched and filled at once is in that colour."

No player-facing text entry changes.

**Doc-impact:** `docs/GLOSSARY.md`, `docs/CHRONICLE-SCREEN.md`, `docs/META-SCREENS.md`.

**Scope:**

In, the pixels that move, and no other moves:

- A card's ring, in the hand, on a deal and on the launch screen's pile, goes from the accent to `selected`, over a `selectedEdge` stroke one unit wider on each side of it. The ring's weight and standoff are unchanged.
- The aim point's fill goes from the accent to `selected`; its edge is unchanged in value.
- The aim line's ink goes from the accent to `selected`; its slab and the slab's edge are unchanged.
- On the launch screen the edge of the selected age and of the selected region goes from `0xd4d7db` to `selected`, at its width of today and with no dark edge. The selected civilization's pile loses its own edge, and its card wears the ring a selected card wears, at the ring's own weight and standoff, unscaled. The lift of the selected pile, the growth of the selected age and region and the half strength of the others stay.
- The city's mark goes from `built` to `civilization`, wherever a building's mark is drawn.

In, with no pixel moved: every other use of the accent reads its entry of the table; `enemyRed` becomes `enemy`, the building role of that name with it; the threshold's number reads `thresholdInk`; the selected tile's ring reads `selected`.

In, the wording: on the launch screen an option is selected, in the pages as written above and in the code — the flag an option carries, the data key a spec reads, the `LOOK` entries and the comments. The three choices keep their name wherever they mean the decision.

Corner cases, decided:

- The end-turn button on the settle phase keeps `settlePhase`; Continue with no chronicle saved keeps `greyedFill`.
- A reading latched and filled at once is in `actWaiting`, as today.
- The card back of a dry draw pile wears `civilization` worn, as it wore the accent.
- The ring is the same on an unaffordable card and on an affordable one.
- The shelter's mark stays `built`, and a camp's is `enemy`.
- The selected tile's ring on the map takes no dark edge and keeps its weight.
- An age the campaign has not reached is drawn as today.
- `CHANGELOG.md` is not touched.

Out: any new value; the Menu button, the collection screen's mode buttons, the price button; a table of colours by civilization; `cityRowEdge`.

What the reconcile chose:

- City mode's frame and chip and the settle phase's already go through one door, the colour its parameter: nothing changes there but the entry read.
- The launch screen's edge around the selected option and the ring around a selected card become one meaning, `selected`, and the pile's card goes through the card's own ring: the pile's own edge is deleted.
- The edge of a card's ring and the edge of its point are one entry, `selectedEdge`.
- A camp's mark and the city's mark stay two roles of one table, `enemy` and `civilization`, beside `built`.
- The buttons that are not filled in `button` — the Menu button, the collection screen's mode buttons, the price button — stay apart, on the entries they read today.
- The pill of a chronicle pile's count and the grey count of a deck stay apart: `pileCount` and `deckCounts`.
- The pale edge around the city section's card in a browse and in a deck stays apart: it marks the section and selects nothing.

**Traps:**

- `docs/PHASER.md` _Rendering under WebGL_ for anything stroked.
- Every card face carries its ring, hidden until the card is selected, so the dark edge is drawn once, where the ring is, and reaches the hand, the deal and the launch screen's pile together.
- The aim point's place and `AIM_POINT_REACH`, which the aim line stands on, are computed from the ring's weight and standoff, which do not change.
- A building's colour is looked up by role through `LOOK` itself (`src/ui/marks.ts`), so a role is the name of an entry.
- The accent is also named in comments that paraphrase a colour: `src/ui/map.ts` on the ring, `src/ui/menu.ts` on a window's button, `src/ui/resource-bar.ts` on the waiting readings, `src/ui/civilization-pile.ts` on the pale edge, and `src/ui/look.ts` on `chosenEdge` and `unchosen`. `DOGMAS.md` _Code_, "Comments are for traps only".
- On the launch screen `chosen` is two things in `src/ui/launch-screen.ts`: the flag of an option, which becomes selected, and the three choices as they stand, which keep their name.
- `e2e/launch.spec.ts` reads the pile's data key of today's name; `e2e/campaign.spec.ts` names a constant and a test title for the accent.

**Plan:**

1. `src/ui/look.ts`: the entries of the table stand, the four old ones are gone, and the typecheck names every use left to move.
2. The uses with no pixel moved read their entries: `src/ui/chronicle-scene.ts`, `src/ui/launch-screen.ts`, `src/ui/menu.ts`, `src/ui/navbar.ts`, `src/ui/resource-bar.ts`, `src/ui/piles.ts`, `src/ui/map.ts`, `src/ui/card-face.ts` for the card's back, `src/ui/marks.ts`, and `e2e/campaign.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/settle.spec.ts`.
3. The selection: `src/ui/card-face.ts` and `src/ui/aim-line.ts` for the ring, its edge, the point and the line; `src/ui/map.ts` for the selected tile's ring and the threshold's ink; `src/ui/launch-screen.ts` and `src/ui/civilization-pile.ts` for the launch screen, with its wording, and `e2e/launch.spec.ts` following.
4. The city's mark reads the civilization's role.
5. The three pages, as the Spec writes them.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/launch.spec.ts`. CI proves on the push: `e2e/campaign.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/settle.spec.ts`, `e2e/continue.spec.ts`, `e2e/deal.spec.ts`, `e2e/press.spec.ts`, `e2e/menu.spec.ts`, `e2e/map.spec.ts`. The visual check looks at a selected card in a hand of five and in a hand of ten, a card being aimed, a deal's ringed answer, the launch screen, and the city's mark on the map and in the infopanel.
