# CCM Stack

**Your coding agent agrees with every rule you write, then breaks it on a long task. CCM Stack enforces the rules a machine can check, teaches the ones that need judgment, and tells you out loud when the work is done.**

Skills, hooks and a 16-lesson course for Claude Code, by [Ciro Cesar Maciel](https://ciromaciel.click/?ref=oss-ccm-stack). macOS, Linux and Windows. MIT.

```
/plugin marketplace add ciro-maciel/ccm-stack
/plugin install ccm-stack@ccm-stack
/ccm-stack:setup
```

## What it does

Ask your agent to `git add -A` and it gets this back, instead of committing someone else's half-finished work:

```
CCM Stack refused this (stage-only-your-files). Stage only your own files, by exact path:
git add <file>... Check git status first; other work in this tree is not yours to commit.
```

Every rule exists in one of two forms, and all of them live in one file, [`rules.json`](rules.json):

- **Hooks** run before a command, before a file write and when the agent stops. They refuse the mistake and say what to do instead: no `git add -A`, no private repository made public, no commit outside Conventional Commits, no second package manager, no emoji, no reply in the wrong language. Every file is backed up before the agent changes or deletes it.
- **Skills** load when a task needs judgment: fixing a bug with proof, knowing what a change breaks, writing for the person who will read it, testing so that a broken feature turns the suite red, mapping and proving every feature, designing webhooks and MCP servers.

The principles behind them reach every session on their own. You do not edit your `CLAUDE.md`.

## Hear when it's done

When the agent finishes a task, your computer says what it did in one to three sentences, in your language. By default it uses [Phonon](https://huggingface.co/gradium), Gradium's speech model, running on your machine: free, offline after the first download, no account.

| Language | Model | License |
|---|---|---|
| English | `phonon-31m-en` | Apache-2.0, any use |
| Português, Español, Français, Deutsch | `phonon-40m-*` | **CC BY-NC 4.0, non-commercial use only** |

For commercial use in those languages, choose your system's built-in voice (free) or Fish Audio with your own key. If a voice fails, the system voice speaks instead. CCM Stack never ships a model; you download it under its own license.

## Yours, not ours

`/ccm-stack:setup` asks for your language, your voice, your package manager, your test e-mail and the commands you ban. Your answers go to your own config file, never to a repository:

- macOS and Linux: `~/.config/ccm-stack/config.json` (or `$XDG_CONFIG_HOME`)
- Windows: `%APPDATA%\ccm-stack\config.json`

`/ccm-stack:status` shows every rule, what enforces it and whether it runs on your machine. Any rule can be turned off.

## The course

Each lesson takes one real mistake, states the rule that prevents it, installs what enforces it, and has you make the mistake on purpose to watch it get refused. [Start the course](course/README.md).

| Module | Lessons |
|---|---|
| 0 · Start | Install and configure · Hear when it's done |
| 1 · Work | Start from the person · Write like a person · Fix with proof · Know what a change breaks · Guardrails · Turn corrections into checks |
| 2 · Prove | Tests that prove something · Map every feature · Review before you show |
| 3 · Build | Screens that respect people · Names and language · Webhooks the standard way · An MCP in four tools · Mac apps done right |

## Every rule

<!-- rules:start -->
| Rule | What it says | Enforced by | Lesson | Notes |
|---|---|---|---|---|
| `principles-every-session` | The principles and your language reach every session | hook (SessionStart) | [Start](course/00-start.md) |  |
| `spoken-summary` | A finished task ends with a spoken summary | hook (Stop) | [Hear when it's done](course/01-hear-when-its-done.md) | needs `voice.isEnabled` |
| `start-from-the-person` | Every piece starts from the person who meets it | skill [`intent`](skills/intent/SKILL.md) | [Start from the person](course/02-start-from-the-person.md) |  |
| `write-like-a-person` | Write plainly: no emoji, no filler, no invented numbers | skill [`plain-writing`](skills/plain-writing/SKILL.md) | [Write like a person](course/03-write-like-a-person.md) |  |
| `no-emoji` | No emoji in files the agent writes | hook (PreToolUse) | [Write like a person](course/03-write-like-a-person.md) |  |
| `reply-in-your-language` | The agent replies in your language | hook (Stop) | [Write like a person](course/03-write-like-a-person.md) | needs `language` |
| `fix-with-proof` | Reproduce first, fix the root cause, explain every number | skill [`fix-with-proof`](skills/fix-with-proof/SKILL.md) | [Fix with proof](course/04-fix-with-proof.md) |  |
| `know-what-a-change-breaks` | Prove the one fact that makes a change safe | skill [`blast-radius`](skills/blast-radius/SKILL.md) | [Know what a change breaks](course/05-know-what-a-change-breaks.md) |  |
| `private-repos-stay-private` | A private repository never becomes public | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) |  |
| `stage-only-your-files` | Commit only your own files, by exact path | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) |  |
| `conventional-commits` | Commit messages follow Conventional Commits | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) |  |
| `one-package-manager` | One package manager per setup | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) | needs `packageManager` |
| `sed-word-boundary` | No \b in macOS sed, which silently matches nothing | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) | darwin only |
| `test-email-only` | Login e-mails in tests go only to your test address | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) | needs `testEmail` |
| `forbidden-commands` | Commands you banned stay banned | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) | needs `forbiddenCommands` |
| `backup-before-overwrite` | Every file is backed up before the agent changes or deletes it | hook (PreToolUse) | [Guardrails](course/06-guardrails.md) |  |
| `turn-corrections-into-checks` | A mistake corrected twice becomes a check | skill [`correct`](skills/correct/SKILL.md) | [Turn corrections into checks](course/07-turn-corrections-into-checks.md) |  |
| `tests-that-prove` | A test counts only if breaking the code turns it red | skill [`test-truth`](skills/test-truth/SKILL.md) | [Tests that prove something](course/08-tests-that-prove.md) |  |
| `no-tests-in-ci` | No test, lint or e2e steps in CI workflows | hook (PreToolUse) | [Tests that prove something](course/08-tests-that-prove.md) | off by default |
| `map-every-feature` | Every feature is mapped and proved the way a user reaches it | skill [`verify`](skills/verify/SKILL.md) | [Map every feature](course/09-map-every-feature.md) |  |
| `review-before-you-show` | Score your own screenshots before anyone sees them | skill [`critique`](skills/critique/SKILL.md) | [Review before you show](course/10-review-before-you-show.md) |  |
| `screens-that-respect-people` | No screen waits, lies when empty, or hides a failure | skill [`ux-rules`](skills/ux-rules/SKILL.md) | [Screens that respect people](course/11-screens-that-respect-people.md) |  |
| `names-and-language` | Code speaks English; screens speak the reader's language | skill [`naming`](skills/naming/SKILL.md) | [Names and language](course/12-names-and-language.md) |  |
| `standard-webhooks` | Webhooks follow Standard Webhooks | skill [`webhooks`](skills/webhooks/SKILL.md) | [Webhooks the standard way](course/13-webhooks-the-standard-way.md) |  |
| `mcp-in-four-tools` | A product's MCP is four tools: guide, read, write, delete | skill [`mcp-design`](skills/mcp-design/SKILL.md) | [An MCP in four tools](course/14-an-mcp-in-four-tools.md) |  |
| `mac-apps-done-right` | A Mac app opened at login starts in the menu bar | skill [`mac-app`](skills/mac-app/SKILL.md) | [Mac apps done right](course/15-mac-apps-done-right.md) |  |
<!-- rules:end -->

