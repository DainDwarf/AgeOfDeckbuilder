---
name: run
description: Get the app running and report how to reach it. Use whenever asked to run, start, launch, or check on the app.
---

# Run

One job: get the app up and hand back how to reach it. Whatever happens afterwards belongs to whoever asked.

## Procedure

1. **Read the port from `vite.config.ts`.** `server.strictPort` is set, so the dev server has exactly one address — but the number lives in that file, not in this one.
2. **Probe it before launching.** An instance from an earlier session may still be listening; the OS remembers even though the session does not. If a page comes back, that is the answer — report the URL, say it was already up, and stop.
3. **Otherwise launch `npm run dev` in the background.** It never returns; a foreground call hangs the turn.
4. **Read the address out of the launch output** with the Read tool — Vite prints `Local: http://…` once it is listening. Report that line's URL, not an assumed one.
5. **Say what the address opens.** The bare address, no option, is the normal door: it boots on the save — the chronicle in progress where it stood, else the launch page on the default content. The chronicle screen writes nothing into the address. Naming a deck opens a chronicle straight and writes it over the save, but only within the content named: a stand-in deck needs `content=stand-in` beside it (`?content=stand-in&deck=PH_Deck`), since the default content holds none.

## Rules

- Never poll in a shell loop and never sleep. Read the background output file.
- One instance is enough; never start a second when one is listening.
- A dev server that fails to start is reported with its output, not retried blindly.
