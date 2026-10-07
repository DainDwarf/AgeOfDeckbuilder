# The specs' play command is one helper

**Line:** The specs' play command is one helper — no spec builds a play command inline: a search for `type: 'play'` under `e2e/` hits `e2e/chronicle-screen.ts` alone; the lit-tile reader matches each glow to its tile by a key the glow carries, never by a position; and the player's units beside a tile are gathered by one helper in `src/rules/cards.ts` that both the per-unit refusal and the step card's refusal read.

**Spec:** none — the line reaches no design page and no player-facing sentence. The rules it touches keep their behaviour to the letter: every rules test passes unchanged, and no new rules test is added, the per-unit refusal's `not-beside` answer being already asserted in `src/rules/cards.test.ts`. The dogmas that are the spec: _Testing_ — a test never asserts a Phaser detail, a coordinate on screen among them; _Code_ — single source of truth for facts; _Testing_ — a fixture goes through the transform production uses.

**Doc-impact:** none — spec helpers and a rules-internal helper; no design page describes either.

**Scope:**

- In: the ten raw play commands across nine specs go through the shared spec file's play helpers. Eight are aimed at a tile (`campaign`, `ending` twice, `farm`, `map`, `settle`, `tree`, `victory`, `embark`), one of those naming the unit it is played through (`embark`'s second test); two are aimed at nothing (`calendar` inline; `press`'s own local helper, used seven times, which dies). The standing tile-aimed helper grows an optional unit to play through; a form aimed at nothing joins it. Every helper throws on a refusal, as the standing ones do: every one of the ten sites is followed by an assertion that the screen matches the played chronicle, so none wants a refused play kept, and a refused play silently kept would let that assertion pass against an unchanged oracle. Checked site by site at intake: the press spec's seven uses all compare to a played-out chronicle; the calendar's refused second copy is played on screen only and computed through no helper.
- In: the win on the capstone landing becomes one fixture. The shared file's `landed` answers the chronicle, the shelter's place in the hand, the tile and the won chronicle; `wonCampaign` reads from it; the five sites in `campaign`, `ending` (twice), `tree` and `victory` that rebuilt its body read from it too.
- In: each glow `glowTile` paints carries its tile key, and `litTiles` reads that key off each glow in place of matching the glow's x and y to a terrain face. Both glow groups, the unit's `lit` and the aim's `aim-lit`, are painted by that one function, so one key serves both. The target glows a selected unit paints over enemies stand in the same `lit` layer and keep being read: the archer spec reads enemy tiles from `litTiles`.
- In: one helper in `src/rules/cards.ts` answers the player's units beside a tile; the per-unit refusal (`throughRefusal`, which answers `not-beside`) and the step card's refusal (`stepped`'s `refuses`, which gathers the units that could step) both read it. Behaviour unchanged.
- Out: a spec's gesture, the screen's own play-out, any aim other than tile, unit and none. The unit-aimed helper stays as it is.
- Decided at intake: a key on a glow is the standing naming convention — the tile faces carry a name holding their key, the ring carries its key as data — not render code reshaped for a test; the reviewer does not raise it. Whether the glow carries the key as its name or as data is the implementer's; the reader reads whichever, and never a coordinate.
- Decided at intake: the helper's shape — one function with an optional unit, or two — is the implementer's; the raw command's type already carries the optional unit, so the standing private helper can take it.

**Traps:**

- `docs/PHASER.md`, _Under a Playwright spec_: a named object is found by walking every running scene, recursing into Layers and Containers; `window.named` answers the first of a name, so a glow named by its tile must not collide with the tile face's name `tile-<key>`, which specs click on.
- `litTiles` runs inside `page.evaluate`: it reads the glow's key in the page and returns keys sorted; nothing of the rules is importable there.
- `settle.spec.ts` counts the aim's glows through `marksIn(page, 'aim-lit')` and `city-mode.spec.ts` counts the unit's through `marksIn(page, 'lit')`: the glow groups keep their names and their child counts.
- The step card's refusal gathers the units beside the tile and then filters them by its checks in order, answering the tile's reason where no unit passes a check; the gathering alone moves to the shared helper, the filtering stays the card's.
- A comment block longer than three lines under `src/` or `e2e/` is flagged by a hook when an edit touches it; comments are for traps only.
- `wonCampaign` is read by eight specs that never play the win on screen (`collection`, `civilization-mode`, `manage-save`, `launch`, `launch-warning`, `pin`, `press`); its answer, the campaign, keeps its shape.

**Plan:**

1. `src/rules/cards.ts`: the helper answering the player's units beside a tile; `throughRefusal` and `stepped`'s `refuses` read it. `npm test` green, unchanged.
2. `src/ui/map.ts`: `glowTile` gives each glow its tile key. `e2e/chronicle-screen.ts`: `litTiles` reads the key off each glow and drops the terrain-face lookup.
3. `e2e/chronicle-screen.ts`: the tile-aimed play helper takes the optional unit played through; a helper aimed at nothing beside it; `landed` answers the index and the won chronicle too, `wonCampaign` reads from it.
4. The nine specs: each raw play command replaced by the helper's call, the five rebuilt win fixtures by `landed`'s answer, the press spec's local helper deleted. A search for `type: 'play'` under `e2e/` then hits the shared file alone.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/archer.spec.ts` — the one that reads `litTiles` and walks the glow key most directly.
- CI's on the push, listed at the hand-back, never run here: `campaign`, `ending`, `farm`, `map`, `settle`, `tree`, `victory`, `embark`, `calendar`, `press`, `city-mode`, and the eight that read `wonCampaign`.
