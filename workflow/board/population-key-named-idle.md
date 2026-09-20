# The population key is named idle

**Line:** The population key is named idle — `label.idle`, `tooltip.idle` and the bar's `Reading` member `'idle'` hold the word, the assigned mark's colour stands outside the readings' table under population's own name, and `docs/CHRONICLE-SCREEN.md` names the reading idle. Doc-impact: `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/CHRONICLE-SCREEN.md`, two sentences, under **City mode** and under the resource bar's paragraph.

Under city mode, in the sentence beginning "It is entered by the **city key**", `or by pressing culture or population on the resource bar` becomes:

> or by pressing culture or idle on the resource bar

In the resource bar's paragraph, the second sentence becomes:

> Culture and idle are the two readings that enter city mode, and each fills its well in the accent while city mode has that act waiting: culture's while the stock covers the culture threshold and a tile the city may claim stands, idle's while one population is idle and a tile the city holds has nobody on it, its own tile and an occupied one no exception.

The paragraph's first sentence — "and the idle population alone, under the word idle" — stands unchanged: it still says what the reading reads and what word stands over it.

No player-facing text changes. `'label.population': 'Idle'` and `'tooltip.population': 'Idle population. Assign to tile or turn into units.'` keep their values verbatim; only their keys move to `label.idle` and `tooltip.idle`. `refusal.idle` already exists and does not collide — a different prefix, a different string.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`. `CHANGELOG.md` is skipped: a rename sweep never touches it. `docs/GLOSSARY.md` needs nothing — it already holds both **population** and **idle**, and this line changes neither row.

**Scope:**

In — the bar's reading key, everywhere it is spelled:

- `src/ui/look.ts`: the `Reading` type's non-resource member.
- `src/ui/text.ts`: `label.population` → `label.idle`, `tooltip.population` → `tooltip.idle`, values unchanged.
- `src/ui/resource-bar.ts`: the readings list, the city readings, the well's latch test, what the reading reads, and the waiting set.
- `src/ui/map.ts`: the assigned mark's colour, and the comment above it.
- `e2e/city-mode.spec.ts`: three `click(page, 'reading-population')`, three `wellFill(page, 'population')`, and the three test titles that name the reading population (the two that call it a press on culture or population, and the one that opens "population's well fills…").
- `e2e/play-out.spec.ts`: the `population` key of the expected readings map.

In — the colour, decided here. The greyish `0x6b6b7d` is **population's** colour, not idle's: the bar's chip wears it because idle is population, and the map's assigned mark wears it because assigned population is population too. It therefore leaves `LOOK.reading` and stands as a role of its own in `Look`, named `population`. `LOOK.reading` narrows to exactly the six resources, which is what `RESOURCES` already holds, and the map's assigned mark draws from the new role. The value does not change. This keeps the interface page's rule true — a mark wears the colour the thing it marks is known by — and lets the chip and the mark diverge later without dragging each other.

Out — **the rules' change name `population` stays.** The board line named "the piles' change switch" as a third site; it is a different `population`. That switch is over the change names in `src/rules/stages.ts`, where `population` names the population row of the chronicle moving — the city grows, a unit card takes one, hunger kills one. All three are population changes in the glossary's sense and none of them is about idle. The same case appears in the hand's and the map's change switches; none of the three is touched. `DefeatCause`'s `'population'`, `Block`'s `'population'`, `chronicle.population` and `refusal.population` are all correctly named too and stand.

Out — the tooltip's wording, the chip's colour value, and anything the player sees. Nothing on screen changes.

**Traps:**

- The bar names its Phaser objects from the key — `reading-<key>`, `reading-<key>-value`, `reading-<key>-floor`, `reading-<key>-well` — so renaming the key renames the e2e hooks. `e2e/city-mode.spec.ts` and `e2e/play-out.spec.ts` are the two specs that reach for them; no other spec does.
- `src/ui/resource-bar.ts` looks a chip's colour up by reading key. Once population's colour is out of `LOOK.reading`, that lookup no longer covers every reading and the idle chip has to reach the new role. Where that branch lives is the implementer's call.
- `LOOK.reading` is also read by `src/ui/card-face.ts`, `src/ui/infopanel.ts` and the map's yield and threshold glyphs — all of them by a `Resource`, never by `'population'`. Narrowing the record to `Resource` leaves them untouched.
- `src/ui/look.ts` keeps roles that agree on a value today as separate entries, by its own comment. Two entries holding `0x6b6b7d` would be that shape; this line instead keeps one, because the chip and the mark name the same thing. Do not also add a second.
- Prose in `src/ui/map.ts` and `e2e/city-mode.spec.ts` uses the word population correctly in many comments — the tiles the population stands on, one population carried by a drag. Those are the glossary's population and stay. Only the bar reading's spelling moves.
- `docs/CHRONICLE-SCREEN.md` is one paragraph per line; the two edits are inside long lines. Prettier unwraps markdown, so the lines stay unwrapped.

**Plan:**

1. `src/ui/look.ts` — `Reading`'s non-resource member is `idle`, and the colour moves out of the readings' table into its own role under population's name. Leaves the file compiling for every reader that indexes by `Resource`; the bar and the map break here.
2. `src/ui/text.ts` — the two keys, values untouched. Leaves the text table with no `label.population` or `tooltip.population`.
3. `src/ui/resource-bar.ts` — every spelling of the key, and the chip's colour reaching the new role. Leaves the bar building and reading exactly as before, under the new names.
4. `src/ui/map.ts` — the assigned mark's colour and its comment. Leaves `npm run check` clean.
5. `e2e/city-mode.spec.ts` and `e2e/play-out.spec.ts` — the object names, the `wellFill` keys, the readings map's key, and the three titles. Leaves both specs green.
6. `docs/CHRONICLE-SCREEN.md` — the two sentences above.

**Verify:**

- `npm run check`
- `npm test`
- `npm run lint`
- `npx playwright test e2e/city-mode.spec.ts`
- `npx playwright test e2e/play-out.spec.ts`

Both specs run: the line rewrites the object names both walk. No `ui-check` run — nothing on screen changes, and the specs already assert the well's fill colour and every reading's painted value.
