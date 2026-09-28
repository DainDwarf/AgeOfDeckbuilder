# Export and import of saves

**Line:** **Export and import of saves** — the menu lists **Manage Save** on every screen, whose window exports the save as a save file, imports one through a warning, and clears the save through a warning, the campaign screen standing after either; `e2e/manage-save.spec.ts` proves the three doors, a save file read with a part dropped and a file refused. Doc-impact: `docs/INTERFACE.md`, `docs/META.md`.

**Spec:** `docs/INTERFACE.md`, _The menu_; `docs/META.md`, _The save_. `docs/GLOSSARY.md` has already lost _save file_ from the words **save** forbids, in the intake's commit: a save file is what the window and the pages call the file.

In `docs/INTERFACE.md`, _The menu_, the first sentence "The menu lists **Settings** and **Campaign**, which leaves the chronicle as [`META.md`](META.md) says." becomes:

> The menu lists **Manage Save**, **Settings** and **Campaign**, which leaves the chronicle as [`META.md`](META.md) says.

And one paragraph is added at the end of the section, after the Controls paragraph:

> **Manage Save** is listed on every screen and opens a window that says the game saves by itself, over four buttons. **Export save** hands the player the save as a save file, through the browser's own download, and changes nothing. **Import save** opens the browser's own file window, and the file chosen is read before anything is asked: one that is not a save of this game is refused in a line on the window, the save standing as it was. **Clear save** takes the save back to a new campaign. An import and a clear each go through a warning, always, whatever the save holds: the window's buttons give way to what the press discards, in one sentence, over the press itself and **Back**; where the file read with a part dropped, the import's warning says so in a second sentence under the first. Back, the back key or a press on the scrim takes the warning down, one step, onto the window's four buttons, and nothing has changed. The press gone through, the campaign screen stands on the save as it now is, whatever screen the menu stood over and whatever the address names. **Back** closes the window as it does Controls.

In `docs/META.md`, _The save_, one paragraph is added after the section's paragraph:

> The save leaves the player's machine as a **save file**: the save whole, the campaign and the chronicle in progress, encoded in base64 in a file named `age-of-deckbuilder-save-<date>.adbsave`, the date the player's own day. The keys the player binds are not the save's: a save file carries none, and neither an import nor a clear touches them. An import replaces the save whole with what the save file holds, and a clear with a new campaign; either ends the chronicle in progress, which pays nothing. A save file is read as the boot reads the save, with the same two fates: the chronicle it holds is kept whole or dropped, the campaign drops what it cannot resolve, and the reasons are said on the browser's console alone. One that is not a campaign's shape at all is refused and nothing is replaced. Why the same reading: a save the boot would open is one a player can send.

The player-facing sentences, each one entry of the text table, written out:

| Where | It reads |
| --- | --- |
| The menu's button, and the window's title | `Manage Save` |
| The line under the title | `The game saves by itself. This is for a copy to keep or to send.` |
| The window's first button | `Export save` |
| The window's second button, and the press of the import's warning | `Import save` |
| The window's third button, and the press of the clear's warning | `Clear save` |
| The import's warning | `Importing replaces the campaign and the chronicle in progress. This cannot be undone.` |
| Under it, where the save file read with a part dropped | `Part of this save file is not compatible with this version of the game and will be left out.` |
| The clear's warning | `Clearing erases the campaign and the chronicle in progress. This cannot be undone.` |
| The line a refused file raises on the window | `This file is not a save of this game.` |

Back, on the window and on a warning, reads the entry the menu already holds for it.

**Doc-impact:** `docs/INTERFACE.md`, `docs/META.md`.

**Scope:**

In:

- The menu's entry, first in its list, and its window: the line, the three buttons, Back.
- The export through the browser's download, the import through the browser's file window, the clear.
- The warning an import and a clear go through, and the second sentence of the import's.
- The reading of a save file: refused, whole, or with a part dropped.
- The campaign screen standing after an import or a clear.
- The nine entries above in the text table, and the two docs edits.

Out:

- The warning a launch raises over a chronicle with achievements reached: another rung's, and neither warning here names an achievement.
- The keys the player binds: exported by nothing, touched by nothing here.
- Any envelope around the save in the file — a schema number, a date inside it: the chronicle names the content version it was written on, and the campaign's reading drops what it cannot resolve.
- A desktop home for the save file: the desktop line's.
- Any new colour: the press of a warning is drawn as every button of the menu is, and the refused line and the warning's sentences in the window's ink.

Corner cases, decided:

- **What is refused.** A file that is not base64, one whose decoded text is not a save's, and one that holds no campaign the reading can take: the one sentence for all three, the reason on the browser's console in the reading's own words, the save untouched and no warning raised.
- **What is a part dropped.** Anything the reading names as dropped while a campaign still stands: the chronicle, an ended one among them, or anything of the campaign. One sentence whatever was dropped and however much.
- **The file window closed with no file chosen** changes nothing and says nothing.
- **The refused line stands** until a button of the window is pressed or the window closes; a second refused file leaves the one line.
- **The same file chosen twice in a row** is read twice.
- **Export holds the save as the game holds it at the press**: over a chronicle, that chronicle after its last command; over the ending screen, the campaign paid and no chronicle; on a campaign never yet written to the browser, that new campaign. A browser that refuses its storage exports what the game holds all the same.
- **A write the browser refuses** at an import or a clear raises the refused-save window as any refused write does, once per page load, and the campaign screen stands on the save imported or cleared, which lasts until the page closes.
- **Over the ending screen** an import or a clear takes the ending screen down with the rest; the chronicle has paid already, into the campaign being replaced.
- **The warning is one step**: the back key and a press on the scrim take it down onto the four buttons, and a second one steps back to the menu. While a warning stands, its two buttons are the window's only ones.
- **The window opened again** after it was closed over a warning or a refused line opens on its four buttons and no line.
- **The debug console** is closed and its entries put back by nothing here: an import or a clear is no new chronicle.
- **The date** in the file's name is the day on the player's machine, year, month, day, and two exports on one day bear one name; the browser tells them apart or asks.

