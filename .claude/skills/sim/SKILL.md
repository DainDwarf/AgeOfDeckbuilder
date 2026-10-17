---
name: sim
description: Run the headless simulator on a cell and report its numbers. Use whenever asked to simulate, measure, run the sim, play a cell or a persona headlessly, trace a seed, or how a persona fares on an age, a region or a deck.
---

# Sim

One job: run `npm run sim` on the cell asked for and hand back what it printed. The reading of why is the user's.

## Procedure

1. **Name the cell from the question.** `--age`, `--region`, `--civilization`, `--persona` and `--seeds`, each defaulting to what the launch screen opens on, the idle and 20; the age and the region learn what reaches them, and a technology named after the flags learns more. `--turns <n>` moves the turn cap off 60. `--personas` prints every persona as its sentences.
2. **Write the rows to the scratchpad**, `--out <scratchpad>/<cell>.csv`, never into the tree. A run past a few seconds goes in the background; its end resumes the turn.
3. **Report what the rows say, counted**: the endings and their causes, the turns, the stops with their seeds. Then stop.
4. **Replay a seed worth a look** with `--trace <seed>` on the same cell, the seed read off its row. The trace names the gambit behind every command.

## Rules

- Numbers, never a diagnosis: no reading of why, no balance recommendation, no fix. A surprising number is said as the number, and the next measurement is offered.
- A stop is an error to investigate, never a result. A row whose ending is `stopped` is reported first, with its seed and cause, and its trace is the next measurement.
- Which seed to replay is read off the rows; a run is never repeated in search of one.
- No script over the rows or the rules. A question the command cannot answer is a flag to add, reported for a board line.
- No measurement runs on CI and none is committed.
- A content variant is its own run, in its own process: the edit, the run, then `git checkout <file>` and `git status --porcelain <file>` printing nothing, unless the user is tuning, in which case the edit stays on the tree and the hand-back says so. Two files are compared seed by seed: the same seed is the same map.
