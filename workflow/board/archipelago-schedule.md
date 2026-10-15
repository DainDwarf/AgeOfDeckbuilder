# The archipelago's schedule

**Line:** The archipelago's schedule — the archipelago's schedule names the Stone Age's three trials, the catalogue's coherence test passes and the age page says both regions name the same trials. Doc-impact: `docs/ages/STONE.md`.

**Spec:** `docs/ages/STONE.md`.

- _The events_, its last sentence, today "The archipelago's schedule is its own, and deals what the temperate's deals, on the temperate's tempo.", becomes: "The archipelago's schedule is its own: it deals what the temperate's deals, on the temperate's tempo, and names the same trials."
- _The capstones_, its first sentence, today "The region names three trials and the opening draws one: a long winter, a monument built, a siege endured.", becomes: "Each region names the same three trials and the opening draws one: a long winter, a monument built, a siege endured."

No player-facing sentence is new: the three trials' names, rules entries, lore and victory lines already stand and say "Stone Age" on either region.

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:** In: the archipelago's schedule constant names the three Stone capstones, `long-winter`, `monument` and `siege`, in that order, in place of the Nomadic `first-shelter`; its events and their weights, its spacing and its window stay as they are, the temperate's values written out. Out: any trial of the archipelago's own, any change to the temperate's schedule, any change to the Nomadic schedule, which keeps `first-shelter`. The siege by sea was measured at intake (60 seeds a region, the siege landed on turn 2, no player unit): the band reaches an undefended city in a median of 7 turns on the archipelago against 6 on the temperate region, with as many units ashore beside the city at the capture; the trial holds there as it is. The reconcile found one likeness, the temperate's schedule constant beside the archipelago's, identical once this lands: they stay apart, since every region's schedule is its own constant written in full. A chronicle saved on the archipelago before this line names a catalogue version this content no longer has, and is refused as any save on older content is; that is accepted until the Bronze Age.

**Traps:**

- The catalogue's coherence test (`src/content/catalogue.test.ts`) runs every capstone of every region's schedule on a chronicle settled in the age's _first_ region, so the archipelago's capstones are exercised on a temperate chronicle; that is enough here, the ids being the temperate's own.
- The capstone's opening window and the ending read the capstone by its id alone, so no text entry and no lore entry is keyed by region; nothing in `src/ui/` changes.
- Comments are for traps only: the schedule constant carries no docblock, and none is added.

**Plan:**

1. `src/content/stone.ts`: the archipelago's schedule constant names the three Stone capstones. Everything else in it stands.
2. `docs/ages/STONE.md`: the two sentences above.
3. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none; the line puts nothing new on the screen. CI proves on the push: `e2e/archipelago.spec.ts` (the launch on the archipelago, the chronicle compared to the rules' launch), `e2e/capstone.spec.ts` and `e2e/victory.spec.ts` (the capstone's card and the ending, on the first region).
