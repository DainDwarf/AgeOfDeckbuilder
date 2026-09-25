# Age of Deckbuilder

A single-player roguelite deckbuilder that retraces humanity's history through the ages, played in the browser.

You settle one city on a map and live through one age with it, from its dawn to the threshold of the next. Your deck holds the verbs: buildings and units, changing the map, etc. You then manage the city's economy, the tactical advance of your units freely on the map. Reach the next age and the chronicle is a victory; lose the city and it is a defeat.

The game is currently in early alpha. One age exists, the Nomadic Age, where humanity stops wandering; the meta between chronicles, the later ages, the art and the sound are still to come.

No asset is made by a generative model: art, sound and music come from packs whose licences are recorded in `public/assets/LICENSES.md`, or are shapes drawn by code.

## Play

The latest build v0.0.4 is at [daindwarf.github.io/AgeOfDeckbuilder](https://daindwarf.github.io/AgeOfDeckbuilder/). No account, no server, nothing to install.

## Built on

We're using [Phaser 4](https://phaser.io/) to draw every screen, the menus included. The code is TypeScript, built by [Vite](https://vite.dev/) for the browser.

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
- [`workflow/`](workflow/BOARD.md) — what is being worked on, what may come later, and the versions to the demo.
- [`CHANGELOG.md`](CHANGELOG.md) — what each version brought.
