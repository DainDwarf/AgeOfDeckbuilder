# The help sign's arrow

**Line:** **The help sign's arrow** — the help sign is the arrow worn everywhere with a question mark at its top right, made from two of the pack's pictures and pointing with the arrow's tip; its two files stand in the store in place of the lone question mark's, and the licence record says how they were made; `e2e/cursor.spec.ts` passes. Doc-impact: `docs/LOOK.md`, `public/assets/LICENSES.md`.

The settled page stays on the user's disk, the pack's terms forbidding its upload: `.playwright/help-page/help-sign.html`, the real chronicle screen with a unit selected, the pointer wearing what the game wears at each point. The pick, pasted: "The help sign: composed, the normal arrow with the question mark 18 tall, its left edge at 20 and its top at 0, extra dark line 0.25; The arrow: as it is". Served and not taken: the lone question mark as it ships, and the pack's own arrow-with-a-question-mark (`question001`), whose arrowhead is the pack's small one, 15 across where the arrow is 26.

**Spec:**

`docs/LOOK.md`, _The pointer_, its first paragraph:

- "the help sign, a question mark," becomes "the help sign, the arrow with a question mark at its top right,".
- "The arrow points with its tip and the pointing hand with its fingertip; every other picture points with its middle." becomes "The arrow and the help sign point with the arrow's tip and the pointing hand with its fingertip; every other picture points with its middle. The help sign is made from two of his pictures, the arrow whole and his lone question mark shrunk into its top right corner, so it reads as the arrow with a question asked."

`docs/LOOK.md`, _The packs_, Deburger's bullet: "the pointer's nine pictures." becomes "the pointer's nine pictures, the help sign made from two of his."

`public/assets/LICENSES.md`, _Fantasy RPG Cursors (gold)_, the **What:** line becomes:

- "**What:** nine of Leonid Deburger's painted cursors, each at 32 and at 64 px, in `store/fantasy-rpg-cursors-gold/`, the pack's `Standard_Asset_Licence.docx` beside them: `pointer002`, `hand002`, `hand003`, `hand004`, `denied001`, `walk001`, `sword001` and `pointer013`, eight of the pack's 120, and `arrow-question`, made from two of them: `pointer002` whole, with the ink of `question002` shrunk to 18 pixels tall and laid from 20 pixels across and 0 down, under a dark line a quarter of a pixel wide in the pack's own brown, `rgb(56, 31, 5)`; at 64 px, `pointer002`'s 64 px picture with the same question mark at twice those numbers."

The **From:**, **Licence:** and **Credit:** lines stay: his terms let the pictures be changed for the game, and the composed file is under them as the rest are.

No entry of the text table: the pointer reads no word.

The help sign's row, as the cursor table holds it:

| The pointer wears | File | Points at | If the picture fails, the browser's |
| --- | --- | --- | --- |
| the help sign | `arrow-question.png` | 1, 0 | `help` |

**Doc-impact:** `docs/LOOK.md` (_The pointer_, _The packs_), `public/assets/LICENSES.md` (_Fantasy RPG Cursors (gold)_). `docs/INTERFACE.md` stays: it names the help sign by what it means, never by its picture.

**Scope:**

In: the two composed files into the store and `question002`'s two out of it, the store pushed; the help sign's row of the cursor table; the licence record's **What:** line; the two `docs/LOOK.md` paragraphs; one expectation in the proof spec.

Out: every other picture, the arrow among them ("The arrow: as it is"); the pack's own `question001`; where the help sign is worn, which `docs/INTERFACE.md` settles and this line does not move; a line of `CHANGELOG.md`.

Corner cases, decided:

- **The point moves from the middle to the tip**, the arrow's own, `1, 0`: the help sign now points where every arrow does. Nothing the game reads depends on it; the browser alone draws the picture about that point.
- **The two files are made once, not by the game.** They stand at `.playwright/help-page/32/arrow-question.png` and `.playwright/help-page/64/arrow-question.png` on this machine, written from the settled page's own drawing at the picked values, and are copied into the store as they are. No tool to make them enters the repository: a change to them is a new pitch.
- **`question002` leaves the store** at both sizes, the store holding what the game draws; the record names it as the source of the composed file's question mark.
- **The fallback stays `help`**, the browser's question-mark arrow, which is what the composed picture says.

What the reconcile chose: nothing in the tree composes a pointer picture or any other image out of two; the composed file enters the store beside the eight others and goes through the cursor table as they do.

**Traps:**

- **Nobody opens the pack's pictures with a model, the composed ones included**: they are made from his files, and the licence forbids feeding them to an AI model. Copy, list and measure them by commands, never read one as an image. A CSS cursor is never in a Playwright screenshot, so no shot shows them either. Measured at intake, by script: at 32 px the file keeps 401 of the arrow's 406 solid pixels and changes 129, all from 20 to 29 across and 0 to 17 down; at 64 px it keeps 1,506 of 1,512 and changes 451, from 40 to 60 across and 0 to 36 down.
- **The files are on this machine alone.** `.playwright/` is ignored by git; the store is where they become everyone's, and nothing else has them.
- **The store is pushed before the pointer moves on `main`** (`DOGMAS.md`, _Assets carry a licence record_): `public/assets/store/` is a submodule, its own commit and push first, then the submodule pointer rides the delivery's commit.
- **`cursorNamedBy` in `e2e/chronicle-screen.ts` tells a picture by its file name**, matching `/<file>"` in the style: `arrow-question.png` collides with no other file's name.
- **A picture the browser cannot fetch leaves the fallback silently** (`fetchCursors` swallows a failed decode), and the proof spec reads the style, never the picture: the file name in the table is checked against a listing of the store's two folders.

**Plan:**

1. The store: the two files copied into `fantasy-rpg-cursors-gold/32/` and `fantasy-rpg-cursors-gold/64/`, `question002.png` removed from both, committed and pushed in the store's own repository. Leaves the store holding what the game will draw, `main`'s pointer unchanged.
2. `src/ui/cursor.ts`, the help sign's row as the table above; the submodule pointer moved to the store's new commit; the licence record's **What:** line. Leaves the game wearing the composed help sign on every screen.
3. `e2e/cursor.spec.ts`: the test that reads the help sign over a stat of the summary also expects the canvas's style to name `/32/arrow-question.png` at `1 0` with `help` after it. Leaves the proof naming the picture.
4. The two `docs/LOOK.md` paragraphs, and the line deleted from `workflow/BOARD.md` with this file.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/cursor.spec.ts -x`.
- CI proves on the push: `campaign`, `civilization-mode`, `deck-editing` and `reference`, which read the help sign; `credits`, which reads the licence record; and the rest of the suite.
