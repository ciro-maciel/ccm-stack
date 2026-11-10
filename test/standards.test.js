// Project standards: each pack refuses what a change adds and lets the old code be, the hook and
// the commit both run them, and init measures the project before proposing anything.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { ROOT } from '../lib/rules.js'
import { activePacks, newViolations, propose } from '../lib/standards/index.js'

function project(packs, files = {}, pkg) {
	const root = mkdtempSync(join(tmpdir(), 'ccm-std-'))
	mkdirSync(join(root, '.git'))
	if (packs) writeFileSync(join(root, 'ccm.standards.json'), JSON.stringify({ packs }))
	if (pkg) writeFileSync(join(root, 'package.json'), JSON.stringify(pkg))
	for (const [name, text] of Object.entries(files)) {
		mkdirSync(join(root, name, '..'), { recursive: true })
		writeFileSync(join(root, name), text)
	}
	return root
}
const added = (root, file, newText, oldText = '', extra = {}) => newViolations({ path: join(root, file), root, newText, oldText, ...extra })

test('naming: a new userID and a boolean without a question are refused, with the fix', () => {
	const root = project({ naming: true })
	const found = added(root, 'src/user.js', 'const userID = 1\nconst active = true\nconst [open, setOpen] = useState(false)\n')
	assert.deepEqual(
		found.map((item) => item.message.split(':')[1]?.trim() ?? item.message),
		['write userId.', 'name it as a question, isActive (or has, can, should).', 'name it as a question, isOpen (or has, can, should).'],
	)
	assert.match(added(root, 'src/a.js', 'const isNotReady = false\n')[0].message, /affirmative/)
})

test('naming: names inside strings, comments and SCREAMING constants are not names', () => {
	const root = project({ naming: true })
	assert.deepEqual(added(root, 'src/a.js', '// the userID column\nconst label = "userID"\nconst IDLE_MS = 5\nconst isOpen = true\n'), [])
})

test('naming: a change that keeps an old userID is not blamed for it; one more is', () => {
	const root = project({ naming: true })
	const old = 'const userID = 1\n'
	assert.deepEqual(added(root, 'src/a.js', `${old}const total = 2\n`, old), [])
	assert.equal(added(root, 'src/a.js', `${old}const orderID = 2\n`, old).length, 1)
})

test('naming: a new script file must be kebab-case; components and old files are left alone', () => {
	const root = project({ naming: true })
	assert.match(added(root, 'src/useSeoMeta.js', 'export {}\n', '', { isNew: true })[0].message, /use-seo-meta\.js/)
	assert.deepEqual(added(root, 'src/use-seo-meta.js', 'export {}\n', '', { isNew: true }), [])
	assert.deepEqual(added(root, 'src/HeroBand.jsx', 'export {}\n', '', { isNew: true }), [])
	assert.deepEqual(added(root, 'src/useSeoMeta.js', 'export {}\n', 'export {}\n'), [])
})

test('api-keys: a secret in code is refused; in the env file it is the right place, until it is committed', () => {
	const root = project({})
	const key = `hk_${'a1B2c3D4'.repeat(3)}`
	assert.match(added(root, 'src/deploy.js', `const key = '${key}'\n`)[0].message, /environment file/)
	assert.deepEqual(added(root, '.env', `HOSTER_KEY=${key}\n`), [])
	assert.match(added(root, '.env', `HOSTER_KEY=${key}\n`, '', { isCommit: true })[0].message, /being committed/)
})

test('api-keys: public keys, placeholders, the bare PEM marker and an allowed line pass', () => {
	const root = project({})
	const text = [
		`const pu = 'pu_${'f00d'.repeat(16)}'`,
		`const fake = 'msk_${'a'.repeat(40)}'`,
		"const start = '-----BEGIN PRIVATE KEY-----'",
		`const devKey = 'fk_${'c3e1'.repeat(8)}' // ccm: allow the fixed local development key`,
	].join('\n')
	assert.deepEqual(added(root, 'src/a.js', text), [])
})

test('zen: radius, shadows, colors, weights and other icon sets are refused; red.6 and none pass', () => {
	const root = project({ zen: true })
	const bad = [
		'<Paper radius="md" shadow="sm" c="blue.6" fw={600} />',
		"const style = { borderRadius: 8, boxShadow: '0 1px 2px #000', backgroundColor: '#fafafa' }",
		"import { Check } from 'lucide-react'",
	].join('\n')
	assert.equal(added(root, 'src/a.jsx', bad).length, 8)
	assert.deepEqual(added(root, 'src/b.jsx', '<Text c="red.6" fw={700}>Falhou</Text>\n'), [])
	assert.deepEqual(added(root, 'src/c.css', '.card { box-shadow: none; border: 1px solid var(--mantine-color-gray-2) }\n'), [])
	assert.deepEqual(added(root, 'worker/mail.js', "const html = '<p style=\"color:#1a1a1a\">'\n"), [], 'e-mail HTML in a worker needs hex')
})

