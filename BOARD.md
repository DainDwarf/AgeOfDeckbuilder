# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Choose the stack** — `docs/DOGMAS.md` → *Stack* names the language, framework, test runner and
  build; `CLAUDE.md` → *Commands* lists the real commands; the `run` skill is no longer a stub.
  Doc-impact: DOGMAS.md, CLAUDE.md.
- **Settle UI verification** — once the stack is known: decide whether `ui-check` / `visual-check`
  stay (browser) or are replaced, and which speed-ups from `IDEAS.md` are built. Done when the
  agent and skill describe the real app and the deferred ideas are either board lines or deleted.
  Doc-impact: DOGMAS.md.
