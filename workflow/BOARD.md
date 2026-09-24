# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **Remove the stand-in content from the throwaway launch page** — the bare address's launch page lists the Nomadic content alone, an address naming the stand-in and no deck opens the page with it listed and chosen, and `e2e/boot.spec.ts` proves both. Doc-impact: `docs/INTERFACE.md`. [board/stand-in-off-the-launch-page.md](board/stand-in-off-the-launch-page.md)
- **Restructure the design pages' shape** — CHRONICLE.md's "Enemies and camps" and "The capstone" read as one paragraph each, INTERFACE.md's names-and-small-cards paragraph is a section of its own, MAP.md's region has no heading and the rivers' deal sits apart from "The river", and DESIGN.md holds everything under one level-2 heading.
- **Close v0.0.4** — the changelog entry and the tag.
