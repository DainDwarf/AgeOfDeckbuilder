# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The fixture's own script** — `src/rules/fixtures.ts` imports the default enemy script from `src/content/scripts.ts`, the one import of content under the rules; the fixture writes a trivial script of its own, and the tests that pinned the default script's routes are re-read as content tests.
- **A unit card's population through one door** — `enters` in `src/rules/cards.ts` decrements the population itself instead of going through `populationTaken`; either it goes through that door or the two rules, an idle population only and never the city's last against any population, are told apart on purpose.
- **The raid's door is a switch** — `raidEntry` in `src/rules/enemies.ts` picks the raid's door with a nested ternary over a closed two-member set, and only the camps-empty-to-ring direction is designed; the ring-empty-to-camps direction is decided and the branch becomes a switch.
- **A long-comment lint** — a hook on every edit under `src/` flags a comment block longer than three lines, advisory like the glossary lint, so the implementer sees a comment drifting into paraphrase the moment it writes one.
- **The design pages at altitude** — a Docs dogma says what a design page carries and what it never does: stand-in names, content detail, future implementation, history retold; the three design pages and the age page are re-read against it.
- **The screen page** — the "The screen" half of `docs/CHRONICLE.md` (the chronicle screen, the resource bar, the yield overlay) becomes a design page of its own, `docs/SCREEN.md`, the fourth the design pages name.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold. First playtest of the nomadic age: the enemy hits too hard; the settlement and the economy expand way too fast, so gathering is not much needed after a few turns — a victory on 74 food, 22 production, 15 culture — which leaves Hunger biteless and the camps' stocks useless as loot.
- **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then.
- **Card references** — a card named in another text is displayed like a link: hovering it shows a miniature of the card, inspecting it zooms on the card; the details come at intake.
- **Close v0.0.4** — the changelog entry and the tag.
