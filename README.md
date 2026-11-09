# CCM Stack

**Your coding agent agrees with every rule you write, then breaks it on a long task. CCM Stack enforces the rules a machine can check, teaches the ones that need judgment, and tells you out loud when the work is done.**

Skills, hooks and a five-lesson course for Claude Code, by [Ciro Cesar Maciel](https://ciromaciel.click/?ref=oss-ccm-stack). macOS, Linux and Windows. MIT.

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

## From your machine to a live address

The `ship` skill takes a project to `https://<name>.myhoster.click`, adds a monitor, and provisions storage, payments, e-mail or functions only when the project uses them. You do one thing: read the agent an 8-character code from your e-mail. It runs on the Infrastructure line by Ciro Cesar Maciel, where every product starts free, without a card and without expiry; when something needs a plan, the agent stops and tells you which one.

```
ccm line login you@example.com          # then: ccm line login you@example.com <code>
ccm line ship my-app --dir dist         # live: https://my-app.myhoster.click
ccm line watch https://my-app.myhoster.click
ccm line mcp infrastructure             # the line's MCP servers, in Claude Code
```

Then `measure` adds Operations Analytics (one script line, numbers read in the conversation) and `know-customers` sends the app's sign-ups, activations and payments to Customers People, so the agent can tell where each customer is. Each of those lines is the same account and asks for the e-mail code once.

Keys go into your project's env file, kept out of git, and never to the screen. `ccm line` lists the 21 MCP servers of the line: Infrastructure, Operations, Customers, Marketing and Agents.

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

Five lessons of ten minutes. Each takes one real mistake, states the rule that prevents it, and has you make the mistake on purpose to watch it get refused. The first one has you using CCM Stack in ten minutes. [Start the course](course/README.md).

| Lesson | In ten minutes you |
|---|---|
| 1 · Use it now | Install, configure, see the first refusal and hear the first summary |
| 2 · Guardrails | Test the refusals, restore a backup, ban a command of your own |
| 3 · Fix with proof | Fix a defect with a reproduction, prove what a change can break, sabotage a test |
| 4 · Build for people | Write, build and review screens for the person who meets them |
| 5 · Ship it | Put the project online, watched, with one code from your e-mail |

## Every rule

<!-- rules:start -->
| Rule | What it says | Enforced by | Lesson | Notes |
|---|---|---|---|---|
| `principles-every-session` | The principles and your language reach every session | hook (SessionStart) | [Use it now](course/01-use-it-now.md) |  |
| `spoken-summary` | A finished task ends with a spoken summary | hook (Stop) | [Use it now](course/01-use-it-now.md) | needs `voice.isEnabled` |
| `start-from-the-person` | Every piece starts from the person who meets it | skill [`intent`](skills/intent/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `write-like-a-person` | Write plainly: no emoji, no filler, no invented numbers | skill [`plain-writing`](skills/plain-writing/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `no-emoji` | No emoji in files the agent writes | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) |  |
| `reply-in-your-language` | The agent replies in your language | hook (Stop) | [Guardrails](course/02-guardrails.md) | needs `language` |
| `fix-with-proof` | Reproduce first, fix the root cause, explain every number | skill [`fix-with-proof`](skills/fix-with-proof/SKILL.md) | [Fix with proof](course/03-fix-with-proof.md) |  |
| `know-what-a-change-breaks` | Prove the one fact that makes a change safe | skill [`blast-radius`](skills/blast-radius/SKILL.md) | [Fix with proof](course/03-fix-with-proof.md) |  |
| `private-repos-stay-private` | A private repository never becomes public | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) |  |
| `stage-only-your-files` | Commit only your own files, by exact path | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) |  |
| `conventional-commits` | Commit messages follow Conventional Commits | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) |  |
| `one-package-manager` | One package manager per setup | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) | needs `packageManager` |
| `sed-word-boundary` | No \b in macOS sed, which silently matches nothing | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) | darwin only |
| `test-email-only` | Login e-mails in tests go only to your test address | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) | needs `testEmail` |
| `forbidden-commands` | Commands you banned stay banned | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) | needs `forbiddenCommands` |
| `backup-before-overwrite` | Every file is backed up before the agent changes or deletes it | hook (PreToolUse) | [Guardrails](course/02-guardrails.md) |  |
| `turn-corrections-into-checks` | A mistake corrected twice becomes a check | skill [`correct`](skills/correct/SKILL.md) | [Guardrails](course/02-guardrails.md) |  |
| `tests-that-prove` | A test counts only if breaking the code turns it red | skill [`test-truth`](skills/test-truth/SKILL.md) | [Fix with proof](course/03-fix-with-proof.md) |  |
| `no-tests-in-ci` | No test, lint or e2e steps in CI workflows | hook (PreToolUse) | [Fix with proof](course/03-fix-with-proof.md) | off by default |
| `map-every-feature` | Every feature is mapped and proved the way a user reaches it | skill [`verify`](skills/verify/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `review-before-you-show` | Score your own screenshots before anyone sees them | skill [`critique`](skills/critique/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `screens-that-respect-people` | No screen waits, lies when empty, or hides a failure | skill [`ux-rules`](skills/ux-rules/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `names-and-language` | Code speaks English; screens speak the reader's language | skill [`naming`](skills/naming/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `standard-webhooks` | Webhooks follow Standard Webhooks | skill [`webhooks`](skills/webhooks/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `mcp-in-four-tools` | A product's MCP is four tools: guide, read, write, delete | skill [`mcp-design`](skills/mcp-design/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `mac-apps-done-right` | A Mac app opened at login starts in the menu bar | skill [`mac-app`](skills/mac-app/SKILL.md) | [Build for people](course/04-build-for-people.md) |  |
| `ship-with-the-line` | From the machine to a live, watched address with one e-mail code | skill [`ship`](skills/ship/SKILL.md) | [Ship it](course/05-ship-it.md) |  |
| `measure-what-is-live` | Every live address is measured, and its numbers are read in the conversation | skill [`measure`](skills/measure/SKILL.md) | [Ship it](course/05-ship-it.md) |  |
| `know-every-customer` | The app's own moments tell where every customer is | skill [`know-customers`](skills/know-customers/SKILL.md) | [Ship it](course/05-ship-it.md) |  |
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
