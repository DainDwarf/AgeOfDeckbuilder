# The look

The pool v0.0.6's rungs draw from, by rung: the ideas each one takes, the fits and colour readings the user accepted until this version, and the findings that bear on it. Read at a rung's cut, never cited by anything durable; a rung's cut strikes what it takes, and the file is deleted when the version closes. The rungs themselves are on [`BOARD.md`](BOARD.md).

## The retained screen (cut 2026-10-30)

- The pure UI modules stay beside the Phaser ones with their Vitest tests, no folder, no convention: settled at the cut.
- The CI browse flake (the `ci-browse-frame-starvation` memory): the browse and deck-editing specs ran red on CI while panels overflowed, ~8 fps under 5 s polls and Phaser's 120-frame delta cap; green since the padding left. Expected back when a panel overflows again, and bigger assets can bring it back; read off each line's CI run.

## The style lock's lines (cut 2026-10-31)

- The style lock's leftovers, for the rungs: Baumgart's files cannot sit in the public repository, so an asset-store line goes ahead of the glyph rung; the unit's picture is the pieces rung's sourcing, his painted objects first, then a commission, the glyph token standing meanwhile, and the user may ask him for an ancient peoples icon pack; the units survey of 2026-10-31 found no Stone Age figures in a non-pixel human hand on sale, only Isle of Lore 2's cartoon figures (10 dollars, commercial, a second hand) and the virtual-tabletop token makers, whose licences exclude software.
- The bar's values tick through a tween that sets their text every frame, and Phaser's text page says frequently changing numbers want BitmapText, a Text recreating its canvas texture on every change: a fact for the font decision, since a bundled font can be a bitmap font too.
- **Colour never carries gameplay meaning alone**: resource chips and anything gameplay-critical get shape or glyph redundancy, fixing colour-blindness in every theme at once — including the default. The glyph rung's rule, landing on `docs/LOOK.md` at its cut.
- Each rung pitches its own colours by meaning, against what stands on screen that day, inside the ledger: the rule that no new value is pitched until the palette lands went with the palette's move to the last of the surface rungs (2026-11-02). The cause diagnosed on 2026-09-20 still holds: pitches spending the one accent on every new affordance.
- The faction colours are the pieces rung's first reading, a token being a disc in its faction's colour on his terrain: the civilization's gold reads 1.09 on his desert and 1.38 on his plains, the neutral's blue 1.04 on his ocean (the free samples, 2026-11-02).
- The Stone Age's ground is grey, the user's pick over the recommended warm stone, until this pass. The civilization's colour is one `LOOK` entry until a second civilization lands (v0.0.7), then a table.

## The map (cut 2026-11-03, the marks cut again 2026-11-05)

The rings-and-marks line was cut into five, one look aspect each, since each takes its own turns of mockups: the borders, the selection ring, the reach, the offensive glow, the claim marks. What leaned on a later rung went to that rung's section below. The mockup the five lines start from, real chronicles on his ground with every mark a control and the ground sampled under each ring: https://claude.ai/artifact/1N9X2ThYMan8sCB1nRKgY3. Its readings: your gold border 1.76 against the ground under it at the mean, 1.32 on the worst tile; the culture ring 1.19, 1.02 at the worst; the neutral's blue 2.15; the selection's white 3.03. A held plain under the 60% city dim reads 1.40 against the same plain in fog.

- The dark edge under a coloured ring, as the card's ring wears one, is the lift the mockup pitched for every ring; each line decides it for its own, and the selection ring took none: its mockup, seven treatments over his ground with the light sampled before and after, is https://claude.ai/artifact/MQaXg3Mpk4b2cEfztCa4NY; the reach line opened on it, and the offensive glow, now the pieces rung's, may.
- The reach line was cut in two on 2026-11-06: the unit's landings this turn are one region, since a multi-turn walk (Motion) would make every walkable tile admitted and leave the light a reading of this turn, and a card's tiles are a scattered handful, so they wear the selection's rim in a colour of their own. A card aimed at a unit went to the pieces rung, a breath on the aimable tiles to Motion. The reach's mockup, six region treatments over his ground with the light sampled, is https://claude.ai/artifact/FM8du8LM2U16Uo4ZYyUT5o; the user picked the outline with the band inside, the selection's white, and the boundary along the tiles' edges as straight segments where the border's is rounded. The aim's mockup, https://claude.ai/artifact/8tNviGxr9XTQL8JqAXRoxR, served the rim per tile, the reach's region, the rest dimmed, seven colours and a dashed line on five cards; the user took the selection's rim as it is, since the region loses the tiles far from its edge, every colour but white is lost on one terrain (sky on the sea, gold on the border, green on the plains), the pale tints and the dash do not read apart, and the breath (Motion) is what will tell the aim from the selection.

## The pieces on the map

