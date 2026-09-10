# The events phase deals a choice

The contract for the board line of that name. Settled with the user on 2026-09-10; the mockup it was
settled on showed the window at 180-wide cards with the resource bar reading over the scrim.

## Scope

**Rules.** On a due turn the events phase no longer lands one drawn event. It deals a number of the
schedule's entries — **two**, a number — drawn seeded, weighted, without replacement, among the
entries weighing anything on that turn; when fewer weigh anything the deal is what there is, one
entry included. The chronicle carries the deal, in the order dealt, and the end of turn stops there:
no draw, no shuffle, an empty hand. Every command but the take is refused while a deal stands, as
every command is refused once the chronicle has ended.

A new command, the **take**, names one dealt entry. It lands that entry, rolls the turn the next is
due — deal, land, roll, in that order, so a replay pins it — then draws the hand as the end of turn
did: draw, shuffle, draw. A take naming an entry not dealt, or made while no deal stands, is refused.

The founding never deals: the first event is due on turn 3 at the earliest.

**Chronicle screen.** The end of turn's play-out ends on the deal, and the window rises from the
chronicle's state the way the defeat screen does, so a chronicle opened on a deal opens on the
window. It stands on the scrim like the browse and the aim window:

- The title reads `An event lands. Take one.` The dealt entries stand under it in one row, centred,
  as cards at the browse's width, in the order dealt.
- An event's card face carries no cost chips. It reads the entry's name, its kind `EVENT` where a
  card reads its kind, and rules text carrying the turn's own numbers: the raid reads how many
  warriors enter from camps on this turn, the famine that it empties the food stock.
- **The left click selects, and a second click on the selection takes.** A press on a card rings
  it, a new press moves the ring; a press on the ringed card is the take, and the window closes on
  it with the landing and the draw playing out after. A press beside the cards drops the ring and
  nothing else.
- **The right click inspects**: the card under it is shown large, at the inspection's width, over
  the window; a press beside it or the back key takes it down onto the window. The inspection key
  inspects the ringed card.
- **The back key** takes down the card shown large, else drops the ring, else — nothing selected,
  nothing large — raises the menu, as it does from a clean screen. The window never closes but by
  the take. The Menu button raises the menu over it and the menu closes back onto it; a new
  chronicle leaves it behind like anything else.
- **The resource bar reads over the scrim while the deal stands**: the choice is decided on what the
  city has, and a famine at an empty stock costs nothing. The map stays under the scrim.

**Text.** One title, one name and one rules entry per placeholder event, the kind label. The raid's
rules entry takes the warrior count as a value.

**Tests.** Rules tests pin: a due turn deals both placeholders, in an order the seed decides, and the
end of turn ends there with the hand empty; the take lands the taken entry and no other, rolls the
next due turn, and draws five; a take of an undealt entry, or with no deal standing, is refused, and
so is every other command while a deal stands; the same seed deals the same order; a deal of one
when one entry weighs anything. The e2e spec `e2e/deal.spec.ts` opens a seed whose first event is
due on turn 3 (`firstSeed` over `beginChronicle(seed, deck).nextEvent`), ends the turn until the
window stands, then: right click shows a card large carrying its event, a press beside takes it
down; a left click rings, the back key drops the ring, the back key again raises the menu and its
Back closes onto the deal still standing; two left clicks take, the window is gone, the turn has
advanced, the hand holds five, and the chronicle shows the taken entry's landing. `watch` stays
clean throughout.

## Doc-impact

- `docs/DESIGN.md`, *The turn* §1 and *Events and the capstone*: the phase deals, the player takes,
  the draw waits on the take; the number dealt is a number. *The chronicle screen* (the presses
  section around the browse and the aim window): the window's presses above, the back key raising
  the menu from it, the bar reading over its scrim. The rejected "several events a turn" line
  stays: a deal is one landing.
- `docs/GLOSSARY.md`: no new term. *Event* names the thing; deal and take are prose.

## Hazards

- **Every loop that ends turns breaks the moment the end of turn stops on a deal.** In the rules:
  `src/rules/fixtures.ts:319` `landings`, `:335` `toFirstRaid`, `throughSchedule`, and every test
  in `src/rules/schedule.test.ts` that reads a landing off one end of turn. In the e2e helpers:
  `e2e/chronicle-screen.ts:381` `workerRun`, `:401` `stepRun`, `:446` `atTileRun`, `:458`
  `fallRun`, and `:701` `endTurn`, plus the specs that loop `apply(…, { type: 'end-turn' })`
  themselves (`fog`, `attack`, `press`, `browse`, `menu`, `recall`, `refuse`, `console`). One
  helper in the rules fixtures that ends the turn and takes the first dealt entry when a deal
  stands, entered through the rules and never by editing state, is the shape; the e2e `endTurn`
  takes through the window's presses the same way. A fixture never forges a state.
- **Which entry lands is no longer the seed's.** Both placeholders weigh one on every turn, so
  every deal holds both and the take decides. `toFirstRaid` takes the raid; the schedule tests that
  read "a famine landed" off the food stock now read "the famine was dealt" or take it. The seed
  still decides the order dealt and the raid's camps.
- **Two meanings on one stage.** The `events` stage carries a deal on the end of turn and a landing
  on the take; whether that is one stage name or two is the implementer's, and a corner the play-out
  reads differently (`src/ui/chronicle-scene.ts:140`) goes in the report.
- **A card face is drawn from a card id** (`src/ui/card-face.ts:103`), and an event is not a card.
  The event's face needs the same drawing off a name, a kind and a rules entry; how far the face is
  shared is the implementer's, and the face on the chronicle screen must not change.
- The landing's warriors enter on camps; a landing that fells the city — none of the two can — would
  fall on the take's last stage as `resolved` already provides (`src/rules/chronicle.ts:158`).
- The next line, *The famine deals a card*, changes what the famine's card face reads once shipped;
  this line writes the famine's rules text for what the famine does today.

## Plan

1. Rules: the deal on the chronicle, the events phase dealing and the end of turn stopping there,
   the take command with its stages, refusals while a deal stands; the fixtures helper; the tests.
2. Chronicle screen: the event face; the deal window on the overlay with its presses, the bar over
   the scrim, the menu over and back onto it; the play-out ending on the deal and the take playing
   out its stages.
3. The e2e spec, the e2e helpers taking through the window, the specs that loop end turns.
4. `docs/DESIGN.md`; the board line and this file deleted.
