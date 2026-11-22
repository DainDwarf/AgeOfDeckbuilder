# The faction signs' button

**Line:** **The faction signs' button** — a button left of the Icons button on the chronicle screen shows and hides the faction signs, standing while they are hidden and sunk in its well while they are shown, every chronicle screen opening with them hidden; the Graphics window's row and the browser's entry are gone; `e2e/faction-signs.spec.ts` proves it, and `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md` and `public/assets/LICENSES.md` say so. Doc-impact: `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`.

**Spec:**

- `docs/MAP-SCREEN.md`, a new section after _The Icons button_, headed `## The Faction signs button ✅`, one paragraph: "The **Faction signs** button shows or hides the faction signs every unit, every city and every camp wears ([`LOOK.md`](LOOK.md)). It stands left of the Icons button, level with it and as far from it as that one stands from the Menu button, drawn as the Icons button is, a square wearing its sign, a crowned shield, and no word, and sunk in a well while the signs are shown. A press on it switches them at once, the infopanel's card among what changes, and no key does. It is a display and not a mode, as the Icons button's is: the back key leaves it standing, city mode and the settle phase stand with it, and every chronicle screen opens with the signs hidden. The pointer resting on it raises a tooltip under it reading `Faction signs`."
- `docs/INTERFACE.md` → _The menu_ → the paragraph **Graphics**: its first sentence becomes "**Graphics** lists **Animation speed**, **Fullscreen** and **Interface size**.", and the sentence that opens "Faction signs is a row reading whether every unit, every city and every camp wears its faction's sign" and ends "and it is kept in the browser from one launch to the next." is removed whole. The paragraph still ends on "**Back** closes the window as it does Controls."
- `docs/INTERFACE.md` → _The window_: "the Menu button and the Icons button to its top right corner" becomes "the Menu button, the Icons button and the Faction signs button to its top right corner".
- `docs/INTERFACE.md` → _What stands over what_: "the chip of a mode, the pinned achievements and the Icons button over that" becomes "the chip of a mode, the pinned achievements, the Icons button and the Faction signs button over that".
- `docs/LOOK.md` → the cast's table, a row after **The Icons button**'s, its three cells reading "The Faction signs button", "a crowned shield" and "Material Design Icons, `shield-crown`".
- `docs/LOOK.md` → _The chrome_ → **A button**: "its bright silver for the Menu button and the Icons button" becomes "its bright silver for the Menu button, the Icons button and the Faction signs button", and "End turn, the Menu button and the Icons button are squares wearing a sign and no word" becomes "End turn, the Menu button, the Icons button and the Faction signs button are squares wearing a sign and no word".
- `docs/LOOK.md` → _The chrome_ → **A well**: "a latched reading of the resource bar, a reached pinned achievement and the latched Icons button sit in one" becomes "a latched reading of the resource bar, a reached pinned achievement, the latched Icons button and the latched Faction signs button sit in one", and "The latched Icons button's sign stands in the pale ink." becomes "A latched button's sign stands in the pale ink."
- `docs/LOOK.md` → **The faction signs.**: its first sentence becomes "While the **Faction signs** button has them shown ([`MAP-SCREEN.md`](MAP-SCREEN.md)), every unit, every city and every camp wears its faction's sign; hidden, which is how every chronicle screen opens, none does, and colour alone tells whose a thing is." The rest of the paragraph stands.
- `public/assets/LICENSES.md` → _Material Design Icons_: in **What**, "nineteen glyphs" becomes "twenty glyphs" and "`shield-crown` by Michael Miday" joins the list of authors; in **Licence**, "none of the nineteen" becomes "none of the twenty", and the readings gain ", and `shield-crown`, read on 2026-11-22 in the set's `meta.json` (in Gaming / RPG)".
- The one player-facing sentence, the button's name on the rest: `Faction signs`. It is the entry the Graphics row read; no other entry is added, and an entry nothing reads any more is gone.

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`.

**Scope:**

In:

- The button: a square of the kit's bright silver as the Icons button is, left of it, level with it and 8 from it, wearing Material Design's `shield-crown` at the share the other signs stand at, standing while the signs are hidden and sunk in its well with its sign in the pale ink while they are shown, naming itself `Faction signs` on the rest under it. A press switches the signs at once on the map and on the infopanel's card.
- The signs forget, as the discs do (the user's pick over keeping them): every chronicle screen opens with them hidden and the button standing, a reload and a Continue included. The browser's entry, what reads and writes it, and its Vitest test (`src/ui/faction-signs.test.ts`) go. An entry a browser already holds is left there unread: nothing clears it, and a player who had the signs on finds them hidden.
- The Graphics window's Faction signs row goes; the window lists three rows.
- The glyph enters: `public/assets/material-design-icons/shield-crown.svg`, in the cast, with its licence record.

Out:

- No key (a jot in the ideas holds it).
- The signs' own look, every sentence of `docs/LOOK.md` **The faction signs.** past the first.
- The Icons button's behaviour, its key and its opening sunk.
- A fourth place in the corner: the hex grid's line lays its own.
- The Graphics window laid out again: its three rows stand by the rule that laid four.

Corner cases, decided:

- A press on the button while a card or a unit is being aimed lets the aim go, as a press on the Icons button does. Nothing is built for it: every left click on a thing of the UI that is not the hand's goes through one door of the chronicle scene, which lets every aim go. No test of it is added; `e2e/icons.spec.ts` proves the door.
- The button stands and works in city mode and on the settle phase. Under a scrim, a window of the menu or the ending screen it is not reached, as the Icons button is not.
- With a unit inspected, the press rereads the infopanel's card at once, as the row's press did.
- On a 1280 by 720 window at turn 1 the resource bar's plate ends at 1011 and the button stands from 1120 to 1160, measured in the game on 2026-11-22: no fit to settle.

Reconcile, each taken as served:

1. The button and the Icons button become one: one maker serves both, taking what differs between them and nothing else — the sign, the name on the rest, the place in the corner, what a press does, and whether it opens sunk.
2. The signs are held as the discs are, by the chronicle screen as it stands, and by nothing that outlives it.
3. The corner is one row leftward from the Menu button, each square the same gap from the last; the button is its third place.
4. The page gets the section in **Spec**, and the Graphics paragraph loses its sentences.
5. The proof moves with the button: the spec shows the signs by a press on the button where it planted the browser's entry, and "a reload finds it kept" becomes "a chronicle opened again shows none".

**Traps:**

- The signs are read today through one module-level value in `src/ui/faction-signs.ts`, read from the browser once and asked for at four sites: three in `src/ui/map.ts` and one in `src/ui/card-face.ts`. The discs forget because `discsShown` is a local of the chronicle scene's `create`. A module-level value survives a scene's restart, and so do a scene's fields (`docs/PHASER.md`, _`scene.restart()` keeps the instance and its fields_): wherever the signs' state lands, a second chronicle screen opened in the same page load opens with them hidden.
- The card face is every screen's, and only the infopanel's unit face carries a unit in its window (`unitFace`, `src/ui/face.ts`), so no face off the chronicle screen has ever worn a sign and none does after.
- The row reached the chronicle scene from the menu's scene (`pressFactionSigns`, the `DrawsSigns` type, the scene's `drawSigns` field). With the row gone the menu's scene has no word to say about the signs.
- `ButtonSign` (`src/ui/cast.ts`) is a closed union switched in `src/ui/glyphs.ts`; the new sign is a member of it.
- A glyph's file holds the set's own path filled white, with the comment its neighbours carry: `public/assets/material-design-icons/map-marker.svg` is the form, the id `mdi-shield-crown`. The set's drawing, from `@mdi/svg` 7.4.47 (`https://unpkg.com/@mdi/svg@7.4.47/svg/shield-crown.svg`), read through Iconify at the intake as `m12 1l9 4v6c0 5.55-3.84 10.74-9 12c-5.16-1.26-9-6.45-9-12V5zm4 13H8v1.5c0 .27.19.46.47.5h6.96c.31 0 .52-.16.57-.41zm1-6l-2.67 2.67L12 8.34l-2.33 2.33L7 8l1 5h8z` on a box of 24; the package's own file is what lands. Its author is Michael Miday and its one category Gaming / RPG, read in the set's `meta.json` on 2026-11-22.
- The specs tell a sunk button from a standing one by the piece it wears: `tab` sunk, `silver` standing (`pieceWornOf` and `pieceWorn`, `e2e/chronicle-screen.ts`, as `e2e/icons.spec.ts` and `e2e/buttons.spec.ts` read the Icons button).
- `e2e/graphics.spec.ts` names the row `graphics-faction-signs` among the rows it reads top down; its title's "lists Interface size third" still holds.
- `e2e/faction-signs.spec.ts` plants the browser's entry in two tests and presses the row in the third; its fixture (`signedOnes`) and what each tile wears stand as they are.
- A button made is hit-tested only from the next frame, and a spec rests before it presses (`docs/PHASER.md`, _An object made interactive is hit-tested only from the next frame_).
- The look the user picked the sign and the place on: <https://claude.ai/artifact/FHrCyXVGzomuTteqSLypYF>.

