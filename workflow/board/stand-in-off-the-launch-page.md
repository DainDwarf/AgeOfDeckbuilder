# Remove the stand-in content from the throwaway launch page

**Line:** Remove the stand-in content from the throwaway launch page — the launch page offers the stand-in catalogue among its content choices, and a player should not meet it. Done when: the bare address's launch page lists the Nomadic content alone on its content row; an address naming the stand-in content and no deck opens the page with the stand-in listed on that row and chosen; an address naming the stand-in and a deck still opens its chronicle straight; `e2e/boot.spec.ts` proves the first two; `docs/INTERFACE.md` says so.

**Spec:** `docs/INTERFACE.md` → _The launch page 🔧_. After the sentence ending "…which opens the chronicle on those choices; Enter presses it too." insert, as its own sentence in the same paragraph:

> The rows list the ages' content alone; content only the address names is listed beside it while the page stands.

The rest of the paragraph stands as written. No player-facing text is added or changed: the content row's faces read the catalogue's version as they do today.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: the launch page's content row lists the catalogues a player may meet — today the Nomadic content alone — and not the stand-in.
- In: the stand-in stays in the game and reachable through the address exactly as now; every e2e spec reaches it that way (`?content=stand-in&deck=…`), and none of that changes. It is not taken out of the player build.
- In: an address that names content the page does not list (the stand-in) and no deck opens the page with that content listed on the content row, after the listed ones, and chosen, with its firsts on the other rows as today. It stays listed for as long as that page stands, including after the player presses another content and back.
- Out: hiding a row that holds one choice. Every row keeps showing even with a single option; the layout does not change.
- Out: the default content. The bare address already defaults to the Nomadic content, first in the list; that stays.
- Corner case: the stand-in's coherence test (`src/content/stand-in.test.ts`) builds the stand-in directly, not through the catalogue list, so it is untouched; `catalogueOf` must still resolve the stand-in for the address.

**Traps:**

- `CATALOGUES` in `src/content/catalogues.ts` serves three readers: the page's content row, `catalogueOf` (the address's resolution, used by `src/main.ts` and by the page's `choose`), and `CATALOGUES[0]` as the default in `src/main.ts`. Only the first reader changes; the address must still resolve the stand-in, and the default must stay the Nomadic content.
- DOGMAS → _A design page is at altitude_: no page names a stand-in's content. The `docs/` sentence says "content only the address names", never "the stand-in"; a code comment is held to the same rule only where it would be a doc — comments are for traps only.
- A face on the content row is named `launch-content-<version>` (`src/ui/launch-page.ts`); the spec reads the row through those names with `standing` from `e2e/chronicle-screen.ts`, after `readNames`. A face's `chosen` data says whether it is chosen.

**Plan:**

1. `src/content/catalogues.ts` and `src/ui/launch-page.ts`: the page's content row lists the player's catalogues, plus the catalogue the page opened on where the list lacks it; the address's resolution and default are unchanged. Leaves the page right from both addresses.
2. `e2e/boot.spec.ts`: extend the bare-address test, or add one beside it, so the bare address's launch page stands `launch-content-nomadic` and not `launch-content-stand-in`; add a test where `/?content=stand-in` (no deck) opens the launch page with `launch-content-stand-in` standing and chosen, logging nothing.
3. `docs/INTERFACE.md`: the sentence above.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/boot.spec.ts`. CI proves the whole suite on the push — every spec that opens on `?content=stand-in&deck=…` (through `open` in `e2e/chronicle-screen.ts`) proves the address still reaches the stand-in.
