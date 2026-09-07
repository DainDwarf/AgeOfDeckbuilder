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
  it over tiles, work and terraform them, build buildings, field units that move, attack and protect,
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
  farm with a person assigned yields — and **changing the map costs a card**: building,
  terraforming, negotiating. What a unit does with itself is the exception it carries with it: it
  crosses the map on its own move points and attacks on its own action, and no card is spent on
  either.
- Five core resources: **food, production, military, money, science**. 🔧 Their jobs: food grows
  the population; production builds buildings and units and shapes tiles; military pays for
  military units, instants and fortifications; money trades for other goods and accumulates;
  science pays for manipulating the cards — drawing, discarding and the like.
  **Culture pushes the border out**, and the tiles inside it are the city's; population is the
  city's inhabitants, assigned to its tiles.
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

Two axes of progression:

- **Depth is achievements.** A goal reached during a chronicle unlocks a **technology**: new cards,
  better buildings, better units. A victory in an age unlocks the next age.
- **Breadth is influence**, the meta-currency every chronicle pays, victory or defeat, scaled by how the city
  fared. It buys copies of owned cards, modifications to owned cards, and faster starts.

### Presentation 🔧

Real graphics, animation and idle animation, sound and music are the end goal — not the first
release, but the stack is chosen with them in mind.

## Scope ✅

- **Single-player, turn-based, untimed, offline.** No account, no server, no multiplayer — ever.
- **Playable in the browser.** First contact is a tab on the game's page; the same code also
  ships as a desktop application. An unknown game gets tried in a tab far more often than it
  gets downloaded.
- **One player city.** Other cities may stand on the map; none is the player's.
- **The map is generated; everything else is authored.** Cards, events, enemies, capstones are
  written by hand; nothing generates them.
- **A chronicle can be left and resumed** — its save is its state and seed — and one chronicle is
  in progress at a time.
- **A debug console ships inside the game** — the kind a key opens and a developer types into;
  there is no separate developer version.
- **English only.** No language is planned; text is kept addable.
- Not in scope: a map editor, modding, a level or scenario editor.

### The menu ✅

A **Menu** button stands on the chronicle screen and opens the menu over it; a card being aimed
is let go of first. The menu lists **Settings** and **New chronicle**: a new chronicle begins one
on a fresh seed with the same deck, leaving whatever the city was living through, victory, defeat
or the middle of a turn. **Settings** is where everything the player sets lives, and **Controls**
is its first entry.

A window closes back one step, to the window it was opened from and then to the chronicle screen.
The **back key**, Escape until it is rebound, backs out of whatever is open or pending — a window, a
card being aimed, a tile's inspection, the selection under it, city mode — one step per press, and
raises the menu only from a clean chronicle screen. Nothing pauses, because nothing runs: the game
is untimed, and a menu over the chronicle screen is the chronicle screen waiting.

**Controls** lists every key the game binds — the four directions the map pans, the two it zooms,
the city key, the yield key, the inspection key, and the back key — with two slots to each. A key is
rebound by pressing its slot and then the key itself, whatever that key is; a key already bound
elsewhere moves, leaving the slot that had it empty. A control stands on the key's place on the
keyboard and not on what that key prints, so a layout that moves a letter leaves the control where
the key is; a slot reads what its key printed when it was bound, a key never rebound reads the US
keycap of its place, and a key that prints nothing binds like any other and reads its place too. A
key pressed with Ctrl, Meta or Alt held is the browser's: it does nothing on the chronicle screen,
and a slot listening does not take it. Every mouse button but the two that press the chronicle
screen binds there like a key, and presses nothing on the chronicle screen; the browser's own menu
never shows over the game. A notch of the wheel binds like a key too, one key each way; the map
zooms one notch a press, and only through the two zooms — a wheel notch up and a wheel notch down
until they are rebound. **Default** puts every key back where it began, **Back** closes the window,
and what the player binds is kept in the browser from one launch to the next.

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
3. **Play.** The player plays cards from the hand, in any order, paying each card's resource cost,
   and moves and attacks with the units on the map. Nothing else limits play: the hand, the city's
   resources and what the units hold are the whole budget. A per-turn energy was rejected: a sixth
   economy fighting the five.
4. **End.** The player ends the turn; the rest of the hand is discarded.
5. **Income.** Standing things do their standing thing: assigned tiles and their buildings yield
   their resources. So what the player sees when drawing holds for the whole turn: a farm placed
   this turn feeds the next.
