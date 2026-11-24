# Credits and licences in the game

**Line:** **Credits and licences in the game** — the menu lists Credits, whose window reads the makers' list off the packs' licence record and opens the licences' page; the menu's first window carries the three links and the version; `e2e/credits.spec.ts` passes. Doc-impact: `docs/INTERFACE.md`, `docs/LOOK.md`.

The settled mockup is https://claude.ai/artifact/FC1Qzpx853E1McciQpsxan, on the picks `linkForm=sign; icons=one; sites=both; site=underlined; links=rule; linkPiece=well; version=both; versionAt=under; list=stacked; licences=none; pair=side` and `ruleRoom=28; linkH=40; linkGap=14; versionSize=12; roleSize=14; nameSize=18; entryGap=12`. A detail of that page the sentences below do not contradict is an instruction.

**Spec:**

`docs/INTERFACE.md`, _The menu_.

- The first sentence becomes: "The menu lists **Manage Save**, **Settings**, **Credits** and **Campaign**, which leaves the chronicle as [`META.md`](META.md) says."
- A paragraph after Manage Save's: "**Credits** is listed on every screen and opens a window that names who made the game and what it is made of: a heading for each thing given, over the makers who gave it, the game's own maker first and its engine last. Between the two stand the packs, read off the packs' licence record in the record's order: packs that share a credit read as one line, credits that share a heading stand under one, at the place of the first, and a pack whose entry holds no credit takes no line. An address on a line reacts to a left click, which opens its site. **Licences** opens the licences' page: the game's licence, the packs' licence record and the notices of the code the game bundles, one under the other, as plain text. **Back** closes the window as it does Controls."
- A paragraph after it: "Under what the menu lists, set apart by a rule, stand three **links**, to the game's page on itch.io, its repository on GitHub and its server on Discord, each a square wearing its mark and no word; the pointer resting on one raises a tooltip under it reading its name, and a left click opens it. A link, an address and Licences each open in a new tab of the browser, and the game stands as it was."
- A paragraph after it: "The **version** stands at the foot of the menu's first window and of Credits, the version the build was made at: a version's own name on a version, and between two the last one's name, how many commits came since and the commit's own id."

`docs/INTERFACE.md`, _What stands over what_, after the paragraph's first sentence on a tooltip ("A **tooltip** stands over everything but the menu and the console, on the surface it was raised from: …"): "The menu is such a surface too: the tooltip a link raises stands over the menu's window, and a scrim rising over the menu takes it down as it does any tooltip."

`docs/LOOK.md`, _The cast_, three rows at the table's foot, each its symbol, its sign and where it is from:

- The itch.io link; itch.io's mark; Simple Icons, `itchdotio`
- The GitHub link; GitHub's mark; Simple Icons, `github`
- The Discord link; Discord's mark; Simple Icons, `discord`

`docs/LOOK.md`, _The chrome_.

- **A window**, added at its end: "Credits' Licences and Back stand side by side too, Licences on the left. Credits' list stands centred, each heading set smaller and in a fainter ink over its makers' lines, which read in the window's ink, the headings a little apart; an address that opens its site is underlined by a thin line of its own ink, thicker under the pointer. The version stands centred at a window's foot, on a line of its own, set at the smallest size, in the fainter ink. The menu's three links stand in a row under what it lists, centred, a faint rule between the two as over the wheel's two rows in Controls."
- **A well**, added after "Under the pointer such a well is lighter, as a pile's round is.": "A link is a well too, a square as the Menu button's, wearing its mark in the pale ink and with no outline, as wide a share of its square as a button's sign is."

`docs/LOOK.md`, _The packs_.

- Baumgart's bullet ends "and the credit stands on the Credits window."
- game-icons.net's becomes: "**game-icons.net**, CC BY 3.0: each glyph's author is named on the Credits window, and its title and its licence in the licence record, which the licences' page shows."
- A new bullet at the foot: "**Simple Icons**, CC0: the marks of itch.io, GitHub and Discord. A mark stays its brand's, and each brand's own rules are what the game draws it by: in one flat ink, black or white, unaltered, with no outline and no effect."

`public/assets/LICENSES.md`.

