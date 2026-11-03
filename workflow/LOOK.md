# The look

The pool v0.0.6's rungs draw from, by rung: the ideas each one takes, the fits and colour readings the user accepted until this version, and the findings that bear on it. Read at a rung's cut, never cited by anything durable; a rung's cut strikes what it takes, and the file is deleted when the version closes. The rungs themselves are on [`BOARD.md`](BOARD.md).

## The retained screen (cut 2026-10-30)

- The pure UI modules stay beside the Phaser ones with their Vitest tests, no folder, no convention: settled at the cut.
- The CI browse flake (the `ci-browse-frame-starvation` memory): the browse and deck-editing specs ran red on CI while panels overflowed, ~8 fps under 5 s polls and Phaser's 120-frame delta cap; green since the padding left. Expected back when a panel overflows again, and bigger assets can bring it back; read off each line's CI run.

## The style lock's lines (cut 2026-10-31)

- The style lock's leftovers, for the rungs: Baumgart's files cannot sit in the public repository, so an asset-store line goes ahead of the glyph rung; the unit's picture is the pieces rung's sourcing, his painted objects first, then a commission, the glyph token standing meanwhile, and the user may ask him for an ancient peoples icon pack; the far view's palette, tile edges and threshold, and the river's weight at the far view, are the map rung's; the units survey of 2026-10-31 found no Stone Age figures in a non-pixel human hand on sale, only Isle of Lore 2's cartoon figures (10 dollars, commercial, a second hand) and the virtual-tabletop token makers, whose licences exclude software.
- **Bundle the UI font**: `system-ui` resolves to a different typeface on every machine, so CI, the player and the developer lay out different games from the same code — every width in the UI is a measured text width. A font shipped with the build ends that. Until then a fit is measured in both Segoe UI and DejaVu Sans (the `measurements` memory).
- The bar's values tick through a tween that sets their text every frame, and Phaser's text page says frequently changing numbers want BitmapText, a Text recreating its canvas texture on every change: a fact for the font decision, since a bundled font can be a bitmap font too.
- **Colour never carries gameplay meaning alone**: resource chips and anything gameplay-critical get shape or glyph redundancy, fixing colour-blindness in every theme at once — including the default. The glyph rung's rule, landing on `docs/LOOK.md` at its cut.
- Each rung pitches its own colours by meaning, against what stands on screen that day, inside the ledger: the rule that no new value is pitched until the palette lands went with the palette's move to the last of the surface rungs (2026-11-02). The cause diagnosed on 2026-09-20 still holds: pitches spending the one accent on every new affordance.
- The faction colours are the pieces rung's first reading, a token being a disc in its faction's colour on his terrain: the civilization's gold reads 1.09 on his desert and 1.38 on his plains, the neutral's blue 1.04 on his ocean (the free samples, 2026-11-02).
- The Stone Age's ground is grey, the user's pick over the recommended warm stone, until this pass. The civilization's colour is one `LOOK` entry until a second civilization lands (v0.0.7), then a table.

## The map

- The two-digit culture threshold on a tile (−14 on the ring opening) is accepted as it fits; re-read here.
- The selected city tile's white ring hard to pick out among the lit tiles around it: "All good" on 2026-10-01; material, not a defect.
- In city mode the assigned tile's diamond (`ASSIGNED_DROP` 16) covers the base of an embarked unit's hull (`HULL_DROP` 12) on a worked coast tile, all three marks still readable.

## The pieces on the map

- **A health bar on units**: a unit on the map shows its health, which only the infopanel reads today.
- **A building's reach drawn on the map**: a building that gives to the tiles beside it shows which tiles it gives to when its tile is selected, and when its card is aimed, the tiles it would give to; today the yield overlay and the tile panel are what show it.
- A code-drawn placeholder is a flat polygon (`DOGMAS.md`): every mark drawn so far is one, and each is drawn a second time here as an asset.
- **Units read as not interactive in city mode**: a new player could not tell why a unit would not move in city mode (playtest, 2026-11-03); the units show it, dimmed or transparent.
- **Population on the city badge**: since the resource bar dropped population, a new player could not tell what population is (playtest, 2026-11-03); the city's badge makes it clearer.

## The glyphs

