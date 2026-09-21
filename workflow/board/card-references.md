# Card references

**Line:** Card references — a card named in a rules entry is marked by its id and drawn as its name in brackets; the pointer resting on it shows the named card small above it and a right click on it shows the named card large beside the one it was taken off, both cascading; `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md` say so, the catalogues' coherence tests refuse a name that resolves to no card of theirs, and `e2e/reference.spec.ts` asserts it. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/INTERFACE.md` _The presses_ and `docs/CHRONICLE-SCREEN.md` _The chronicle screen_, the browse paragraph. Today three rules entries name a card by a retyped literal, which the writing rules forbid: prose cites a card by its verbatim name, and code reaches it through its text key. The entry marks the card by id, the screen draws the card's own name in brackets, and the name answers the two presses a card answers. The sentences, written out:

- `INTERFACE.md` _The presses_, in the right click paragraph, replace "a card has but the one, so a second right click on a card shown large does nothing, and neither does a left click on it: a press beside it, or the back key, takes it down." with: "a card has but the one, so a second right click on a card shown large does nothing, a name on it excepted, and neither does a left click on it: a press beside it, or the back key, takes it down."
- `INTERFACE.md` _The presses_, a new paragraph after the right click paragraph: "**A card named in a card's text stands in brackets**, and answers two presses wherever the card it stands on answers any. The pointer resting on it shows the named card small above it, centred on the name, as a card lies in the hand, after the rest a tooltip waits for; the small card is a card face, so a name on it shows its own small card the same way, and a small card stays up while the pointer is on it, on the name that raised it or on a small card raised from it, and goes down with those raised from it once the pointer is on none of them. A right click on a name shows the named card large; one on a name on a card shown large stands the named card beside it, to its right, the row centred at the one width, and a row wider than the screen holds its newest card whole and lets the earliest go off the left edge. A left click on a name is the card's own, and a small card answers no press."
- `INTERFACE.md` _The presses_, the back key sentence, replace "the thing shown large" with "the thing shown large, the last of them where several stand".
- `CHRONICLE-SCREEN.md` _The chronicle screen_, the browse paragraph, replace "A pile is not a card, so a right click on one does nothing." with: "A pile is not a card, so a right click on one does nothing, and a name on its top card answers nothing either."
- `docs/GLOSSARY.md`: no row changes. The name, the small card and the row are said in plain words; **inspect** still covers the card shown large.

Player-facing text, written out. A reference is marked `[card:<id>]` in a rules entry, beside the resource glyph's `[<resource>]`, and drawn as that card's `card.<id>` entry in square brackets:

- `answer-rules.share`: `Lays [card:hunger] on top of the draw pile`, drawn `Lays [Hunger] on top of the draw pile`.
- `answer-rules.PH_Famine`: `Lays [card:PH_Hunger] on top of the draw pile`, drawn `Lays [PH_Hunger] on top of the draw pile`.
- `capstone-rules.first-shelter`: `Lays [card:shelter] on top of the draw pile`, drawn `Lays [Shelter] on top of the draw pile`.
- The comment atop `src/ui/text.ts` names the second mark beside the first.

