# The card face

**Line:** **The card face** — every card face on every screen is the frame pack's plain front in its family's colour, 124 by 182, the oval window on a card that places a thing and the arched one on the rest, its name on the riveted plate, its cost on the pack's disc, its influence on a disc at the foot's right corner, and every back the crowned back; `docs/LOOK.md` and `docs/INTERFACE.md` say so, and the pack stands in the store with its licence entry.

**Spec:** the mockup the user settled the face on is https://claude.ai/artifact/EqdKjbf3S8XYD29QSTQEns, built on the pack's real files; where this dossier and the page disagree, the dossier holds. The pages to write:

`docs/LOOK.md`, _Two families_ ✅ — one paragraph added after the two bullets:

> **A card's frame** is neither: a painted piece of the interface from another hand, chicogames', taken because it sits quietly beside Baumgart's paintings, which stand in its window.

`docs/LOOK.md`, _The cards_ 🔧 — the section rewritten whole:

> A card is 124 units wide and 182 tall wherever it stands, and a card shown large is the one other size, 380 wide; the face is one drawing at both, every measure of it a share of its width.
>
> **The frame** is one of the pack's two plain fronts, a silver rim round a window over a text box of paper, drawn so the front's body is the card. A card whose play places a unit, a building or an improvement wears the oval window, whose rim rises a little above the card's top edge, and every other card the arched one. The frame's body wears the colour of the card's family, the pack's brown paper turned to that colour with its grain kept, the rims and the text box's paper left as painted: gold for a card that places a unit, teal for one that places a building, olive for one that places an improvement, crimson for a hazard, maroon for a challenge, ochre for a trophy, and bone for every other card. The family is read as the window is, by what the card places first and by its kind otherwise. The pack's decorated fronts are drawn nowhere.
>
> **The art box** is the frame's window, of one size on each front, its glass and the shadow at its rim lying over what it holds: one painting of Baumgart's, a building card its building, a unit card its unit's picture, an action card the object of the action, a hazard its cause. A window holding no painting shows its family's colour, pale.
>
> **The name** stands on the pack's riveted plate across the card, at one height on both fronts, the plate's middle 58% of the way down the card, over the foot of the window and the head of the text box. **The text** stands centred on the paper under the plate, and the kind label at the paper's foot.
>
> **The cost** stands on the pack's steel disc at the card's top-left corner, the resource's glyph and the number side by side on it, the disc rising above the card's top edge; a card of two costs wears two discs, the second under the first, in the order the resource bar reads the resources. **The influence** a card gains stands on the same disc at the foot's right corner, influence's glyph and the number.
>
> **The back** is the pack's dark back with its two gold lines, and on it the player's crown in the civilization's colour, six tenths of the card's width across.
>
> The glyphs on the discs and in a card's text are symbols. A card that places a building or an improvement reads on its face what the thing placed gives and takes and where it goes, and a unit's card its unit's stats; a building and a unit read on the infopanel wear their card's face.

`docs/LOOK.md`, _The packs_ ✅ — one bullet added after Baumgart's:

> - **Nice Card Game Template 2**, chicogames', bought: the cards' fronts and back, the name's plate and the disc. Creative Commons Attribution-ShareAlike 3.0: chicogames is credited, and a file the game changes, a front turned to a family's colour among them, stays under the same terms. The files live in the store with the bought packs.

`docs/INTERFACE.md`, _A card's names and its label_ ✅ — the influence paragraph replaced:

> **A card that gains influence wears it on a disc at its foot's right corner**, influence's glyph and the number, on every face; a card gaining none wears no disc there. The pointer resting on it raises the influence reading's tooltip, as the bar's reading does.

`public/assets/LICENSES.md` — one entry added:

> ## Nice Card Game Template 2
>
> - **What:** chicogames' card fronts, plain and decorated, card backs, name plates and discs, in `store/nice-card-game-template-2/`, the pack's `License.txt` beside them.
> - **From:** chicogames, <https://chicogames.itch.io/nice-card-game-template-2>, bought on 2026-11-16, version 2.0, the files as released.
> - **Licence:** Creative Commons Attribution-ShareAlike 3.0 Unported, <https://creativecommons.org/licenses/by-sa/3.0/>, as the pack's `License.txt` has it, which adds that credit "would be nice but is not mandatory". The game credits chicogames. The game turns the plain fronts to its families' colours as it loads them: those are changed files and stay under the same licence. The files sit in the store.

