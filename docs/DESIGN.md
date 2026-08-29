# Design

> Status legend: ✅ decided · 🔧 provisional (a stated default, open to change). An open question is
> not a status — it is a [`BOARD.md`](../BOARD.md) line whose done-condition is the decision.

The decided design of the game: what it is, what it deliberately is not, and the systems that
make it up. A standing decision carries one line of rationale, and only when the rejected
alternative is attractive enough that a future session would plausibly redo it. When a decision is
overturned, this page changes in the same unit of work; it never keeps the old version.

This page is the **spec**. Code that disagrees with it is wrong; a gap found during
implementation is reported as a deviation, never closed by editing this page down.

## Pitch

A single-player **roguelite deckbuilder** that retraces humanity's history through the ages. The
successor to *Age of Deckbuilder: Prelude*; what changed is the chronicle — a card game whose pressure
was one fixed goal became a city on a map whose pressure is the age it lives through.

### The chronicle — one city, one age ✅

A **chronicle** is one city's story, told once — the roguelite's unit of play, named with the
fiction's own word: *Chronicles of the mercantile civilization in the Age of Powder*.

- You found **one city** on a generated **hexagonal map** of varied terrain. Over the chronicle you extend
  it over tiles, work and terraform them, raise buildings, field units that move, attack and protect,
  and deal with the neutrals and enemies on the map.
- A chronicle spans **one age**, from its dawn to the threshold of the next. Its history is an
  **escalating schedule of events** — enemies, natural disasters, inner turmoil, plus neutral and
  fortunate ones — and it ends with the age's **capstone**, one authored trial per age. Reaching the
  next age is victory; the city's fall is defeat. A chronicle spanning every age was rejected:
  in 30–60 minutes each age is a few minutes and every chronicle opens the same way.
- **The schedule tests every resource and the map**, never one axis, and no two chronicles deal it in
  the same order. That is the only rule against a narrow deck: a deck with no answer to famine dies
  to the famine. A deck has a specialty; it never has an omission.
- **Cards are the verbs; the map holds the nouns.** Buildings and units enter the map through
  cards, and immediate effects are cards. Standing things do their standing thing for free — a
  garrison defends where it stands, a staffed farm produces — and **changing the map costs a
  card**: marching, founding, working a new tile, terraforming, attacking, negotiating.
- The five core resources of *Prelude* return with much the same flavour: **food, production,
  military, money, science**. **Culture pushes the border out**, and the tiles inside it are the
  city's; population is the workers on tiles and in buildings.
- **Deterministic.** Every random draw comes from a seeded generator carried in the state, so a
  chronicle replays from its seed — for replay, undo and debugging first; a headless simulator is possible but
  not promised.
- A chronicle lasts **30–60 minutes**, shorter in the earlier ages where the verbs are fewer. 🔧
- **The map is the draft.** 🔧 Trading with a neutral, clearing a ruin, taming a terrain can yield
  a card that joins the deck for this chronicle only. The deck built in the meta is who you are; the map
  is what you found.

### Launching a chronicle ✅

Four choices, each with one job:

- **Age** — given by the campaign: the furthest age reached. Earlier ages stay playable, for the
  influence and the achievements missed. The age is never a difficulty pick.
- **Region** — a bias on map generation: temperate, desert, coast, mountains, polar, … The region
  is the **difficulty dial**, and honestly so: a harsh region pays more influence, and some
  achievements are reachable only from a region that has what they need — *Sailing* wants a coast.
  🔧 A freely chosen region with no such stakes was rejected: every launch would take the easiest.
- **Civilization** — who you are: starting units, one passive rule, a look. A civilization owns
  its deck — one deck per civilization, edited as a facet of it. 🔧
- **Deck** — built in the meta from the shared collection, fixed for the chronicle.

### The meta — humanity's history ✅

Two axes of progression, as in *Prelude*:

- **Depth is achievements.** A goal reached during a chronicle unlocks a **technology**: new cards,
  better buildings, better units. A victory in an age unlocks the next age.
- **Breadth is influence**, the meta-currency every chronicle pays, victory or defeat, scaled by how the city
  fared. It buys copies of owned cards, modifications to owned cards, and faster starts.

### Presentation 🔧

Real graphics, animation and idle animation, sound and music are the end goal — not the first
build, but the stack is chosen with them in mind.

## Scope

*(not yet designed)*

## Systems

### The turn ✅

A chronicle is a sequence of **turns**. Each turn, in this order:

1. **Events.** The schedule's due events land and resolve at once; one that offers a choice is
   decided now, on what the city has. Events land before the draw so the hand always answers a
   known map — a deck has to hold up under whichever event comes, not under the one its hand
   happened to fit.
2. **Draw.** The player draws a **hand** of **five** cards from the draw pile. 🔧 Buildings, a
   civilization or an effect may change the number. An empty draw pile is refilled by shuffling
   the discard pile into it.
3. **Play.** The player plays cards from the hand, in any order, paying each card's resource cost.
   Nothing else limits play: the hand and the city's resources are the whole budget. A per-turn
   energy was rejected: a sixth economy fighting the five.
4. **End.** The player ends the turn; the rest of the hand is discarded.
5. **Income.** Standing things do their standing thing: buildings and worked tiles yield their
   resources, and units act passively — a ranged unit attacks an enemy in range, a guarding unit
   protects. So what the player sees when drawing holds for the whole turn: a farm placed this
   turn feeds the next.
6. **Enemy phase.** 🔧 Every enemy executes the **intent** it declared last turn; then neutrals and
   enemies move; then every enemy declares its intent for the next turn. An intent stays visible
   through the whole player turn, wherever the city has sight. Killing the enemy cancels its intent;
   moving the target out of it dodges. Intents that re-target as the player moves were rejected:
   the puzzle is in answering a fixed plan with a hand that cannot answer all of it.

### Sight ✅

The map is hidden. The city and its units have **sight** over the tiles near them; every other
tile is in **fog**. Terrain stays known once seen; what stands or moves on a tile — units,
buildings, intents — is seen only in sight. An enemy that declares its intent in the fog strikes
unseen.
