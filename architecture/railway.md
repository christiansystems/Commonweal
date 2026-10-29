# Running on Railway

This repository is Keystone's brain. It is not yet a running service: the
runtime that loads it and talks to people still has to be built. This document
records the intended design so the runtime can be built to fit.

## Intended shape

```
                  ┌─────────────────────────────────────┐
  people ──chat──▶│ keystone-runtime (Railway service)  │
  (web, Matrix,   │  Claude Agent SDK agent             │
   Signal, etc.)  │   system prompt: KEYSTONE.md        │
                  │   skills:  .claude/skills → skills/ │
                  │   memory:  memory/  (read & write)  │
                  └───────────────┬─────────────────────┘
                                  │ git pull / commit / push
                                  ▼
                  ┌─────────────────────────────────────┐
                  │ this repository (the brain)         │
                  └─────────────────────────────────────┘
```

1. **Runtime service.** A small server on Railway that runs a Claude Agent SDK
   agent with this repository as its working directory. It loads
   [KEYSTONE.md](../KEYSTONE.md) as the system prompt and discovers skills
   through `.claude/skills`, which links to `skills/`.
2. **The brain is mounted, not baked in.** The runtime clones this repository
   at startup into a Railway volume and pulls on a schedule, so changes the
   people make through governance take effect without rebuilding the runtime.
3. **Memory writes go through git.** When Keystone saves or forgets a memory,
   the runtime commits the change with a clear message and pushes it, so every
   change to the collective record is public and reversible. Personal
   (`people/`) memories may later need a separate, access-controlled store;
   see the open questions.
4. **Secrets live in Railway variables**, never in this repository: the model
   API key, the git deploy key and any chat-platform tokens.

## Open questions for the people to decide

- Which chat channels to support first (web, Matrix, Signal, Telegram,
  email).
- Whether `people/` memories should live in this public repository at all, or
  in a private, encrypted store the person controls.
- How memory writes are reviewed: committed directly, or proposed as pull
  requests that a community member approves.
- Which model and hosting costs the project can sustain, and who pays.
