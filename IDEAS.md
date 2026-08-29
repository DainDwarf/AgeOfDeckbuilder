# Ideas

The unordered pool. Nothing here is promised, designed, or scheduled; an entry is one line, or a
few, and gets no elaboration until `/intake` promotes it to a [`BOARD.md`](BOARD.md) line. Say
*"jot: …"* mid-task and the thought lands here without derailing the task. Entries untouched for
20 shipped lines go on trial at `/upkeep`.

## Harness

- **UI-check speed-ups** (decide once the stack is known): a dev-only `?fixture=<name>` state
  loader so a check is one navigation instead of seeding storage and clicking; an isolated
  component route for checking one widget without the game around it; deterministic screenshot
  regression for *unchanged* UI so the agent is only asked about the new thing.
- **Content-stage board**: when content exists, track each piece through
  Design (number-less) → Implement (provisional numbers) → Balance (measured + feel) → Polish
  (text, art, lore), one stage per session batched across pieces. Worked well before.
- **Headless balance simulator**: a consumer of the rules core, never a peer; only run when
  asked; reports numbers, not diagnoses.
- **Fleet-lite**: two or three sessions working parallel board lines on `main`, each claiming its
  line. Skipped for now — the bottleneck is design attention, not implementation throughput.

## Game

*(empty — the game is not designed yet)*
