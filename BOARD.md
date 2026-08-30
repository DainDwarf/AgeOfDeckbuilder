# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Render at device pixels** — the canvas backing store matches its on-screen size ×
  `devicePixelRatio` (no CSS upscaling of the bitmap); boot-scene text is crisp at 100% and 150%
  display scaling per a ui-check pass (Playwright emulates `deviceScaleFactor`); the coordinate
  rule in `.claude/agents/ui-check.md` matches the new mapping. Doc-impact: none.
