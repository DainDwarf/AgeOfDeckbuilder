# Warn when the game cannot save

**Line:** Warn when the game cannot save — `npx playwright test e2e/refused-save.spec.ts` passes, proving that a browser refusing its storage from the start boots onto the campaign screen with the refused-save window standing, that Back takes it down and the game runs on, and that a write refused mid-chronicle raises the window over the chronicle screen once, a second refused write raising nothing; `docs/INTERFACE.md` holds the section _A refused save_. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`, three edits, written out:

1. A new section right after _A failed boot_:

   > ## A refused save ✅
   >
   > When the browser refuses to keep what the game writes — the save, or the keys the player binds — the game says so once, in a window on a scrim of its own: that the game cannot save, and that what is played from then on is lost when the page closes. Back, the back key or a press on the scrim takes it down and play goes on, and the window is not raised again until the page is loaded again; a browser that refuses its storage from the start raises it at the boot, and the game starts on a new campaign and the keys as they began.

2. _What stands over what_, second paragraph: after the sentence ending "…the button among it." and before "The **debug console** stands over all of it.", insert: "The window a refused save raises stands over the menu, on a scrim of its own."

3. The page's summary line (line 3): "…the launch page, a failed boot, the debug console, …" becomes "…the launch page, a failed boot, a refused save, the debug console, …".

Player-facing text, each one entry (no entry ends in a period, the standing text rule):

- Title: `The game cannot save`
- Line under it: `This browser refuses the save: what is played from here is lost when the page closes`
- Button: `Back` — the existing `control.back` entry may be reused if the implementer finds it fits; no new wording.

**Doc-impact:** `docs/INTERFACE.md`, as above. `docs/META.md` untouched: the user's call is that this is error handling like the failed boot, not the meta's design; `DOGMAS.md` untouched: _No handholding_ is about warnings against a player's press, and this one is not.

**Scope:**

- In: every storage access the game makes — the save's read, write and remove in `src/ui/save-entry.ts`, the bindings' read and write in `src/ui/bindings.ts` — survives a refusal, and any refusal raises the one window.
- In: a storage that refuses its read outright (the accessor throws) is known at the boot: the game boots on a new campaign and default bindings, and the window stands once the first screen does.
- In: a refused write later (full storage: `QuotaExceededError`), on any screen, raises the window at that moment over whatever stands.
- Once per page load: after the first raise, no refusal raises it again, whatever the storage does after. A write that later goes through takes nothing back.
- The browser's own error words stay on the console (`console.warn`, as today) and never on the window.
- Corner — a refusal while a menu window stands (a rebind from Controls writes the bindings): the refused-save window stands over it and closes back to it.
- Corner — a refusal while the debug console stands: the console stays over everything; the window stands under it, over the menu.
- Corner — the window stands like a menu window: while it stands no key and no press reaches beneath; the back key backs it out first, before anything under it.
- Corner — the address word `continue` on a storage refusing its read: the save holds no chronicle, so the boot fails as it does today ("the save holds no chronicle to continue"). Unchanged.
- Out: any retry, any other storage, any export of the save, any Save button. The dropped-save console messages of `docs/META.md` → _The save_ are unchanged.

**Traps:**

- **Today a refused read is a black screen, not a failed boot.** `bindings()` in `src/ui/bindings.ts` reads `window.localStorage` unguarded, and `src/ui/map.ts` and `src/ui/tree.ts` call it on every `UPDATE`, `src/ui/menu.ts` when Controls lays out. With the accessor throwing (`Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('…', 'SecurityError') } })`), the first update throws after `booted()` (`src/failed-boot.ts`) has removed its listener: the loop stays at frame 0 on a black canvas and the failed-boot page never shows. Measured in intake. `keep()` in the same file writes unguarded too.
- `readEntry` in `src/ui/save-entry.ts` already catches a refused read and returns a fresh campaign, but its `storage.removeItem` is unguarded, and `kept` only warns; neither tells anyone else.
- A refusal can be met before any scene exists: `firstScreen()` in `src/main.ts` reads the save before the `Phaser.Game` is built, and the campaign screen reads it in its `create`. What was refused has to be remembered until the window can be raised.
- The window stands over the menu: scenes render in add order and take keys in start order (`src/main.ts`, `docs/PHASER.md`); the console is added and started last and must stay topmost.
- A scrim rising ends every hover and lets go of a held press under it (`docs/INTERFACE.md` → _What stands over what_): a card, unit or population being carried when a write is refused comes home. Writes happen after commands, so this should not bite, but the menu's scrim machinery already does it and is the precedent to follow.
- **The spec's two storage tricks and `plant`:** `plant` (`e2e/chronicle-screen.ts`) writes the save through an init script calling `localStorage.setItem`; init scripts run in the order they were added, so a spec that plants then refuses writes must add the refusing script after `plant`'s. Replacing `Storage.prototype.setItem` with a thrower makes writes refuse and leaves reads working; redefining the `localStorage` accessor to throw refuses everything.
- `watch(page)` counts `console.error` and page errors only; the refusal's `console.warn` does not trip it, so the spec can assert a clean run.

**Plan:**

1. Storage access that survives: the bindings' read and write, and every save access, catch a refusal; a refused read gives default bindings and a new campaign; the game boots and runs on a blocked storage. Leaves the black screen gone.
2. One record that a refusal happened, set from every catching site, and the window raised from it once per page load, over the menu and under the console, on a scrim of its own, with the title, the line and Back; Back, the back key and a press on the scrim take it down. Leaves the warning on screen.
3. `docs/INTERFACE.md`: the three edits as written above. The comment on `kept` in `src/ui/save-entry.ts` ("storage that refuses it leaves play going on") re-shaved to its trap or removed.
4. `e2e/refused-save.spec.ts`: storage refused from the start → campaign screen with the window, Back takes it down, frames advance, clean `watch`; storage whose writes refuse, a chronicle planted and continued → the first command (ending a turn) raises the window over the chronicle screen, and after it is taken down a second command raises nothing. Every string read from `text()`, never a literal.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof: `npx playwright test e2e/refused-save.spec.ts`.
- CI's, listed for the hand-back, never run locally: `e2e/boot.spec.ts`, `e2e/failed-boot.spec.ts`, `e2e/menu.spec.ts`, `e2e/controls.spec.ts`, `e2e/campaign.spec.ts`, `e2e/continue.spec.ts`, `e2e/resume.spec.ts`, `e2e/console.spec.ts`, and the rest of the suite.
- A new window on screen: the ship runs the `visual-check` skill on it.
