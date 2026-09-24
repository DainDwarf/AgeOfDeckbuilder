# Close v0.0.4

**Line:** - **Close v0.0.4** — `package.json` and `package-lock.json` read version 0.0.4; `CHANGELOG.md` holds the `[0.0.4]` entry below, verbatim, under an empty `[Unreleased]`; `README.md` names v0.0.4 as the latest build; the v0.0.4 rung is gone from `workflow/ROADMAP.md`; `git grep -n "0\.0\.3" -- . ":!CHANGELOG.md"` prints nothing; the annotated tag `v0.0.4` stands on the ship's commit and is pushed; `origin/Latest` points at that same commit. Doc-impact: none.

**Spec:** The rung the roadmap names as v0.0.4 — the deck is data, the map's rewards, the settle phase, the Nomadic Age — has shipped whole, and the version is closed the way v0.0.3 was: the version bump, the players' note, the rung off the roadmap, an annotated tag. New since v0.0.3: GitHub Pages builds from the `Latest` branch, which still points at `v0.0.3-2`; the close moves it onto the tag, so Pages serves v0.0.4 once CI passes there.

The changelog entry, verbatim, the heading's date the day of the ship's commit (`YYYY-MM-DD`):

```
## [0.0.4] - YYYY-MM-DD

The first real age. The stand-in deck gives way to the Nomadic Age: a band that stops wandering, settles where it chooses, and wins the age by building its first shelter. Every number in it is provisional.

### Added

- The Nomadic Age, the first age of the game, with a deck, events, a capstone and a land of its own. Four resources are in play: food, production, military and culture.
- The settle phase. A chronicle opens before its first turn with the middle of the map in sight and three settle cards in hand: Settlement places the city on plain, forest or hills, and Worker and Scout place the band's first units, taking no population. The phase ends as a turn does, once the city stands; the map's frame, a chip and the end-turn button show it in a colour of its own.
- The scout, a unit that sees far, moves far and is weak.
- Gather, the most common card in the deck: played through a worker outside the border, it gains the yield of the tile the worker stands on. Inside the border it is refused.
- Trapping, placed by a worker on forest, gives food. Two new features: wildlife on forest, flint on hills.
- Five events, each dealt with two answers. Lean season lays Hunger on the draw pile or brings enemies to the city; a rival band attacks or places a new camp near the city; Wildfire burns forest into plain unless you pay production; Departure takes one population unless you pay culture; the herd, rarer, gives food or wildlife near the city. Every event carries lore, a few lines saying what is happening to the city, and so do a camp's capture and the capstone.
- The first shelter, the age's capstone. Its card is shown when the chronicle opens; when it lands it puts Shelter on top of the draw pile, and the chronicle is won the moment a worker builds it.
- Every camp opens with an enemy on it that keeps the camp, and the camp may enter another at each enemy phase.
- A captured camp deals two rewards and you choose one: Pillage, food and production, or Capture, one population. Both are single use.
- Names in brackets on a card. Rest the pointer on one to see the thing it names as a small card; right-click it to show it large. Cards shown large stack, up to twelve.
- A card's kind label says what the kind is when the pointer rests on it.
- Changes on the map play out: a terrain changes before your eyes, marks come and go, a tile just charted fades in, and a unit hurt or killed by no attacker bumps or shrinks.
- A unit with no move points and no action left is dimmed.
- The pointer is a hand over whatever a click presses.
- A launch page choosing the content, region, schedule, deck and seed. The address keeps the choices, so a reload replays the chronicle.
- A page saying the game could not start, with the error's own words, in place of a blank screen.

### Changed

- The city holds only its own tile when it settles, with one population on it; every other tile is claimed. The culture threshold is twice the tiles the city holds.
- The growth threshold is twice the population and your units on the map counted together, and growth now comes before income.
- The city gives military and culture, and nothing else on the map yields military.
- An attack, or a card played through a worker, spends the move points the unit has left: move first, then act.
- An event is one problem dealt with its answers, instead of two events to choose between, and events come less often.
- Hunger takes the food written on it, more on a later turn, and kills one population when the stock cannot cover it. Pay its production cost to be rid of it.
- An event's enemies enter together through one door: a camp still standing, or the map's outer ring. Capturing every camp no longer ends the raids.
- Victory comes the moment the capstone's condition holds, even in the middle of a play.
- The map is larger. Its middle is plain, forest and hills, with the water and the mountains further out, and forest also gathers in woodlands.
- A tile's feature and improvements stand in one row above its middle.
- Enemies seen in the fog are forgotten when the turn ends, since they have moved.
- The resource bar reads culture as the stock over the culture threshold, and population as the idle alone. Culture and idle fill in the accent while city mode has a claim or an assignment waiting.

### Removed

- The stand-in deck and everything that only it held: PH_Farm, PH_Harvest, PH_Mine, PH_Road, PH_Urbanisation, PH_Recall, PH_Spoils, the raid and famine events, urban ground and the PH_Siege capstone. No card places a road any more.

### Fixed

- The end-turn button reads End turn again when the turn's play-out ends under a pointer that never moved.
- A card, a unit or a population being dragged comes home when a window rises over it, instead of landing under the window.
- A pan dragged across the Menu button carries on instead of opening the menu.
- A small card or a kind label's bubble raised in a window follows the window as it scrolls.
```

