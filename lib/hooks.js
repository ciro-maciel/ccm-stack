// What each hook event does: the active rules applied to one event.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { backup, rmTargets } from './backup.js'
import * as checks from './checks.js'
import { baseLanguage, isWrongLanguage, LANGUAGE_NAMES } from './language.js'
import { isActive, ROOT } from './rules.js'
import { startSpeaking } from './voice.js'

const SHELL_RULES = [
	['private-repos-stay-private', checks.privateReposStayPrivate],
	['stage-only-your-files', checks.stageOnlyYourFiles],
	['conventional-commits', checks.conventionalCommits],
	['one-package-manager', checks.onePackageManager],
	['sed-word-boundary', checks.sedWordBoundary],
	['test-email-only', checks.testEmailOnly],
	['forbidden-commands', checks.forbiddenCommands],
]
const WRITE_RULES = [
	['no-emoji', checks.noEmoji],
	['no-tests-in-ci', checks.noTestsInCi],
]
const SKIP_WRITES = /[\\/](node_modules|dist|build|vendor|\.git)[\\/]/

const languageName = (tag) => LANGUAGE_NAMES[baseLanguage(tag)] || tag

function deny(rule, reason) {
	return {
		hookSpecificOutput: {
			hookEventName: 'PreToolUse',
			permissionDecision: 'deny',
			permissionDecisionReason: `CCM Stack refused this (${rule}). ${reason}`,
		},
	}
}

function writeTexts(input) {
	const tool = input.tool_input || {}
	if (typeof tool.content === 'string') {
		const oldText = existsSync(tool.file_path) ? readFileSync(tool.file_path, 'utf8') : ''
		return { newText: tool.content, oldText }
	}
	if (typeof tool.new_string === 'string') return { newText: tool.new_string, oldText: tool.old_string || '' }
	if (Array.isArray(tool.edits)) {
		return {
			newText: tool.edits.map((edit) => edit.new_string || '').join('\n'),
			oldText: tool.edits.map((edit) => edit.old_string || '').join('\n'),
		}
	}
	return { newText: '', oldText: '' }
}

export function preToolUse(input, config) {
	const tool = input.tool_name
	const cwd = input.cwd || process.cwd()
	const shouldBackup = isActive('backup-before-overwrite', config)

	if (tool === 'Bash' || tool === 'PowerShell') {
		const command = input.tool_input?.command || ''
		const context = { command, bare: checks.bareCommand(command) }
		for (const [id, check] of SHELL_RULES) {
			if (!isActive(id, config)) continue
			const reason = check(context, config)
			if (reason) return deny(id, reason)
		}
		if (shouldBackup) for (const target of rmTargets(context.bare)) backup(target, cwd)
		return null
	}

	if (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') {
		const path = input.tool_input?.file_path || ''
		if (!path || SKIP_WRITES.test(path)) return null
		const context = { path, ...writeTexts(input) }
		for (const [id, check] of WRITE_RULES) {
			if (!isActive(id, config)) continue
			const reason = check(context, config)
			if (reason) return deny(id, reason)
		}
		if (shouldBackup) backup(path, cwd)
	}
	return null
}

function lastAssistantText(input) {
	if (typeof input.last_assistant_message === 'string') return input.last_assistant_message
	if (!input.transcript_path || !existsSync(input.transcript_path)) return ''
	const lines = readFileSync(input.transcript_path, 'utf8').trim().split('\n')
	for (const line of lines.reverse()) {
		let entry
		try {
			entry = JSON.parse(line)
		} catch {
			continue
		}
		if (entry.type !== 'assistant' || !Array.isArray(entry.message?.content)) continue
		const text = entry.message.content.filter((part) => part.type === 'text').map((part) => part.text)
		if (text.length) return text.join('\n')
	}
	return ''
}

export function stop(input, config) {
	const text = lastAssistantText(input)
	if (!text) return null
	if (!input.stop_hook_active && isActive('reply-in-your-language', config) && isWrongLanguage(text, config.language)) {
		return {
			decision: 'block',
			reason: `Your reply is not in ${languageName(config.language)}. Rewrite the whole reply in ${languageName(config.language)}; code, paths and commands stay as they are.`,
		}
	}
	if (isActive('spoken-summary', config)) {
		const summary = text.match(/<!--\s*voice:\s*([\s\S]*?)\s*-->/)?.[1]
		const project = (input.cwd || '').split(/[\\/]/).pop()
		if (summary) startSpeaking(summary, config, project, join(ROOT, 'bin', 'ccm.js'))
	}
	return null
}

export function sessionStart(_input, config) {
	if (!isActive('principles-every-session', config)) return null
	const parts = [readFileSync(join(ROOT, 'principles.md'), 'utf8').trim()]
	if (!config.isConfigured) {
		parts.push('CCM Stack is installed but not configured. Once, early in this session, suggest that the person run /ccm-stack:setup to choose their language, voice and rules. Never configure it for them without asking.')
	}
	if (config.language) {
		parts.push(`Reply to the person in ${languageName(config.language)}. Code, identifiers, commit messages and file names stay in English.`)
	}
	if (isActive('spoken-summary', config)) {
		parts.push(
			`Spoken summary: when you finish a task, or stop at the end of a piece of work to ask for a decision, end your final message with an HTML comment on its last line: <!-- voice: ... -->. Inside it write 1 to 3 short sentences in ${languageName(config.language || 'en')}, as you would say them out loud: no paths, links, code, symbols or spelled-out acronyms. Short conversational replies and questions in the middle of work get no comment.`,
		)
	}
	return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: parts.join('\n\n') } }
}

export const HANDLERS = { PreToolUse: preToolUse, Stop: stop, SessionStart: sessionStart }

