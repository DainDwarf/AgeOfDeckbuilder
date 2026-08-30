---
name: visual-check
description: Verify a UI change after making it — layout, overlap, clipping, contrast, console errors, interaction states — through the ui-check agent, then hand the app to the user for the feel check. Use after any change to a scene, a widget, a colour, or the theme.
---

# Visual check

Two passes, never interchangeable:

- The **mechanical** pass — does it render, does anything overlap or clip, does the console
  throw — runs in the `ui-check` agent.
- The **judgment** pass — does it feel right to play — is the user's, always. A PASS from the
  agent means "nothing is broken", never "done". Hand the app over and let the user look.

## Never drive the browser from this session

Every browser call belongs to the `ui-check` agent: the Playwright driver script, the screenshots,
the pixel reads. Screenshots are bulky and this context is the one that has to stay readable. No
hook enforces it — Playwright arrives through an ordinary `node` command, which nothing can match
on — so it is on the session to keep the line.

## Steps

1. **Get the app up** — the `run` skill.
2. **Spawn `ui-check`** with the URL and a concrete checklist: what changed, what "correct" looks
   like, the exact path to reach it, what to capture. Brief the check, not the implementation.
3. **End the turn.** The agent's report resumes you.
4. **Relay its report** — per-step PASS/FAIL/CONCERN and anything flagged. Strip any caveat about
   the user's save; the agent drives its own empty profile and cannot reach it.
5. **Hand the app to the user** for the feel check, with what to look at.

## Scope

A check must be reachable in a few clicks from a fresh load. If it needs prior progress, the agent
seeds a whole, coherent state directly — never plays to earn it. If it is only observable by
playing through (an ending, many-turn behaviour), it is not automated: write the user precise
manual instructions instead.

## Colour work

When the change touches colour, ask for the colour-vision-deficiency pass as well. Colour-only
signals — nothing but hue distinguishing two states — are what must survive; a labelled signal
just shouldn't look broken. A CONCERN from a simulation matrix is a reason to measure, not a bug.
