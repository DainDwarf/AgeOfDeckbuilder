# Change the deployment behavior

**Line:** **Change the deployment behavior** — a green run on `main` deploys Pages while its commit is still `main`'s tip, a green run on a version's tag pushes itch through `npm run itch`, the `Latest` branch is gone, and `DOGMAS.md`, `README.md`, `CLAUDE.md` and the roadmap say so.

**Spec:** no `docs/` page; the hosting is stated in the root files, and these are the sentences, written out.

- `DOGMAS.md` → _Stack_, the CI row: "GitHub Actions on every push, any branch or tag: typecheck, lint, rules tests, e2e. Once that passes: on `main`, build and deploy to Pages, a run deploying only while its commit is still `main`'s tip; on a version's tag, build and push to itch".
- `DOGMAS.md` → _Stack_, the Hosting row: "GitHub Pages, the `dist/` built from `main`'s last green tip, served under `/AgeOfDeckbuilder/`; the itch.io page, restricted to the playtest group, the same bundle built with a relative base and pushed by butler (`npm run itch`), by CI from each version's tag. No server, ever."
- `DOGMAS.md` → the layout, the `.github/workflows/` row: "the CI check, and the two deployments it gates".
- `README.md` → _Play_, the whole paragraph: "The build of the day is at [daindwarf.github.io/AgeOfDeckbuilder](https://daindwarf.github.io/AgeOfDeckbuilder/): it follows the work as it lands, and a day's build may break. No account, no server, nothing to install." Itch is not mentioned.
- `CLAUDE.md` → _Commands_, the `npm run itch` row: "Relative-base build, then butler pushes `dist/` to the itch page as the version git describes. CI runs it on each version's tag; a hand running it needs butler logged in."
- `workflow/ROADMAP.md`, the v0.1.0 entry: "the itch page made public and pushed from `Latest` by CI" becomes "the itch page made public".

**Doc-impact:** none — no `docs/` page states the hosting; `DOGMAS.md`, `README.md` and `CLAUDE.md` do, and the line rewrites them.

**Scope:**

- In: `.github/workflows/ci.yml` — the Pages jobs follow `main`, an itch job follows a version's tag; the root files and the roadmap above; the `Latest` branch removed, on the remote and in the local clone, with the `Latest` entry of the `github-pages` environment's deployment branch policy (id 59899300; the `main` entry stays).
- A version's tag is a tag named `v*`, the annotated tag a version's close already pushes.
- Both deployments wait for `check` and every `e2e` shard of their own run, as Pages does today.
- The tip rule: a run on `main` deploys only while its commit is still `main`'s tip when its checks have passed; an older run, or a rerun of one, deploys nothing and stays green. Pages therefore holds the last green tip; a red run leaves Pages where it was, and its rerun going green deploys if it is still the tip.
- The itch job runs `npm run itch` as it stands, with butler on the runner's path and the `BUTLER_API_KEY` secret in its environment. CI's butler is pinned to 15.32.0, the version the user's machine runs, never `LATEST`.
- `npm run itch` stays runnable by hand from any tree; nothing guards it.
- Out: nothing is pushed to itch by this delivery. Itch stands at `v0.0.5-73-gbfb63ce` and stays there until v0.0.6's tag.
- Out: how the build is packaged, one bundle for both hosts, the itch page made public — the deliverable rung's, whose text stays as it is.
- Out: any care for a browser's saves meeting a new build at each delivery; saves need none before the Bronze Age.
- Reconcile: the itch job goes through `tools/itch.ts` as it is, the asset store through `.github/actions/store` as it is, the version through `tools/version.ts` as it is. The Pages build and the itch build differ by their base alone and stay apart: joining them is the rung's.
- The memory `deploy-only-on-versions` is rewritten at this delivery: its fact and its "a rerun won't deploy" both stop being true.

**Traps:**

- `actions/deploy-pages` fails when its run uploaded no Pages artifact: a run that is no longer the tip must skip the deploy job too, not only the upload.
- The workflow's `on: push` has no filter, so a tag's push already starts a full run (v0.0.5's close started three, on `main`, the tag and `Latest`); the itch job needs no new trigger, only its condition on the ref.
- `tools/version.ts` reads the version with `git describe --tags`: the itch job's checkout must carry the tag, as the Pages job's carries the whole history, or the bundle and the itch build are named by a bare hash.
- The itch build reads the asset store as the Pages build does: the store action, and `STORE_DEPLOY_KEY`.
- Broth serves butler by version at `https://broth.itch.zone/butler/linux-amd64/15.32.0/archive/default`, a zip; the address redirects to a signed download that refuses a HEAD request (403) and was not fetched whole at intake. The implementer fetches it once with a GET before relying on it, and reports a deviation if it does not answer.
- Butler reads `BUTLER_API_KEY` from the environment with no login step. The secret does not exist yet (`gh secret list` holds `STORE_DEPLOY_KEY` alone): it is the user's to create, from itch.io → Settings → API keys, before v0.0.6's close, and the hand-back says so. No run before a tag reads it.
- The `github-pages` environment already allows deployments from `main`; no setting on GitHub changes for Pages. The itch job uses no environment.
- `origin/Latest` is v0.0.5's commit, an ancestor of `main`, and the local `Latest` is an older ancestor: deleting both loses nothing. Deleting a branch starts no run. Pages serves its last deployed artifact, not the branch, so the page stays up between the deletion and the next deployment.
- `npm run lint` reads no YAML: nothing local checks the workflow file, and its proof is the run.
- The comment over the Pages job in `ci.yml` names `Latest`; it is rewritten to the trap that stands, or cut.

**Plan:**

1. `ci.yml`: the Pages jobs follow `main` under the tip rule; the itch job stands, waiting on the checks, on a version's tag alone.
2. `DOGMAS.md`, `README.md`, `CLAUDE.md`, `workflow/ROADMAP.md`: the sentences above; the board line and this file deleted.
3. After the review, the commit and the push: the run on `main` is watched as every push is. On its green verdict, with Pages deployed from `main`, `Latest` is removed — the remote branch, the local branch, the environment's policy entry — and the memory is rewritten. On a red deployment, `Latest` stays and the verdict is relayed.

**Verify:**

- `npm run lint` (Prettier on the markdown).
- No spec proves the line: it never reaches the screen.
- The proof is the delivery's own run on `main`: `pages` and `deploy` green, and the latest `github-pages` deployment's commit equal to `main`'s tip (`gh api repos/DainDwarf/AgeOfDeckbuilder/deployments?environment=github-pages`). The itch job shows as skipped on that run.
- Not proven by this delivery: the itch job, which first runs at v0.0.6's tag. The hand-back says so, and that `npm run itch` by hand from the tag is the fallback if it is red then.
- CI on the push: the whole suite, as on any push; no spec walks this change.
