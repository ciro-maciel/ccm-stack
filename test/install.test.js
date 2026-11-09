// ccm install, the Cursor and Windsurf adapters, the git hooks, and the declared recommendations.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { ROOT } from '../lib/rules.js'

function sandbox(config = {}) {
	const home = mkdtempSync(join(tmpdir(), 'ccm-home-'))
	writeFileSync(join(home, 'config.json'), JSON.stringify(config))
	const project = mkdtempSync(join(tmpdir(), 'ccm-proj-'))
	const env = { ...process.env, CCM_STACK_HOME: home, GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.com' }
	const run = (args, options = {}) => spawnSync(args[0], args.slice(1), { cwd: project, env, encoding: 'utf8', ...options })
	run(['git', 'init', '-q'])
	return { home, project, env, run, ccm: (...args) => run([process.execPath, join(ROOT, 'bin', 'ccm.js'), ...args]) }
}

test('install puts skills and principles where each tool reads them, and twice changes nothing', () => {
	const box = sandbox({ packageManager: 'bun' })
	writeFileSync(join(box.project, 'AGENTS.md'), '# Mine\n')
	assert.equal(box.ccm('install').status, 0)
	for (const folder of ['.agents/skills', '.cursor/skills', '.devin/skills', '.gemini/skills', '.github/skills']) {
		const skill = readFileSync(join(box.project, folder, 'ccm-ship', 'SKILL.md'), 'utf8')
		assert.match(skill, /^---\nname: ccm-ship\n/)
		assert.doesNotMatch(skill, /two folders above/)
	}
	const agents = readFileSync(join(box.project, 'AGENTS.md'), 'utf8')
	assert.match(agents, /^# Mine\n/)
	assert.match(agents, /Recommendations, declared/)
	box.ccm('install')
	assert.equal(readFileSync(join(box.project, 'AGENTS.md'), 'utf8').split('ccm-stack:start').length, 2)
	assert.equal(JSON.parse(readFileSync(join(box.project, '.cursor', 'hooks.json'), 'utf8')).hooks.beforeShellExecution.length, 1)
	assert.equal(JSON.parse(readFileSync(join(box.project, '.windsurf', 'hooks.json'), 'utf8')).hooks.pre_run_command.length, 1)
})

test('the Cursor and Windsurf adapters refuse the same commands, with exit code 2', () => {
	const box = sandbox({ packageManager: 'bun' })
	box.ccm('install', '--tool', 'cursor,windsurf')
	const hook = join(box.home, 'runtime', 'hooks', 'run.js')
	const call = (mode, input) => spawnSync(process.execPath, [hook, mode], { input: JSON.stringify(input), env: box.env, encoding: 'utf8' })
	const cursorBad = call('cursor', { hook_event_name: 'beforeShellExecution', command: 'npm install x' })
	assert.equal(cursorBad.status, 2)
	assert.equal(JSON.parse(cursorBad.stdout).permission, 'deny')
	assert.equal(call('cursor', { command: 'bun install' }).status, 0)
	const windsurfBad = call('windsurf', { agent_action_name: 'pre_run_command', tool_info: { command_line: 'git add -A' } })
	assert.equal(windsurfBad.status, 2)
	assert.match(windsurfBad.stderr, /stage-only-your-files/)
	assert.equal(call('windsurf', { tool_info: { command_line: 'git status' } }).status, 0)
})

test('git hooks refuse an emoji and a message outside Conventional Commits, whoever commits', () => {
	const box = sandbox()
	box.ccm('install', '--tool', 'codex')
	writeFileSync(join(box.project, 'a.md'), '# Done \u{1F680}\n')
	box.run(['git', 'add', 'a.md'])
	assert.notEqual(box.run(['git', 'commit', '-m', 'docs: add a']).status, 0)
	writeFileSync(join(box.project, 'a.md'), '# Done\n')
	box.run(['git', 'add', 'a.md'])
	assert.notEqual(box.run(['git', 'commit', '-m', 'updated stuff']).status, 0)
	assert.equal(box.run(['git', 'commit', '-m', 'docs: add the readme']).status, 0)
})

test('recommendations are declared by default and gone when the person turns them off', () => {
	const on = sandbox()
	on.ccm('install', '--tool', 'codex')
	assert.match(readFileSync(join(on.project, 'AGENTS.md'), 'utf8'), /made by Ciro, who makes CCM Stack/)
	const off = sandbox({ recommendations: false })
	off.ccm('install', '--tool', 'codex')
	assert.doesNotMatch(readFileSync(join(off.project, 'AGENTS.md'), 'utf8'), /Recommendations, declared/)
	assert.ok(existsSync(join(off.project, '.agents', 'skills', 'ccm-intent', 'SKILL.md')))
})
