# Bow and arrow

**Line:** **Bow and arrow** — the technology Bow and arrow, its achievement, the unit Archer and its card stand in the Stone Age's content after Domestication's, a unit of the player's attacks only a unit on a tile in sight and a goal counts the enemies a kind of unit kills, each proven by one test on the fixture, `e2e/archer.spec.ts` passes, the catalogue's coherence test passes and `docs/CHRONICLE.md` and `docs/ages/STONE.md` say so. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md), _Sight_; [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_, _The units_ and _The cards_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The sentences, verbatim, drafted at intake and accepted by the user:

- `docs/CHRONICLE.md`, _Sight_, the paragraph opening "Melee needs no rule of its own", replaced whole by: "**A unit of the player's attacks only a unit standing on a tile in sight**, whatever sees the tile: range says how far an attack goes, sight whether it has a target, and a unit the fog shows is none. An adjacent tile is always in sight, so melee never meets the rule. The enemies read the whole map: their scripts ignore sight, and no tile is uncharted to them."
- `docs/ages/STONE.md`, the opening quote: "its land, its technologies and its cards" becomes "its land, its technologies, its units and its cards".
- `docs/ages/STONE.md`, _The technologies_, a bullet after Domestication's: "**Bow and arrow** needs Trapping. Its goal counts a deed: the enemies killed by a Scout's attack. It unlocks the card **Archer** and pays influence."
- `docs/ages/STONE.md`, a new section `## The units 🔧` ahead of _The cards_, holding one bullet: "**The archer** attacks over a range the warrior does not have and holds less health: it is the unit that attacks from behind another."
- `docs/ages/STONE.md`, _The cards_, a bullet after Pasture's: "**Archer**, costing military: one population leaves the tiles to become a unit."

The player-facing entries, verbatim:

- `unit.archer`: `Archer`
- `card.archer`: `Archer`
- `rules.archer`: `Place a [player:archer]`
- `technology.bow-and-arrow`: `Bow and arrow`
- `goal.bow-and-arrow`: `Kill {need} enemies with a [player:scout]`

The content's numbers, provisional: the unit Archer has 3 health, 2 damage, 2 range, a move of 2, 1 action and a sight of 2, and is no worker; the card Archer is a unit card costing 2 military, entering its unit as the Warrior's card does; the technology needs Trapping and unlocks one copy of Archer; the achievement needs 3 and pays 1 influence.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Scope:**

- In: the sight rule on the player's attack with its test on the fixture; the counter of the enemies a kind of unit kills with its test on the fixture; the unit, its card, the technology and its achievement; the five text entries; the unit's mark; the pages' sentences; `e2e/archer.spec.ts`.
- Out: how an enemy's attack over a range reads sight. No enemy has a range above one, the enemies' sentence on the page stands as it is, and the question stands on the board's rung _New enemies_. What an enemy script attacks is not touched.
- Out: the attack's motion. The attacker lunges halfway to its target, so an Archer attacking over two tiles lunges onto the tile between, whoever stands there. The user keeps it to feel it in play: not to be fixed, and not a finding of the visual check.
- The sight rule: a target stands on a tile in sight, whatever sees it — the city, the border, any unit of the player's, the attacker or not. A tile in fog is not in sight: an enemy seen earlier in the turn and drawn in fog since is no target, though it stands where it is drawn. The user's choice over the attacker's own line of sight.
- The goal counts an enemy killed by the attack of a Scout of the player's, the kind read on the attacker when the attack begins. An enemy killed any other way counts nothing, whoever hurt it before: by another kind's attack, by a terraform, by an answer's damage. A unit of the player's killed counts nothing.
- A chronicle in progress needs no care: no save is owed anything before the Bronze Age.
- Reconcile, what a unit may attack: the player's reads range and sight, the enemies' reads range alone. They stay apart for now, the user's choice.
- Reconcile, a move and an attack: a move takes a charted tile, fog included, an attack a tile in sight alone. They stay apart, the difference being the rule.
- Reconcile, the counter: the three standing counters count plays of a card; this one counts attacks that kill, by the kind of unit that made them, and nothing in the tree counts a kill today. It stays apart, a counter of its own taking the unit kind.
- Reconcile, the card: Archer goes through the door the Warrior's and the Scout's cards go through, as it is.
- Reconcile, the proof: `e2e/attack.spec.ts` proves an adjacent attack by drag and stays as it is; the Archer gets a spec of its own, being the first content the sight rule reaches.
- Priced against what does the job: the Warrior's price and damage, two health fewer, one range more.

**Traps:**

- The map's glow and the attack command read one answer of the rules, what a unit of the player's can do by hand: the rule lands there, so the glow and the refusal are one fact and nothing in `src/ui/` changes for it. `leastHealth` (`src/rules/units.ts`), what the enemy scripts and the fixture's scripts read, keeps reading range alone.
- `src/rules/units.test.ts` already plays an attack over a range of two on the fixture, "an attack reaches its range and no further, and lands on a unit of another faction alone": it keeps holding, its target in sight, and no assertion of it is loosened.
- The `attack` group names two tiles and no unit, and the enemy phase raises the same group once units have moved and been killed: the attacker and the target are read on the chronicle as it stood when that attack began, never on the chronicle the command began on, and the faction of both is read. A `killed` outside an `attack` group, a terraform's or an answer's, counts nothing.
- A unit kind the catalogue does not hold is refused where the counter meets it, as the standing counters refuse a card.
- The tree stands a column in the content's order, so the technology and the achievement are declared right after Domestication's, and a later line's Burial rites goes above them.
- A plate reads four lines under its name at most; the goal entry is one line at the plate's width, so nothing in the tree's layout moves.
- The unit's mark is a code-drawn placeholder under `DOGMAS.md` _Design principles_: a flat polygon, the fewest vertices that tell it apart from the block, the point and the arrowhead beside it. It follows their precedent and is no fork. The comment over the unit marks lists each mark; it is re-shaved to its trap or cut when the table gains an entry, never extended into a longer list.
- The spec is built as `DOGMAS.md` _Testing_ says and under [`docs/PHASER.md`](../../docs/PHASER.md), _Under a Playwright spec_: the chronicle made headlessly, the Archer and each enemy entered through the rules' own door as `e2e/attack.spec.ts` enters its two, the unseen ground made and not searched — a tile between the Archer and an enemy two tiles off in a straight line terraformed into hills through `terraformed`, which stops every line from the ground a unit stands on — and the built chronicle asked through `inSight` that nothing else sees that tile. Each test is built for the one thing it asks; every oracle is read from the rules.
- The collection screen gains a card; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.

**Plan:**

1. `src/rules/` and its tests: a unit of the player's attacks only a unit on a tile in sight; one test on the fixture proves a unit in range and out of sight is no target and the attack on it refused, and a unit in range and in sight is attacked. Nothing in the game's content reaches it yet. This is the first mechanism's own inert commit.
2. `src/rules/chronicle.ts`, `src/rules/chronicle.test.ts`, `src/rules/fixtures.ts`: the counter of the enemies a kind of unit kills stands, read by an achievement of the fixture; one test on the fixture proves it counts that kind's kills and no other's. This is the second mechanism's own inert commit.
3. `src/content/stone.ts`: the unit, the card, the technology and the achievement stand, the last two after Domestication's.
4. `src/ui/text.ts`, `src/ui/marks.ts`: the five entries and the mark stand, so the coherence test passes.
5. `e2e/archer.spec.ts`, with what it needs of `e2e/chronicle-screen.ts`: an Archer attacks an enemy two tiles away on a tile in sight, by the drag the Warrior's spec uses; an enemy in range on a tile out of sight is not drawn and not glowed, and the drag onto its tile changes nothing.
6. `docs/CHRONICLE.md`, `docs/ages/STONE.md`: the sentences. The board line and this file are deleted.

Steps 3 to 6 are the content's commit.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/archer.spec.ts`. CI proves on the push: `e2e/attack.spec.ts`, `e2e/camps.spec.ts`, `e2e/map.spec.ts`, `e2e/press.spec.ts`, `e2e/fog.spec.ts`, `e2e/tree.spec.ts`, `e2e/pin.spec.ts`, `e2e/ending.spec.ts`, `e2e/launch.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`. The visual check looks at the Archer's mark on the map beside the other units', and at the tree's second column.
