# Card kinds explain themselves

**Line:** **Card kinds explain themselves** — a card's kind label, `SETTLE`, `UNIT`, `BUILDING`, `INSTANT`, `HAZARD`, `EVENT` and `CAPSTONE`, answers the rest with a one-line tooltip beside it saying what the kind is, on every surface a card face stands on — the hand, a browse, the aim window, the deal and capstone windows, a card shown large, a small card — and the right click on it stays the card's own; the two stand-in unit entries stop repeating what the kind says; `docs/INTERFACE.md` says so, and `e2e/hover.spec.ts` proves the label on the hand and on the deal window. Doc-impact: `docs/INTERFACE.md`. [board/card-kinds-explain-themselves.md](board/card-kinds-explain-themselves.md)

**Spec:** `docs/INTERFACE.md` _The presses_, the pointer paragraph and the names paragraph; `docs/CHRONICLE.md` _Cards_ and _Events and the capstone_ are what the seven lines say, and change by nothing.

The rule in one sentence: the kind label at a card face's foot is a tooltip's source, as a reading on the resource bar and a row of the infopanel are — the pointer resting on it raises the bubble of the surface the face stands on, beside the label, reading the kind's one line; the pointer leaving it takes the bubble down; and the label answers no press of its own, so a click on it is the card's, a right click showing the card large as a right click on its body does.

`docs/INTERFACE.md`, _The presses_, the pointer paragraph beginning "**The pointer is a hand over a button**" gains the kind label in its list, in full:

> **The pointer is a hand over a button, a reading on the resource bar, a card in the hand, the cards a window lays out, a small card, a name and a card's kind label**, and an arrow over everything else, the map, a card shown large and a scrim among it. It reads the one thing the pointer is on, as every hover does, so it is right the moment that thing rises, falls or comes live under a pointer that holds still.

`docs/INTERFACE.md`, _The presses_, a new paragraph after the names paragraph (the one beginning "**A thing named in a card's text stands in brackets**"):

> **A card's kind label answers the rest.** The pointer resting on the label at a card face's foot raises the one bubble of the surface the face stands on, beside the label, reading in one line what the kind is; the pointer leaving the label takes it down. Every card face answers so — in the hand, in a browse, in the aim window, on the deal and capstone windows, shown large and small alike — and the label answers no press of its own: a click on it is the card's.

`docs/GLOSSARY.md`: no row changes. "Kind" and "label" stay plain words.

Player-facing text, every entry written out. The seven tooltip entries, one per kind, keyed as the readings' and the stats' are:

| Entry              | Reads                                            |
| ------------------ | ------------------------------------------------ |
| `tooltip.settle`   | `Played on the settle phase only`                |
| `tooltip.unit`     | `One idle population becomes the unit`           |
| `tooltip.building` | `Built by a worker on a tile inside your border` |
| `tooltip.instant`  | `An immediate effect`                            |
| `tooltip.hazard`   | `Strikes each turn it stays in your hand`        |
| `tooltip.event`    | `Choose one answer`                              |
| `tooltip.capstone` | `The age's trial. Pass it to win the age`        |

The two rules entries that repeated the kind, as they read after this line; every other `rules.`, `answer-rules.` and `capstone-rules.` entry stays as it reads, the three that open on `Single use.` included:

| Entry              | Reads                         |
| ------------------ | ----------------------------- |
| `rules.PH_Worker`  | `Place a [player:PH_Worker]`  |
| `rules.PH_Warrior` | `Place a [player:PH_Warrior]` |

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

In:

- The kind label of every card face a source of the surface's tooltip: the hand's cards, on the UI's bubble; the grid's cards on the browse, the aim window, the deal window and the capstone's window, the card shown large and the stack's newest, and a small card wherever one stands, on the bubble of the scene they are drawn on — the overlay scene, which today raises none, gets one bubble of its own on a stratum of its own, over its small cards, as the UI's stands over its own. The bubble is painted beside the label, to its right, as the infopanel's rows paint theirs, at the label's spot as it stands when the rest ends.
- The seven entries and the two shortened ones.
- `e2e/hover.spec.ts` gains two tests. One on the hand: the chronicle opened on seed 1 and the stand-in deck, turn 1; the pointer moved onto the first card's kind label, read from the face where it stands once the card has come to rest lifted, as `liftedName` in `e2e/reference.spec.ts` reads a name; the UI's bubble comes up reading the entry of that card's kind, read off the stand-in catalogue through `cardOf`; the pointer moved off the card takes it down; a right click on the label shows that card large, `inspection` standing that card's id. One on the deal window: the deal run of `dealRun`, the window standing, the pointer resting on an answer's `EVENT` label raises the overlay's bubble reading `tooltip.event`, and moved beside the deal it goes down. A helper beside `nameOnScreen` in `e2e/chronicle-screen.ts` finds a face's kind label on the page; the bubble's text is read off the named bubble's one Text child.

Out:

