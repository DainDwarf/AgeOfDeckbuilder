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

### Scope ✅

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
  there is no separate developer version. The key above Tab, wherever the layout puts it, opens the
  console and closes it again.
- **English only.** No language is planned; text is kept addable.
- Not in scope: a map editor, modding, a level or scenario editor.

🔧 Real graphics, animation and idle animation, sound and music are the end goal — not the first
release, but the stack is chosen with them in mind.

## Interface

### The menu ✅

The menu lists **Settings** and **New chronicle**: a new chronicle begins one on a fresh seed with
the same deck, leaving whatever the city was living through, victory, defeat or the middle of a
turn. **Settings** is where everything the player sets lives, and **Controls** is its first entry.

A window closes back one step, to the window it was opened from and then to the screen under it.
The **back key**, Escape until it is rebound, backs out of whatever is open or pending, one step per
press, and raises the menu only from a clean screen. Nothing pauses, because nothing runs: the game
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

The **debug console** is a dark panel down the top of the screen, standing over everything the
screen carries — the resource bar, a window and the defeat screen included — with the last lines run
above the line being typed. What it covers reads dimly through it, so the bar is still there to be
read and the console writes clear of it. While it stands the keyboard is its — every key types, Backspace
deletes, Enter runs the line, and Escape or the key that opened it closes it — so nothing the game
binds hears a key meanwhile. The pointer is not its: the map still pans and zooms under it. An entry
is one word and Enter, and it is answered in one line; a word the console holds no entry for is
answered `no such entry: <word>`. The console binds no key of the player's and stands in no Controls
window, and a new chronicle raises it with every entry back where it began.

### The presses ✅

Three presses work every screen: the **left click** selects, the **right click** inspects, and the
**inspection key** inspects the selection. The two clicks press the screen and are not keys: neither
binds to anything, and Controls lists neither.

**The selection is one thing, a tile or a card, and the left click makes it.** A press on a thing
selects it, a new selection drops the old one whatever it was, and a press beside the things drops
it and the inspection with it. A left click on the selection acts on it, and what it does is the
selected thing's own.

**The right click inspects and never selects.** It inspects the thing under it — a tile in the
infopanel, a card shown large — and pressed again on the same thing steps its cards on; a card has
but the one, so a second right click on a card shown large does nothing. A press beside the things
drops the inspection and leaves the selection standing. It does this in every state the screen can
be in, so nothing half done has to be undone to inspect a thing.

**The inspection key inspects the selection**, and moves the inspection there when a right click had
put it elsewhere. With no selection, or under a window, it does nothing.

**A window that offers things to select keeps a selection of its own**, which dies with the window;
the screen's selection waits under it.

The **back key** walks these back in this order: the window or the thing shown large, then the
inspection, then the selection.

Two verbs cover it all. **Select** is the tile the map rings, the card lifted out of the hand, or
the card ringed in a browse; **inspect** is the tile in the infopanel and the card shown large.
"Zoom" stays the map's word.

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
   their resources. So what the player sees when drawing holds for the whole turn: a farm built
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

**The debug console switches the two veils that hide a tile**, one entry to each: `uncharted` and
`fog`. Both veils stand until a switch takes one off, and each answers the state its own is left in;
they change what is drawn and nothing the rules read. With the **uncharted veil** off, every tile of
the disc is drawn, an uncharted one included, and the rivers along them with it; a tile out of sight is
still darkened, and one that has no snapshot is drawn as it stands. With the **fog veil** off, every
tile the map draws is drawn live — as it stands, with whoever stands on it, and darkened by nothing —
so the map shows every tile charted clearly and leaves the uncharted ones out. Both off draw the
whole map as the rules hold it.

**The rest of the screen reads what the map draws.** The yield overlay glyphs the tiles the map
draws, each from the face it draws of it, so a tile in fog shows what it yielded when it was last
seen. An inspection reads that same face, and a tile in fog holds no unit card: the unit its
snapshot keeps is a mark and not a card. A press on an uncharted tile lands off the map — it selects
nothing, inspects nothing and acts on nothing — and no card is aimed at one: the map lights only the
tiles it draws. Each veil taken off widens all of it with the map.

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
  the deck would be the city's blueprint and the chronicle merely where it is built.
- **Unit** — puts a unit on the map, made of one idle inhabitant, never the city's last: an
  inhabitant off the tiles becomes the warrior, the worker, later the trader, and is gone
  when the unit is killed. Where a unit enters is 🔧 until the map is designed.
- **Instant** — an immediate effect: draw two, gain food, negotiate with a neutral, terraform a
  tile where a worker stands, **refresh** a unit's move points, **recall** a card from the discard
  pile. The refresh takes one unit, so a unit that has spent its move points crosses again in the
  same turn; it is refused on a unit whose move points are full. Everything that is not a noun
  entering the map.

A card **aimed** at a tile lands on no tile its aim does not admit, and the map lights the tiles it
does. A card that aims at nothing needs nothing of the map: it is played where it stands.

A card aimed at the discard pile is offered the pile's cards in the **aim window**, newest first,
and lands on one of them; the aimed card is in the hand, so the pile never offers it. An empty
discard pile blocks the card in the hand: a refused tile has a tile to say its reason over, an empty
pile has nowhere.

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

### The chronicle screen ✅

