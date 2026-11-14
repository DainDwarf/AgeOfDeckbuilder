# The cast

**Line:** **The cast** — the twenty glyphs of the cast stand under `public/assets/`, five in `game-icons/` and fifteen in `material-design-icons/` filled white with the Pictogrammers' licence and the Apache 2.0 text beside them, each with its author in `public/assets/LICENSES.md`; the health bar's heart and a capture's badge wear the cast's, Skoll's Hearts and Lorc's Flying flag gone with their credits; and `docs/LOOK.md` names the cast.

**Spec:** `docs/LOOK.md`, _Two families_ and _The packs_; `docs/ASSET-SOURCES.md`, the licence shorthand and _Art_; `public/assets/LICENSES.md`. The cast was picked by the user on the casting page, <https://claude.ai/artifact/6e8kmN4njZQLj7fyrU8u3L>, and nothing of it is open.

The cast, and where each file comes from:

| Symbol | Set | File | Author |
| --- | --- | --- | --- |
| Food | Material Design Icons | `food-apple` | Austin Andrews |
| Production | Material Design Icons | `hammer` | Google |
| Military | Material Design Icons | `sword-cross` | Michael Richins |
| Money | game-icons.net | `delapouite/two-coins` | Delapouite |
| Science | Material Design Icons | `lightbulb-on` | Austin Andrews |
| Culture | Material Design Icons | `music` | Austin Andrews |
| Population | Material Design Icons | `account` | Google |
| Influence | Material Design Icons | `star` | Google |
| Health | Material Design Icons | `heart` | Google |
| Damage | Material Design Icons | `sword` | Austin Andrews |
| Bonus | Material Design Icons | `chevron-double-up` | Austin Andrews |
| Range | Material Design Icons | `target` | Doug C. Hardester |
| Move | Material Design Icons | `arrow-all` | Austin Andrews |
| Action | game-icons.net | `skoll/fist` | Skoll |
| Sight | Material Design Icons | `eye` | Google |
| Embarked | Material Design Icons | `anchor` | Google |
| Pillaging | game-icons.net | `sbed/fire`, standing | sbed |
| Capturing | Material Design Icons | `flag-variant` | Austin Andrews |
| Hostile | game-icons.net | `lorc/crossed-axes` | Lorc |
| An attack that would kill | game-icons.net | `sbed/death-skull`, standing | sbed |

The files:

- A Material Design file is `https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/<file>.svg`, saved as `public/assets/material-design-icons/<file>.svg` and changed in one thing: its path is filled white, `fill="#fff"`, as the game-icons files are, and a comment inside the file says so, `<!-- Material Design Icons 7.4.47, Apache 2.0. Changed: the path is filled white. -->`. Beside them, untouched: `https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/LICENSE` as `LICENSE`, and `https://www.apache.org/licenses/LICENSE-2.0.txt` as `LICENSE-APACHE-2.0.txt`.
- A new game-icons file is `https://game-icons.net/icons/ffffff/transparent/1x1/<author>/<name>.svg`, saved as `public/assets/game-icons/<name>.svg`, as downloaded: white on nothing already.
- `public/assets/game-icons/hearts.svg` and `flying-flag.svg` are deleted.

`docs/LOOK.md`, a section added after _Two families_:

> ## The cast ✅
>
> Each symbol wears one glyph, and a meaning wears that one sign wherever it is read: health's heart at the foot of a health bar and on a unit's card, the flame and the flag on a prepared unit's badge and on its card's state line, move's arrows for a terrain's movement cost, population's sign for the idle count and for a worked tile.
>
> | Symbol | Its sign | From |
> | --- | --- | --- |
> | Food | an apple | Material Design Icons, `food-apple` |
> | Production | a hammer | Material Design Icons, `hammer` |
> | Military | two crossed swords | Material Design Icons, `sword-cross` |
> | Money | two coins | game-icons.net, Delapouite's Two coins |
> | Science | a lit bulb | Material Design Icons, `lightbulb-on` |
> | Culture | two joined notes | Material Design Icons, `music` |
> | Population | a head and shoulders | Material Design Icons, `account` |
> | Influence | a star | Material Design Icons, `star` |
> | Health | a heart | Material Design Icons, `heart` |
> | Damage | a sword | Material Design Icons, `sword` |
> | Bonus | two chevrons pointing up | Material Design Icons, `chevron-double-up` |
> | Range | a ring under a cross, a sight's | Material Design Icons, `target` |
> | Move | four arrows from one point | Material Design Icons, `arrow-all` |
> | Action | a fist | game-icons.net, Skoll's Fist |
> | Sight | an eye | Material Design Icons, `eye` |
> | Embarked | an anchor | Material Design Icons, `anchor` |
> | Pillaging | a flame | game-icons.net, sbed's Fire |
> | Capturing | a flag | Material Design Icons, `flag-variant` |
> | Hostile | two crossed axes | game-icons.net, Lorc's Crossed axes |
> | An attack that would kill | a skull | game-icons.net, sbed's Death skull |

`docs/LOOK.md`, _The packs_, the Material Design Icons entry becomes:

> - **Material Design Icons**, the Pictogrammers' set, Apache 2.0 for every icon but those of its Brand / Logos category, which the game takes none of: each glyph's categories are read on its own page as it enters, its author is named in the licence record, a file the game changed says so, and the licence ships beside the files.

