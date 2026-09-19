# Interface

> How any screen is worked: the menu and what it lists, the keys and how they are rebound, the debug console, and the three presses. A design page, under [`DESIGN.md`](DESIGN.md)'s legend. What a press does to a thing only a chronicle has is [`CHRONICLE.md`](CHRONICLE.md)'s.

## The menu ✅

The menu lists **Settings** and **New chronicle**: a new chronicle begins one on a fresh seed with the same deck, leaving whatever the city was living through, victory, defeat or the middle of a turn. **Settings** is where everything the player sets lives, and **Controls** is its first entry.

A window closes back one step, to the window it was opened from and then to the screen under it. The **back key**, Escape until it is rebound, backs out of whatever is open or pending, one step per press, and raises the menu only from a clean screen. Nothing pauses, because nothing runs: the game is untimed, and a menu over the chronicle screen is the chronicle screen waiting.

**Controls** lists every key the game binds — the four directions the map pans, the two it zooms, the city key, the yield key, the inspection key, and the back key — with two slots to each. A key is rebound by pressing its slot and then the key itself, whatever that key is; a key already bound elsewhere moves, leaving the slot that had it empty. A control stands on the key's place on the keyboard and not on what that key prints, so a layout that moves a letter leaves the control where the key is; a slot reads what its key printed when it was bound, a key never rebound reads the US keycap of its place, and a key that prints nothing binds like any other and reads its place too. A key pressed with Ctrl, Meta or Alt held is the browser's: it does nothing on the chronicle screen, and a slot listening does not take it. Every mouse button but the two that press the chronicle screen binds there like a key, and presses nothing on the chronicle screen; the browser's own menu never shows over the game. A notch of the wheel binds like a key too, one key each way; the map zooms one notch a press, and only through the two zooms — a wheel notch up and a wheel notch down until they are rebound. **Default** puts every key back where it began, **Back** closes the window, and what the player binds is kept in the browser from one launch to the next.

## The launch page 🔧

The game boots on the **launch page**, a stand-in for the meta's launch screen: one row per choice — the content, the region, the schedule, the deck and the seed — the first of each list chosen until another is pressed, the seed typed in digits or left blank for a fresh one, and **Launch** under the rows, which opens the chronicle on those choices; Enter presses it too. The address is the developer's door and the test suite's: one that names a deck opens the chronicle straight, on what else it names and the page's defaults for the rest, and any other opens the page with what it names already chosen. The chronicle screen writes the choices and the seed it begins on into the address, a new chronicle included, so a reload replays the chronicle on screen and the bare address is how the page is reached again. The launch screen replaces the page; the address stays.

## The debug console ✅

The **debug console** is a dark panel down the top of the screen, standing over everything the screen carries — the resource bar, a window and the ending screen included — with the last lines run above the line being typed. What it covers reads dimly through it, so the bar is still there to be read and the console writes clear of it. While it stands the keyboard is its — every key types, Backspace deletes, Enter runs the line, and Escape or the key that opened it closes it — so nothing the game binds hears a key meanwhile. The pointer is not its: the map still pans and zooms under it. An entry is one word and Enter, and it is answered in one line; a word the console holds no entry for is answered `no such entry: <word>`. The console binds no key of the player's and stands in no Controls window, and a new chronicle raises it with every entry back where it began.

## The presses ✅

Three presses work every screen: the **left click** selects, the **right click** inspects, and the **inspection key** inspects the selection. The two clicks press the screen and are not keys: neither binds to anything, and Controls lists neither.

**The selection is one thing, a tile or a card, and the left click makes it.** A press on a thing selects it, a new selection drops the old one whatever it was, and a press beside the things drops it and the inspection with it. A left click on the selection acts on it, and what it does is the selected thing's own.

**The right click inspects and never selects.** It inspects the thing under it — a tile in the infopanel, a card shown large — and pressed again on the same thing steps its cards on; a card has but the one, so a second right click on a card shown large does nothing, and neither does a left click on it: a press beside it, or the back key, takes it down. A press beside the things drops the inspection and leaves the selection standing. It does this in every state the screen can be in, so nothing half done has to be undone to inspect a thing.

**The inspection key inspects the selection**, and moves the inspection there when a right click had put it elsewhere on the screen. With no selection, or while a card stands large, it does nothing; under a window it inspects the window's own selection and never the screen's.

**A window that offers things to select keeps a selection of its own**, which dies with the window; the screen's selection waits under it.

The **back key** walks these back in this order: the thing shown large, then a window's own selection and then the window, then the inspection, then the selection.

Two verbs cover it all. **Select** is the tile the map rings, the card lifted out of the hand, or the card ringed in a browse; **inspect** is the tile in the infopanel and the card shown large. "Zoom" stays the map's word.
