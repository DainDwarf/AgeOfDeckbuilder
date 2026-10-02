# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The Stone Age's schedule** — the age's own events, its capstone and its victory with the technology it earns, on a chronicle longer than the Nomadic one, hard to impossible on the deck the age opens with and beatable once its tree is climbed; with it the ending's scaled pay.
- **New enemies** — the enemy units the Stone Age adds, the scripts they follow and the camps they enter from.
- **Neutrals and sites** — the neutral faction, and the sites that belong to no faction and pay a reward once.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.
- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play.

## Lines

- **Fire** — the Stone Age's catalogue holds the technology Fire, needing Settlement, its achievement counting toward a need of 3 the turns on which five cards were played and paying 1 influence, and the card Fire, one copy unlocked; a goal counting such turns is proven once on the fixture; a plate's goal says its need and wraps at the plate's width; `npm test` passes with the catalogue's coherence tests, and `e2e/hand-aim.spec.ts` plays Fire on screen. Doc-impact: `docs/ages/STONE.md`, `docs/META-SCREENS.md`, `docs/META.md`. [board/fire.md](board/fire.md)
- **Agriculture** — the field's door, needing Settlement: its goal reads the plain tiles inside the border, and it unlocks Farm, a single-use building on plain giving food; its design is settled in words in [board/stone-age-pool.md](board/stone-age-pool.md), and its numbers and texts are this line's intake; single use on a building card lands here, with its sentence in `docs/CHRONICLE.md`.
- **Trapping** — the wild's door, needing Settlement: its goal counts the food gained through Gather played on tiles carrying wildlife, and it unlocks Trapping, which leaves the Nomadic Age and goes on a forest carrying wildlife and nowhere else; its design is settled in words in [board/stone-age-pool.md](board/stone-age-pool.md), and its numbers and texts are this line's intake; an aim that asks for a feature lands here, and `e2e/worker-instants.spec.ts` moves with the card.
- **Herbalism** — the sky's door, needing Settlement: its goal counts the kinds of terrain Gather was played on, and it unlocks Heal, which costs food and brings a unit inside the border back to full health; its design is settled in words in [board/stone-age-pool.md](board/stone-age-pool.md), and its numbers and texts are this line's intake; healing a unit lands here.
- **The pinned achievement** — one achievement pinned on the campaign screen shows on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed.
- **The launch warning** — the warning a launch over a chronicle with achievements reached raises, since an abandoned chronicle pays nothing.
- **The tree's columns** — re-thinking either how the tree is put in columns, or how the tree is displayed in general: the skeleton's next column holds seven technologies, and seven plates need 776 units of the room's 672 at today's plate height, more once a goal wraps.
- **The field's climb** — Irrigation, Grinding stone and Bread, each technology with its achievement and every card it unlocks.
- **Wildlife on the plain** — wildlife lies on plain as on forest and gives the same, so the wild's technologies work one feature on two terrains: a feature lying on several terrains, and both ages' feature shares dealt again for it.
- **The wild's climb** — Bow and arrow, Fishing, Domestication, Clothmaking and Raft, each technology with its achievement and every card it unlocks.
- **The hearth's climb** — Pottery, Dyes and Bartering, and Granary, which needs Pottery, each technology with its achievement and every card it unlocks.
- **The sky's climb** — Burial rites, Calendar and Megalith, each technology with its achievement and every card it unlocks.
- **The collection scrolls** — the spec that proves the collection scrolls, its cards being the first to fill the room, and a drag that runs on fired inside the page, since Playwright's own mouse moves come too far apart to set a panel running.
