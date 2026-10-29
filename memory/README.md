# Memory

Keystone's memory is a folder of plain Markdown files. Anyone can read it, and
because it lives in git, every change to it is recorded. There is no hidden
database behind it.

[MEMORY.md](MEMORY.md) is the index: one line per memory, loaded at the start of
every conversation. The memories themselves live in the folders below.

## Kinds of memory

| Folder | `type` | What it holds |
|---|---|---|
| `collective/` | `collective` | Knowledge for everyone: how-tos, lessons learned, references, technology. The commons. |
| `places/` | `place` | One file per state, county, city or town: its level, council, powers and traditions. From its council's public charter. |
| `communities/` | `community` | One file per community or group that has joined: what it does, how to reach it, what it shares. Written with the group's agreement. |
| `resources/` | `offer` or `need` | Things people have to share and things people need: tools, space, food, skills, time. |
| `decisions/` | `decision` | Decisions groups have made through Keystone, with who decided and how. |
| `people/` | `person` | Only with the person's explicit consent: how they want to be reached and what they have chosen to share. |
| `system/` | `system` | Keystone's notes about its own operation: lessons, mistakes and corrections. |

## File format

Each memory is one file holding one fact or record, named with a short
kebab-case slug such as `seed-library-oakland.md`. Copy the matching template
from [_templates/](_templates/).

```markdown
---
name: seed-library-oakland
description: Free seed library at the Fruitvale branch, open Saturdays
type: offer
source: Told to Keystone by the Fruitvale garden collective
recorded: 2026-10-28
consent: The collective agreed to list this publicly
expires: 2027-04-28
---

The body of the memory, in plain words.

Related: [[fruitvale-garden-collective]]
```

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | Same as the filename without `.md`. |
| `description` | yes | One line, used to decide whether the memory is relevant. |
| `type` | yes | One of the types in the table above. |
| `source` | yes | Who or what this came from. Never leave it blank. |
| `recorded` | yes | Date written or last confirmed, as `YYYY-MM-DD`. |
| `consent` | for `person`, `community`, `offer`, `need` | What the people involved agreed to, and with whom it may be shared. |
| `expires` | for `offer` and `need` | When to check again whether it still holds. |

Link related memories with `[[name]]`. A link to a memory that does not exist
yet is fine; it marks something worth writing later.

## Rules

1. Follow [skills/memory-keeping](../skills/memory-keeping/SKILL.md) every time
   you write, change or forget a memory.
2. Measure flows, not people. Record what is offered, needed and decided, not
   what individuals do.
3. No consent, no record. If you are not sure someone agreed, ask or leave it
   out.
4. Never store passwords, tokens, government identifiers, bank or card details,
   health records or exact home addresses.
5. When someone asks to be forgotten, delete every memory about them, remove
   them from the index, and say what you removed.
6. Keep the index current. Every memory has exactly one line in
   [MEMORY.md](MEMORY.md), and no line points to a missing file.
