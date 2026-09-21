# Card references

**Line:** Card references — a card named in a rules entry is marked by its id and drawn as its name in brackets; the pointer resting on it shows the named card small above it and a right click on it shows the named card large beside the one it was taken off, both cascading; `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md` say so, the catalogues' coherence tests refuse a name that resolves to no card of theirs, and `e2e/reference.spec.ts` asserts it. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/INTERFACE.md` _The presses_ and `docs/CHRONICLE-SCREEN.md` _The chronicle screen_, the browse paragraph. Today three rules entries name a card by a retyped literal, which the writing rules forbid: prose cites a card by its verbatim name, and code reaches it through its text key. The entry marks the card by id, the screen draws the card's own name in brackets, and the name answers the two presses a card answers. The sentences, written out:

- `INTERFACE.md` _The presses_, in the right click paragraph, replace "a card has but the one, so a second right click on a card shown large does nothing, and neither does a left click on it: a press beside it, or the back key, takes it down." with: "a card has but the one, so a second right click on a card shown large does nothing, a name on it excepted, and neither does a left click on it: a press beside it, or the back key, takes it down."
- `INTERFACE.md` _The presses_, a new paragraph after the right click paragraph: "**A card named in a card's text stands in brackets**, and answers two presses wherever the card it stands on answers any. The pointer resting on it shows the named card small above it, centred on the name, as a card lies in the hand, after the rest a tooltip waits for; the small card is a card face, so a name on it shows its own small card the same way, and a small card stays up while the pointer is on it, on the name that raised it or on a small card raised from it, and goes down with those raised from it once the pointer is on none of them. A right click on a name shows the named card large; one on a name on a card shown large stands the named card beside it, to its right, the row centred at the one width, and a row wider than the screen holds its newest card whole and lets the earliest go off the left edge. A left click on a name is the card's own, and a small card answers no press."
- `INTERFACE.md` _The presses_, the back key sentence, replace "the thing shown large" with "the thing shown large, the last of them where several stand".
- `INTERFACE.md` _What stands over what_, a new paragraph after the tooltip's: "The **small card** a name raises stands where a tooltip does, over everything but the console, and the scrim rising takes it down as it does a tooltip. Cards shown large stand where the one does, however many stand in the row."
- `CHRONICLE-SCREEN.md` _The chronicle screen_, the browse paragraph, replace "A pile is not a card, so a right click on one does nothing." with: "A pile is not a card, so a right click on one does nothing, and a name on its top card answers nothing either."
- `docs/GLOSSARY.md`: no row changes. The name, the small card and the row are said in plain words; **inspect** still covers the card shown large.

Player-facing text. A reference is marked `[card:<id>]` in a rules entry, beside the resource glyph's `[<resource>]`, and drawn as that card's `card.<id>` entry in square brackets. Which entries want a mark is [`../text-references.md`](../text-references.md)'s own table, entry by entry with what each reads today; the ones it marks **cards** are this line's, the rest wait for **References beyond cards**. That table is the list, and this file does not carry a second copy of it. The comment atop `src/ui/text.ts` names the second mark beside the first.

