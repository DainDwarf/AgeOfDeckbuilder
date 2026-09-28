# Specs read a named text through textOf

**Line:** Specs read a named text through textOf — `rg -nU 'named\?\.\([^)]*\)\?\.object as\s*\|?\s*Phaser\.GameObjects\.Text' e2e` finds one hit, `textOf`'s own line in `e2e/chronicle-screen.ts`; `npm run check` and `npm run lint` pass. Doc-impact: none.

**Spec:** none in `docs/`: the line is internal to `e2e/`, and no design page names a spec helper. No player-facing sentence.

**Doc-impact:** none — `docs/` says nothing about how the specs read the screen.

**Scope:**

- In: the eleven copies of a named-text read that the search above finds today, besides `textOf` itself:
  - exact copies of `textOf`'s behaviour (the text, or nothing where no such name stands): `influenceReads` in `e2e/campaign.spec.ts`, the inline influence read in `e2e/resume.spec.ts`, `seedReads` in `e2e/menu.spec.ts`, and `panelMovement`, `titleOf`, `loreOf` in `e2e/chronicle-screen.ts`;
  - readers that throw where the text is missing: `endTurnLabel` in `e2e/chronicle-screen.ts`, `slotReads` in `e2e/controls.spec.ts`, `paintedPiles` and `paintedReadings` in `e2e/broken-motion.spec.ts`. These read through `textOf` and keep their own throw, with its message, where `textOf` answers nothing, so a failing run still names the missing text; their return type stays `string`.
- The named helpers in `e2e/chronicle-screen.ts` keep their names and signatures; none of their callers change.
- Out: readers that pick a text out of a container's children rather than a text by its own name — the kind label, the bubble, the note lines, the console lines, the infopanel's lines, `chronicle-screen.ts` around lines 383, 914, 974, 988, 999, 1032, and `console.spec.ts` — they are a different read and `textOf` does not do it.
- Out: `resume.spec.ts`'s `newCampaign(CATALOGUE, firstsOf().civilization)` on the line after the influence read; that is the next board line's.
- No assertion changes: every `expect` reads the same value it read before.

**Traps:**

- `paintedPiles` and `paintedReadings` today read all their texts in one `page.evaluate`; through `textOf` they read one per round trip. That is sound only because they are called after `waitGameClock` has waited the motion out and the screen stands still — keep them called there.
- A spec that no longer casts to `Phaser.GameObjects.Text` anywhere may leave its `import type Phaser from 'phaser'` unused; Biome flags it in `npm run lint`. Remove it only where nothing else in the file uses `Phaser`.

**Plan:**

1. `e2e/chronicle-screen.ts`: `panelMovement`, `titleOf`, `loreOf` read through `textOf`; `endTurnLabel` reads through it and throws as before where it answers nothing. The file's search hits are down to `textOf`'s own.
2. The specs: `campaign.spec.ts`, `resume.spec.ts`, `menu.spec.ts`, `controls.spec.ts`, `broken-motion.spec.ts` read through `textOf`, imported from `./chronicle-screen`; the throwing readers keep their throw; imports left unused are gone. The search finds `textOf`'s line alone.

**Verify:** `npm run check`, `npm run lint`, and the search in the line. Proof spec: none — no assertion changes and no screen changes; the suite on the push is the proof. CI proves the specs that walk a touched reader: `campaign`, `resume`, `menu`, `controls`, `broken-motion`, `boot`, `capstone`, `camps`, `deal`, `hover`, `inspect`, `settle`.