The chronicle screen has two modes. Out of city mode a left click on a tile selects it: the map
rings it and, when a unit of the player's stands there, lights every tile its move points reach and
glows, in the enemies' own colour, every unit its attack reaches. A click on a lit tile is that
unit's next step and selects nothing; a click on a unit glowed is that unit's attack on it, and
selects nothing either. The selection follows the unit to where it stands after either — where it
landed, or where it attacked from and never left — lit and glowed again. A drag from the unit onto
a lit or glowed tile is the same step or the same attack; let go anywhere else, the unit comes
home, and a unit that can do nothing is grabbed and comes home just the same, without a word. A
unit with no action left glows nothing, and a press on the enemy beside it selects that tile like
any other. A second left click on a selected tile changes nothing, the city's own tile excepted.
Nothing more.

An inspected tile shows one card in the infopanel per step. A tile has at most three, in this order:
the unit standing on it; the building with the tile's improvements; and the terrain with its feature
and the river running along it. A card is absent when nothing fills it, and the terrain card never
is. The unit card reads the unit's stats; the other two are headed by their outermost layer and show
a row per thing they hold — the river's among them on the terrain card — with what it gives at
income, a row that gives nothing saying so. After the last card comes the first again, and a tile of
a single card holds it: the cycle never falls back to the bare ring.

A left click selects a card of the hand, unaffordable or not. A selected card that aims at a tile is
**being aimed** from that moment: the map is already there, and lights the tiles its aim admits. A
second click plays the card — one that aims at nothing is played where it stands, and refused over
the card with its reason when it is unaffordable; one that aims at a tile lands nowhere, no tile
lying under a card in the hand, so it stays selected; one that aims at the discard pile raises the
aim window and is being aimed from then. That window waits for the second click because it would
stand over the hand, and a card is inspected from the hand before it is played.

**A card being aimed filters every left click by its aim.** A press on a thing the aim admits is the
play attempted there, and the rules answer: a play refused says why over that thing — the one reason
it is turned down, in the note a refused card raises — and the card stays selected. A press on
anything else lets the card go and then lands, in the one press, as it would on a clean screen: a
tile is selected, another card of the hand is selected. A card that aims at a tile admits a drawn
tile, a recall admits a card of the aim window, and a card aimed at the hand — none is written yet —
would admit another card of the hand.

**The drag is the two clicks in one gesture.** A card lifted clear of the hand and released there is
selected and played at once: one that aims at a tile stays selected, being aimed; one that aims at
the discard pile raises the aim window; an unaffordable one stays selected under its refusal note.

A left click on one of the aim window's cards is the play attempted there; a press beside its cards
closes it, as the back key does, leaving the card selected in the hand with nothing paid.

A left click on a pile opens its **browse**, the pile's cards laid out face up: the discard pile's
newest first, the draw pile's by kind and then by name, so the draw order is given away to nobody. A
left click on one of its cards selects it, ringed; clicked again it does nothing — a card in a
browse is there to be seen and no more — and a press beside the cards closes the browse once no card
is selected. A pile is not a card, so a right click on one does nothing.

The right click finds a tile, a card of the hand, a card in a browse or one in the aim window, in
city mode and while a card is being aimed alike; a tile it lands on afresh comes up at its first
card.

The back key takes one step more here than the presses name: after the selection comes city mode. A
card being aimed at a tile is let go of as the selection it is.

A **Menu** button stands on the chronicle screen and opens the menu over it; the selection, a card
being aimed included, is let go of first, and the inspection with it.

In **city mode** a left click on a tile acts on the city — assigns an idle inhabitant to the tile or
unassigns the one on it, claims a tile — and selects nothing, so the right click is the only way to
inspect there; leaving the mode drops that inspection. A click on a tile the city neither holds nor
can claim does nothing and says nothing; a click the city refuses says why, in the note a refused
card raises. The map marks the tiles the city can claim for as long as the mode is on, and every
tile inside the border shows what it yields — every resource, whatever the yield overlay is showing,
the dim of a tile nobody stands on no exception, and with no dim over the map: that dim is the
overlay's alone. It is entered by the **city key**, by a second left click on the city's own tile,
or by pressing culture or population on the resource bar, and left by that key, by the back key, or
by the chip naming the mode; the map's frame drawn in the accent and that chip are how the chronicle
screen shows the mode is on. Coming into city mode lets go of a card being aimed, of the selection
and of its inspection, and a window standing over the chronicle screen takes the city key instead.

### The yield overlay ✅

The **yield overlay** shows what every tile the map draws yields: a glyph for each point of each
resource, in the colour that resource is known by, over a map dimmed under them. It reads the layers
of the face the map draws and the river running along the tile, and nothing else — whoever stands
there and whatever occupies it change what the tile gives at income, never what the overlay shows,
and a tile in fog shows what it yielded when it was last seen. Pressing one of the five core readings
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

The city stands on one tile and owns the six around it. The player **claims** any charted tile
adjacent to one the city owns by spending culture — an uncharted tile is not claimed, as it is not
walked onto, so the border grows only where a unit has seen 🔧; claiming is free of cards, like assigning, and the **culture threshold**, what a claim
costs, rises with the tiles owned. A claimed tile takes an idle inhabitant at once when the city
has one. There is no limit to how far the border reaches. A cost that also rises with distance was
rejected until a chronicle shows fractal borders: a tendril is adjacent-only and exposed already.

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
