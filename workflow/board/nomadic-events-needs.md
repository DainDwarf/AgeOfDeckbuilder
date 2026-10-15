# The Nomadic events' needs

**Line:** A rival band, Wildfire and The herd dealt on every map, as the chronicle page now asks of every event, and the need mechanism going with them; Wildfire reworked to the shape of the Stone Age's events — done when no event of the catalogue names a need, a due turn always deals, the three events' content stands on the ages' pages as below, the coherence test passes and `e2e/wildfire.spec.ts` proves the Stone Wildfire's deal.

**Spec:** `docs/CHRONICLE.md` _The schedule_ (an event is dealt on every map and names no need; an answer may name what refuses it; every event carries an answer that costs no stock and is refused by nothing) and _Cards_ (the challenge kind); `docs/ages/NOMADIC.md` _The events_; `docs/ages/STONE.md` _The events_. The sentences to land:

`docs/ages/NOMADIC.md` _The events_, the section rewritten to this:

> Four events, each with its lore, each a problem the chronicle deals with two answers, one of them open to a city with nothing. The escalation is the event's, whichever answer is chosen: a later Lean season adds a Hunger that takes more, a later rival band is larger either way, and a later Wildfire takes more and costs more to cut off.
>
> - **Lean season.** _(the bullet as it stands, unchanged)_
> - **A rival band.** _Fight them_: their warriors enter the map as one raid and come. _Make room_: a new camp is placed near the player's city with its guards on and around it, one at first — a door for the raids to come, and a capture with its rewards for a band bold enough; it is refused while no tile near the player's city takes a camp. Both answers cost no stock: raiders at the player's city now against a camp beside it for good.
> - **Wildfire.** _Let the fields burn_: the hunt fails in the smoke, and the player's city loses food, more on a later turn. _Cut a firebreak_: production paid, more on a later turn, and the forest stands. Wildfire is food against production.
> - **The herd**, rare and fortunate. _Hunt it_: food now. _Follow it_: deer are dealt onto a forest tile or cattle onto a plain tile carrying no feature, drawn seeded among the nearest such tiles to the player's city, and the band knows where the herd went: the tile is charted where it was not, in fog unless something sees it. Both are gains; a fortunate event is a breath, not a decision.
>
> Lean season is food against a raid, a rival band is a raid now against a camp later, and Wildfire is food against production.

`docs/ages/STONE.md` _The events_, the first paragraph's second sentence becomes: "It deals A rival band and The herd as the band knew them, Wildfire with a third answer of the age's own, and Departure, this age's for good, culture being its answer's price; Lean season is the band's alone." And a bullet, placed first in the list:

> - **Wildfire.** The band's event, dealt with a third answer between its two. _Burn the forest_: the challenge **Embers** is added to the discard pile; played by nothing, at the end of every turn it stays in the hand it burns one forest tile into plain, drawn seeded among the nearest to the player's city, the feature and what stands on the forest going with it and the population working the tile staying on it, nothing once none stands; it gains influence on victory. Wildfire is food now against the forest over time for influence against production now.

`DOGMAS.md` _Architecture_, the `runtime-error` sentence: "a helper called where the content should never have called it, a due turn that draws no event — answered in place of" becomes "a helper called where the content should never have called it — answered in place of".

Player-facing entries, every one written out; the keys are the implementer's, the words are not:

| Entry | Text |
| --- | --- |
| The camp refusal | `No tile near your city takes a camp` |
| Answer, Nomadic and Stone | `Let the fields burn` — rules `Lose {food}[food]` |
| Answer, Nomadic and Stone | `Cut a firebreak` — rules `Pay {production}[production]` (unchanged) |
| Answer, Stone alone | `Burn the forest` — rules `Add [card:embers] to the discard pile. Each turn it stays in your hand, it burns one [terrain:forest] near your city into [terrain:plain]` |
| Card | `Embers` — rules `Burns one [terrain:forest] near your city into [terrain:plain]` |
| Event name, Stone | `Wildfire`, the Nomadic name again under the Stone event's id |
| Event lore, Stone | the Nomadic Wildfire's lore again under the Stone event's id |
| Answer, The herd | `Follow it` — rules `One [terrain:forest] gains [feature:deer] or one [terrain:plain] gains [feature:cattle]` |

