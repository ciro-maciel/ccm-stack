// The one entry point for every hook. Claude Code pipes the event as JSON on stdin;
// lib/hooks.js applies the active rules and this file prints the answer.

import { loadConfig } from '../lib/config.js'
import { foreignShell, HANDLERS } from '../lib/hooks.js'

let raw = ''
for await (const chunk of process.stdin) raw += chunk
try {
	const input = JSON.parse(raw)
	const mode = process.argv[2]
	if (mode === 'cursor' || mode === 'windsurf') {
		// Both block on exit code 2; Cursor also reads the JSON answer, Windsurf shows stderr to the agent.
		const result = foreignShell(input, loadConfig(), mode)
		if (result.output) process.stdout.write(JSON.stringify(result.output))
		if (result.isDenied) {
			process.stderr.write(`${result.reason}\n`)
			process.exitCode = 2
		}
		process.exit()
	}
	const handler = HANDLERS[input.hook_event_name || mode]
	const output = handler?.(input, loadConfig())
	if (output) process.stdout.write(JSON.stringify(output))
} catch (error) {
	// A broken hook must never block the person's work.
	process.stderr.write(`CCM Stack hook error: ${error.message}\n`)
}
