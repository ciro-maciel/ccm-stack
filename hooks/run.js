// The one entry point for every hook. Claude Code pipes the event as JSON on stdin;
// lib/hooks.js applies the active rules and this file prints the answer.

import { loadConfig } from '../lib/config.js'
import { HANDLERS } from '../lib/hooks.js'

let raw = ''
for await (const chunk of process.stdin) raw += chunk
try {
	const input = JSON.parse(raw)
	const handler = HANDLERS[input.hook_event_name || process.argv[2]]
	const output = handler?.(input, loadConfig())
	if (output) process.stdout.write(JSON.stringify(output))
} catch (error) {
	// A broken hook must never block the person's work.
	process.stderr.write(`CCM Stack hook error: ${error.message}\n`)
}
