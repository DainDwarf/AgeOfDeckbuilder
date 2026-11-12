# A press draws nothing by itself

**Line:** **A press draws nothing by itself** — a press held still changes nothing drawn on any screen, a panel's fling excepted: a unit's reach lights with its ring at the release and alone at the start of its drag, a unit or a population coming home goes on under a press, and a refusal's note that stood when a press landed comes down as that press is let go or as its drag starts; `e2e/held-press.spec.ts` proves it and the three pages say so.

**Spec:** the sentences below, written at intake by Claude and taken by the user as the recommended design; each is added or replaced verbatim.

- `docs/INTERFACE.md`, _The presses_. A new paragraph after the one that opens "**A press lands on the thing the pointer is on, and on nothing under it.**":

  > **A press answers as it is let go or as its drag starts, never as it lands.** Held still, it leaves the screen as it stood, and everything it changes there comes at that one moment. A press becomes a drag once the pointer has travelled a short way from where it landed, as far for every thing dragged. One thing answers a press as it lands: a panel running on from a drag stops under it. A key answers as it goes down.

- `docs/INTERFACE.md`, _The presses_. A new paragraph after the one that opens "**A selected thing being aimed filters every left click by its aim.**":

  > **A refusal's note stands until the next press answers.** It comes down as that press is let go or as its drag starts, whichever button holds it and wherever on the screen it landed, and the note that press raises, where it raises one, stands in its place at once.

- `docs/INTERFACE.md`, _The presses_, the paragraph "**A thing dragged follows the pointer until its press is let go.**" Its second sentence becomes the two below, the last sentence of the paragraph staying:

  > Let go where it lands, it does what landing there does; let go anywhere else, a thing standing over where it would land included, it comes home, as fast whatever it is, and nothing changes, the selection no more than the rest; a card lifted out of the hand is the one exception, its lift letting go of the card the hand held selected. A thing coming home goes on coming home under a press, and is dragged again like any other.

- `docs/CHRONICLE-SCREEN.md`, _The hand and the aim_, the paragraph "**Every card being aimed is aimed at one kind of thing.**" Its last sentence, "A drag that lifts another card of the hand lets the card being aimed go, whatever it was aimed at.", becomes:

  > A drag that lifts a card of the hand lets the selected card go as it lifts, the lifted card itself and a card being aimed among them, whatever it was aimed at, and the card stays let go where the lifted one comes home.

- `docs/CHRONICLE-SCREEN.md`, _The map's presses_, first paragraph. The sentence "A drag from the unit onto a lit or glowed tile is the same step or the same attack; let go anywhere else, the unit comes home, and a unit that can do nothing is grabbed and comes home just the same, without a word." becomes:

  > A drag from the unit onto a lit or glowed tile is the same step or the same attack: a unit dragged lights and glows from the start of its drag as a selected one does, wears no ring, and leaves the selection where it was; let go anywhere else, the unit comes home, what was selected lit again as it stood, and a unit that can do nothing is grabbed and comes home just the same, without a word.

- `docs/META-SCREENS.md`, the paragraph "A panel holding more than its room shows scrolls". "the release lets it run on until it slows to a stop, and a key or the wheel stops it." becomes:

  > the release lets it run on until it slows to a stop, and a key, the wheel or a press landing on the panel stops it.