**Traps:**

- `DOGMAS.md`, _Stack_: all UI is Phaser and `index.html` carries no UI. The download and the file window are the browser's own and are reached through elements the page never shows and never keeps; nothing of them is drawn or styled.
- The browser opens a file window and starts a download only from inside a press of the player's. `docs/PHASER.md`, _Under a Playwright spec_, says a DOM press is tested from its own handler; which of Phaser's events the menu's buttons answer, and whether that event is still inside the DOM handler, is read from the pinned package before the door is built on it.
- The file chosen is read asynchronously, and the window may have been closed, or the menu taken down by a screen rising, before the text arrives: what arrives for a window that no longer stands raises nothing.
- `src/ui/save-entry.ts` reads the browser's entry once and answers from what it holds from then on, and every screen reads the campaign through it as it is created; the menu scene is never stopped and outlives every screen (`docs/PHASER.md`, _Across a restart_). After an import or a clear no screen may still stand on the old campaign, and no chronicle screen may write the old chronicle back over the new save with a command still playing out.
- The address may name `continue`, the developer's door: a page loaded again on that address opens the chronicle the save holds and fails the boot where it holds none, which a clear leaves. The campaign screen stands all the same.
- `btoa` refuses a character outside Latin-1, and a civilization's name is text in the save: the encoding goes through the text's bytes.
- `writeSave` refuses a save the reading would drop anything of, so what an import keeps is the save as read, the drops already out of it, never the file's own text.
- `src/rules/` never touches the DOM: the reading of a save file's text is pure and has its Vitest file, and the file, the download and the storage stay in `src/ui/`. In `src/ui/`, `src/content/` is imported by a scene and by `src/ui/save-entry.ts` alone.
- `MenuWindow` and `MenuPress` in `src/ui/menu.ts` are closed unions the menu scene switches over; the Controls window is the one that carries a Back button and a body of its own.
- The glossary lint reads `src/ui/text.ts`; an entry that trips it on a word used in its plain sense is marked at its end as the entries there already are, and the report says which.
- `e2e/chronicle-screen.ts`'s `plant` writes its save on the first page load alone, so a page loaded again in a spec finds what the game left.
- Playwright hands a spec the download and the file window as page events; that a file window opened from an element outside the document raises that event is unverified, and is the first thing the spec's author checks.
- A local Playwright run names its spec; a hook refuses one that names none.

**Plan:**

1. `src/ui/text.ts` — the nine entries stand in the text table.
2. The reading and the writing of a save file's text, pure, with its Vitest file beside it — a save written as a save file reads back whole, one holding a chronicle the reading drops reads as the campaign with a part dropped, and what is not base64, not a save's text or not a campaign's shape is refused; each on the fixture catalogue.
3. `src/ui/save-entry.ts` — the save as the game holds it is answered as a save file's text, and the save is replaced by one read or by a new campaign, the browser's entry written with it.
4. `src/ui/menu.ts`, `src/ui/menu-scene.ts` — the menu lists Manage Save first; its window stands with its line, its three buttons and Back; the warning takes the buttons' place and steps back as a window does; the refused line stands on the window; the two browser doors open from their buttons; the campaign screen stands after the press gone through.
5. `e2e/manage-save.spec.ts`, with `e2e/chronicle-screen.ts` for a helper two specs would share — the tests below.
6. `docs/INTERFACE.md`, `docs/META.md` — the edits of the Spec, verbatim.
7. `workflow/BOARD.md` — the line deleted, this file with it.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/manage-save.spec.ts`, a new spec, every save it compares read through the rules' own reading and none a literal. Over a chronicle opened on the save the spec wrote: the menu lists Manage Save and its window reads its title, its line and its buttons; Export save downloads a file named as the pages say, whose text reads as the save planted, whole. Clear save raises its warning reading its sentence, Back takes it down with the save untouched, and the press gone through leaves the campaign screen standing on a new campaign, no chronicle in the browser's entry, and the entry the keys are kept under as it was. Import save on the file exported raises the warning with no second sentence, and the press gone through leaves the campaign screen standing and the browser's entry reading as the file's save. Import save on a file whose chronicle names a content version the game does not ship raises the warning with the second sentence, and the press gone through keeps the campaign and no chronicle. Import save on a file that is no save raises the refused line and no warning, the browser's entry as it was.
- CI's, on the push, listed for the hand-back: `e2e/menu.spec.ts`, `e2e/controls.spec.ts`, `e2e/refused-save.spec.ts`, `e2e/boot.spec.ts`, `e2e/continue.spec.ts`, `e2e/resume.spec.ts`, `e2e/campaign.spec.ts`, `e2e/launch.spec.ts`, `e2e/console.spec.ts`, `e2e/ending.spec.ts`.
