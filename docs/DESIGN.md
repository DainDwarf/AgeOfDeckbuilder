# Design

> Status legend, for every design page: ✅ decided · 🔧 provisional (a stated default, open to change). An open question is not a status — it is a [`BOARD.md`](../workflow/BOARD.md) line whose done-condition is the decision.

The game in broad strokes: what it is, what it deliberately is not, and how a chronicle and the meta fit together. How any screen is worked is [`INTERFACE.md`](INTERFACE.md); the rules a chronicle is played by are [`CHRONICLE.md`](CHRONICLE.md); the map it is played on is [`MAP.md`](MAP.md); the screen it is played on is [`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md); the meta around it is [`META.md`](META.md).

The six are **the design pages**, and they are the **spec**.

## Pitch ✅

A single-player **roguelite deckbuilder** that retraces humanity's history through the ages. The successor to _Age of Deckbuilder: Prelude_; what changed is the chronicle — a card game whose pressure was one fixed goal became a city on a map whose pressure is the age it lives through.

## The chronicle — one city, one age ✅

A **chronicle** is one city's story, told once — the roguelite's unit of play, named with the fiction's own word.

- You settle **one city** on a generated **hexagonal map** of varied terrain. Over the chronicle you extend it over tiles, work and terraform them, build buildings, field units that move, attack and protect, and deal with the neutrals and enemies on the map.
- A chronicle spans **one age**, from its dawn to the threshold of the next. Its history is an **escalating schedule of events** — enemies, natural disasters, inner turmoil, plus neutral and fortunate ones — and it ends with the age's **capstone**, one authored trial per age. Reaching the next age is victory; the city's fall is defeat. A chronicle spanning every age was rejected: in 30–60 minutes each age is a few minutes and every chronicle opens the same way.
- **The ages** are humanity's, in order: the Nomadic Age, the Stone Age, the Bronze Age, the Iron Age, and on through history. The **Nomadic Age** is where humanity stops wandering — the settle is the act it is named for — and it is the age of the fewest verbs: units and instants, one building, the shortest chronicle. A campaign begins there, and its capstone is the threshold of the Stone Age, where buildings begin; what it is made of is [`ages/NOMADIC.md`](ages/NOMADIC.md). 🔧 It later serves a second time, as the first chronicle a new player plays, on a fixed map and schedule with a tutorial.
- **The schedule tests every resource and the map**, never one axis, and no two chronicles deal it in the same order. That is the only rule against a narrow deck: a deck with no answer to famine dies to the famine. A deck has a specialty; it never has an omission.
- **Cards are the verbs; the map holds the nouns.** Buildings and units enter the map through cards, and immediate effects are cards. Standing things do their standing thing for free — a tile with a population assigned yields — and **changing the map costs a card**: building, terraforming, negotiating. What a unit does with itself is the exception it carries with it: it crosses the map on its own move points and attacks on its own action, and no card is spent on either. A worker's action is spent the other way round: on the cards played through it.
- Five core resources: **food, production, military, money, science**. 🔧 Their jobs: food grows the population; production builds buildings and units and shapes tiles; military pays for military units, instants and fortifications; money trades for other goods and accumulates; science pays for manipulating the cards — drawing, discarding and the like. **Culture pushes the border out**, and the tiles inside it are the city's; population is the city's inhabitants, assigned to its tiles.
- **Deterministic.** Every random draw comes from a seeded generator carried in the state, so a chronicle replays from its seed.
- A chronicle lasts **30–60 minutes**, shorter in the earlier ages where the verbs are fewer. 🔧
- **The map is the draft.** 🔧 What the map holds can yield a card that joins the deck for this chronicle only: a camp's capture deals its rewards. The deck built in the meta is who you are; the map is what you found.

## Launching a chronicle ✅

Four choices, each with one job:

- **Age** — given by the campaign: the furthest age reached, the Nomadic Age for a new campaign. Earlier ages stay playable, for the influence and the achievements missed. The age is never a difficulty pick.
- **Region** — a bias on map generation: temperate, desert, coast, mountains, polar, … The region is the **difficulty dial**, and honestly so: a harsh region pays more influence, and some achievements are reachable only from a region that has what they need. 🔧 A freely chosen region with no such stakes was rejected: every launch would take the easiest.
- **Civilization** — who you are: starting units, one passive rule, a look. A civilization owns its deck — one deck per civilization, edited as a facet of it — and its city: the settle card that settles the city is the civilization's, fixed in its settle section, and what the city is — its building, how far it sees, the population it opens with — is that card's content. 🔧
- **Deck** — built in the meta from the shared collection, fixed for the chronicle, in two sections: its **cards**, which the draw pile cycles, and its **settle cards**, played on the settle phase alone.

The four choices lead to the settle phase: the chronicle opens unsettled, and its first act is the settle.

## The meta — humanity's history ✅

Two axes of progression:

- **Depth is achievements.** A goal reached during a chronicle unlocks a **technology**: new cards, better buildings, better units. A victory in an age unlocks the next age.
- **Breadth is influence**, the meta-currency every chronicle pays, victory or defeat, scaled by how the city fared. It buys copies of owned cards, modifications to owned cards, and faster starts.

## Scope ✅

- **Single-player, turn-based, untimed, offline.** No account, no server, no multiplayer — ever.
- **Playable in the browser.** First contact is a tab on the game's page; the same code also ships as a desktop application. An unknown game gets tried in a tab far more often than it gets downloaded.
- **One player city.** Other cities may stand on the map; none is the player's.
- **The map is generated; everything else is authored.** Cards, events, enemies, capstones are written by hand; nothing generates them.
- **A chronicle can be left and resumed** — its save is its state and seed — and one chronicle is in progress at a time.
- **A debug console ships inside the game** — the kind a key opens and a developer types into; there is no separate developer version. The key above Tab, wherever the layout puts it, opens the console and closes it again.
- **English only.** No language is planned; text is kept addable.
- Not in scope: a map editor, modding, a level or scenario editor.

🔧 Real graphics, animation and idle animation, sound and music are the end goal — not the first release, but the stack is chosen with them in mind.
