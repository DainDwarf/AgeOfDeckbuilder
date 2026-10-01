# Branch: OneDoor

The design first, its lines after. The branch merges once no line is left, and one Prep commit deletes this file and the pointer on [`BOARD.md`](BOARD.md) before the merge.

## The design

The browses, the windows and the collection's panels behave alike, and the code does not follow: the scrim is drawn at five sites, the wheel is read at three, the windows scroll through a grid written apart from the panel a browse scrolls through, and the chronicle's overlay and the meta's browser each build the same kit. The design is one sentence: **whatever stands on a scrim is a panel, and the scene the scrim lives in hears the gestures.** The wheel is read once for the game, a chord dropped there as the browser's; each scene hands it and the two keys that pan up and down to what scrolls in it; every scroll on a scrim goes through the one panel; a scrim is drawn and pressed one way; and the kit a screen stands on the overlay is built once.

That design is the code's shape and states no fact of the game, so no line writes it into `docs/`; each line carries the sentences of its own that the pages gain.

**The padding.** The content holds too few cards for any panel or browse of the meta to overflow, so the branch stands twenty placeholder cards in the Nomadic civilization's deck while it lives, and every panel and browse of a new campaign overflows. They never reach `main`: the last line takes them out, and with them every test that holds only on them. A line whose test holds only on the padding names that test in its hand-back, and the padding's line lists it before it ships. The collection panel's wheel test is the one foreseen; the Stone Age rung already carries the spec that proves the collection scrolls on real content.

## The lines

- **The collection screen lays a mode at a time** — each mode of the collection screen is laid by a function of its own, at module level, and the scene, the catalogue and what the faces answer with travel as one value, built one way by the collection screen and the launch screen, through every function that lays a piece of either. Doc-impact: none. [board/the-collection-screen-lays-a-mode-at-a-time.md](board/the-collection-screen-lays-a-mode-at-a-time.md)
- **The ending screen stands in its own file** — the ending screen, its ledger and its rise leave `src/ui/overlay.ts` for a file of their own, which never holds the scrim, the browser fading its own scrim in, and what the chronicle screen hands the overlay travels as one value. Doc-impact: none. [board/the-ending-screen-stands-in-its-own-file.md](board/the-ending-screen-stands-in-its-own-file.md)
