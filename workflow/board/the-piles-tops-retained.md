# The piles' tops retained

**Line:** **The piles' tops retained** — the draw pile's back and the discard pile's empty slot are made once with the piles and worn or plain in place; the discard pile shows the chronicle's own face of its top card, worn, under its name and its card's id; the shuffle carries that face to the draw pile's place through the shared turn-over, as the card leaves; a render of the piles destroys nothing. Doc-impact: `docs/PHASER.md`.

**Spec:** `DOGMAS.md` _Stack_, "A game object is made once and changed in place", is the rule: the back, the slot and the carrier are "what has an identity and is few", made with the piles; the top's face is the chronicle's, one per card key, which the previous line made and `src/ui/chronicle-faces.ts` holds. `docs/CHRONICLE-SCREEN.md` _The piles_ states what the piles show and answer — the browse on the right click, nothing on the left, the name and the kind label on the discard pile's top card, the exhaust tab, the flight of a discarded and an exhausted card — and none of it moves. No player-facing sentence: the player sees the same piles.

`docs/PHASER.md` _Scenes and stacking_ gains one entry, after "A Layer's `removeAll(true)` destroys nothing", written out:

> - **A Layer's `add` takes an object off its display list and out of no Container.** `addChildCallback` reads the object's `displayList` alone (`src/gameobjects/layer/Layer.js:236-255`), while a Container's `addHandler` takes it out of its previous Container and off its display list both (`src/gameobjects/container/Container.js:431-448`). An object carried in a Container and handed back to a Layer is still the Container's child until the Container's `remove` lets it go, and the Container goes on listing and drawing it.

**Doc-impact:** `docs/PHASER.md`, the entry above. The chronicle screen page states what the piles show, which does not change.

**Scope:**

In, by part:

- The draw pile's top: one card back made with the pile, worn while the draw pile is dry and plain else, its wear written in place at every render — the paper redrawn and the emblem restroked in the tone. The back's maker answers the back and its wear setter, one maker for every back; the hand's pool, the shuffle's and the civilization pile's keep making backs through it and never wear them.
- The discard pile's top: the chronicle's face of its top card, taken by key, re-read as that card under no refusal and worn, placed at the pile's place about its bottom centre on the resting layer under the pill and the press zone, named `discard-pile-top`, the pile's `card` data on it; the empty slot made with the pile and shown in its place while the pile holds nothing. The zone's presses, the name under the pointer, the foot bubble and the small cards read that face as they read the made face today.
- Every face has one writer. The hand writes the faces of the cards it holds, as today. Each pile hides the faces of its cards at its render — the draw pile's and the exhaust pile's every one, the discard pile's every one but the top, which it shows — their motion stopped where they stand. A face in no pile is destroyed at the render that finds it gone, as today. A face the hand shows is written by no pile at that render, since its card lies in the hand; a face a pile hides is written by no hand, since its card lies in that pile. The hand hides nothing of what left it: its render stops writing the faces of the cards it no longer holds, and keeps clearing their name, disabling their input and taking their bubble down — at take-off for a card that flies, at the render for one that left without a flight.
- The landing: the pile's wait is the block's length, the turn-over added where a card of the block becomes another on the way, read off the stage's two chronicles; when it ends, the pile takes the faces of its cards where they stand — the top placed, read worn and shown, the rest hidden, every motion on them stopped. A stopped flight resolves the hand's wait, so the hand paints the cards it holds and no more; a flight that landed first is stopped on nothing. Order-independent: the scene's clock fires before its tween manager in a frame (`src/plugins/DefaultPlugins.js:93-97`, `src/time/Clock.js:140-141`, `:175-176`, `src/tweens/TweenManager.js:208-209`, `:243`), so the pile takes a face a frame short of its end at most, under a sine ease's last frame; nothing depends on which fires first.
- The shuffle: one carrier container made with the piles, kept hidden on the flight layer, holding the top's face and the shuffle's back for the flight. The face comes off the resting layer into the carrier at 0,0 with the back hidden under it, the carrier placed at the discard pile's place, the empty slot shown there with its count at nothing, and two motions run on the carrier together: the travel to the draw pile's place, `SHUFFLE` long, and the shared turn-over from take-off, which at the edge hides the face, shows the back and answers the carrier. At the landing the face is taken out of the carrier and back onto the resting layer hidden, the back hidden, the carrier hidden, and the piles render. A render while the shuffle is in the air stops the carrier's motions and does the same. The top is `stage.before`'s discard pile's last card; a shuffle of an empty discard pile is a state the rules never reach (`shuffle`, `src/rules/chronicle.ts`), so the fallback slot in the shuffle goes.
- The face writes its card's id into its root's `card` data at every read, beside `names`; the small card, the stack and the pile that write it by hand after making a face drop theirs. A face then reads the same whichever part shows it.

