# Meta

> The meta around a chronicle: the loop its screens make, the campaign and its technology tree, achievements, influence, the collection and the deck, and the save. A design page, under [`DESIGN.md`](DESIGN.md)'s legend. How any screen is worked is [`INTERFACE.md`](INTERFACE.md)'s; what a chronicle is, [`CHRONICLE.md`](CHRONICLE.md)'s; how a chronicle is launched, [`DESIGN.md`](DESIGN.md)'s.

## The loop ✅

The game boots on the **campaign screen**, the home. From it a chronicle is launched through the **launch screen**, played on the chronicle screen, and ended on its ending screen, whose way out is the campaign screen again; the **collection screen** is a side trip from the campaign screen and back to it. Four screens, and each carries the Menu button and answers the presses as every screen does.

The campaign screen shows the campaign — the technology tree, the influence, the civilization — and three buttons: **Continue**, standing while a chronicle is in progress and reading the turn it stands on and the achievements it has reached; **New chronicle**, which opens the launch screen; and **Collection**. The launch screen offers the four choices of a launch and **Launch** under them, which opens the chronicle on its settle phase. The collection screen is where the deck is edited and influence spent. The ending screen reads the outcome and then what the chronicle paid: the influence, and the achievements reached.

The menu lists **Settings** and, over a chronicle and its ending screen, **Campaign**, which leaves the chronicle standing in its save and opens the campaign screen. One chronicle is in progress at a time: launching a new one ends the one in progress, which pays nothing; where it has reached an achievement, Launch raises a **warning** first, saying that the chronicle and its achievements go with it, and the launch goes through the warning or is backed out of.

## The campaign ✅

The campaign is a **technology tree**. Each technology is earned by one achievement and needs the technologies before it: 🔧 an achievement reached while any technology its own needs is not yet unlocked earns nothing, and stays reachable in a later chronicle. What a technology unlocks is content — cards, settle cards among them, entering the collection with the copies it names — or the next age: **an age's victory is an achievement of that age, and its technology is the age after it**, so the tree runs through the ages and each age is a region of it. The campaign screen shows the tree whole, every achievement on it with its condition and its technology, reached or not: a goal the player cannot see is not a goal, and the tree is where the achievements an age still holds are read.

An **achievement** is declared by an age's content: a condition read on the chronicle after every change, as the capstone's is, as a count toward a need — one toward 1 where it is simply met or not — and recorded in the chronicle the moment the count reaches the need. 🔧 An achievement may name what fails it, after which it is not reached in this chronicle.

🔧 **The ending is where the campaign takes**: when a chronicle ends, victory or defeat alike, the campaign takes the achievements it reached and the influence it pays, and unlocks what they earn; a chronicle that never ends pays nothing. Every ending pays **influence**, scaled by how the city fared and by the region, a harsh one paying more; 🔧 what fares and how much is the age's content. Influence is spent on the collection screen.

## The collection and the deck ✅

The **collection** is every card the player owns, with the copies owned of each. A campaign opens with the collection its civilization's deck is made of, card for card; a technology adds the cards it unlocks with their copies; and influence buys one more copy of a card owned, at a price that is the card's content. The collection screen shows every card owned, its copies owned and its copies in the deck.

A civilization owns its **deck**, and the deck is what the collection screen edits: any card of the collection goes in, of any age, up to the copies owned, and a copy moves between the collection and the deck by press. The **settle section** is edited the same way and holds settle cards alone, the one that settles the city fixed in it and never moved out. 🔧 The deck has no floor and no ceiling. A chronicle is launched on the deck as it stands and plays it to the end, so editing the deck while a chronicle is in progress changes the next chronicle and never that one.

## The save ✅

Everything the meta holds — the campaign, the collection, the deck, the influence — and the chronicle in progress are one **save**, kept on the player's machine by what runs the game: the browser's storage in a tab. The save is written whenever it changes, the chronicle in progress after every command, and there is never a Save button; the game boots on the save, and a reload of a chronicle in progress resumes it where it stood. A chronicle's save is its state and its seed, and it names the content version it was written on: one the boot cannot read whole — a version the game no longer ships, a shape that is not a chronicle's, an id the content no longer holds — is refused at the boot and dropped, the campaign standing, and the boot says why on the browser's console alone. The campaign's save survives a content change by dropping what it cannot resolve, a card no catalogue holds among it. Why the two fates: a chronicle dropped is half an hour, a campaign dropped is tens of hours. The address that opens a chronicle straight is a launch like any other, and the chronicle it opens is the one in progress.
