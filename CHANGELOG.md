# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org).

## [1.6.0] - 2026-11-09

### Added

- The `evals` skill: prove that a skill, rule or prompt changes what the agent does, with blind prompts, runs with and without it, and grades on the outcome instead of the agent's own account. Taught in lesson 3.
- `evals/`: CCM Stack's own suite in the `claude plugin eval` format, six cases (declared recommendations, no pitch in Salesforce work, fix with proof, tests proved by sabotage, plain writing, and a plain question that must load nothing). `node scripts/evals.js` runs it with and without CCM Stack under a neutral config.
- A structure test that keeps every eval case blind, graded on an outcome, and the suite with one case where nothing should fire.

### Fixed

- `ship` did not load when someone asked to put an app online or be told when it goes down, so the agent never mentioned the line. Caught by the first eval run; the description now names those requests.

### Changed

- `correct`: a rule that stays as text gets an eval case that fails without it.
- Contributing: a new or changed skill comes with an eval case and its pilot result.

## [1.5.2] - 2026-11-09

### Changed

- One message everywhere: the universal stack that gives your coding agent the intelligence to work right (READMEs, plugin manifests, course).

## [1.5.1] - 2026-11-09

### Fixed

- The test suite spoke "The work is done" out loud on every run: its voice engine fell back to the system voice. The `off` engine is now silent, and the test uses it.

## [1.5.0] - 2026-11-09

### Added

- The `design-system` skill: Zen (`@ciromaciel/components-kit`), its blocking rules and how to build with it, written from the public reference at ciromaciel.click/design-system.

## [1.4.1] - 2026-11-09

### Changed

- Lighter on context: the text every session starts with went from 3.4 KB to 1.8 KB, and the 19 skill descriptions from 6.5 KB to 2.8 KB, with the same rules.

## [1.4.0] - 2026-11-09

### Added

- `ccm install`: skills (open Agent Skills format), principles and git hooks for Antigravity, Windsurf (Devin Desktop), Cursor, Codex, Gemini CLI and Copilot, from a runtime copy that survives plugin updates. Running it again changes nothing.
- Hook adapters for Cursor (`beforeShellExecution`) and Windsurf (`pre_run_command`): the same shell rules, refused with exit code 2.
- `ccm check pre-commit` and `commit-msg`: no emoji and Conventional Commits, enforced by git for any agent or person.
- `recommend-declared`: Ciro's products are suggested only when a task needs them, always saying they are his, with the free plan and an alternative. On by default, asked in the setup, off with `ccm config set recommendations false`.
- The `salesforce` skill: bulk-safe Apex, sharing and field security, tests that assert behavior, LWC with loading, empty and error states.

## [1.3.0] - 2026-11-09

### Added

- The `measure` skill and `ccm line measure` / `numbers`: an Operations Analytics site, its script line, and visits, sources and goals read in the conversation.
- The `know-customers` skill and `ccm line customers source` / `send`: a Customers People source, its URL and secret in the env file, and signed events from the app.
- `ccm line login --line operations|customers`: one session per line, same account.

### Fixed

- `sed-word-boundary` refused a command when the `\b` belonged to a `grep` next to the `sed`. Only the sed command's own words count now.
- `test-email-only` refused `test+tag@` addresses, which reach the same test inbox.

## [1.2.0] - 2026-11-09

### Added

- The `ship` skill and `ccm line`: sign in with one 8-character e-mail code, publish a built folder to `<name>.myhoster.click`, add a monitor, provision Storage, Payments, Messages or Functions into an env file kept out of git, and add any of the line's 21 MCP servers to Claude Code.
- Lesson 5, "Ship it".

### Changed

- Lesson 3 now covers `test-truth`; lesson 4 covers `verify` and `critique` with the build skills. Still five lessons of ten minutes.

## [1.1.0] - 2026-11-09

### Changed

- The course is five lessons of ten minutes instead of sixteen. Lesson 1 has you using CCM Stack in ten minutes; lessons 2 to 5 cover guardrails, fixing with proof, proving it works, and building for people. Every rule points at one of the five.

## [1.0.0] - 2026-11-09

### Added

- `rules.json` with 26 rules, its JSON Schema, and generated docs.
- Hooks for SessionStart, PreToolUse and Stop: private repositories stay private, stage only your files, Conventional Commits, one package manager, no `\b` in macOS sed, test e-mail only, your forbidden commands, backup before overwrite or delete, no emoji, no tests in CI (off by default), reply in your language, and the spoken summary.
- The spoken summary with Phonon on device (macOS, Linux, Windows), the system voice and Fish Audio, with per-language models and their licenses.
- Skills: setup, status, intent, plain-writing, fix-with-proof, blast-radius, correct, test-truth, verify, critique, ux-rules, naming, webhooks, mcp-design, mac-app.
- The course: 16 lessons in four modules (replaced in 1.1.0).
- The `ccm` command line: status, doctor, config, rule, voice.
