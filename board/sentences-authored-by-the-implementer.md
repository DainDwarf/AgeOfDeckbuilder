# Sentences authored by the implementer

**Line:** Sentences authored by the implementer — the implementer's report carries an _Authored_ section listing every player-facing entry and every `docs/` sentence the dossier did not write out verbatim, the ship session checks it against the diff and quotes each back to the user at the hand-back, and the dossier template writes the player-facing sentences a line foresees out at intake. Doc-impact: DOGMAS.md.

**Spec:** the decision is that a sentence a player reads or a `docs/` page states is the user's, never settled by the implementer writing it. A sentence is _authored_ when it is added or changed by the diff and does not appear verbatim in the dossier's Spec: an entry of the text table in `src/ui/text.ts`, card text included; a sentence of a design page; a glossary meaning. A rephrase of a dossier sentence is authored, since it is not verbatim. Comments, test names, identifiers and commit messages are not, since no player or design reader meets them. The implementer lists them; the ship session verifies the list against the diff and puts each to the user at the hand-back; the user answers in the reply as with advisories, and a reword is a Shave commit after the Ship commit. Nothing asks twice.

`docs/DOGMAS.md` → _Working with the user_, a new line directly after "Unforeseen corner cases are reported, never resolved silently.":

> - **A sentence the implementer authored is put to the user at the hand-back.** A player-facing entry or a `docs/` sentence the dossier did not write out verbatim is listed in the report under _Authored_, and the hand-back quotes each with where it shows; "none" is a valid entry, absence is not. Why: the hand-back relays deviations and advisories, and a sentence that is neither reads as settled.

`.claude/agents/implementer.md`: under _The spec is the spec_, after the paragraph ending "the section is never absent.", a new paragraph:

> A sentence you wrote is not settled by your writing it. Every player-facing entry (an entry of the text table, card text included) and every `docs/` sentence (a design page, a glossary meaning) the diff adds or changes, and that the dossier's Spec does not hold verbatim, goes under **Authored** in your report, quoted, with its key or its page and section. A rephrase of a dossier sentence is authored. "None" is a valid Authored entry; the section is never absent.

and in the _Report_ template, between `## Deviations` and `## Discovered`:

> ## Authored
>
> each sentence quoted, with its key or its page and section — or "none"

`.claude/skills/ship/SKILL.md`, step 3, a new bullet after "the report's _Deviations_ section is present, and every item in it is relayed to the user.":

> - the report's _Authored_ section is present and complete: every entry the diff adds or changes in `src/ui/text.ts` and every sentence it adds or changes under `docs/` is either verbatim in the dossier's Spec or listed there; one that is neither is added to the list yourself before the hand-back.

Step 6, the hand-back's list gains "the authored sentences, each quoted with its key or page and one line on where a player or reader meets it," after "the implementer's discoveries one line each,"; and the closing sentence "the user reads the report and orders what becomes a shave or a `/todo`" becomes "the user reads the report, answers the authored sentences, and orders what becomes a shave or a `/todo`".

`.claude/skills/intake/SKILL.md`, the dossier template's Spec line becomes:

> **Spec:** the `docs/` pages and section headings that are the spec, the sentences to add or change in them, written out, and every player-facing sentence the line foresees — a text-table entry, a card's text — written out, so the hand-back's _Authored_ list holds only what intake did not foresee.

**Doc-impact:** `docs/DOGMAS.md` (Working with the user). The three harness files above change too; they are not docs.

**Scope:** in — the DOGMAS line, the implementer's rule and report section, the ship skill's check and hand-back item, the intake template's clause. Out — any re-asking of a sentence the user did not answer, which the session memory already carries; any retroactive pass over sentences already shipped, all of which the user has closed; any hook or lint, since what is verbatim in a dossier is not mechanically decidable from a diff; the egress-reviewer, who reviews against the docs and does not see the report. Corner cases decided here: a sentence the dossier wrote that the implementer _moved_ untouched is not authored; a sentence the dossier wrote with a placeholder the implementer filled (a `{count}`) is authored only if the words around it changed; an entry renamed by key but unchanged in words is not authored; a sentence in a `board/` or `IDEAS.md` file is not, those being transient.

**Traps:**

- This line ships after **The wrap linter** and **The design page split**, as the board's order says. Every markdown edit is one line per paragraph and `npm run fmt` runs before verification; if `npm run fmt` does not exist, stop and say so. The DOGMAS anchor sentence and the ship skill's step 3 bullet read as above after the split, which only rewrites `DESIGN.md` references in those files; if the split has not shipped, its edits to the ship skill's step 3 and to DOGMAS land later and touch other sentences, so nothing here collides either way.
- The DOGMAS section _Working with the user_ is where the line goes: it is a rule of the hand-back, not of code or docs. The corner-cases line it follows is the precedent for its shape.
- The ship skill's hand-back already lists deviations, the verdict with advisories, and discoveries; the authored sentences are a fourth item of that list, not a heading of their own and not a PushNotification of their own — the one notification the hand-back already sends covers it.
- `src/ui/text.ts` is the one text table; the glossary-lint hook scopes to it and to `CHANGELOG.md` for the same reason. The CHANGELOG is written by the main session at a version bump, never by the implementer, so it is not in the check.

**Plan:**

1. The DOGMAS line; the implementer's paragraph and report section; the ship skill's step 3 bullet and step 6 item; the intake template's Spec line — each as Spec writes it.
2. `npm run fmt`, `npm run lint`; delete the board line and this file.

**Verify:** `npm run lint` passes, and `npm run fmt` followed by `git status --porcelain` prints nothing. `npm run check` and `npm test` are unchanged; no Playwright spec, nothing on screen changes. The done-condition is read: the four files hold the sentences Spec writes.
