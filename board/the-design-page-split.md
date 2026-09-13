# The design page split

**Line:** The design page split — `docs/DESIGN.md` keeps the pitch, `docs/INTERFACE.md` holds how any screen is worked, `docs/CHRONICLE.md` holds what exists only inside a chronicle, every moved paragraph lands verbatim, and every reference to the spec names the design pages. Doc-impact: DESIGN.md, INTERFACE.md, CHRONICLE.md, index.md, DOGMAS.md, ROADMAP.md, CLAUDE.md.

**Spec:** the decision is that the design is cut by scope into three pages, together **the design pages**: what the game is, how any screen is worked, and what exists only inside a chronicle. The meta gets a page when v0.0.5 designs it, and a card as shared content gets one when the deck becomes data; neither exists now, so neither page does. Inside the chronicle page the rules come first and the screen that shows them after. Prose moves verbatim, paragraph by paragraph; the only sentences that change are written out below, and the only new sentences are the three preambles and the index entries, written out below.

`docs/DESIGN.md` keeps its title, the legend and the whole `## Pitch` section with its four `###` headings unchanged, and loses `## Interface` and `## Systems` entirely. Its preamble becomes, the legend line first:

```markdown
> Status legend, for every design page: ✅ decided · 🔧 provisional (a stated default, open to change). An open question is not a status — it is a [`BOARD.md`](../BOARD.md) line whose done-condition is the decision.

The game in broad strokes: what it is, what it deliberately is not, and how a chronicle and the meta fit together. How any screen is worked is [`INTERFACE.md`](INTERFACE.md); what exists only inside a chronicle is [`CHRONICLE.md`](CHRONICLE.md). A standing decision carries one line of rationale, and only when the rejected alternative is attractive enough that a future session would plausibly redo it. When a decision is overturned, the page changes in the same unit of work; it never keeps the old version.

The three are **the design pages**, and they are the **spec**. Code that disagrees with them is wrong; a gap found during implementation is reported as a deviation, never closed by editing a page down.
```

`docs/INTERFACE.md`, new, title `# Interface`, preamble:

> How any screen is worked: the menu and what it lists, the keys and how they are rebound, the debug console, and the three presses. A design page, under [`DESIGN.md`](DESIGN.md)'s legend and rule: the spec, never edited down to match the code. What a press does to a thing only a chronicle has is [`CHRONICLE.md`](CHRONICLE.md)'s.

Then, as `##` headings with their ✅: **The menu** — the section's first three paragraphs (the menu, the back key, Controls); **The debug console** — the section's fourth paragraph, the one beginning "The **debug console** is a dark panel"; **The presses** — the whole section. Two sentences change in the move, so that the deal window's exception is stated once, on the chronicle page, where the deal paragraph already holds it in full:

- In The menu's back-key paragraph, "and raises the menu only from a clean screen — or from the events phase's deal window, which closes on nothing but the take." becomes "and raises the menu only from a clean screen."
- In The presses' back-key paragraph, the sentence "Every window goes back this way but the events phase's deal window, which closes on nothing but the take and raises the menu where this order would have closed it." is deleted; the paragraph is its first sentence alone.

`docs/CHRONICLE.md`, new, title `# Chronicle`, preamble:

> What exists only inside a chronicle: first the rules the city lives by, then the screen that shows them. A design page, under [`DESIGN.md`](DESIGN.md)'s legend and rule: the spec, never edited down to match the code.

Then `## The rules`, holding as `###` with their ✅, in this order and verbatim: The turn, Sight, Cards, Population, The map, Units and combat, Events and the capstone. Then `## The screen`, holding as `###` with ✅: The chronicle screen, The resource bar, The yield overlay. Four passages leave a rules section for the screen:

- Sight's paragraph beginning "**The debug console switches the two veils that hide a tile**" and the paragraph after it beginning "**The rest of the screen reads what the map draws.**" leave Sight, in that order, and land in The chronicle screen directly after the paragraph beginning "**The ring stands undarkened over everything that darkens its tile**".
- Population's sentence "In city mode the map marks the assigned tiles and dims the held ones that are not." leaves its first paragraph and lands as a one-sentence paragraph of its own directly after the chronicle screen's city-mode paragraph, the one beginning "In **city mode** a left click on a tile selects it as anywhere else" and ending "takes the city key instead."
- Population's sentence "The resource bar reads population as the idle inhabitants over all of them, and food as the stock over the growth threshold." leaves its second paragraph and is the whole of the new `### The resource bar ✅`.

`docs/index.md`: the DESIGN entry and two after it become:

> - [`DESIGN.md`](DESIGN.md) — the game in broad strokes: the pitch, launching a chronicle, the meta, scope. Names the other two design pages; the three are the spec, every section marked decided or provisional, its rationale inline.
> - [`INTERFACE.md`](INTERFACE.md) — how any screen is worked: the menu, Controls, the debug console, the three presses.
> - [`CHRONICLE.md`](CHRONICLE.md) — what exists only inside a chronicle: the rules (the turn, sight, cards, population, the map, units, events) and the screen (the chronicle screen, the resource bar, the yield overlay).

`docs/DOGMAS.md`, four references, each the one phrase:

