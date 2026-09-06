# Dogmas

How this project is built. Human-chosen; every session works by them, `/intake` challenges new
work against them, the `egress-reviewer` reviews against them. A rule carries a one-line *why*
only where the alternative is attractive enough to be redone by mistake. A correction the user
makes twice becomes a line here (the ratchet, at `/upkeep`).

## Working with the user

- **Orient freely, pitch before writing.** Read, time, experiment as needed — then say what you
  found, what you propose, the open forks, the one thing you couldn't verify, and wait. Once files
  exist the conversation is about revising a choice instead of making one together.
- **Design is a conversation, not a menu.** A design or creative fork gets one or two concrete
  options with trade-offs and a recommendation, in prose, and the turn ends. A pick-one prompt is
  for scoping facts (platform, count), not for choices that carry framing.
- **Stay at discussion altitude when the user is discussing.** Never author a full spec in one
  sweep; check `DESIGN.md` and `BOARD.md` first — much is pre-decided.
- **One step per turn.** Ship a step, commit it, stop with "here is what to inspect; here is what
  the next step does". The user inspects between steps.
- **Design is the spec.** Code that disagrees is wrong. A problem found in a design the user
  chose is reported with its cause — numbers where there are numbers — and the turn ends. "Go
  ahead" authorises executing the agreed design, not revisiting it. `DESIGN.md` is never edited
  down to match an implementation.
- **Unforeseen corner cases are reported, never resolved silently.** The implementer's report has
  a *Deviations* section; "none" is a valid entry, absence is not.
- **Verify a cheap claim before asserting it.** A claim never survives a second telling unchecked.
  If only expensive measurement would settle it, say it is unverified.
- **A side finding gets one line and a pointer.** If it keeps growing across turns, stop.
- **"jot: …"** appends one line to `IDEAS.md` and the current task continues. Offer to jot
  something you noticed; don't add your own without asking.
- **A bug is never an idea.** `IDEAS.md` holds features that may or may not happen; a defect or
  hazard in what already exists is reported to the user the turn it emerges and, unless fixed on
  the spot, becomes a board line through `/intake`.
- **Cut big steps into shippable substeps**, each self-contained enough for a cleared session to
  execute; name the shared mechanism that links them. Propose the cut before executing it.
- **A generator change is pitched running.** Its intake line says whether the process is fixed or
  rolled, and how wide it may vary; its pitch shows the generator ported into the mockup and run
  on the project's seeds, the port checked against the rules tests first. Why: a diagram reads
  straight, and a straight reading of a rolled process has cost a pitch round twice.

## Design principles

- **No handholding.** Players are expected to learn, misplay, play suboptimally, and lose
  occasionally. No guard rails, no warnings against a demanding choice, no "are you sure". A
  concern about a demanding option is not written down either — a ⚠️ in a doc is the same
  paranoia in prose. Genuine bugs (a mathematically unplayable state, a typo) are still bugs.
- **Committed rules live in `src/rules/`.** A disabled button is the UI's reflection of a rule,
  never its enforcement.
- **Price new content against what already does that job.** Strictly worse on every axis is dead
  on arrival, however good the flavour; "the balance pass will tune it" is not a licence to skip
  the comparison. Later-tier content may dominate earlier-tier content — that is progression.
- **Compare rates on a common basis.** A per-play yield and a per-turn yield are only comparable
  after amortising the one-shot by how often it is drawn.
- **No generative AI in assets.** Art, sound and music come from packs whose licence is recorded
  the moment they enter the repository, or are primitives drawn by code; a generative model
  produces none of it, placeholders included. Why: a part of the audience rejects genAI assets
  outright, and a placeholder has a way of shipping.
- **A code-drawn placeholder is a flat polygon** — one fill, one outline, no curves, no gradients,
  no detail work. A primitive that starts wanting beauty is an asset and waits for its pack. Why:
  an elaborate mark authored by the model is genAI art in polygon clothing.

## Writing rules

- **Glossary verbs only.** Every gameplay term on a card, in the UI, in the codex and in code
  comes from `GLOSSARY.md`. No synonym, no paraphrase, no "elegant variation". A missing term is
  a design question for the user.
- **A card name is content, not vocabulary.** Prose cites a card by its verbatim name; code reaches
  it only through its text key, never a re-typed literal.
- **Card text is the shortest phrasing that is unambiguous.** Then shorten it again.
- **UI tooltips are glanceable one-liners** — what it is, where it comes from. They name no
  specific card or scenario and explain no mechanic; the codex is for learning, tooltips are for
  players who already know.
- **Explanatory text stays generic.** Onboarding copy describes systems, never the specific
  content the player is about to meet.

## Code

- **Locality first.** Co-locate what changes together; keep files small enough to read in one
  pass. Extract a module only behind an interface much narrower than what it hides. Layering
  ceremony (clean-arch, hexagonal indirection) is an anti-pattern here: shallow modules are token
  cost and misuse surface.
