# Publish to itch.io

**Line:** Publish to itch.io — `npm run itch` builds the bundle with a relative base and pushes `dist/` to the itch page's `html` channel under the version git describes, and the channel holds a build.

**Spec:** no design page: the game is untouched. The standing facts change in `DOGMAS.md` _Stack_ and in `CLAUDE.md`'s command table, and the roadmap moves the public publish:

- `DOGMAS.md` _Stack_, the Hosting row, becomes:

  ```
  | Hosting | GitHub Pages, the `dist/` built from `Latest`, served under `/AgeOfDeckbuilder/`; the itch.io page, restricted to the playtest group, the same bundle built with a relative base and pushed by butler from any tree (`npm run itch`). No server, ever. |
  ```

- `DOGMAS.md` _Stack_, the layout block: the `dist/` line becomes `dist/               the build; what Pages deploys and the itch push sends`, and a `tools/` line goes in after `.github/workflows/`: `tools/              the standing scripts: the itch push`.
- `CLAUDE.md`, the command table, gains a row after `npm run build`:

  ```
  | `npm run itch` | Relative-base build, then butler pushes `dist/` to the itch page as the version git describes. Butler must be logged in. |
  ```

- `workflow/ROADMAP.md`, the v0.1.0 rung: "the itch.io publish" becomes "the itch page made public and pushed from `Latest` by CI".

No player-facing sentence.

**Doc-impact:** `DOGMAS.md` _Stack_ and `CLAUDE.md` _Commands_; no `docs/` page.

**Scope:**

- In: one npm script, `itch`, backed by one script in a new `tools/` folder: build with a relative base, read the version from git, push `dist/` with butler to `daindwarf/age-of-deckbuilder:html`. The doc edits above. The first push, made at the ship, so the channel exists.
- Out, deferred to v0.1.0: the CI push from `Latest`, the itch API key as a GitHub secret, a README link (the page is restricted). Out entirely: a version shown in-game, a second channel or page.
- The version string is git's: `git describe --tags --always --dirty`, today `v0.0.3-2-320-gbbe4c96`, `-dirty` appended when the tree has uncommitted edits. A dirty tree pushes what is on disk; that is the point of the command, and nothing refuses it.
- The build goes to `dist/`, the same folder the Pages build uses; whichever build ran last stands there, and `dist/` is gitignored.
- The channel is named `html` by convention only. Whether the upload plays in the browser is a checkbox on the itch edit page, which the user ticks after the first push, along with the embed mode; the hand-back says so.
- The build's chunk-size warning (one chunk over 500 kB) predates the line and is not its business.

**Traps:**

- Vite's config sets `base` to `/AgeOfDeckbuilder/` on `build`; the CLI flag `--base=./` overrides it, verified on 2026-09-23 (`index.html` in the output references `./assets/...`). `vite.config.ts` is not touched.
- npm on Windows runs scripts through cmd, so `$(git describe ...)` is not available in `package.json`; hence a script that runs git, vite and butler itself. Node 24 runs TypeScript directly, if the implementer prefers it to plain JS; either way `npm run check` and `npm run lint` must pass on the file, and Biome lints `tools/` like everything else.
- butler is installed at `%LOCALAPPDATA%\Programs\butler\butler.exe` and on the user's PATH, but a shell started before 2026-09-23 does not see that PATH entry. The script calls `butler` by name, since CI will run it on Linux later; a session shell that cannot find it uses the full path to verify.
- butler is logged in as `daindwarf`, and `butler status daindwarf/age-of-deckbuilder` answered "No channel found" before the ship: the first push creates the channel.
- itch marks only one upload per page as playable in the browser, and the channel name does not set it. One page, one channel.

**Plan:**

1. `tools/` with the script, and the `itch` entry in `package.json`'s scripts: the command runs end to end from the project root and leaves `dist/` built with the relative base.
2. The first push: `npm run itch`, then `butler status daindwarf/age-of-deckbuilder` shows the `html` channel holding the build with the version string.
3. `DOGMAS.md` _Stack_, `CLAUDE.md`'s table and `workflow/ROADMAP.md` edited as the Spec writes them; the board line deleted.

**Verify:** `npm run check`, `npm run lint`, `npm test`; the proof is the push, `butler status daindwarf/age-of-deckbuilder` listing the `html` channel with a build. No spec: the line never reaches the screen. CI proves nothing new on the push; the whole suite runs as it does on every push.
