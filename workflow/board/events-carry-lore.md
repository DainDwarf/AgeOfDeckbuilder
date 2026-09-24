# Events carry lore

**Line:** **Events carry lore** — every event of the Nomadic Age and of the stand-in, the camp's capture and the capstone at each of its two raisings read a lore text over their cards, one keyed entry each in a lore table the glossary does not bind, and the coherence tests of both catalogues read every entry through the screen's lookups. Doc-impact: `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`, `docs/ages/NOMADIC.md`.

**Spec:**

- `docs/CHRONICLE.md`, _The schedule_, a new paragraph after the one ending "choosing between ways out of one harm reads as a decision.": "**An event carries lore**: a short fiction, a sentence or three, saying what is happening to the city, since an answer read alone makes no sense. A camp's capture carries one too, and the capstone one for each time its window is raised. Lore is fiction and not rules: it decides nothing, what an answer does is on its card, and the glossary does not bind it, so it says tribe where the rules say population."
- `docs/CHRONICLE-SCREEN.md`, _The windows_, the deal window's sentence "The answers dealt stand in one row, centred, as cards at the browse's width, in the order dealt, under a title naming the event." becomes: "The answers dealt stand in one row, centred, as cards at the browse's width, in the order dealt, under a title naming the event; the event's lore stands just above the row, centred, in the title's ink, and the row stands where it would without it. A capture's window reads the camp's lore the same way."
- `docs/CHRONICLE-SCREEN.md`, _The windows_, the capstone paragraph's "under a title — at the opening, that the age ends on that capstone and nothing of the turn it lands on; at the landing, that the capstone lands." becomes: "under one title naming it the capstone, with the capstone's lore for that raising standing over the card as the deal's stands over its row — at the opening, the promise of what passes it and nothing of the turn it lands on; at the landing, that the time has come."
- `docs/GLOSSARY.md`, the intro, after the paragraph ending "are outside it.": "So is lore, the fiction a window reads over its cards: prose the lint does not read, free to say tribe and hunter."
- `docs/ages/NOMADIC.md`, _The events_, "Five events, each a problem the chronicle deals with two answers, one of them open to a city with nothing." becomes "Five events, each with its lore, each a problem the chronicle deals with two answers, one of them open to a city with nothing."
- The lore entries, verbatim, in the lore table; the Nomadic Age's:
  - Lean season: "Last season was cruel, and everyone in the land is starving. The neighbouring tribes have been eyeing each other hungrily."
  - A rival band: "Strangers have come to your door. A new tribe, they say, and they intend to make their camp nearby, whether you like it or not."
  - Wildfire: "There is smoke over the forest, and the wind is up. Somewhere out there, a wildfire is running."
  - Departure: "Some of the tribe have grown unhappy here. They talk of leaving, and they mean it."
  - The herd: "One of the hunters came back with news: a new herd, not far from here. The tribe has been arguing all evening about what to do."
  - The camp, keyed on its building as the capture window's heading is: "The camp has fallen. Its stores lie open and its people wait to hear their fate: what do you take?"
  - The first shelter, at the opening: "The tribe has wandered long enough. When the time comes, build the first shelter, and the Nomadic Age is won."
  - The first shelter, at the landing: "The time has come. The first shelter is in your hands: build it, and the Nomadic Age is won."
- The stand-in's entries follow the text table's placeholder convention, the value being the id: its two events, its camp's building, and each of its three capstones at both raisings.
- The capstone window's title reads `Capstone` at both raisings: the text table's `capstone.title` entry becomes "Capstone" and its `capstone.lands` entry goes.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`, `docs/ages/NOMADIC.md` — the sentences above, no other.

**Scope:**

- In: a lore table with one lookup per kind of thing — an event, a camp by its building, a capstone by its id and its raising — refusing a missing entry as the text table's lookups do; the Nomadic entries and the stand-in placeholders; the deal window laying the lore over its row, for an event's deal and a capture's alike; the capstone window's one title and its lore per raising; both catalogues' coherence tests reading every lore entry; the four docs sentences.
- The lore's look, from the mockup: 20 px, regular weight, the title's ink (`TITLE_INK`), centred on the design width, word-wrapped to a 600 px measure, its bottom 16 px above the row's top; the row stands exactly where it stands today, so the lore is placed off the row, not the row off the lore.
- Lore reads nothing of the chronicle: no counter, no number, the same text on every turn. The answers carry the escalation.
- Out: the ending screen, the browses, the aim window and the menu carry no lore. No page quotes the lore; the table holds it.
- The rules fixtures' events need no entries: no coherence test reads them through the screen's lookups.

**Traps:**

- The glossary lint hook, `.claude/hooks/glossary-lint.cjs`, scopes `src/ui/text.ts` by path and flags every forbidden word an edit adds there. The lore goes in a keyed table of its own, outside that file (`src/ui/lore.ts` is the natural place), still one entry per sentence; a lore entry in the text table would be flagged on every edit and would need an exception mark per word.
- The text table's lookups (`named` in `src/ui/text.ts`) throw for a missing entry, and the coherence tests in `src/content/nomadic.test.ts` and `src/content/stand-in.test.ts` rely on that throw: the lore lookups refuse the same way, and the tests that read every event's name read its lore in the same loop, the camp's and each capstone's at both raisings besides.
- `e2e/capstone.spec.ts` asserts the two titles the window reads today, `capstone.title` at the opening and `capstone.lands` at the landing. The design now gives the window one title and a lore per raising, so the spec's assertions change with it: that is this line's design change, not a weakened test.
- The deal window is laid again after a card shown large is taken down, and a capture's rewards raise the same window under the camp's name: the lore is part of what the window lays, so it comes back with it and shows on a capture too.
- `titleOf` in `e2e/chronicle-screen.ts` reads a window's title by its object name, `<window>-title`; the lore is named the same way, `<window>-lore`, so a spec reads it with a helper of that shape.
- A Phaser text measures and wraps at creation, and a spec rests before it reads what was just raised: `docs/PHASER.md`, _Under a Playwright spec_.

**Plan:**

1. The lore table and its lookups, the Nomadic entries and the stand-in placeholders, and both catalogues' coherence tests reading every entry. Leaves the tests green and nothing on screen changed.
2. The deal window laying the lore over its row for an event and for a capture; the capstone window's one title and its lore per raising, the text table's two capstone titles reduced to the one; `e2e/deal.spec.ts` reading the lore under the deal's title, `e2e/capstone.spec.ts` reading the one title and each raising's lore. Leaves the screen as the mockup shows it.
3. The four docs sentences, and the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof is `npx playwright test e2e/deal.spec.ts`. CI proves `e2e/capstone.spec.ts` and `e2e/camps.spec.ts` on the push, the other two windows the line touches.
