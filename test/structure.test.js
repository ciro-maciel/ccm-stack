// Keeps the single source honest: every rule has a lesson, every skill exists,
// every hook rule is wired, and the generated docs match rules.json.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { ROOT, RULES } from '../lib/rules.js'

const read = (...parts) => readFileSync(join(ROOT, ...parts), 'utf8')

test('every rule has a unique id and an existing lesson', () => {
	assert.equal(new Set(RULES.map((rule) => rule.id)).size, RULES.length)
	for (const rule of RULES) assert.ok(existsSync(join(ROOT, 'course', `${rule.lesson}.md`)), `${rule.id}: lesson ${rule.lesson} missing`)
})

test('every skill rule points at a skill whose name matches its folder', () => {
	for (const rule of RULES.filter((item) => item.enforcedBy === 'skill')) {
		const text = read('skills', rule.skill, 'SKILL.md')
		assert.match(text, new RegExp(`^---\\nname: ${rule.skill}\\ndescription: .+\\n---`), `${rule.skill}: bad frontmatter`)
	}
})

test('every skill folder has valid frontmatter', () => {
	for (const name of readdirSync(join(ROOT, 'skills'))) {
		const text = read('skills', name, 'SKILL.md')
		assert.match(text, new RegExp(`^---\\nname: ${name}\\ndescription: .{40,1024}\\n---\\n`), `${name}: bad frontmatter`)
	}
})

test('every hook rule is wired in lib/hooks.js', () => {
	const hooks = read('lib', 'hooks.js')
	for (const rule of RULES.filter((item) => item.enforcedBy === 'hook')) {
		assert.ok(hooks.includes(`'${rule.id}'`), `${rule.id} is not wired`)
	}
})

test('every lesson follows the five-part format', () => {
	for (const file of readdirSync(join(ROOT, 'course')).filter((name) => /^\d{2}-/.test(name))) {
		const text = read('course', file)
		for (const heading of ['## The mistake', '## The rule', '## Make it stick', '## Try it', '## Checkpoint']) {
			assert.ok(text.includes(heading), `${file}: missing "${heading}"`)
		}
	}
})

test('the generated docs are up to date', () => {
	const result = spawnSync(process.execPath, [join(ROOT, 'scripts', 'build-docs.js'), '--check'], { encoding: 'utf8' })
	assert.equal(result.status, 0, result.stderr)
})

test('manifests agree on name and version', () => {
	const versions = ['package.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json'].map((file) => JSON.parse(read(file)))
	for (const manifest of versions) {
		assert.equal(manifest.name, 'ccm-stack')
		assert.equal(manifest.version, versions[0].version)
	}
})

test('no emoji anywhere in the repository text', () => {
	const files = spawnSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean)
	for (const file of files.filter((name) => /\.(md|js|json)$/.test(name))) {
		assert.doesNotMatch(read(file), /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u, file)
	}
})

test('every eval case is blind, graded on an outcome, and one checks that nothing fires', () => {
	const cases = readdirSync(join(ROOT, 'evals')).filter((name) => /^\d{2}-/.test(name))
	assert.ok(cases.length > 0, 'no eval cases')
	let hasShouldNotFire = false
	for (const name of cases) {
		const text = read('evals', name, 'case.yaml')
		const prompt = text.split(/\n {2}prompt: \|\n/)[1]?.split(/\ngraders:\n/)[0] ?? ''
		assert.ok(prompt.trim(), `${name}: no prompt`)
		assert.doesNotMatch(prompt, /\b(eval|evals|judge|rubric|benchmark|grader|score)\b/i, `${name}: the prompt tells the agent it is measured`)
		const types = [...text.matchAll(/^ {4}type: (\w+)$/gm)].map((match) => match[1])
		assert.ok(types.some((type) => type !== 'tool_used'), `${name}: needs a grader on the outcome, not only on the tools used`)
		if (/tags: \[[^\]]*should-not-fire/.test(text)) hasShouldNotFire = true
	}
	assert.ok(hasShouldNotFire, 'no case checks that the stack stays out of a plain request')
})
