# Ideas

The unordered pool of features that may or may not happen. Nothing here is promised, designed,
or scheduled, and nothing here is a bug — a defect goes to the user and the board the turn it
emerges. An entry is one line, or a few, and gets no elaboration until `/intake` promotes it to
a [`BOARD.md`](BOARD.md) line. Say
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
- **The render factor can change after boot**: regrow the bitmap, re-zoom cameras, re-rasterize
  text while the game runs. Four consumers: itch.io's fullscreen button, a settings render-scale
  slider, monitor-hopping, resizing the window after boot. Decide after the art style locks —
  pixel art would replace this whole strategy with integer scaling.

## Game

- **Cache or precompute movement reachability**: today it is recomputed per order; measure before
  building anything.
- **Seed selection at launch**: when the "launch a chronicle" menu exists, it offers starting on a
  given seed — the player-facing door to replay-from-seed; `?seed=` stays the debug/e2e one.
- **Remappable mouse gestures**: the player rebinds drag, wheel and click, the way keys rebind
  in the menu.
- **Per-tile yield overlay**: "+x +y" glyphs on each tile showing what it yields, toggleable
  because the information saturates; clicking a resource on the top bar filters the overlay to
  that resource alone. Becomes truly informative once assignment exists (v0.0.3).
- **Colour ledger** (art-style pass scope): every UI colour resolves through one theme lookup,
  so an alternate theme — colour-blind-friendly included — becomes content, not surgery.
- **Colour never carries gameplay meaning alone** (art-style pass scope): resource chips and
  anything gameplay-critical get shape/glyph redundancy, fixing colour-blindness in every theme
  at once — including the default.
- **Animation speed settings**: the player sets how fast the staged motions play.
- **Copy a replay**: one action puts version, seed, deck, the commands played and the last error
  on the clipboard, so any game a player pastes back can be replayed to the turn.
- **Type-size floor, verified small** (art-style pass scope): minimum type sizes generous enough
  that the smallest window we care about stays readable; ui-check verifies at that size. Uniform
  window scaling plus card zoom covers the rest — no UI-scale slider unless playtesting demands it.
