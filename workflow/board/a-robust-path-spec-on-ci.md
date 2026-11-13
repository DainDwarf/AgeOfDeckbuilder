# A robust path spec on CI

**Line:** **A robust path spec on CI** — `e2e/path.spec.ts`'s scout-path test presses no pan key and no zoom key, its click that is the step landing on the lit tile beside the scout, and passes locally, as it stands and with every frame stretched to 250 ms. Doc-impact: none.

**Spec:** no `docs/` page is the spec and none changes. The user's word, 2026-11-13, on the two options put to them (give the tap room by zooming closer, or drop the part): "Drop the key-pan test, it's too flaky for CI." That word is what `DOGMAS.md`'s _A test is never weakened to make it pass_ asks for: the proof that the path follows a key pan under a resting pointer is no longer promised by the suite. No player-facing sentence is foreseen.

**Doc-impact:** none — the game is untouched, and `docs/CHRONICLE-SCREEN.md`'s sentence "The path is the pointer's reading as any other: it stands under a pointer that never moved." stays as it is: the game still does it, and a design page is never edited down to what a spec proves.

**Scope:**

- In: the part of the scout-path test that zooms in by key, taps a pan key until another tile of the row stands under the pointer, and holds the path to that tile — removed whole, with everything in `e2e/path.spec.ts` that only it used.
- In: the test's last part, the click that is the step, kept. It followed the pan and took its tile from it; it now steps onto the lit tile beside the scout, the pointer brought to rest there and the path to it drawn before the click, as the lines that led into the pan already do. What it asserts is unchanged: the path gone with the click, the chronicle as the rules answer the move, the ring on the tile stepped onto, no path under the pointer resting on the scout's tile.
- In: the fixture search asking of a seed only what the test left standing uses — the far landing, and the lit tiles of the row the test still points at, none of them declaring war.
- Out: `src/`, every other spec, `e2e/chronicle-screen.ts` unless a helper there is left with no caller by this removal, and the other specs that press a pan key (they hold it until something moved and assume no distance).
- Out: any replacement proof of the pan — no closer zoom, no other way to move the map under the pointer.
- Corner case decided: every other part of the test stays word for word — selected on its own tile, the far landing, beside the tiles, the other lit tile, back on its own tile, the drag let go beside the tiles.
- Reconcile: the settled design is a removal and names no job to be done; nothing in the tree is a likeness.

**Traps:**

- Why it failed, so the removal is not mistaken for a game bug: a tap of a pan key carries the map as far as one frame lasted (`docs/PHASER.md`, the delta fact; 1200 design pixels a second). At the test's zoom a tile is 70 pixels wide and the pointer had 2.5 tiles of lit row ahead of it, so a frame of 150 ms or more put a dark tile under the pointer, where the game rightly keeps the path it had; the spec looked for the tile under the pointer among the row's four alone and expected the path to the last. CI's slowest runners draw a 167 ms frame (runs 43328720454 and 43412139467, shard 3).
- After the drag part the pointer stands beside the tiles with the path still on the far landing: the click is a bare press and release where the pointer rests, so the pointer must be on the lit tile, and its path drawn, before it.
- A slow runner is reproduced locally by a callback on `requestAnimationFrame` that spins until a number of milliseconds has passed and asks for the next frame, installed by one `page.evaluate` after `openSaved`. A frame on this machine is 67 ms unstretched; a spin of 180 ms measured 250 ms a frame. It is a throwaway for the one run the done-condition asks for and is not kept in the spec.
- The hook refuses a Playwright run that names no spec.

**Plan:**

1. `e2e/path.spec.ts` — the key-pan part out and the click part resting on the tile beside the scout: the test reads top to bottom with no key pressed.
2. `e2e/path.spec.ts` — what only the removed part used out: its constants, its helper, its imports, and the fixture search's demands the test no longer makes. `npm run check` and `npm run lint` find what is left over.
3. `workflow/BOARD.md` — the line deleted, and this file with it.

**Verify:**

- `npm run check`, `npm run lint`.
- The proof spec: `npx playwright test e2e/path.spec.ts`, once as it stands and once with the throwaway stretch at 250 ms a frame, both green; the stretch then removed.
- No pan and no zoom key left: `e2e/path.spec.ts` names neither `pan-` nor `zoom-in`.
- CI proves on the push: `e2e/path.spec.ts` alone, on whichever shard it lands.
