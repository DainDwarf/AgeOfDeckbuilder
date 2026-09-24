# Remove the stand-in content from the throwaway launch page

**Line:** Remove the stand-in content from the throwaway launch page — the launch page's content row lists the ages' content alone, the stand-in stays reachable through the address, and `docs/INTERFACE.md` no longer describes the launch page; `e2e/boot.spec.ts` proves the row.

**Spec:** The launch page is a throwaway stand-in for v0.0.5's launch screen and has no design page. Decided at intake:

- The content row lists the ages' content alone — today, the Nomadic catalogue. The stand-in catalogue is never among the choices the page offers on its own.
- The stand-in stays in the game and is reached through the address, as the e2e suite already does (`?content=stand-in&deck=…`). It is not cut from the player build.
- An address naming content the page does not list, with no deck (so the page opens rather than the chronicle), opens the page with that content listed in the content row and chosen, as it would any other named choice. It stays listed for as long as the page stands, even after the player presses another content.
- Every row is kept even when it holds one choice (after this line, all four do): the rows say what the chronicle launches on, and the layout does not change.

`docs/INTERFACE.md` stops describing the launch page, since the page is throwaway. The edits, written out:

- The blockquote at the top: `How any screen is worked: the menu and what it lists, the keys and how they are rebound, the launch page, a failed boot, the debug console, …` loses `the launch page, `.
- _The menu_: `The **Menu** button stands on every screen, the launch page among them, and opens the menu over whatever stands;` becomes `The **Menu** button stands on every screen and opens the menu over whatever stands;`.
- The section `## The launch page 🔧` and its paragraph are deleted whole, the address paragraph with it.
- _The debug console_: `a dark panel down the top of the screen, on every screen, the launch page among them, with the last lines run above the line being typed` becomes `a dark panel down the top of the screen, on every screen, with the last lines run above the line being typed`.

No player-facing sentence is added: no text-table entry changes.

**Doc-impact:** `docs/INTERFACE.md` — the four edits above.

**Scope:** In: the content row's list, the address-named exception, the `INTERFACE.md` edits, the proof in `e2e/boot.spec.ts`. Out: the page's layout, the address's behaviour (unchanged: a deck opens the chronicle straight, anything else opens the page with its choices picked), any build-time switch, the harness files that already describe the address door (`.claude/agents/ui-check.md`, `.claude/skills/run/SKILL.md` — still true, untouched). Corner cases: an address naming the stand-in with no deck shows the stand-in chosen, and listed beside Nomadic; an address naming nothing opens on Nomadic, with the row listing it alone.

**Traps:**

- `catalogueOf` in `src/content/catalogues.ts` must keep resolving the stand-in: `src/main.ts` resolves the address through it, and every e2e spec opens its chronicle through `?content=stand-in` (`e2e/chronicle-screen.ts:191`, `e2e/boot.spec.ts:25`). Only what the page offers narrows; what the game holds does not.
- `CATALOGUES`'s doc comment says it is "in the order a launch lists them", and the address default is `CATALOGUES[0]`. Whatever the page lists from now on, that comment has to say the truth, and the default must stay Nomadic (`boot.spec.ts`'s _Launch opens the chronicle on the defaults_ asserts it).
- Pressing a content re-lays the page from that catalogue's firsts (`choose` in `src/ui/launch-page.ts`). The content row's list must be computed from what the page opened on, not from the current choice, or an address-named catalogue vanishes the moment another is pressed.
- The DOGMAS catalogue coherence test covers every catalogue the game ships; the stand-in still ships, so its test stands untouched.
- `docs/PHASER.md` needs no citation: nothing here touches scene order or input.

**Plan:**

1. `src/content/catalogues.ts` and `src/ui/launch-page.ts`: the page's content row lists the ages' content, plus the catalogue the page opened on where it is not among them. Leaves the bare address offering Nomadic alone, and the address still reaching the stand-in.
2. `e2e/boot.spec.ts`: from the bare address, the page stands with `launch-content-nomadic` chosen and no `launch-content-stand-in`; from `/?content=stand-in`, the page stands with `launch-content-stand-in` chosen. One new test or an extension of _the bare address boots the launch page and logs nothing_: the implementer's call.
3. `docs/INTERFACE.md`: the four edits in _Spec_, verbatim.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec is `npx playwright test e2e/boot.spec.ts`. CI proves the rest on the push: the whole e2e suite, every spec of which opens its chronicle through the address on the stand-in.
