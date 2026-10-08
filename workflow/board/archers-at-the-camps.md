# Archers at the camps

**Line:** **Archers at the camps** — the Stone camp names the kinds it enters by weight, the warrior and the archer, and its own roll odds, both in its own content; every entry out of a camp or a door draws each enemy's kind seeded by those weights, a one-kind camp drawing nothing, and finds its tile on the kind's own walk, the opening drawing among the kinds standing on the camp; a raid draws its kinds before its door and reads the door on its first enemy; the catalogue refuses a camp lying on a terrain none of its kinds stands on; the reinforcement leaves the rules with the siege's second script; each mechanism held by a test on the fixture, the archer standing in the Stone catalogue with the coherence test passing and the age page saying so. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:** `docs/CHRONICLE.md` _Enemies and camps_ and `docs/ages/STONE.md` _The camps_. The rules the line rests on stand there already: "one enemy of the camp's standing on each" at the opening, "which script it carries is named by what enters it", and the age page's "it enters warriors and archers: the opening, the camp's roll and a raid each draw which". The edits:

- `docs/CHRONICLE.md`, the paragraph **An event's enemies enter together**: "a tile of the disc's outer ring that the raid's unit stands on" becomes "a tile of the disc's outer ring that the raid's first enemy stands on"; "The first enemy enters on the door's tile where it is free, and each one after on the nearest free tile the door's own ground runs to, or, through a coast door, its own water, ring by ring around the door" becomes "The first enemy enters on the door's tile where it is free and it stands on it, and each one after on the nearest free tile it stands on that the door's own ground runs to for it, or, through a coast door, its own water, ring by ring around the door"; and "a door with no free tile around it is never drawn" becomes "a door with no free tile around it for the raid's first enemy is never drawn".
- `docs/CHRONICLE.md`, a new paragraph after **A camp enters on its own too**: "**What a camp enters is content**: the kinds of unit it enters, each with a weight, and every entry out of it — the opening, the camp's roll, a raid, an answer — draws each enemy's kind seeded among them by their weights, one draw for each enemy, so a raid of several comes as a mix; a camp naming one kind draws nothing. Where the enemy lands is read on the kind drawn: a tile it stands on, reached on its own move ashore and the camp's embarked move on the water. A raid draws its enemies' kinds before its door, and its door is read on its first enemy. The opening draws among the kinds that stand on the camp's tile, so every camp opens held; a camp lying on a terrain none of its kinds stands on is a defect of the content, refused before any chronicle is dealt. A raid of one kind, drawn once for the whole raid, was rejected: it deals a band of archers alone."
- `docs/CHRONICLE.md`, the paragraph **A camp enters on its own too**: "whether an enemy enters, on the camp's tile where it is free" becomes "whether an enemy enters, its kind drawn as any entry's, on the camp's tile where it is free and the kind stands on it".
- `docs/ages/STONE.md` _The camps_: "it enters warriors and archers: the opening, the camp's roll and a raid each draw which." becomes "it enters warriors and archers: the opening, the camp's roll and a raid each draw which, by the weights the camp names, the warrior the likelier."
- No player-facing text. The answer cards of _Keep to yourself_, _Fight them_ and _Make room_ keep "warriors" and the warrior's glyph: the Nomadic Age is the tutorial and reads better with the glyph, and the Stone Age's schedule rung rewrites the Stone events with sentences of their own, which say "enemies". A per-age sentence was offered and declined as throwaway.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Scope:**

In:

- The Stone camp's content: the kinds it enters by weight, warrior 2 and archer 1 to start, and its roll odds, named in the Stone content at the Nomadic value rather than spread from the Nomadic camp; both are tuning for the balance pass. The Nomadic camp names the warrior alone, at weight one.
- The camp names what it enters and nothing about how it walks: the camp's unit, as the one kind the rules walked as, goes. The embarked move stays the camp's: the raft is the band's, whatever rides it.
- One draw per entering enemy, seeded from the chronicle's generator, by the weights; a camp naming one kind draws nothing, so every Nomadic seed plays as before. The opening draws among the kinds that stand on the camp's tile and enters on it; the camp's roll, a raid and an answer draw among all the kinds.
- Where an enemy lands is read on the kind drawn: the door's own tile where it is free and the kind stands on it, else the nearest free tile around the door that the kind stands on and the door's own medium runs to for it — the ground from a land door, the water from a coast door, on the camp's embarked move. The door's medium is the previous line's decision and stands; a kind standing on neither of a door's media enters nowhere there, as an enemy no free tile is left for does.
- A raid draws its enemies' kinds first, then its door among the doors with a free tile around them for its first enemy, the outer ring read on that enemy's walk to the city; the rest enter around the door each on its own walk, and one no free tile is left for enters nowhere, as today. The first enemy decides the door; the odds between camp and ring are untouched.
- The catalogue refuses a camp naming no kind, a kind it does not hold, a weight at or below nought, or a terrain its building lies on that none of its kinds stands on; it keeps refusing a script it does not hold and the odds out of range.
- The reinforcement helper leaves the rules, and the fixture siege's second script with it: the siege keeps its landing, placing its camps with one raider on each, and its passing. The capstone's second-script hook stays in the rules and the chronicle page, carried by no content and tested by nothing until a line of its own decides its fate.
- The mechanism's tests on the fixture: a fixture camp of two kinds enters each by the weights, seeded; a one-kind camp consumes no draw; the opening on a camp whose terrain only one kind stands on enters that kind; the catalogue's four new refusals; a raid's door read on its first enemy.
- The content's checkable state: the Stone camp's kinds in the catalogue, the coherence test passing, the age page's sentence.