- **One diamond for every resource glyph**: the map draws its three turned squares through one helper; the card face's and the infopanel's cost glyphs and the resource bar's chip each hand-roll their own. The day the glyphs become icons, one renderer of a resource's glyph takes all six, and the WebGL-stroke trap goes with the turned square.
- Shape redundancy is this rung's rule and its work: a resource glyph tells its resource by its shape as well as its colour, in every theme at once; the sentence lands on `docs/LOOK.md` at the cut. The six resource glyphs read 1.0–1.4 on his plains, hills and mountain today, food's green being the code's plain value exactly, held by the overlay's dim alone (the free samples, 2026-11-02).

## The cards and the windows

- **Buildings and improvements shown as cards**: an inspected building or improvement is shown as a card instead of an infopanel's row, with more text and room for an image.
- **Event answers as text**: the deal window shows each answer as text rather than as a card, a card the answer adds still raising its reference tooltip; an answer with several outcomes shows what it does as a list, so a part that does nothing ("0 city") is left out. An event's name, its answers' names and their texts become lore, not UI text, so the glossary lint stops reading them and the exception list stops growing with every event.
- **A minimize button on the scrim's windows**: the map holds still under the deal window, a browse and the capstone's, and a button setting the window aside lets the map be read and moved under it.
- Fits accepted until now:
  - The card face's long right-aligned name running under the left cost chip ("Goods trade" touches its "2", ~2 px gap).
  - The embarked unit's infopanel name "Raft (Warrior)" runs ~4 px and "Raft (Worker)" ~2.4 px into the head's right pad on Segoe UI, inside the card's edge; the head has no fit for a long title.
  - The infopanel building card's "No yield" drops under every site's name, the old cairn's included: the room test counts both texts' 2-unit padding, so "Old cairn" misses by 2.4 units though its letters fit with 2.3 to spare; kept over a fold measuring by ink.
  - Flood's deal window at the hand's width: the influence chip covers the last "E" of "CHALLENGE" by 1.6 units, as on all seven challenge cards that carry influence; the answer title "Settle the floodplain" passes its card's left padding; the longest Lose the fields reading is unmeasured.
  - The Mountain's infopanel name and its "Mv —" reading overlap by 1.5 units of ink.
  - A leader with a state line reaches its card's foot: its last row's box ends at 182.5 of 182, the text's padding counted.
  - A chronicle pile's browse running to the screen's bottom over the dimmed hand and end-turn button, and the discard pile's top-card small card covering the end-turn label and the pile's count.
  - The exhaust pile's tab reads its count in its own word ("Exhaust · 3") while the two card piles wear a gold pill.
- The deal window never scrolls: an event deals few enough answers for one row (a standing verdict, the `design-and-code-verdicts` memory).

## The chrome

- **A coherent cursor pass**: the cursor state was never designed as a whole — which things show the hand grew one site at a time. A pass settles what the cursor says across every surface, in the design and in the code together.
- **Credits and licences in the game**: a screen off the menu reading the packs' licence record and the build's dependency notices, so a CC BY credit shows where the player sees it.
- **State cursors and cursor images**: the cursor says what a press would do now — not-allowed on a card the rules refuse, grab and grabbing on a hand card's drag and the map's pan — and the game draws a cursor of its own, a browser cursor image (no lag, no animation, about 32 px) or one drawn in the canvas (animated, a frame behind the mouse).
- The cursor finding, the only hard evidence on cursors in this game: on 2026-09-21 the user learned, with real surprise, that the pointer swaps to a hand over cards, buttons, piles and window frames, after about thirty Nomadic plays. A cursor that is always there gets blindspotted whatever it is drawn as; a cursor that changes at the moment you act gets noticed, because the change is the signal. A per-age or custom-image cursor is real asset work with a real chance of going unseen; the state changes the game already computes are the cheap wins.
- A retained object keeps its cursor where a destroyed one resets it wherever the pointer is (`docs/PHASER.md`): once the chronicle screen's parts are retained, the cursor pass inherits less to fix.
- **Each chronicle a new colony**: the chrome clarifies and justifies that each new chronicle is a new colony experimenting, so losing one is not that bad (playtest, 2026-11-03).
- **Every text measured through `ownBoxOf`**: about sixty layouts in `src/ui/` read a text's padded `width`, `height` or bounds, so `addText`'s padding sits inside their spacing; routed through `ownBoxOf` each moves by 2–4 px and its spacing is looked at again, which a screen redone here does anyway. Each surface rung takes its own.
- Fits accepted until now: the selected pile's ring reaching ~6 units past its press zone and its top 3–4 units under the "Civilization" word; a wrapped goal's second line 1.5 units off the plate's 18-unit rows ("looks nice"); the collection's count beside the price button overlapping a three-digit price by ~10 px at ten copies (price 512 at base 1), raised only when content reaches it; the cursor staying the hand over stacks and rows while a card is carried on the collection screen.