## Requirements

- [Claude Code](https://docs.claude.com/en/docs/claude-code) with plugin support.
- Node.js 18 or newer. CCM Stack has no dependencies and installs nothing with a package manager.
- For the voice: nothing extra on macOS and Windows. On Linux, `paplay` or `aplay`, and `speech-dispatcher` or `espeak-ng` for the fallback voice. `ffmpeg`, when present, speeds speech up without changing its pitch.

Status by system: macOS verified; Linux verified; Windows built for, not yet verified on a real machine. If you run it on Windows, [tell us how it went](https://github.com/ciro-maciel/ccm-stack/issues).

The skills follow the open Agent Skills format, so editors that read `SKILL.md` files (Cursor among them) can use them too. The hooks are Claude Code's.

## Add your own rule

A rule a machine can check is three edits: an entry in `rules.json`, a function in `lib/checks.js`, and two cases in `test/checks.test.js`, one it refuses and one it allows. Then `node scripts/build-docs.js` updates the table above. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

Speech by [Phonon](https://github.com/gradium-ai/xn-ptts) from Gradium (engine Apache-2.0; models under the licenses above). Webhook format from [Standard Webhooks](https://www.standardwebhooks.com). Commit format from [Conventional Commits](https://www.conventionalcommits.org).

## License

[MIT](LICENSE). Made by [Ciro Cesar Maciel](https://ciromaciel.click/?ref=oss-ccm-stack).
