# The capstone's two groups named apart

**Line:** The capstone's landing is the `capstone-landing` group and its second script the `capstone-continued` group, both in the closed set `src/rules/stages.ts` holds, and neither the victory read nor the landing's window reads the turn to tell them apart; `npm test` and the capstone spec pass.

**Spec:** `docs/CHRONICLE.md` → _Events and the capstone_, unchanged, is the rule: the capstone's turn lands it alone, its landing runs straight, and a second script it may carry runs on every turn after the one it lands on, before whatever that turn deals; the condition is read from the landing on. `docs/DOGMAS.md` → _Code_, "A group is a name for why, over stages", unchanged: the group names are the closed set `src/rules/stages.ts` holds. No player-facing sentence: the groups are the flow's vocabulary and nothing on the screen reads a group's name.

**Doc-impact:** none — no design page names the group; the names live in the closed set the dogma points at.

**Scope:**

- In: the `capstone` group name split in two. The events phase's group on the capstone's turn, over the next due turn rolled and the landing, is `capstone-landing`. The group over the second script, on every turn after, is `capstone-continued`. Every switch over `Group['name']` — the rules, the four listeners in `src/ui/` — takes the two members in place of the one, so the typecheck names each site. The victory read in `src/rules/chronicle.ts` learns the landing from the group's name alone and no longer compares the group's turn to the timeline's. The landing's window in `src/ui/overlay.ts` opens on `capstone-landing` alone and no longer compares turns either. The tests in `src/rules/schedule.test.ts` that read the group by name follow the split, each naming the group it means.
- Out: the window names. `stands: 'capstone'`, the `raiseTitle` and `layGrid` names in the overlay, and `named('capstone')` in the e2e helpers name the capstone's window, not a group; they stay. The `Capstone` content type and its fields `lands`, `continues`, `passes` stay. No behaviour changes: the same stages in the same order, under two names instead of one.
- Corner cases, already decided by the code and unchanged: a capstone carrying no second script stages no `capstone-continued` on the turns after its own; the landing's group is a stage of its own on its turn even where it lands nothing; a chronicle started on the capstone's turn or after is already past the landing, and the victory read keeps that.

**Traps:**

- Two readers told the groups apart by turn, not one. The line names the victory read, `passedOn` in `src/rules/chronicle.ts`; the overlay's `grouped` listener in `src/ui/overlay.ts` does the same at its `capstone` case. Both drop the turn comparison; leaving either one compares a turn nobody needs any more.
- `src/rules/stages.ts` holds the doc comment naming every group; it says what each of the two new names is, in the same voice as the rest. `docs/DOGMAS.md` → "A closed set is switched, never tested": no `default`, no `startsWith('capstone')`.
- `src/rules/schedule.test.ts` reads `'capstone'` by name in the staged-name lists, in `heldBy`, `stagedBy` and `opened`, and one test asserts a capstone with no second script stages no capstone on the turns after its own: that one now asserts no `capstone-continued`. The names of the tests themselves say "capstone group"; they may say "landing" and "second script" where that reads truer.
- `e2e/chronicle-screen.ts` reads `named('capstone')` as a window name; it is not a group and does not change.

**Plan:**

1. `src/rules/stages.ts`: the `PlainGroup` union holds `capstone-landing` and `capstone-continued` in place of `capstone`, and the type's comment names both. The typecheck now lists every site.
2. `src/rules/schedule.ts`: the events phase groups the landing under `capstone-landing`, the second script under `capstone-continued`; the two doc comments say so.
3. `src/rules/chronicle.ts`: the victory read learns the landing from the `capstone-landing` name alone, the turn comparison gone, its comment shaved to match.
4. `src/ui/overlay.ts`: the landing's window opens on `capstone-landing` with no turn check; `capstone-continued` plays nothing there. `src/ui/hand.ts`, `src/ui/map.ts`, `src/ui/piles.ts`, `src/ui/resource-bar.ts`: the two names in place of the one, each playing nothing as before.
5. `src/rules/schedule.test.ts`: every read of the old name reads the one it means.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and `npx playwright test e2e/capstone.spec.ts` — the spec that opens on the capstone's window and holds the end of turn on its landing.