Out: the exhaust tab, which shows no card and changes only its label, as today. The browse's faces, made by id and destroyed with the window, the cards-and-windows rung's. The hand's layout and flights, the previous line's. The scene's landing paint, an idea the user may jot.

Corner cases decided here:

- A dropped play-out (`jumpToEnd`) paints every part on the chronicle the play-out leaves: the piles stop and take down what they have in the air, the shuffle's carrier included, and hide or show every face of their cards; `e2e/broken-motion.spec.ts` asserts the counts and one shown face per card of the hand after that.
- A card discarded and shuffled in one end of turn: its face flies to the discard pile on the hand's flight, is taken by the discard pile at its landing, carried in the shuffle, and hidden under the draw pile at the shuffle's landing; drawn, the hand shows it plain again at the turn-over of a back.
- A card played goes to its pile before its effect lands (`docs/CHRONICLE.md`): the `discarded` stage lands the top before the group's later stages, as today.
- The pile's hide of a face mid-turn-over leaves it narrowed; the next show writes it whole through the paint reset.
- Nothing in the piles keeps a `lift`: the shuffle takes its face by key.

The reconcile, three likenesses: the card back is one maker answering a wear setter, the draw pile's top the only caller that wears; the shuffle's flight and the hand's stay apart, the hand turning a face over in place before or after its travel and the shuffle during it, which is the carrier's reason, the shared turn-over taking both; the empty slot's maker stands as it is, one caller.

**Traps:**

- `docs/PHASER.md` _Scenes and stacking_: the entry above, and a hidden object is neither drawn nor hit, so a face hidden under a stale name counts for nothing a spec reads. _Rendering under WebGL_: a stop resolves what waits on a tween and a kill does not; `turnOver` stopped on its first half returns with the edge unreached, and whatever stopped it owns the object from there — the pile's show and the paint reset write scale 1.
- `docs/PHASER.md` _The pointer's readings_: `disableInteractive` leaves the cursor standing and the game's own reading writes it each frame; a face at the discard pile's place keeps its input disabled from its take-off, and the pile's zone, added after the pill, stands over it in the render list.
- `src/ui/hand.ts` `render` today hides every record not in the hand and `meet` deletes a record at the face's destroy; the hand's records of faces now shown by the discard pile keep standing, their face written by the pile, until `lose` destroys them.
- `src/ui/chronicle-scene.ts` renders the piles before the hand and `faces.lose` after both (`parts`); the one-writer rule makes the order immaterial, and the dossier relies on no order.
- `src/ui/pool.ts` `asPainted` writes shown, alpha 1, scale 1: the shape a face or a back is handed back in after any motion.
- `e2e/chronicle-screen.ts` `pileTop` reads the press zone's height to land just under the top card's top edge; `cardOnFace(page, 'discard-pile-top')` reads the `card` data (`e2e/embark.spec.ts`), `nameOnScreen` and `kindLabelOnScreen` read the top face's `names` data and its `kind-label` child by name (`e2e/browse.spec.ts`); `draw-pile-count` and `discard-pile-count` are the pills' texts (`e2e/broken-motion.spec.ts`). Every retained child keeps its name.
- `e2e/pointer-sweep.spec.ts` ends a turn through a shuffle with the pointer sweeping the hand and waits for the play-out to end: a wait left hanging on a stopped or killed tween of the piles' fails it by timeout.
- `worn` and `unworn` are `src/ui/look.ts`'s tones; the face's `read` takes the tone as its third argument.
- A hook flags a comment block longer than three lines touched under `src/` or `e2e/`; advisory.
- `src/ui/map.ts` is past 2,100 lines and its cut is the next line; this line touches nothing there.

**Plan:**

1. `src/ui/card-face.ts`: the back's maker answers the back and its wear setter; the face's read writes its card's id into its data. `src/ui/small-card.ts`, `src/ui/stack.ts` drop their own write. Leaves every caller of the back as today, nothing wearing one in place yet.
2. `src/ui/piles.ts`: the draw pile's back, the discard pile's slot and the carrier made with the piles; the discard pile showing the chronicle's face of its top; each pile hiding its cards' faces at its render and the discard pile's landing taking them where they stand, the wait counting the turn-over; the shuffle on the carrier through the shared turn-over. Leaves the piles destroying nothing.
3. `src/ui/hand.ts`: the render writing the hand's cards' faces alone, the name, the input and the bubble of a card that left handled at its take-off or at the render. Leaves the hand touching no face of a pile's.
4. `docs/PHASER.md`: the entry.

One commit, the line's.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/browse.spec.ts` — it presses the retained top: a name on the discard pile's top card rested on and right-clicked, its kind label's tooltip, the cursor on the three piles, and the browse of each pile raised and read. CI proves on the push every spec that opens a chronicle, the most direct among them `pointer-sweep` (the shuffle), `embark` (the top read after a play and after a become), `broken-motion` (the counts after a dropped motion), `press`, `controls`, `menu`, `end-of-turn-reading`, `hover`, `capstone`, `settle`.
