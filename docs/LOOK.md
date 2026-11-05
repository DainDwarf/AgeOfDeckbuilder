# The look

> The game's look: the one hand every picture is painted in, how the map, the pieces on it and the cards wear it, and the terms of the packs it comes from. A design page, under [`DESIGN.md`](DESIGN.md)'s legend. How the chronicle screen is worked is [`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)'s; what the map is made of is [`MAP.md`](MAP.md)'s; [`../DOGMAS.md`](../DOGMAS.md) holds the rules every asset enters by.

## Two families ✅

Everything drawn is one of two families, and each has one job.

- **Pictures** are paintings of things: a terrain, a river, a building, a feature, a unit's kind, a card's subject. Every picture is **David Baumgart's hand**: his painted hex terrain, his painted locations, his painted objects, his painted resource icons. Code draws geometry, recolours and composes his pieces; it paints no picture, and a picture a thing needs that his hand has not painted is composed from his pieces or waits. No picture from another hand stands beside one of his in the same frame.
- **Symbols** are signs of quantities and kinds: a resource, a yield, a cost, a unit's kind on its token until its picture exists, the icons the screens read. Every symbol is a **flat one-colour glyph from game-icons.net**, tinted by code in the colour its meaning is known by, so it stays small, sharp and recolourable on any theme. A symbol is never a picture of a thing on the map.

A painted world under flat symbols is the convention of the genre, and the two families do not read as two styles because they never do the same job.

## The map ✅

**The terrain** is his painted hexes, drawn on his lattice: his hexes are painted for rows three quarters of a tile's width apart where a regular hexagon's rows are 0.866 of it, so the map draws its rows that much closer and every hexagon it draws squashed by the same amount, the rules' geometry untouched. His art rises above its hex into the row behind, and a tile's face is drawn behind the row in front of it. A terrain with several paintings spreads them over its tiles, each tile's painting picked by its place on the disc, so a face never changes under the player's eye and one seed always deals one picture.

**The shore** is his painted coast laid over a water tile along every edge where the map draws land, chosen among his paintings by which of the tile's six edges meet land, and between the two he painted of each by the tile's place on the disc. It reads the faces the map draws, so a beach comes with the charting of the land beside it and goes with the terraform that takes the land away, fading in and out with the tile that changed; the water meets the uncharted and the edge of the disc bare.

**Near and far.** 🔧 The map has two drawings of its terrain and one of everything standing on it. Past a zoom threshold the terrain is his painted faces. Below it the terrain is one flat colour per terrain, drawn from his own palette, the tiles told apart by their edges, since his painting at the distance of the whole disc is a texture with nothing to read. Buildings, features, rivers, units and marks are drawn once, the same at every zoom. The threshold, the far colours and the far tile's edge are the map rung's to settle.

**The river** is his painted river set corner by corner along the edges it runs. His rivers are painted crossing a tile between the middles of its edges; set on a corner instead, their legs run the corner's edges, so every corner a river passes wears the one of his pieces whose arms are the river's edges there, each leg reaching the edge's middle where the next corner's piece meets it as his pieces join: a stub at its source, a bend, his fork where two rivers meet. Where a river reaches the water its last half edge is his straight river pressed to that length, running into his river mouth, which washes from the corner into the water over the beaches. A piece with several paintings is picked by the corner's place on the disc, as a face is. The river is drawn over the ground, the art risen above a tile's hexagon included. 🔧 Its weight at the far view is the map rung's.

**The fog and the uncharted.** A tile in fog is drawn as it was last seen with everything of it darkened by the fog's one tint, multiplied into each painting and each mark it carries: his terrain, the beach, the river's pieces, the feature's icon and what it lays on the ground, the building, the unit its snapshot keeps and the stretch of border it wore. The tint is on the painting itself, so the art rising above the hexagon is in fog with its tile and a lit tile's art rising into a fogged row stays lit. A river's piece on a corner is darkened where no tile at that corner is in sight. An uncharted tile wears his void, one of his four picked by the tile's place on the disc, and nothing is drawn beyond the disc: it ends where the void meets the page.

**The borders.** A city's border is one line around the tiles it holds, in the city's colour, 1.5 units wide, running through the middle of each edge of the ground held and rounding every corner on its way, and a band of that colour inside the line, 60% at the line and fading bell-shaped over 7 units, a blur and not a gradient, so it has no inner edge. A tile in fog keeps the stretch of border it wore when last seen, darkened by the fog as everything of it is, so the line runs on into the fog in the fog's dark. A city's own tile wears nothing more of it than the rest.

**The selection.** The selected tile is lit from its edge inward: a rim of the selection's white, 80% at the edge and fading bell-shaped over 5 units as the border's band fades, under a thin line of that white along the edge, 1 unit wide at 90%. It is drawn over every dim the map lays and is never darkened by the fog, since it is the screen's answer and not the tile's, and nothing drawn on the tile moves for it.

**Features** are his resource icons. A feature's tile wears the icon of the thing, 14 units wide on a dark disc with a pale rim, in the row above the tile's middle where the improvements stand beside it: the deer, the cow, his tobacco leaf for a fertile plain, his limestone for flint, his water for an oasis. The disc is what tells a feature from the ground at every zoom; the rest is flavour lying on the land, so the tile itself reads as the feature from across the disc. A deer's or a cattle's tile carries three small copies of its animal, 8 units wide, scattered about the tile's middle by its place on the disc, under whatever stands on the tile. An oasis lies on his pond, one of his four picked by the tile's place. A fertile plain's painting is tinted greener and a flint hill's slate: the painting re-painted once at boot in its own shading, a second painting of the face the tile wears. A feature's row on the infopanel's cards reads the same icon, bare.

## The pieces on the map ✅

**Buildings, sites, camps and the city's own building** are his painted locations, each a sprite standing on its tile over the terrain, the terrain showing around it. The Stone Age's are his huts, tents, standing stones, caves, pens and fields; the later ages' his villages, farms, mills, walls and castles. A building his sets lack is composed from his pieces by code.

**A unit is a token** 🔧: a disc in its faction's colour, carrying a picture of the unit's kind, with the hull it embarks on under it. The picture is painted in the one hand when his hand holds one; until it does, the kind's glyph stands on the disc, a symbol in the token's frame. Which picture each kind carries is the pieces rung's.

## The cards 🔧

A card's art box holds **one painted object** from the one hand over a ground tinted in the card's kind: a building card its building's sprite, a unit card its token's picture, an action card the object of the action, a hazard its cause. The chips, the cost and the glyphs in a card's text are symbols. A card face is one size wherever it stands, and a card shown large is the one other.

## The type ✅

Every word the game shows is set in **Source Sans 3**, regular and bold: Adobe's humanist sans, drawn for interfaces, its figures lining and of one width so a counter ticks in place. The face ships with the build and is loaded before the first text is laid out, so every machine lays out the same screens, and a build whose face cannot be loaded does not start. The debug console's monospace is the machine's own. No text is set under 11 units of the design, the smallest that reads as a word on the smallest window the game is read in ([`INTERFACE.md`](INTERFACE.md)); a text on the map is measured at the map's designed zoom, the zoom being the player's own magnifier.

## The packs ✅

- **David Baumgart's hex sets and icon sets**, bought one pack at a time as a region, an age or a screen needs it: the hex terrain, the hex rivers, coasts and seas, the hex locations, and his painted objects, and his resource icons. His terms: free and commercial games allowed, the files modified and recombined at will, never repackaged or given away on their own, and credit to "David Baumgart" asked, with a link to dgbaumgart.com. His files therefore never sit in the public repository: they live in a store of their own the build reads, and the credit stands on the credits screen.
- **game-icons.net**, CC BY 3.0: each glyph's author credited on the credits screen and in the licence record.
- **Source Sans 3**, Adobe's, under the SIL Open Font License 1.1: the licence ships beside the files, and a modified version may not keep the name.

Every pack keeps its licence entry in `public/assets/LICENSES.md` the moment it enters, as the dogmas say, and nothing in the look comes from a generative model.