No player-facing sentence is foreseen: the line adds no text entry.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/META-SCREENS.md`.

**Scope:**

In:

- A press landing on a unit of the player's lights nothing, glows nothing and takes no path. Let go on the same tile it is the click it always was, and the selection brings the ring, the reach and the glow together. Held still while another unit is selected, that unit keeps its ring, its reach, its glow and its path.
- A unit carried lights and glows as its drag starts, the pointer past the drag slack, and not before. It wears no ring and the selection stands where it was; let go anywhere but a lit or glowed tile, what was selected is lit again as it stood. This is today's drag, later by the slack.
- A unit or a population coming home is not stopped by a press that lands on it: it goes on home under a press held still, and the start of a drag takes hold of it as of a thing standing. The reconcile chose the hand's form, where a card coming home already goes on under a press; the two become one.
- The three refusal notes, over the map, over the hand and over a window, move together from "any press takes it down as it lands" to the rule of the Spec. They stay one mechanism.
- The three pages' sentences.

Out, each decided with the user:

- The carry does not select the unit. A reach without its ring stands for the length of a carry and nowhere else.
- The hand's behaviour does not change: a lift already lets the hand's selection go. Only the pages change for it.
- The panel's fling caught by a press and the keys answering as they go down stay as they are; only the pages change for them.
- When a click or a drag acts does not change, nor does either of the two ways a click is told: an object's own, and the chronicle screen's for a tile and for beside the things.
- Tooltips, small cards and the kind label's bubble follow the pointer and no press, and are left alone.

Corner cases decided here:

- **Which note a press takes down.** The note that stood when the press landed, and no other. A note raised while a press is held, by that press's own release or by the other button's click during the hold, stands through that press's end.
- **A press that is neither a click nor a drag**, landed on one thing and let go on another inside the slack, takes the note down at its release.
- **Every let-go counts as the release**: off the canvas, under a scrim that rose, at a lost focus.
- **Either button.** A right press takes a note down as a left one does, at its release or as its pan starts.
- **What else takes a note down today stays**: a new selection, a note raised in its place, a render of the hand, a window closing.
- **The path** is the lit unit's: with nothing lit before the carry starts, none is drawn before it.
- **City mode** lights no unit, so only the population's coming home changes there.

Reconcile:

1. When a drag starts: every drag reads the one drag slack; the reach and the note go through it as it is.
2. A thing coming home, pressed: the unit's and the population's form becomes the card's.
3. A panel's fling caught by a press: one form, stays.
4. What takes a refusal's note down: one rule for the three notes, moved as one.
5. Keys: one door, as it is.

**Traps:**

- **A release reaches an object before its scene, and the chronicle screen's tile click comes after both.** Phaser emits an object's `pointerup` and then the scene's (`node_modules/phaser/src/input/InputPlugin.js:2041`, `:2069`), so a note a click raises from an object's handler, the hand's and a window's, already stands when the scene hears that release; the map's is raised from a microtask queued in the scene's `pointerup` (`src/ui/chronicle-scene.ts`), after it. A rule written as "whatever note stands at the release comes down" kills the first two and spares the third. The decided rule, the note that stood when the press landed, is the same for all three.
- **A press reaches only the scenes it is let through to; a release reaches every scene** (`docs/PHASER.md`, _Input across scenes_). The chronicle screen hands its own presses to the map's note for that reason, and the map's note must go on hearing a press that landed on the UI.
- **A move stopped by a scene above is withheld from the scenes beneath, but only while no button is held** (`docs/PHASER.md`, _Input across scenes_): a held press's moves reach every scene.
- **Phaser's own drag start is the primary button's alone**, and its slack is measured in device pixels (`docs/PHASER.md`, _The pointer's readings_). A right press's drag is read from the scene's moves through the slack helper in `src/ui/design-space.ts`, as the map's pan and the tree's do.
- **A release on the map relights the selection before the chronicle screen's click is told**, both inside one task, so no frame shows the gap. The order is the map's release first and the scene's microtask after (`src/ui/map-grab.ts`, `src/ui/chronicle-scene.ts`).
- **A mark coming home is a tween, and a drag writes its place each move**: the slide left running under a carry fights the pointer. It stops where the carry starts.
- **Under a spec** (`docs/PHASER.md`, _Under a Playwright spec_): a mouse move to where the pointer already rests is no move, a mouse step costs 115 to 230 ms under SwiftShader, and a spec rests before it presses or reads. A slide home lasts 150 ms, less than one mouse step on CI, so no spec can land a press inside it.

**Plan:**

1. The three pages, the sentences of the Spec. Leaves the design stating the rule.
2. `src/ui/map-grab.ts`, with `src/ui/map.ts` where it hands the grab what it needs. Leaves a press on the map drawing nothing as it lands: the reach and the glow come at the click or at the carry's start, and a mark coming home goes on until a carry takes it.
3. `src/ui/refusal-note.ts`, with `src/ui/chronicle-scene.ts` for the presses it hands the map's note. Leaves the three notes on the one rule.
4. `e2e/held-press.spec.ts`, new, with what it reads in `e2e/chronicle-screen.ts`; `e2e/refuse.spec.ts`, where the test titled "a press on the chronicle screen takes the refusal note down at once" presses with a whole click and still holds, its title reworded to the rule. Leaves the proof.
5. The board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/held-press.spec.ts`. It states, each through the gesture alone on a save built by the rules:
  - a press held on a unit of the player's lights and rings nothing, and its release rings the unit and lights its reach together;
  - a press held on a second unit of the player's leaves the selected one ringed and lit;
  - a unit carried lights its reach from the start of its drag and wears no ring, the selection standing, and let go beside the lit tiles leaves the selection lit as it stood;
  - a refusal's note stands through a press held still and comes down as it is let go;
  - a refusal's note comes down as a held press starts its drag, the button still down;
  - a second refused click on the same thing leaves its note standing.
- No spec states the coming home under a press, as none states a fling: the slide is shorter than a mouse step. The implementer's report says how it was checked.
- CI's on the push: `e2e/press.spec.ts`, `e2e/refuse.spec.ts`, `e2e/path.spec.ts`, `e2e/move.spec.ts`, `e2e/attack.spec.ts`, `e2e/map.spec.ts`, `e2e/map-order.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/unit-ring.spec.ts`, `e2e/deal.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/browse.spec.ts`.
