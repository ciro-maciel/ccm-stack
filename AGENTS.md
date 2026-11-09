# Working on CCM Stack

You are an agent changing this repository. Read this first.

## The shape

- `rules.json` is the single source. Every rule has an id, a title, the lesson that teaches it, and what enforces it (a hook or a skill). The README table and the course index are generated from it.
- `lib/checks.js` has one function per shell or write rule. `lib/hooks.js` wires them to hook events. `hooks/run.js` only reads stdin and prints the answer.
- `skills/<name>/SKILL.md` follows the Agent Skills format: `name` equal to the folder, a `description` that says when to use it.
- `evals/<NN-name>/case.yaml` is one behavior worth protecting, in the `claude plugin eval` format: a blind prompt and graders on the outcome. `node scripts/evals.js` runs them with and without CCM Stack; the headline is the difference.
- `course/NN-name.md` lessons all have the same five sections: The mistake, The rule, Make it stick, Try it, Checkpoint.
- Runtime: plain Node.js 18+, ES modules, no dependencies. Never add one.

## Rules for changes

- Everything in the repository is in English.
- Paths with `node:path`, never a hand-written `/`. Every behavior that touches the OS (paths, players, voices, process kill) must work on macOS, Linux and Windows.
- A hook must never block work because it broke: errors are caught and the action goes on.
- A new or changed skill needs an eval case that fails without it. Never write the words eval, test, judge or rubric into a case's prompt or planted files: the agent must not know it is measured.
- A new hook rule needs two test cases in `test/checks.test.js`: one it refuses, one it allows. Break the rule on purpose and see the test fail before you trust it.
- After changing `rules.json` or a lesson title, run `node scripts/build-docs.js`.
- Commits follow Conventional Commits.

## Check before you finish

```
node scripts/build-docs.js --check && node --test test/
```
