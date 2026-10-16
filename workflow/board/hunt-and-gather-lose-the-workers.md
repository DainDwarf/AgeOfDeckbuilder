# Hunt and Gather lose the "[Worker]'s"

**Line:** Hunt and Gather lose the "[Worker]'s" — Gather's text reads "Gain the tile's yield" and Hunt's reads "Remove deer or cattle. Gain 6 food", neither naming the worker.

**Spec:** `docs/INTERFACE.md` → _A card's names and its label_: a thing named in a card's text stands in brackets; the kind label's tooltip reads what the kind is. No sentence changes. Every worker action but these two names what it does to the tile and leaves the worker to the kind label, whose tooltip reads "Played through a worker, spending its action"; this line brings the two in line. The player-facing text, written out, as the two entries of the text table read after the change:

- Gather: `Gain the tile's yield`
- Hunt: `Remove [feature:deer] or [feature:cattle]. Gain 6[food]`

The bracketed deer, cattle and food marks stay as they are; only the `a [player:worker]'s` stretch goes from each, and the article with it.

**Doc-impact:** none — no `docs/` page quotes a card's text; `docs/ages/NOMADIC.md` describes Gather and Hunt in prose that stays true.

**Scope:** In: the two entries in the text table. Out: every other card's text, the kind tooltips, the rules, the tests. Decided here: Gather keeps no bracketed name at all once the worker's goes, so no hover or right click on its text shows anything, and that is accepted; Hunt keeps deer and cattle. The `6` stays literal in the entry, as it is today. Nothing in the tree does this job already; there was nothing to reconcile.

**Traps:**

- The glossary lint hook (`.claude/hooks/glossary-lint.cjs`) runs over the text table on commit; "tile", "yield", "remove", "deer" and "cattle" are glossary words, so the new strings need no exception marker.
- The text table's entries are read as runs (`src/ui/text-run.ts`): a `[kind:id]` is a name, a `[resource]` a glyph, and a `{name}` is substituted from counters. The new strings carry no brace.
- No test and no e2e spec asserts either string today, so nothing else moves with them.

**Plan:** One step. `src/ui/text.ts`: the two entries `rules.gather` and `rules.hunt` read the Spec's strings; `npm run check`, `npm test`, `npm run lint` pass; the board line is deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — the change is two strings no spec reads. CI proves the whole e2e suite on the push.