- **A health bar on units**: a unit on the map shows its health, which only the infopanel reads today.
- **A building's reach drawn on the map**: a building that gives to the tiles beside it shows which tiles it gives to when its tile is selected, and when its card is aimed, the tiles it would give to; today the yield overlay and the tile panel are what show it.
- A code-drawn placeholder is a flat polygon (`DOGMAS.md`): every mark drawn so far is one, and each is drawn a second time here as an asset.
- **Units read as not interactive in city mode**: a new player could not tell why a unit would not move in city mode (playtest, 2026-11-03); the units show it, dimmed or transparent.
- **Population on the city badge**: since the resource bar dropped population, a new player could not tell what population is (playtest, 2026-11-03); the city's badge makes it clearer.
- **The city's own look rethought** on his building asset rather than the polygon: the population pill, and progress bars along its bottom for the food growth and perhaps the culture threshold — a lot of information condensed in one look (2026-11-05).
- **A unit whose turn is done**, today its own shape under a 60% black scrim, decided with the unit's look: many ways to show it open up once the unit is a picture.
- **The offensive glow**, postponed to this rung on 2026-11-06: the enemies a selected unit can attack, and the unit that has prepared, both wear a red hexagon over their tile today, 40% face and a 90% line through one glow helper, the prepared one in the unit's own faction colour. Both are marks on a unit — the glossary has a selected unit glow the units it can attack, and the prepared mark is a unit state already drawn where the unit is drawn — so both go onto the token, decided with the done dim and the card aim below, since a halo fits the shape it is drawn around and a token can wear two at once: your unit can attack an enemy that has prepared. For that intake: the prepared mark wears the faction's colour, so a hostile neutral that has prepared wears blue, while the attack glow is the enemies' red whoever the target is; and the fog rule stays, the mark going with the token. The hexagon stays as the placeholder until the cut.
- **A card aimed at a unit marks the unit**: a card aimed at a unit, and one played through a unit beside its tile, light the unit's tile today in the aim's own mark; once the token carries his figure the mark goes onto the token, read against the unit's look (2026-11-06).

## The glyphs

- **One diamond for every resource glyph**: the map draws its three turned squares through one helper; the card face's and the infopanel's cost glyphs and the resource bar's chip each hand-roll their own. The day the glyphs become icons, one renderer of a resource's glyph takes all six, and the WebGL-stroke trap goes with the turned square.
- **City mode's worked and unworked tiles**: a held tile nobody works wears a 60% black hexagon, a worked one the population's grey-purple diamond below its middle; both decided with the glyphs. In city mode the diamond (`ASSIGNED_DROP` 16) covers the base of an embarked unit's hull (`HULL_DROP` 12) on a worked coast tile, all three marks still readable.
- **The yield overlay's dim** is reviewed with the glyphs over it, not before. The one look entry `mapDim` paints three meanings today — the overlay's dim, the held tile nobody works, the unit whose turn is done — against the look dogma; the first line that touches one of them splits the entry.
- Shape redundancy is this rung's rule and its work: a resource glyph tells its resource by its shape as well as its colour, in every theme at once; the sentence lands on `docs/LOOK.md` at the cut. The six resource glyphs read 1.0–1.4 on his plains, hills and mountain today, food's green being the code's plain value exactly, held by the overlay's dim alone (the free samples, 2026-11-02).

## The cards and the windows

