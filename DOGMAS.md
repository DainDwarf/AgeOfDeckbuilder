# Dogmas

How this project is built. Human-chosen; every session works by them, `/intake` challenges a board line against them, the `egress-reviewer` reviews against them. A rule carries a one-line _why_ only where the alternative is attractive enough to be redone by mistake. A correction the user makes twice becomes a line here (the ratchet, at `/upkeep`).

## Working with the user

- **Orient freely, pitch before writing.** Read, time, experiment as needed — then say what you found, what you propose, the open forks, the one thing you couldn't verify, and wait. Once files exist the conversation is about revising a choice instead of making one together.
- **Design is a conversation, not a menu.** A design or creative fork gets one or two concrete options with trade-offs and a recommendation, in prose, and the turn ends. A pick-one prompt is for scoping facts (platform, count), not for choices that carry framing.
- **A pitch's forks are design-shaped** — rules semantics, player-facing shape, numbers, scope. Where a function or module lives is the implementer's initiative, a suggestion in the brief at most; a stand-in's look is not a fork — name the precedent it follows and build; a mockup is for content and screens that ship.
- **Stay at discussion altitude when the user is discussing.** Never author a full spec in one sweep; check the design pages and `workflow/BOARD.md` first — much is pre-decided.
- **One step per turn.** Ship a step, commit it, stop with "here is what to inspect; here is what the next step does". The user inspects between steps.
- **Design is the spec.** Code that disagrees is wrong. A problem found in a design the user chose is reported with its cause — numbers where there are numbers — and the turn ends. "Go ahead" authorises executing the agreed design, not revisiting it. A design page is never edited down to match an implementation.
- **Unforeseen corner cases are reported, never resolved silently.** The implementer's report has a _Deviations_ section; "none" is a valid entry, absence is not.
- **A sentence the implementer authored is put to the user at the hand-back.** A player-facing entry or a `docs/` sentence the dossier did not write out verbatim is listed in the report under _Authored_, and the hand-back quotes each with where it shows; "none" is a valid entry, absence is not. Why: the hand-back relays deviations and advisories, and a sentence that is neither reads as settled.
- **Verify a cheap claim before asserting it.** A claim never survives a second telling unchecked. If only expensive measurement would settle it, say it is unverified.
- **A side finding gets one line and a pointer.** If it keeps growing across turns, stop.
- **"jot: …"** appends one line to `workflow/IDEAS.md` and the current task continues. Offer to jot something you noticed; don't add your own without asking.
- **A bug is never an idea.** `workflow/IDEAS.md` holds features that may or may not happen; a defect or trap in what already exists is reported to the user the turn it emerges and, unless fixed on the spot, becomes a board line through `/todo` on the user's order.
- **A tiny defect found while a line runs may be folded into it, on the user's say.** It is reported the turn it emerges; the user widens the line or does not, and the commit says the line was widened. Claude says when the fold has grown past a fix and needs a line of its own.
- **Cut big steps into shippable substeps**, each self-contained enough for a cleared session to execute; name the shared mechanism that links them. Propose the cut before executing it.
- **A generator change is pitched running.** Its dossier says whether the process is fixed or rolled, and how wide it may vary; its pitch shows the generator ported into the mockup and run on the project's seeds, the port checked against the rules tests first. Why: a diagram reads straight, and a straight reading of a rolled process has cost a pitch round twice.

## Design principles

