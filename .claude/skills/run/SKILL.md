---
name: run
description: Get the app running and report how to reach it. Use whenever asked to run, start, launch, or check on the app.
---

# Run

One job: get the app up and hand back how to reach it. Whatever happens afterwards belongs to whoever asked.

## Procedure

1. **Read the port from `vite.config.ts`.** `server.strictPort` is set, so the dev server has exactly one address — but the number lives in that file, not in this one.
2. **Probe it before launching.** An instance from an earlier session may still be listening; the OS remembers even though the session does not. If a page comes back and `node_modules/.vite/deps` exists, that is the answer — report the URL, say it was already up, and stop. If a page comes back but `deps` is missing, that instance is broken (the browser gets `504 Outdated Optimize Dep`): stop its `vite` and `npm run dev` node processes and go on to step 3.
3. **Clean Vite's dependency cache.** Delete `node_modules/.vite/deps` and every `node_modules/.vite/deps_temp_*` beside it; leave `node_modules/.vite/vitest` alone. On Windows a re-bundle's final rename can fail when something holds the files, leaving the temp folders behind and no `deps`; a fresh start rebuilds it clean.
4. **Launch `npm run dev` in the background.** It never returns; a foreground call hangs the turn.
5. **Read the address out of the launch output** with the Read tool — Vite prints `Local: http://…` once it is listening. Report that line's URL, not an assumed one. If an instance was restarted, tell the user to hard-reload (Ctrl+Shift+R) any tab still open on it.
6. **Say what the address opens.** The bare address is the normal door: it boots on the campaign screen, whose Chronicle button opens the launch screen, which offers Continue while the save holds a chronicle and launches a new one. `?continue=1` opens the save's chronicle straight; any other address boots on the campaign screen. The chronicle screen writes nothing into the address.

## Rules

- Never poll in a shell loop and never sleep. Read the background output file.
- One instance is enough; never start a second when one is listening.
- A dev server that fails to start is reported with its output, not retried blindly.
