# The sites' trophies

**Line:** **The sites' trophies** — a site's find that pays once is a trophy: the Stone sites' Cave paintings, Honour the dead, Dig the graves and Bone carvings become trophies gaining influence, the Nomadic sites' three finds trophies gaining none, and Old stories and Bone tools stay the instants they are. Done when the catalogue holds those seven cards as trophies at that influence, the catalogue coherence test passing, and the pages below say so.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md) _The sites_ and _The events_, [`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) _The sites_, [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _Cards_ (the trophy bullet), [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md) (the trophy row). The sentences to land, written out:

- `ages/STONE.md` _The sites_, the whole section body becomes: "The sites are the Nomadic Age's, and in this age each deals two rewards of the age's own, so a site found is a choice; a site's trophy gains influence, as the camp's do. The **painted cave** deals **Cave paintings**, a trophy, culture once, more than the Nomadic card gives, and **Old stories**, an instant, culture each time it is played, cycling with the deck for the rest of the chronicle: the find spent or kept against the find told again. The **old cairn** deals two trophies, **Honour the dead**, culture once, more than the Nomadic card gives, and **Dig the graves**, money once, worth something to a deck that trades and nothing to one that does not: the dead honoured against the dead robbed. The **bones of a great beast** deal **Bone carvings**, a trophy, culture once, more than the Nomadic card gives, and **Bone tools**, an instant, production each time it is played, cycling with the deck for the rest of the chronicle: the beast remembered against the beast used up."
- `ages/STONE.md` _The events_: "The camp's and the neutral's rewards are trophies, and an event may deal a challenge." becomes "The camp's and the neutral's rewards are trophies, and so is a site's find that pays once; an event may deal a challenge."
- `ages/NOMADIC.md` _The sites_: "In this age a site deals one card, culture once, banished once played: a site is where the band's culture is found." becomes "In this age a site deals one trophy, culture once, gaining no influence: a site is where the band's culture is found."
- `CHRONICLE.md` _Cards_, the trophy bullet: "**Trophy** — the kind a capture's rewards are, and no deck holds one." becomes "**Trophy** — a kind a capture deals, and no deck holds one."; the rest of the bullet stands.
- `GLOSSARY.md`, the row **trophy**: "The kind a capture's rewards are: played, its effect lands and it is banished; kept to the ending, it gains its influence on any ending." becomes "A kind a capture deals: played, its effect lands and it is banished; kept to the ending, it gains its influence on any ending."

Player-facing entries, written out, the "Banish." line gone from each as the camp's trophies lost it: `rules.cave-paintings` "2[culture]", `rules.honour-the-dead` "2[culture]", `rules.bone-carvings` "2[culture]", `rules.stone-cave-paintings` "4[culture]", `rules.stone-honour-the-dead` "4[culture]", `rules.dig-the-graves` "4[money]", `rules.stone-bone-carvings` "4[culture]". `rules.old-stories` and `rules.bone-tools` stand as they are. No card name changes.

**Doc-impact:** `docs/ages/STONE.md`, `docs/ages/NOMADIC.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: in `src/content/stone.ts`, `stone-cave-paintings`, `stone-honour-the-dead`, `dig-the-graves` and `stone-bone-carvings` become trophies gaining 1, each aimed at nothing with the effect it has, no `banish` keyword; in `src/content/nomadic.ts`, `cave-paintings`, `honour-the-dead` and `bone-carvings` become trophies gaining 0 the same way. The seven rules texts above. The four pages.
- Out: `old-stories` and `bone-tools`, instants with no keyword, cycling, gaining nothing, unchanged; every amount of culture, money and production, which the balance pass tunes; the fixture's site reward `PH_Idol`, an instant with banish, which stays as it is: the fixture is content enough for the rules it serves, and no rule here changes.
- Corner cases decided here: a site deals a trophy beside an instant, and the capture window shows the two as the cards they are, the trophy wearing its chip and the instant not; the Nomadic finds wear no chip and their kind reads Trophy, as the Nomadic camp's do. Every number is provisional.
- Reconcile: the site trophies go through the trophy shape Their stores has, aimed at nothing and gaining a stock; the Nomadic site trophies at 0 through what the Nomadic camp's trophies are; the two instants left in a site's reward table through the reward-table reading of `heldByNoDeck`, which keeps them out of every deck as it does today. Nothing becomes one with anything, and nothing stays apart by a meant difference.

**Traps:**

- `heldByNoDeck` (`src/rules/catalogue.ts`) keeps a card out of decks by its kind for a trophy and by the reward tables for anything else: after this line the table reading still has real users, `old-stories` and `bone-tools`, so it stays.
- The Nomadic finds are brought by `NOMADIC.brings.cards` and the Stone ones by `STONE.brings.cards` under `stone-` prefixed ids, `dig-the-graves` alone unprefixed since the Nomadic Age has no counterpart; `src/content/stone.ts`'s `nomadicTrophy` reads a Nomadic card by id and refuses one that is not a trophy, which the Nomadic finds now are, but it is the camp's rewards' door and the site cards do not go through it.
- A trophy declares `influence` and no `banish`; the card union (`src/rules/catalogue.ts`) refuses a keyword on a trophy at the typecheck.
- The coherence test (`src/content/catalogue.test.ts`) resolves every reward's name and rules text under each city's building and asserts no kind; the proof that the cards are trophies at their influence is the catalogue as built, read in `npm run check` and the test's resolution, and the pages.
- The glossary lint hook reads code and text for forbidden words; "loot", "prize", "relic" and "keepsake" are forbidden by the trophy row, and none of the names or texts above carries one.
- `e2e/sites.spec.ts` captures a Nomadic site and reads the window's name and lore, never the reward's kind; it walks the changed cards and is CI's.

**Plan:**

1. Content: the seven cards' kinds and influence in `src/content/nomadic.ts` and `src/content/stone.ts`, their rules texts in `src/ui/text.ts`. Leaves `npm run check` and `npm test` green, the coherence test among them.
2. The four pages, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: none, the line's state is the catalogue's and the pages'. CI's on the push, listed for the hand-back: `sites`, `camps`, `neutral`, `deal`, `ending`, `reference`, `inspect`.
