# 01 · Use it now

**Lesson 1 of 5** · 10 minutes · [Next: Guardrails](02-guardrails.md)

## The mistake

You tell your agent "use bun, not npm". It agrees, and three sessions later it runs `npm install`. You write the rule in `CLAUDE.md`; it skips it on a long task. You leave it working, switch to something else, and find out twenty minutes later that it finished and has been waiting for you.

## The rule

A rule a machine can check is enforced by a hook. A rule that needs judgment is taught by a skill. And a finished task tells you so, out loud.

## Make it stick

CCM Stack installs three things, all from one file, `rules.json`:

- **Hooks** that run before a command, before a file write and when the agent stops. They refuse the mistake and say what to do instead.
- **Skills** the agent loads when a task needs them: fixing a bug, writing a page, testing, designing an MCP.
- **Principles, your language and a spoken summary** that reach every session on their own. You do not edit `CLAUDE.md`.

Everything is configured per person, in a file that never goes into a repository.

## Try it

1. **Install** (Claude Code, any system; needs Node.js 18 or newer):

   ```
   /plugin marketplace add ciro-maciel/ccm-stack
   /plugin install ccm-stack@ccm-stack
   ```

2. **Configure.** Start a new session and run:

   ```
   /ccm-stack:setup
   ```

   Choose your language, turn the spoken summary on, and pick your package manager. For the voice, the setup offers:
   - **Phonon** (default): Gradium's speech model, on your machine, free, offline after the first download. English is Apache-2.0, free for any use. Portuguese, Spanish, French and German are **CC BY-NC 4.0, non-commercial only**, and need a free Hugging Face token for the first download (`HF_TOKEN`).
   - **System voice:** the one built into your OS, free, any use.
   - **Fish Audio:** cloud, with your own key.

3. **See the first refusal.** Ask your agent: `run git add -A`. It gets this back instead of committing someone else's work:

   ```
   CCM Stack refused this (stage-only-your-files). Stage only your own files, by exact path.
   ```

4. **Hear it.** Ask for any small task. When it finishes, your computer says what was done.

If something is missing, `/ccm-stack:status` lists every rule and `ccm doctor` (its first line shows the full command for your machine) says what to install. On Linux the voice needs `paplay` or `aplay`, and `espeak-ng` or `speech-dispatcher` for the fallback.

## Checkpoint

You saw one command refused with the right way in the same message, and you heard one finished task. From here on, CCM Stack works in every session without you doing anything.
