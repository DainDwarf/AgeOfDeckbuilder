# The card aimed at the hand cut in two

**Line:** The card aimed at the hand cut in two — the builder's 20 and the warlord's 25, "on a hazard in hand, else on its first other card", become two gambits each, the first playing the card aimed at the hand on the first card in hand that strikes, the second on its first other card; `--personas` prints both sentences at their numbers, each gambit is held by one test on the fixtures, the trace names each, and `--without` leaves either out alone.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md) → _The persona and the gambit_: "A gambit is one condition and one command", "A command refused or changing nothing is dropped and the walk goes on down the list", "No gambit names a card … it reads kinds, aims, costs, blocks, yields and counts", and "A gambit weighs candidates one ply deep and no further". [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md): **strike** is what a hazard or a challenge does at the end of a turn it is still in the hand; **discard** sends a card from the hand to the discard pile. [`docs/ages/STONE.md`](../../docs/ages/STONE.md) → _The cards_, Fire: "A hazard discarded so does not strike that turn, and comes around again."

The sentences, the ones `--personas` prints, the builder's 20 and 21 and the warlord's 25 and 26:

> Play a card aimed at the hand on the first card in hand that strikes

> Play a card aimed at the hand on its first other card

The page's builder paragraph, its last clause today "pays a hazard it can, takes of a deal what its trial shows costs least, and discards through a card aimed at the hand what nobody plays", becomes:

> pays a hazard it can, takes of a deal what its trial shows costs least, discards through a card aimed at the hand a card that strikes, and cycles the hand through another.

No player-facing text: the persona is the simulator's.

**Doc-impact:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md), the builder paragraph's last clause as written above. The warlord paragraph names neither the hazard nor the discard and changes by no word.

**Scope:**

In: the one gambit cut into two in both personas, at the bottom of each list where the one sits today, the strike discard first, before the gambit that ends the turn; the two sentences; one test per gambit on the fixtures, the standing test split; the page clause. Out: the hazard-paying gambit, which reads the hazard kind and stays as it is; the position of the pair in the list; every other gambit; any preference among the cards the second gambit discards.

The first gambit's target widens from a hazard to a card that strikes, a hazard or a challenge that strikes, the first in hand order; a challenge with no strike is no target of the first gambit and is reached by the second as any other card. Why: a challenge strikes while held as a hazard does, the card aimed at the hand discards either, and the discard skips the strike that turn either way. The deal gambit avoids entries bringing a card that strikes where one qualifies, so a challenge reaches the hand when every entry strikes or costs more.

The second gambit's target stays the first other card, whatever it is: the card aimed at the hand played from the first slot discards the second, played from any other slot discards the first. With two cards aimed at the hand in hand, the first may discard the second; at one ply the trial cannot tell that from any other discard, and the page forbids looking further, so it stays. A preference for a card the refusal holds back is a change in what the persona wants, made when a trace shows the misplay, not here.

Each gambit answers the first card aimed at the hand, in hand order, that the refusal lets through, as today; a hand of one card blocks the aim in the rules and so answers nothing.

The gambit numbers after the cut: the builder's end 21 → 22; the warlord's end 26 → 27. Nothing on the board, in the tests or in the skills cites those two numbers.

Reconcile: the reading "a card that strikes" is the one the deal gambit already makes over every pile when it refuses an entry that adds one, through the rules' own reading of a card's strike; the first gambit goes through that reading as it is, the hand handed in where the deal gambit hands in every pile. The hazard-paying gambit stays apart for a difference that is meant: a hazard is paid and banished, a challenge is played by nothing.

Measured, 2026-10-22, the Stone Age deck as played, 20 seeds per persona: the card aimed at the hand lands 3 to 15 times a chronicle on the builder and 2 to 18 on the warlord, 7 at both medians, never more than twice in one turn, the deck holding two copies.

**Traps:**

- The command's `card` is the target's slot in the hand as it stands, the played card's slot counted; the rules shift it past the played card themselves. The gambit hands in the hand index and nothing else, as today's does.
- The fixtures hold a hazard that strikes, challenges that strike, and a challenge with no strike and influence alone; the first gambit's test wants one of each beside the card aimed at the hand, the strikeless challenge asserted left alone by the first gambit and discarded by the second.
- The rules block a card aimed at the hand while the hand holds one card; the gambits read the refusal, never the hand's length.
- The persona page forbids naming a card: the gambit reads the aim and the strike, never Fire.
- The trace names a gambit by its sentence, and `--without` numbers the gambits as `--personas` prints them; the two sentences differ, so a trace tells the two apart.
- Comments are for traps only; the sentences carry the why.
- No measurement runs on CI and none is committed; the baseline below is taken at HEAD before any file changes.

**Plan:**

1. The one gambit cut into two in the shared list both personas read, the sentences as written, in order at the bottom before the turn ends; the standing test split into one per gambit on the fixtures, the first with a hazard, a striking challenge and a strikeless challenge in hand. Leaves: `--personas` printing both sentences as the builder's 20 and 21 and the warlord's 25 and 26, `npm test` green.
2. The page clause. Leaves: the builder paragraph true to the persona.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Before the change, at HEAD: the builder and the warlord on `--age stone --civilization workflow/decks/stone.json`, 20 seeds each, into the scratchpad as the baselines. After the change: the same two cells, each pair joined seed by seed through the sim skill's two-file query; the hand-back lists the endings that moved with their seeds, per persona, expected none or few, a challenge discarded where a hazard was not.
- `npm run sim -- --personas` printing the two sentences at the builder's 20 and 21 and the warlord's 25 and 26.
- `node tools/sim.ts --age stone --persona builder --civilization workflow/decks/stone.json --trace 29`, the second sentence named behind the plays of the card aimed at the hand; the same with `--without 21`, the trace naming neither sentence and the chronicle still ending.
- No proof spec: the line lands in `tools/` and `docs/`, nothing on screen. CI proves the Playwright suite on the push as always.