Out:

- The pillager, the camps that prepare, the console entry: their own lines.
- The second-script hook's removal from the rules and `docs/CHRONICLE.md` _The capstone_, and the siege fixture's removal: a `/todo` on the user's order, raised at this intake.
- A per-age sentence on the raid answers: declined.
- A raid of one kind: rejected, recorded in the spec.
- The enemy archer's play needs no script change: the raider's and the guard's scripts already read range and own sight, so an archer stops two tiles off a target and shoots, a guard archer engages two tiles beyond its radius, and an archer attacks the player's embarked units as the longer-range rule says. These are consequences, not work.

The reconcile:

- The weighted draw goes through the generator's one weighted draw, the one the schedule's deal and the biomes roll through, as it is; the kinds by weight take the shape a biome's terrains by weight take.
- A draw of one draws nothing, as the entry around a door already skips the generator when one tile is nearest: the same rule, as it is.
- The entry's walk as the camp's unit and a standing enemy's walk on its own stats and the camp's embarked move become one walk for a unit that is or is not yet entered, the kind its one parameter.
- The opening's entry on a camp's tile and the siege landing's become one place, the one that draws among the kinds standing on the camp; the reinforcement, the third, goes.
- The raid's door draw and the ring read on the camp's unit become reads on the raid's first enemy, the roominess cache keyed on the kind with the medium.

**Traps:**

- The camp's unit is read in five places: the catalogue's coherence checks on the camp, the camp's unit entering and the camp walker in the enemies module, the reinforcement in the schedule module, the opening in the chronicle module, and the fixture siege's landing. The Stone content spreads the Nomadic camp whole and overrides two fields; after this line it names its kinds and its odds itself.
- The fixture camp names its unit by one key, and the catalogue tests lay fields over it: the test on a kind the catalogue does not hold and the test on a unit that cannot stand on a camp's terrain both read the camp's unit and are rewritten for kinds. The fixture's encampment answer enters around a camp through the shared entry; the fixture's raid script and sentry are named by the camp's scripts, unchanged.
- The entry around a door draws from the generator only among tiles equally near; the kind draw is a second draw ahead of it, per enemy, and a one-kind camp must consume none: the Nomadic seeds and every Nomadic e2e spec on a fixed seed depend on it. The Stone seeds shift at the opening, one draw per camp, and at every entry; Stone specs that read the enemy phase's seeded outcome may need their expectations read again.
- The raid's door is drawn before anything enters, and the roominess cache walks each door once per medium; with the kind in the walk the cache is keyed on it too. The raid helper in the schedule module hands the count to the entry; the kinds are drawn before the door, so the raid's draw order is kinds, then side, then door, then tiles.
- The one way a unit enters stands every unit ashore with its kind's move and takes an embarked move for a coast door; the entry hands it the kind drawn.
- The siege's landing enters a raider on each placed camp through the camp's unit; it goes through the opening's place with the raider script. Four tests in the schedule tests read the siege's reinforcement — the enemies entered turn by turn on the moated city, the reinforcement as a stage of its own ahead of the deal, the siege's own camps reinforced, and no reinforcement on a camp a unit stands on — and go with it; the tests on the victory on the tick and on the ended chronicle read only the turn count and stay.
- The guard script reads the camp within its radius and the raider the city; neither reads the enemy's kind. The Stone archer's stats stand in the Stone content: health 3, damage 2, range 2, move two points, sight 2; the warrior's are the Nomadic content's.
- The unit marks and names on the screen are keyed on the kind and tinted by faction: an enemy archer draws without UI work.
- `runtime-error` is a closed stage set; a count below one at the entry stays one.

**Plan:**

1. The camp's kinds by weight in the catalogue type, the Nomadic and Stone content, the fixture camp, and the coherence checks with their tests; the camp's unit gone from the type. Leaves: a catalogue naming kinds, every reader of the camp's unit still to move.
2. The entry drawing the kind, per enemy, and walking as it: the camp's unit entering, the walker, the entry around a door and the roominess read on a kind; the raid drawing its kinds before its door, the door read on the first; the opening drawing among the kinds standing on the camp and the siege's landing through the same place; the reinforcement and the siege's second script removed with their tests. Leaves: every entry drawing, the rules tests green.
3. The mechanism's tests on the fixture, as the scope lists them.
4. The docs edits as the spec writes them.
5. Verify.

**Verify:** `npm run fmt`, `npm run check`, `npm test`, `npm run lint`. No proof spec: the line lands in the rules and the content, and the fixture tests hold it. CI proves on the push: `e2e/camps.spec.ts`, `e2e/attack.spec.ts`, `e2e/archer.spec.ts`, `e2e/archipelago.spec.ts`, `e2e/embark.spec.ts`, `e2e/fall.spec.ts`, `e2e/deal.spec.ts`.
