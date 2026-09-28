# Each screen holds its own console entries

**Line:** **Each screen holds its own console entries** — the chronicle screen, its ending screen among it, holds `seed` alone and with a number, `fog` and `uncharted`; the launch screen holds `seed` alone and with a number; the campaign screen holds no entry; a line the screen standing holds no entry for is answered `no such entry: <line>`, and the text table holds no `console.no-launch`; `e2e/console.spec.ts` proves it. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/INTERFACE.md`, _The debug console_, and `docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_.

In `docs/INTERFACE.md`, _The debug console_, the sentence "An entry is one word and Enter, with a number after it where the entry takes one, and it is answered in one line; a line the console holds no entry for is answered `no such entry: <line>`." becomes:

> An entry is one word and Enter, with a number after it where the entry takes one, and it is answered in one line; each screen holds its own entries, and a line the screen standing holds no entry for is answered `no such entry: <line>`.

In the same section, the **`seed`** paragraph becomes, whole:

> **`seed`** reads the seed and launches on one. Alone, it answers the seed of the chronicle standing on the chronicle screen, and on the launch screen the seed of the chronicle the save holds, or that there is no chronicle. With a number after it, it launches a chronicle on that seed: from the launch screen on the choices as they stand there, and from the chronicle screen on the choices the chronicle standing was launched on, whatever state that screen is in. The launch ends the chronicle the save holds, which pays nothing, and raises no warning: the console is the developer's door. The campaign screen holds no entry. A seed is a whole number, a minus before it or not, that a seed can hold; anything else after the word is refused in one line and launches nothing.

In `docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_, the opening "**The debug console switches the two veils that hide a tile**, one entry to each: `uncharted` and `fog`." becomes:

> **The debug console switches the two veils that hide a tile**, one entry to each, `uncharted` and `fog`, which the chronicle screen alone holds.

The text table loses `console.no-launch` (`no launch from this screen`). No entry is added and no other entry changes: every line a screen holds no entry for is answered by `console.no-entry`, `no such entry: {line}`.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- What each of the three screens holds, as the line says, and the answer to every line it does not.
- The removal of `console.no-launch` from the text table.
- The three doc edits of the Spec, verbatim.

Out:

- The console's look, keys, history and reset: unchanged.
- The veils themselves, what they draw and that a new chronicle puts both back on: unchanged.
- Any entry beyond the three the console knows today.

Corner cases, decided:

- **On the campaign screen every line is no entry**: `seed`, `seed 3`, `seed abc`, `fog` all answer `no such entry: <line>`, the trimmed line as typed.
- **`seed abc` on the launch screen or the chronicle screen** still answers `not a seed: abc`: those screens hold `seed` with a number, and what follows it is refused as the section says.
- **A switch followed by anything** stays a line no screen holds: `fog 3` on the chronicle screen answers `no such entry: fog 3`, as today.
- **`fog` or `uncharted` on the launch screen** answers `no such entry: fog` or `no such entry: uncharted` and switches nothing; the veils stand as they were.
- **The ending screen is the chronicle screen's**, drawn by the same scene: it holds all four, as it does today, and `seed` alone there reads the chronicle standing, ended or not.
- **Under the menu or one of its windows**, the screen standing is the one under it and holds what it holds.

**Traps:**

- The console is its own scene, started first and never stopped (`src/ui/debug-console.ts`); it outlives every screen. It learns what the screen standing holds only from that screen, which offers it at its `create` and takes it back at its shutdown; the console keeps no handle of a scene. `docs/PHASER.md`, _Across a restart_, is why.
- The veils live in the console and are put back on by `resetConsole`, which only the chronicle screen calls at its `create`. A switch refused on another screen must leave the veils untouched, the very object the line was given: the console reads that identity to know whether to tell the map (`src/ui/console-line.ts`).
- `src/ui/console-line.ts` is pure and has its Vitest file; what a screen holds reaches it as an argument, never by reading a scene. In `src/ui/`, `src/content/` is imported by a scene and by `src/ui/save-entry.ts` alone.
- Today the console throws when a line runs with no screen having offered anything; each screen now offers what it holds, the campaign screen its empty set among them, so that throw stays unreachable between frames.
- `DOGMAS.md` _Code_: what a screen holds is a closed set of entries; a site that branches on one is a `switch` with no `default`, or tests for the one member it answers.
- A local Playwright run names its spec; a hook refuses one that names none.

**Plan:**

1. `src/ui/text.ts` — `console.no-launch` gone.
2. `src/ui/console-line.ts` and `src/ui/console-line.test.ts` — a line is read against the entries the screen standing holds, and anything else is `no such entry: <line>`; the tests stand on the three shapes the screens hold — all four entries, `seed` alone and with a number, none — each a rule a person at the console could state: a switch the screen does not hold answers no entry and leaves the veils as they were, a screen holding nothing answers `seed` and `seed 3` alike with no entry, a screen holding `seed` with a number still refuses what is not a seed.
3. `src/ui/debug-console.ts`, `src/ui/chronicle-scene.ts`, `src/ui/launch-screen.ts`, `src/ui/campaign-screen.ts` — each screen offers what it holds, the campaign screen nothing.
4. `e2e/console.spec.ts` — the campaign test: `seed` and `seed 3` each answer `no such entry: <line>`, and no chronicle screen opens; the launch screen test: `fog` answers `no such entry: fog` before the launch, the rest of it as it stands.
5. `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md` — the three edits of the Spec, verbatim.
6. `workflow/BOARD.md` — the line deleted, this file with it.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/console.spec.ts`.
- CI's, on the push, listed for the hand-back: `e2e/fog.spec.ts`, `e2e/camps.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/launch.spec.ts`, `e2e/campaign.spec.ts`.