- **No handholding.** Players are expected to learn, misplay, play suboptimally, and lose occasionally. No guard rails, no warnings against a demanding choice, no "are you sure". A concern about a demanding option is not written down either — a ⚠️ in a doc is the same paranoia in prose. Genuine bugs (a mathematically unplayable state, a typo) are still bugs.
- **Committed rules live in `src/rules/`.** A disabled button is the UI's reflection of a rule, never its enforcement.
- **Price new content against what already does that job.** Strictly worse on every axis is dead on arrival, however good the flavour; "the balance pass will tune it" is not a licence to skip the comparison. Later-tier content may dominate earlier-tier content — that is progression.
- **Compare rates on a common basis.** A per-play yield and a per-turn yield are only comparable after amortising the one-shot by how often it is drawn.
- **No generative AI in assets.** Art, sound and music come from packs whose licence is recorded the moment they enter the repository, or are primitives drawn by code; a generative model produces none of it, placeholders included. Why: a part of the audience rejects genAI assets outright, and a placeholder has a way of shipping.
- **A code-drawn placeholder is a flat polygon** — one fill, one outline, no curves, no gradients, no detail work, and the fewest vertices that tell it apart from the other marks: a mark says which thing it is, never what the thing looks like. A tent with a door notch or a snare with its V is a picture; a primitive that starts wanting one is an asset and waits for its pack. Why: an elaborate mark authored by the model is genAI art in polygon clothing.

## Writing rules

- **Glossary verbs only.** Every gameplay term on a card, in the UI, in the codex and in code comes from `GLOSSARY.md`. No synonym, no paraphrase, no "elegant variation". A missing term is a design question for the user.
- **A glossary term is the simplest, most natural English for the thing it names.** A player says these words out loud about a mechanic; the right one is what a person would call it without being taught, not the cleverest, the most evocative, or the most precise-sounding. **Assume English is not the player's first language**: a common word beats a vivid one, a plain word beats an idiom, and a word a learner meets early beats one they meet late. A term that has to be translated before it can be played is the wrong term, however well it reads.
- **Glossary candidates are drawn free of every constraint, and checked for collisions only afterwards.** Suggest from plain English alone — never filtered against the glossary, the design or the code, and never trimmed because a word is already spoken for. Once the term is chosen, look up what it collides with and hand the user that list as a warning, not as an objection. The new term wins: an older glossary row, a design sentence or a code identifier holding that word yields and is renamed in the same unit of work. Why: filtering candidates by what is unclaimed yields the best _available_ word, which is not the right one, and the name is permanent while the rename is cheap.
- **A card name is content, not vocabulary.** Prose cites a card by its verbatim name; code reaches it only through its text key, never a re-typed literal.
- **Card text is the shortest phrasing that is unambiguous.** Then shorten it again.
- **UI tooltips are glanceable one-liners** — what it is, where it comes from. They name no specific card or scenario and explain no mechanic; the codex is for learning, tooltips are for players who already know.
- **Explanatory text stays generic.** Onboarding copy describes systems, never the specific content the player is about to meet.

## Code