- The opening paragraph's first sentence ends "…and what the licence requires (attribution text, share-alike, a no-resale clause), and, where the pack takes a line on the Credits window, its credit: what it gave, then who gave it."
- Each of David Baumgart's seven entries gains `- **Credit:** Map and painted icons: David Baumgart, [dgbaumgart.com](https://dgbaumgart.com)`
- Nice Card Game Template 2: `- **Credit:** Card frames: chicogames`
- UIForge metal kit: `- **Credit:** Interface: DRStudios`
- game-icons.net: `- **Credit:** Icons: sbed, Delapouite, Skoll, Lorc and Faithtoken, [game-icons.net](https://game-icons.net)`, and its Licence bullet's last sentence becomes "The files may be modified; the Credits window names the authors, and this record, shown on the licences' page, each glyph's title and its licence."
- Material Design Icons: `- **Credit:** Icons: Material Design Icons, the Pictogrammers`
- Source Sans 3: `- **Credit:** Typeface: Source Sans 3, Adobe`, and its entry moves under Material Design Icons', the record's order being the list's.
- A new entry at the foot, with no credit: "## Simple Icons" — **What:** three marks, white on nothing, in `simple-icons/`: itch.io's, GitHub's and Discord's. **From:** Simple Icons, <https://simpleicons.org>, `itchdotio`, `github` and `discord`, the `simple-icons` package at the version current on the day they enter, named here, each file changed in one thing, its path filled white. **Licence:** CC0 1.0 for the set, as its `LICENSE.md` has it; its `DISCLAIMER.md` leaves each mark to its brand's own rules, read on 2026-11-24. GitHub's, <https://brand.github.com/foundations/logo>: "Use the Invertocat logo as a social button to link to your GitHub profile or project", in white or black, unmodified, with no shadow and no gradient. Discord's, <https://discord.com/branding>: "Use the Discord Marks to inform people that you are a Discord user and/or that you have a Discord server", "in color, black or white", never edited or recoloured. itch.io's, <https://itch.io/press-kit>: black and white versions handed out, "do not distort, add additional effects, or resize without preserving the aspect ratio", no rule stated on linking. No credit is required.

Player-facing entries, each one entry of the text table.

- The menu's entry and the window's title: `Credits`
- Credits' left button: `Licences`
- The game's heading and line: `A game by` over `Adrien Panhaleux (DainDwarf)`
- The engine's heading and line: `Engine` over `Phaser, Phaser Studio`
- The three tooltips: `itch.io`, `GitHub`, `Discord`
- The headings and lines of the packs are the record's credits above, read and never retyped.

The addresses the links open: `https://daindwarf.itch.io/age-of-deckbuilder`, `https://github.com/DainDwarf/AgeOfDeckbuilder`, `https://discord.gg/W2PnqbGgkv`.

The licences' page, plain text, three parts in this order, each under its heading on a line of its own and two parts set apart by a blank line, a row of 72 `=` and a blank line: `THE GAME` over the repository's `LICENSE`; `THE PACKS` over `public/assets/LICENSES.md` as it is written; `THE CODE THE GAME BUNDLES` over the dependencies' notices the build writes.

**Doc-impact:** `docs/INTERFACE.md` (_The menu_, _What stands over what_), `docs/LOOK.md` (_The cast_, _The chrome_, _The packs_).

**Scope:**

In: the Credits entry and its window; the list read off the record; the credits written into the record and Source Sans 3's entry moved; the three links on the menu's first window, their marks in the cast and their pack in the record; the tooltip on the menu's surface; the addresses that open; the licences' page, on the build and on the dev server; the version on both windows, read as the itch push reads it; the tags fetched in the CI job that builds for Pages; the proof spec.

