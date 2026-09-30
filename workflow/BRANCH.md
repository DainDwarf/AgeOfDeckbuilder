# Branch: OneDoor

The design first, its lines after. The branch merges once no line is left, and one Prep commit deletes this file and the pointer on [`BOARD.md`](BOARD.md) before the merge.

## The design

The browses, the windows and the collection's panels behave alike, and the code does not follow: the scrim is drawn at five sites, the wheel is read at three, the windows scroll through a grid written apart from the panel a browse scrolls through, and the chronicle's overlay and the meta's browser each build the same kit. The design is one sentence: **whatever stands on a scrim is a panel, and the scene the scrim lives in hears the gestures.** The wheel is read once for the game, a chord dropped there as the browser's; each scene hands it and the two keys that pan up and down to what scrolls in it; every scroll on a scrim goes through the one panel; a scrim is drawn and pressed one way; and the kit a screen stands on the overlay is built once.

That design is the code's shape and states no fact of the game, so no line writes it into `docs/`; each line carries the sentences of its own that the pages gain.

**The padding.** The content holds too few cards for any panel or browse of the meta to overflow, so the branch stands twenty placeholder cards in the Nomadic civilization's deck while it lives, and every panel and browse of a new campaign overflows. They never reach `main`: the last line takes them out, and with them every test that holds only on them. A line whose test holds only on the padding names that test in its hand-back, and the padding's line lists it before it ships. The collection panel's wheel test is the one foreseen; the Stone Age rung already carries the spec that proves the collection scrolls on real content.

## The lines

- **A setting inverts the wheel** — the Controls window holds two rows under the zooms, **Wheel zoom** reading Up zooms in or Up zooms out and **Wheel scroll** reading Up scrolls up or Up scrolls down, a press turning each the other way, the map and every scrolling surface following through the one reading of the wheel, **Default** putting both back, and both kept in the browser with the bindings. Doc-impact: `docs/INTERFACE.md`. [board/a-setting-inverts-the-wheel.md](board/a-setting-inverts-the-wheel.md)
- **A window's grid is a panel** — the aim, deal and capstone windows lay their cards through the panel a browse is laid through, keeping their layout to the pixel, the deal its ring and its refusal note; the overlay holds no grid of its own, and its gestures go to the one panel standing. Doc-impact: none. [board/a-windows-grid-is-a-panel.md](board/a-windows-grid-is-a-panel.md)
- **A scrim is one thing** — one function draws every scrim and wires its two clicks as the one step back its owner hands it, and the overlay, the browse, the cards shown large and the menu's two each own one built through it. Doc-impact: none. [board/a-scrim-is-one-thing.md](board/a-scrim-is-one-thing.md)
- **One browser under both screens** — the chronicle's overlay is the meta's browser with its windows and its ending added: the kit both build today, the tooltip and its bubble, the small cards, the cards shown large and their taker, the carrier, the following of the pointer, the scrim and the gestures' door, is built once, and a browse is raised and taken down one way. Doc-impact: none. [board/one-browser-under-both-screens.md](board/one-browser-under-both-screens.md)
- **The padding leaves** — the twenty placeholder cards, their text entries and every test that holds only on them leave the branch, the collection panel's wheel test among them, and the suite passes on the Nomadic content alone. Doc-impact: none. [board/the-padding-leaves.md](board/the-padding-leaves.md)