The look, from the mockup the user chose on: the name in the card's ink, in square brackets, in the run's own font at the run's own size, nothing underlined and no colour; the cursor is the hand over it. The small card is the card face at the hand's width, 130, drawn affordable, its bottom edge eight design pixels over the name's line and its middle on the name's middle, held inside the screen's margin, and under the name when nothing fits above it; it stands over whatever raised it. The row of cards shown large is laid as the browse lays a row: the inspection width, the browse's gap, centred on the screen, every card at the same height; the row is re-laid on every change, the newest card named `inspection` and carrying the card in its data as today, the ones before it `inspection-<i>` from 0 at the earliest.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The run laying out a second mark: the name in brackets drawn in the run, never broken across a line, and its extent answered — the line, where it starts and where it ends — as a glyph's place is answered today. One Vitest test beside the run's for each rule a player could state: the name is drawn in brackets in place of the mark; a name of several words stays on one line; the extent answered covers the brackets.
- The face laying a live zone over every name it draws, at every width and on every surface a face is drawn: the hand, a window's grid, the card shown large, a small card. The zone takes the hover and the right click and lets the left press through to the card.
- The small card: raised after the tooltip's rest on the name, on the ui surface, over everything that surface holds; a face of its own, its names live; a chain of them stays while the pointer is on any of its later members and goes down from the first one the pointer has left, after the tooltip's handover; a render of what raised it, a press that raises or takes down a window, and the card shown large take the chain down.
- The row of cards shown large: a right click on a name on a card shown large adds the named card to the row's right; the back key, a left press beside the row and a right press beside it take down the newest card, and the row's last card taken down drops the inspection onto what it was taken off, as today. A right click on a name in the hand, a grid or the small card shows the named card large alone, over what stood, as a right click on a card does today. The named card is drawn with no refusal.
- The three entries above, and the two design pages' sentences, verbatim.
- The catalogues' coherence tests, stand-in and nomadic: every rules entry a catalogue names — its cards', its answers', its capstones' — laid out through the run on a plain measure, and every name it marks a card the catalogue holds. One test on the fixture catalogue in `src/rules/` is not needed: the check is the content's coherence, and the run's mechanism has its own tests.
- `e2e/reference.spec.ts`, on the run `e2e/deal.spec.ts` searches for, whose deal offers the raid first and the famine second: the name on the second answer hovered raises a small card standing PH_Hunger; the pointer moved onto the small card leaves it standing; moved beside, it goes down; a right click on the name shows PH_Hunger large alone and the back key brings the deal back; the second answer shown large, then its name right-clicked, stands PH_Hunger beside it, `inspection` PH_Hunger and `inspection-0` PH_Famine; one back key takes PH_Hunger down and PH_Famine is `inspection` again; one more brings the deal back.

Out:

- Any name outside a rules entry: the aim line and the aim window's title name the card being aimed, which is the selection in the hand; tooltips name no card by the writing rules.
- A name on the discard pile's top card answers nothing, as that card answers nothing: it is drawn as the face draws it and gets no zone.
- The inspection key: it inspects the selection, and a name is never the selection.
- Any change to what a name resolves to at play: the rules never read a rules entry.

Corner cases decided here:

- A name refers to a card of the deck or of an event's answers by the card's id; an answer or a capstone is not a card of the deck and is never named.
- A name never breaks across lines, whatever it costs the line; a name wider than the run's width overflows as a long word does today.
- The small card is drawn affordable whatever the city has: it says what the card is, not whether it can be paid for now. So is the named card shown large.
- A small card raised over a hand card lifted by the hover: the hover on the name is a hover on the card, so the card stays lifted while the small card stands.
- A left press on a name in the hand selects the card, or acts on it if selected, as a press anywhere on it; a drag begun on a name drags the card. The small card, if up, goes down with the render or stays as the pointer decides.
- A right click on a name on a card of a window's grid, the deal's or the capstone's included, shows the named card large over that window, and the back key brings the window back where it stood, ring and scroll included, as today's inspection does.
- A row of cards shown large stands over the deal window as the one card does today, and the menu opening over it takes the whole row down, as it does the one card.
- A row wider than the screen: anchored on its newest card, held at the right margin, the earliest going off the left edge; nothing shrinks. No content today chains past two.

**Corner cases still open:**

Three the build hit that the corner cases above do not answer; each is a fork for the user, and the first two contradict something already written here.

- **The cursor over a name.** The look says the cursor is the hand over a name. A zone that takes the cursor takes the press, which the corner cases above forbid: a left press on a name selects the card, a drag begun on a name drags it, and the hover on the name is a hover on the card. In a window's grid the frame zone at `SCRIM_DEPTH + 2` takes the pointer before any zone inside a card sees it, so the cursor cannot be had there at all. Either the look yields and the cursor over a name is the surface's — the hand over a hand card and a grid card, the default over a card shown large and a small card — or the canvas cursor is set by hand from the pointer loop that already knows a name is under the pointer, against Phaser's own cursor bookkeeping, which resets on every hover in and out.
- **A hand card's lift while a small card raised off it stands.** The corner case above says the card stays lifted. The small card must be interactive, or a press on it falls through to what is beneath; so once the pointer travels off the name onto the small card, the hand card takes its `pointerout` and settles back into the lane while the small card stays up. Either the card is allowed to settle, or the hand ignores a `pointerout` whose cause is a small card raised off one of its own — a non-local coupling between the hand and the chain. No card of the hand names a card today, so no content shows this either way.
- **A tooltip is drawn under every window, and the bar hides it rather than fixing it.** The tooltip's depth is 30 and its own comment says _under the overlay_, while the scrim stands at `SCRIM_DEPTH` and a window's cards one over it, so no bubble a hover raises can be drawn over a window. The resource bar, which rises to `OVER_SCRIM_DEPTH` while a deal stands, answers this by refusing to raise a tooltip at all for as long as it is up there; the capstone's window is not a deal, so that refusal does not cover it. This stands today, without any of this line's work, and what it wants — the tooltip over everything the screen carries, the debug console the one thing to decide, and the bar's refusal deleted with it — is a change to `src/ui/tooltip.ts` and `src/ui/resource-bar.ts` that this line otherwise never touches. It is a line of its own, and it comes before this one: the small card and the card shown large both stand over a window, and a tooltip that cannot is the inconsistency the player meets first.