The look, from the mockup the user chose on: the name in the card's ink, in square brackets, in the run's own font at the run's own size, nothing underlined and no colour; the cursor is the hand over it, which the hand and a window's grid already show over the whole of every card they carry, and which the card shown large and a small card give the name itself. The small card is the card face at the hand's width, 130, drawn affordable, its bottom edge eight design pixels over the name's line and its middle on the name's middle, held inside the screen's margin, and under the name when nothing fits above it; it stands on a row of its own in `src/ui/depths.ts`, over `overScrim` and under `tooltip`, so it is over whatever raised it on either side of the scrim. The row of cards shown large is laid as the browse lays a row: the inspection width, the browse's gap, centred on the screen, every card at the same height; the row is re-laid on every change, the newest card named `inspection` and carrying the card in its data as today, the ones before it `inspection-<i>` from 0 at the earliest.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The run laying out a second mark: the name in brackets drawn in the run, never broken across a line, and its extent answered — the line, where it starts and where it ends — as a glyph's place is answered today. One Vitest test beside the run's for each rule a player could state: the name is drawn in brackets in place of the mark; a name of several words stays on one line; the extent answered covers the brackets.
- The face answering where every name it draws lies, at every width and on every surface a face is drawn: the hand, a window's grid, the card shown large, a small card. The hand and a window's grid lay nothing over a name and read that geometry in the hover and the right click they already take, a zone inside a hand card stealing its click and its drag and one inside a grid card stealing the frame's scroll; the card shown large and a small card lay a live zone from it, neither of them dragging, scrolling nor answering a left press. Either way the name takes the hover and the right click, and a left press on it is the card's own.
- The small card: raised after the tooltip's rest on the name, on the ui surface, on its own row of the depth table; a face of its own, its names live; a chain of them stays while the pointer is on any of its later members and goes down from the first one the pointer has left, after the tooltip's handover; a render of what raised it, a press that raises or takes down a window, the scrim rising and the card shown large take the chain down.
- The row of cards shown large: a right click on a name on a card shown large adds the named card to the row's right; the back key, a left press beside the row and a right press beside it take down the newest card, and the row's last card taken down drops the inspection onto what it was taken off, as today. A right click on a name in the hand, a grid or the small card shows the named card large alone, over what stood, as a right click on a card does today. The named card is drawn with no refusal.
- The entries `../text-references.md` marks **cards**, and the two design pages' sentences, verbatim.
- The catalogues' coherence tests, stand-in and nomadic: every rules entry a catalogue names — its cards', its answers', its capstones' — laid out through the run on a plain measure, and every name it marks a card the catalogue holds. One test on the fixture catalogue in `src/rules/` is not needed: the check is the content's coherence, and the run's mechanism has its own tests.
- `e2e/reference.spec.ts`, on the run `dealRun` in `e2e/chronicle-screen.ts` searches for, whose deal offers the raid first and the famine second: the name on the second answer hovered raises a small card standing PH_Hunger; the pointer moved onto the small card leaves it standing; moved beside, it goes down; a right click on the name shows PH_Hunger large alone and the back key brings the deal back; the second answer shown large, the cursor the hand over its name and not beside it on the same card, then its name right-clicked, stands PH_Hunger beside it, `inspection` PH_Hunger and `inspection-0` PH_Famine; one back key takes PH_Hunger down and PH_Famine is `inspection` again; one more brings the deal back.

Out:

- Any name outside a rules entry: the aim line and the aim window's title name the card being aimed, which is the selection in the hand; tooltips name no card by the writing rules.
- A name on the discard pile's top card answers nothing, as that card answers nothing: it is drawn as the face draws it, and the pile neither lays a zone over it nor reads where it lies.
- The inspection key: it inspects the selection, and a name is never the selection.
- Any change to what a name resolves to at play: the rules never read a rules entry.

Corner cases decided here:

- A name refers to a card of the deck or of an event's answers by the card's id; an answer or a capstone is not a card of the deck and is never named.
- A name never breaks across lines, whatever it costs the line; a name wider than the run's width overflows as a long word does today.
- The small card is drawn affordable whatever the city has: it says what the card is, not whether it can be paid for now. So is the named card shown large.
- A small card raised over a hand card lifted by the hover: the hover on the name is a hover on the card, so the card stays lifted while the small card stands, and it stays lifted for as long as any card of the chain raised off it stands, wherever the pointer has travelled. The chain coming down releases it. The hand is told of that hold by the chain, which already knows what raised it; the pointer leaving the hand card is not what settles it while a chain off it stands.
- A left press on a name in the hand selects the card, or acts on it if selected, as a press anywhere on it; a drag begun on a name drags the card. The small card, if up, goes down with the render or stays as the pointer decides.
- The cursor over a name is the hand, and no surface writes it: the hand and a window's grid show the hand over the whole of every card they carry, so a name on one needs nothing at all; the card shown large and a small card show the arrow, and the zone a name carries on those two shows the hand itself. Nothing is set against the engine's own cursor bookkeeping.
- A right click on a name on a card of a window's grid, the deal's or the capstone's included, shows the named card large over that window, and the back key brings the window back where it stood, ring and scroll included, as today's inspection does.
- A row of cards shown large stands over the deal window as the one card does today, and the menu opening over it takes the whole row down, as it does the one card.
- A row wider than the screen: anchored on its newest card, held at the right margin, the earliest going off the left edge; nothing shrinks. No content today chains past two.

