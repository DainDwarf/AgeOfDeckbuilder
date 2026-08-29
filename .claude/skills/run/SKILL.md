---
name: run
description: Get the app running and report how to reach it. Use whenever asked to run, start, launch, or check on the app. Currently a stub — the stack is not chosen.
---

# Run

**The stack is not chosen yet.** There is nothing to run. Say so and stop.

When the stack lands, this skill owns one job: get the app up and hand back how to reach it (a
URL, a window, a command). Whatever happens afterwards belongs to whoever asked.

Rules that hold whatever the stack is:

- **Check before launching.** An instance started in a previous session may still be alive; the
  OS remembers even though the session does not. Probe first; reuse what is listening.
- **Read the real address from the launch output** — never assume the default port or path.
- **Launch in the background** and read the output with the Read tool, not a shell polling loop.