**Traps:**

- The run's mark is parsed by one regex on a word, and the drawn name may hold spaces: the split on spaces happens before the mark is drawn, so a name stays in one word of the run. A name's extent is measured on the drawn line as a glyph's place is, from the line's middle.
- The rules text is one Text, so the name cannot be styled apart from the run: the brackets are characters of the run, and the zone is laid over the extent the run answers, at the run's line height, which the face reads back off the Text once it is laid out.
- A grid's frame zone stands at `SCRIM_DEPTH + 2` over every card of the grid and takes the pointer; the grid's cards find a press by geometry, never by a hit on the face. A zone inside a grid card is never reached unless it stands over the frame or the frame hands the pointer on.
- The clip camera draws inside the grid's frame everything the scene gains after `show` unless it is excluded through the clip: a small card raised over a grid is drawn inside the frame too, clipped, unless excluded. The refusal note already does this.
- The card shown large is interactive over its whole area so both presses reach nothing beneath it: a zone on it must take the right click before the face does.
- A hand card is interactive with a drag and a hit area of its own; a zone inside it that takes the left press would steal the card's click and its drag.
- The tooltip's rest, handover and jitter live in `src/ui/tooltip.ts` and are the one bubble per surface; the small card is not a tooltip and is not one of its messages, but its rest and handover are the same numbers, and the tooltip's hide-on-leave must not take the small card down.
- The small card stands on the ui surface and must be over the scrim's grid, `SCRIM_DEPTH + 1` to `+ 3`, and over the hand's lifted card, depth 40: one depth over everything either surface raises.
- Five specs read the card shown large as `inspection` and its card from its data, `e2e/browse.spec.ts`, `e2e/capstone.spec.ts`, `e2e/deal.spec.ts`, `e2e/recall.spec.ts` and `e2e/press.spec.ts`; the newest card of the row keeps that name and that data, so none of them changes.
- `e2e/chronicle-screen.ts`'s `named` finds the first object of a name across the layers, so a zone named the same on every face is found on whichever face comes first; the spec needs the zone on a given face, which the helper reads as a child of the named face.
- The stand-in's answer entries hold `{warriors}` substitutions; the mark is resolved by the run at draw, after the substitution, so a mark and a substitution in one entry do not collide.
- `cardName` throws for an id no entry names, at draw; the coherence test is what turns that into a test failure, and it must lay out every entry of every catalogue, the stand-in's included, since the e2e suite plays it.

**Plan:**

1. `src/ui/text-run.ts` and its test: the second mark, the name drawn in brackets and its extent answered; the tests above. `npm test` passes; nothing on screen changes.
2. `src/ui/text.ts`: the three entries marked, the comment atop the file; `src/content/nomadic.test.ts` and `src/content/stand-in.test.ts`: every rules entry laid out and every name a card of the catalogue. `npm test` passes; the names now draw in brackets.
3. `src/ui/card-face.ts`: the zone over every name, the hover and the right click handed to whoever drew the face; the small card, its chain, its rest and handover, wherever the implementer lands it; `src/ui/hand.ts`, `src/ui/overlay.ts` and `src/ui/chronicle-scene.ts` answering the hover and the right click on every surface, the row of cards shown large in the overlay. `npm run check` passes.
4. `e2e/reference.spec.ts`, and the helper it needs beside the others in `e2e/chronicle-screen.ts`.
5. `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md`, the sentences above verbatim; the board line deleted.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/reference.spec.ts
npx playwright test e2e/deal.spec.ts
npx playwright test e2e/capstone.spec.ts
npx playwright test e2e/press.spec.ts
```

Then the visual check on the running app: the brackets read on the deal's answer at the browse width and on the card shown large; the small card stands whole over the name, inside the screen, and over the neighbouring answer; two cards shown large stand side by side, centred, neither clipped.