6. **Growth.** A food stock that has reached the growth threshold is spent on one idle
   inhabitant, at most one a turn.
7. **Enemy phase.** 🔧 Neutrals move; each enemy moves by its script and then attacks a unit of
   the player's within its range, spending its action as any unit does. An enemy standing
   on the city's tile attacks nothing: it is there to capture. An attack declared a turn before it
   lands was rejected: it only bites when the player's movement is limited, and units that move
   freely by hand step out of a plan declared a turn ahead for nothing.

### Sight ✅

The map is hidden. The city and its units have **sight** over the tiles near them, and every tile
of the disc stands in one of three states: **in sight**, **fog** — seen before, out of sight now —
or **uncharted**, never seen at all. A tile in sight is drawn live. A tile in fog is drawn as it
was last seen, darkened, with nothing live on it. An uncharted tile is not drawn at all: the disc's
rim is all that says how far the map goes. A river runs along the edge between two tiles and is
drawn where either of them is drawn, so a course through the dark shows only the stretches the
player has charted.

**Fog draws the tile as it was last seen.** The chronicle keeps a snapshot of every tile that has
ever been in sight — its terrain, its feature, its improvements, its building, and the non-player
unit standing on it. Rivers never move, so none is kept; a unit of the player's carries sight with
it and is never stale, so none is kept either. The snapshot is taken again each time a command
changes the chronicle, so an enemy crossing in sight is recorded as it crosses, and a unit killed
reveals nothing after the attack that killed it.

**A unit in the snapshot stays there until its tile is seen again** 🔧: the player is told where it
last stood, not where it is. The end of the turn wiping units out of the snapshot is one rule away.

**A unit of the player's is not moved onto an uncharted tile**, nor across one to reach past it.
Every tile beside a unit is in sight, so this shuts nobody in — walking into the dark costs a step,
never a plan.

**Sight is a unit's stat**, how far in tiles it sees, and the city has a sight of its own. 🔧 A
worker and a warrior see two tiles, and so does the city.

**Every terrain has an elevation**, how high it stands over the ground: plain, coast, deep water
and urban 0, forest 1, hills 2, mountain 3. 🔧

**Sight is a line over the ground.** A tile within a unit's sight is seen when the line from the
unit's tile to it meets no tile between them that is raised — an elevation above 0 — and stands at
least as high as the tile the unit is on. So flat ground never stops a line; a forest hides what
lies behind it from a unit on the plain but not from one on the hills; and hills stop hills. The
target's own elevation is never checked, or no mountain would ever be seen. Where the line runs
exactly along the edge two tiles share it has two ways to go, and the tile is seen when **either**
of them is clear — the generous reading, so that a tile is never hidden by which side of an edge
the arithmetic fell on.

**Every tile the city holds is in sight** 🔧: an inhabitant works it.

Melee needs no rule of its own — an adjacent tile is always in sight — and whether a ranged attack
needs its target in sight waits for the first ranged unit. The enemies read the whole map: their
scripts ignore sight, and no tile is uncharted to them.

### Cards ✅

Three kinds. Every card has a resource cost, possibly none. Every kind cycles: played or
discarded, a card goes to the discard pile and comes around again; *gone once played* is a
keyword some cards carry, not a kind, and the map's gifts are chronicle-only by nature.

- **Building** — builds a building on a tile inside the border where a worker stands. The map is
  the cap: no free tile of the right terrain, no farm — and a building card with nowhere to go
  is a blank draw, which is what keeps a deck from being all buildings. A copy bought in the meta
  makes the deck faster, never the city bigger. Consuming a building card on play was rejected:
  the deck would be the city's blueprint and the chronicle merely its placement.
- **Unit** — puts a unit on the map, made of one idle inhabitant, never the city's last: an
  inhabitant off the tiles becomes the warrior, the worker, later the trader, and is gone
  when the unit is killed. Where a unit enters is 🔧 until the map is designed.
- **Instant** — an immediate effect: draw two, gain food, negotiate with a neutral, terraform a
  tile where a worker stands, **refresh** a unit's move points, **recall** a card from the discard
  pile. The refresh takes one unit, so a unit that has spent its move points crosses again in the
  same turn; it is refused on a unit whose move points are full. Everything that is not a noun
  entering the map.

A card played at a tile is armed as soon as the city can pay for it, whatever the map holds. The
map lights the tiles its aim admits; a press on any other tile lands nowhere and says why — the one
reason that tile is turned down, over that tile, in the note a refused card raises — and the card
stays armed. A card aimed at nothing lands nowhere.

