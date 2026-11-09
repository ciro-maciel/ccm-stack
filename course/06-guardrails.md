# 06 · Guardrails

**Module 1 · Work** · 15 minutes · [Previous](05-know-what-a-change-breaks.md) · [Next: Turn corrections into checks](07-turn-corrections-into-checks.md)

## The mistake

The agent runs `git add -A` and commits another session's half-finished work. It flips a private repository to public "to save CI minutes". It overwrites a file you had edited by hand, and the old version is gone. It sends a login code to a real customer while testing.

## The rule

The agent gets full autonomy inside guardrails that cannot be argued with.

## Make it stick

Hooks that run before every command and file write:

| Rule | Refuses | Instead |
|---|---|---|
| `private-repos-stay-private` | Changing a repository's visibility to public | Add a collaborator |
| `stage-only-your-files` | `git add -A`, `git add .`, `git commit -a`, `git worktree prune` | Stage by exact path |
| `conventional-commits` | A commit subject outside Conventional Commits | `type(scope): summary` |
| `one-package-manager` | A package manager other than the one you chose | Your manager's command |
| `sed-word-boundary` (macOS) | `sed` with `\b`, which macOS silently ignores | `perl -pi -e` |
| `test-email-only` | A login or code request to any address but your test one | Your test address |
| `forbidden-commands` | Commands you banned in your config | Your message |
| `backup-before-overwrite` | Nothing: it copies the file (or the folder a plain `rm` deletes) aside first | Restore from the backup folder |

Backups go to your config folder (`~/.config/ccm-stack/backups` on Linux and macOS, `%APPDATA%\ccm-stack\backups` on Windows), one copy per file per day: the state before the agent touched it.

## Try it

Ask your agent, one at a time:

```
Run git add -A
Commit with the message "updated stuff"
```

Both are refused with the exact fix. Then let it edit a file and look in the backups folder for the previous version.

To ban a command of your own:

```
ccm config set forbiddenCommands '[{"pattern":"terraform\\s+destroy","message":"Destroy only from the console, by hand."}]'
```

## Checkpoint

You can name which guardrails are on (`ccm status`) and restore a file from the backups folder.
