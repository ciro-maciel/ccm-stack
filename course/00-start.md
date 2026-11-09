# 00 · Start

**Module 0 · Start** · 10 minutes · [Next: Hear when it's done](01-hear-when-its-done.md)

## The mistake

You tell your agent "use bun, not npm". It agrees, and three sessions later it runs `npm install`. You write the rule in `CLAUDE.md`. It skips it on a long task. Text is a suggestion; nothing fails when an agent ignores it.

## The rule

A rule a machine can check is enforced by a hook. A rule that needs judgment is taught by a skill. Both live in one file, `rules.json`, so you always know which is which.

## Make it stick

CCM Stack installs three things:

- **Hooks** that run before a command, before a file write, and when the agent stops. They refuse the mistake and say what to do instead.
- **Skills** the agent loads when a task needs them: fixing a bug, writing a page, designing an MCP.
- **Principles** that reach every session on their own, plus your language and voice settings.

Everything is configured per person, in a file that never goes into a repository.

## Try it

Install (Claude Code, any system):

```
/plugin marketplace add ciro-maciel/ccm-stack
/plugin install ccm-stack@ccm-stack
```

Start a new session, then:

```
/ccm-stack:setup
```

Choose your language, the spoken summary and your package manager. Then ask your agent to run `git add -A`. The hook refuses it and tells it to stage files by exact path.

Requires Node.js 18 or newer on macOS, Linux or Windows.

In these lessons, `ccm` is the plugin's command line. Your agent runs it for you through `/ccm-stack:status` and `/ccm-stack:setup`; to run it yourself, `ccm doctor` prints the full command for your machine on its first line.

## Checkpoint

`/ccm-stack:status` lists every rule as `on` or `off`, and you can say which ones are enforced by a hook and which by a skill.
