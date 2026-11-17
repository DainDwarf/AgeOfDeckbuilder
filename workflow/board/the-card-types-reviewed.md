# The card types reviewed

**Line:** The card types reviewed — a card's frame wears the colour of its kind and the family leaves: Improvement is a kind, the four cards that place an improvement declaring it, reading IMPROVEMENT and standing after the building cards in the collection's order; a settle card's frame is stone grey; the card that settles the player's city wears the pack's decorated front in that grey; the catalogue refuses an improvement card that places no improvement and an action card that places one; `docs/CHRONICLE.md`, `docs/MAP.md`, `docs/GLOSSARY.md`, `docs/META-SCREENS.md` and `docs/LOOK.md` say so; `e2e/trapping.spec.ts` passes. Doc-impact: `docs/CHRONICLE.md`, `docs/MAP.md`, `docs/GLOSSARY.md`, `docs/META-SCREENS.md`, `docs/LOOK.md`.

The line's "type" is the pages' **kind**; the dossier says kind throughout. Every sentence below was written by Claude at intake and taken by the user, the two colours and the decorated front being the user's own picks on the mockup, https://claude.ai/artifact/MwF1BPeEG74yofFqjhHyuj.

**Spec:**

`docs/CHRONICLE.md`, _Cards_:

- "Eight kinds, five of them the player's own." becomes "Nine kinds, six of them the player's own."
- A new entry after **Building**: "- **Improvement** — places an improvement on a tile where a worker stands, and that worker spends one of its action. It is not exhausted as a building card is: it comes around, and places its improvement on another tile."
- The **Action** entry gains a last sentence: "An action places no improvement: the card that places one is an improvement card."

`docs/MAP.md`, the Improvement entry of the tile's layers: "through an action card" becomes "through an improvement card".

`docs/GLOSSARY.md`, the **improvement** row's meaning: "A layer a worker places on a tile; unlike a building, a tile holds any number; also the kind of card that places one."

`docs/META-SCREENS.md`, the collection mode: "then by kind — settle, unit, building, action, instant — then by name" becomes "then by kind — settle, unit, building, improvement, action, instant — then by name".

`docs/LOOK.md`, _The cards_:

- **The frame**: its first two sentences stand. From "The frame's body wears the colour of the card's family" to the paragraph's end is replaced by: "The frame's body wears the colour of the card's kind, the pack's brown paper turned to that colour with its grain kept, the rims and the text box's paper left as painted: stone grey for a settle card, gold for a unit card, teal for a building card, olive for an improvement card, bone for an action and for an instant, crimson for a hazard, maroon for a challenge and ochre for a trophy. The card that settles the player's city wears the pack's decorated front in the plain one's place, of the same size and with the same oval window: gold rims round its window and its text box and flames on its body, the body turned to the settle cards' grey, as light as their paper stands, its flames and its outer rim with it, the gold left as painted. No other card wears a decorated front."
- **The art box**, last sentence: "A window holding no painting shows its kind's colour, pale."
- The packs' terms at the page's foot, Nice Card Game Template 2: "a front turned to a family's colour among them" becomes "a front turned to a kind's colour among them".

`public/assets/LICENSES.md`, Nice Card Game Template 2, the licence line: "The game turns the plain fronts to its families' colours" becomes "The game turns the plain fronts, and the decorated front the city's card wears, to its kinds' colours".

Player-facing entries, `src/ui/text.ts`:

- `kind.improvement`: "Improvement"
- `kind-tooltip.improvement`: "Placed by a worker, spending its action"

`workflow/IDEAS.md`, **Decorated fronts for a modified card**: "where every other card wears the plain one" becomes "where every other card but the one that settles the city wears the plain one".

**Doc-impact:** `docs/CHRONICLE.md`, `docs/MAP.md`, `docs/GLOSSARY.md`, `docs/META-SCREENS.md`, `docs/LOOK.md`; `public/assets/LICENSES.md` beside them.

**Scope:**

In:

- **Improvement, a kind.** The rules' closed set of kinds holds it, declared after building, so the collection's order follows with no rule of its own. Trapping, Irrigation, Pasture and Clay pit declare it, and so do the fixture's cards that place an improvement. An improvement card is what the action card it was: played through a worker, it goes to the discard pile and comes around, and it may carry exhaust or banish as a keyword. The deck holds it in the section its action cards stand in.
- **The fit.** The catalogue refuses, when it is built, an improvement card that places no improvement or that no worker's action goes to, and an action card that places an improvement, in the vocabulary the action and the instant are refused in today.
- **The label.** An improvement card's face, and its row on the deck panel, read IMPROVEMENT and raise the tooltip above. Gather and Hunt keep WORKER ACTION and its tooltip.
- **The frame reads the kind.** The family leaves the code as it leaves the page. One colour entry a kind in the look: settle hue 210, saturation 0.06, darkness 0.72; unit, building, improvement, hazard, challenge and trophy the numbers the unit, building, improvement, hazard, challenge and trophy families hold; action and instant an entry each, both at the numbers the bone family holds, two meanings sharing a value. The window stays read off what the card places, so every settle card in the content keeps the oval.
- **The city's card.** The card whose play places the city section's building wears the decorated front, whatever civilization holds it and wherever its face is drawn: the hand of the settle phase, the launch screen's pile, the collection, a browse, a name's small card, shown large. It is told by what it places, never by an id or a civilization.

Out:

- A mark on the face saying a worker plays the card: the label's tooltip says it, and the tutorial will.
- Gather and Hunt in a colour of their own: they keep the instants' bone.
- The infopanel's grey cards, which the board's two infopanel lines redo.
- The decorated arched front, a decorated front on any other card, and the modified cards the idea holds them for.
- The paintings, the palette, the tutorial.

Corner cases decided here:

- A settle card that places nothing wears the arched plain front in stone grey; the window rule gives it and nothing is added for it.
- An empty window on a settle card shows the settle grey, pale, by the recipe every kind's pale goes through; the city's card shows that same pale.
- A worn or dimmed card darkens the decorated front as it does a plain one, and a stack's copies under the city's card wear the front its face wears.
- A save holds card ids and no kind: nothing is migrated, and saves need no care before the Bronze Age.
- The fixture's `SILO`, an action card that builds a building over another, is left as it is: it wears the action's bone and the oval window. No content card is like it; it was reported to the user at intake as a fixture door.
- `src/ui/face.test.ts`'s family test asserts the rule this line removes, "a card is of the family of what its play places". It is replaced by tests of the rule that stands: a card's frame is its kind's, and the card that places the city wears the decorated front. That replacement is the design change agreed at this intake.

What the reconcile chose, each taken by the user as recommended:

1. Kind and family become one, in the kind's form: the family's reading leaves, the frame's colour is read off the kind, the window still off what the card places.
2. The city's card is told by what it places, so it goes through the reading that already tells a card that places the city.
3. The improvement card goes through the action's way as it is, cycling and keyword, and its fit through the check the action and the instant go through at the catalogue's build.
4. The collection's order goes through the kinds' declared order as it is, improvement declared after building: the four improvement cards stand ahead of Gather and Hunt, where today the six sort together by name.
5. The tooltip stands beside the building's and the worker action's, and leaves the border out since a worker places an improvement outside it too.
6. The infopanel's grey cards and the stone-grey settle cards stay apart.
7. An empty window's pale goes through the standing recipe, on the kind's colour.

**Traps:**

- The label's kind and the rules' kind are two things already: a face is labelled `worker-action` where its card is an `action` (`src/ui/face.ts`). The frame's colour reads the rules' kind, action and instant an entry each; the label keeps its own reading.
- `src/ui/card-frames.ts` finds a plain front's paper by a walk from the body's edges that stops at the steel rims. That walk cannot tell a decorated front's body from its gold. The mockup told it by hue, on the pack's blue decorated oval, `store/nice-card-game-template-2/0 - Front/Card 2 - Blue.png`: its opaque pixels of saturation 0.15 or more and hue 170° to 260° are the body, flames and outer rim with it, 124,606 of them; the gold and the paper lie at 10° to 50°. Turned as the paper is, each pixel takes the settle hue, the settle saturation times 0.75 plus the plain paper's mean saturation (0.394), and its own lightness times the settle darkness times 1.917, the plain oval paper's mean lightness (0.436) over the blue body's (0.228), so the body's mean stands where the plain settle paper's does, `#4b5055`. Whether the game keeps that recipe or finds a simpler one that looks the same is the implementer's; the page is the look to match.
- That file is 596 by 882 with its body's corner, its window, its glass and its paper where the plain oval's are: every measure the oval front is laid by holds, and the name, the text, the row at the window's foot and the label land where they do today. Checked on the page against the game's own shots.
- The cards sheet (`CARDS_SHEET`, 4096 a side) gains the decorated front's file, its turned frame and the kinds' fronts where the families' stood; its room is checked, not assumed.
- The kinds are a closed set switched at about a dozen sites in `src/rules/`, and in `src/ui/face.ts`, `src/ui/card-face.ts` and `src/content/`; the typecheck names every one. `CARD_KINDS`' order is the collection's order, which `src/ui/collection-layout.test.ts` asserts on a fixture.
- `docs/PHASER.md`, _Textures_, for a canvas-made sheet and its frames.
- The pack is CC BY-SA 3.0: a turned decorated front is a changed file under the same terms, which the licence record's sentence above covers.
- Another session shipped the line ahead of this one while this intake ran, `docs/LOOK.md` _The cards_ among what it changed: the sentences above were read against the page as it stands after it.

**Plan:**

1. `src/rules/cards.ts`, `src/rules/catalogue.ts`, `src/rules/campaign.ts`, `src/rules/fixtures.ts` and their tests, with the two entries in `src/ui/text.ts` and whatever the typecheck asks of `src/ui/` and `src/content/` for the new member: the kind stands in the rules with its fit refused both ways, proven on the fixture's cards, and no content card declares it yet. An inert commit of its own.
2. `src/content/stone.ts`: the four cards declare the kind; the catalogue's coherence test passes; the label and the collection's order follow.
3. `src/ui/look.ts`, `src/ui/face.ts`, `src/ui/card-frames.ts`, `src/ui/card-face.ts`, `src/ui/collection-stack.ts`, `src/ui/face.test.ts`: the frame reads the kind, the settle grey stands, the family is gone, and the city's card wears the decorated front on every surface a face is drawn on.
4. The five `docs/` pages, `public/assets/LICENSES.md` and `workflow/IDEAS.md` as the Spec writes them; the line leaves `workflow/BOARD.md`, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/trapping.spec.ts`: an improvement card of the content drawn in the hand under its new kind and played through a worker. The frames' look is the visual check's, against the mockup: the settle phase's hand, the launch screen's pile, the collection. CI proves on the push: `hover`, `browse`, `launch`, `collection`, `deck-editing`, `civilization-mode`, `card-reads`, `settle`, `irrigation`, `tree`, `reference`, `neutral`, and the rest of the suite.