`docs/ASSET-SOURCES.md`, in the licence shorthand, "**Apache 2.0** and **MIT** ask for the licence's text beside the files and no credit." becomes:

> **Apache 2.0** and **MIT** ask for the licence's text beside the files and no credit, Apache 2.0 also that a changed file says it was changed.

and under _Art_ the Material Design Icons entry becomes:

> - [Material Design Icons](https://pictogrammers.com/library/mdi/) — the Pictogrammers' set, several thousand filled interface icons, Apache 2.0 but for its Brand / Logos category, each icon's page naming its author and its categories. The symbols that are plain forms.

`public/assets/LICENSES.md`, the game-icons.net entry becomes:

> - **What:** five glyphs, white on nothing, in `game-icons/`: Fire by sbed, Death skull by sbed, Two coins by Delapouite, Fist by Skoll and Crossed axes by Lorc.
> - **From:** <https://game-icons.net>, `1x1/sbed/fire`, `1x1/sbed/death-skull`, `1x1/delapouite/two-coins`, `1x1/skoll/fist` and `1x1/lorc/crossed-axes`, the SVG files as downloaded on the day they entered.
> - **Licence:** CC BY 3.0, <https://creativecommons.org/licenses/by/3.0/>. Credit is required: "Fire" and "Death skull" by sbed, <http://opengameart.org/content/95-game-icons>, "Two coins" by Delapouite, <https://delapouite.com>, "Fist" by Skoll, and "Crossed axes" by Lorc, <https://lorcblog.blogspot.com>, from game-icons.net under CC BY 3.0. The files may be modified; this record ships with the build and is their credit until the credits screen reads it.

and an entry is added after it:

> ## Material Design Icons
>
> - **What:** fifteen glyphs, white on nothing, in `material-design-icons/`, the Pictogrammers' licence and the Apache 2.0 text beside them: `food-apple`, `lightbulb-on`, `music`, `sword`, `chevron-double-up`, `arrow-all` and `flag-variant` by Austin Andrews; `hammer`, `account`, `star`, `heart`, `eye` and `anchor` by Google; `sword-cross` by Michael Richins; `target` by Doug C. Hardester.
> - **From:** the Pictogrammers, <https://pictogrammers.com/library/mdi/>, the `@mdi/svg` package, version 7.4.47. Each file is changed in one thing, its path filled white, and a comment in the file says so.
> - **Licence:** Apache 2.0, <https://www.apache.org/licenses/LICENSE-2.0>, for every icon but those of the set's Brand / Logos category, as <https://pictogrammers.com/docs/general/license/> has it; none of the fifteen is in that category, each glyph's page read on 2026-11-14. The licence's text ships beside the files and a changed file says it was changed; no credit is required.

No player-facing sentence is added or changed.

**Doc-impact:** `docs/LOOK.md`, `docs/ASSET-SOURCES.md`.

**Scope:** In: the eighteen new files and the two licence texts, the two deletions, the licence record, the heart at a health bar's foot and the glyph of a capture's badge reading the cast's files, the two specs that name those files, the pages. Out, each a later line's: any glyph drawn where a diamond or a word stands today, every colour, and the dark outline; the pool holds what the user picked for them.

- The heart keeps its square of 6 units and the badge's glyph its 8, as the casting page drew them: Material Design draws with more margin in its box, so the heart's ink goes from about 5.3 by 5.3 units to 5.0 by 4.6 and the flag is narrower than Lorc's. No size, place or colour on the map changes, and `docs/LOOK.md`'s paragraphs on the badge and the health bar stand as written.
- Sixteen of the files are drawn by nothing until the lines after this one; they enter now, with their record.
- Reconcile, as the user chose: the new files go through the standing folder and record as they are, a sibling folder for the second set with its licence beside it as the font's is; a glyph becomes white in its file, the standing convention, the Material Design files whitened to it; the heart's and the skull's dark edge is left alone, the renderer's line making it one with the outline.

**Traps:**

- A glyph's file path under `public/assets/` is also its frame's name in the units sheet, and `e2e/attack.spec.ts` and `e2e/pillage.spec.ts` each hold the names in a table of their own.
- The badge tints its glyph, so a file left black shows black on the badge and no spec reads that pixel: the whitening is checked in the files.
- Phaser rasterises an SVG once, at the size the loader is handed (`docs/PHASER.md`); the Material Design files are drawn in a box of 24 where game-icons' is 512, and neither carries a width or a height.
- The two licence texts carry no `.md`: Prettier checks every markdown file outside `public/assets/fonts/` and `public/assets/store/`.
- `public/assets/store/` is a submodule; the new folder is the repository's own.

**Plan:**

1. The files: the fifteen Material Design glyphs whitened and commented, the two licence texts, the three game-icons glyphs; standing: every file of the cast on disk.
2. The map: the health bar's heart and the capture's badge read the cast's files, the two old files deleted, the two specs' tables following; standing: the game draws the new heart and the new flag, and nothing names a file that is gone.
3. The record and the pages: `public/assets/LICENSES.md`, `docs/LOOK.md`, `docs/ASSET-SOURCES.md`, as written out above.
4. The board line and this dossier deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; every file in `public/assets/material-design-icons/` but the two licence texts holds `fill="#fff"` and the comment. The proof spec is `npx playwright test e2e/pillage.spec.ts`, the badge of a capture wearing the cast's flag. CI proves on the push: `e2e/attack.spec.ts`, the heart at a health bar's foot, and the rest of the suite.