A card played at the discard pile is aimed the same way. The pile's cards are offered in a window,
newest first, and a press on one plays the card at it; the card being aimed is in the hand, so the
pile never offers it. Only the back key and the window's Cancel let the card go, a press beside the
cards and a right click doing nothing, and a card let go of stays in the hand with nothing paid. An
empty discard pile blocks the card in the hand: a refused tile has a tile to say its reason over, an
empty pile has nowhere.

### Population ✅

**Population** is the city's inhabitants. Each may be **assigned** to a tile inside the border, at
most one to a tile, and only an assigned tile yields its income — the city's own tile no exception.
An inhabitant assigned to no tile is **idle**: a unit card turns one idle inhabitant into a unit,
and is refused when none is idle, or when the inhabitant would be the city's last. 🔧 The founding
assigns an inhabitant to each of the seven tiles the city holds, and has two more idle besides.
Assigning is free, instant and reversible, never a card: it is staffing, not a change to the map.
In city mode the map marks the assigned tiles and dims the held ones that are not.

Population **grows**. At the growth phase a food stock that has reached the **growth threshold**
is spent, and the city gains one inhabitant, who arrives idle; at most one a turn, and whatever
the threshold leaves stays in the stock. The growth threshold widens with the population, so each
inhabitant is dearer than the one before. Nobody eats and nobody starves. The resource bar reads
population as the idle inhabitants over all of them, and food as the stock over the growth
threshold. Food as a plain spendable resource with growth elsewhere was rejected: the famine event
would have nothing to bite. Inhabitants consuming food was rejected too: the widening growth
threshold and the schedule's events are the whole of the pressure on the population.

### City mode ✅

The chronicle screen has two modes. Out of city mode a click on a tile **selects** it: the map rings
it and, when a unit of the player's stands there, lights every tile its move points reach and glows,
in the enemies' own colour, every unit its attack reaches. A click on a lit tile is that unit's next
step and selects nothing; a click on a unit glowed is that unit's attack on it, and selects nothing
either. The selection follows the unit to where it stands after either — where it landed, or where
it attacked from and never left — lit and glowed again. A drag from the unit onto a lit or glowed
tile is the same step or the same attack; let go anywhere else, the unit comes home, and a unit that
can do nothing is grabbed and comes home just the same, without a word. A unit with no action left
glows nothing, and a press on the enemy beside it selects that tile like any other. Nothing more.
The **inspection key** then **inspects** the selection — one card in the infopanel per press. A tile
has at most three, in this order: the unit standing on it; the building with the tile's
improvements; and the terrain with its feature and the river running along it. A card is absent
when nothing fills it, and the terrain card never is. The unit card reads the unit's stats; the
other two are headed by their outermost layer and show a row per thing they hold — the river's
among them on the terrain card — with what it gives at income, a row that gives nothing saying so.
After the last card comes the first again, and a tile of a single card holds it: the cycle never
falls back to the bare ring.

A right click is a press on the chronicle screen and not a key, so it binds to nothing and Controls
does not list it: on a tile it selects and inspects in the one press, and pressed again on the tile
already selected it inspects on without selecting afresh; off the map it drops the selection, and
while a card is being aimed it lets the card go.

In **city mode** a tile click acts on the city — assigns an idle inhabitant to the tile or unassigns
the one on it, claims a tile — and selects nothing; a right click there inspects the tile under the
cursor without selecting it, which is the only way to inspect in city mode; a right click off the
map drops that inspection, and so does leaving the mode. A click on a tile the city neither holds
nor can claim does nothing and says nothing; a click the city refuses says why, in the note a
refused card raises. The map marks the tiles the city can claim for as long as the mode is on, and
every tile inside the border shows what it yields — every resource, whatever the yield overlay is
showing, the dim of a tile nobody stands on no exception, and with no dim over the map: that dim is
the overlay's alone. It is entered by the **city key** or by pressing culture or population on the
resource bar, and left by that key, by the back key, or by the chip naming the mode; the map's
frame drawn in the accent and that chip are how the chronicle screen shows the mode is on. Coming
into city mode lets go of a card being aimed, of the selection and of its inspection, and a window
standing over the chronicle screen takes the city key instead.

### The yield overlay ✅

