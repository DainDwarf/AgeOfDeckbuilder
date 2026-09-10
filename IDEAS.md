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
  *data owns its behaviour* comes back with the card model; *mechanism vs content testing* comes
  back with the *fixture content* entry below, the day its synthetic catalogue lets a test obey it;
  *catalogue coherence tests* come back with the first content the compiler does not check — a
  stand-in in a closed TypeScript record is already checked. *Fixtures through the exported
  transform* returned on 2026-09-07, after a fixture that mirrored the rules bit.
- **Fixture content** (v0.0.4, with the content catalogue; the settled shape is that rung of
  `docs/ROADMAP.md`): the rules today are deterministic and side-effect free but not parametric
  in their content — cards, improvements, buildings, features and unit stats are module constants
  the rules read. Why one catalogue and not the pure tables in the state with the closures beside
  them: content split across two homes is the interdependency the code dogmas forbid. What the
  rung executes: a test hands in a synthetic catalogue — a building that stands on hills, a unit
  kind with its own numbers — so no fixture writes a tile or a unit the real content could not
  produce, and no test reads its oracle from the code's own table; first consumers are the
  four-layer yield test, the terraform-keeps-improvements test and the unit builders' synthetic
  stats. The `DOGMAS.md` Stack line gains its third word the same day, and the *mechanism vs
  content* dogma returns to its Testing section as soon as the work permits: a new mechanism gets
  one test on synthetic content; new content gets coherence checks only, never a gameplay test; a
  test that reads its oracle from the code's own table, or seeds exactly a real card's price, is
  a content test wearing a mechanism title. The chronicle tests hold about fifteen of the first
  kind and six of the second today, all on stand-ins; they convert with the catalogue.
- **The render factor can change after boot**: regrow the bitmap, re-zoom cameras, re-rasterize
  text while the game runs. Four consumers: itch.io's fullscreen button, a settings render-scale
  slider, monitor-hopping, resizing the window after boot. Decide after the art style locks —
  pixel art would replace this whole strategy with integer scaling.

## Game

- **Bridges are a technology**: the placeholder road line lets roads on both banks of a river edge
  lift the crossing's drain; in the end design that bridge is gated behind a technology the player
  unlocks, and roads alone do not span a river.
- **Cache or precompute movement reachability**: today it is recomputed per command; measure before
  building anything.
- **Seed selection at launch**: when the "launch a chronicle" menu exists, it offers starting on a
  given seed — the player-facing door to replay-from-seed; `?seed=` stays the debug/e2e one.
- **Colour ledger** (art-style pass scope): every UI colour resolves through one theme lookup,
  so an alternate theme — colour-blind-friendly included — becomes content, not surgery.
- **Colour never carries gameplay meaning alone** (art-style pass scope): resource chips and
  anything gameplay-critical get shape/glyph redundancy, fixing colour-blindness in every theme
  at once — including the default.
- **Animation speed settings**: the player sets how fast the staged motions play.
- **Income flies in from the tiles** (v0.0.6, the look): at the income stage each yielding tile
  sends its resource to the bar.
- **Copy a replay**: one action puts version, seed, deck, the commands played and the last error
  on the clipboard, so any game a player pastes back can be replayed to the turn.
- **A scout card** (v0.0.4, with the first real cards): v0.0.3 ships sight and fog with no card that
  answers them — every stand-in unit is a worker or a warrior. A scout sees further from where it
  stops, and is what makes finding a camp a play rather than a wait.
- **Biome growth weight** (v0.0.4, when the starting data sheds its placeholders and is balanced):
  one number per biome in its table that weights the frontier draw of the spread, so a slow biome
  comes out as a small compact patch and a fast one large and ragged; today every biome grows at
  the same rate and only where its origin fell decides its size.
- **Combat log**: a readable record of what the end of turn did — who attacked whom, what was
  killed, who moved where — for a player who missed the motion or wants it in words.
- **The card-versus-management razor** (reconsider once the whole loop runs on real content):
  which verbs are cards and which are city management is undecided. Two candidate razors: *the
  hand is the only scarcity* (claiming and growth become cards, every resource has a card sink,
  chores crowd the hand) versus *cards change what is on the map, management changes what is the
  city's* (layers and units are cards; the border, staffing and growth are management). Settled
  either way: assignment is management; buildings, improvements and unit spawn are cards; unit
  movement and attacks are management. Each switch is the same rules function behind a different
  input, plus the design page, the glossary and a rebalance.
- **The famine deals a card, not a number**: the stand-in famine empties the food stock; instead
  an event's script could lay a card in the chronicle's deck — the mechanism the design already
  gives a captured camp's reward. Which card, whether it is a burden the player has to play out or
  draw around, and whether events deal cards generally, is undesigned.
- **Worker actions**: a worker spends its per-turn pool to gain the yield of the tile it stands
  on. Only a tile the city does not own? Buildings included or not?
- **Consuming the worker on building**: a building card spends the worker that stands on the tile,
  so workers are a scarcity of their own and the city's population pays for its buildings twice.
- **Bundle the UI font** (art-style pass scope): `system-ui` resolves to a different typeface on
  every machine, so CI, the player and the developer lay out different games from the same code —
  every width in the UI is a measured text width. A font shipped with the build ends that.
- **One diamond for every resource glyph** (art-style pass scope, when the glyphs become icons):
  the map draws its three turned squares through one helper; the card face's and the infopanel's
  cost glyphs and the resource bar's chip each hand-roll their own. The day the glyphs become
  icons, one renderer of a resource's glyph takes all six, and the WebGL-stroke trap goes with
  the turned square.
- **Type-size floor, verified small** (art-style pass scope): minimum type sizes generous enough
  that the smallest window we care about stays readable; ui-check verifies at that size. Uniform
  window scaling plus card zoom covers the rest — no UI-scale slider unless playtesting demands it.
