# The region's schedule

**Line:** The region's schedule — a region names its schedule and the age none, the schedule naming its capstones as a pool the opening draws one from at equal odds, one step of the timeline's generator, proven by one test on a fixture pool of two; every region on the schedule its age played, each pool of one, so nothing the player meets changes.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _Events and the capstone_, _The schedule_ and _The capstone_, and [`docs/MAP.md`](../../docs/MAP.md) _The region_, which already say the schedule is the region's and the capstone drawn among it. Three sentences change:

- `docs/CHRONICLE.md` _The schedule_, the second sentence: "The schedule is rolled into the chronicle's **timeline** by a generator of the timeline's own that the opening seeds: the capstone, drawn among the schedule's, each alike, its turn, and the turn the next deal is due on, rolled from the spacing by the landing before it."
- `docs/MAP.md` _The region_, the first sentence's end: "… and the biome its rivers rise in and the river layer's numbers, and the schedule it deals, as [`CHRONICLE.md`](CHRONICLE.md) says; the launch names one, and the generator deals the map it describes."
- `docs/GLOSSARY.md`, the **region** row's meaning: "The launch choice that deals the map and the schedule; the difficulty dial."

No player-facing sentence: nothing on any screen changes.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/MAP.md`, `docs/GLOSSARY.md`.

**Scope:**

In:

- The schedule moves off the age onto each region the age holds. A schedule names its spacing, its window, and its capstones as a list; the age names no schedule.
- The capstone is drawn among the schedule's list at the opening, each alike, with one step of the timeline's generator, before the turn is drawn from the window and the first due turn from the spacing. The step is taken for a pool of one too: every seed's capstone turn and due turns reroll once, within the same windows, and nothing else moves.
- The chronicle names its region as it names its age, set at the opening; the events phase and the capstone's second script read the schedule through it. The save writes and reads it with the chronicle: the implementer decides whether the save's own naming of the region beside the chronicle stays, since `docs/META.md` _The save_ holds either way. A save whose chronicle's capstone is not among its region's schedule's is refused as one naming an id the content does not hold.
- The catalogue's checks of the schedule move to the region: every region's schedule deals at least one event, each dealing two answers or more and held by the catalogue; its list names at least one capstone, each held by the catalogue, none twice; its spans run from one at least and to no less than their least.
- The content: the Nomadic Age's temperate region carries the schedule the age carries today; the Stone Age's temperate and archipelago regions share the Stone stand-in schedule as it stands today, one object. Every list holds one capstone.
- The fixture: each fixture age's regions carry that age's schedule, so the ages a test launches in keep dealing what they deal; one fixture region or age names a list of two capstones for the one test; the helpers that build or lay over ages and schedules follow.
- The one test, on the fixture: over seeds, a schedule naming two capstones draws each of them, and the one drawn is the one that lands on its turn. The existing refusal tests of the schedule move with it, and the list's refusals join them.
- The content coherence test walks every region's schedule and every capstone of its list, where it walks the age's today. The two specs that read the capstone off the age read it off the chronicle's timeline.

Out: what any schedule deals, the transition, the capstones' content, the launch screen, and the care of saves written before this line, which the design drops at the boot and which need none before the Bronze Age.

Corner cases decided here: two regions of one age sharing one schedule share one object, and the catalogue checks each region's all the same; a technology unlocking a region by its name in every age is untouched.

Reconcile: nothing player-facing does this job already. The uniform draw of one among a list is written inline in seven places of the tree with no helper, and the weighted pick at equal weights is a second way; which the list's draw takes is the implementer's.

**Traps:**

- The chronicle's generator and the timeline's are two: the opening starts the chronicle's from the seed's shuffle and hands the timeline the generator the map left. The added step moves the timeline's rolls alone, never the map, the camps' rolls or a raid's draw.
- A draw always steps: the due turn's event draw steps the generator even where no need is met, so the turns a seed deals on never follow the play. The list's draw follows the same rule for a list of one.
- `src/rules/map-kinds.ts` reads the catalogue through narrow shapes to keep the lint's import cycle away, and its region shape is what the map is dealt from. A schedule's entries are plain closures of the turn and ids, so it references no catalogue type; where the schedule's type lives is the implementer's, and a region record wider than the map's shape is accepted by it structurally.
- The fixture names one age per event, the event's id as the age's, beside the first, the quiet and the wary ages; `dealing` sets a chronicle's age to the event's and its timeline due on the turn, and a chronicle naming its region needs it there too. `camping` and `regionsUnlocked` rebuild the ages, `rescheduled` in the catalogue's tests lays a schedule over the first age's.
- `e2e/boot.spec.ts` and `e2e/capstone.spec.ts` read the capstone's id through the age; the chronicle they build headlessly carries the drawn one in its timeline. `e2e/chronicle-screen.ts` reads the capstone's card by the card's name, which stands.
- The save reader validates the timeline's capstone against the catalogue's capstones today; the region id is read beside the chronicle against the age's regions.
- The glossary lint flags a bolded phrase that is no row: "pool" and "list" are not terms and are never bolded.
- Comments are for traps only; a docblock paraphrasing the code is cut.

**Plan:**

1. The rules' shape: the schedule on the region, its capstones a list with the window beside it, the age without one; the catalogue's checks of the schedule in the region loop, with the list's refusals; the fixture's ages carrying their schedule on their regions, one naming two capstones. The typecheck is red until step 3.
2. The chronicle naming its region: set at the opening, written and read by the save, and the events phase and the capstone's second script reading the region's schedule through it.
3. The timeline rolled from the region: the capstone drawn among the list with one step, then its turn, then the first due turn. The one test on the two-capstone fixture; the schedule's refusal tests moved and the list's added. The typecheck and the rules tests green.
4. The content: the Nomadic region on the Nomadic schedule, the Stone regions sharing the Stone stand-in; the content coherence test over every region's schedule and every capstone of each list; the two specs reading the capstone off the chronicle.
5. The three docs sentences.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `e2e/boot.spec.ts`, the chronicle opening on the capstone the timeline drew. CI's on the push: `capstone`, `continue`, `resume`, `controls`, `refused-save`, `campaign`, `victory`, `settle`, `menu`, `calendar`, `deal`, `landing`, `reference`.