The **yield overlay** shows what every tile yields: a glyph for each point of each resource, in the
colour that resource is known by, over a map dimmed under them. It reads the tile's layers and the
river running along it, and nothing else — whoever stands there and whatever occupies it change
what the tile gives at income, never what the overlay shows. Pressing one of the five core readings
on the resource bar toggles that resource in or out of the overlay, several at a time, and the
reading of a resource shown is latched down in the bar; the **yield key** clears the overlay, or,
from nothing, shows every resource, culture included, and a window standing over the chronicle
screen takes the key instead. Four things stand over the dim, undimmed: the selection's ring, the
tiles lit under it, the infopanel of the tile being inspected, and the tiles a card is aimed at. It
is a display and not a mode: the back key leaves it standing, city mode stands with it, and either
is entered and left without touching the other.

### The map ✅

A tile is layers, and its income and movement cost are the sum of what its layers say, with a
river running along the tile adding to its yield on top of them:

- **Terrain** — one per tile, fixed unless terraformed: plain, forest, hills, … The list is
  content and changes freely.
- **Feature** — at most one, put there by the generator: a fertile plain. A feature lies
  on its terrain, so it is gone when its tile is terraformed.
- **Improvement** — what a worker improves a tile with through an instant, any number of distinct
  ones per tile, never the same one twice. Each names the terrain it goes on, as a feature and a
  building do, and stays through a terraform. A road is one; it runs under whatever building stands
  there.
- **Building** — at most one per tile: the tile has one building slot. That slot is the whole
  difference between a building and an improvement. The city fills the slot of the tile it stands
  on.

**Improving and terraforming reach any tile a worker of the player's stands on**, inside the border
or not — unlike building, which is inside the border only. A tile whose building slot is filled is
not terraformed, and the worker stays where it stands through either.

🔧 A building's yield may read its neighbours. Nothing in the first playable does; the door
is there so that adjacency is content when it comes.

🔧 A tile's layers may add to the sight of a unit standing on it. Nothing does; the door is there
so that seeing further from a tile is content when it comes.

**The map is generated in five layers.** It is a hexagonal disc with the city's tile at its centre.
First the **biomes**: origin tiles scattered over the disc spread outward until every tile belongs to
one biome — land, sea, mountain, and whatever the list comes to hold. Their kinds are **dealt** as
quotas rather than diced one by one, because independent dice can deal a map with no sea at all; the
city's biome is dealt land, and its origin is the city's tile. Second, the **rim**: a tile one of
whose neighbours belongs to a biome of another kind is on its biome's rim, and every rim tile rolls
a width from its biome's odds — the tiles of that biome within that width take the biome's rim
table instead of its interior one. So a sea is rimmed with coast, zero to two tiles wide, and a
mountain range with hills, zero to one; where two biomes of the same kind meet there is no rim,
and neither is the outer ring of the disc one. Third, the **terrain scatter**: every tile draws its
terrain from the weighted table it took, so a sea biome is deep water with the odd island in it and
a land one is mixed. A biome's origin tile is its kind's terrain outright, immune to the rim and
the scatter, so every sea holds deep water and every range mountain. The city's tile is then
**urban**, the one tile the generator puts that terrain on. Fourth, the **feature deal**: each
feature names the terrain it lies on and is dealt onto a share of the tiles of that terrain, the
city's tile never among them, for the same reason the biomes are dealt.

Fifth, the **rivers**. Every tile takes a height — how far it lies from the nearest water, lifted
where the ground is hills or mountain and roughened by a roll — and the corner where three tiles
meet stands at the mean of theirs. A river rises at a corner of a mountain range that is not at the
water already, drawn by its height so the high ground is likelier, and runs edge by edge: at each
corner it takes one of the two edges ahead, weighted so the steeper drop is likelier but never
certain, with a mild preference against repeating the turn it just made. It may climb a little but
not much, never crosses its own course, never runs along more than four edges of one tile, and never
leaves the disc. It ends where it reaches water or a river already run. A course that dies inland or
comes out shorter than the minimum is thrown away and another source drawn; every range dealt is
worth up to two rivers, so a range hugging the coast may yield fewer, and that is accepted. How far
the relief lifts the ground, how far one edge may climb, how sharply the drop weights the draw, how
short is too short and how many rivers a range is worth are tuning.

Biomes are content, like the terrain and feature lists: they grow without a design decision, and
what each one holds — its origin terrain, its interior and rim tables, its rim widths — is
tuning.