Of these, "Let the fields burn" is the user's; "Burn the forest", the Embers texts, the camp refusal and the Follow it text are the intake's, picked by nobody yet: the hand-back quotes them under _Authored_.

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`, `DOGMAS.md` (the one example). `docs/CHRONICLE.md` already states the rule and changes nowhere.

**Scope:**

In:

- The need mechanism removed: an event declares no need; on a due turn the draw is seeded and weighted among every entry of the schedule, and the `runtime-error` for a due turn drawing no event goes with it. The fixture's event that needed a card among the chronicle's (the spoilage) and the two tests on needs go with the mechanism; the fixture age that dealt it keeps dealing what it still holds.
- **A rival band.** _Make room_ is blocked, as Predators' _Abandon a herd_ is, while no tile near the player's city takes a camp, with the refusal above; the deal shows it refused on the second press, as every blocked answer is. Its landing places the camp and enters its guards and nothing else: the camp-or-raid fallback is unreachable behind the block and is not kept; the grievance's _Escalate_ keeps that fallback, its other answers differing in kind. The place and the count are as today, as is _Fight them_. Measured at the settle over 200 seeds: no tile for a first camp on 0 temperate maps of either age and 7 archipelago ones; for a second camp, 0 and 57.
- **The herd.** _Follow it_ is refused by nothing. It deals deer onto a forest tile or cattle onto a plain tile, the tile drawn in one step of the chronicle's generator evenly among the tiles carrying no feature of either terrain nearest to the player's city — the nearest ring holding one, the reach widening a ring at a time until one stands — and the feature is the terrain's; the tile is charted as today. A map with no bare plain or forest tile at all is a `runtime-error` on the landing, the one the design stays silent on. _Hunt it_ unchanged.
- **Wildfire, the Nomadic event.** Two answers. _Let the fields burn_: free, refused by nothing; the player's city loses 2n food through the harm helper that takes a stock, so past the stock it pays in people as every harm does. _Cut a firebreak_: costs 2n production, and lands nothing. n is 1 on turns 0–4 and one more every five turns, as the drought's bite counts. The fire's start, its ring, the population killed and the units damaged are no longer promised: the fire helper, its reading and the tests on the ring go. Both answers read the amount on the card as the chronicle stands.
- **Wildfire, the Stone event.** An event of the Stone Age's own, built from the Nomadic event's two answers with _Burn the forest_ between them: it adds **Embers** to the discard pile, a challenge gaining the influence the age's other challenges gain. Embers' strike: the one forest tile nearest to the player's city, drawn seeded among those equally near through the herd's widening draw, is terraformed into plain through the terraform helper, so the feature and the improvements standing on the forest go as a terraform takes them and the population working it stays; while no forest stands on the map the strike moves nothing and raises nothing, as the Rain dance dries nothing once none stands. Both Stone schedules deal the Stone event in place of the Nomadic one, at the weight the Nomadic one had, each schedule written in full.
- Doc-impact as above; the board line deleted.

Out:

- No escalation on Embers: one forest a strike, always.
- No change to Lean season, to the camp's content, to the Stone events, to the grievance's fallback.
- The fixture's camp placing helper and the content's shared one are the implementer's cut: where one helper places a camp and enters its guards for both the fixture's encampment and _Make room_, and the grievance's fallback wraps it, that is the implementer's to decide and the report says what it did.

Corner cases decided:

- On a map burned bare, _Burn the forest_ bites nothing and is the plain choice beside the firebreak: accepted, the Rain dance's precedent once nothing stands to dry.
- The Nomadic Wildfire is dealt in the Nomadic Age alone and the Stone one in the Stone Age's regions alone; the two never meet on one schedule.
- A Stone chronicle's Embers on a map with no forest in the Nomadic texts' sense: the strike moves nothing, and the card keeps cycling to the ending for its influence.

Reconcile: the fire's start and the herd's tile each drew a tile within a fixed reach of the city, two helpers; they become one widening draw near the city, taking the tile predicate as its parameter, and Embers' strike goes through it. The Stone Wildfire beside the Nomadic one follows the sites' shape, a Stone piece built from the Nomadic one with what the age adds. Embers' strike and the Rain dance's both terraform one drawn tile through the terraform helper; they stay apart only in their draw, inside the border against nearest to the city, which is the difference meant.

**Traps:**

- `Block` in `src/rules/state.ts` is a closed union the screen reads a refusal text for by member: a new member needs its `refusal.<member>` entry in `src/ui/text.ts`, and the coherence test in `src/content/catalogue.test.ts` reads every answer's refusal on a launched chronicle.
- An answer's rules entry reads the numbers `reads` answers, and the text's `{food}` and `{production}` are those keys; `answerCost` pays what `cost` names, which for the firebreak reads the chronicle.
- The event's id keys its name in `src/ui/text.ts` and its lore in `src/ui/lore.ts`; the catalogue test reads both for every event of every schedule. Answer texts key on the answer id, so the Stone event's two shared answers share the Nomadic entries under the same ids.
- The coherence test lands every answer of every schedule on a chronicle launched and settled in the age: _Follow it_ and Embers' strike must not throw there; the no-bare-tile `runtime-error` is reached on the fixture alone.
- `unitDamaged` stays in `src/rules/schedule.ts` (the fixture's ambush uses it) even as the fire helper goes.
- Schedules are never factorized: each Stone schedule is its own constant written in full; a weight is a plain number and no page states one.
- `campedOrRaided` in `src/content/scripts.ts` stays for the grievance; the catalogue refuses no unused helper, so a dead export is found by Biome's lint.
- The deal window shows a refused answer's reason on the second press (`e2e/predators.spec.ts` is the pattern); the Stone event's spec builds its campaign through `wonCampaign()` and its chronicle through `firstDealtAlone`, as the other Stone event specs do, and rests before it presses (`docs/PHASER.md`).
- A stock a harm takes past nothing is paid in people inside the harm helper (`shocked`), the player's city alone; nothing else enforces it.
- The need removal also stales the schedule test fixture age `WARY` (it dealt the spoilage): keep it with what it still deals, or cut it where nothing else uses it — the tests at `src/rules/schedule.test.ts` around lines 338–382 and 457 say which.

**Plan:**

1. The mechanism, one inert commit: the event type loses its need (`src/rules/catalogue.ts`); the due-turn draw is among every entry and the no-event error goes (`src/rules/schedule.ts`); the fire helper and the fixed-reach feature draw are replaced by one widening draw near the city, the feature deal and a one-tile terraform going through it; the `Block` member and its refusal text; the fixture's rivals, wildfire and herd reshaped to the new shapes and the spoilage removed (`src/rules/fixtures.ts`); the schedule tests rewritten — the needs tests and the ring tests gone, one test each on the fixture for the blocked camp answer, the widening draw (nearest first, seeded among equals, charted, the no-tile error) and the one-tile strike; the coherence test's need line dropped. Leaves standing: every test green, every real event unchanged in play.
2. The content, one commit with its docs: the three Nomadic events (`src/content/nomadic.ts`), the Stone event, the Embers card and the two schedules (`src/content/stone.ts`), the texts and the lore (`src/ui/text.ts`, `src/ui/lore.ts`), `e2e/wildfire.spec.ts`, the three pages above, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `e2e/wildfire.spec.ts`, on a won campaign in the Stone Age: the Wildfire dealt alone offers its three answers; _Let the fields burn_ reads the rules' food and taking it leaves the stock the rules leave; _Burn the forest_ adds Embers to the discard pile. CI proves on the push: `deal`, `bad-air`, `drought`, `flood`, `grievance`, `predators`, `strangers`, `travellers`, `camps`, `capstone`, `landing`, `resume`, `reference`, `console`, and the rest of the suite.