Out: a list longer than the screen, which is met when a pack makes it so (the user's call, 2026-11-24); a brand's own colour on a mark; anything else in the workflow file, which the deployment line after this one reworks; the desktop build's way of opening a site; a line of `CHANGELOG.md`.

Corner cases, decided:

- A link, an address and Licences react to a left click alone; the pointer is the hand over each, as over any thing that reacts to one.
- The tooltip under a mark covers the version line while it stands. Accepted.
- A tree with uncommitted changes reads its version with `-dirty` at its end, as the itch push names it. A shallow clone with no tag, CI's e2e runners among them, reads the commit's id alone. A tree git cannot describe fails the build, as it fails the itch push today.
- On the dev server, which bundles nothing, the licences' page holds its first two parts and no third, heading included.
- A credit the game cannot read — no heading before its first `: `, or an address that is not a markdown link to an `https` address — is refused where it is read, and the record's test fails on it.
- The itch.io link stands before the page is opened to everyone: until then a stranger meets itch.io's own refusal. Accepted by the user.
- With no licence named on a line, the two Creative Commons licences and the frames' recolouring are stated by the record on the licences' page, a press from the list.

The reconcile, each as chosen:

- A link's square goes through the pressable well as it stands — lighter under the pointer through its veil, no pressed look — at the Menu button's square, its sign drawn as a button's sign is.
- A mark's name goes through the standing tooltip, hung under the mark after the rest, on a tooltip surface the menu gains.
- The marks go through the cast as three more signs, white files tinted to the ink, the well's pale ink as it is.
- The rule is Controls' faint rule.
- An address stays apart from a name in brackets on a card: the underline is a new mark.
- The new tabs open beside Export save's download and Import save's file window, inside the press.
- Credits' headings stay apart from the launch warning's "What you will lose:", which keeps its size and ink.
- Credits' heading ink and the version's ink are each an entry of their own in the look, holding the value the log's turn heading reads in today.
- The version becomes one reading with the itch push's: both read it through one door.
- The record gains its credits and becomes what the list reads; the game's line and the engine's are text entries.
- The licences' page is made by the build, and served by the dev server less its third part.

**Traps:**

- A browser opens a tab only inside a press of the player's: the comment over `chooseFile` in `src/ui/menu-scene.ts` cites where Phaser dispatches a release from the DOM's own `mouseup`, and nothing between the release and the opening may await. The licences' page is therefore an address the build already holds, never a text fetched at the press.
- The dependencies' notices are written by Vite's own licence step at build alone (`build.license` in `vite.config.ts`, today into `LICENSE-DEPENDENCIES.md`); the dev server has none. `LICENSE`, `LICENSE-DEPENDENCIES.md` and `assets/LICENSES.md` go on shipping in the build as today: `DOGMAS.md` _Stack_ names the first two.
- The menu's scene never shuts down and holds no tooltip today; its windows are destroyed and laid again at every step. `docs/PHASER.md` _What the pointer is over_: an object destroyed under a resting pointer sends no `pointerout`, and the game's own reading takes hovers and tooltips down. `docs/PHASER.md` _Across a restart_ for a listener the scene would keep.
- `docs/PHASER.md` _Under a Playwright spec_: an object made interactive is hit-tested only from the next frame, and a spec cannot import a module that reaches Phaser, so what the spec reads its oracle through — the record's reading, the version's — lives in modules that import none.
- `src/ui/text-run.ts` lays a card's text in runs, the names in brackets among them pressable; it is read before a line holding an address is laid. Two lines hold one: David Baumgart's, and game-icons.net's, which runs onto a second row at the window's room.
- The proof spec lets no tab reach the network: it answers every request outside the dev server itself, empty, and reads the tab's address. CI's runners and the user's machine open no outside site from a spec.
- `actions/checkout` fetches one commit and no tag by default (`.github/workflows/ci.yml`), so the job that builds for Pages would read a bare commit id.
- The mockup's heights (the menu 396 units over a chronicle, Credits 601) were measured in a browser's text, not Phaser's: a fit is measured again on the game. The settled measures are the picks at the head of this file: the rule's room 28, a link 40 square, 14 between two, the headings at 14 and the lines at 18 with 12 between two headings' blocks, the version at 12.
- The cast is a closed set with its coherence test (`src/ui/cast.ts`), and `docs/LOOK.md` _The cast_ says a glyph is drawn over an outline: a button's sign and a link's mark wear none.
- `workflow/LOOK.md` holds a pool bullet for this line, "Credits and licences in the game", which goes with the line.

**Plan:**

1. `public/assets/LICENSES.md`: the credits, Source Sans 3's entry moved, the Simple Icons entry; the three mark files under `public/assets/simple-icons/`. Leaves the record complete, nothing reading it yet.
2. A pure reading of the record into the list — headings, lines, addresses — beside the UI, with its Vitest file: the merging and the order proven once on a record the test authors, and the real record read whole with no refusal. Leaves the list readable by the game and by a spec.
3. The version's one reading, used by `tools/itch.ts` and handed to the game by `vite.config.ts` on the dev server and the build alike; the tags fetched in the Pages job of `.github/workflows/ci.yml`. Leaves the game knowing its version.
4. The licences' page, emitted by the build and served by the dev server, in `vite.config.ts`. Leaves the address the Licences button opens.
5. The three marks in the cast, the text entries, the look's two inks; then the menu: its Credits entry and window, the list laid with its addresses, Licences and Back, the links' row under the rule with the tooltip on the menu's surface, the version on both windows (`src/ui/menu.ts`, `src/ui/menu-scene.ts`, `src/ui/cast.ts`, `src/ui/text.ts`, `src/ui/look.ts`). Leaves the line's screen whole.
6. `e2e/credits.spec.ts`, on a save it wrote: Credits opens from the menu and Back closes it back one step; the list reads what the record's reading gives; a link's rest raises its name and its left click opens its address in a new tab; an address opens its site; Licences opens the page, which holds the game's licence and the record; the version reads what the one reading gives.
7. `docs/INTERFACE.md`, `docs/LOOK.md` as the Spec has them; the pool bullet out of `workflow/LOOK.md`; the board line and this file deleted.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- `npm run build`, then `dist/licences.txt` read: three parts, the third naming Phaser.
- The proof: `npx playwright test e2e/credits.spec.ts`.
- CI's on the push, never run here: `menu.spec.ts`, `controls.spec.ts`, `graphics.spec.ts`, `manage-save.spec.ts`, `launch-warning.spec.ts`, `refused-save.spec.ts`, `window.spec.ts`, `chrome.spec.ts`, `buttons.spec.ts`, `hover.spec.ts`, `pointer-sweep.spec.ts`, `campaign.spec.ts`.
