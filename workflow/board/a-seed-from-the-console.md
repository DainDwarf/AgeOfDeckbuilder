# A seed from the console

**Line:** **A seed from the console** — at the debug console, `seed` answers the seed of the chronicle standing, or of the one the save holds where none stands, and `seed <number>` launches a chronicle on that seed, from the launch screen on the choices as they stand and from the chronicle screen on the choices its chronicle was launched on; `e2e/console.spec.ts` proves both doors against the rules' own launch on that seed. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`, _The debug console_. `docs/META-SCREENS.md`, _The launch screen_, stays as it is: Launch still opens on a seed drawn fresh at every launch. `docs/DESIGN.md`, _Launching a chronicle_ and _Scope_, stay as they are.

In _The debug console_, the sentence "An entry is one word and Enter, and it is answered in one line; a word the console holds no entry for is answered `no such entry: <word>`." becomes:

> An entry is one word and Enter, with a number after it where the entry takes one, and it is answered in one line; a line the console holds no entry for is answered `no such entry: <line>`.

And one paragraph is added after the section's paragraph:

> **`seed`** reads the seed and launches on one. Alone, it answers the seed of the chronicle standing on the chronicle screen, and on any other screen the seed of the chronicle the save holds, or that there is no chronicle. With a number after it, it launches a chronicle on that seed: from the launch screen on the choices as they stand there, and from the chronicle screen on the choices the chronicle standing was launched on, whatever state that screen is in. The launch ends the chronicle the save holds, which pays nothing, and raises no warning: the console is the developer's door. From the campaign screen it launches nothing and says so. A seed is a whole number, a minus before it or not, that a seed can hold; anything else after the word is refused in one line and launches nothing.

The console's lines, each one entry of the text table, written out; the debug console is not player-facing, so none of its words is a glossary question and `docs/GLOSSARY.md` takes no row for seed:

| When | The answer |
| --- | --- |
| `seed`, a chronicle standing or held | `seed: {seed}` — the number as the save holds it, the minus included |
| `seed`, no chronicle standing and none held | `no chronicle` |
| `seed <number>` on the campaign screen | `no launch from this screen` |
| `seed <anything that is not a seed>` | `not a seed: {typed}` — what stood after the word, as typed |

A launch answers no line: the new chronicle closes the console and clears its lines, as the section already says.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

In:

- The entry `seed`, alone and with a number, on every screen the console stands on.
- The launch through it from the launch screen and from the chronicle screen.
- The four lines above in the text table.
- The `docs/INTERFACE.md` edit.

Out:

- Any reading of the seed on a screen: the console is the one place it is read.
- The warning a launch raises over a chronicle with achievements reached: it is not built, and the console never goes through it.
- The export and import of saves, a line of its own on the board.
- Any use of the entry by a spec to reach a state: a spec builds its chronicle headlessly and boots on the save it wrote, as `DOGMAS.md` _Testing_ says. The one spec that types `seed` is the one that proves the entry.

Corner cases, decided:

- **What is a seed.** Digits, with an optional minus before them, naming a whole number within what a seed holds, a signed 32-bit integer. Refused with `not a seed: {typed}`: a word, a fraction, a plus sign, a number out of that range, two numbers, an empty sign. A number out of range is never wrapped into one in range: it would launch on a seed nobody typed.
- **Zero with a minus** is the seed zero.
- **A refusal wins over the screen**: `seed abc` on the campaign screen answers `not a seed: abc`.
- **A number after an entry that takes none** is a line the console holds no entry for, as today: `fog 3` answers `no such entry: fog 3`.
- **From the chronicle screen the launch goes through in every state**: under the menu or one of its windows, under a window of the overlay, while a command plays out, on the ending screen. On the ending screen the save holds no chronicle any more and the screen still holds the choices it was launched on; the launch is on those.
- **`seed` alone on the ending screen** reads the chronicle standing there, ended or not.
- **The civilization's deck is the campaign's as it stands at the launch**, as at any launch; the map depends on the age, the region and the seed alone, so a deck that differs from the playtester's deals the same map.
- **The veils are back on and the console closed** after a launch, as after any new chronicle.
- **The address stays bare** through a launch from the console, as through Launch.

