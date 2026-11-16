# The card's states

**Line:** **The card's states** — a card lifted out of the hand's lane stands upright at 110% over a shadow and wears no ring and no point, an unpaid cost's disc is red with the card otherwise plain, a card nothing plays wears the crossed circle on a red disc in its price's place on every face, a worn card is darkened by 50%, and the launch screen's selected pile wears its ring under its card's frame, the other piles dimmed as one thing; `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md` and `docs/META-SCREENS.md` say so, and the glyph stands in the cast with its licence record.

**Spec:** the mockup the user settled the states on is https://claude.ai/artifact/XDo9wmrcmoDr2BdzS1oYhA, the real screens and cards shot from the game with every mark drawn by the page; its _★ Your picks_ preset is the settled look but for three things decided after it, where this dossier holds: a worn card is darkened and not greyed, the line over the hand stands higher, and the two red discs are one red. The pages to write:

`docs/LOOK.md`, _The cast_ ✅ — one row added to the table, after _A site_:

> | A card nothing plays | a crossed circle | Material Design Icons, `block-helper` |

`docs/LOOK.md`, _The cards_ 🔧 — three paragraphs added after **The back** and before the last paragraph:

> **A card's states.** A card lifted out of the hand's lane, under the pointer, held by a small card raised from it, selected or dragged, stands upright, 110% of its size about the middle of its bottom edge, 32 units out of the lane, over a soft black shadow at 50% laid from its own outline, blurred over 9 units and falling 5 units under it. That is all a selected card wears, and a card being aimed wears no more, the line over the hand saying the aim. A cost the player's city cannot pay stands on its disc turned red, the number and the glyph in their own colours, and the card is otherwise drawn as any other; a card the rules refuse for anything but its cost is drawn as any other. A worn card, the discard pile's top card and the back of a dry draw pile, is darkened by 50%, every part of it alike.
>
> **A card nothing plays** wears, where a first cost would stand, the disc of a cost turned the red of an unpaid one, and on it the sign of a card nothing plays, pale, 16.5 units across on a card 124 wide, with no number. It wears it on every face it is drawn as.
>
> **The launch screen's selected pile** wears a ring round its card: a line of the selection's white 3 units wide, 3.5 units off the card's body, a dark line a unit wide along each of its sides, drawn under the card's frame, so the rim of an oval window and a disc rising over the body stand over it. A pile that is not selected is dimmed as one thing, to half its strength over the page, its backs never showing through its card.

`docs/CHRONICLE-SCREEN.md`, _The deal window_ ✅ — the last sentence of the second paragraph replaced:

> An answer the player's city cannot pay for, or one refused, stands on a greyed paper in a greyed ink.

`docs/CHRONICLE-SCREEN.md`, _The hand and the aim_ ✅ — the second paragraph, **A card being aimed says so on the card itself.**, replaced:

> **A card being aimed says so over the hand.** One line stands over the hand, naming the card by its own name and what it is played at, a tile, a unit or a card of the hand, in the selection's colour, the one the map rings the selected tile in. It comes up the moment the card is being aimed and goes when it is let go of, so a card selected and waiting to be played reads apart from one being aimed without reading the map. The card itself wears nothing for it: it stands lifted, as every selected card does.

`docs/INTERFACE.md`, _What stands over what_ ✅ — the last sentence of the last paragraph replaced:

> A card shown large never wears an unpaid cost's red disc: its costs stand as on any card, wherever it was shown large from.

`docs/META-SCREENS.md`, _The launch screen_ ✅ — in the third paragraph's first sentence, "and the pile's card in the ring a selected card wears, and the others are dimmed" becomes:

> and the pile's card in a ring of that colour, and the others are dimmed, a pile as one thing ([`LOOK.md`](LOOK.md))

`public/assets/LICENSES.md`, _Material Design Icons_ — the count goes to twenty and `block-helper` joins Austin Andrews's glyphs; its record in the set's `meta.json` names him as its author and gives it no category, so it is none of the Brand / Logos icons.

No player-facing text entry is added or changed: the sign raises no tooltip, as a cost's disc raises none, and the press on such a card already answers `refusal.played-by-nothing`, "Cannot be played".

**Doc-impact:** `docs/LOOK.md` (_The cast_, _The cards_), `docs/CHRONICLE-SCREEN.md` (_The deal window_, _The hand and the aim_), `docs/INTERFACE.md` (_What stands over what_), `docs/META-SCREENS.md` (_The launch screen_), `public/assets/LICENSES.md`.

**Scope:**

In, the hand:

- **Lifted** is one look for every card out of the lane: the card under the pointer, one held by a small card, the selected one, the dragged one. It stands 32 units up as today, at 110% about its bottom centre, upright whatever its lean in the fan, over the shadow. The shadow's numbers are at the card's own size and grow with it. The card's text is drawn sharp at the lifted size: measured, redrawing a face's five texts takes 1 to 3 ms, once per lift.
- **No ring and no point** in the hand. A card under the pointer and the selected card read alike, and two can stand lifted at once: the user saw it on the page and took it. A dragged card wears the lifted look from the drag's start to its end, and nothing marks the play height: the user's call, the ring that marked it going with the rest.
- **The line over the hand** keeps the 8 units it keeps today over the highest thing a lifted card reaches, which is now the oval's rim at 110%, so it stands about 5.6 units higher than today (its bottom at about 446 of 720). **A refusal's note over a card** stands over the lifted card's top at its size, as it stands over it today.
- **A press** lands on a lifted card over its body at the size it is drawn, and under it down to where it rests while the pointer lifts it, as today. A lifted card is 136 wide, so it covers 6 units of each neighbour, and a press there is the lifted card's.
- **Unaffordable:** the card is drawn as any other. Each cost the refusal names as unpaid has its disc tinted red; the number stays the pale of a number and the glyph keeps its colour. The darkened front, the greyed text ink and the red number all go. Military's glyph is red and nearly lost on the red disc, the number carrying that card: the user accepted it, the press's note saying the rest.
- **A card refused for anything but its cost** (a second Calendar while the event's turn is shown, Fire alone in the hand) is drawn as any other: the user's call, the note on the press saying why.
- **A card nothing plays** wears the sign on every face: the hand, the discard pile's top, a browse, a stack, a small card, shown large, a reward. Today that is every challenge. It has no cost, so the sign's disc stands exactly where a first cost's does, at that front's place for it, and the glyph alone stands on the disc's middle, with no outline, the disc having its rim.
- **Worn** is a darkening by 50% of every part, paintings and code-drawn colours alike; the grey shift of today's worn colours goes. The pile's count pill is not worn, as today.

In, the launch screen:

- The selected pile's ring keeps today's numbers and moves under the card's frame, over the pile's backs. The pile keeps its raise of 10.
- The other piles are dimmed as the collection screen's wholly held stack is dimmed, each colour over the page at the strength, never by a container's alpha, the counts under the pile with it. The strength stays the launch screen's own entry, 0.5.

Chosen at the reconcile:

1. An unaffordable or refused answer in the deal window keeps its greyed paper and ink, apart from the card: an answer is text on paper with no disc. The ledger's entry for that paper is the answer's alone from now on.
2. The launch screen's other piles go through the collection stack's way of dimming as it is.
3. The unpaid cost's disc and the sign's disc are one red: the steel disc multiplied by `#ff6b66`, one entry of the ledger. The page drew the unpaid disc a touch lighter; the game does not. The red number's entry and the darkened front's leave the ledger.
4. The ring leaves the hand and is the launch pile's alone; the pile's raise of 10 and the hand's lift of 32 stay apart, each set by the user.
5. The line over the hand and the refusal's note follow the lifted card's top.

Out: the easing of a lift (Motion's rung), the aim line's own look, the selected age's and region's edges, the collection screen's piles, which are never selected, the palette's reading of red on red.

**Traps:**

- The scene sets every Text's resolution to the window's pixel density on each resize (`holdDesignSpace`, `src/ui/design-space.ts`), and `setResolution` re-rasterises at every call (`docs/PHASER.md`, _Text_): a lifted card's sharper text has to live with that pass, written where it moved.
- A game object is made once and changed in place (`DOGMAS.md`, _Stack_): a face is re-read with another card, so the sign's disc and its glyph are parts of every face, shown or hidden at a read.
- No part of `src/ui/` may tell a card nothing plays by its kind or its id (`DOGMAS.md`, _Architecture_). The rules already answer it: the aim the rules read off such a card refuses every play with `played-by-nothing` (`src/rules/cards.ts`), on any chronicle; the face asks the rules.
- A container's alpha fades each child alone, so the cards under a face show through it: `src/ui/collection-stack.ts` says so above its own dimming, which is the way the launch pile takes.
- A tone is a function over colours and a painted part takes it as a tint (`src/ui/look.ts`, `src/ui/card-face.ts`); a Shape carries no tint (`docs/PHASER.md`, _Shapes and Graphics_).
- A glyph's texture is rasterised at a size picked when it loads (`src/ui/glyphs.ts`): the sign is 16.5 units on a card of the hand and about 50.6 on a card shown large.
- The Material Design files are changed in one thing, the path filled white, with a comment saying so (`public/assets/LICENSES.md`); `block-helper` comes from the `@mdi/svg` package at the version the record names.
- Greying a card through a filter was measured and is not this line's: the user took the darkening. For the record, a filter on a face, which has no size of its own, renders through a texture as large as the screen (`node_modules/phaser/src/gameobjects/components/Filters.js:271-281`).
- The specs read a face's `ring` and `aim-point` by name, and `selected` in `e2e/chronicle-screen.ts` reads the ring.

**Plan:**

1. The glyph enters: its file beside the other Material Design glyphs, the licence record, the cast's symbol. Nothing draws it. An inert commit.
2. `src/ui/look.ts` gains the red of an unpaid cost's disc, the worn strength, the lifted card's size and its shadow, and loses the darkened front's entry and the red number's; the greyed paper's entry is named for the answer.
3. `src/ui/card-face.ts` and `src/ui/face.ts`: a face reads its unpaid costs' discs red, wears the sign where the rules say nothing plays it, is no longer darkened by a refusal, and is worn by the darkening.
4. `src/ui/hand.ts`, `src/ui/aim-line.ts` and the note over a card: the lifted look, no ring and no point in the hand, the line and the note over the lifted card's top.
5. `src/ui/civilization-pile.ts` and `src/ui/launch-screen.ts`: the ring under the frame, the other piles dimmed as one.
6. The specs that read a ring, a point, a darkened face or a pile's strength follow.
7. The six pages are written as the Spec has them; the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/hand-aim.spec.ts`: a selected card stands lifted, upright and larger, wearing no ring and no point, and the line says its aim. CI proves on the push: `press`, `refuse`, `hover`, `launch`, `launch-warning`, `browse`, `collection`, `civilization-mode`, `deck-editing`, `deal`, `embark`, `inspect`, `reference`, `pointer-sweep`, `calendar`, `boot`. The `visual-check` skill after the ship, on the hand with a card lifted and one unaffordable, the discard pile's top, a challenge in the hand and shown large, and the launch screen, at 1280 and at 1920.