- A right click on the label doing anything of its own: it is the card's, until a codex exists (an idea, jotted with this intake).
- Population, yield, unit and `Single use` in a card's text: plain words, no bubble, no brackets; the codex jot carries the keyword.
- The capstone window's title: plain prose, as it reads.
- The thing card the infopanel draws, and the one a name raises for a terrain, a feature, an improvement, a building or a unit kind: it wears no kind label and answers nothing new.
- The rule cards the pitch drew: rejected for their look; a tooltip and, later, the codex.

Corner cases decided here:

- A card in the hand lifts under the pointer; the label lifts with it and the bubble is painted where the label stands at the end of the rest, not where it stood at the hover's start.
- A small card is a card face, so its kind label raises the bubble too, and the pointer resting on that label is on the small card, which keeps it up as any rest on it does.
- On a stack of cards shown large only the newest face's label answers, as only its names do.
- The bubble and a name's small card never stand for one rest: they are raised by different spots of one face, and the pointer is on one of them.
- A scrim rising, a render of the hand, and the window's wipe take the bubble down as they take a small card down: the hover ends, and the surface's reading of the pointer does the rest.
- The tooltip explains no mechanic beyond its one line, names no card, and stays the dogma's glanceable one-liner; the design pages hold the rules.
- A kind the label reads with no entry of its own is a type error, not a runtime one: the key is built from the closed kind, as `tooltip.${key}` is built from a reading today.

**Traps:**

- One bubble per surface, named `tooltip-<scene key>` (`src/ui/tooltip.ts`): the UI scene's is `tooltip-ui`, the map's `tooltip-map`, and the overlay's will be `tooltip-overlay`; `hover.spec.ts` reads them by those names through `tooltipUp`. The overlay scene (`src/ui/overlay-scene.ts`) has four strata and no tooltip; `docs/INTERFACE.md` _What stands over what_ says a tooltip stands over everything but the console on its surface, so the new stratum goes over `smallCard`.
- The hand raises no zone inside a card: a zone inside a container is over the container in the hit test (`docs/PHASER.md` _Input across scenes_, the render-list bullet), and the hand's lift and its hover live on the container. The last line read a name under the pointer from the container's own `pointermove` through `nameAt` for that reason, and the grid on the overlay does the same on its frame; the label follows the same path there. The stack's newest card and a small card hand zones through `names` presses; a zone is fine there.
- The tooltip module waits `REST_MS` on a still pointer and paints through the closure it was handed at `raise`, reading the spot then (`src/ui/tooltip.ts`); a spot read at the hover's start is stale after the hand's lift. `Raiser.where()` in `src/ui/small-card.ts` is the precedent for a spot read late.
- Phaser re-checks what the pointer is over only on a move (`docs/PHASER.md` _The pointer's readings_); the game's own reading, `followPointer` in `src/ui/design-space.ts`, ends a hover under a scrim or a wipe. The bubble on the overlay is on the scene that raises the scrim, so what takes it down is the wipe, as `small.down()` is called there.
- `e2e/chronicle-screen.ts`'s `nameOnScreen` reads a face's `names` data by index, and five specs read index 0 as the first name of the text; whatever the face records for its label, the `names` list keeps the text's names first, or the label gets a record of its own.
- The face draws its kind label as a Text named nothing (`src/ui/card-face.ts`); a spec finds it by a name, so the label is named, and every face names its label the same.
- `text()` keys are the closed `TextKey` union; `tooltip.${kind}` with `kind: CardKind | 'event' | 'capstone'` typechecks only when all nine keys exist — seven do after this line; the face's `kind` today is the label's text, not the key.
- `hover.spec.ts` sets a taller viewport for the bare page above the canvas; the two new tests need none of it and follow the file's other tests otherwise. A rest on the deal window comes after `rested`, and `dealRun`'s budget through `budget(run.due)`.
- Comment rule: a comment block longer than three lines is flagged under `src/` and `e2e/`.

**Plan:**

1. `src/ui/text.ts`: the seven entries and the two shortened ones. Leaves: `npm run check` and `npm test` green, the two stand-in cards reading shorter.
2. `src/ui/overlay-scene.ts` and `src/ui/overlay.ts`: the overlay's tooltip stratum and bubble. Leaves: a bubble that nothing raises yet, `npm run check` green.
3. `src/ui/card-face.ts`, `src/ui/hand.ts`, `src/ui/overlay.ts`, `src/ui/small-card.ts`, `src/ui/chronicle-scene.ts`: the label read under the pointer wherever a name is, raising the surface's bubble beside it and taking it down on leaving; the cursor the hand over it. Leaves: the whole behaviour on screen.
4. `docs/INTERFACE.md`: the two paragraphs above, verbatim.
5. `e2e/chronicle-screen.ts` and `e2e/hover.spec.ts`: the helper and the two tests.
6. The board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/hover.spec.ts`.
- CI's on the push: `e2e/reference.spec.ts`, `e2e/inspect.spec.ts`, `e2e/press.spec.ts`, `e2e/deal.spec.ts`, `e2e/capstone.spec.ts`, `e2e/browse.spec.ts`, `e2e/recall.spec.ts`, `e2e/window.spec.ts`.
