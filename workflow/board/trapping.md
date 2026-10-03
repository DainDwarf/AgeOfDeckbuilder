# Trapping

**Line:** **Trapping** — Trapping stands in the Stone Age's content as the technology of the wild's door, needing Settlement: its achievement counts the plays of Hunt toward 6, unlocks one copy of the card and pays 1 influence; the card goes on a tile carrying deer and on no other, and the Nomadic deck opens without it; a layer that names a feature goes only on a tile carrying it and is removed with the feature, proven on the fixture; `e2e/trapping.spec.ts` plays the card, and a Hunt on a trapped deer, on screen; `npm run check`, `npm test` and `npm run lint` pass. Doc-impact: `docs/MAP.md`, `docs/ages/STONE.md`, `docs/ages/NOMADIC.md`.

**Spec:** `docs/MAP.md` _The tile_ (the layers of a tile, what each names, what reaches any tile a worker stands on), `docs/META.md` _The campaign_ (an achievement, its tally, what a technology unlocks) and `docs/ages/STONE.md` are the spec. The sentences that change:

- `docs/MAP.md` _The tile_, the improvement bullet: its last sentence, "What names a tile's movement cost outright and what bridges a river edge are two properties a layer declares, a building's or an improvement's alike.", stays, and one sentence follows it: "A layer may also name a feature, a building's or an improvement's alike: it then goes on a tile carrying that feature and on no other, and is removed with the feature, however the feature leaves the tile."
- `docs/ages/STONE.md` _The technologies_, a bullet between Agriculture's and Fire's: "- **Trapping** needs Settlement. Its goal counts a deed: the times Hunt is played, each a deer or a cattle removed from its tile. It unlocks the card **Trapping** and pays influence. Food gained through Gather on tiles carrying deer was rejected: one worker parked on one tile reaches it."
- `docs/ages/STONE.md` _The cards_, a bullet between Farm's and Fire's: "- **Trapping**, an improvement giving food, placed through a worker for production on a tile carrying deer and nowhere else. It goes with the deer, so a Hunt played there removes both. An improvement counts wherever the tile is — inside the border at income, outside it through Gather."
- `docs/ages/NOMADIC.md` _The units_, the worker: "the cards played through it — Gather, Trapping, Hunt —" becomes "— Gather and Hunt —".
- `docs/ages/NOMADIC.md` _The cards_: Trapping's bullet is deleted; "then a few Trapping, Hunt and March" becomes "then a few Hunt and March"; "A terraform, burning forest to plain, was left to the Stone Age: Trapping already teaches that the map changes for a card." becomes "A terraform, burning forest to plain, was left to the Stone Age: Hunt already teaches that the map changes for a card." Hunt's own bullet stays as it is.
- `docs/ages/NOMADIC.md` _The events_, Wildfire: "the deer and the trapping go with the forest" stays, since a deck may hold Trapping in a Nomadic chronicle.

The player-facing entries, each ending in no period:

- The technology's name: "Trapping".
- The goal: "Play [card:hunt] {need} times".
- The card's rules text: "Place [improvement:trapping] on [feature:deer]", in place of "on [terrain:forest]". The card's name and the improvement's name stay "Trapping".
- The refusal of a tile carrying no deer, whatever its terrain: the standing "Wrong feature". No entry is added.
- Hunt's rules text stays as it is: it does not say the trapping goes.

**Doc-impact:** `docs/MAP.md`, `docs/ages/STONE.md`, `docs/ages/NOMADIC.md`. `docs/CHRONICLE.md`, `docs/META.md` and `docs/GLOSSARY.md` stand: the tally, the worker's instants and the words "place" and "remove" already say what the line needs. `CHANGELOG.md` is written at the version bump.

**Scope:** In: the layer naming a feature, in the rules — the declaration, its check when the catalogue is built, the placing asking for the feature, the removal with the feature — with its tests on the fixture; Trapping's card and improvement moved to the Stone Age's content, the improvement naming deer; the technology and its achievement; the Nomadic deck without its two copies; the three texts; `e2e/trapping.spec.ts` with three tests, and `e2e/worker-instants.spec.ts` losing its two Trapping tests; the pages.

Out: Herbalism and every later technology; any change to Hunt's card, numbers or text; the features' shares; a card filling the place Trapping leaves in the Nomadic deck, which waits for a playtest; the goal shown on the chronicle screen, the pinned achievement's line.

The numbers, provisional and to be played: the card costs 2 production and the improvement gives 1 food, both as they stand today; the need is 6; the technology unlocks one copy and its achievement pays 1 influence. 6 is half the deer and cattle a worker walks to on a median Stone Age temperate map, 12 over 200 seeds, and the worst of those maps holds exactly 6.

Corners decided at intake:

- A Hunt played on a deer carrying a trapping removes both, gains its food as any Hunt does and counts toward the goal as any Hunt does. It is never refused for the trapping.
- The rule holds through every way a feature leaves a tile: a card's removal, a terraform, and a feature placed over another, which takes the layers naming the old one. Nothing reaches the last today, the herd dealing deer only onto a forest carrying no feature.
- A terraform into a terrain a layer names still removes that layer when the layer names a feature, since the terraform takes the feature.
- A layer naming a feature answers "Wrong feature" on a tile not carrying it, whatever the tile's terrain, after the worker's own reasons as every card played through a worker answers them.
- A layer's feature resolves in the catalogue and lies on a terrain the layer names, or the catalogue is refused when it is built. A civilization's city building and an age's camp building name no feature, refused the same way: neither may leave its tile for a feature.
- The trapping's feature and the layers that go with it leave the tile as one change of that tile, as a terraform's do.
- A deer the herd's _Follow it_ deals later is trapped like any other.
- A trapped deer inside the border, hunted, leaves a bare forest the population keeps working.
- A campaign begun before keeps its two copies of Trapping and the deck holding them, and a chronicle in progress plays on with a trapping standing on a forest that carries no deer: nothing is done for either.
- The Nomadic deck opens on 17 cards and nothing is added to it.

