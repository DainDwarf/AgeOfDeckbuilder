# The address loses its doors

**Line:** **The address loses its doors** — the boot reads no deck, age, region or seed from the address, which opens the chronicle the save holds on `continue` and the campaign screen on anything else; the specs that opened a new chronicle through the address open on a planted save, `e2e/boot.spec.ts`'s Launch test holds the chronicle it launched equal to the rules' launch on its seed, the three address tests are gone, and the `ui-check` agent and the `run` skill say how a chronicle is reached now.

**Spec:** `docs/INTERFACE.md`, the launch page's paragraph. Its address sentences:

> The address is the developer's door and the test suite's: one that names a deck opens the chronicle straight, on what else it names and the first of each list for the rest, a launch like any other; one that names `continue` opens the chronicle the save holds straight, and the boot fails where the save holds none; any other address boots on the campaign screen; and the chronicle screen writes nothing into the address. The launch screen replaces the page; the address stays.

become:

> The address is the developer's door and the test suite's: one that names `continue` opens the chronicle the save holds straight, and the boot fails where the save holds none; any other address boots on the campaign screen, whatever else it names; and the chronicle screen writes nothing into the address. The launch screen replaces the page; the address stays.

`docs/META.md`, the save's paragraph: the sentence "The address that opens a chronicle straight is a launch like any other, and the chronicle it opens is the one in progress." is deleted; nothing replaces it.

`.claude/agents/ui-check.md`, _What the app is_: from "The bare URL boots…" to "…writes nothing into the URL." becomes:

> The bare URL boots on the campaign screen, whose Chronicle button opens the launch page, which offers Continue while the save holds a chronicle; `?continue=1` opens the save's chronicle straight, and any other URL boots on the campaign screen. The launch page's Launch, or Enter, opens the chronicle screen — the map, the hand, the piles, the resource bar — on a new chronicle, on the seed typed on the page in digits or a fresh one; the same seed opens the same chronicle every time. The chronicle screen writes nothing into the URL.

The skeleton's `url` becomes `'http://localhost:5173/'`. _Reaching state that needs prior progress_, its second paragraph becomes:

> A new chronicle is reached from the bare URL: Chronicle on the campaign screen, the seed typed in digits, Enter; turns are played on the end-turn button. A chronicle further on is seeded by `page.evaluate` writing the save under the entry `SAVE_ENTRY` names in `src/ui/save-entry.ts`, then opening `?continue=1`.

`.claude/skills/run/SKILL.md`, step 5 becomes:

> 5. **Say what the address opens.** The bare address is the normal door: it boots on the campaign screen, whose Chronicle button opens the launch page, which offers Continue while the save holds a chronicle and launches a new one. `?continue=1` opens the save's chronicle straight; any other address boots on the campaign screen. The chronicle screen writes nothing into the address.

No player-facing sentence.

**Doc-impact:** `docs/INTERFACE.md`, `docs/META.md`.

**Scope:**

- In: `src/main.ts` reads `continue` alone; `?deck=`, `?age=`, `?region=` and `?seed=` are read by nothing, and an address naming any of them boots on the campaign screen like the bare one. `continue` stays, as it is, the boot failing on a save holding no chronicle.
- In: `openNew` in `e2e/chronicle-screen.ts` opens the chronicle `launchedOn(seed)` builds, planted as the save on the first region and deck and opened through `continue`, the capstone's window it opens under left standing as today — a resumed chronicle raises the same opening window a launched one does. Its six callers (`capstone`, `city-mode`, `reference`, `settle` twice, `resume`) keep their assertions.
- In: `e2e/boot.spec.ts`'s test "Launch opens the chronicle on the firsts, and the address stays bare…" asserts the chronicle the Launch press opened equal to `launchedOn(launched.seed)`, in place of its content, age and pile checks; the rest of the test stands. This is the one test that launches through the meta's screens, and what makes every planted spec's `launchedOn` stand for a launch. The seed is the one the launch page draws, never typed, so the test survives the launch screen choosing no seed.
- Out, deleted: `boot.spec.ts`'s "an address naming a deck boots into the chronicle…", `campaign.spec.ts`'s "an address naming no deck boots the campaign screen…", `continue.spec.ts`'s "continue named beside a deck the catalogue does not hold…". No test replaces them: a spec does not test for a door that does not exist.
- Out: the launch page and its seed row are untouched; `boot.spec.ts`'s console test typing a seed stands. The launch screen's rung drops the seed.

**Traps:**

- `plant` keeps the save through `page.addInitScript`, which runs again at every navigation of the page: a spec that opens through the new `openNew`, plays, then reloads through `continued` has its played chronicle overwritten by the fresh launch before the boot reads it. `e2e/resume.spec.ts`'s first test does exactly that and would fail on its `toEqual(stood)`. How the planted save survives the reload is the implementer's; the test keeps its assertion.
- `launchedOn` passes no technologies; the launch page passes the campaign's. The equality in the Launch test holds because the spec opens on a fresh profile, a new campaign holding none.
- `docs/PHASER.md` for the frame a spec rests before pressing; the existing helpers already rest.

**Plan:**

1. `src/main.ts`: the address reads `continue` alone; the choices the address named and the seed it asked are gone, and the boot opens the saved chronicle on `continue` and the campaign screen otherwise. `npm run check` stands.
2. `e2e/chronicle-screen.ts`: `openNew` opens on the planted launch, its doc comment saying so; the reload trap handled.
3. The specs: the three address tests deleted, the Launch test's equality in, anything left unused by them dropped from imports.
4. The docs pages, the `ui-check` agent and the `run` skill, as the Spec writes them.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof: `npx playwright test e2e/boot.spec.ts`. CI's, listed at the hand-back: `capstone`, `city-mode`, `reference`, `settle`, `resume`, `continue`, `campaign`.
