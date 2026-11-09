// One function per hook rule. Each returns null when the action may go on,
// or a message that tells the agent what to do instead.

const AT = String.raw`(?:^|[;&|(\n]|\$\()\s*`

// The command without heredoc bodies and quoted strings, so text inside a commit
// message or an echo never trips a rule meant for the command itself.
export function bareCommand(command) {
	return command
		.replace(/<<-?\s*['"]?(\w+)['"]?[^\n]*\n[\s\S]*?\n\s*\1\s*(?=\n|$)/g, ' ')
		.replace(/'[^']*'/g, ' ')
		.replace(/"(?:\\.|[^"\\])*"/g, ' ')
}

const atStart = (pattern) => new RegExp(`${AT}(?:${pattern})`, 'm')

// --- Shell commands ---------------------------------------------------------

export function privateReposStayPrivate({ command }) {
	const norm = command.toLowerCase().replace(/["']/g, '').replace(/\s*([=:])\s*/g, '$1')
	const isEditToPublic = /gh\s+repo\s+edit.*--visibility(=|\s+)public/.test(norm)
	const isApiToPublic =
		/(gh\s+api|api\.github\.com)/.test(norm) && /(private[=:]false|visibility[=:]public)/.test(norm)
	const isGraphqlToPublic = /graphql/.test(norm) && /(visibility[=:]public|updaterepository.*public)/.test(norm)
	if (!isEditToPublic && !isApiToPublic && !isGraphqlToPublic) return null
	return 'A private repository never becomes public. Only its owner changes visibility, by hand, on github.com. To share it, add a collaborator.'
}

export function stageOnlyYourFiles({ bare }) {
	if (atStart(String.raw`git\s+add(?:\s+[^;&|\n]*)?\s(?:-A|--all|-u|--update|\.|\*)(?=\s|$)`).test(bare)) {
		return 'Stage only your own files, by exact path: git add <file>... Check git status first; other work in this tree is not yours to commit.'
	}
	if (atStart(String.raw`git\s+commit(?:\s+[^;&|\n]*)?\s(?:-[a-zA-Z]*a[a-zA-Z]*|--all)(?=\s|$)`).test(bare)) {
		return 'commit -a takes everyone\'s changes along. Use: git commit -m "..." -- <your files>.'
	}
	if (atStart(String.raw`git\s+worktree\s+prune`).test(bare)) {
		return 'Remove only the worktrees you created, by exact path: git worktree remove <path>.'
	}
	return null
}

const COMMIT_SUBJECT = /^(feat|fix|refactor|perf|docs|test|build|ci|chore|style|revert)(\([\w./-]+\))?!?: \S.*[^.]$/

function commitSubject(command) {
	const heredoc = command.match(/-m\s+"?\$\(cat\s+<<-?\s*['"]?(\w+)['"]?[^\n]*\n([\s\S]*?)\n\s*\1/)
	if (heredoc) return heredoc[2].trim().split('\n')[0]
	const quoted = command.match(/(?:-m|--message)(?:=|\s+)(["'])([\s\S]*?)\1/)
	if (quoted) return quoted[2].trim().split('\n')[0]
	return null
}

export function conventionalCommits({ command, bare }) {
	if (!atStart(String.raw`git\s+commit\b`).test(bare)) return null
	const subject = commitSubject(command)
	if (subject === null || COMMIT_SUBJECT.test(subject)) return null
	return `Commit subject "${subject}" is not a Conventional Commit. Use "type(scope): imperative summary" with type feat, fix, refactor, perf, docs, test, build, ci, chore, style or revert, and no final period.`
}

const MANAGER_COMMANDS = {
	npm: String.raw`npm\s+(?:install|i|add|ci|uninstall|remove|rm|update|up|run|test|exec|start)(?=\s|$)|npx\s`,
	pnpm: String.raw`pnpm(?=\s|$)|pnpx\s`,
	yarn: String.raw`yarn(?=\s|$)`,
	bun: String.raw`bun\s+(?:install|i|add|remove|rm|update|x)(?=\s|$)|bunx\s`,
}
const MANAGER_HINT = {
	npm: 'npm install, npm run, npx',
	pnpm: 'pnpm install, pnpm add, pnpm dlx',
	yarn: 'yarn, yarn add, yarn dlx',
	bun: 'bun install, bun add, bun run, bunx',
}

export function onePackageManager({ bare }, config) {
	const chosen = config.packageManager
	for (const [manager, pattern] of Object.entries(MANAGER_COMMANDS)) {
		if (manager === chosen) continue
		if (atStart(pattern).test(bare)) {
			return `This setup uses ${chosen}, not ${manager}: ${MANAGER_HINT[chosen] ?? chosen}. Two lockfiles drift apart without warning.`
		}
	}
	return null
}

export function sedWordBoundary({ command, bare }) {
	if (!atStart(String.raw`sed\s`).test(bare) || !/\\[b<>]/.test(command)) return null
	return "macOS sed does not understand \\b, \\< or \\>: it matches nothing and exits 0. Use perl -pi -e 's/\\bold\\b/new/g' <file> and check the result."
}

const AUTH_PATH = /(code\/start|magic|reset|otp|sign-?in|sign-?up|login|verify-email)/i
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi

export function testEmailOnly({ command, bare }, config) {
	if (!atStart(String.raw`curl\s`).test(bare) || !AUTH_PATH.test(command)) return null
	const allowed = config.testEmail.toLowerCase()
	const other = (command.match(EMAIL) || []).find((email) => email.toLowerCase() !== allowed)
	if (!other) return null
	return `Login and code flows in tests use only ${config.testEmail}. Do not send a real e-mail to ${other}.`
}

export function forbiddenCommands({ bare }, config) {
	for (const { pattern, message } of config.forbiddenCommands) {
		const runner = String.raw`(?:(?:npx|bunx|pnpx|pnpm\s+dlx|yarn\s+dlx)\s+)?`
		if (new RegExp(`${AT}${runner}(?:${pattern})(?=\\s|$)`, 'm').test(bare)) {
			return message || `"${pattern}" is on your forbidden list.`
		}
	}
	return null
}

// --- File writes ------------------------------------------------------------

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{FE0F}]/gu
const count = (text, pattern) => (text.match(pattern) || []).length

export function noEmoji({ newText, oldText }) {
	if (count(newText, EMOJI) <= count(oldText, EMOJI)) return null
	const found = newText.match(EMOJI)[0]
	return `No emoji: an icon from your design system carries the state, the word carries the meaning. Found: ${found}`
}

const CI_FILE = /(\/\.github\/workflows\/[^/]+\.ya?ml|\/\.gitlab-ci\.ya?ml|\/\.circleci\/config\.ya?ml)$/
const CI_TEST =
	/\b((?:bun|npm|pnpm|yarn) (?:run )?test|playwright test|vitest|jest|eslint|biome (?:check|lint)|(?:bun|npm|pnpm|yarn) run lint|smoke|e2e)\b/gi

export function noTestsInCi({ path, newText, oldText }) {
	if (!CI_FILE.test(path.replaceAll('\\', '/'))) return null
	if (count(newText, CI_TEST) <= count(oldText, CI_TEST)) return null
	const found = newText.match(CI_TEST)[0]
	return `No test, lint, smoke or e2e step in CI: run checks on your machine; production is watched by monitors. Remove the step instead of commenting it out. Found: ${found}`
}
