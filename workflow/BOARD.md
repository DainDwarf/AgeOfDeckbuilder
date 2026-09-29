# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The Stone Age** — the age page and its content, the age the Nomadic victory unlocks: its settle, land, units, cards and buildings, events, capstone and camps, and its achievements with the technologies they unlock, cards and settle cards among them; with it the warning a launch over a chronicle with achievements reached raises, since an abandoned chronicle pays nothing; and the spec that proves the collection scrolls, its cards being the first to fill the room.
- **Pin an achievement** — one achievement pinned on the campaign screen shows on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.

## Lines

The lines of the collection screen share one mockup, [board/collection-screen-mockup.html](board/collection-screen-mockup.html), which holds the three modes and names the artifact it is published to at its head: a line's intake refines its own mode in it, and the line that says so deletes it at its ship.

- **The collection scrolls** — a panel of the collection screen holding more than its room shows is cut at its edges under its word and scrolls, by the wheel under the pointer and by a press held, and runs on at the release, as a browse does; a panel the room holds whole does not move, and a new campaign's screen stands as it did; the scroll's test in `src/ui/` passes. No spec: no collection the game's content produces fills the room. Doc-impact: `docs/META-SCREENS.md`. [board/the-collection-scrolls.md](board/the-collection-scrolls.md)
- **A civilization's deck opens beside the collection** — a press on a pile grows the right panel into the deck editing mode, read only: the settle section and the deck as rows, the city section's card at the head, the copies this deck holds read on the collection, and the way back.
- **A copy is added to a deck and removed by a press** — the campaign's two moves in the rules, a copy shared by every deck it is added to, a settle card going to the settle section, and the save written at each.
- **A copy is dragged across** — a card of the collection dragged onto the civilization's panel is added, and a row dragged onto the collection is removed; from then a press held on a stack carries its card, and a panel is dragged by its bare ground alone.
- **A card has a price** — the price declared on every card's content and held by the catalogue's coherence test, and read on the collection under its card.
- **A copy is bought for influence** — the campaign's move in the rules and the button that buys, which answers nothing while the influence is short of the price.
- **The civilization stands alone** — the civilization mode, read only: the right panel over the whole room, the settle section and the deck as card faces, and the way in and out.
- **A copy is added or bought from the deck** — in the civilization mode a copy is removed and added from the deck itself, the add taking a copy owned where one is free and buying one where none is; its ship deletes the mockup.
- **A right click on a pile inspects the deck** — on the collection screen and on the launch screen a right click on a civilization's pile shows its whole deck, not the city section's card.
