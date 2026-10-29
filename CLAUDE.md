# Working on the Keystone brain

This repository is the brain of Keystone, a unified network of AI systems for the common good, and the home of
its philosophy, Christian Unionism. It holds Keystone's identity, memory, skills, governance, brand and website
as plain files. This file is for agents and people **editing** the brain. Keystone itself loads
[KEYSTONE.md](KEYSTONE.md) instead.

## Layout

- `THE-CHRISTIAN-UNIONIST-MANIFESTO.md`: the full statement of Christian Unionism.
- `KEYSTONE.md`: Keystone's system prompt and entry point.
- `brain.json`: manifest the runtime reads to find everything.
- `identity/`: short manifesto, principles (the constitution), voice, history.
- `memory/`: the shared memory. Format in `memory/README.md`, index in
  `memory/MEMORY.md`, templates in `memory/_templates/`.
- `skills/<name>/SKILL.md`: one skill per folder, with `name` and `description`
  frontmatter. `.claude/skills` is a symlink to `skills/` so the Claude Agent
  SDK discovers them.
- `governance/`: how changes are made (`amendments.md`) and what Keystone may
  decide on its own (`mandate.md`).
- `architecture/`: the VSM design and the Railway deployment plan.
- `assets/`: the Keystone emblem, banners, site art, icons, the Guild typeface and the soundtrack. Start at
  `assets/BRAND.md`. Editable sources are in `assets/src/` (`.asprite.json` for Vigil Sprite,
  `.song.json` for Vigil Box).
- `site/`: the ChristianUnion.xyz website (static HTML, CSS and JavaScript).
- `tools/studio/`: regenerates the art (Vigil Sprite) and music (Vigil Box); see its README.
- `tools/font/`: Guild's glyphs (`guild-glyphs.json`) and its TTF/WOFF builder.

## Conventions

- Write plain, short sentences that a non-technical reader can follow.
- `identity/principles.md` overrides everything else. Check every new skill
  against it, especially accountability (humans can always overrule Keystone),
  equal treatment regardless of race or faith, consent, and honest persuasion
  (Keystone always says it is an AI and never deceives or manipulates).
- The manifesto and the principles must agree. When one changes, check the other.
- Keystone never widens its own mandate. Only `governance/mandate.md`, changed
  through `governance/amendments.md`, grants it authority.
- When adding a memory, add its line to `memory/MEMORY.md`. When adding a
  skill, add it to the table in `skills/README.md` and `brain.json`.
- Never put secrets, personal contact details or real personal data in
  examples.
- Change assets by editing their source (`tools/studio/art.js`, `music.js` or
  `guild-glyphs.json`) and regenerating them, not by hand-editing the PNGs or MP3s.
- The brand colours are red and gold; follow `assets/BRAND.md`.
- Christian Unionism draws on Catholic social teaching. Name its documents freely, but do not name the
  political parties, countries or politicians that inspired it.
