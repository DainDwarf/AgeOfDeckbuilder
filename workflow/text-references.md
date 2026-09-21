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
| population | concept | no entry of its own; `label.population` reads "Idle" | Capture (`rules.band-joins`) |
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

The tooltips and the info panel rows marked no noun: a tooltip or a panel row is where a lookup lands, not where one starts. Two of the names a lookup lands on are renamed by the polish: the feature game becomes wildlife, the terrain deep becomes ocean.

## Kinds

The card kinds themselves — settle, unit, building, instant, hazard, event, capstone — are references too, on the kind label of every face: the board line **Card kinds explain themselves**. The rules text of that lookup is not written here.