`README.md`, _Play_: `The latest build v0.0.3 is at` becomes `The latest build v0.0.4 is at`, the rest of the line unchanged.

The tag: annotated, named `v0.0.4`, its message `v0.0.4 - The Nomadic Age`, as `v0.0.3`'s is `v0.0.3 - A chronicle that ends in victory`.

**Doc-impact:** none — the close touches the repository's own files and `workflow/` alone; no design fact changes.

**Scope:** In: the version bump, the changelog entry, the README's version, the rung's deletion, the tag, and `Latest` moved onto the tagged commit. Out: the itch push — the user runs `npm run itch` themselves once CI is green; the hand-back reminds them. Out: `workflow/IDEAS.md`'s "Not before v0.0.4 is closed" on the simulator, which the close satisfies and which stays gated on its second condition, two ages. Out: `[0.0.3]` and every older entry, which are history and never reworded. Corner cases: the entry sits under `## [Unreleased]`, which stays, empty, above it, as it did at v0.0.3. The tag goes on the ship's own commit, never on a Shave after it; a Shave the review orders lands after and stays untagged. A red CI after the push leaves the tag and `Latest` where they are — a published tag is never moved — and becomes a fold or a board line on the user's say.

**Traps:**

- `package-lock.json` carries the version twice, at its top and under `packages[""]`; `npm version 0.0.4 --no-git-tag-version` rewrites both and `package.json` together, and creates no tag or commit of its own.
- The tag message is written with `-m` on one line; the ship commit message goes through a scratchpad file and `git commit -F`, as every multi-line message does here.
- `Latest` is a branch on the remote only, never checked out locally. It is moved by pushing the tagged commit onto it, a fast-forward from `v0.0.3-2`'s commit, which is an ancestor of `main`: `git push origin v0.0.4^{commit}:refs/heads/Latest`. Never with force: a refusal means `Latest` moved since this intake, and is reported, not overridden.
- The push of `Latest` starts a CI run of its own, beside `main`'s; its `pages` and `deploy` jobs run once its checks pass. The hand-back watches both runs, each by its id from `gh run list`.
- Prettier reads `CHANGELOG.md`; `npm run lint` must pass on the entry as written, and `npm run fmt` is the fix if it reflows a line.

**Plan:**

1. The version bump: `package.json` and `package-lock.json` read 0.0.4.
2. `CHANGELOG.md` holds the entry under `[Unreleased]`, dated the day of the commit; `README.md` names v0.0.4; the v0.0.4 rung is gone from `workflow/ROADMAP.md`; the board line and this dossier are deleted.
3. After the review passes: the ship commit, the annotated tag `v0.0.4` on it, then `main`, the tag and `Latest` pushed, in that order.

**Verify:** `npm run lint`; `git grep -n "0\.0\.3" -- . ":!CHANGELOG.md"` printing nothing; `git tag -n1 v0.0.4` reading `v0.0.4 - The Nomadic Age`; `git ls-remote origin refs/heads/Latest refs/tags/v0.0.4^{}` showing the ship's commit twice. No proof spec: nothing on the screen changes. CI runs the whole suite on the `main` push and again on the `Latest` push, whose `pages` and `deploy` jobs publish v0.0.4 to GitHub Pages.
