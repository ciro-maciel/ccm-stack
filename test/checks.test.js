// Each rule is proved both ways: it refuses the real mistake and lets the right command through.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as checks from '../lib/checks.js'
import { isWrongLanguage } from '../lib/language.js'

const shell = (command) => ({ command, bare: checks.bareCommand(command) })
const config = {
	packageManager: 'bun',
	testEmail: 'tests@example.com',
	forbiddenCommands: [{ pattern: 'playwriter', message: 'Drive the browser through your MCP.' }],
}

const cases = {
	privateReposStayPrivate: {
		refuses: ['gh repo edit me/app --visibility public', 'gh api -X PATCH repos/me/app -f private=false', `gh api graphql -f query='mutation { updateRepository(input:{visibility: PUBLIC}) }'`],
		allows: ['gh repo create me/new --public', 'gh repo view me/app', 'gh repo edit me/app --description "x"'],
	},
	stageOnlyYourFiles: {
		refuses: ['git add -A', 'git add .', 'cd app && git add --all', 'git commit -am "fix: x"', 'git worktree prune'],
		allows: ['git add src/a.js docs/b.md', 'git commit -m "fix: run git add -A in docs" -- a.js', 'git status'],
	},
	conventionalCommits: {
		refuses: ['git commit -m "updated stuff" -- a.js', 'git commit -m "Fix: bug." -- a.js', "git commit -m 'feat: add page.' -- a.js"],
		allows: [
			'git commit -m "feat(auth): add device login" -- a.js',
			"git commit -m \"$(cat <<'EOF'\nfix: keep the draft when the save fails\n\nBody text.\nEOF\n)\" -- a.js",
			'git commit',
			'git log --oneline',
		],
	},
	onePackageManager: {
		refuses: ['npm install lodash', 'cd app && npx vite build', 'pnpm add zod', 'yarn', 'echo $(npx foo)'],
		allows: ['bun install', 'bunx vite build', 'npm view react version', 'npm publish', 'grep -rn "npm install" docs/'],
	},
	sedWordBoundary: {
		refuses: [String.raw`sed -i '' 's/\bold\b/new/g' a.js`, String.raw`sed 's/\<a\>/b/' f`],
		allows: [
			"sed -n '1,20p' file",
			String.raw`perl -pi -e 's/\bold\b/new/g' a.js`,
			// Found in use on 09/11/2026: the \b belonged to the grep, not to the sed.
			String.raw`sed -n 104,160p people.txt; grep -n "GET /people\b" people.txt`,
		],
	},
	testEmailOnly: {
		refuses: [`curl -X POST https://auth.example.com/auth/code/start -d '{"email":"person@gmail.com"}'`],
		allows: [
			`curl -X POST https://auth.example.com/auth/code/start -d '{"email":"tests@example.com"}'`,
			'curl https://example.com/health',
			// Found in use on 09/11/2026: a +tag address reaches the same test inbox.
			`curl -s "https://inbox.example.com/code/start" && send --to tests+customer@example.com`,
		],
	},
	forbiddenCommands: {
		refuses: ['playwriter navigate https://example.com', 'ls; bunx playwriter tabs'],
		allows: ['grep -rn playwriter notes/', 'echo "never use playwriter"'],
	},
}

for (const [name, { refuses, allows }] of Object.entries(cases)) {
	test(`${name} refuses the mistake`, () => {
		for (const command of refuses) assert.ok(checks[name](shell(command), config), `should refuse: ${command}`)
	})
	test(`${name} lets the right command through`, () => {
		for (const command of allows) assert.equal(checks[name](shell(command), config), null, `should allow: ${command}`)
	})
}

test('noEmoji refuses a new emoji and allows one that was already there', () => {
	assert.ok(checks.noEmoji({ newText: 'Saved \u{2705}', oldText: 'Saved' }))
	assert.ok(checks.noEmoji({ newText: '# Done \u{1F680}', oldText: '' }))
	assert.equal(checks.noEmoji({ newText: '\u{1F680} old line, edited', oldText: '\u{1F680} old line' }), null)
	assert.equal(checks.noEmoji({ newText: 'Ação concluída — próximo passo → ver', oldText: '' }), null)
})

test('noTestsInCi refuses test steps in workflows only', () => {
	const workflow = '/repo/.github/workflows/deploy.yml'
	assert.ok(checks.noTestsInCi({ path: workflow, newText: 'steps:\n  - run: bun test', oldText: 'steps:' }))
	assert.ok(checks.noTestsInCi({ path: workflow, newText: 'run: bunx playwright test', oldText: '' }))
	assert.equal(checks.noTestsInCi({ path: workflow, newText: 'run: bun run build && bunx wrangler deploy', oldText: '' }), null)
	assert.equal(checks.noTestsInCi({ path: '/repo/scripts/check.js', newText: '// run bun test locally', oldText: '' }), null)
})

test('reply language is detected, and technical words do not fool it', () => {
	const english =
		'I have finished the changes to the hooks. The guard is now in place and it will block every command that uses npm, and the write guard will refuse emoji in files that are under the project folder. You can check it with the tests that I ran.'
	const portuguese =
		'Pronto. O hook de commit agora recusa o git add em massa, o deploy do worker subiu e o build passou. Conferi o dashboard, o endpoint de status e o webhook; o cache foi limpo e a feature flag continua desligada para os clientes até você ver o resultado.'
	assert.equal(isWrongLanguage(english, 'pt-BR'), true)
	assert.equal(isWrongLanguage(portuguese, 'pt-BR'), false)
	assert.equal(isWrongLanguage(portuguese, 'en'), true)
	assert.equal(isWrongLanguage('Done.', 'pt-BR'), false)
})
