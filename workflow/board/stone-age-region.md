# The Stone Age's region

**Line:** The Stone Age's region — the Stone Age owns a temperate region of its own, written whole in its module: a disc of radius 12, six camps no nearer the centre than 7 and 4 apart, the centre part reaching 3, and the Nomadic composition otherwise; the catalogue's coherence test passes and `docs/ages/STONE.md` opens with the land. Doc-impact: `docs/ages/STONE.md`, `docs/index.md`.

**Spec:** [`docs/MAP.md`](../../docs/MAP.md) _The region_ is the rule and changes in nothing: a region is an age's, and one name deals a different map in each age. The content is the Stone Age's `temperate` region, every number of it:

- radius 12, centre part 3, 30 tiles to a biome, the centre's biome `heartland`;
- biome shares: `sea` 0.2, `mountain` 0.1, `woodland` 0.1, `land` 0.6, in that order;
- feature shares: `fertile` 0.1, `wildlife` 0.1, `flint` 0.1, in that order;
- 6 camps, no nearer the centre than 7, 4 apart;
- rivers: source `mountain`, relief 1, roughness 0.5, 2 a range, climb 0.5, meander 1.5, curl 0.75, 4 edges a tile, least 6 edges, 60 draws.

No player-facing sentence is added: the region reads `Temperate` through the entry that stands.

`docs/ages/STONE.md` is new, and this is the whole of it:

```markdown
# The Stone Age

> What the Stone Age is made of: its land. A content page under [`DESIGN.md`](../DESIGN.md)'s legend. The rules it is played by are [`CHRONICLE.md`](../CHRONICLE.md)'s and its map [`MAP.md`](../MAP.md)'s, and this page repeats none of them; no number stands on it. The terrains, the features and the biomes it shares with the Nomadic Age are [`NOMADIC.md`](NOMADIC.md)'s.

## The land ✅

The Stone Age's temperate region is the Nomadic one on a bigger disc: the same terrains and features in the same shares, the same biomes cut as fine, more of each of them, and rivers rising in its ranges. The ground around the centre is the same biome of its own, and the centre part reaches as far, so the settle chooses among as many tiles. More camps stand on it, kept as far from the centre and from one another as the Nomadic ones, so the nearest is as near and the rest lie further out.
```

In `docs/index.md`, the `ages/` line ends "[`ages/NOMADIC.md`](ages/NOMADIC.md) is the first, [`ages/STONE.md`](ages/STONE.md) the second." in place of "[`ages/NOMADIC.md`](ages/NOMADIC.md) is the first."

**Doc-impact:** `docs/ages/STONE.md` (new), `docs/index.md`.

**Scope:**

- In: the Stone Age's own `temperate` region in `src/content/stone.ts`; the content page; the index line.
- Out: the generator, which this line does not touch; the desert and the rule that keeps a biome from the kinds it names, the two lines after this one; the camp, the schedule, the capstone and the texts the Stone Age still reads from the Nomadic slice; the map's furthest zoom, which stays as it is though it holds less of this disc than of the Nomadic one.
- The process is rolled, and the generator dealing it is unchanged: a camp is drawn among the tiles its building stands on that the ground runs to the centre from, 7 or more from the centre and 4 from every camp placed, out to the rim. Measured over 100 to 200 seeds on these numbers: the nearest camp is 3.5 to 10 turns of a warrior's walk from the centre, median 5; a raid through a camp walks a median 7 turns, one in ten over 10.5; about one seed in 200 throws a deal away for too few camps and none fails its ten deals. The Nomadic region reads 3.5 to 6.5, median 5, and a median 6, one in ten over 8.5.
- The catalogue's version stays as it is: a Stone Age chronicle a save holds keeps the tiles it was dealt.
- No test is written on the region's numbers: they are tuning. The catalogue's validation and the coherence test are the whole check.
- Reconcile, the Nomadic region: the two stay apart. The Stone Age's region is written whole, every number its own, and is not the Nomadic region with two numbers changed: a retune of one never moves the other's maps.
- Reconcile, the region's name: it goes through the standing entry as it is, `Temperate` for both ages.
- Reconcile, the content page: the Nomadic page's shape, one section, no number, and no stand-in named.

**Traps:**

- `src/content/stone.ts` takes `regions` off `NOMADIC.owns` beside `basePrice`, `schedule` and `camp`; only `regions` stops being read from there. The biome and feature ids the region names resolve in the tables the Nomadic slice brings; the Stone Age brings nothing to a table in this line.
- The catalogue refuses a region whose share of a biome rounds to none, and one that leaves a biome over its shares while its centre's kind is dealt to a size. At radius 12 and 30 tiles to a biome the shares deal three seas, two ranges, two woodlands and eight lands, nothing left over; the numbers above went through the catalogue's validation as written.
- The catalogue's coherence test launches and settles a chronicle on every age's first region, on seed 1 and the centre tile, and asks every closure of the age's schedule on it: it runs on the new disc with no change.
- `e2e/launch.spec.ts` reads its oracle from the rules; no spec and no test names the Stone Age's radius or its camps.
- No number stands on a content page, and a page names no stand-in: the page says nothing of the camp, the events or the capstone the age still borrows.

**Plan:**

1. `src/content/stone.ts`: the Stone Age owns its `temperate` region whole. Leaves the catalogue building, its coherence test passing, and a Stone Age chronicle launched on a disc of radius 12 with six camps.
2. `docs/ages/STONE.md` and the `docs/index.md` line, as written above. Leaves the page reachable from the map of the docs.
3. The board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/launch.spec.ts`: it launches a Stone Age chronicle from the screen and reads it against the rules. CI proves every other spec on the push; none launches the Stone Age.
