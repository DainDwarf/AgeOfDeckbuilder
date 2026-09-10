# Rotated Texts stop tearing

The contract for the board line of that name, settled with the user on 2026-09-10. It works around
a Phaser 4.2.1 renderer defect the user reported upstream as
[phaserjs/phaser#7372](https://github.com/phaserjs/phaser/issues/7372). No design page is
involved.

## The defect

Phaser's WebGL renderer batches up to 16 textures per draw call and tells the fragment shader
which sampler to read through a per-vertex number (`inTexDatum`) that the GPU interpolates across
each triangle. `src/renderer/webgl/shaders/src/GetTexture.glsl` compares that interpolated
`outTexDatum` with **exact float equality** and returns transparent when nothing matches. On an
axis-aligned quad the interpolation is exact. On a rotated quad it drifts by a rounding error, so
fragments fall through to transparent (wedges cut out of the quad) or land on the neighbouring
sampler (another object's texture). Only quads with **different textures in one batch** and a
**non-zero rotation** are hit. Every `Text` owns its own texture, and the hand fans its cards by
±0.5° and ±1° (`src/ui/hand.ts:288`), so the hand's Texts are the exposed objects; cards in flight
(`src/ui/card-motion.ts`, the rotation tween to a pile) are too. The 45° diamonds everywhere are
untextured shapes and immune. The app has no image assets yet; any it gets on a rotated parent
would tear the same way.

Proven on 2026-09-10 with in-page probes: not related to how many Texts exist, the canvas pool,
`setText` churn, containers, strokes or the device pixel ratio. The corners reaching
`BatchHandlerQuad#batch` are exact; the loss is in the shader. The upstream `master` still
compares with `==`, and 4.2.1 is the latest release.

## Scope

- **`maxTextures: 1` in the game config**, `src/main.ts:43-51`. With one texture per batch the
  handler compiles the `TEXTURE_COUNT == 1` shader path, which samples `uMainSampler[0]` with no
  comparison at all. Verified on a standalone page: 60 Texts at 1° went from a third torn to all
  intact; the axis-aligned control row was intact both ways.
- **One trap comment on that line**, and nothing else. Its content, in substance: Phaser 4.2.1
  picks a batch's sampler by exact float equality on an interpolated varying, so a rotated `Text`
  tears (phaserjs/phaser#7372); one texture per batch skips the comparison; the line goes when a
  release fixes the shader.
- **Nothing else changes.** No `Text` is un-rotated, no layout moves, no spec is rewritten.

## Cost

A draw call per texture change instead of per 16. The chronicle screen holds about 45 Texts and
draws in well under a frame either way; nothing to measure. `renderNodes.setMaxParallelTextureUnits(1)`
at runtime has the same effect and is what the in-page verification used; the config knob is the
same fact stated once, at boot.

## Doc-impact

None.

## Hazards

- `autoMobileTextures` is not the knob: it applies off desktop only.
- The setting is read at boot (`WebGLRenderer.js:750-778`, clamped by `checkShaderMax`); nothing
  re-reads it, so nothing else needs to change when it is set.
- The Canvas renderer ignores it; the game asks for `Phaser.AUTO`, which is WebGL wherever the
  suite runs.

## Verify

`npm run check`, `npm run lint`, `npx playwright test e2e/camps.spec.ts`, then a `visual-check`
pass on a hand of five cards at device pixel ratio 1.5: every card's name, kind and rules line
reads whole, with no wedge and no letter from another card, at rest and while a card lifts on
hover.
