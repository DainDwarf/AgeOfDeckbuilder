# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Rotated Texts stop tearing** — the game boots with `maxTextures: 1`, so every batch draws one
  texture and no fragment picks its sampler by comparing an interpolated float; a trap comment on
  that config line names phaserjs/phaser#7372 as what the setting works around and when it goes.
  A `ui-check` pass on a fanned hand shows no torn letter and no letter from another card.
  Doc-impact: none. [board/rotated-texts.md](board/rotated-texts.md)
- **The rules line wraps through Phaser** — the card's rules line is laid out by a
  `wordWrapCallback` on the one `Text` that draws it, measured through that `Text`'s own context,
  and the per-face ruler `Text` is gone; every rule `text-run.test.ts` pins still holds and the
  card reads as it reads now. Doc-impact: none. [board/rules-line-wrap.md](board/rules-line-wrap.md)
- **The schedule** — events become a weighted table whose weights shift with the turn, drawn from
  the chronicle's own generator: the same seed deals the same schedule, the harshest entries carry
  no weight early, and a raid drawn late is larger than one drawn early. Rules tests pin all three.
  Doc-impact: `docs/DESIGN.md`.
- **The events phase deals a choice** — the phase offers several of the schedule's events as cards
  and the player takes one, which resolves; this replaces the design's "land and resolve at once".
  An e2e spec plays a turn through the deal. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **The chronicle has a length** — the capstone's turn is fixed at the founding and read on the
  chronicle screen; the end-turn button's readout is re-judged against it.
  Doc-impact: `docs/DESIGN.md`.
- **The capstone, and victory** — `PH_Siege` lands on its fixed turn, spans its turns and ends the
  chronicle: victory while the city holds, defeat when it does not. Its intake decides how the
  siege enters a chronicle whose every camp is captured. A victory screen mirrors the defeat
  screen, and rules tests pin both endings. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.