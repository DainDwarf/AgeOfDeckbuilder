# The extend button

**Line:** **The extend button** — in city mode culture's reading on the panel is a button that selects the claim, which is being aimed from then: the claim marks stand only while it is aimed, a left click on a marked tile claims it, a click on any other tile lets it go, and a tile the city may claim, selected with the claim not aimed, wears nothing and acts on nothing; `e2e/city-mode.spec.ts` proves it on screen and the four pages say so. Doc-impact: `docs/MAP-SCREEN.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`.

Settled with the user on 2026-11-26 on a pressable mockup of the real screen, https://claude.ai/artifact/GVKV3a4jqHe6U2bUdN5T3s, with the picks "Aims the claim", "Culture's whole reading", "After a claim lands: the button comes up", "Culture on the resource bar: enters with the button down", "Under the pointer while aimed: the tile wears what the claim costs", then a reconcile of six points taken whole. The word is `Claim`, the glossary's; no word stands on the button. Where the mockup and this file differ, this file is right: the mockup kept a tile selected under the press, read the turns left pale on the gold, and cut the cost out of a shot of the tile selected.

**Spec:** the sentences below are the spec, written out; a sentence not listed stands as it is.

`docs/MAP-SCREEN.md`, _City mode_.

- The first paragraph becomes: "In **city mode** a left click on a tile selects the tile, whoever stands on it and never the unit, and lights no unit: no press there moves one or attacks with one. A left click on the selection is the player's city's act on a tile it holds — one idle population assigned to it, or the one standing there unassigned, by turns, its own tile among the tiles it works; the tile stays selected after either. A drag from a tile the population stands on onto a tile the player's city holds and nobody stands on takes it off the one and puts it on the other in that one gesture, the tile it lands on selected; let go anywhere else, the population comes home and nothing changes. An act the rules refuse plays nothing and says why over the tile, in the note a refused card raises. A click on a tile the player's city does not hold selects it like any other and acts on nothing, a tile it may claim among them."
- A new paragraph after it: "**A claim is aimed.** A left click on culture's reading of city mode's panel ([`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)) selects the claim, which is being aimed from that moment at the tiles the player's city may claim: the map marks them, and the reading stands sunk. A left click on a marked tile claims it: the claim is let go as it lands, and the tile claimed is selected. A claim the player's city cannot pay for plays nothing and says what it costs over the tile, in the note a refused card raises, and the claim stays aimed. A click on any other tile lets the claim go and selects that tile, as a unit being aimed is let go, and a second click on the reading lets it go too. While the pointer is on a marked tile, that tile wears the culture threshold in its middle — a minus, the number and culture's glyph. It is the pointer's reading as any other: it stands under a pointer that never moved, goes when the pointer leaves the tile, and goes with the aim."
- In the second paragraph, after "…or by the Close button of city mode's panel;" the entering sentence gains its own: "Pressing culture on the resource bar enters it with the claim being aimed; every other way in enters it with nothing selected." The rest of the paragraph stands; leaving the mode drops the selection, the claim among what a selection is.
- The third paragraph opens: "The map marks the tiles the player's city may claim while the claim is being aimed, and for as long as the mode is on every tile inside the border shows what it yields — every resource, whatever the yield overlay is showing, the dark of a tile nobody is assigned to no exception, each on the patch the overlay lays under a tile's glyphs." The rest stands.

`docs/CHRONICLE-SCREEN.md`.

- _City mode's panel_, the last paragraph becomes two: "The pointer resting on food's reading or on culture's raises the tooltip the resource bar's reading raises, and on the idle count the idle reading's; resting on the assigned count, on the units' count or on the turns left it raises that one's own, a name over a sentence." and "**Culture's reading is the button the claim is aimed by** ([`MAP-SCREEN.md`](MAP-SCREEN.md)), its bar and its turns left with it: a left click on it selects the claim, and a second lets it go, short of the culture threshold as past it. It stands on a button's gold while the stock covers the culture threshold and a tile the player's city may claim stands, as culture's reading on the resource bar does, and sunk in its well for as long as the claim is being aimed, on the gold or not. The panel reacts to no other press, and stops one as anything standing over the map does."
- _The deal window_, the minimized paragraph: "A left click selects nothing and acts on nothing, on the map or on a card of the hand" becomes "A left click selects nothing and acts on nothing, on the map, on a card of the hand or on culture's reading of city mode's panel".

`docs/INTERFACE.md`, _The presses_.

