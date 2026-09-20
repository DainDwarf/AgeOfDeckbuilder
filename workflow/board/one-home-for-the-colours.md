# One home for the colours

**Line:** One home for the colours — every colour of the screen, the veils' strengths and the worn-down with them, lives in one Phaser-free record under `src/ui/`, no colour literal stands anywhere else under `src/`, and `e2e/chronicle-screen.ts`'s `accent(page)` is gone, the specs reading the accent off the home. Doc-impact: none.

**Spec:** no `docs/` page changes. The design pages name colours by role only — "the accent", "the settle phase's own colour", "the enemies' own colour", "the colour that resource is known by" — and hold no value; the home is those roles written down. Nothing player-facing changes: the screen after this line is pixel-identical to the screen before it.

**Doc-impact:** none — the pages already name colours by role and carry no value.

**Scope:**

In: one new module under `src/ui/`, the home, importing nothing from Phaser and nothing from a module that imports Phaser. It holds one record typed by its roles, the default look being that record's one value. Its members:

- Every single colour, one entry per role. A role is what one theme decision would recolour together, so values may repeat across roles and a role is never merged with another because the numbers happen to agree today.
- Every veil as one entry holding a colour and a strength together, so no alpha is typed at a use site.
- The three tables keyed by content — a resource's colour, a terrain's, a feature's — and the building table that maps a building to one of the roles, since a theme recolours those with the rest.
- The converter that writes a colour in the notation a text style takes, moved out of the design-space module.
- The worn-down — the grey and the brightness the discard pile's top card and a dry draw pile are worn down by — moved out of the card face module, as the one place that knows how a colour is worn; the card face keeps applying it.

The roles, with today's value and what each paints; the identifiers are the implementer's:

| Role | Today | Paints |
| --- | --- | --- |
| The accent | `0xd9a441` | Everything the player's: the border rings, the deck's pill, the end-turn button, the selection ring and the aim point on a card, the aim line's ink, a filled well, the launch button and the held option, the menu button, the player's units |
| The settle phase | `0x9fbb3a` | The map's frame, the chip and the end-turn button while the phase is on |
| The panel fill | `0xd4d7db` | The tooltip bubbles, the resource bar, the band under the hand, the menu, the launch page's faces |
| The panel edge | `0x6f757d` | The edge of all of those |
| The ink | `0x0d1014` | Text on a panel: the tooltip, the piles' counts, the end-turn label, the infopanel's values, the menu, the launch page, the standing line, the refusal note, the resource bar's values and a latched reading's word |
| The faint ink | `0x4a5058` | A reading's word while not latched, the infopanel's labels, a card's kind line |
| The pale ink | `0xd4d7db` | Text on the dark: a window's title, a line typed at the console |
| The answer ink | `0x9aa1a9` | An answer at the console |
| The page | `0x0d1117` | The page behind the canvas, in `src/main.ts` |
| The map's outline | `0x0d1014` | The stroke of every mark, tile, river and glyph on the map, and the text stroke on the culture threshold |
| The map's rim | `0x5c6068` | The disc's rim |
| The lit | `0xf2f6ff` | A tile lit for a step or an aim, the selected tile's ring, the threshold's text |
| The river | `0x62a9e0` | A river along the tiles and the river's own mark |
| The enemy red | `0xb4453c` | The enemies' units, the camps, a unit glowed for an attack |
| The built | `0xcfc6b4` | Every building and improvement of the player's |
| The well fill | `0xb4b9c0` | The floor of a latched reading's well |
| The well light | `0xeef0f3` | The light under a well's edge |
| The card edge | `0x6f757d` | The edge of a card face, a card back and the infopanel, and the infopanel's rule |
| The card back | `0x232833` | The draw pile's face-down card |
| The aim line's slab | `0x232833` | The slab the aim line stands on |
| The aim point's edge | `0x0d1014` | The stroke around the point a card being aimed wears |
| The empty edge | `0x4a5058` | The outline a pile shows when it holds nothing |
| The unaffordable mark | `0xc0392b` | The ring and the number on a cost the city cannot pay |
| The affordable card | face `0xd4d7db`, art `0xb6bbc2`, art edge `0x9aa0a8`, ink `0x0d1014` | A card the city can pay for, and the infopanel's paper |
| The unaffordable card | face `0xa7abb1`, art `0x8f959c`, art edge `0x7c828a`, ink `0x3a3f45` | A card the city cannot pay for |

The veils, each a colour with its strength:

| Veil | Today | Covers |
| --- | --- | --- |
| The map's dim | `0x0d1014` at `0.6` | A tile in fog, the yield overlay's dim, city mode's dim over a held tile nobody works, a spent unit |
| The scrim | `0x0d1014` at `0.82` | The chronicle screen under a window and under the ending screen; the ending's rise tweens the scrim up to this strength |
| The console's panel | `0x0d1014` at `0.9` | The debug console's panel |

The worn-down: grey by `0.35`, brightness by `0.75`, as the card face's derivation computes it today.

