# Ideas

The unordered pool. Nothing here is promised, designed, or scheduled; an entry is one line, or a
few, and gets no elaboration until `/intake` promotes it to a [`BOARD.md`](BOARD.md) line. Say
*"jot: …"* mid-task and the thought lands here without derailing the task. Entries untouched for
20 shipped lines go on trial at `/upkeep`.

## Harness

- **UI-check speed-ups** (once UI verification exists): a dev-only way to load a named fixture
  state so a check is one step instead of playing up to it; checking one widget in isolation
  without the game around it; screenshot regression for *unchanged* UI so the agent is only asked
  about the new thing.
- **Content-stage board**: when content exists, track each piece through
  Design (number-less) → Implement (provisional numbers) → Balance (measured + feel) → Polish
  (text, art, lore), one stage per session batched across pieces. Worked well before.
- **Headless balance simulator**: only run when asked; reports numbers, not diagnoses.
- **Deferred dogmas return with their objects** (removed in `b5ea45a`, kept out on purpose):
  *data owns its behaviour* comes back with the card model; *mechanism vs content testing*,
  *catalogue coherence tests* and *fixtures through the exported transform* come back with the
  first content catalogue.
- **Fleet-lite**: two or three sessions working parallel board lines on `main`, each claiming its
  line. Skipped for now — the bottleneck is design attention, not implementation throughput.

## Game

*(empty — the game is not designed yet)*
