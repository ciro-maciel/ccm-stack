#!/usr/bin/env node
// Runs the eval suite in evals/ with Claude Code's `claude plugin eval`, with and without CCM Stack.
// Each run happens in a sandbox home, so CCM Stack is in its first-run state: defaults, no voice, not
// configured. That is the state a new person meets, and the one these cases measure.
// Usage: node scripts/evals.js [extra claude plugin eval flags], e.g. --runs 1 --case fix-with-proof

import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

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
const result = spawnSync('claude', args, { cwd: root, stdio: 'inherit', env: process.env })
process.exit(result.status ?? 1)
