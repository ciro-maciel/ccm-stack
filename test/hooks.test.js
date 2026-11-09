// End to end: runs hooks/run.js the way Claude Code does, with a private config folder.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { ROOT } from '../lib/rules.js'

function runHook(input, config) {
	const home = mkdtempSync(join(tmpdir(), 'ccm-test-'))
	if (config) writeFileSync(join(home, 'config.json'), JSON.stringify(config))
	const result = spawnSync(process.execPath, [join(ROOT, 'hooks', 'run.js')], {
		input: JSON.stringify(input),
		encoding: 'utf8',
		env: { ...process.env, CCM_STACK_HOME: home },
	})
	return { home, status: result.status, output: result.stdout ? JSON.parse(result.stdout) : null, stderr: result.stderr }
}

test('a refused command comes back as a deny decision with the reason', () => {
	const { output, status } = runHook({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git add -A' } })
	assert.equal(status, 0)
	assert.equal(output.hookSpecificOutput.permissionDecision, 'deny')
	assert.match(output.hookSpecificOutput.permissionDecisionReason, /stage-only-your-files/)
})

test('a rule turned off in the config does not run', () => {
	const { output } = runHook(
		{ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git add -A' } },
		{ rules: { 'stage-only-your-files': false } },
	)
	assert.equal(output, null)
})

test('a rule that needs config stays quiet without it', () => {
	const input = { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm install x' } }
	assert.equal(runHook(input).output, null)
	assert.equal(runHook(input, { packageManager: 'bun' }).output.hookSpecificOutput.permissionDecision, 'deny')
})

test('the file is backed up before the agent overwrites it', () => {
	const work = mkdtempSync(join(tmpdir(), 'ccm-work-'))
	const file = join(work, 'notes.md')
	writeFileSync(file, 'before')
	const { home, output } = runHook({ hook_event_name: 'PreToolUse', tool_name: 'Write', cwd: work, tool_input: { file_path: file, content: 'after' } })
	assert.equal(output, null)
	const index = readFileSync(join(home, 'backups', 'index.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line))
	assert.equal(index[0].from, file)
	assert.equal(readFileSync(index[0].to, 'utf8'), 'before')
})

test('a simple rm is backed up first', () => {
	const work = mkdtempSync(join(tmpdir(), 'ccm-work-'))
	mkdirSync(join(work, 'old'))
	writeFileSync(join(work, 'old', 'a.txt'), 'keep me')
	const { home } = runHook({ hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: work, tool_input: { command: 'rm -rf old' } })
	const [entry] = readFileSync(join(home, 'backups', 'index.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line))
	assert.equal(readFileSync(join(entry.to, 'a.txt'), 'utf8'), 'keep me')
})

test('emoji in a new file is refused', () => {
	const { output } = runHook({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: '/tmp/ccm-x/readme.md', content: 'Done \u{1F680}' } })
	assert.match(output.hookSpecificOutput.permissionDecisionReason, /no-emoji/)
})

test('a reply in the wrong language is sent back once', () => {
	const english =
		'I have finished the changes to the hooks. The guard is now in place and it will block every command that uses npm, and the write guard will refuse emoji in files that are under the project folder. You can check it with the tests that I ran.'
	const config = { language: 'pt-BR' }
	assert.equal(runHook({ hook_event_name: 'Stop', last_assistant_message: english }, config).output.decision, 'block')
	assert.equal(runHook({ hook_event_name: 'Stop', last_assistant_message: english, stop_hook_active: true }, config).output, null)
})

test('the session starts with the principles, the language and the voice instruction', () => {
	const unconfigured = runHook({ hook_event_name: 'SessionStart' }).output.hookSpecificOutput.additionalContext
	assert.match(unconfigured, /CCM Stack principles/)
	assert.match(unconfigured, /ccm-stack:setup/)
	const context = runHook({ hook_event_name: 'SessionStart' }, { language: 'pt-BR', voice: { isEnabled: true } }).output.hookSpecificOutput
		.additionalContext
	assert.match(context, /Brazilian Portuguese/)
	assert.match(context, /<!-- voice: \.\.\. -->/)
	assert.doesNotMatch(context, /ccm-stack:setup/)
})

test('a broken input never blocks the work', () => {
	const result = spawnSync(process.execPath, [join(ROOT, 'hooks', 'run.js')], { input: 'not json', encoding: 'utf8' })
	assert.equal(result.status, 0)
	assert.equal(result.stdout, '')
})

test('the speaking worker is started only when there is a voice comment', () => {
	const home = mkdtempSync(join(tmpdir(), 'ccm-test-'))
	writeFileSync(join(home, 'config.json'), JSON.stringify({ voice: { isEnabled: true, engine: 'none' } }))
	const env = { ...process.env, CCM_STACK_HOME: home }
	const run = (message) =>
		spawnSync(process.execPath, [join(ROOT, 'hooks', 'run.js')], { input: JSON.stringify({ hook_event_name: 'Stop', last_assistant_message: message }), env })
	run('No comment here.')
	assert.equal(existsSync(join(home, 'voice', 'pid')), false)
	run('Done.\n<!-- voice: The work is done. -->')
	assert.equal(existsSync(join(home, 'voice', 'pid')), true)
})
