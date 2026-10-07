# A save forged at a campaign state

**Line:** A save forged at a campaign state — `npm run forge -- <technology>...` writes a save file the game's Import reads whole, holding a campaign on the first civilization with the technologies named and every need of them learned through the rules' own door, its influence replaced where `--influence` is given; `--list` prints the technology ids by age; one Vitest test spawns the command and reads its file through the game's own reading. Doc-impact: none.

**Spec:** `docs/META.md` → _The save_: the save file is the save whole, the campaign and the chronicle in progress, encoded in base64 in a file named `age-of-deckbuilder-save-<date>.adbsave`, the date the player's own day; a save file is read as the boot reads the save. The forged file is one such, holding a campaign and no chronicle. `docs/META.md` → _The campaign_: a technology is learned once its achievement has paid, what it unlocks is added to the collection with the copies it names, the achievement's influence taken with it. The tool learns each technology through that one door, so the campaign it forges is one the game could have reached, the influence flag aside. No `docs/` sentence is added or changed, and nothing player-facing is written: what the tool prints is internal, as the debug console's words are, and is no _Authored_ entry.

The command, every form:

```
npm run forge -- raft fishing
npm run forge -- --influence 12 trapping
npm run forge -- --out stone-state.adbsave raft
npm run forge -- --list
npm run forge -- --list stone
npm run forge -- --list=stone
```

What `--list` prints, the ages in the catalogue's order, each technology under the age whose achievement earns it, in the order the catalogue's technologies table lists them; `--list stone` prints that one section, header included:

```
nomadic:
- settlement
stone:
- herbalism
- agriculture
- trapping
- fire
```

**Doc-impact:** none — the tool is a consumer of the rules and changes nothing the player meets; the root files take a line each, named in the Plan.

**Scope:**

