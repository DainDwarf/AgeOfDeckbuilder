# The infopanel's face re-read in place

**Line:** The infopanel's face re-read in place — turning the faction signs on rebuilds the infopanel's face through `show` in `src/ui/chronicle-scene.ts`, where `InfoPanel.reread` re-reads it in place as the Icons switch does. Done when the scene's `drawSigns` re-reads the standing inspection's card through `InfoPanel.reread` and no longer calls `show`, and `e2e/faction-signs.spec.ts` passes.

**Spec:** `docs/INTERFACE.md` _The menu_, the Graphics paragraph: "a change takes at once on the chronicle screen, the infopanel's card among what changes". `docs/LOOK.md` _The pieces on the map_, the faction signs paragraph: "a unit's [face on the infopanel] wears its unit's in its window". Both hold today and after; no sentence changes. No player-facing text.

**Doc-impact:** none — the pages say what the player sees when the signs turn, which this line leaves as it is.

**Scope:** In: `drawSigns` in `src/ui/chronicle-scene.ts` re-reads the card the inspection stands on through the panel's `reread`, the way `showDiscs` does for the Icons switch, instead of rebuilding the face through `show`. Nothing changes on screen: the same card, the same backs, at the same place, whatever its names or foot had raised taken down as both paths already do. Out: any change to `InfoPanel`, to `card-face.ts`, or to how the map redraws its signs (`view.showSigns()` stays first). Whether the inspection's cards are worked out again before the re-read is the implementer's: no `Card` carries the signs, so the cards standing read right either way. The reconcile: the projected re-read goes through the standing one, `InfoPanel.reread`, as it is.

**Traps:**

- The face's `read` (`src/ui/card-face.ts`) reads `factionSigns()` each time it lays the window's unit out, so a re-read picks up the turned signs; the window unit is kept and re-dressed, not rebuilt.
- `reread` does nothing while no card stands, and does not settle a dissolve in flight as `show` does; the signs turn from the Graphics window over its scrim, so no inspection is mid-step then.
- `drawSigns` is reached only while the chronicle scene is active (`pressFactionSigns`, `src/ui/faction-signs.ts`).

**Plan:**

1. `src/ui/chronicle-scene.ts`: `drawSigns` re-reads the inspection's card in place through the panel; the doc comment on the field (`drawSigns`, "The map and the infopanel drawn again…") still reads true and stays.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/faction-signs.spec.ts` (its second test turns the signs on over an inspected warrior and reads the window's sign). CI proves the whole suite on the push, `e2e/inspect.spec.ts` and `e2e/faction-signs.spec.ts` among it, for the hand-back.