## The meta screens

- The launch screen and the collection screen rebuild their content on a mode change (`lay` in `src/ui/launch-screen.ts`, `modeLaid` in `src/ui/collection-screen.ts`); left out of the retained screen's cut as a screen reshaping itself, to be read against the make-once dogma here.
- A region's picture on the launch screen does not vary through ages: "in v0.0.6 this will probably be a still sprite".
- The ending ledger's crossed-out challenge row on a defeat keeps its diamond gold under the grey line (a standing verdict).
- The launch screen's pile counts end at 717 of 720, past `LAUNCH_BOTTOM`.

## The palette

- The rung's two lines, as they stood before its move (2026-11-02): **The palette** — several colours for several meanings, read against the locked ground's own colours, each held reading answered; **The second theme** — a colour-blind-friendly theme as content through the ledger, every entry given its second value, and the way it is switched. Both are an audit of what the rungs before left unreadable, and the rung is dropped where the glyphs carry every meaning by shape.
- **Colour ledger**: every UI colour resolves through one theme lookup, so an alternate theme becomes content, not surgery. `src/ui/look.ts` holds one entry per meaning (the `DOGMAS.md` _Code_ line since 2026-10-01); what it lacks is the second theme.
- The one gold `0xd9a441` paints six meanings today: the button, city mode, an act waiting, the civilization, the pile count pill, influence. The framing fork put on 2026-11-02 and left open: whether gold stays the civilization's and the button, influence and the pill move off it, or gold stays the interface's accent and the player moves onto a hue no terrain has.
- Colour readings held, measured under SwiftShader unless said, the 2026-11-02 ones on the free samples' mean colours (plains `#959731`, forest `#585d22`, hills `#76823d`, mountain `#8e9b9c`, ocean `#245282`, calm ocean `#123767`, desert `#c5b480`) and not on the bought packs:
  - The settle phase's lime `0x9fbb3a` against the accent `0xd9a441`: 1.03:1 in normal vision, under 1.5 in every colour-vision simulation; the button's word differs and the two are never on screen together. Lime wants to move off the accent's luminance.
  - The enemy's red against military's: 1.08; against the refusal red: 1.00 (two entries, one value).
  - The accent well against the latch's `wellFill 0xb4b9c0` under achromatopsia: ~1.2 in grayscale (deutan, protan, tritan keep a hue split, 1.07–1.76).
  - The buttons not filled in the button colour (Menu, the collection's mode buttons, the price button) "need to be reassessed on 0.0.6"; a chronicle pile's count pill and a deck's grey counts were kept apart "at least for now": the chrome rung's, read here again.
  - The deer's brown mark on the forest fill, 1.02:1, goes with the feature becoming his painted icon at the map rung.

## Motion

- The staging that makes a turn legible shipped in v0.0.1; only its visuals are redone here. A change plays on the map as it stood, and the map draws what the change leaves once it has played (`docs/CHRONICLE-SCREEN.md`).
- **Income flies in from the tiles**: at the income stage each yielding tile sends its resource to the bar.
- **A unit's movement along its path**: three parts resting on the rules handing out the route, which today know a landing's cost and a move's two ends only. Each its own line when taken: the path shown for a unit of the player's on a hover or a drag, with how many turns the way takes; the move played along that path instead of one jump from source to target, for the player's units and the others alike; a move ordered over several turns, the unit's aim then admitting any tile it can walk to, and how the rest of the way is walked — a phase at the start or the end of the turn, a button beside the walk through every unit, a continue-movement button or key — with every tile admitted, how another tile is selected while a unit is being aimed is that line's question.
- **Unit legibility**: a unit forgotten at the end of a turn feels like a slip, and the cure is a state shown, never a warning or a gate on End turn. Two readings taken here, each its own line: a count of the units still holding a move, on the bar or by the end-turn button; a key that jumps the camera to the next unit still holding a move. The sleep order stays an idea, taken only if these two do not suffice.

## The Nomadic tutorial

- **City mode explained**: a new player could not tell what city mode is (playtest, 2026-11-03); the tutorial explains it.
- **Onboarding opens in the chronicle** (from `IDEAS.md`): a new player's game starts in the Nomadic chronicle instead of on the meta screens, with tutorial popups.

## Sound and music

- The sources are `docs/ASSET-SOURCES.md`'s; every pack gets its licence entry in `public/assets/LICENSES.md` in the unit of work that brings it.
