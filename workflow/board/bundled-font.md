# The bundled font

**Line:** The bundled font — Source Sans 3, regular and bold, ships with the build under `public/assets/fonts/` with its licence entry and is loaded before the first text is laid out, a face that cannot be loaded failing the boot; `docs/LOOK.md` says so, the bar's ticking numbers stay Text. Doc-impact: `docs/LOOK.md`, `docs/PHASER.md`, `docs/ASSET-SOURCES.md`, `public/assets/LICENSES.md`.

**Spec:** the sentences, written out:

- `docs/LOOK.md`, a new section after _The cards_ and before _The packs_:

  > ## The type ✅
  >
  > Every word the game shows is set in **Source Sans 3**, regular and bold: Adobe's humanist sans, drawn for interfaces, its figures lining and of one width so a counter ticks in place. The face ships with the build and is loaded before the first text is laid out, so every machine lays out the same screens, and a build whose face cannot be loaded does not start. The debug console's monospace is the machine's own.

  And in _The packs_, a third bullet after game-icons.net:

  > - **Source Sans 3**, Adobe's, under the SIL Open Font License 1.1: the licence ships beside the files, and a modified version may not keep the name.

- `docs/PHASER.md`, under _Rendering under WebGL_, after the `wordWrap.callback` entry:

  > - **A Text is measured and drawn when it is made and at each change, never again when a font arrives.** The constructor sets its text at once (`src/gameobjects/text/Text.js:296`), `setText` redraws only on a change (`:639-656`), and nothing in `src/` listens to `document.fonts`: a face loaded after a Text was made leaves that Text, and every width read off it, in the fallback's. Phaser's own `load.font` is the FontFace API inside a scene's loader, and a face it cannot fetch is a console warning, the load going on (`src/loader/filetypes/FontFile.js:97-131`): it runs no earlier than the scene that asks for it, and it fails nothing. The game therefore loads its face through the FontFace API itself, before the game is made, and a face that fails to load fails the boot.

