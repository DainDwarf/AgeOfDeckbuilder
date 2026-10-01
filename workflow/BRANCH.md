# Branch: OneDoor

The design first, its lines after. The branch merges once no line is left, and one Prep commit deletes this file and the pointer on [`BOARD.md`](BOARD.md) before the merge.

## The design

The browses, the windows and the collection's panels behave alike, and the code does not follow: the scrim is drawn at five sites, the wheel is read at three, the windows scroll through a grid written apart from the panel a browse scrolls through, and the chronicle's overlay and the meta's browser each build the same kit. The design is one sentence: **whatever stands on a scrim is a panel, and the scene the scrim lives in hears the gestures.** The wheel is read once for the game, a chord dropped there as the browser's; each scene hands it and the two keys that pan up and down to what scrolls in it; every scroll on a scrim goes through the one panel; a scrim is drawn and pressed one way; and the kit a screen stands on the overlay is built once.

That design is the code's shape and states no fact of the game, so no line writes it into `docs/`; each line carries the sentences of its own that the pages gain.

**The padding.** The content holds too few cards for any panel or browse of the meta to overflow, so the branch stands twenty placeholder cards in the Nomadic civilization's deck while it lives, and every panel and browse of a new campaign overflows. They never reach `main`: the last line takes them out, and with them every test that holds only on them. A line whose test holds only on the padding names that test in its hand-back, and the padding's line lists it before it ships. The collection panel's wheel test is the one foreseen; the Stone Age rung already carries the spec that proves the collection scrolls on real content.

## The lines

- **One browser under both screens** — the chronicle's overlay is the meta's browser with its windows and its ending added: the kit both build today, the tooltip and its bubble, the small cards, the cards shown large and their taker, the carrier, the following of the pointer, the scrim and the gestures' door, is built once, and a browse is raised and taken down one way. Doc-impact: none. [board/one-browser-under-both-screens.md](board/one-browser-under-both-screens.md)
- **The overlay's scrim at its strength** — the chronicle's overlay scrim is drawn at its strength twice, its fill and its object alpha multiplied (about 0.67 for 0.82), so it shows lighter than every other scrim; it should show at the look's strength like the rest.
- **The padding leaves** — the twenty placeholder cards, their text entries and every test that holds only on them leave the branch, the collection panel's wheel test among them, and the suite passes on the Nomadic content alone. Doc-impact: none. [board/the-padding-leaves.md](board/the-padding-leaves.md)
