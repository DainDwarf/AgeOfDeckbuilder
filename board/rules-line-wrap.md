# The rules line wraps through Phaser

The contract for the board line of that name, settled with the user on 2026-09-10. It rebuilds
what `fd5e912` shipped, on the API Phaser documents instead of around it. No design page is
involved: nothing in `docs/` states how a card face is drawn.

## Why the line exists

The rules line was rebuilt as a token run because drawing it as a `Text` per word garbled other
cards' text. The workaround chain that followed is four links long, and only the first was ever
verified:

garbling → a glyph stands in spaces of one string → Phaser's own wrap collapses runs of spaces, so
it cannot carry that → the wrap is hand-rolled → a throwaway `Text` is needed to measure with.

Phaser's `Text` class doc warns against exactly what provoked the garbling: "This can be an
expensive operation if used often, **or with large quantities of Text objects** in your game"
(`node_modules/phaser/src/gameobjects/text/Text.js:52-55`). So the shape that broke was never the
supported one, and the chain rests on a misuse rather than a defect.

## Scope

- **One `Text`, wrapped by Phaser's pipeline.** `setWordWrapCallback`
  (`Text.js:1034`) is the documented extension point: the callback takes `(text, textObject)` and
  returns the lines, and `runWordWrap` (`Text.js:378`) prefers it over the built-in wrap. The
  layout in `src/ui/text-run.ts` moves inside it, so the run is laid out on the real `Text` as
  part of its own update rather than computed against a second object beforehand.
- **The ruler goes.** `src/ui/card-face.ts:168-177` creates a `Text`, calls `setText` once per
  word and once per glyph prefix, then destroys it — once per card face built. Each `setText` is a
  full `updateText`: canvas resize, re-rasterise, and a GPU re-upload. Measurement moves to the
  rules `Text`'s own `context`, which is what Phaser's `basicWordWrap` measures with
  (`Text.js:547-570`).
- **`layOutRun` keeps its tests.** Its interface may change to suit the callback — it currently
  takes a `Measure` and a `Metrics` (`text-run.ts:30-41`) — but every rule
  `src/ui/text-run.test.ts` pins is still a rule afterwards: the wrapping, the hard break, a
  number never parting from its glyph, prose left as one string, the bearing, pair centring,
  resource order, the unknown-mark refusal.
- **The glyph placeholder is open.** Spaces-in-the-string exists only because a `Text` per piece
  garbled. With one `Text` and the callback, whether the glyphs still need to stand in spaces, or
  can be placed from the callback's own line measurements, is the implementer's to determine and
  report.
- **The card must look as it looks now**: "Single use." on its own line, then the pairs, glyph at
  two thirds of the text and a quarter of it as the gap inside a pair.

## Doc-impact

None. No `docs/` page states how a card face is drawn or how its text is laid out.

## Hazards

- `basicWordWrap` splits each line on `' '` and rejoins with single spaces (`Text.js:557-593`), so
  the built-in wrap destroys a run of spaces. `getWrappedText` (`Text.js:616`) runs the same wrap
  and inherits this. Only the callback path is free of it.
- `GetTextSize` subtracts one space width per line whenever `wordWrap` is set, and rounds each
  line to the whole pixel. Setting a wrap callback puts the run back on that path, so the line
  widths the glyphs are placed against may shift; the art box below follows `rules.height`.
- Every card's rules line goes through this, not only `PH_Spoils`. The other nine are prose and
  must still wrap as prose.
- `align: 'center'` on the `Text` is what centres each line; the glyphs are placed from each
  line's own middle. Both have to keep agreeing.
- A `Text`'s canvas comes from `CanvasPool`, a page-global pool (`Text.js:138`), and its texture
  is sourced from that canvas element (`Text.js:275`); `destroy` frees the canvas back to the pool
  and wipes it. That is the churn the ruler causes and this line removes.

## The question this line answers

Whether the garbling is reachable at all with one `Text` and no per-face churn. Report it either
way. If it still garbles, that is a Phaser defect with a clean repro, and its own line.

## Verify

`npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/camps.spec.ts`, and a look at
a hand holding several cards — the other nine cards' lines included, not `PH_Spoils` alone.
