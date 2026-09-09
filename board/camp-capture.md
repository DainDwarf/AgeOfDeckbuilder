# Capturing a camp

The contract for the board line of that name, settled with the user on 2026-09-09. Depends on
*Camps on the map*. The design is already written: `docs/DESIGN.md` → *Cards* (the single-use
keyword), *The map* (the building bullet) and *Events and the capstone* (the capture and its
reward); `docs/GLOSSARY.md` → **camp**, **single use**. The ship edits neither page unless a
deviation forces it.

## Scope

- **The capture mirrors the city's.** In `endOfTurn` (`src/rules/chronicle.ts`), after the enemy
  phase's stages and its defeat return, before the turn ticks: every camp a unit of the player's
  stands on — a worker included — is captured, in tile order. The tile's building slot is emptied
  and `PH_Spoils` is appended to the discard pile. One stage per camp, carrying the tile; the
  city's fall keeps `capture`, the camp's stage is the implementer's to name. A unit killed in
  the enemy phase captures nothing; a chronicle that fell in that phase captures nothing.
- **The reward card** `PH_Spoils`: kind instant, no cost, aimed at nothing, its effect `gained`
  ten each of food, production, military, money and science — the five core resources, culture
  not among them. It is never in a deck: `copies()` in `cards.ts` builds every deck from every key
  of `CARDS`, so the decks list their cards or the builder leaves the card out. A trap either way.
- **Single use**, the keyword: a flag on `Card`. `play` in `chronicle.ts` sends every played card
  to the discard pile at the one line that does; a single-use card goes to no pile there. Discarded
  unplayed at the end of the turn, it goes to the discard pile like any card and comes around. Text
  entries `card.PH_Spoils` and its rules line, which says "single use" in the glossary's words and
  no other.
- **A captured camp spawns nothing** by construction: the arrival draws among the camps standing,
  and none stands where the slot is empty. With every camp captured the arrival places nothing.
- **Two camps captured in one turn** lay two cards.
- No new surface: the map's render follows the tile, the card is met in the discard pile, browsed
  or drawn at the next shuffle.

## Doc-impact

None: the pages above already hold the settled fact.

## Hazards

- Every test reaches a camp through the rules: a fixed seed whose camp a warrior walks to over
  turns, the fifth turn's arrival and its enemy included. Nothing resets, wipes or writes `units`.
- The capture runs after the enemy phase on the same `standing`, so an enemy that killed the
  besieger that phase leaves the camp standing; the test for it wants an enemy adjacent to a camp
  a worker sits on.
- `play` at `chronicle.ts:497` builds `paid` with the discard pile appended before the effect
  runs; the single-use branch is there and nowhere else. A recall aimed at the discard pile never
  offers the card once played.
- The hand's card face reads the card's kind and cost; a keyword has no place on the face today.
  The rules line carries it. Nothing else is drawn for it.
- Culture is a resource in `RESOURCES`; the gain names five and leaves it out. A gain written over
  `RESOURCES` would touch it.

## Plan

1. The single-use flag on `Card`, and `play` sending such a card to no pile.
2. `PH_Spoils` in `CardId` and `CARDS`, its text entries, the decks without it.
3. The capture in `endOfTurn`: the emptied slot, the card in the discard pile, the stage.
4. Rules tests: the capture after the enemy phase, a worker's capture, the besieger killed, the
   fall's phase capturing nothing, the captured camp silent and every camp captured silent, the
   card played and gone, the card discarded and back, two camps in one turn.

## Verify

`npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/camps.spec.ts`.
