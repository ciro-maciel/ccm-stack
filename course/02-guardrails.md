# 02 · Guardrails

**Lesson 2 of 5** · 10 minutes · [Previous](01-use-it-now.md) · [Next: Fix with proof](03-fix-with-proof.md) · Skills: [`correct`](../skills/correct/SKILL.md), [`standards`](../skills/standards/SKILL.md)

## The mistake

The agent runs `git add -A` and commits another session's half-finished work. It flips a private repository to public "to save CI minutes". It overwrites a file you had edited by hand, and the old version is gone. It sends a login code to a real customer while testing. It answers you in English when you asked in Portuguese, for the third time this week.

## The rule

Give the agent full autonomy inside guardrails it cannot argue with. A mistake you corrected twice becomes one more guardrail.

## Make it stick

Hooks that run before every command and file write, and when the agent stops:

| Rule | Refuses | Instead |
|---|---|---|
| `private-repos-stay-private` | Changing a repository to public | Add a collaborator |
| `stage-only-your-files` | `git add -A`, `git add .`, `commit -a`, `worktree prune` | Stage by exact path |
| `conventional-commits` | A commit subject outside Conventional Commits | `type(scope): summary` |
| `one-package-manager` | Any package manager but yours | Your manager's command |
| `sed-word-boundary` (macOS) | `sed` with `\b`, which macOS silently ignores | `perl -pi -e` |
| `test-email-only` | Login or code requests to any address but your test one | Your test address |
| `forbidden-commands` | Commands you banned | Your own message |
| `no-emoji` | A file write that adds an emoji | A word or an icon |
| `follow-project-standards` | A write or commit that adds a deviation from `ccm.standards.json`: a secret in code always; `userID` or a non-question boolean, and the Zen design rules, where the project declares them | The fix, named in the refusal |
| `reply-in-your-language` | A reply in another language (sent back once) | The same reply, in yours |
| `backup-before-overwrite` | Nothing: it copies the file, or the folder a plain `rm` deletes, aside first | Restore from the backups folder |

Backups go to `~/.config/ccm-stack/backups` on Linux and macOS, or `%APPDATA%\ccm-stack\backups` on Windows: one copy per file per day, the state before the agent touched it.

Your team's conventions are guardrails too. `ccm standards init` measures what the project already does and proposes `ccm.standards.json`; once it is committed, every agent and every commit follows it, and only what a change adds is refused, so the older code never blocks you.

When you catch yourself correcting the same thing twice, run `/ccm-stack:correct`. It finds the repeated mistakes in your history and turns each one into a check, from the highest level that works: structure, then a hook or lint, then a test, and written text only for judgment calls.

## Try it

1. Ask your agent: `commit with the message "updated stuff"`. Refused, with the format to use.
2. Let it edit a file, then open the backups folder and find the version from before.
3. Ban a command of your own:

   ```
   ccm config set forbiddenCommands '[{"pattern":"terraform\\s+destroy","message":"Destroy only from the console, by hand."}]'
   ```

   Ask the agent to run `terraform destroy` and read your own message coming back.
4. In one of your projects: `ccm standards init`. Read how much of the code already follows each standard, agree on the file, and write it with `--write`.

## Checkpoint

You restored a file from the backups folder, one of your own corrections is now a check instead of a line of text, and your project has a `ccm.standards.json` the whole team follows.