test('a pack runs because the project declares it or shows it, and the file can turn one off', () => {
	const byId = (root) => Object.fromEntries(activePacks(root).map((item) => [item.pack.id, item.isActive]))
	assert.deepEqual(byId(project(null)), { naming: false, 'api-keys': true, zen: false })
	assert.deepEqual(byId(project(null, {}, { dependencies: { '@ciromaciel/components-kit': '1.0.0' } })), { naming: false, 'api-keys': true, zen: true })
	assert.deepEqual(byId(project({ naming: true, 'api-keys': false })), { naming: true, 'api-keys': false, zen: false })
	const root = project({ naming: true, ignore: [] })
	writeFileSync(join(root, 'ccm.standards.json'), JSON.stringify({ packs: { naming: true }, ignore: ['legacy'] }))
	assert.deepEqual(added(root, 'legacy/old.js', 'const userID = 1\n'), [])
})

test('init measures the project and proposes what most of it already does', () => {
	const tidy = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`src/m${i}.js`, `export const isOn${i} = true\n`]))
	const root = project(null, { ...tidy, 'src/bad.js': 'const userID = 1\n' })
	spawnSync('git', ['init', '-q'], { cwd: root })
	const { file, reasons } = propose(root)
	assert.deepEqual(file.packs, { naming: true, 'api-keys': true })
	assert.match(reasons[0], /^naming: 90% of 10 file\(s\) already follow it/)
})

test('the write hook refuses the new deviation and names the pack', () => {
	const root = project({ naming: true })
	const home = mkdtempSync(join(tmpdir(), 'ccm-home-'))
	const input = { hook_event_name: 'PreToolUse', tool_name: 'Write', cwd: root, tool_input: { file_path: join(root, 'src', 'user.js'), content: 'export const userID = 1\n' } }
	const result = spawnSync(process.execPath, [join(ROOT, 'hooks', 'run.js')], { input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, CCM_STACK_HOME: home } })
	const output = JSON.parse(result.stdout)
	assert.equal(output.hookSpecificOutput.permissionDecision, 'deny')
	assert.match(output.hookSpecificOutput.permissionDecisionReason, /follow-project-standards: naming\). "userID" spells ID in capitals: write userId\. Line 1\./)
})

test('the pre-commit hook refuses a staged secret, whoever commits', () => {
	const root = project({})
	spawnSync('git', ['init', '-q'], { cwd: root })
	writeFileSync(join(root, 'deploy.js'), `export const key = 'ak_${'Q7w8E9r0'.repeat(3)}'\n`)
	spawnSync('git', ['add', 'deploy.js'], { cwd: root })
	const result = spawnSync(process.execPath, [join(ROOT, 'bin', 'ccm.js'), 'check', 'pre-commit'], { cwd: root, encoding: 'utf8', env: { ...process.env, CCM_STACK_HOME: mkdtempSync(join(tmpdir(), 'ccm-home-')) } })
	assert.notEqual(result.status, 0)
	assert.match(result.stdout + result.stderr, /deploy\.js: A secret \(ak_Q7…\) is written in the code.*\(api-keys\)/)
})

test('api-keys: a key id in a presigned URL and a Google browser key are public, an AWS key id in code is not', () => {
	const root = project({})
	const id = `AKIA${'QWERTYUIOPASDFGH'}`
	assert.deepEqual(added(root, 'docs/a.md', `![](https://b.s3.amazonaws.com/x.jpg?X-Amz-Credential=${id}%2F2026)\n`), [])
	assert.deepEqual(added(root, 'src/maps.js', `const key = 'AIza${'Sy0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u'}'\n`), [])
	assert.equal(added(root, 'src/s3.js', `const accessKeyId = '${id}'\n`).length, 1)
})

test('zen shown by evidence holds only the screens of the app that uses the kit', () => {
	const root = project(null, {
		'apps/panel/package.json': JSON.stringify({ dependencies: { '@ciromaciel/components-kit': '1.0.0' } }),
		'apps/mail/package.json': JSON.stringify({ dependencies: { 'react-email': '1.0.0' } }),
	})
	spawnSync('git', ['init', '-q'], { cwd: root })
	spawnSync('git', ['add', '.'], { cwd: root })
	const card = '<Paper radius="md" />\n'
	assert.equal(added(root, 'apps/panel/src/card.jsx', card).length, 1)
	assert.deepEqual(added(root, 'apps/mail/src/card.jsx', card), [])
})
