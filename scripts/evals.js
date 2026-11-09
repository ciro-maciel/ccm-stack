#!/usr/bin/env node
// Runs the eval suite in evals/ with Claude Code's `claude plugin eval`, with and without CCM Stack.
// Each run gets a neutral CCM Stack config (English, no voice), never the config of the person running it.
// Usage: node scripts/evals.js [extra claude plugin eval flags], e.g. --runs 1 --case fix-with-proof

import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const home = mkdtempSync(join(tmpdir(), 'ccm-evals-'))
writeFileSync(join(home, 'config.json'), JSON.stringify({ language: 'en', voice: { isEnabled: false, engine: 'off' } }))

const args = [
	'plugin', 'eval', '.',
	'--ablation', 'with-without',
	'--scaffold', // runs the scaffold.sh files in evals/, written for this suite
	'--trust-plugin',
	'--judge-model', 'sonnet',
	'--allow-tools', 'Edit', 'Write', 'Bash', // shell runs inside the eval sandbox
	'--no-publish',
	...process.argv.slice(2),
]
const result = spawnSync('claude', args, { cwd: root, stdio: 'inherit', env: { ...process.env, CCM_STACK_HOME: home } })
process.exit(result.status ?? 1)
