# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org).

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
