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
successor to *Age of Deckbuilder: Prelude*; what changed is the run — a card game whose pressure
was one fixed goal became a city on a map whose pressure is the age it lives through.

### The run — one city, one age ✅

- You found **one city** on a generated **hexagonal map** of varied terrain. Over the run you extend
  it over tiles, work and terraform them, raise buildings, field units that move, attack and protect,
  and deal with the neutrals and enemies on the map.
- The run spans **one age**, from its dawn to the threshold of the next. Its history is an
  **escalating schedule of events** — enemies, natural disasters, inner turmoil, plus neutral and
  fortunate ones — and it ends with the age's **capstone**, one authored trial per age. Reaching the
  next age is victory; the city's fall is defeat. A run spanning every age was rejected:
  in a 30–60 minute run each age is a few minutes and every run opens the same way.
- **The schedule tests every resource and the map**, never one axis, and no two runs deal it in
  the same order. That is the only rule against a narrow deck: a deck with no answer to famine dies
  to the famine. A deck has a specialty; it never has an omission.
- **Cards are the verbs; the map holds the nouns.** Buildings and units enter the map through
  cards, and immediate effects are cards. Standing things do their standing thing for free — a
  garrison defends where it stands, a staffed farm produces — and **changing the world costs a
  card**: marching, founding, working a new tile, terraforming, attacking, negotiating.
- The five core resources of *Prelude* return with much the same flavour: **food, production,
  military, money, science**. **Culture pushes the border out**, and the tiles inside it are the
  city's; population is the workers on tiles and in buildings.
- **Deterministic.** Every random draw comes from a seeded generator carried in the state, so a run
  replays from its seed — for replay, undo and debugging first; a headless simulator is possible but
  not promised.
- A run lasts **30–60 minutes**, shorter in the earlier ages where the verbs are fewer. 🔧
- **The map is the draft.** 🔧 Trading with a neutral, clearing a ruin, taming a terrain can yield
  a card that joins the deck for this run only. The deck built in the meta is who you are; the map
  is what you found.

### Launching a run ✅

Four choices, each with one job:

- **Age** — given by the campaign: the furthest age reached. Earlier ages stay playable, for the
  influence and the achievements missed. The age is never a difficulty pick.
- **Region** — a bias on map generation: temperate, desert, coast, mountains, polar, … The region
  is the **difficulty dial**, and honestly so: a harsh region pays more influence, and some
  achievements are reachable only from a region that has what they need — *Sailing* wants a coast.
  🔧 A freely chosen region with no such stakes was rejected: every launch would take the easiest.
- **Civilization** — who you are: starting units, one passive rule, a look. A civilization owns
  its deck — one deck per civilization, edited as a facet of it. 🔧
- **Deck** — built in the meta from the shared collection, fixed for the run.

### The meta — humanity's history ✅

Two axes of progression, as in *Prelude*:

- **Depth is achievements.** A goal reached during a run unlocks a **technology**: new cards, better
  buildings, better units. Winning a run in an age unlocks the next age.
- **Breadth is influence**, the meta-currency every run pays, won or lost, scaled by how the city
  fared. It buys copies of owned cards, modifications to owned cards, and faster starts.

### Presentation 🔧

Real graphics, animation and idle animation, sound and music are the end goal — not the first
build, but the stack is chosen with them in mind.

## Scope

*(not yet designed)*

## Systems

*(not yet designed)*
