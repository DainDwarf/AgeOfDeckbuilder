# The look

> The game's look: the one hand every picture is painted in, how the map, the pieces on it and the cards wear it, and the terms of the packs it comes from. A design page, under [`DESIGN.md`](DESIGN.md)'s legend. How the chronicle screen is worked is [`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)'s; what the map is made of is [`MAP.md`](MAP.md)'s; [`../DOGMAS.md`](../DOGMAS.md) holds the rules every asset enters by.

## Two families ✅

Everything drawn is one of two families, and each has one job.

- **Pictures** are paintings of things: a terrain, a river, a building, a feature, a unit's kind, a card's subject. Every picture is **David Baumgart's hand**: his painted hex terrain, his painted locations, his painted objects. Code draws geometry, recolours and composes his pieces; it paints no picture, and a picture a thing needs that his hand has not painted is composed from his pieces or waits. No picture from another hand stands beside one of his in the same frame.
- **Symbols** are signs of quantities and kinds: a resource, a yield, a cost, a unit's kind on its token until its picture exists, the icons the screens read. Every symbol is a **flat one-colour glyph from game-icons.net**, tinted by code in the colour its meaning is known by, so it stays small, sharp and recolourable on any theme. A symbol is never a picture of a thing on the map.

A painted world under flat symbols is the convention of the genre, and the two families do not read as two styles because they never do the same job.

## The map ✅

**The terrain** is his painted hexes, drawn on his lattice: his hexes are painted for rows three quarters of a tile's width apart where a regular hexagon's rows are 0.866 of it, so the map draws its rows that much closer and every hexagon it draws squashed by the same amount, the rules' geometry untouched. His art rises above its hex into the row behind, and a tile's face is drawn behind the row in front of it. A terrain with several paintings spreads them over its tiles, each tile's painting picked by its place on the disc, so a face never changes under the player's eye and one seed always deals one picture.

**Near and far.** 🔧 The map has two drawings of its terrain and one of everything standing on it. Past a zoom threshold the terrain is his painted faces. Below it the terrain is one flat colour per terrain, drawn from his own palette, the tiles told apart by their edges, since his painting at the distance of the whole disc is a texture with nothing to read. Buildings, features, rivers, units and marks are drawn once, the same at every zoom. The threshold, the far colours and the far tile's edge are the map rung's to settle.

**The river** is a strip of his painted river laid along the tile edges a river runs, bending at every corner, so a river is read where the rules put it, between tiles, and painted as his terrain is. 🔧 Its weight at the far view is the map rung's.

**Features** stand on their tile as his painted icons of the thing, a deer, a cow, a stone, a pond, with no disc or frame of their own: a feature is a thing lying on the land.

## The pieces on the map ✅

**Buildings, sites, camps and the city's own building** are his painted locations, each a sprite standing on its tile over the terrain, the terrain showing around it. The Stone Age's are his huts, tents, standing stones, caves, pens and fields; the later ages' his villages, farms, mills, walls and castles. A building his sets lack is composed from his pieces by code.

**A unit is a token** 🔧: a disc in its faction's colour, carrying a picture of the unit's kind, with the hull it embarks on under it. The picture is painted in the one hand when his hand holds one; until it does, the kind's glyph stands on the disc, a symbol in the token's frame. Which picture each kind carries is the pieces rung's.

## The cards 🔧

A card's art box holds **one painted object** from the one hand over a ground tinted in the card's kind: a building card its building's sprite, a unit card its token's picture, an action card the object of the action, a hazard its cause. The chips, the cost and the glyphs in a card's text are symbols. A card face is one size wherever it stands, and a card shown large is the one other.

## The type ✅

Every word the game shows is set in **Source Sans 3**, regular and bold: Adobe's humanist sans, drawn for interfaces, its figures lining and of one width so a counter ticks in place. The face ships with the build and is loaded before the first text is laid out, so every machine lays out the same screens, and a build whose face cannot be loaded does not start. The debug console's monospace is the machine's own. No text is set under 11 units of the design, the smallest that reads as a word on the smallest window the game is read in ([`INTERFACE.md`](INTERFACE.md)); a text on the map is measured at the map's designed zoom, the zoom being the player's own magnifier.

## The packs ✅

- **David Baumgart's hex sets and icon sets**, bought one pack at a time as a region, an age or a screen needs it: the hex terrain, the hex rivers, coasts and seas, the hex locations, and his painted objects. His terms: free and commercial games allowed, the files modified and recombined at will, never repackaged or given away on their own, and credit to "David Baumgart" asked, with a link to dgbaumgart.com. His files therefore never sit in the public repository: they live in a store of their own the build reads, and the credit stands on the credits screen.
- **game-icons.net**, CC BY 3.0: each glyph's author credited on the credits screen and in the licence record.
- **Source Sans 3**, Adobe's, under the SIL Open Font License 1.1: the licence ships beside the files, and a modified version may not keep the name.

Every pack keeps its licence entry in `public/assets/LICENSES.md` the moment it enters, as the dogmas say, and nothing in the look comes from a generative model.
