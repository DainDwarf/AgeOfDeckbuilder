# The rules line wraps through Phaser

The contract for the board line of that name, settled with the user on 2026-09-10 and restated
after the finding below. It rebuilds what `fd5e912` shipped, on the API Phaser documents instead
of around it. No design page is involved: nothing in `docs/` states how a card face is drawn.

## Why the line exists

`fd5e912` laid the rules line out by hand: a throwaway `Text` (the ruler) is created per card
face, `setText` is called on it once per word and once per glyph prefix, each call being a full
`updateText` (canvas resize, re-rasterise, GPU upload), then it is destroyed. Phaser documents
exactly this need as `setWordWrapCallback` (`node_modules/phaser/src/gameobjects/text/Text.js:1034`):
a callback that receives the text and the `Text` object and returns the lines, run by
`runWordWrap` (`Text.js:378-392`) inside the `Text`'s own `updateText`. The dogma is to follow the
API rather than go around it; the line does that and drops the ruler.

## The finding that reset this line's premise

The commit that introduced the ruler said a `Text` per word "garbled other cards' text", and the
first version of this dossier read that as a misuse of `Text`. It was not. The garbling is a
Phaser 4.2.1 shader defect, reported by the user as
[phaserjs/phaser#7372](https://github.com/phaserjs/phaser/issues/7372) and worked around by the
board line *Rotated Texts stop tearing* (`board/rotated-texts.md`), which ships **before** this
one. In short: a rotated textured quad in a multi-texture batch loses fragments to a float
equality test in the fragment shader. The fanned hand rotates its cards, so their Texts tear;
more Texts per card meant more tearing, which is what a `Text` per word showed. It shows on the
software WebGL that headless Chromium renders with (the `ui-check` agent, the e2e suite, CI), not
on the user's own GPU, which interpolates exactly. Nothing in this
line touches that. If a rules line looks torn while this line is being verified, the workaround
line has not shipped or was undone; it is not this line's defect.

So: one `Text` per rules line stays because it is the simplest shape, not because several would
garble. The ruler goes because the API has a place for the measurement. The report has nothing
to say about garbling.

## What Phaser does, exactly

- `updateText` (`Text.js:1269`) syncs the font onto the `Text`'s own canvas context **first**
  (`style.syncFont`, line 1277), then calls `runWordWrap` when a callback or a width is set. So
  inside the callback, `textObject.context.measureText(s).width` measures in the right font.
- The callback is `wordWrapCallback.call(wordWrapCallbackScope, text, textObject)` and may return
  an array of lines or one string with `\n`.
- It is set either by `setWordWrapCallback(callback, scope)` or through the style,
  `wordWrap: { callback, callbackScope }` (`TextStyle.js:38-39`); `addText` in
  `src/ui/design-space.ts:450` spreads the style through, so a nested `wordWrap` object passes.
- The `Text` constructor calls `setText` **before** `setPadding`, so the callback runs twice per
  construction. It must be pure in effect; the last run's result is the one drawn.
- `GetTextSize` ceils each line's measured width (`GetTextSize.js:68`) and `align: 'center'`
  places each line at `(textWidth - lineWidths[i]) / 2`, rounded (`Text.js:1397-1432`). The line
  a glyph stands on is therefore centred on its **ceiled** width. (`GetTextSize.js:63` subtracts a
  space when `style.wordWrap` is set; that property is never set anywhere in `TextStyle`, so the
  branch is dead. Do not budget for it.)

## Scope

- **One `Text`, wrapped by Phaser's pipeline.** The rules `Text` in `src/ui/card-face.ts:179-182`
  gets a `wordWrap.callback`. The callback measures with the `Text`'s own context, calls
  `layOutRun`, keeps the returned `Run` in a closure for the glyph placement that follows, and
  returns `run.content.split('\n')`.
- **The ruler goes.** `src/ui/card-face.ts:165-177` (the `ruler`, `measure` and the
  `space: measure(' '.repeat(20)) / 20` trick with its comment) is deleted. `measureText` is
  fractional, so one `' '` measures the space; the twenty-space trick and its comment go with the
  ruler. `TEXT_INSET` stays exported only if something still imports it; otherwise it goes back
  to a module constant of `design-space.ts`.
- **`layOutRun` keeps its interface and its tests.** `(entry, measure, metrics) → Run` in
  `src/ui/text-run.ts:99` stays as it is; only the caller changes. Every rule
  `src/ui/text-run.test.ts` pins still holds: the wrapping, the hard break, a number never parting
  from its glyph, prose left as one string, the bearing, pair centring, resource order, the
  unknown-mark refusal.
- **Glyph placement agrees with Phaser's centring.** For a glyph, `x` is measured from the middle
  of its line; the line's drawn width is the ceiled measure, as above. The implementer computes
  the glyph's offset against that ceiled width (today's integer `ruler.width` did this by
  accident) so the glyph stays where it stands now.
- **The glyph placeholder stays as it is.** Glyphs standing in spaces of the one string is the
  shape that exists and works; nothing in this line reopens it.
- **The card must look as it looks now**: "Single use." on its own line, then the pairs, glyph at
  two thirds of the text and a quarter of it as the gap inside a pair. The other nine cards are
  prose and wrap as prose.

## Plan

1. In `createCardFace`, replace lines 165-177 with a closure `let run: Run | undefined` and a
   callback `(content, textObject) => { const measure = (s) => textObject.context.measureText(s).width; run = layOutRun(content, measure, { width: right - left, glyph: span, bearing: size / 4, space: measure(' ') }); return run.content.split('\n'); }`.
2. Build `rules` with `addText(..., text(\`rules.${id}\`), { ...ruleStyle, align: 'center', wordWrap: { callback } })`.
   After it exists, `run` is set; read `run.lines` and `run.glyphs` for the rows that follow
   (`card-face.ts:184-196`), unchanged.
3. Reconcile glyph `x` with the ceiled line width as described under Scope. The cleanest place
   is inside `layOutRun`'s final loop (`text-run.ts:118-125`): `const width = Math.ceil(measure(line.drawn))`.
   If a `text-run.test.ts` case measures with integers already, it passes unchanged; if a test
   supplies fractional measures, its expectation changes by the ceiling and is updated with the
   reason in the report.
4. Remove the dead export if `TEXT_INSET` has no importer left.
5. Run the verification and report every deviation and corner case.

## Doc-impact

None. No `docs/` page states how a card face is drawn or how its text is laid out.

## Hazards

- `basicWordWrap` splits each line on `' '` and rejoins with single spaces (`Text.js:557-593`);
  it must never be the path taken for a card, or the glyphs' spaces collapse. The callback path
  is the only one that keeps them; do not also set `wordWrap.width`.
- `align: 'center'` on the `Text` is what centres each line; the glyphs are placed from each
  line's own middle. Both have to keep agreeing (see the ceiled width above).
- Every card's rules line goes through the callback, not only `PH_Spoils`; the other nine are
  prose and must still wrap as prose.
- The art box below follows `rules.height`; if the run's line count changes, so does the box.

## Verify

`npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/camps.spec.ts`, and a look
at a hand holding several cards — the other nine cards' lines included, not `PH_Spoils` alone.
