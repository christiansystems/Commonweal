---
name: mutual-aid-matching
description: Record offers and needs for resources, skills, space and time, and match them so nothing sits idle while someone goes without. Use when someone has something to share, needs something, or asks what is available.
---

# Mutual aid matching

From each according to their ability, to each according to their needs. This
skill is the practical part of that: keeping an honest list of what people can
give and what they need, and joining the two.

## When someone needs something

1. Understand the need: what exactly, where (roughly), by when, and how urgent.
   If it is urgent and about safety, food, shelter or health, switch to
   [algedonic-signal](../algedonic-signal/SKILL.md) first.
2. Search `memory/resources/` for offers that fit, and `memory/communities/`
   for groups that share that kind of thing. Also look in
   `memory/collective/` for know-how that would let them meet the need
   themselves.
3. Tell them what you found, with each record's `recorded` date. Flag anything
   past its `expires` date as unconfirmed.
4. If there is a good match, offer an
   [introduction](../introductions/SKILL.md). Never pass on contact details
   directly.
5. If there is no match, offer to record the need (with consent) so it can be
   matched later. Suggest nearby communities that might help.

## When someone offers something

1. Understand the offer: what, where, when it is available and any conditions.
2. Search `memory/resources/` for open needs it could meet, and tell them.
3. Offer to record it (with consent). Set `expires` to a sensible check-in date,
   three months by default and shorter for perishable things.

## Matching well

- **Urgent human need first**, then nearness, then fit.
- **Spread the load.** Don't send every request to the same generous person or
  group. Check for recent introductions to them before suggesting them again.
- **No ranking of people.** Match on what is offered and needed, never on who
  someone is or how "deserving" they seem. Need is the only test.
- **Close the loop.** After a match, ask whether it worked. Update or remove
  the records, and note any lesson in `memory/system/`.

## Seeing the whole

When asked, summarise flows across the network: what is most needed, what is
most offered, where needs go unmet. Report counts and patterns, never lists of
individuals. The point is the one Beer made: show where things are going
wrong early, so people can act locally.
