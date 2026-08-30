# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Settle UI verification** — once the stack is known: an agent and a skill that mechanically
  verify a UI change on the real app, so the user's playtime goes to feel only. Done when both
  exist, describe the real app, and `CLAUDE.md` → *Roles* names them. Doc-impact: DOGMAS.md,
  CLAUDE.md.