What the reconcile chose:

- A layer going when what it lies on goes: the terraform's removal of a layer whose kind does not name the new terrain, and the removal with the feature, become one rule on one declaration, a layer naming its terrains and, where it has one, its feature. Hunt's own closure and text never name Trapping.
- The rule covers a building as it covers an improvement, on the user's choice, so `docs/MAP.md`'s "That slot is the whole difference between a building and an improvement" stays true; no building of the content names a feature, and the fixture proves the building's half.
- The goal goes through the tally as it stands: the fixture's deed achievement already proves a tally counting the plays of one named card, so the goal is content alone and gets the catalogue's coherence checks and no rules test.
- The spec is one of its own, `e2e/trapping.spec.ts`, on the user's order: its ground is made, never searched for — a tile beside the city turned into the feature's terrain where it is another, the feature placed on it, a worker entered there, all through the rules' helpers a card's effect composes — and its deck is the first civilization's with one copy of Trapping added, as `e2e/farm.spec.ts` adds its Farm. Each test's seed search asks for one thing: the card it plays in the opening hand.

**Traps:**

- `LayerKind` in `src/rules/map-kinds.ts` is the one shape the buildings' and the improvements' tables both hold, and `catalogued` in `src/rules/catalogue.ts` validates both tables in one loop.
- A tile's feature changes in `src/rules/cards.ts` alone, through three helpers that all go through its private one-tile retile: the feature's removal, the feature's placing and the terraform. `src/rules/schedule.ts` composes the placing for the herd and the terraform for the fire. The generator in `src/rules/map.ts` sets features on tiles that carry no layer yet.
- The helpers that place an improvement and build a building check nothing; the card's aim does. The Trapping card's aim reads the feature from the improvement's kind, as it reads the terrains today, so the feature is named once.
- `terraformed` keeps a building or an improvement whose kind names the new terrain; that filter does not know the feature it has just removed.
- The fixture holds `PH_Game` on forest and no layer naming a feature; the fixture's layer that names one, improvement and building, is the implementer's to author in `src/rules/fixtures.ts`.
- The tree's plates stand in a column in the order `CATALOGUE.technologies` declares them (`src/ui/tree-layout.ts`); the user's order for the doors is Agriculture, Trapping, Fire.
- `src/content/catalogue.test.ts` resolves every name a rules entry and a goal draw, asks every achievement its tally on an ended turn, and reads every improvement's name and mark; `src/ui/marks.ts` keeps the trapping's mark, which moves with nothing.
- A card's age is the slice that brings it: Trapping becomes a Stone Age card, priced on that age's base price, the same number today. A new campaign's collection opens without it.
- The Nomadic deck shrinks by two cards, so every seed shuffles and draws another hand: every spec that searches a seed for a hand lands on another seed through `firstSeed` in `e2e/chronicle-screen.ts`; one that finds no seed under a thousand is a finding to report, never a search to loosen.
- `e2e/chronicle-screen.ts`'s `settledOn` takes a civilization, `unitEntered` enters a unit as a card does, and `marksIn` counts the `features` and the `improvements` marks; `workerStepped` opens on the first civilization alone and stays what `e2e/worker-instants.spec.ts`'s Hunt test uses. The spec reads its ids from the rules: the feature the improvement's kind names, and the terrain that feature lies on.
- The inspected trapped deer shows the unit's card, then the card headed by the trapping with its one row, then the terrain's with the deer: the moved inspection test asserts what it asserts today.
- `docs/PHASER.md` holds what a spec rests for before it presses; the helpers the spec uses already rest.
- Comments are for traps only, in the rules, the content and the spec alike.

**Plan:** Two commits. First, inert, the mechanism: `src/rules/map-kinds.ts`, `src/rules/catalogue.ts` and `src/rules/cards.ts` hold the layer that names a feature — declared, checked when the catalogue is built, asked for when it is placed or built, removed with its feature through every way a feature leaves a tile; `src/rules/fixtures.ts` holds the fixture's layers that name one; the rules tests beside those modules prove the placing, the removal and the refusals of the catalogue; no content changes and `npm test` passes. Second, the content and its proof: `src/content/stone.ts` holds the card, the improvement naming deer, the technology between Agriculture and Fire and its achievement; `src/content/nomadic.ts` loses the card, the improvement and the deck's two copies; `src/ui/text.ts` holds the technology's name, the goal and the card's new rules text; `e2e/trapping.spec.ts` holds the three tests and `e2e/worker-instants.spec.ts` keeps Hunt's alone; the three pages take their sentences; `workflow/board/stone-age-pool.md` loses its bullet "Corners left to the doors' intakes", both corners being answered here; the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/trapping.spec.ts` — Trapping placed on the deer its worker stands on, the trapped tile inspected, and a Hunt on a trapped deer leaving the map one feature mark and one improvement mark fewer, each chronicle equal to the one the rules leave. CI proves on the push every other spec, each one drawing another hand: among them `e2e/worker-instants.spec.ts`, `e2e/tree.spec.ts`, `e2e/farm.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/landing.spec.ts`, `e2e/inspect.spec.ts`, `e2e/refuse.spec.ts`, `e2e/collection.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/menu.spec.ts` and `e2e/browse.spec.ts`.