**Plan:**

1. `public/assets/material-design-icons/shield-crown.svg`, `src/ui/cast.ts`, `src/ui/glyphs.ts`, `public/assets/LICENSES.md`: the sign stands in the cast and is loaded, worn by nothing yet.
2. `src/ui/corner-layout.ts`, `src/ui/corner-layout.test.ts`: the corner answers a third place, left of the Icons button by the rule that places that one, and its test says so on both widths.
3. `src/ui/icons-button.ts`, `src/ui/chronicle-scene.ts`, `src/ui/faction-signs.ts`, `src/ui/faction-signs.test.ts`, `src/ui/map.ts`, `src/ui/card-face.ts`, `src/ui/text.ts`: the button stands beside the Icons button through the one maker, a press switches the signs on the map and on the infopanel's card, the chronicle screen opens with them hidden, and nothing reads or writes the browser for them.
4. `src/ui/menu.ts`: the Graphics window lists three rows.
5. `e2e/faction-signs.spec.ts`, `e2e/graphics.spec.ts`: the three tests of the first read as under **Verify**; the second reads three rows.
6. `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`: the sentences in **Spec**.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/faction-signs.spec.ts`, its three tests saying:
  - with the signs shown by a press on the button, every unit, both cities and the camp wear their faction's sign, the city in fog darkened, and so does the infopanel's unit card;
  - a chronicle screen opens with nothing wearing a sign and the button standing left of the Icons button, naming itself `Faction signs` on the rest under it; a press sinks it in its well and puts every sign on at once, the infopanel's card among them; a second press takes them off and stands it again; left with the signs shown and opened again by Continue, the chronicle screen shows none and the button stands;
  - the neutral's city taken by the enemies while its tile is in fog keeps the neutral's sign as last seen, the signs shown by a press on the button.
- The look, through the `visual-check` skill: the three squares in the corner at 1280 by 720 and 1920 by 1080, the signs hidden and shown, the tooltip under the button, the Graphics window with three rows.
- CI proves on the push: `graphics`, `buttons`, `icons`, `window`, `site-pointer`, and every other spec that boots the chronicle screen.
