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
  garrison defends where it stands, a farm with a person assigned produces — and **changing the
  map costs a card**: marching, building, terraforming, attacking, negotiating.
- The five core resources of *Prelude* return with much the same flavour: **food, production,
  military, money, science**. **Culture pushes the border out**, and the tiles inside it are the
  city's; population is the city's inhabitants, assigned to its tiles.
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
5. **Income.** Standing things do their standing thing: assigned tiles and their buildings yield
   their resources, and units act passively — a fighting unit attacks an enemy within its range. So what the player sees when drawing holds for the whole turn: a farm placed this
   turn feeds the next.
6. **Enemy phase.** 🔧 Every enemy executes the **intent** it declared last turn; then neutrals and
   enemies move; then every enemy declares its intent for the next turn. An intent stays visible
   through the whole player turn, wherever the city has sight. Killing the enemy cancels its intent;
   moving the target out of it dodges. Intents that re-target as the player moves were rejected:
   the puzzle is in answering a fixed plan with a hand that cannot answer all of it.

### Sight ✅

The map is hidden. The city and its units have **sight** over the tiles near them; every other
tile is in **fog**. Terrain stays known once seen; what stands or moves on a tile — units,
buildings, intents — is seen only in sight. An enemy that declares its intent in the fog attacks
unseen.

### Cards ✅

Four kinds. Every card has a resource cost, possibly none. Every kind cycles: played or
discarded, a card goes to the discard pile and comes around again; *gone once played* is a
keyword some cards carry, not a kind, and the map's gifts are chronicle-only by nature.

- **Building** — raises a building on a tile inside the border where a worker stands. The map is
  the cap: no free tile of the right terrain, no farm — and a building card with nowhere to go
  is a blank draw, which is what keeps a deck from being all buildings. A copy bought in the meta
  makes the deck faster, never the city bigger. Consuming a building card on play was rejected:
  the deck would be the city's blueprint and the chronicle merely its placement.
- **Unit** — puts a unit on the map, made of one population: an inhabitant leaves the tiles to
  become the warrior, the worker, later the trader, and is gone when the unit is killed. Where a
  unit enters is 🔧 until the map is designed.
- **Order** — does one thing with one unit. The plain order moves it, and what it does on arrival
  is its nature: a warrior fights what it reaches, a worker is in place to raise a building, a scout sees
  from where it stops. Other orders trade that shape for an edge — twice the move and no attack,
  twice the attack and no move — and are content, not kinds.
- **Action** — an immediate effect: draw two, gain food, negotiate with a neutral, terraform a
  tile where a worker stands. Everything that is neither a noun entering the map nor a noun
  moving.

### Population ✅

**Population** is the city's inhabitants. Each may be **assigned** to a tile inside the border,
and an assigned tile yields its income. Assigning is free, instant and reversible, never a card:
it is staffing, not a change to the map. A unit card turns one population into a unit.

🔧 Population eats. At income every inhabitant consumes food; the surplus accumulates toward the
next inhabitant, at steps that widen; a deficit starves one. Food as a plain spendable resource
with growth elsewhere was rejected: the famine event would have nothing to bite.

### The map ✅

A tile is layers, and its income, movement cost and sight are the sum of what its layers say:

- **Terrain** — one per tile, fixed unless terraformed: plain, forest, hills, … The list is
  content and changes freely.
- **Feature** — at most one, put there by the generator: a fertile plain, a river.
- **Improvement** — laid by a worker through an action, any number of distinct ones per tile,
  never the same one twice. A road is one; it runs under whatever building stands there.
- **Building** — at most one per tile: the tile has one building slot. That slot is the whole
  difference between a building and an improvement.

🔧 A building's yield may read its neighbours. Nothing in the first playable does; the door
is there so that adjacency is content when it comes.

The city stands on one tile and owns the six around it. The player **claims** any tile adjacent
to one the city owns by spending culture; claiming is free of cards, like assigning, and its
cost rises with the tiles owned, in steps. There is no limit to how far the border reaches. A
cost that also rises with distance was rejected until a chronicle shows fractal borders: a
tendril is adjacent-only and exposed already.

Units enter the map on the city's tile. 🔧 A building that adds an entry point is a keyword for
later content.

### Units and combat ✅

A unit has **health**, **damage**, **range** and **move**. An **attack** removes the attacker's
damage from the target's health, and a unit at zero health is killed. There is
no retaliation: the target answers only when its own attack comes, so a fight is an
exchange across turns, never within one blow.

- **One attack rule.** At income every fighting unit attacks an enemy within its range; a melee
  unit's range is one. An order that moves a fighting unit next to an enemy attacks on arrival
  as well. A unit that stands still is a garrison by that rule alone.
- **Targeting is a fixed rule, shown during the player's turn** like an intent; an order
  overrides it. 🔧 The rule: the target with the least health. Random targeting was rejected: the
  player's own units would be the one thing on the map they cannot read.
- **One unit per tile.** A unit on a tile is a gate: an enemy must kill it to pass. Stacking was
  rejected: piled units turn position into arithmetic.
- **Enemies hurt the city by standing on it.** A tile the city owns yields nothing at income
  while an enemy **occupies** it, and an enemy that **pillages** destroys the building or
  improvement it stands on. Which enemies pillage is content.
- **Defeat is capture.** An enemy that stands on the city's tile through a full player turn —
  still there when the next enemy phase begins — **captures** the city. Population reaching zero
  is the other defeat. A city with health of its own, worn down by attacks, was rejected:
  attrition against a growing city finds an equilibrium where being raided every turn is stable.
- **Military** is the resource that pays for military units, military orders and actions, and
  fortifications.

### Events and the capstone ✅

Each age has a **schedule**: its set of events, each with a weight that shifts with the turn.
The Events step draws from it, seeded, and the schedule escalates — a raid drawn late is larger
than one drawn early, and the harshest entries carry no weight at first. How many events land
per turn is numbers. An event is a script — spawn enemies, shock a resource, change tiles, take
inhabitants — with, optionally, a choice made when it lands. The pitch's families (enemies,
disasters, turmoil, fortunate) are tags on content, not rules.

Events are not announced: the player learns the next one when it lands. Announcing them is
something a technology or a civilization's rule can grant.

**Enemies enter from camps.** The generator places **camps** on the map, each in the fog until
seen. An event that spawns enemies spawns them at a camp, and they follow their script — the
default one walks toward the nearest of the player's units or the city and declares an attack on
it. Scouting is how a chronicle learns where the enemy comes from. A camp is captured the way
the city is — kill what stands on it, stand on it through a full turn — and a captured camp
spawns nothing again. 🔧 Its reward: a chronicle-only card, or influence. Spawning enemies on
any fog tile was rejected: a raid out of a hollow that turns out empty reads as nothing.

**The capstone lands on a fixed turn of the age**, known from the launch; that turn is the
chronicle's length and the lever behind "shorter in the earlier ages". It is the last event —
nothing is drawn after it — it may span several turns, and it ends with a pass condition: the
chronicle ends there, in victory or defeat. What the trial is, is content, one per age.