A **river** runs along the edges between tiles, the lines two tiles share, from a corner in a
mountain range down to the sea. It lies on no tile, so it is no feature and no layer of one, and a
terraform leaves it exactly where it runs. A river gives a tile it runs along **one food** where that
tile is plain or forest, and nothing to a tile of any other terrain. It gives it once per tile:
however many of the tile's edges a river runs along, and however many rivers meet at the tile, the
tile takes one food. The terrain decides, so terraforming a plain a river runs along into urban ends
what the river gives it while the river stays exactly where it runs. A yield per edge was rejected:
a river hugging four edges of a plain would hand out the map's best tile by the generator's choice
rather than the player's. 🔧 Which terrains a river feeds and what it gives them are tuning, and
what a river costs to cross is open.

The city stands on one tile and owns the six around it. The player **claims** any tile adjacent
to one the city owns by spending culture; claiming is free of cards, like assigning, and the
**culture threshold**, what a claim costs, rises with the tiles owned. A claimed tile takes an
idle inhabitant at once when the city has one. There is no limit to how far the border reaches. A
cost that also rises with distance was rejected until a chronicle shows fractal borders: a tendril
is adjacent-only and exposed already.

Units enter the map on the city's tile. 🔧 A building that adds an entry point is a keyword for
later content.

### Units and combat ✅

A unit has **health**, **damage**, **range**, **move**, **action** and **sight**. An **attack**
removes the attacker's damage from the target's health, and a unit at zero health is killed. There
is no retaliation: the target answers only when its own attack comes, so a fight is an exchange
across turns, never within one blow.

- **A unit moves on its own move points.** It holds **move points**, refreshed to its move at the
  start of the player's turn and lost at the end of it, and spends one per tile crossed, in as many
  steps as the player likes; an instant can refresh them. Coast, deep water and mountain are
  impassable. A unit passes through the units of its own faction and never through another's, and
  it lands only on a free tile. Movement by the cards alone was rejected: in play it limited more
  than it empowered.
- **A unit attacks on its own action.** It holds **action**, refreshed at the same tick as its move
  points, and spends one per attack on a unit of another faction within its range; a melee unit's
  range is one. The player attacks by the same press as a move — the target standing on the tile is
  what makes it an attack — and the two pools are independent: an attack spends no move points, a
  step spends no action, and either follows the other in a turn. A worker holds no action and
  attacks nothing. An instant that refreshes a unit refreshes its move points, never its action.
- **One unit per tile.** A unit on a tile is a gate: an enemy must kill it to pass. Stacking was
  rejected: piled units turn position into arithmetic.
- **Enemies hurt the city by standing on it.** A tile the city owns yields nothing at income
  while an enemy **occupies** it, and an enemy that **pillages** destroys the building or
  improvement it stands on. Which enemies pillage is content.
- **Defeat is capture.** An enemy that stands on the city's tile through a full player turn —
  still there when the next enemy phase begins — **captures** the city. Population reaching zero
  is the other defeat. A city with health of its own, worn down by attacks, was rejected:
  attrition against a growing city finds an equilibrium where being raided every turn is stable.
- **Military** is the resource that pays for military units, instants and fortifications.

### Events and the capstone ✅

Each age has a **schedule**: its set of events, each with a weight that shifts with the turn.
The Events phase draws from it, seeded, and the schedule escalates — a raid drawn late is larger
than one drawn early, and the harshest entries carry no weight at first. How many events land
per turn is numbers. An event is a script — spawn enemies, shock a resource, change tiles, take
inhabitants — with, optionally, a choice made when it lands. The pitch's families (enemies,
disasters, turmoil, fortunate) are tags on content, not rules.

Events are not announced: the player learns the next one when it lands. Announcing them is
something a technology or a civilization's rule can grant.

**Enemies enter from camps.** The generator places **camps** on the map, each uncharted until
seen. An event that spawns enemies spawns them at a camp, and they follow their script — the
default one moves toward the nearest of the player's units or the city and attacks it. Scouting is how a chronicle learns where the enemy comes from. A camp is captured the way
the city is — kill what stands on it, stand on it through a full turn — and a captured camp
spawns nothing again. 🔧 Its reward: a chronicle-only card, or influence. Spawning enemies on
any tile out of sight was rejected: a raid out of a hollow that turns out empty reads as nothing.

**The capstone lands on a fixed turn of the age**, known from the launch; that turn is the
chronicle's length and the lever behind "shorter in the earlier ages". It is the last event —
nothing is drawn after it — it may span several turns, and it ends with a pass condition: the
chronicle ends there, in victory or defeat. What the trial is, is content, one per age.
