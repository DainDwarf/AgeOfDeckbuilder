# The victory ledger's silent lines

**Line:** The victory ledger's silent lines — the ending's ledger has no row for a card that carries no influence; a challenge kept to a defeat keeps its row, greyed, reading what its copies would have paid, the whole row struck through; Continue and the launch warning list the same rows, and the warning rises when there is one.

**Spec:** [`docs/CHRONICLE-SCREEN.md`](../../docs/CHRONICLE-SCREEN.md) _The windows_, the ending screen paragraph, and [`docs/META-SCREENS.md`](../../docs/META-SCREENS.md) _The launch screen_. The ledger is the ending's on both outcomes: the silent rule holds on a victory and a defeat alike, and only a defeat has a row to strike.

In `CHRONICLE-SCREEN.md`, the clause "then one row per influence card kept, its name and, where it kept several copies, their count after it, and at the row's end the influence all its copies paid, which a row that paid none does not read, a challenge's on a defeat greyed;" becomes:

> then one row per influence card kept that carries influence, its name and, where it kept several copies, their count after it, and at the row's end the influence all its copies paid; a challenge kept to a defeat keeps its row, greyed, reading the influence its copies would have paid, and a line in that same grey strikes the whole row through, from the name's left edge to the number's right edge; a card that carries no influence has no row;

The achievement clause before it stands as it is: an achievement that pays nothing keeps its row and reads no number.

In `META-SCREENS.md`, the two sentences "While the save holds a chronicle, Continue reads … which pays nothing. Where an achievement that chronicle has reached or an influence card it holds gains influence, Launch raises a **warning** first, … then a line over the achievements it has reached and the influence cards it holds, each read as Continue reads it, then Launch and Back." become:

> While the save holds a chronicle, Continue reads where that chronicle stands — the settle phase, or its turn — and under that the achievements it has reached and the influence cards it holds that carry influence, each read as the ending screen's ledger reads it, without the influence and nothing struck, and opens it where it stood; Launch then ends that chronicle, which pays nothing. Where Continue reads anything under where the chronicle stands, Launch raises a **warning** first, a window of the menu on its scrim: under the title Chronicle, a sentence saying that the chronicle ends and its achievements and influence cards are not paid, then a line over the achievements and the influence cards Continue reads, each read as Continue reads it, then Launch and Back.

No player-facing text entry is added or changed: the rows read the names and numbers they read today.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/META-SCREENS.md`.

**Scope:**

- In: the ledger's rows on the ending screen, Continue's lines and the warning's list under one rule, a card carrying no influence read nowhere; the struck row on a defeat; the warning rising on the rows it lists in place of its own test of what pays.
- Out: the achievements' rows, which change nothing; the look of anything else on the three screens; the Nomadic trophies' influence of 0, which stays.
- The struck row's number is what its copies would have paid: the copies times the card's influence. The strike is in the unpaid row's grey, the look's one entry for that meaning, 2 units thick, across the ledger's whole width, at the row's middle. The row's ink stays the greyed one it has today.
- A challenge is struck on a defeat only; a victory pays it and its row reads as a trophy's. Continue strikes nothing: a chronicle not ended may still win its challenges.
- A ledger with no row reads the total alone, with no rule, as today. A Nomadic ending reads its achievement row and the total: its trophies all carry no influence.
- The warning rising on the rows makes it rise on an achievement reached that pays nothing, which today it does not; no such achievement exists, and its technology would be lost, so the warning is right to rise.
- Reconcile: the warning's own test of what pays and the rows it lists become one, the warning reading the rows. The strike's colour and the unpaid row's ink are one meaning and read the look's one entry; the greyed look of a dead control is another meaning and stays apart.

**Traps:**

- What an ended chronicle paid (`src/rules/campaign.ts`, the payment) holds for each card kept whether it paid and what it paid, which is 0 for a challenge on a defeat; the struck row reads what the copies would have paid, which the payment does not carry today. Where that number comes from — the payment widened, or the screen reading the card's influence — is the implementer's; `src/rules/campaign.test.ts` asserts the payment's shape card by card and follows the shape chosen, the rule it proves unchanged.
- Phaser's Text has no strikethrough style; the ledger's rule under the rows is a rectangle, and the strike is drawn the same way. The spec needs it named, one name per row, so it can read that a challenge's row is struck and a trophy's is not.
- The ending block is centred on its own height, so rows removed move the block; nothing to do, the centring reads the button's bottom.
- `e2e/ending.spec.ts`'s victory test plants two trophies gaining influence and one gaining none, and asserts the one gaining none has a row; that assertion flips, and the rows expected come from the payment's cards filtered to those carrying influence.
- A defeat with a challenge kept: `beforeTheFall()` in `e2e/chronicle-screen.ts` is the chronicle whose next end of turn is captured; a challenge added to the draw pile's top through `addedToDrawPileTop` stays there, the capture landing in the enemy phase before the next draw, and the payment reads every pile. A card of any age enters any chronicle. `trophyGaining` finds a trophy by its influence; a challenge wants the same search by its kind.
- `e2e/launch-warning.spec.ts`'s second test, a chronicle holding only a trophy gaining none, expects no warning and keeps passing under the rows rule. `e2e/continue.spec.ts` reads Continue's lines by index.
- The look entry for the unpaid row's ink carries a comment naming the row alone; re-shave it to name the strike too.
- The ledger's width is fixed, so the strike's width reads no text and CI's wider fallback font changes nothing.

**Plan:**

1. The rules, where the implementer puts the number a struck row reads; `src/rules/campaign.test.ts` follows. Leaves the payment saying, for every card kept, what it paid and what its copies carry.
2. `src/ui/ending-screen.ts`: the rows filtered, the struck row drawn; `src/ui/launch-screen.ts`: the warning rising on the rows it lists, its own test gone; `src/ui/look.ts`: the comment. Leaves the three screens reading one rule.
3. `docs/CHRONICLE-SCREEN.md` and `docs/META-SCREENS.md` as the Spec writes them.
4. `e2e/ending.spec.ts`: the victory test's oracle filtered; a defeat test added, a challenge kept, its row greyed and struck, its number what the copies would have paid, the total what was paid, a trophy's row unstruck.
5. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/ending.spec.ts`. CI's on the push: `e2e/launch-warning.spec.ts`, `e2e/continue.spec.ts`, `e2e/fall.spec.ts`.
