# The end of turn's reading stays up through a play

**Line:** The end of turn's reading stays up through a play — a card played, a city act or a unit's move or attack leaves the resource bar's small signed readings standing through its play-out, each reading what the rules read on the chronicle the screen shows at that moment; the End turn press and a deal's choice take them down until the screen stands on the next hand. Doc-impact: `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/CHRONICLE-SCREEN.md`, _The resource bar_, the paragraph beginning "After each value". Its last sentence today reads:

> It stands on every turn the screen stands on, never on the settle phase nor while a deal stands, and is down from the End turn press until the screen stands on the next hand.

It becomes:

> It stands on every turn the screen stands on, never on the settle phase nor while a deal stands, and is down from the End turn press until the screen stands on the next hand, the choice in a deal's window and what plays out after it included; every other play-out leaves it standing, and it changes with each change that lands, as the value does.

No player-facing text entry changes: the readings keep their words and their colours.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In: the chronicle scene stops telling the bar it is dead for every play-out. The bar is dead for the play-out of the `end-turn` command and of the `take` command alone, from the press until the screen stands on the chronicle the play-out leaves; every other play-out, the debug console's entering a unit included, leaves the bar live, so its reading re-reads the chronicle the bar draws at each change that lands.

Out: the hand's gate and the End turn button's gate, which stay shut for every play-out as today. The rules: `reckoned` already reads nothing while a deal stands or on the settle phase, and is not touched. Bringing the reading up at the draw, mid end-of-turn, instead of at the end of the play-out: declined.

Corner cases decided here:

- A card that pays a stock and then lays a mark changes the paid stock's value at the pay, and the mark's resource's reading at the mark, each as its change lands. That is the design, not a flicker.
- A deal's choice: while any deal's window stands the rules read nothing. A camp's reward taken resumes the end of turn at its opening, the tick and then the draw; between them the hand is empty and a live reading would read the income with no strike counted, for the span of the draw's card flight. So `take` keeps the bar dead. An event's answer taken lands enemies and then nothing; its play-out keeps the bar dead too, for one rule over both windows.
- The capstone's window at its landing holds the end-turn play-out open until it closes; the bar stays dead through it, as today.
- A play-out let go of (a new chronicle launched from the console, a unit entered) stands the screen on the chronicle it leaves and tells the bar live there, as today.
- A refused command plays out a group holding nothing; the bar stays live and its reading stands unchanged.

Reconcile: the one likeness is the gate the scene shuts on the hand, the button and the bar together at the start of every play-out. The bar keeps that door and gets it shut for the end of turn's two commands alone; the hand's and the button's stay as they are. A difference that is meant: the bar's reading is right on the chronicle a card's play-out passes through and wrong on the chronicles the end of turn passes through, while a card hovered or a press under a play-out would kill the tweens the stages wait on whatever the command.

**Traps:**

- The scene renders a part at every settled change of a play-out where that part answered the stage with no motion, and the bar answers every stage of a card's, a unit's and a city's play-out with none. So once the bar is live through such a play-out, its reading follows each change for free: the bar's `render` already re-reckons on the chronicle it is handed. Nothing in the bar needs to know which command is playing; the scene does.
- The chronicles the end of turn's play-out passes through give wrong readings read literally: after the income lands, the income again with the strikes still in hand counted a second time; after the discard, the income alone. That is why the bar is dead for `end-turn` and `take`. The comment over the bar's reckoning says this today in different words and is re-shaved to this trap, three lines at most.
- The bar's own motion, the readings ticking under the income and grow groups, claims the stages under those groups so no render snaps them back; both groups come only in the end of turn, where the bar is dead, so nothing there changes.
- The hand and the button are dead for the whole of every play-out, and a spec that presses either straight after a gesture presses nothing; `e2e/chronicle-screen.ts` has `playedOut` for that wait. The spec rests before it presses or measures what just changed, per `docs/PHASER.md`.
- The standing spec's second test reads the readings midway through the end of turn with one `waitForFunction` that fires once the scene is playing and the stocks have moved from where they stood; the new test takes the same shape for a card's play-out, and asks for the readings and the scene's chronicle in that one question, so both are of one frame. The chronicle the screen shows mid play-out is the scene's `chronicle` getter, which moves on with each settled stage.
- Playing a card on screen, in a spec, is two clicks on the card's hand face; the hand specs show the pattern and the helpers in `e2e/chronicle-screen.ts` judge which card the hand holds and whether the city can play it. The card played must move a stock, so the midway question has a change to fire on: a card with a cost does.
- `reckoned` returns nothing where the end of turn would run none, so a reading that is empty by the rules reads as the empty string; the new test asserts equality with the rules' reading, never "not empty".

**Plan:**

1. `src/ui/chronicle-scene.ts` — the play-out tells the bar it is dead only when the command it plays is `end-turn` or `take`, and tells it live when the screen stands, as today; the debug console's entering and every other command leave it live. Leaves standing: a card played keeps the readings up, each re-read at each change that lands; the end of turn still blanks them.
2. `src/ui/resource-bar.ts` — the comment over the reckoning re-shaved to the end of turn's trap; no behaviour change.
3. `docs/CHRONICLE-SCREEN.md` — the sentence under _Spec_.
4. `e2e/end-of-turn-reading.spec.ts` — a third test: a card of the hand played on screen, and midway through its play-out, once a stock has moved, the readings read what the rules read on the chronicle the screen shows at that moment; once the play-out has ended, the readings read the rules' reading of the chronicle that stands. The two standing tests stay as they are.
5. `workflow/BOARD.md` — the line deleted; this file deleted with it.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- The proof spec: `npx playwright test e2e/end-of-turn-reading.spec.ts`.
- CI's on the push, never run locally: `press.spec.ts`, `pointer-sweep.spec.ts`, `console.spec.ts`, `broken-motion.spec.ts`, and the specs that read the bar — `ending.spec.ts`, `collection.spec.ts`, `wildfire.spec.ts`, `bad-air.spec.ts`, `strangers.spec.ts`, `manage-save.spec.ts`, `resume.spec.ts`, `campaign.spec.ts`, `civilization-mode.spec.ts`.
