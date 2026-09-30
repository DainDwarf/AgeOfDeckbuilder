# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The Stone Age** — the age page and its content, the age the Nomadic victory unlocks: its settle, land, units, cards and buildings, events, capstone and camps, and its achievements with the technologies they unlock, cards and settle cards among them; with it the warning a launch over a chronicle with achievements reached raises, since an abandoned chronicle pays nothing; and the spec that proves the collection scrolls, its cards being the first to fill the room, and a drag that runs on fired inside the page, since Playwright's own mouse moves come too far apart to set a panel running.
- **Pin an achievement** — one achievement pinned on the campaign screen shows on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.

## Lines

- **The wheel binds nowhere, and under a scrim the screen hears no key** — no slot of the Controls window takes a wheel notch, the wheel zooms the map and scrolls what scrolls frontmost under the pointer, `=` and `-` are the zooms' default keys, and while anything stands on a scrim the map and the tree under it hear no pan and no zoom, the campaign screen no longer raising the menu on a notch bound to the back key. Doc-impact: `docs/INTERFACE.md`, `docs/META-SCREENS.md`. [board/the-wheel-binds-nowhere.md](board/the-wheel-binds-nowhere.md)
- **The pan keys scroll panels and browses** — the two keys that pan the map up and down scroll what scrolls frontmost while they are held, at the speed the map pans: the collection screen's panel under the pointer, a browse or a window's grid on a scrim wherever the pointer stands, and a card shown large holds it still. Doc-impact: `docs/INTERFACE.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`. [board/pan-keys-scroll-panels.md](board/pan-keys-scroll-panels.md)
- **A setting inverts the wheel** — a setting turns the wheel's zoom the other way, and one its scroll, the wheel binding nowhere.