**Traps:**

- `docs/PHASER.md`, _Scenes and stacking_: every scene-plugin call is queued, in order, and a scene with nothing to load runs `create` inside its start. The chronicle screen reaches into the map scene as it is created, so the map is started ahead of it, and the overlay is put ahead before either; the launch screen's own opening of the chronicle screen is the order to keep.
- `docs/PHASER.md`, _Across a restart_: the console outlives every screen. A handle it took of a screen at one point is stale after that screen restarts; it reaches a screen through the scene manager by key at the moment the line is run, or the screen subscribes while it is up through the one door the veils already use.
- The chronicle screen in the middle of a play-out has a sequence running and tweens in the air; leaving it for the campaign screen shows what is let go of first. A launch over it lets go of the same.
- A seed drawn fresh is the one place entropy enters the game, in `src/ui/chronicle-scene.ts`; a seed typed is the one place a launch has none. `src/rules/` draws only from the seed it is handed, and the comment on that place stays true.
- `src/rules/rng.ts` folds the seed it is handed into a signed 32-bit integer, so two numbers that fold alike deal one map under two seeds; the refusal of a number out of range is what keeps a seed in the save the seed that was dealt on. A negative zero is kept out of the chronicle: a spec's whole-chronicle equality and the save's text tell it from zero.
- `src/ui/console-line.ts` is pure and has its Vitest file; a line that threw no switch hands back the very veils it was given, and the console reads that identity to know whether to tell the map.
- In `src/ui/`, `src/content/` is imported by a scene and by `src/ui/save-entry.ts` alone: a piece that reads a line receives what it needs as arguments.
- The launch screen's choices as they stand live inside that scene's `create`; nothing outside it reads them today.
- A local Playwright run names its spec; a hook refuses one that names none.

**Plan:**

1. `src/ui/text.ts` — the four lines stand in the text table.
2. `src/ui/console-line.ts` and `src/ui/console-line.test.ts` — a line is read as the entry `seed`, alone or with what follows it, and what is not a seed is refused; the reading stays pure, with a test for each rule a person at the console could state: a seed read, a seed asked for, what is not a seed refused, a number after a switch still no entry.
3. `src/ui/debug-console.ts`, `src/ui/chronicle-scene.ts`, `src/ui/launch-screen.ts`, `src/ui/save-entry.ts` where the opening's shape lives — the console answers the seed of the chronicle standing or held, and a launch from either screen opens the chronicle screen on the choices and the seed typed, kept as the save; the campaign screen answers its line.
4. `e2e/console.spec.ts`, with `e2e/chronicle-screen.ts` for a helper two specs would share — the tests below.
5. `docs/INTERFACE.md` — the two edits of the Spec, verbatim.
6. `workflow/BOARD.md` — the line deleted, this file with it.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/console.spec.ts`. It gains: from the launch screen, opened the way the boot opens it, `seed <number>` opens the chronicle screen on the chronicle the rules launch on the screen's choices and that seed, the console closed; from a chronicle opened on the save a spec wrote, `seed` answers that chronicle's seed, and `seed <another number>` leaves standing the chronicle the rules launch on the same choices and the other seed, which the save then holds; on the campaign screen `seed <number>` answers its line and no chronicle screen opens. Every chronicle is compared whole, its oracle the rules' launch, never a literal of the map.
- CI's, on the push, listed for the hand-back: `e2e/boot.spec.ts`, `e2e/launch.spec.ts`, `e2e/continue.spec.ts`, `e2e/resume.spec.ts`, `e2e/menu.spec.ts`, `e2e/campaign.spec.ts`, `e2e/controls.spec.ts`, `e2e/refused-save.spec.ts`, `e2e/fog.spec.ts`, `e2e/camps.spec.ts`, `e2e/city-mode.spec.ts`.
