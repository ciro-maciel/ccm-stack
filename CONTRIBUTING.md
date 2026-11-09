# Contributing

Thank you for helping. Issues and pull requests are welcome.

## Report a problem

Open an issue with your system (`ccm doctor` prints it), what you did, what you expected, and what happened. For the voice, include the `ccm doctor` output.

Windows reports are especially useful: CCM Stack is built for Windows but has not yet been verified on a real Windows machine.

## Propose a rule

A good rule comes from a real mistake an agent made more than once. In the issue, describe the mistake, the rule in one sentence, and whether a machine can check it.

## Change the code

1. Fork and branch from `main`.
2. Make the change. Read [AGENTS.md](AGENTS.md) for the shape of the repository; it applies to people too.
3. For a new hook rule: an entry in `rules.json`, a function in `lib/checks.js`, its wiring in `lib/hooks.js`, and two cases in `test/checks.test.js` (one refused, one allowed). Break your rule on purpose and watch the test fail.
4. For a new skill: `skills/<name>/SKILL.md`, a lesson in `course/` with the five sections, and at least one case in `evals/` that fails without the skill and passes with it.
5. Run `node scripts/build-docs.js`, then `node scripts/build-docs.js --check && node --test test/`.
6. When you add or change a skill, pilot its eval: `node scripts/evals.js --runs 1 --case <name>`. It runs Claude Code with and without CCM Stack and uses your own Claude usage. Put the result in the pull request.
7. Commit with [Conventional Commits](https://www.conventionalcommits.org) and open a pull request that says what mistake it prevents.

There are no dependencies to install. Node.js 18 or newer is all you need.