The tables, moved as they stand: the seven readings' colours from the resource bar (`food 0x7d9c55`, `production 0xb0834a`, `military 0xb05252`, `money 0xa08a1e`, `science 0x5f8fc0`, `culture 0x9a6fb8`, `population 0x6b6b7d`), the seven terrains' and the four features' from the marks module, and the building table mapping each building to the built or the enemy red.

In, as consequences: every consumer reads the home and its own literal goes, the design-space module's four colours and its converter go, the marks module keeps its geometries and its lookups but no colour value; `src/main.ts` reads the page colour off the home; `e2e/chronicle-screen.ts` loses `accent(page)`, and the two sites in `e2e/city-mode.spec.ts` that compare a well's fill to it compare to the accent imported from the home instead.

Out:

- Any change of any value: the screen before and after is pixel-identical.
- Any switching of themes, any setting, any second theme: the theme-picker line's. The record's type is what that line will write a second value of.
- The geometries in the marks module: polygon corners are not colours.
- The alphas that are motion, not strength: a tween's zero and one, a ghost's fade. Only a strength a veil rests at is a colour's.
- The alpha-free lookups the content coherence tests call — a terrain's colour, a building's, a feature's — keep answering and keep refusing an unknown id; where they live is the implementer's.

Corner cases decided here:

- A role is never merged on a matching value: the ink, the map's outline, the scrim's colour, the console panel's colour and the aim point's edge are five entries at one value today.
- Ten text inks are one role: a theme would change them together.
- The home holds numbers only, one notation; a text style gets its string through the converter at the style, never a string literal in the home.
- The infopanel's paper is the affordable card's face, as today, not a role of its own.
- A test asserting the home's shape or that it imports no Phaser is a paraphrase and is not written: the Playwright runner loading the home under Node is the check, and `npx playwright test e2e/city-mode.spec.ts` runs it.

**Traps:**

- The design-space module imports Phaser at its top for the layout helpers; the home must import neither it nor anything that imports it, transitively — the card face, the resource bar and the marks modules' current colour tables are read through modules that do. The Playwright runner imports `e2e/chronicle-screen.ts` under plain Node, and a Phaser import reached from the home fails there, not at `npm run check`.
- The content coherence tests, `src/content/nomadic.test.ts` and `src/content/stand-in.test.ts`, import the terrain, feature, building and unit lookups from `src/ui/marks.ts` by name; they run under Vitest in Node, so the same Phaser-free rule holds for whatever those lookups now read.
- The resource table is keyed by the bar's `Reading` type, a resource or `'population'`, declared in `src/ui/resource-bar.ts`; the key set must reach the home without the bar's Phaser imports. The next board line renames that key to idle across the bar, the map's assigned mark and the piles' change switch: it will find the table in the home, so the home is where the key is renamed.
- The map's assigned mark and the claimable ring read the population's and the culture's colour off the resource table by key, not through a lookup.
- `e2e/chronicle-screen.ts`'s `wellFill` reads a rectangle's `fillColor`, a number in the home's notation, so the comparison to the accent is direct; the `accent(page)` helper goes, not `wellFill`.
- The overlay's scrim is brought up from zero by a tween whose target is the scrim's strength, and reset to it after; both read the veil's strength.
- Phaser takes a shape's fill alpha as an argument beside the colour and a text's colour as a string; a veil entry is unpacked at the use site, never handed to Phaser as one object.
- `src/rules/rng.ts` and two rules tests hold hex literals that are hashing constants and seeds, not colours; the grep in Verify runs over `src/ui/` and `src/main.ts` only.
- A hook flags a comment block longer than three lines touched under `src/` or `e2e/`; the roles' table above is the dossier's, not a comment's — the home carries no comment restating it, a trap only.

**Plan:**

1. The home, complete: every role, the three veils, the four tables, the converter and the worn-down, on one typed record; nothing reads it yet. `npm run check` passes.
2. Every consumer under `src/ui/` reads the home; every local colour literal, the design-space module's four colours and converter, the card face's palettes and derivation numbers, the marks module's colour tables and the three alphas go. `src/main.ts` reads the page colour. `npm run check`, `npm test` and `npm run lint` pass; the grep in Verify finds nothing outside the home.
3. `e2e/chronicle-screen.ts` loses `accent(page)`; `e2e/city-mode.spec.ts`'s two sites compare to the accent from the home. `npx playwright test e2e/city-mode.spec.ts` passes, which is what proves the home loads without Phaser.
4. The board line deleted.

**Verify:**

```
npm run check
npm run lint
npm test
npx playwright test e2e/city-mode.spec.ts
```

The grep, expected to name the home alone: `rg -n "0x[0-9a-fA-F]{6}|#[0-9a-fA-F]{6}\b" src/ui src/main.ts`.

Pixel identity: before the first edit, a one-off Playwright script in the scratchpad, never committed, opens `/?content=<stand-in version>&seed=1&deck=PH_Deck&schedule=<stand-in schedule>`, waits for the chronicle scene to be active and a frame to be drawn, and saves a screenshot — the capstone's window over the scrim, the resource bar, the map under it — and one of the launch page at `/`; after the last edit, the same script again, and the two pairs compared byte for byte. Any difference is a colour moved, and is reported as a deviation with the two images.