- _Working with the user_, "Stay at discussion altitude": "check `DESIGN.md` and `BOARD.md` first" → "check the design pages and `BOARD.md` first".
- _Working with the user_, "Design is the spec": "`DESIGN.md` is never edited down to match an implementation." → "A design page is never edited down to match an implementation."
- _Code_, "Comments are for traps only": "no design rationale (that is `DESIGN.md`)" → "no design rationale (that is the design pages)".
- _Docs_, "A change of several lines on its own branch": "keeps `DESIGN.md` on `main` free of half-true designs" → "keeps the design pages on `main` free of half-true designs".

`docs/ROADMAP.md`: "carries most if not all of [`DESIGN.md`](DESIGN.md)" → "carries most if not all of the design pages".

`CLAUDE.md`: in _Project_, "The design is written at design altitude in `docs/DESIGN.md`;" → "The design is written at design altitude in the design pages, `docs/DESIGN.md` and the two it names;". In _Three lifespans_, "[`docs/DESIGN.md`](docs/DESIGN.md) the game," → "[`docs/DESIGN.md`](docs/DESIGN.md) and the two pages it names the game,". In _Non-negotiables_ 3, "the design page is never edited down" → "a design page is never edited down".

Harness, not docs, edited the same way: `.claude/skills/intake/SKILL.md` step 1 "`docs/DESIGN.md`, `docs/GLOSSARY.md` and `docs/DOGMAS.md` where they touch it" → "the design pages, `docs/GLOSSARY.md` and `docs/DOGMAS.md` where they touch it"; check 1 "a decision in `docs/DESIGN.md`" → "a decision in a design page"; step 3 "`DESIGN.md` first — much is pre-decided." → "The design pages first — much is pre-decided." `.claude/skills/ship/SKILL.md` step 3 "`DESIGN.md` untouched except where" → "the design pages untouched except where". `.claude/agents/egress-reviewer.md`: after "they are the charter." add the sentence "The design pages — `docs/DESIGN.md` and the two it names — are the spec; read the sections the diff touches."; _Trinity respected_ "the design page was not edited down" → "no design page was edited down"; _Design honoured_ "the diff does what `docs/DESIGN.md` says" → "the diff does what the design pages say"; _Test suspicion_ "unless `docs/DESIGN.md` changed the behaviour" → "unless a design page changed the behaviour".

**Doc-impact:** `docs/DESIGN.md`, `docs/INTERFACE.md` (new), `docs/CHRONICLE.md` (new), `docs/index.md`, `docs/DOGMAS.md`, `docs/ROADMAP.md`, `CLAUDE.md`. The three harness files above change too.

**Scope:** in — the three pages, the four sentence edits, the index entries, the reference rewrites in docs and harness. Out — any other change of wording on the way, including the three mixed passages that stay where they are because they hold a rule: the aim window in Cards (newest first, the empty pile), the attack press in Units, the console's key in Scope; a META page or a CARDS page; a rename of `DESIGN.md`; the wrap-linter dossier `board/the-wrap-linter.md`, which names `DESIGN.md` and is gone before this line ships. Corner cases decided here: headings keep their ✅ and the two new `##` groupings on the chronicle page carry none; the first paragraph of Sight, which says how a tile in each state is drawn, stays in Sight because it is where the three states are defined; the console paragraph on the interface page keeps its last clause about a new chronicle, one clause not being a passage; nothing links to a `DESIGN.md` section anchor anywhere in the repo, so no anchor breaks.

**Traps:**

- This line ships after **The wrap linter**, as the board's order says. The verify check below reads paragraphs as lines and is meaningless on a wrapped tree; if `npm run fmt` does not exist yet, stop and say so.
- The diff removes some forty kilobytes from `DESIGN.md`. That is not the page being edited down: the board line's done-condition says the paragraphs land verbatim, and the check below proves it. Run the check and put its output in the report so the reviewer reads the move as a move.
- Prettier formats the two new pages on `npm run fmt`; write them one line per paragraph so the run changes nothing, and confirm with `git status --porcelain docs` after a second run that it printed nothing.
- `board/the-wrap-linter.md` will not exist any more; if it does, the wrap linter has not shipped, see the first trap.
- The `.claude/` files are harness: edited here, not docs, and not in the doc-impact list; the glossary and named-spec hooks reference no design page and are not touched.

**Plan:**

1. Build `docs/INTERFACE.md` and `docs/CHRONICLE.md` from `docs/DESIGN.md`'s paragraphs as Spec places them, cut `DESIGN.md` down to its new preamble and the Pitch section, and make the four sentence edits in place; every other paragraph is moved untouched.
2. The index entries; the four DOGMAS references; ROADMAP; the three CLAUDE.md references; the three harness files.
3. `npm run fmt`, then the verify check, then `npm run lint`; delete the board line and this file.

**Verify:** `npm run lint` passes, and `npm run fmt` followed by `git status --porcelain` prints nothing. The move check, from the repository root in PowerShell:

```
$removed = git diff -U0 -- docs/DESIGN.md | Where-Object { $_ -match '^-[^-]' } | ForEach-Object { $_.Substring(1) } | Where-Object { $_ -notmatch '^#' -and $_ -ne '' }
$added = (Get-Content docs/INTERFACE.md) + (Get-Content docs/CHRONICLE.md)
$removed | Where-Object { $added -notcontains $_ }
```

It prints exactly seven lines, the ones Spec rewrites, and nothing else: the old legend line, the two old preamble paragraphs, The menu's back-key paragraph, The presses' back-key paragraph, and Population's two paragraphs. Any other line printed is a paragraph that did not land verbatim; the report lists what it printed. `npm run check` and `npm test` are unchanged; no Playwright spec, nothing on screen changes.
