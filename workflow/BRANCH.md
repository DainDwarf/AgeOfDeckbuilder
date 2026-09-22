# Branch: Scenes

The design first, its lines after. The branch merges once no line is left, and one Prep commit deletes this file and the pointer on [`BOARD.md`](BOARD.md) before the merge.

## The design

The chronicle screen is drawn on one Phaser scene today: two Layers painted by two cameras that ignore each other, a hook that homes every new object onto the UI's Layer, a third hidden camera clipping the browse's grid by ignoring every object in the scene each time it opens, and one depth table across the lot. Every object raised late — a refusal note, a small card — has to be registered against that clip or it draws inside the frame, and that tax is what every reference build has paid. Cameras answer where a display list is viewed from; they are not the stacking tool. Phaser's stacking tool is the scene, each with its own display list, camera and input plugin, rendered in scene-list order, and the Layer inside it.

**The tower**, bottom to top, each scene's contents in the order they stand:

| Scene | Runs | Holds |
| --- | --- | --- |
| `launch` | from boot until a chronicle opens | The launch page; later, the meta's screens. |
| `map` | with a chronicle | The map surface, the one camera that pans and zooms. Layers in the interface page's order: terrain, lit and glowed, buildings, units, fog, city mode's marks, the yield dim and what stays through it, the ring, the yield glyphs and the culture threshold, the infopanel, the map's refusal note, the map's tooltip. |
| `ui` | with a chronicle | The UI surface, camera fixed. Layers: the band, the mode frame and chip, the piles and the resting hand, the resource bar, the end-turn button, the cards in flight, the lifted card, the aim line, the UI's refusal note, the small cards, the tooltip. The chronicle screen's orchestration lives here and hands the `map` and `overlay` scenes to the factories that draw on them. |
| `overlay` | with a chronicle, empty while nothing stands | The scrim and what it carries: a browse, the aim window, the deal window, the capstone's window, a card shown large and its row, the ending screen, the note a refusal raises over a window's card; above those, the overlay's small cards and tooltip. |
| `menu` | always, on every screen | The Menu button, the menu's windows, and a scrim of its own that rises with a window. |
| `console` | always | The debug console. |

**A surface is a scene.** `docs/` keeps the word surface, the player-visible fact that the map moves and the UI holds still; scene is Phaser's unit and the code's word. The two never meet in a design sentence.

**Strata are Layers, never depth numbers.** Inside a scene, one Layer per stratum in the order above, created in that order; an object is added to its Layer and carries no depth. A Container is used only where a thing moves as one, a card face for instance, and a Layer is never put inside a Container. A depth number is legal only within one Layer, indexing something real — a slot, a place in a chain.

**The tooltip and the small card stand on the surface that raised them**, on that scene's topmost Layer, one widget class instantiated into whichever scene asked. A raiser never reaches into another scene.

**The barriers are the scene order for the pointer and the start order for the keys.** Phaser walks pointer events from the top scene down, and a scene stops the walk by stopping the event: `globalTopOnly` is off, and a scene that stands over another stops every press, move and wheel that lands on an interactive object of its own, through its input plugin's `stopPropagation`, and never a release. So an interactive thing in a higher scene stops the press and the hover, empty space lets them through to the scene beneath, and a press begun on a lower scene and let go of over a higher one still ends where it began. Why not Phaser's default: it stops the release with the rest, and a card dragged off the hand and let go over a higher scene's button would follow the pointer until the next click. A key is heard by each scene's keyboard plugin in the order the scenes started, a scene that restarts going to the back of the line, and a handler that calls the event's `stopPropagation` keeps it from every scene that started later: the tower is started from the top, `console` first at boot and `menu` after it, the chronicle's scenes last and again at every restart. Every key is read through the scene's keyboard plugin and no window-level reader remains. The console stops every key while it stands; a menu window stops every key, mouse key and wheel notch while it stands, the pan and zoom keys included, so the screen under it is frozen; a window on the overlay stops the three keys the design says it swallows and lets the pan and zoom keys pass; how the overlay's window stops a key ahead of the `ui` scene it restarts with is that line's to settle. No listener is toggled and no scene needs a "covered" flag for its keys. The wheel and the mouse's spare buttons are read as keys at the window level and follow the key rule: heard in start order, a scene that takes one keeps it from every scene that started later.

**The browse's grid is clipped by a Mask filter** on its container, external context, its source a rectangle the size of the frame: Phaser 4's WebGL masking is a filter, GeometryMask being Canvas-only and BitmapMask gone. Nothing outside the container is touched, so nothing is ever excluded. The clip camera and its ignore lists go.

**What the interface page changes**, all in _What stands over what_ and _The menu_: the menu's window stands on a scrim of its own over whatever stands, the ending screen included; the resource bar no longer stands over the scrim while a deal waits; the Menu button stands on every screen, the launch page among them. The tooltip's and the small card's sentences already say what the tower does.

**Restart.** A new chronicle restarts the `ui` scene, and the `map` and `overlay` scenes with it; `menu` and `console` outlive a chronicle. Every listener a factory leaves on an emitter dies with the scene the factory was handed, as `whileUp` already ensures.

**The e2e harness** finds a named object on any running scene and reads its camera from the scene that holds it; the specs themselves do not change.

## The lines

- **The console is a scene** — the debug console runs on a scene of its own, started first at boot and standing over every other scene on every screen; while it stands every key pressed is its and no scene under it hears one, the launch page's seed digits and Enter included; a chronicle opening closes it, clears its lines and puts both veils back; `docs/INTERFACE.md` says so; the e2e harness finds a named object on any running scene; `e2e/console.spec.ts` and `e2e/boot.spec.ts` pass. Doc-impact: `docs/INTERFACE.md`. [board/console-scene.md](board/console-scene.md)
- **The menu is a scene** — the Menu button, the menu's windows and their scrim move to a scene running on every screen, below the console; while a window stands no key and no press reaches the screen under it, a release excepted; the overlay's kept-aside states for closing the menu back onto a window go; `docs/INTERFACE.md` says so; `e2e/menu.spec.ts`, `e2e/boot.spec.ts` and `e2e/recall.spec.ts` assert it. Doc-impact: `docs/INTERFACE.md`. [board/menu-scene.md](board/menu-scene.md)
- **The overlay is a scene** — the scrim and what it carries move to a scene above the chronicle screen, with the clip camera moving along untouched; the scene sleeps while nothing stands and restarts with the chronicle.
- **The map and the UI are two scenes** — the two Layers and their cross-ignoring cameras become two scenes, the homing hook goes, strata become Layers, and the depth table goes with them.
- **The browse is clipped by a mask** — the grid's container takes a Mask filter with a frame-sized rectangle as its source; the clip camera, its ignore lists and the refusal note's `raised` callback go.
- **The card references dossier is rewritten on the tower** — `board/card-references.md` is rewritten from the settled state, the small card a raiser on any surface adds to that scene's topmost Layer and nothing excluded anywhere, so the line ships on `main` as an ordinary one.