- **KISS is hazard avoidance.** Difficulty is not human hours — a big rewrite is cheap. What is
  expensive is hazard: non-local interdependencies, behaviour not evident from the code where it
  lives, traps for a session without today's context. Prefer the design a fresh session
  understands from the files in front of it.
- **Single source of truth for facts; repetition for shape.** Schemas, constants, protocol rules
  live in one place. Code that merely *looks* similar but is causally unrelated stays repeated;
  never factor on resemblance.
- **One choke point per invariant.** A rule is enforced by the one function every path goes
  through, not by convention at each call site. Fix the mechanism, not the case that surfaced it —
  but generalise only the axis with a real second instance; no seams for zero instances. That
  governs code machinery. The shape of a content declaration may be sized against content the
  design foresees, but only the user sizes it: the futures are put to them in the pitch, and the
  implementer never widens a declaration for content that does not exist yet. A special case that
  needs a guard comment to survive is the wrong design: uniformity beats a locally simpler
  shortcut, so remove the shortcut, not the comment.
- **A closed set is switched, never tested.** Where a value is one member of a closed union, branch
  with a `switch` over every member and no `default`, so the typecheck refuses the member added
  later; an `if` or a ternary with an otherwise-branch takes the new member silently. Why: the
  otherwise reads as a fallback and is a hole.
- **An aim predicate and an effect closure are pure over the chronicle**, and an effect changes it
  only through the rules' named helpers, so an invariant stays behind one door. Closures live on
  content, never in the state: a save is the state serialised, and no closure survives that.
- **Data coherence is never deferred.** An id must resolve to real content, a seed must be
  attainable; these checks exist from day one regardless of how provisional the numbers are.
  One rejection vocabulary across all validators.
- **Absorb, don't duplicate.** When a static concept becomes editable, the static entries become
  seed data of the editable type; no parallel "custom" type survives.
- **A named constant only for readers far apart.** Two adjacent lines cannot drift; inline the
  literal.
- **Tools are consumers of `src/rules/`, never peers.** A simulator, an editor, a profiler reads
  the rules through their public API; no tool-serving hook or field lands in game data or rules.
- **Game logic is deterministic.** No ambient randomness in `src/rules/` — every random draw goes
  through the seeded generator threaded in the state, so a chronicle replays from its seed. Why
  the reminder: `Math.random()` and `Phaser.Math.RND` are one import away.
- **Player-facing text is keyed data, never a literal in code.** A sentence is one entry, never
  assembled from fragments. English is the only language; this keeps another one a file away.
- **Prefer the API's native convention.** Feed a library the coordinate space and data shape it
  documents; never compensate with metadata — an origin zeroed, a sign flipped, an offset added.
  Why: the compensation draws right while everything else that reads the object still trusts the
  metadata.
