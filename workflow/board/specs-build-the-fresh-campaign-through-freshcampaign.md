# Specs build the fresh campaign through freshCampaign

**Line:** Specs build the fresh campaign through freshCampaign — `rg -n 'newCampaign\(CATALOGUE, firstsOf\(\)\.civilization\)' e2e` finds nothing, and `rg -n 'freshCampaign\(CATALOGUE\)' e2e` finds the eight sites below; `npm run check` and `npm run lint` pass. Doc-impact: none.

**Spec:** none in `docs/`: the line is internal to `e2e/`, and no design page names a spec helper. No player-facing sentence.

**Doc-impact:** none — `docs/` says nothing about how the specs build a campaign.

**Scope:**

- In: the eight places in `e2e/` that build the fresh campaign as `newCampaign(CATALOGUE, firstsOf().civilization)`, each of which reads `freshCampaign(CATALOGUE)` instead:
  - `plant` in `e2e/chronicle-screen.ts`;
  - `e2e/campaign.spec.ts`: the two influence reads on a new campaign and the `opened` campaign a won chronicle is paid into;
  - `e2e/ending.spec.ts`: the campaign the won chronicle is paid into;
  - `e2e/resume.spec.ts`: the influence read after the unreadable save;
  - `e2e/tree.spec.ts`: `openCampaign`'s default campaign and the campaign the won chronicle is paid into.
- The value is the same: `freshCampaign` is `newCampaign(catalogue, firstCivilization(catalogue))`, and `firstsOf().civilization` is `firstCivilization(CATALOGUE)`. No assertion changes.
- `firstsOf` stays, with its signature: it still answers the age, the region and the civilization for `launchedOn`, `openSaved` and the specs that plant a chronicle.
- Out: the rules tests in `src/`. They build campaigns on the fixture's `CIVILIZATION_ID` or on each civilization in turn, not on the fresh campaign, and the line names the specs.

**Traps:**

- `freshCampaign` lives in `src/rules/save.ts`, not in `src/rules/campaign.ts` beside `newCampaign`. `chronicle-screen.ts` already imports `writeSave` from there.
- The textOf line ships just before this one and rewrites the influence reads in `campaign.spec.ts` and `resume.spec.ts` around these very expressions. Find the sites with the search in the line, not by line number.
- Imports left unused must go, or Biome fails `npm run lint`. From the reading today: `newCampaign` leaves `campaign.spec.ts`, `ending.spec.ts`, `tree.spec.ts` and `resume.spec.ts`, where the whole import line goes, and leaves `chronicle-screen.ts`, which keeps the `Campaign` type. `firstsOf` leaves the imports of `campaign.spec.ts`, `ending.spec.ts` and `tree.spec.ts`, while `resume.spec.ts` keeps it. Check each file, since the textOf line may have changed its imports.

**Plan:**

1. `e2e/chronicle-screen.ts`: `plant` builds its campaign through `freshCampaign`. Its doc comment still says a new campaign on the first civilization, which stays true.
2. The four specs read `freshCampaign(CATALOGUE)` at their sites, and the imports left unused are gone. The search in the line finds nothing.

**Verify:** `npm run check`, `npm run lint`, and the two searches in the line. Proof spec: none, since no assertion and no screen changes; the suite on the push is the proof. CI proves the specs that walk a touched site: `campaign`, `ending`, `resume` and `tree`, plus every spec that plants a chronicle through `plant` or `openSaved`.