- "The selection is one thing, a tile, a unit or a card, and the left click makes it." becomes "The selection is one thing, a tile, a unit, a card or the player's city's claim, and the left click makes it."
- The not-allowed sign's bullet ends: "…a drawn tile its aim does not admit, or every drawn tile where that card is unaffordable, and, while the claim is being aimed, a marked tile where the player's city cannot pay for it;"
- The command signs' bullet ends: "…the **aim sign** on a tile, a unit or a card of the hand the card being aimed admits, and on a tile the claim being aimed marks;"
- The paragraph after the bullets ends: "A click on a tile the unit being aimed neither lights nor marks is no refusal, so that tile wears the arrow, and so does a tile the claim being aimed does not mark."
- "**Select** is the tile or the unit the map rings, or the card lifted out of the hand;" becomes "**Select** is the tile or the unit the map rings, the card lifted out of the hand, or the claim its reading stands sunk for;"

`docs/LOOK.md`.

- _The claim marks_ opens "While the claim is being aimed the tiles the player's city may claim wear a ghost of its border: …" in place of "In city mode the tiles…", and its last sentence becomes "The culture threshold the marked tile under the pointer wears stands on a plate: the feature disc's dark plate with its pale rim, a pill round the number and culture's glyph."
- _The yield glyphs_: the last sentence becomes "A tile that shows no glyph wears no patch."; the culture threshold stands over a tile's glyphs and hides none, as the plates of the yield an aimed card would give do.
- _A well_: "…the latched Hex grid button and the sunk Minimize button sit in one." becomes "…the latched Hex grid button, the sunk Minimize button and culture's reading of city mode's panel while the claim is being aimed sit in one." and the next sentence becomes "A reading whose act is waiting in city mode stands on a button's gold instead, and so does culture's reading of city mode's panel while a claim can be paid and the claim is not being aimed."
- _City mode's panel_ gains, after the turns left's sentence: "Culture's reading stands on the gold or in its well as a reading of the resource bar does, the piece reaching round the whole reading, its bar and its turns left, a little past each; on the gold its turns left and their hourglass read in the dark ink a button's word reads in."