- In: `tools/forge-save.ts`, run by the package script `forge`, the itch push's shape. Its entry runs on plain Node and imports `vite` and `node:*` alone: it starts Vite's dev server in middleware mode with no HMR and no watcher, makes a module runner on the server's `ssr` environment, imports the tool's body through the runner, and closes the runner and the server when the body returns. The body is ordinary TypeScript with ordinary imports of the content, the rules and the shared walk; how the two halves are cut is the implementer's.
- In: the arguments, parsed through Node's own `parseArgs`. The positionals are technology ids. `--influence <n>`, a non-negative integer, replaces the forged campaign's influence after the technologies are learned. `--out <path>` is the file written, written over whatever stood; its default is the game's own export name for the machine's day, in the current directory. `--list`, with an age id or none, prints the list above and writes nothing.
- In: the campaign forged: a new one on the catalogue's first civilization (`freshCampaign`), the technologies named learned through the shared walk, each with its unmet needs first, then the influence replaced where the flag is given, then written through `writeSaveFile`. The cards unlocked stand in the collection alone, in no civilization's deck, as the game leaves them (the user's choice). The tool prints each technology learned, in the order learned, and the path it wrote.
- In: refusals, each printed and exiting non-zero with nothing written: a technology the catalogue does not hold (the rules' own refusal, through the door); an age `--list` names that the catalogue does not hold (the rules' refusal through `ageOf`); an `--influence` that is not a non-negative integer; a flag the tool does not know; no technology named and no `--list`, which prints the command's usage.
- In: the shared walk. `learnedWithNeeds` leaves `e2e/chronicle-screen.ts` for a module under `tools/` that takes the catalogue as its first argument, the user's choice over a folder of tooling helpers; `e2e/archipelago.spec.ts` imports it from there and hands it `CATALOGUE`. The walk skips a technology already learned, whether named a second time or learned as an earlier one's need, so `fishing raft` and `raft fishing` forge one campaign; the needs are learned in the catalogue's order, as today. Nothing else about the walk changes.
- In: the save file's name. `saveFileName` leaves `src/ui/menu-scene.ts` for `src/rules/save-file.ts`, exported, the menu importing it and the Export press unchanged; the tool's default `--out` reads it. `e2e/manage-save.spec.ts` keeps its own spelling of the name as its oracle.
- In: `tools/forge-save.test.ts`, the tool's one test, Vitest's include widened to `tools/`. It spawns the command with a temporary `--out`, reads the file through `readSaveFile(CATALOGUE, …)` and asserts: nothing dropped, the technology it named and every need of it, transitively, among the campaign's learned technologies, the needs read from the catalogue; the influence equal to the flag's when given; `--list` printing one section per age holding the technologies that age's achievements earn, the oracle read from the catalogue's ages. The technology it names is read from the catalogue — the first whose needs are not empty — never a literal id.
- In: the root files. `package.json` gains the script `"forge": "node tools/forge-save.ts"`; `CLAUDE.md` → _Commands_ gains the row `npm run forge -- <technology>...`, one sentence; `DOGMAS.md` → _Stack_, the layout's `tools/` entry reads the save forge beside the itch push.
- Out: a chronicle forged; cards added to a deck; the game's names in place of ids; a second civilization; a loader module shared with the headless simulator, which lifts this tool's loader when its rung is cut; any change to `src/rules/campaign.ts` or `src/rules/save.ts`.
- Corner cases decided: `--influence 0` stands; the campaign's card numbers follow the learning order and are read by nothing as an order; the date in the default name is the machine's day, as the menu's is; a technology named twice is learned once.
- Reconcile: the needs-first walk and the tool's become one, under `tools/`, the specs importing it; the file's name becomes one, under `src/rules/save-file.ts`; the rules load from Node through Vite's module runner, the dependency the itch push already imports, as it is; the list reads the ages' achievements for the technology each earns, the catalogue refusing a technology earned by none or by two (`treeHeld`), as it is; the campaign is built through `freshCampaign` and `learnedInto`, the file through `writeSaveFile`, as they are.

**Traps:**

- Node runs `.ts` by stripping types and resolves no extensionless import: `import … from '../rules/catalogue'` fails under plain Node (measured). Only the entry runs on plain Node; everything that imports `src/` is imported through the runner. Measured: `createServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, logLevel: 'error' })` plus `createServerModuleRunner(server.environments.ssr, { hmr: false })` loads the content and the rules in 360 ms and the forged save reads back whole; the process exits only once both `runner.close()` and `server.close()` have run.
- Node's `parseArgs` under `strict: true` refuses a bare `--list` on a string option; under `strict: false` a string option reads `true` for a bare `--list`, `"stone"` for `--list stone` and for `--list=stone` (measured). Non-strict parsing accepts unknown flags silently, so the tool refuses them itself.
- `src/rules/save-file.ts` runs in the browser and in Node alike and imports no DOM API beyond `btoa`, `atob`, `TextEncoder` and `TextDecoder`, which Node 24 has as globals; `saveFileName` takes a `Date` and reads nothing else, so it moves whole.
- `src/rules/` never imports `src/content/`, and `src/ui/save-entry.ts` is the one UI module beside the scenes that imports the content; the tool's body imports `src/content/catalogue.ts` as the specs do, and nothing under `src/` imports from `tools/`.
- Biome lints `tools/` and refuses an import cycle; `tsconfig.json` includes `tools`, so `npm run check` covers the entry, the body, the walk and the test. `@types/node` is installed.
- `learnedInto` is imported in `e2e/chronicle-screen.ts` for the walk alone; `technologyOf` stays, used elsewhere in the file. `wonCampaign` beside it stays as it is.
- `e2e/manage-save.spec.ts` asserts the export's file name from its own spelling, the oracle, and asserts Import on a `writeSaveFile` output; neither changes.
- Vitest's `include` is `src/**/*.test.ts` in `vite.config.ts`; the tool's test runs only once it is widened.
- `npm run e2e` is refused by a hook; a spec runs one at a time, `npx playwright test e2e/<spec>.spec.ts`.

**Plan:**

1. `src/rules/save-file.ts`: the export's name, exported; `src/ui/menu-scene.ts` reads it. `npm run check`, `npm test` green.
2. The walk's module under `tools/`, the catalogue its first argument, skipping a technology already learned; `e2e/chronicle-screen.ts` loses the walk and the import only it used; `e2e/archipelago.spec.ts` imports it from `tools/`. `npx playwright test e2e/archipelago.spec.ts` green.
3. `tools/forge-save.ts`, the entry and the body; `package.json`'s `forge` script; `vite.config.ts`'s include widened; `tools/forge-save.test.ts`. `npm test` green, the new test among it.
4. `CLAUDE.md` → _Commands_, `DOGMAS.md` → _Stack_ layout; `workflow/BOARD.md`: the line deleted. No `docs/` page changes.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is the tool's Vitest test, `tools/forge-save.test.ts`, run by `npm test`; the one spec, for the moved walk, `npx playwright test e2e/archipelago.spec.ts`. CI proves on the push: `e2e/manage-save.spec.ts` for the moved name, and the whole suite.
