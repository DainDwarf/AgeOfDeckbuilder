# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

## Lines

- **Close v0.0.5** — `package.json` and `package-lock.json` read version 0.0.5; `CHANGELOG.md` holds the `[0.0.5]` entry under an empty `[Unreleased]`; `README.md` names v0.0.5 as the latest build and its two ages; the v0.0.5 rung is gone from `workflow/ROADMAP.md`; `git grep -n "0\.0\.4" -- . ":!CHANGELOG.md"` prints nothing; the annotated tag `v0.0.5` stands on the ship's commit and is pushed; `origin/Latest` points at that same commit. Doc-impact: none. No dossier: the entry and the README's sentences are the ship's brief, verbatim.