No player-facing text entry is added or changed: the kind labels, the tooltips and every card's text stand as they are.

**Doc-impact:** `docs/LOOK.md` (_Two families_, _The cards_, _The packs_), `docs/INTERFACE.md` (_A card's names and its label_), `public/assets/LICENSES.md`.

**Scope:**

In, the face. Every number below is in the pack's own pixels, measured from the top-left corner of the card's body, which is 560 wide and 820 tall on both fronts; the body's corner lies at (18, 10) in an arched file and at (18, 50) in an oval one, the oval file being 41 pixels taller for the rim that rises above the body. One unit is 560 / 124 of those pixels at the hand's size.

- **The fronts:** `Card - Classic.png` is the plain arched front and `Card 2 - Classic.png` the plain oval one. The window is 419 by 310 at (68, 87) on the arched front and 325 by 428 at (113, 9) on the oval one; its glass is see-through in the file, so what the window holds is drawn under the front.
- **The seven colours**, each a hue in degrees, a saturation and a darkness: unit 46, 0.85, 0.84; building 176, 0.5, 0.52; improvement 70, 0.45, 0.58; thing done 42, 0.14, 1.12; hazard 356, 0.78, 0.6; challenge 344, 0.6, 0.38; trophy 38, 0.7, 0.78. A pixel of the body of hue h, saturation s and lightness l becomes the family's hue, the saturation min(1, S × (0.75 + s)) and the lightness min(1, l × D). The body is the paper a walk from the card's edges reaches without crossing a rim, the inside of the text box left out; a rim's pixel is one that is see-through, near black (l under 0.1), blue-grey (hue 165 to 265 with s over 0.06) or a pale highlight (s under 0.1 with l over 0.5). The mockup's page does exactly this in `readPlain` and `frontOf`, and its seven fronts are the reference. Each family's colour is one entry of the look's ledger, named for the family.
- **The family and the window:** a card whose play places a unit is the unit family, one that places a building the building family, one that places an improvement the improvement family, whatever its kind, the settle cards and the capstone's building cards among them; such a card wears the oval window. Any other card is read by its kind: hazard, challenge, trophy, and every other kind the thing-done family; it wears the arched window.
- **A window with no painting**, which is every window when this line ships, is filled with its family's hue at 82% lightness, its saturation the family's times 0.55 and never over 45%.
- **The name:** `Strip - 3.png`, drawn 600 wide and centred across the card, its middle 475 below the body's top on both fronts; the name on it centred, bold, 12 units, in the plate's dark ink `#34240f`.
- **The text:** centred in the paper from 49 below the plate's middle down to the paper's foot, the paper being 354 by 256 at (94, 487) on the arched front and 372 by 208 at (94, 530) on the oval one; 11 units, ink `#2a2010`. The kind label is the last line of that box, 11 units, upper case and letter-spaced as today, the same ink at 72%.
- **The cost:** `Circle.png` drawn 168 wide, its middle at (60, 28) on the arched front and (60, 34) on the oval one, so it rises above the card's top edge; on it the resource's glyph, 72% of the number's size and in its outline, then the number, bold, 15 units, pale `#f2f6ff`. A second cost's disc stands 101 lower.
- **The influence:** the same disc, its middle at (500, 758), influence's glyph and the number as a cost's.
- **The back:** `Back - 2.png`, and Material Design's `crown`, already in the repository as the player's sign, in the civilization's colour, 60% of the card's width across, on the back's middle.
- **Shown large:** the same face at 380 wide, 556 tall; a stack of twelve reaches 710 of 720.
- **Today's state marks, carried over as they are**, their redesign being the next board line: the selection's ring round the card's body, the aim's point over the body's top edge, standing over the oval's rim on an oval card; the unaffordable card darkened as today's grey paper is against the plain one (to 79%), the text in today's unaffordable ink and the unpaid cost's number in today's red; the worn card darkened to 75%, the grey shift of today's worn colours let go on the painted parts. A card shown large is never drawn unaffordable, as today.
- **A press** lands on the card's body, as today: the oval's rim and a disc rising above the body take no press of their own.

Decided at the reconcile:

1. A thing named in a text and the infopanel's cards stay on today's grey paper, at today's 130 by 182, until the two infopanel lines rework them; a grey card stands 6 units wider than a painted one meanwhile.
2. The copies under a collection stack's front card become that card's own front, peeking out as today's grey edges do.
3. Every back, the draw pile's, the launch screen's piles', a civilization's pile's and a card's in flight, is the crowned back.
4. The empty pile's dashed outline follows the 124 by 182 box and stays dashed.

Corner cases decided here:

- A panel or a browse whose first line of cards stands right under its frame's top edge gives that line the room its discs and oval rims rise into, about 8 units; where a layout cannot, the implementer reports it.
- In a hand of eight cards or more the cards overlap, each under the one at its right, so an influence disc at the foot's right corner is covered there; accepted, a hand that long being rare.
- A unit's and a building's card keep today's sentence: what they read is the two lines after the paintings.

Out: which painting or background a card wears (the two paintings lines; the user leans to the thing's tile behind it, dimmed), the decorated fronts (an idea for v0.0.7), the states' redesign (the next line), the card's size as an interface setting (an idea), the credits screen (the chrome's).

**Traps:**

- The pack is at `C:\Users\daind\OneDrive\Bureau\Bought Assets\Nice Card Game Template 2`. Into the store go `0 - Front`, `0 - Back`, `0 - Icons and stuffs` without its `2x` folder, and `License.txt`; the Photoshop files, the fonts and the first template's folder stay out. The store is pushed before the pointer moves on `main` (`DOGMAS.md`, _Stack_).
- A front is drawn far under its own size, 596 pixels over 124 units, so it wants mipmaps: a sheet's side is a power of two or Phaser makes none (`docs/PHASER.md`, _Textures_; `src/ui/sheet.ts`). The sheets already hold frames painted by code from a loaded file (`Made`, `aroundPicture`), which is what a recoloured front is.
- A tone today is a function over colours (`src/ui/look.ts`), and a painted front has no colour to hand it: the worn and the unaffordable card need a tint on the images.
- The infopanel's cards and the thing card size their type as a share of the card's width, and their smallest type is at the 11-unit floor at 130 wide; `addText` refuses less. They keep 130 by 182 for that reason, so the card's own box and theirs part ways in this line: `metricsOf`, `heightOf` and `drawCardSurface` serve both today.
- No rule may switch on a card's id or read its fields (`DOGMAS.md`, _Architecture_). What a card places is read the way the aimed card's yield already reads that its play would place a building or an improvement (`docs/CHRONICLE-SCREEN.md`, _The hand and the aim_).
- A game object is made once and changed in place (`DOGMAS.md`, _Stack_): a face is re-read with another card of another family and another window, in the hand and on the discard pile.
- The specs read a face's `kind-label`, `influence-label`, `rules`, `ring` and `aim-point` by name, and its names' boxes through `nameAt`.

**Plan:**

1. The pack enters the store with its licence entry and is pushed; nothing draws it. An inert commit.
2. `src/ui/look.ts` gains the seven families' colours; the fronts, the back, the plate and the disc load, and the seven plain fronts of each window are made from the two files.
3. `src/ui/card-face.ts` draws the new face and the new back at 124 by 182, the state marks carried over; the grey paper keeps its own 130 by 182 for the infopanel's cards and the thing card.
4. Every screen laid out on the card's size is looked at with the narrower card and its rising parts: the hand, the piles, a browse, the collection's stacks and their copies, the deck panel, a civilization's pile, the launch screen, the deal window's cards, the stack shown large.
5. The specs that read a face follow.
6. `docs/LOOK.md`, `docs/INTERFACE.md` and `public/assets/LICENSES.md` are written as the Spec has them; the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/hover.spec.ts`, which rests on a face's kind label and on the influence it gains. CI proves on the push: `browse`, `collection`, `deck-editing`, `civilization-mode`, `reference`, `inspect`, `hand-aim`, `refuse`, `launch`, `launch-warning`, `ending`, `capstone`, `deal`, `pointer-sweep`, `press`, `embark`, `tree`, `boot`. The `visual-check` skill after the ship, on the hand, a browse, the collection and a card shown large, at 1280 and at 1920.