Player-facing text: none new. Culture's tooltip on the panel stays the resource bar's reading's, and a refused claim's note stays today's.

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`.

**Scope:**

In: the claim as a selection of the chronicle screen; the claim marks following it; the cost under the pointer; culture's reading of the panel as its button, on the gold and in its well; culture on the resource bar entering with the claim aimed; the pointer's signs; the spec; the four pages.

Out: the rules. A claim's command, what it costs and when it is refused stand as they are, and the simulator's personas claim as before; only what the screen asks of the rules on a click changes. No key aims the claim, and Controls lists none. The claim marks' look, the plate's look and the note's words do not change. The resource bar's own readings do not change look.

Decided here:

- Pressing the reading is a new selection: it drops the tile or the card selected before as any new selection does, the summary goes down with the tile, and nothing is selected but the claim.
- Whatever lets go of a unit being aimed lets go of the claim: a left click on a card of the hand, on End turn, on a pile, on the ledger's or the log's tab, on a line of the log; the back key; leaving city mode. The right click inspects and the claim stays aimed.
- A drag of one population that lands selects the tile it lands on, so it lets the claim go; one that comes home changes nothing, the claim still aimed.
- A claim that lands lets the claim go whether or not the city could pay for another; the reading then stands on the gold again or on the charcoal, by the stock.
- The reading reacts when no tile may be claimed at all: it sinks and the map marks nothing.
- Culture on the resource bar enters with the claim aimed whether its act waits or not. Once city mode is on, that reading is dead as it is today.
- The reading wears no hover look and no pressed look, as a reading of the resource bar wears none; the pointer on it is the pointing hand, and resting there still raises culture's tooltip. A click on its turns left is a click on the reading, and the turns left's own tooltip stands.
- Under a minimized deal window the reading is dead and the pointer on it is the arrow.
- On the settle phase, once the city stands, the reading works as on any turn.
- After a refused claim the tile under the pointer goes on wearing the cost under the note.
- `e2e/city-mode.spec.ts` and `e2e/yields.spec.ts` hold tests of what this line takes away — the marks standing on entering the mode, the cost on a selected tile, the claim by a second click, the tile wearing the cost showing none of its glyphs. Each is rewritten to the rule above, the same promise at its new place or its opposite where the design turned; none is dropped without its successor.

The reconcile, each likeness and what was chosen:

1. The claim's aim goes through a unit's as it is: nothing but its cost is refused, a click on any other tile lets it go and selects that tile. A card's aim, which refuses a tile it does not admit and stays, is not the model.
2. No line stands over the hand for the claim: a unit being aimed raises none, and the card's line stays the card's.
3. The reading on the panel goes through the resource bar's gold and well as they are. The meant difference is the order: on the bar the gold wins over the well, on the panel the well wins while the claim is aimed.
4. Culture on the resource bar and culture on the panel stay apart once city mode is on: the bar's is the way in, the panel's is the button.
5. The cost under the pointer and the plates of the yield an aimed card would give become one in how they come and go and in what they hide: under the pointer, gone as it leaves the tile, over the tile's yield glyphs. The cost keeps its own plate and its own sentence.
6. The pointer's signs go through the card's: the aim sign on a marked tile, the not-allowed sign there while the city cannot pay, the arrow on every other tile as under a unit being aimed.

**Traps:**

- `docs/PHASER.md`, _What the pointer is over_ and _Press, drag and release_, before touching what the reading reacts to: it is a zone that raises a tooltip today and becomes one that takes a left click too, and a thing coming live under a pointer that holds still is hovered as one the pointer moved onto.
- The reading's gold, its well, the inks on each and how far a reading is pressed down live with the resource bar's readings in `src/ui/resource-bar.ts`; the panel reads them through that door and copies none of it. The gold is asked of the rules by the same question the bar asks.
- The panel's culture reading is two zones today, the reading's and the turns left's, each raising its own tooltip; the button is both.
- The comment over the rules' city-mode click in `src/rules/city.ts` says the chronicle screen answers that click by it and nothing else. After this line the screen's second click on a selected tile acts on held tiles alone and the claim comes from the aim; that comment is re-shaved to what is true, or the question the screen asks is reshaped, the implementer's call.
- City mode's marks are painted together today, the assigned tiles' and the claim marks', and city mode's dark with them, by one switch on the map. Only the claim marks follow the aim.
- The map hides a tile's yield glyphs while it wears the culture threshold; that goes.
- The scene's one door for letting go of what is being aimed is where the claim is let go; the selection's one door is where it is made. A claim aimed is neither a tile nor a unit to the summary, the infopanel or the ring.
- `src/ui/cursor.ts` holds the pointer's pictures; the one over a tile of the map is said where an aimed card's and an aimed unit's are, and a marked tile's is read off the same refusal the click would raise.
- Specs enter city mode by the city key and then read the marks or the cost in `e2e/city-mode.spec.ts`, `e2e/yields.spec.ts`, `e2e/map-order.spec.ts`, `e2e/map.spec.ts`, `e2e/settle.spec.ts`, `e2e/summary.spec.ts` and `e2e/unit-ring.spec.ts`; each use is read against the new rule, most only enter the mode.
- The mockup's measures, for a start and no more: the gold or the well reaches seven units past the cell's two ends and one over and under the panel's second line, and the reading is pressed down as a reading of the bar is.

**Plan:**

1. `src/ui/chronicle-scene.ts`, `src/ui/map.ts` and what they call: the claim as a selection, aimed; the claim marks standing only while it is; a click on a marked tile claiming, on any other letting go; a selected tile the city may claim wearing nothing and acting on nothing. Leaves the claim reachable by nothing on screen until the next step.
2. `src/ui/city-panel.ts`, `src/ui/city-panel-layout.ts`, `src/ui/resource-bar.ts`: culture's reading of the panel pressable, on the gold and in its well through the bar's own pieces; culture on the bar entering with the claim aimed. Leaves the whole press rule on screen.
3. The cost under the pointer on a marked tile, over the glyphs; the pointer's signs. Leaves the look settled.
4. `e2e/city-mode.spec.ts`, `e2e/yields.spec.ts` and `e2e/chronicle-screen.ts`: the tests of what changed rewritten, and tests of the aim, of the reading's three stands, of the entry by culture, of the cost under the pointer and of the signs.
5. The four pages, the sentences above; the board line deleted with this file.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `npx playwright test e2e/city-mode.spec.ts -x`. CI proves on the push: `e2e/yields.spec.ts`, `e2e/map-order.spec.ts`, `e2e/map.spec.ts`, `e2e/settle.spec.ts`, `e2e/summary.spec.ts`, `e2e/unit-ring.spec.ts`, and `e2e/hover.spec.ts`, `e2e/buttons.spec.ts` and `e2e/minimize.spec.ts`, which walk the pointer's pictures and what is dead under a minimized deal window.
