# Ideas

The unordered pool. Nothing here is promised, designed, or scheduled; an entry is one line, or a
few, and gets no elaboration until `/intake` promotes it to a [`BOARD.md`](BOARD.md) line. Say
*"jot: …"* mid-task and the thought lands here without derailing the task. Entries untouched for
20 shipped lines go on trial at `/upkeep`.

## Harness

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
- **e2e `reuseExistingServer`**: `playwright.config.ts` reuses a dev server already on port 5173,
  so one left running from earlier work serves stale modules and fails (or falsely passes) the
  suite; decide whether the flag stays.
- **The render factor can change after boot**: regrow the bitmap, re-zoom cameras, re-rasterize
  text while the game runs. Four consumers: itch.io's fullscreen button, a settings render-scale
  slider, monitor-hopping, resizing the window after boot. Decide after the art style locks —
  pixel art would replace this whole strategy with integer scaling.

## Game

- **Per-tile yield overlay**: "+x +y" glyphs on each tile showing what it yields, toggleable
  because the information saturates; clicking a resource on the top bar filters the overlay to
  that resource alone. Becomes truly informative once assignment exists (v0.0.3).
