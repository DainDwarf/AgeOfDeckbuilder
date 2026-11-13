# The attack on a unit

**Line:** **The attack on a unit** — a unit the selected unit can attack wears the unit's ring in the attack's colour in place of the red hexagon over its tile, and the marked unit the pointer is on, or a unit is dragged over, reads the attack as a lit tile reads the path: an arrow from the unit to it and the health the attack would remove over it; `e2e/attack.spec.ts` proves the ring, the reading and its handing over to the path, and `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md` and `docs/GLOSSARY.md` say so.

**Spec:** the mockup the design was settled on, every card live under the pointer, is https://claude.ai/artifact/To2kJ1oSNxabgUqXhk5syW; the user's picks are the ring in the enemies' red at the selected unit's own numbers, the arrow in that red, the health removed on the path's plate 9 units above the tile's middle, and no icon. The pages, the sentences written by the intake and taken with the design:

- `docs/CHRONICLE-SCREEN.md`, _The map's presses_. The paragraph's verb for what a selected unit does to the units it can attack changes from "glows" to "marks", in every sentence that holds it. Written out:
  - "A selected unit of the player's lights every tile its move points reach, as one region with its own tile among them, and marks every unit its attack reaches with a ring in the enemies' own colour; a tile selected under a unit lights and marks nothing."
  - "A click on a lit tile is that unit's next step and selects nothing; a click on a marked unit is that unit's attack on it, and selects nothing either."
  - "A unit that lights or marks anything is being aimed from the moment it is selected, at the tiles it lights and the units it marks: …" (the rest of the sentence as it stands).
  - "… lit and marked again with what it has left."
  - "A drag from the unit onto a lit tile or a marked unit is the same step or the same attack: a unit dragged lights and marks from the start of its drag as a selected one does, …" (the rest as it stands).
  - "A unit with no action left marks nothing, and a press on the enemy beside it selects that enemy like any other unit."
  - The prepared tile's sentence stands alone: "A tile a unit has prepared on wears its faction's colour, a hexagon over its face, from the enemy phase that prepared it until the next resolves it or the unit is killed; …" (the rest as it stands).
- `docs/CHRONICLE-SCREEN.md`, _The map's presses_, the path's paragraph. Its third sentence becomes: "Once the pointer leaves the lit tiles the path stays on the last one it was on, until the pointer is on a lit tile again, which takes the path, on a marked unit, which reads the attack in its place, or on the unit's own tile, which wears none, or the unit is let go."
- `docs/CHRONICLE-SCREEN.md`, _The map's presses_, a new paragraph after the path's: "**A unit being aimed reads its attack.** The marked unit the pointer is on wears the attack: an arrow from the unit being aimed to it, and over it the health the attack would remove, the unit's damage as its card reads it; a unit dragged over a marked unit shows the same. The attack is read as the path is and in its place, one of the two at a time: it stays on the last marked unit the pointer was on until the pointer is on another marked unit, which takes it, on a lit tile, which takes the path, or on the unit's own tile, which wears neither, or the unit is let go, and a step or an attack keeps none."
- `docs/LOOK.md`, _The reach_: its last sentence, "The enemies the unit can attack glow as they do.", goes.
- `docs/LOOK.md`, _The pieces on the map_, a new paragraph after _A unit's ring_: "**The attack's marks.** Each unit the selected unit can attack wears the unit's ring in the attack's colour, the enemies' red whoever the unit belongs to: the same ring in everything but its colour, lying where a selected unit's lies. The attack read under the pointer is an arrow in that colour from the attacking unit to the unit attacked: one straight line between the middles of the two paintings, stroked as the path's chevrons are, 1.5 units wide at 90% over the map's dark outline 3 wide at 63%, starting 11 units from the attacker's middle and stopping 12 short of the other's, where one of the path's chevrons is its head; it runs over whatever lies between. The health the attack would remove stands on the path's plate, a minus and the number, its middle 9 units above the middle of the attacked unit's tile, clear of its painting. The arrow and the number are drawn where the path is, over the selection's other marks and under the units, and neither they nor the ring are ever darkened by the fog, being the screen's answer as the selection is."
- `docs/LOOK.md`, _The map's order_: "… the marks of the selection and the aim, which are a prepared tile's colour, the reach, a unit's ring and the attack's, the selected tile's rim, an aimed card's rims, and the path with the attack's arrow and its number; the units; …" (the rest as it stands).
- `docs/GLOSSARY.md`, the **aim** row: "… for a selected unit, the tiles it lights and the units it marks."
- The one player-facing entry: the health an attack would remove, `−{health}`, the minus being the true minus the culture threshold's entry writes.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the ring on every unit `byHand` answers as a target, for a selected unit and for a dragged one alike; the arrow and the number under the pointer and under a drag; the red hexagon over a target's tile gone with its look entry; the three pages.
- Out: an enemy out of range that a step would bring in range — it wears nothing and reads nothing here, and the board's next line, "A step and an attack in one press", adds it. The prepared tile's hexagon keeps its place, its strengths and its faction's colour until "A unit's own states"; a prepared unit that is also marked wears the hexagon and the ring together until then. No icon: the crossed swords were tried and turned down. No health bar.
- Decided here:
  - The number is the attacking unit's damage as its card reads it, its own and every bonus it carries where it stands, even where the attacked unit has less health left: a damage of 3 on 1 health reads `−3`.
  - The ring is the attack's colour whoever the unit belongs to, the neutral's at peace included; the Declare War warning is unchanged.
  - An attack over two tiles or more draws one straight arrow, never a way tile by tile.
  - One reading at a time: the path or the attack, whichever the pointer was last on. The attack's reading stays on the last marked unit pointed at exactly as the path stays on its last tile.
  - A unit kept in fog is never marked: `byHand` answers only units in sight.
  - Under the yield overlay and in every other dim the ring, the arrow and the number stand undarkened, as the selection's marks do. City mode marks nothing, as it lights nothing.
