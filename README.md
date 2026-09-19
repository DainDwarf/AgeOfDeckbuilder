# Age of Deckbuilder

A single-player roguelite deckbuilder that retraces humanity's history through the ages, played in the browser.

You settle one city on a generated hexagonal map and live through one age with it, from its dawn to the threshold of the next. Your deck holds the verbs: buildings and units enter the map through cards, and changing the map costs a card. The age answers with an escalating schedule of events — enemies out of camps you have to scout for, famine, fire, people leaving — and ends with its capstone, one trial announced at the opening and landing on a turn you never learn. Reach the next age and the chronicle is a victory; lose the city and it is a defeat. Every chronicle is seeded, so the same seed replays the same map and the same schedule.

The game is early. One age exists, the Nomadic Age, where humanity stops wandering; the meta between chronicles, the later ages, the art and the sound are still to come.

## Play

The current build is at [daindwarf.github.io/AgeOfDeckbuilder](https://daindwarf.github.io/AgeOfDeckbuilder/). No account, no server, nothing to install.

## Start it locally

Node 24 or later.

```
npm install
npm run dev
```

`npm run check` typechecks, `npm test` runs the rules tests, `npm run lint` checks code and markdown, `npm run build` builds into `dist/`.

## Read more

- [`docs/`](docs/index.md) — the design: what the game is, and what was decided.
- [`DOGMAS.md`](DOGMAS.md) — how the project is built.
- [`workflow/`](workflow/BOARD.md) — what is being worked on, what may come later, and the rungs to the demo.
- [`CHANGELOG.md`](CHANGELOG.md) — what each version brought.

No asset is made by a generative model: art, sound and music come from packs whose licences are recorded in `public/assets/LICENSES.md`, or are shapes drawn by code.