- **Locality first.** Co-locate what changes together; keep files small enough to read in one pass. Extract a module only behind an interface much narrower than what it hides. Layering ceremony (clean-arch, hexagonal indirection) is an anti-pattern here: shallow modules are token cost and misuse surface.
- **KISS is trap avoidance.** Difficulty is not human hours — a big rewrite is cheap. What is expensive is the trap: non-local interdependencies, behaviour not evident from the code where it lives, a snare set for a session without today's context. Prefer the design a fresh session understands from the files in front of it.
- **Single source of truth for facts; repetition for shape.** Schemas, constants, protocol rules live in one place. Code that merely _looks_ similar but is causally unrelated stays repeated; never factor on resemblance.
- **One choke point per invariant.** A rule is enforced by the one function every path goes through, not by convention at each call site. Fix the mechanism, not the case that surfaced it — but generalise only the axis with a real second instance; no seams for zero instances. That governs code machinery. The shape of a content declaration may be sized against content the design foresees, but only the user sizes it: the futures are put to them in the pitch, and the implementer never widens a declaration for content that does not exist yet. A special case that needs a guard comment to survive is the wrong design: uniformity beats a locally simpler shortcut, so remove the shortcut, not the comment.
- **A closed set is switched, never tested.** Where a value is one member of a closed union, branch with a `switch` over every member and no `default`, so the typecheck refuses the member added later; an `if` or a ternary with an otherwise-branch takes the new member silently. A site that answers one member and nothing for every other may test for that one: the members it ignores are ignored by design, and the one added later is too. Why: the otherwise reads as a fallback and is a hole.
- **Data coherence is never deferred.** An id must resolve to real content, a seed must be attainable; these checks exist from day one regardless of how provisional the numbers are. One rejection vocabulary across all validators.
- **Absorb, don't duplicate.** When a static concept becomes editable, the static entries become seed data of the editable type; no parallel "custom" type survives.
- **A named constant only for readers far apart.** Two adjacent lines cannot drift; inline the literal.
- **A player-facing fractional quantity is fixed-point.** A rules value the player reads that needs fractions over a known, narrow range counts in integers of its smallest unit, with one named constant giving the scale and one formatter reading it back as a decimal at the screen. Floating point is for a range genuinely wide enough to need it, and for an internal chance drawn against the seeded generator — odds, a share — which the player never reads. Why: repeated sums and `<=` on floats drift, and a rule decided by a comparison has to be exact.
- **Tools are consumers of `src/rules/`, never peers.** A simulator, an editor, a profiler reads the rules through their public API; no tool-serving hook or field lands in game data or rules.
- **Game logic is deterministic.** No ambient randomness in `src/rules/` — every random draw goes through the seeded generator threaded in the state, so a chronicle replays from its seed. Why the reminder: `Math.random()` and `Phaser.Math.RND` are one import away.
- **Player-facing text is keyed data, never a literal in code.** A sentence is one entry, never assembled from fragments. English is the only language; this keeps another one a file away.
- **Prefer the API's native convention.** Feed a library the coordinate space and data shape it documents; never compensate with metadata — an origin zeroed, a sign flipped, an offset added. Why: the compensation draws right while everything else that reads the object still trusts the metadata.
- **Comments are for traps only.** A comment states a non-local constraint invisible at the point of reading. No paraphrase of the code, no history ("used to…", "step 3 of…"), no design rationale (that is the design pages), no explanation of code elsewhere (a bare pointer at most — and if the explanation can't be kept local, the code may be misplaced; say so). No `TODO`: discovered work is reported for the user to `/todo`, or gets done now. Re-shave a comment when editing near it. A hook flags a comment block longer than three lines, its delimiters not counted, when an edit under `src/` or `e2e/` touches it; it is advisory: the comment is cut to its trap, or the report says why it stays.

## Architecture

How this code base is shaped, and what a change never deviates from:

- **The game is one pure function, `apply(catalogue, state, command) → stages`, with two products:** the state the command leaves and the flow of changes that led there. The state is what is drawn and what a command's legality is read on; the flow is what listens to it plays — the chronicle screen's animations, a simulator's log — and what a closure may read to branch on what its own helper did. Why two products: what happened — which tile attacked which — is not in the state that follows it.
- **The flow is a tree of stages, every one carrying the chronicle it leaves, and a change is one row of the chronicle moved.** The rows are a unit, a tile, the stock, the population, a pile, the turn, the timeline, the deals, the ending; a card carries no identity, so the piles are the rows and one movement between them is one change however many cards it carries. A change is named for the fact that moved, its direction and amount read off the chronicles before and after, and carries only what those cannot say: the tile, the two ends of a crossing, and the places in the pile the cards came out of, since which of two copies moved is what two chronicles cannot say. One change moves no row: `runtime-error`, a content defect met in play — a helper called where the content should never have called it, a due turn that draws no event — answered in place of the change it could not make, and play goes on wherever it can. Why rows: the vocabulary is the chronicle's own and no listener's, so it holds whatever comes to listen.
- **A group is a name for why, over stages.** It carries what the link needs, the attacker and the target. A command resolves as at least one stage, and a refusal is a group holding nothing, the name being the fact. The change names and the group names are the closed sets `src/rules/stages.ts` holds.
- **The catalogue is an argument, never a field of the state and never an import of `src/rules/`.** It is the content — the unit kinds, the enemy scripts, what a camp enters and what its capture gives, the terrains and the layers a tile is made of, the biomes and the regions, the cards and the decks, the events and the schedules, and what the later content brings. Every rule that reads content receives it before the state; a closure content carries that takes the chronicle takes the catalogue before it. Why an argument: a test hands in content of its own, and a save names the content it replays on.
- **A catalogue is validated once, when it is built, and a chronicle names its catalogue's version.** `apply` refuses a chronicle with any other.
- **Data owns its behaviour.** A card carries its aim and its effect as closures the rules call and never read into: a play resolves through the card's own aim and pays through its own cost, and no rule switches on a card's id or reads a card's fields to decide what it does. A new mechanic is a helper in `src/rules/` that content composes into a closure, never a branch in `apply`. A closure may branch on the chronicle it is handed — a card that acts only when the stock falls short, only in sight of the city — and that branch is the card's design, which lives nowhere else: it is never lifted into a rules helper so the helper can decide it. The ids a closure names are resolved by those helpers when the card is played, not when the catalogue is built: a closure is opaque, and a card written as a recipe signed at construction was rejected as ceremony for the cards that name no id. Why: a branch on an id is a second home for the card's behaviour, and the two drift.
- **A rules helper is sane for every argument it accepts.** Read a new helper's call aloud with an argument no content passes today — another resource, a wider span, a different kind. Where the answer is absurd or undesigned, the helper has taken a decision the design never made: the condition belongs to the content that wanted it, in its own closure. Why: a helper general in its signature and specific in its intent invents a rule nobody chose, and the signature is what the next session believes.
- **An aim predicate and an effect closure are pure over the chronicle**, and an effect changes it only through the rules' named helpers, so an invariant stays behind one door. Closures live on content, never in the state: a save is the state serialised, and no closure survives that.
- **A rules helper that changes the chronicle answers the changes it raised**, none where it moved nothing, and so does every closure content composes them into; the caller groups what it is handed under the name of why, and never drops a change. Two helpers for one change, one answering the chronicle and one the changes, is the shape this forbids. Why: a listener can only play what reached it, and a change dropped on its way up is a snare for the next thing that listens.

## Testing

- **A test asserts a rule a player could state**, exercised through a move or a boundary (play a card, end a turn, resolve income, load a save), on a **synthetic fixture** the tests author — in the test file, or in a fixture module beside it — and pushed through the real code path; where randomness is involved, from a seed. Never a function's signature, never a real piece of content's numbers, never a Phaser detail — a pixel, a frame count, a coordinate on screen.
- **A mechanism gets one test on synthetic content; content gets coherence checks, never a gameplay test.** A rule is proven through the fixture catalogue on numbers of the fixture's own; a real card, unit, event or schedule gets its ids resolved, its text found and its closures answered on a launched chronicle, and nothing more. A test that reads its oracle from the content's own table, or seeds exactly a real card's price, is a content test wearing a mechanism title. Why: a content test breaks at every tuning, and a rule proven on real numbers is proven for those numbers alone. **Content that decides is the exception.** An enemy script carries no number, only choices the rules do not make — which target, which landing, whether it strikes from the city's tile — and each choice gets one test beside the script, the real closure played on the fixture's ground; content that only lays numbers over the rules' helpers decides nothing and gets the coherence checks alone. Why: a coherence check notices no decision changing, and a decision changed is the game playing differently.
- **A catalogue is coherence-tested, never trusted.** Every catalogue the game ships with has a test that builds it and reads every id it holds through the lookups the screen uses — name, rules text, mark, colour — and asks every closure it carries its cheapest answer on a launched chronicle. Why: an open string id is checked by nothing the compiler does, and a name missing throws at the first draw, in play.
- **A shared fixture lives in `src/rules/fixtures.ts`**, beside the tests: a helper moves there when two or more test files use it, or when a fixture already there needs it; one a single test file uses and nothing shared depends on stays in that file. What a test names is exported, what only the module uses is not, and nothing outside a test imports it.
- **Rules tests are Vitest, in Node**, co-located with the module they cover as `<module>.test.ts`. So is a pure function on the UI side — a settings rule, a layout computation — that a Playwright spec would only assert slowly; the on-screen half of the same feature stays with Playwright.
- **UI is verified in two passes.** The standing suite is Playwright against the dev server in Chromium: the app boots, reaches the screen it should, and logs nothing. What it _looks_ like — layout, overlap, clipping, contrast, colour-vision — is an on-demand mechanical pass through the `ui-check` agent, driven by the `visual-check` skill. Whether it _feels_ right is the user's call and is never automated.
- **The Playwright suite is CI's.** It runs on every push, any branch, split by spec across four runners, one worker each, no retries; locally the cap is four workers, so a timeout means a bug either way. A session runs one spec at a time, the one its line adds, touches or names (`npx playwright test e2e/<spec>.spec.ts`), and a hook refuses a local run that names no spec; a line that rewrites a path several specs walk runs each of those and names them in its report; the whole suite runs locally only when the user runs it in their own terminal.
- **A spec rests before it reads a position.** After a page loads, a scene starts or a camera moves, a spec waits out a drawn frame (`rested`) before it clicks, drags or measures anything on screen. Why: a camera only takes its zoom and scroll at render, so an object can stand before its place on the page does, and the press lands elsewhere — on a slow CI runner, not on a fast local machine.
- **No mocks.** A pure `src/rules/` needs none; a mock that mirrors the code tests the code against itself. Use real dependencies or don't test that path.
- **A fixture goes through the transform production uses.** What the rules build — a unit entered, a chronicle begun, a map dealt — a test builds by calling that exported function, never by an inline re-copy of it. A helper that mirrors a rule, or wipes, resets or renumbers what already stands to make room for its fixture, is a defect, whatever test it serves; a stand-in is content enough for this rule to hold.
- **Tests import their runner API explicitly** — Vitest's `globals` stays off.
- **A test is never weakened to make it pass.** Deleting a test says that behaviour is no longer promised, which is a design change made with the user. A failing check is reported failing, with its output; never "should pass".

## Git

- **Commit directly to `main`.** Solo trunk-based work; no feature branch and fast-forward ceremony. Branches are for experiments that may be discarded.
- **Claude owns commit granularity.** A shipped line is committed once its trinity has landed and the review passed; a contained unit never waits for sign-off. One unit per commit — never two interleaved.
- **A content change and its measurement are one commit**; the mechanism it needed lands in its own inert commit before it.
- **During a tuning pass, edits stay uncommitted** until the user says the numbers are right. Say once that the tree carries the change; never roll back or ask keep-or-revert mid-pass.
- **Git is the backup.** No scratchpad copies of tracked files; `git checkout <file>` reverts, and `git status --porcelain <file>` confirms it printed nothing.
- **Never push unless asked.** The repository is public; a push is a publication.
- Commit messages end with `Co-Authored-By: Claude <model> <noreply@anthropic.com>`.

## Docs

- **Three lifespans, three places**: code (permanent, how); the standing pages — `docs/`, what is and what was decided, and this page, how the project is built; `workflow/` (ephemeral: the board and its task files, the ideas, the roadmap). The root holds the repository's own files and nothing else: the README, `CLAUDE.md`, this page, the changelog. Anything without a lifespan is noise — delete it.
- **`docs/` states what is.** No journals, no ADRs, no reasoning journeys. A standing decision gets one line of _why_, and only when the rejected alternative is attractive.
- **Pivots are edits.** An overturned decision changes `docs/` in the same unit of work; the old version lives in git only.
- **Each doc owns one altitude.** The board carries a line and a pointer; the task file carries the contract; the `docs/` page carries the settled fact. Nothing is stated twice.
- **A change of several lines on its own branch gets a branch board.** `workflow/BRANCH.md` holds the clean design first and one line per thing that design breaks after, the line that writes the design into `docs/` first among them; `BOARD.md` on the branch holds one pointer line; the branch merges only once `BRANCH.md` holds no line, and one Prep commit deletes the file and the pointer before the merge. Why: one board with two workstreams makes priority order lie, and the design section reviewed line by line keeps the design pages on `main` free of half-true designs.
- **A task file is written once, on the settled state.** Findings stay in the conversation until they settle — intermediate readings are usually wrong, and a superseded number left in a file reads as fact next session.
- **Durable never cites transient.** A `docs/` page or a changelog entry never references a board line, a task file, or an idea.
- **`CHANGELOG.md` is for players**, written at a version bump, in their words, and never reworded after: a past entry keeps its words even where the glossary has since forbidden one, a rename sweep skips it, and a stale sentence in it is history, not a finding.
- **`CLAUDE.md` stays short.** It is loaded every session; detail lives in `docs/` pages read on demand.
- **Skills state their rules plainly** — no justifying, no referencing another skill. Calibration numbers are data and stay.
- **A paragraph is one line.** No markdown file is hard-wrapped; Prettier keeps it so (`npm run fmt`) and `npm run lint` refuses a wrapped one. Why: a phrase broken across a line break is invisible to a search, and an edit mid-paragraph no longer reflows what follows.

## Tooling

- **Search for an existing tool before writing one.** An unmaintained package is not an option; prefer tools whose output Claude can read in a terminal; pin versions in `npx`-style invocations.
- **Standing analyses are CLIs with flags, never scratchpad scripts.** A question the CLI cannot answer is a flag to add.
- **Slow commands run in the background**; a spawned child agent is awaited by ending the turn.
- **Profile before optimising**, keep measured and inferred visibly separate, and never slip a core change in as a performance fix for a tool.

## Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript, `strict` |
| Game framework | Phaser 4 |
| Dev server and bundler | Vite 8 |
| Rules tests | Vitest 4 |
| UI verification | Playwright, Chromium only |
| CI | GitHub Actions on every push, any branch: typecheck, lint, rules tests, e2e. On `Latest`, once that passes: build and deploy to Pages |
| Lint and format | Biome for code, one `biome.json`; Prettier for markdown, one `.prettierrc` |
| Package manager | npm on Node 24; `package-lock.json` is committed |
| Hosting | GitHub Pages, the `dist/` built from `Latest`, served under `/AgeOfDeckbuilder/`; itch.io HTML5 page, the same bundle zipped from a relative-base build — a script the itch publish adds. No server, ever. |
| Desktop wrapper | Tauri 2 — not installed; it needs Rust, and it is installed when the desktop target is taken |

- **`src/rules/` never imports Phaser, never touches the DOM and never imports `src/content/`; `src/ui/` never mutates state.** Phaser renders a state and emits commands, nothing else. Why: that one rule is what makes a chronicle replay from its seed, a save the state serialised, and a headless simulator `apply` in a loop keeping the last stage's state. The shape of `apply` and what it hands back are the _Architecture_ lines.
- **All UI is Phaser** — inside a chronicle and outside it alike: launch, collection, deck editing, codex. `index.html` carries no UI: a style reset, the script that boots Phaser, and the canvas Phaser creates. Why: a card appears on every one of those screens and must have exactly one renderer; a DOM menu layer would be a second one.
- **The map's geometry lives in `src/rules/`**, in axial coordinates. A tile is drawn as an ordinary Phaser object from those coordinates; Phaser's tilemap system is not used, because the map is a rules structure the renderer reads, not a renderer structure the rules ask about.
- **Every dependency is pinned exactly** in `package.json` — no `^`, no `~`. Why: a build that changed because an upstream patch landed is a failure with no local cause.
- **Assets carry a licence record.** A pack entering `public/assets/` gets its entry in `public/assets/LICENSES.md` in the same unit of work; no entry, no ship.

The layout, which embodies the first rule above:

```
README.md           what the game is, for a visitor; CLAUDE.md the session's entry, DOGMAS.md its rules, CHANGELOG.md the players' notes
docs/               the standing design: the design pages, the glossary, one page per age
workflow/           the ephemeral task context: the board and its task files, the ideas, the roadmap
index.html          the page Phaser puts its canvas in; no UI of its own
src/main.ts         boots the Phaser game
src/rules/          pure TypeScript: state, commands, the seeded generator
src/content/        the catalogues: the ages' content, and the stand-in the e2e suite plays on; what the boot hands the rules and the screen
src/ui/             Phaser scenes, and the design space they lay out in
e2e/                Playwright specs
.github/workflows/  the CI check
public/assets/      art, sound, music, each pack with its licence entry
dist/               the build; what is zipped and uploaded
```