- The reconcile's seven, all taken as recommended:
  1. The ring: one ring with the selected unit's, its colour the one thing that varies; every number is the selected unit's ring's own. The colour is a look entry of its own meaning, the attack's, holding the enemies' red today.
  2. The red hexagon: the target's goes, the prepared tile's stays apart until its own line.
  3. The arrow: one stroke with the path's chevrons, the same widths and strengths, its head the path's own chevron; the colour, the line and the straight run are what differ.
  4. The number: on the standing plate as it is, only its place differing.
  5. The pointer's reading: one rule with the path's, a marked unit being one more thing that takes it.
  6. The number itself: read through the rules' own damage, the one the unit card reads.
  7. The order: the ring with the rings, the arrow and the number with the path.

**Traps:**

- A Graphics strokes 2 units wide or less with no joins and no caps (`docs/PHASER.md`): the path's chevron is a canvas texture for that reason, and the arrow's round ends meet the same wall.
- The ring's texture is painted in the selection's white, which is not pure white: a tint multiplies, so a tint laid over it does not give the look entry's value (`DOGMAS.md`, _Prefer the API's native convention_).
- A text on the map is raised again at each zoom (`paintAtZoom` in `src/ui/map.ts`, which lists the labels it raises): a number left out of it blurs at the closest zoom.
- The pointer is read once a frame outside Phaser's dispatch (`followPath`), since a hit test inside it refills the list being walked (`docs/PHASER.md`).
- `lightUnit` keeps the path only where the unit stands as it stood; an attack leaves the unit in place with no action, so nothing is marked and the reading must go with it, and a Back out of the Declare War warning leaves "the unit selected and lit as it was".
- A game object is made once and changed in place (`DOGMAS.md` _Stack_): the rings are pooled today, and the arrow and the number are few.
- The specs read the map through groups' names and data: `window.litKeys` and the `lit` group answer the landings and the targets' tiles together, which `litFor` in `e2e/chronicle-screen.ts` expects, and `shownIn('rings')` is asserted to be the selected and the aimed units' tiles alone by `e2e/unit-ring.spec.ts`, `e2e/held-press.spec.ts` and `e2e/map-order.spec.ts`. Where the attack's rings stand decides which of those readings move.
- The damage is `damageOf` in `src/rules/catalogue.ts`, read on the chronicle the map stands on; a unit dragged without being selected is the one read, not the selection.
- The glossary lint reads the text table: the new entry holds no word.

**Plan:**

1. The look: the attack's colour as an entry of its own, the target glow's entry gone, leaving the prepared glow's standing.
2. The ring on the targets in `src/ui/map-fade.ts` and `src/ui/map.ts`, the hexagon pool for targets gone: a selected or dragged unit marks its targets with the ring, and nothing else moved.
3. The arrow and the number beside the path in `src/ui/map-path.ts`, `src/ui/map-marks.ts` and `src/ui/text.ts`: drawn for a unit and a target handed in, hidden otherwise.
4. The pointer's rule in `src/ui/map.ts`: a marked unit takes the reading, a lit tile takes it back, under a hover and under a drag (`src/ui/map-grab.ts` only if the drag needs it).
5. `e2e/chronicle-screen.ts` reading the ring's colour, the arrow and the number in one question, and the new test in `e2e/attack.spec.ts`; the specs the Traps name brought in step where a reading moved.
6. The three pages, as the Spec writes them, and the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/attack.spec.ts`: a warrior selected beside an enemy marks it with the ring in the attack's colour and shows no hexagon; the pointer on the enemy shows the arrow and a number reading `damageOf` from the rules; the pointer on a lit tile hands over to the path and back; beside the tiles the reading stays; on the unit's own tile it goes; a drag over the enemy reads the same; after the attack nothing is marked or read. CI proves on the push: `e2e/archer.spec.ts`, `e2e/unit-ring.spec.ts`, `e2e/held-press.spec.ts`, `e2e/map-order.spec.ts`, `e2e/path.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/pillage.spec.ts`, `e2e/console.spec.ts`, and the rest of the suite.