**Traps:**

- The run's mark is parsed by one regex on a word, and the drawn name may hold spaces: the split on spaces happens before the mark is drawn, so a name stays in one word of the run. A name's extent is measured on the drawn line as a glyph's place is, from the line's middle.
- The rules text is one Text, so the name cannot be styled apart from the run: the brackets are characters of the run, and the zone is laid over the extent the run answers, at the run's line height, which the face reads back off the Text once it is laid out.
- A grid's frame zone and the grid's cards share the `onScrim` row, and the frame is added to the scene before them, so Phaser hands the pointer to a zone inside a card before the frame sees it; the grid's cards find a press by geometry through the frame, never by a hit on the face. A zone inside a grid card would take the frame's scroll drag, its fling and its presses with it wherever a name lies, which is why a grid lays none and finds a name by the geometry it finds a card by.
- The clip camera draws inside the grid's frame everything the scene gains after `show` unless it is excluded through the clip: a small card raised over a grid is drawn inside the frame too, clipped, unless excluded. The refusal note already does this.
- The card shown large is interactive over its whole area so both presses reach nothing beneath it: a zone on it must take the right click before the face does.
- A hand card is interactive with a drag and a hit area of its own, and it is the card that carries the hand cursor; a zone inside it would steal the card's click, its drag and its hover, which is why the hand lays none and reads a name's geometry in the hover and the right click it already takes.
- The tooltip's rest, handover and jitter live in `src/ui/tooltip.ts` and are the one bubble per surface; the small card is not a tooltip and is not one of its messages, but its rest and handover are the same numbers, and the tooltip's hide-on-leave must not take the small card down.
- Every depth under `src/ui/` is a row of `src/ui/depths.ts`, and no other file names a number or defines a depth constant: the small card's row goes into that table, between `overScrim` and `tooltip`, and `docs/INTERFACE.md` _What stands over what_ says where it stands. The row of cards shown large keeps `onScrim`, the one card's row today.
- Five specs read the card shown large as `inspection` and its card from its data, `e2e/browse.spec.ts`, `e2e/capstone.spec.ts`, `e2e/deal.spec.ts`, `e2e/recall.spec.ts` and `e2e/press.spec.ts`; the newest card of the row keeps that name and that data, so none of them changes.
- `e2e/chronicle-screen.ts`'s `named` finds the first object of a name across the layers, so a zone named the same on every face is found on whichever face comes first; the spec needs the zone on a given face, which the helper reads as a child of the named face.
- The stand-in's answer entries hold `{warriors}` substitutions; the mark is resolved by the run at draw, after the substitution, so a mark and a substitution in one entry do not collide.
- `cardName` throws for an id no entry names, at draw; the coherence test is what turns that into a test failure, and it must lay out every entry of every catalogue, the stand-in's included, since the e2e suite plays it.

**Plan:**

1. `src/ui/text-run.ts` and its test: the second mark, the name drawn in brackets and its extent answered; the tests above. `npm test` passes; nothing on screen changes.
2. `src/ui/text.ts`: the three entries marked, the comment atop the file; `src/content/nomadic.test.ts` and `src/content/stand-in.test.ts`: every rules entry laid out and every name a card of the catalogue. `npm test` passes; the names now draw in brackets.
3. `src/ui/card-face.ts`: where every name lies answered back, and the live zone the card shown large and a small card lay from it, the hover and the right click handed to whoever drew the face; `src/ui/depths.ts`: the small card's row; the small card, its chain, its rest and handover, wherever the implementer lands it; `src/ui/hand.ts`, `src/ui/overlay.ts` and `src/ui/chronicle-scene.ts` answering the hover and the right click on every surface, the hand and a window's grid reading the geometry and the hand holding a card lifted while a chain off it stands, the row of cards shown large in the overlay. `npm run check` passes.
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
npx playwright test e2e/hover.spec.ts
```

Then the visual check on the running app: the brackets read on the deal's answer at the browse width and on the card shown large; the small card stands whole over the name, inside the screen, and over the neighbouring answer; two cards shown large stand side by side, centred, neither clipped; the cursor is the hand over a name on the card shown large and the arrow beside it on the same card.