- `docs/ASSET-SOURCES.md`, under _Fonts_, a second bullet:

  > - [Adobe's Source fonts](https://github.com/adobe-fonts) — OFL; the built files, WOFF2 among them, sit on each repository's `release` branch beside the licence.

- `public/assets/LICENSES.md`: the line "No pack has entered yet." goes, and the first entry stands in its place:

  > ## Source Sans 3
  >
  > - **What:** the UI typeface, regular and bold, in `fonts/source-sans-3/`.
  > - **From:** Adobe, <https://github.com/adobe-fonts/source-sans>, release 3.052R, the files as released.
  > - **Licence:** SIL Open Font License 1.1, the text in `fonts/source-sans-3/LICENSE.md`, Reserved Font Name "Source". The licence ships with the files; a modified version may not be called Source; no credit is required.

- The failed-boot page's sentence is the standing `boot.failed` entry; the words under it are the error's own. No player-facing text is added.

**Doc-impact:** `docs/LOOK.md`, `docs/PHASER.md`, `docs/ASSET-SOURCES.md`, `public/assets/LICENSES.md`.

**Scope:**

- In: the two WOFF2 files and the licence under `public/assets/fonts/source-sans-3/`; the face loaded through the FontFace API, regular at weight 400 and bold at weight 700, both awaited before the game is constructed and added to `document.fonts`; `UI_FONT` in `src/ui/design-space.ts` becomes `'"Source Sans 3", sans-serif'`, the `sans-serif` reached only by the failed-boot page when the face itself is what failed; a failed load fails the boot through the watch in `src/failed-boot.ts`, the page showing the error's words; the docs sentences above; the licence entry; a `.prettierignore` holding `public/assets/` so a pack's own files are never reformatted; the boot spec asserting the face stands loaded, and a failure test.
- Out: the debug console's `CONSOLE_FONT`, not player-facing; any weight beyond regular and bold (the UI sets `fontStyle: 'bold'` and nothing else); a preload link in `index.html`; the type-size floor, the next line; any re-fit, since every reading lays out narrower in Source Sans 3 than in Segoe UI (the bar's seven readings 3.6% narrower, measured on the running game, and 10% narrower than CI's DejaVu Sans).
- Settled by measurement: the bar's ticking numbers stay Text. One `setText` on a reading, texture upload included (`Text.js:1486` uploads inside `updateText`), costs 0.02 ms under the headless Chromium; the tick moves at most seven readings a frame, about 0.15 ms of a frame. No bitmap font, no atlas tool.
- Settled: the face's character table holds every non-ASCII character the text table uses (− · — × ↑ ← ↓ → ✓ » «), checked at intake on the released TTF; nothing falls back to a system glyph.
- The files come from the `release` branch of adobe-fonts/source-sans, 3.052R: `WOFF2/TTF/SourceSans3-Regular.ttf.woff2` (109,632 bytes), `WOFF2/TTF/SourceSans3-Bold.ttf.woff2` (108,640 bytes) and `LICENSE.md` (4,486 bytes), unmodified; the dossier's intake downloaded them to `C:\Users\daind\AppData\Local\Temp\claude\C--Users-daind-Claude-AgeOfDeckbuilder\fabb7b15-f074-46eb-9570-53bbeacabe5f\scratchpad\source-sans\`, and `https://raw.githubusercontent.com/adobe-fonts/source-sans/release/<path>` serves each again. They keep their released names.
- Reconcile: nothing in the tree loads an asset or waits before the boot; `UI_FONT` is already the one door every style reads, and stays it.

**Traps:**

- Every scene makes its Texts synchronously, in `create` and inside the READY handler of `src/main.ts`; no scene preloads. The face must be loaded and in `document.fonts` before `new Phaser.Game`, or every Text is laid out in the fallback and never re-measured (`docs/PHASER.md`). A top-level `await` in `src/main.ts` is the place: `tsconfig.json` targets ES2022 and Vite's default build target admits it; `npm run build` proves the bundle.
- `src/failed-boot.ts` is imported first and watches the window's `error` event; a rejected top-level await in the entry module is reported to that listener as an evaluation error. The failure test proves it; if the words do not show, that is a deviation to report, not a second listener to add.
- The font's URL differs by build: the dev server serves at `/`, Pages at `/AgeOfDeckbuilder/`, the itch push at `./` (`vite.config.ts`, `tools/itch.ts`). `import.meta.env.BASE_URL` carries the base; nothing in the tree reads it yet. Never a hard-coded `/assets/...`.
- `UI_FONT` is read into module-level style constants (`WORD_STYLE` in `src/ui/resource-bar.ts` among forty files), so it stays a plain literal, evaluated before any scene.
- A family name holding a digit is quoted inside the string, `'"Source Sans 3", sans-serif'`, or the canvas parses it as a size (`node_modules/phaser/skills/text-and-bitmaptext/SKILL.md`, gotcha 3).
- `npm run lint` runs Prettier over every `**/*.md`: the OFL text in `LICENSE.md` is hard-wrapped and `proseWrap: never` would reflow it, so the pack's folder is ignored through `.prettierignore` (`public/assets/`), which does not exist yet. Prettier ignores `node_modules` alone by default. `public/assets/LICENSES.md` is the project's own and stays linted: Prettier reads `.prettierignore` patterns like `.gitignore`, so the ignore names `public/assets/fonts/` and not the folder's root file.
- `e2e/failed-boot.spec.ts` disables WebGL for its whole file (a worker-scoped option at the top level). A second test there aborting the face's request through Playwright's `page.route` still sees the font fail first, since the face is awaited before the game is made, and the words shown are the font's rejection, not WebGL's. An aborted request logs a console error of its own (`net::ERR_FAILED`) beside the page error the watch collects, so that test's assertion names what it expects of `problems` rather than copying the first test's exact list.
- CI's Chromium rasterises the face through FreeType and this machine's through DirectWrite: advances are the file's on both, antialiasing differs, and no spec reads a pixel of text. The `measurements` memory's rule of measuring a fit in DejaVu Sans ends with this line; the main session updates the memory after the ship, not the implementer.
- The `e2e` suite's `readNames` plants init scripts before the page loads; the font's fetch happens inside the page before Phaser and needs none of them.

**Plan:**

1. `public/assets/fonts/source-sans-3/` with the two WOFF2 files and `LICENSE.md` as released; `public/assets/LICENSES.md` with the entry; `.prettierignore` with `public/assets/fonts/`. Leaves standing: the pack in the repository with its record, the lint green on it.
2. `src/ui/design-space.ts`: `UI_FONT` is the face. `src/main.ts`: the two faces made through the FontFace API from `import.meta.env.BASE_URL`, loaded and added to `document.fonts`, awaited before the game is constructed. Leaves standing: every Text in Source Sans 3 on the dev server; a missing file failing the boot through the standing watch.
3. `docs/LOOK.md`, `docs/PHASER.md`, `docs/ASSET-SOURCES.md` with the sentences above. Leaves standing: the design saying what the type is.
4. `e2e/boot.spec.ts`: the first test also asserts, once the campaign screen stands, that `document.fonts.check` answers true for `18px "Source Sans 3"` and for its bold. `e2e/failed-boot.spec.ts`: a second test aborting the regular face's request through `page.route`, asserting the failed-boot page shows with the standing sentence and that no canvas stands. Leaves standing: the proof of both clauses.
5. The board line deleted.

**Verify:** `npm run check`, `npm run lint`, `npm test`, `npm run build`; the proof spec `npx playwright test e2e/boot.spec.ts`, and `npx playwright test e2e/failed-boot.spec.ts` for the failing clause; CI proves the whole suite on the push, every spec walking a boot being every spec.
