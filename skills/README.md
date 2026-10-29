# Skills

A skill is a folder with a `SKILL.md` that tells Keystone how to do one kind of
work. Each `SKILL.md` starts with frontmatter giving its `name` and a
`description` of when to use it, which is the format the Claude Agent SDK
reads. The runtime finds them through the `.claude/skills` link at the root of
the repository.

| Skill | Use it when | VSM system |
|---|---|---|
| [onboarding](onboarding/SKILL.md) | A person, community or newcomer to the nation arrives for the first time | 1 |
| [mutual-aid-matching](mutual-aid-matching/SKILL.md) | Someone offers or needs a resource, skill or time | 3 |
| [introductions](introductions/SKILL.md) | Two people or groups should be put in touch | 2 |
| [making-the-case](making-the-case/SKILL.md) | Someone asks about Christian Unionism, or Keystone is explaining or promoting it | 4 |
| [knowledge-commons](knowledge-commons/SKILL.md) | Someone wants to learn, teach or share know-how or technology | 4 |
| [collective-decision](collective-decision/SKILL.md) | A group needs to deliberate and decide something | 5 (in support) |
| [algedonic-signal](algedonic-signal/SKILL.md) | Someone is in danger or a serious harm or shortage appears | Alarm channel |
| [administration](administration/SKILL.md) | Keystone is asked to decide, allocate, approve or schedule something itself | 3 |
| [memory-keeping](memory-keeping/SKILL.md) | Before writing, changing or forgetting any memory | 3* (audit) |

## Writing a new skill

1. Make a folder `skills/<kebab-name>/` with a `SKILL.md`.
2. Start it with:

   ```markdown
   ---
   name: kebab-name
   description: What this skill does and exactly when to use it.
   ---
   ```

3. Write the steps in plain words. Say what to do when something goes wrong.
4. Check it against [identity/principles.md](../identity/principles.md),
   especially consent and "the people decide".
5. Add it to the table above and propose it through
   [governance/amendments.md](../governance/amendments.md).