- **Buildings and improvements shown as cards**: an inspected building or improvement is shown as a card instead of an infopanel's row, with more text and room for an image.
- **Event answers as text**: the deal window shows each answer as text rather than as a card, a card the answer adds still raising its reference tooltip; an answer with several outcomes shows what it does as a list, so a part that does nothing ("0 city") is left out. An event's name, its answers' names and their texts become lore, not UI text, so the glossary lint stops reading them and the exception list stops growing with every event.
- **A minimize button on the scrim's windows**: the map holds still under the deal window, a browse and the capstone's, and a button setting the window aside lets the map be read and moved under it.
- **A minicard's tooltip closes on the way**: hovering a minicard's tooltip, the pointer crossing another reference closes it, and it should not (moved off the board, 2026-11-06).
- Fits accepted until now, measured in Source Sans 3 since 2026-11-02:
  - The card face's long right-aligned name running under the left cost chip ("Goods trade" clears its "2" by 6.4 units).
  - The unit card's head has no fit for a long title; its longest joined state line, "Raft · Capturing · Hostile", is unmeasured.
  - The infopanel building card's "No yield" drops under a site's name the head's room test refuses, the test counting both texts' 2-unit padding; "Old cairn" keeps it beside; kept over a fold measuring by ink.
  - Flood's deal window at the hand's width: the influence chip touches the last "E" of "CHALLENGE", 0–1 units, as on all seven challenge cards that carry influence; the answer title "Settle the floodplain" passes its card's left padding; the Lose the fields reading wraps to four lines at ten or more and sits ~5 units into the art.
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
- **The mode's frame and chip**: the map's frame in city mode's gold and the settle phase's lime, with the chip naming the mode, its own line; the user has UI ideas that would change much more of how city mode is displayed (2026-11-05), possibly a rung of their own: the growth and culture progress bars as UI elements floating on the screen in city mode, and the claimable tiles shown only once an "extend" button is pressed, so the claim marks stop being noise while the player is not buying a tile (2026-11-06). A card can be aimed in city mode, nothing in the hand's aim reading the mode, and its rims then stand over the city dim.
- **Each chronicle a new colony**: the chrome clarifies and justifies that each new chronicle is a new colony experimenting, so losing one is not that bad (playtest, 2026-11-03).
- **Every text measured through `ownBoxOf`**: about sixty layouts in `src/ui/` read a text's padded `width`, `height` or bounds, so `addText`'s padding sits inside their spacing; routed through `ownBoxOf` each moves by 2–4 px and its spacing is looked at again, which a screen redone here does anyway. Each surface rung takes its own.
- Fits accepted until now: the selected pile's ring reaching ~6 units past its press zone and its top 3–4 units under the "Civilization" word; a wrapped goal's second line 1.5 units off the plate's 18-unit rows ("looks nice"); the collection's count beside the price button overlapping a three-digit price by ~2.4 units at ten copies (price 512 at base 1, computed ±2), raised only when content reaches it; the cursor staying the hand over stacks and rows while a card is carried on the collection screen.

## The meta screens

- The launch screen and the collection screen rebuild their content on a mode change (`lay` in `src/ui/launch-screen.ts`, `modeLaid` in `src/ui/collection-screen.ts`); left out of the retained screen's cut as a screen reshaping itself, to be read against the make-once dogma here.
- A region's picture on the launch screen does not vary through ages: "in v0.0.6 this will probably be a still sprite".
- The ending ledger's crossed-out challenge row on a defeat keeps its diamond gold under the grey line (a standing verdict).
- The launch screen's pile counts end at 717 of 720, past `LAUNCH_BOTTOM`.
- At `PILE_SPAN` 145 a third civilization's backs stand 4.5 units under the collection's civilizations scrollbar, unreached while the catalogue holds one civilization (v0.0.7).

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
  - The neutral's dark blue border in fog nearly vanishes on fogged forest (the borders' hand-back, 2026-11-05).

## Motion

- The staging that makes a turn legible shipped in v0.0.1; only its visuals are redone here. A change plays on the map as it stood, and the map draws what the change leaves once it has played (`docs/CHRONICLE-SCREEN.md`).
- **Income flies in from the tiles**: at the income stage each yielding tile sends its resource to the bar.
- **A unit's movement along its path**: three parts resting on the rules handing out the route, which today know a landing's cost and a move's two ends only. Each its own line when taken: the path shown for a unit of the player's on a hover or a drag, with how many turns the way takes; the move played along that path instead of one jump from source to target, for the player's units and the others alike; a move ordered over several turns, the unit's aim then admitting any tile it can walk to, and how the rest of the way is walked — a phase at the start or the end of the turn, a button beside the walk through every unit, a continue-movement button or key — with every tile admitted, how another tile is selected while a unit is being aimed is that line's question.
- **The selection breathes**: the selected tile's rim loops slowly between its resting strength and a lower one, about two seconds a cycle, for as long as the tile stays selected; the user wants it not swayed by the Animation speed setting, so the chronicle screen page's every-motion sentence takes an exception for an idle loop (2026-11-05).
- **The aimable tiles breathe faster**: the rim the tiles a card is aimed at wear loops as the selection's does, a faster cycle, for as long as the card is being aimed (2026-11-06). The rims are made per aim and destroyed with the group today; once they breathe, a pool (the aim's review advisory, `DOGMAS.md` _Stack_).
- The reach's region is what a unit's path is drawn over: the path lines read the reach as shipped, and the reach was designed as a ground a path can run over (2026-11-06).
- **Unit legibility**: a unit forgotten at the end of a turn feels like a slip, and the cure is a state shown, never a warning or a gate on End turn. Two readings taken here, each its own line: a count of the units still holding a move, on the bar or by the end-turn button; a key that jumps the camera to the next unit still holding a move. The sleep order stays an idea, taken only if these two do not suffice.

## The Nomadic tutorial

- **City mode explained**: a new player could not tell what city mode is (playtest, 2026-11-03); the tutorial explains it.
- **Onboarding opens in the chronicle** (from `IDEAS.md`): a new player's game starts in the Nomadic chronicle instead of on the meta screens, with tutorial popups.

## Sound and music

- The sources are `docs/ASSET-SOURCES.md`'s; every pack gets its licence entry in `public/assets/LICENSES.md` in the unit of work that brings it.
