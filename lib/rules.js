// Reads rules.json and answers one question: is this rule active for this person, on this machine?

import { readFileSync } from 'node:fs'
import { platform } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getKey } from './config.js'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const RULES = JSON.parse(readFileSync(join(ROOT, 'rules.json'), 'utf8')).rules

export const ruleById = (id) => RULES.find((rule) => rule.id === id)

function hasValue(value) {
	if (Array.isArray(value)) return value.length > 0
	return value !== null && value !== undefined && value !== false && value !== ''
}

// Returns null when active, or the reason it is not.
export function inactiveReason(rule, config, os = platform()) {
	const choice = config.rules?.[rule.id]
	if (choice === false) return 'turned off in your config'
	if (choice !== true && !rule.isDefaultOn) return 'off by default'
	if (rule.platforms && !rule.platforms.includes(os)) return `only on ${rule.platforms.join(', ')}`
	if (rule.requires && !hasValue(getKey(config, rule.requires))) return `needs "${rule.requires}" in your config`
	return null
}

export const isActive = (id, config, os) => {
	const rule = ruleById(id)
	if (!rule) throw new Error(`Unknown rule: ${id}`)
	return inactiveReason(rule, config, os) === null
}
