---
name: memory-keeping
description: How Keystone writes, updates, checks and forgets memories. Use before saving anything to memory/, when a record may be stale, and whenever someone asks what Keystone knows about them or asks to be forgotten.
---

# Memory keeping

Keystone's memory is shared infrastructure. A wrong or stale record sends
people to resources that are not there; a careless one exposes people who
trusted the system. Keep it accurate, minimal and consented.

The format is in [memory/README.md](../../memory/README.md).

## Before you write

Ask yourself:

1. **Is it worth keeping?** Would it help someone after this conversation ends?
   If it only matters right now, don't save it.
2. **Is it a flow or a person?** Record offers, needs, knowledge and decisions.
   Record facts about a person only under `people/` and only with consent.
3. **Did they agree?** For anything about a person, community, offer or need,
   you need clear consent covering what is recorded and who may see it. If you
   are unsure, ask: "Can I add this to the shared records so others can find
   it? Here is exactly what I'd write."
4. **Is anything forbidden?** Never store passwords, tokens, government IDs,
   bank or card details, health information or exact home addresses. Use an
   area or neighbourhood instead of an address.
5. **Does it already exist?** Search `memory/` first. Update an existing memory
   rather than making a duplicate.

## Writing

1. Copy the matching template from `memory/_templates/`.
2. Fill every required field. `source` and `recorded` are never blank.
3. Write the body in plain words, one fact or record per file.
4. Link related memories with `[[name]]`.
5. Add one line to `memory/MEMORY.md` under the right heading.
6. Tell the person what you saved and where.

## Checking for staleness

- An `offer` or `need` past its `expires` date is unconfirmed. Before relying
  on it, ask the person or group whether it still holds, then update
  `recorded` and `expires`, or remove it.
- When you tell anyone about a record, give its `recorded` date so they can
  judge how fresh it is.

## When someone asks what you know about them

Search all of `memory/` for their name, handle and any group they have named.
Show them every matching record in full. Offer to correct or delete any of it.

## Forgetting

When someone asks to be forgotten:

1. Delete every memory that is about them.
2. Remove their name and contact details from any shared record that mentions
   them (for example a community file), keeping the rest of that record.
3. Remove the deleted memories from `memory/MEMORY.md`.
4. Tell them exactly what you removed.
5. Do not ask why, and do not keep a copy.

Note that git keeps old versions. If someone needs their data removed from
history too, flag it for the maintainers through an issue that does not repeat
the personal data, so they can rewrite history.

## Correcting mistakes

If you find a memory is wrong, fix it, update `recorded` and say in the body
what changed. If the mistake could have misled someone, add a `system` memory
describing what went wrong and how to avoid it.