- **Comments are for traps only.** A comment states a non-local constraint invisible at the point
  of reading. No paraphrase of the code, no history ("used to…", "step 3 of…"), no design
  rationale (that is `DESIGN.md`), no explanation of code elsewhere (a bare pointer at most — and
  if the explanation can't be kept local, the code may be misplaced; say so). No `TODO`: discovered
  work goes through `/intake` or gets done now. Re-shave a comment when editing near it.

## Testing

- **A test asserts a rule a player could state**, exercised through a move or a boundary (play a
  card, end a turn, resolve income, load a save), on a **synthetic fixture** defined in the test
  and pushed through the real code path; where randomness is involved, from a seed. Never a
  function's signature, never a real piece of content's numbers, never a Phaser detail — a pixel,
  a frame count, a coordinate on screen.
- **Rules tests are Vitest, in Node**, co-located with the module they cover as `<module>.test.ts`.
  So is a pure function on the UI side — a settings rule, a layout computation — that a Playwright
  spec would only assert slowly; the on-screen half of the same feature stays with Playwright.
- **UI is verified in two passes.** The standing suite is Playwright against the dev server in
  Chromium: the app boots, reaches the screen it should, and logs nothing. What it *looks* like —
  layout, overlap, clipping, contrast, colour-vision — is an on-demand mechanical pass through the
  `ui-check` agent, driven by the `visual-check` skill. Whether it *feels* right is the user's
  call and is never automated.
- **The Playwright suite is CI's.** It runs on every push, any branch, one worker, no retries;
  locally the cap is four workers, so a timeout means a bug either way. A session runs one spec at
  a time, the one its line adds, touches or names (`npx playwright test e2e/<spec>.spec.ts`), and
  a hook refuses a local run that names no spec; the whole suite runs locally only when the user
  runs it in their own terminal.
- **No mocks.** A pure `src/rules/` needs none; a mock that mirrors the code tests the code
  against itself. Use real dependencies or don't test that path.
- **Tests import their runner API explicitly** — Vitest's `globals` stays off.
- **A test is never weakened to make it pass.** Deleting a test says that behaviour is no longer
  promised, which is a design change made with the user. A failing check is reported failing, with
  its output; never "should pass".

## Git

- **Commit directly to `main`.** Solo trunk-based work; no feature branch and fast-forward
  ceremony. Branches are for experiments that may be discarded.
- **Claude owns commit granularity.** A shipped line is committed once its trinity has landed and
  the review passed; a contained unit never waits for sign-off. One unit per commit — never two
  interleaved.
- **A content change and its measurement are one commit**; the mechanism it needed lands in its
  own inert commit before it.
- **During a tuning pass, edits stay uncommitted** until the user says the numbers are right. Say
  once that the tree carries the change; never roll back or ask keep-or-revert mid-pass.
- **Git is the backup.** No scratchpad copies of tracked files; `git checkout <file>` reverts, and
  `git status --porcelain <file>` confirms it printed nothing.
- **Never push unless asked.** The repository will be public; a push is a publication.
- Commit messages end with `Co-Authored-By: Claude <model> <noreply@anthropic.com>`.

## Docs

- **Three lifespans**: code (permanent, how), `docs/` (standing, what is / what was decided), task
  context (ephemeral: board, task files, ideas). Anything without a lifespan is noise — delete it.
- **`docs/` states what is.** No journals, no ADRs, no reasoning journeys. A standing decision gets
  one line of *why*, and only when the rejected alternative is attractive.
- **Pivots are edits.** An overturned decision changes `docs/` in the same unit of work; the old
  version lives in git only.
- **Each doc owns one altitude.** The board carries a line and a pointer; the task file carries the
  contract; the `docs/` page carries the settled fact. Nothing is stated twice.
- **A task file is written once, on the settled state.** Findings stay in the conversation until
  they settle — intermediate readings are usually wrong, and a superseded number left in a file
  reads as fact next session.
- **Durable never cites transient.** A `docs/` page or a changelog entry never references a board
  line, a task file, or an idea.
- **`CHANGELOG.md` is for players**, written at a version bump, in their words.
- **`CLAUDE.md` stays short.** It is loaded every session; detail lives in `docs/` pages read on demand.
- **Skills state their rules plainly** — no justifying, no referencing another skill. Calibration
  numbers are data and stay.

## Tooling

- **Search for an existing tool before writing one.** An unmaintained package is not an option;
  prefer tools whose output Claude can read in a terminal; pin versions in `npx`-style invocations.
- **Standing analyses are CLIs with flags, never scratchpad scripts.** A question the CLI cannot
  answer is a flag to add.
- **Slow commands run in the background**; a spawned child agent is awaited by ending the turn.
- **Profile before optimising**, keep measured and inferred visibly separate, and never slip a
  core change in as a performance fix for a tool.

## Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript, `strict` |
| Game framework | Phaser 4 |
| Dev server and bundler | Vite 8 |
| Rules tests | Vitest 4 |
| UI verification | Playwright, Chromium only |
| CI | GitHub Actions on every push, any branch: typecheck, lint, rules tests, e2e |
| Lint and format | Biome, one `biome.json` |
| Package manager | npm on Node 24; `package-lock.json` is committed |
| Hosting | itch.io HTML5 page, the zipped `dist/`. No server, ever. |
| Desktop wrapper | Tauri 2 — not installed; it needs Rust, and it is installed when the desktop target is taken |

- **`src/rules/` never imports Phaser and never touches the DOM; `src/ui/` never mutates state.**
  The game is one pure function, `apply(state, command) → stages`: the ordered steps the command
  resolves as, never none, each carrying the state it leaves, the last of them carrying the state
  the command ends on. The seeded generator's state lives inside `state`. That single rule is what
  makes a chronicle replay from its seed, a save the state serialised, and a headless simulator
  `apply` in a loop keeping the last stage's state. Why stages and not the state alone: what
  happened — which tile attacked which — is not in the state that follows it, and the chronicle
  screen has to play it. Phaser renders a state and emits commands, nothing else. Debug commands are commands
  like any other, behind a flag.
- **All UI is Phaser** — inside a chronicle and outside it alike: launch, collection, deck
  editing, codex. `index.html` carries no UI: a style reset, the script that boots Phaser, and
  the canvas Phaser creates. Why: a card appears on every one of those screens and must have
  exactly one renderer; a DOM menu layer would be a second one.
- **The map's geometry lives in `src/rules/`**, in axial coordinates. A tile is drawn as an
  ordinary Phaser object from those coordinates; Phaser's tilemap system is not used, because the
  map is a rules structure the renderer reads, not a renderer structure the rules ask about.
- **Every dependency is pinned exactly** in `package.json` — no `^`, no `~`. Why: a build that
  changed because an upstream patch landed is a failure with no local cause.
- **Assets carry a licence record.** A pack entering `public/assets/` gets its entry in
  `public/assets/LICENSES.md` in the same unit of work; no entry, no ship.

The layout, which embodies the rule above:

```
index.html          the page Phaser puts its canvas in; no UI of its own
src/main.ts         boots the Phaser game
src/rules/          pure TypeScript: state, commands, the seeded generator
src/ui/             Phaser scenes, and the design space they lay out in
e2e/                Playwright specs
.github/workflows/  the CI check
public/assets/      art, sound, music, each pack with its licence entry
dist/               the build; what is zipped and uploaded
```
