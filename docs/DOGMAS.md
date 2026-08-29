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
- **Cut big steps into shippable substeps**, each self-contained enough for a cleared session to
  execute; name the shared mechanism that links them. Propose the cut before executing it.

## Design principles

- **No handholding.** Players are expected to learn, misplay, play suboptimally, and lose
  occasionally. No guard rails, no warnings against a demanding choice, no "are you sure". A
  concern about a demanding option is not written down either — a ⚠️ in a doc is the same
  paranoia in prose. Genuine bugs (a mathematically unplayable state, a typo) are still bugs.
- **Committed rules live in the core.** A disabled button is the UI's reflection of a rule, never
  its enforcement.
- **Price new content against what already does that job.** Strictly worse on every axis is dead
  on arrival, however good the flavour; "the balance pass will tune it" is not a licence to skip
  the comparison. Later-tier content may dominate earlier-tier content — that is progression.
- **Compare rates on a common basis.** A per-play yield and a per-turn yield are only comparable
  after amortising the one-shot by how often it is drawn.

## Writing rules

- **Glossary verbs only.** Every gameplay term on a card, in the UI, in the codex and in code
  comes from `GLOSSARY.md`. No synonym, no paraphrase, no "elegant variation". A missing term is
  a design question for the user.
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
  but generalise only the axis with a real second instance; no seams for zero instances. A special
  case that needs a guard comment to survive is the wrong design: uniformity beats a locally
  simpler shortcut, so remove the shortcut, not the comment.
- **Data owns its behaviour.** A card's effect runs only through the resolver; its price only
  through the cost seam. No parallel mini-interpreter reading a def's fields from a move, a tick,
  or a component. Adding a mechanic means adding a hook on the data, not a branch in the engine.
- **Data coherence is never deferred.** An id must resolve to real content, a seed must be
  attainable; these checks exist from day one regardless of how provisional the numbers are.
  One rejection vocabulary across all validators.
- **Absorb, don't duplicate.** When a static concept becomes editable, the static entries become
  seed data of the editable type; no parallel "custom" type survives.
- **A named constant only for readers far apart.** Two adjacent lines cannot drift; inline the
  literal.
- **Tools are consumers of the core, never peers.** A simulator, an editor, a profiler reads the
  core through its public API; no tool-serving hook or field lands in game data or rules.
- **Game logic is deterministic.** No ambient randomness; every random draw goes through a
  seeded generator threaded in the state, so a run replays from its seed.
- **Comments are for traps only.** A comment states a non-local constraint invisible at the point
  of reading. No paraphrase of the code, no history ("used to…", "step 3 of…"), no design
  rationale (that is `DESIGN.md`), no explanation of code elsewhere (a bare pointer at most — and
  if the explanation can't be kept local, the code may be misplaced; say so). No `TODO`: discovered
  work goes through `/intake` or gets done now. Re-shave a comment when editing near it.

## Testing

- **A test asserts a rule a player could state**, exercised through a move or a boundary (play a
  card, end a turn, resolve an upkeep, load a save), on a **synthetic fixture** defined in the test
  and pushed through the real code path. Never a function's signature, never a real piece of
  content's numbers.
- **New mechanism → one such test. New content → coherence only.** Content that composes tested
  mechanisms needs no gameplay test; say so rather than padding a plan. Balance is a measurement
  question, not a unit-test one.
- **Coherence tests run over the whole catalogue**: ids resolve, references exist, seeds are
  attainable, every entry carries what the display needs.
- **No mocks.** A pure core needs none; a mock that mirrors the code tests the code against itself.
  Use real dependencies or don't test that path.
- **Fixtures derived from seed data go through the exported transform production uses**, never an
  inline re-copy.
- **Weakening or deleting a test is a rejection** unless `DESIGN.md` changed the behaviour in the
  same unit of work.
- **Tests import their runner API explicitly** — no globals.

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
- **Never push unless asked.** The repository is public; a push is a publication.
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

*(not chosen — a `BOARD.md` line. Language, framework, test runner, build, hosting, and the
per-stack idioms go here once decided.)*
