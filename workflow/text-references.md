# Text references

Every noun the reading of the player-facing text marks as needing a lookup: a name on a card, an answer, a tooltip that the player should be able to rest the pointer on. Gathered surface by surface during the **Player-facing text polish** intake; handed to the **Card references** and **References beyond cards** lines, which make them resolve. A row is a noun, what kind of thing it is, and where the reading met it. The lint's first draft of the whole table is on the contact sheet; this file holds only what the user marked.

| Noun | Kind | Resolves to | Marked on |
| --- | --- | --- | --- |
| city | building | `building.city` | Settlement (`rules.settle`) |
| worker | unit | `unit.worker` | Worker of the settle section (`rules.first-worker`), Worker (`rules.worker`) |
| scout | unit | `unit.scout` | Scout of the settle section (`rules.first-scout`), Scout (`rules.scout`) |
| warrior | unit | `unit.warrior` | Warrior (`rules.warrior`) |
| trapping | improvement | `improvement.trapping` | Trapping (`rules.trapping`) |
| forest | terrain | `terrain.forest` | Trapping (`rules.trapping`) |
| population | concept | no entry of its own; `label.idle` reads "Idle" | Capture (`rules.band-joins`) |
| shelter | card and building | `card.shelter`, `building.shelter` | The first shelter (`capstone-rules.first-shelter`) |
| yield | concept | no entry; `panel.no-yield` only | Gather (`rules.gather`) |
| population | concept | as above | Let them go (`answer-rules.let-them-go`), Let it burn |
| forest | terrain | `terrain.forest` | Follow it (`answer-rules.follow-it`), Let it burn |
| wildlife (the feature, renamed from game by the polish) | feature | `feature.wildlife` | Follow it (`answer-rules.follow-it`) |
| Hunger | card | `card.hunger` | Share food (`answer-rules.share`) |
| warrior | unit | `unit.warrior`; a reference is never pluralised, "3 [Warrior]" | Keep to yourself, Fight them, Make room |
| city | building | `building.city` | Keep to yourself, Fight them, Make room |
| plain | terrain | `terrain.plain` | Let it burn (`answer-rules.let-it-burn`) |
| unit | concept | no entry; `kind.unit` is the card kind | Let it burn (`answer-rules.let-it-burn`) |
| capstone | concept | no entry; `kind.capstone` is the card kind | the capstone window's title (`capstone.title`) |

The tooltips, the info panel rows and the refusals marked no noun: a tooltip or a panel row is where a lookup lands, not where one starts. Two of the names a lookup lands on were renamed by the polish: the feature game is wildlife, the Nomadic terrain deep is ocean.

## What each entry marks

**The only references marked in `src/ui/text.ts` are cards, as `[card:<id>]`**; every other bracket in the file is a resource glyph — `Pay {production} [production]`, `Gain {food} [food]`, `4[food] 4[production]`. `src/ui/text-run.ts` parses both marks in a `rules.`, `answer-rules.` or `capstone-rules.` entry, the card's name drawn in brackets and its extent answered, and throws on a `[word]` that names no resource. The entries below are the whole list of what still wants a mark, entry by entry, as each reads today.

| Entry | Reads today | Marks | Line |
| --- | --- | --- | --- |
| `rules.settle` | Place the city | city | beyond cards |
| `rules.first-worker` | Place a worker | worker | beyond cards |
| `rules.first-scout` | Place a scout | scout | beyond cards |
| `rules.worker` | Place a worker | worker | beyond cards |
| `rules.warrior` | Place a warrior | warrior | beyond cards |
| `rules.scout` | Place a scout | scout | beyond cards |
| `rules.gather` | Gain the yield of a worker's tile | yield, worker | beyond cards |
| `rules.trapping` | Place Trapping on Forest | Trapping (the improvement), Forest | beyond cards |
| `rules.band-joins` | Single use.\nGain one population | population | beyond cards |
| `answer-rules.let-them-go` | Lose one population | population | beyond cards |
| `answer-rules.follow-it` | One forest gains Wildlife | forest, Wildlife | beyond cards |
| `answer-rules.let-it-burn` | The fire burns {tiles} forest into plain, kills {population} population and damages {units} unit | forest, plain, population, unit | beyond cards |
| `answer-rules.ration` | Your city is attacked by {warriors} Warrior | Warrior, city | beyond cards |
| `answer-rules.fight` | Your city is attacked by {warriors} Warrior | Warrior, city | beyond cards |
| `answer-rules.make-room` | A camp with {warriors} Warrior is placed near your city | Warrior, city | beyond cards |
| `capstone.title` | Pass the capstone to win the Nomadic Age | capstone | beyond cards |

One thing a session taking either line reads before it starts. **`capstone.title` is not a rules entry** — the run never lays it out, so a mark there needs the window's title to be laid out as a run, which is work neither line has scoped.

The table above is the list the **References beyond cards** line works from; its mark sits beside `[card:<id>]`.

## Kinds

The card kinds themselves — settle, unit, building, instant, hazard, event, capstone — are references too, on the kind label of every face: the board line **Card kinds explain themselves**. The rules text of that lookup is not written here.
