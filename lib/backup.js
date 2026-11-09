// Copies a file (or a small folder) aside before the agent overwrites or deletes it.
// One copy per path per day: the first one, the state before the agent touched it.

import { appendFileSync, cpSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { configDir } from './config.js'

const MAX_BYTES = 50 * 1024 * 1024
const SKIP = /[\\/](node_modules|\.git|dist|build|\.next|\.cache|vendor)([\\/]|$)/

const today = () => new Date().toISOString().slice(0, 10)
export const backupRoot = () => join(configDir(), 'backups')

function sizeOf(path, limit = MAX_BYTES) {
	const stat = statSync(path)
	if (!stat.isDirectory()) return stat.size
	let total = 0
	for (const entry of readdirSync(path)) {
		total += sizeOf(join(path, entry), limit - total)
		if (total > limit) return total
	}
	return total
}

// "/home/a/app/x.js" -> "home/a/app/x.js"; "C:\a\x.js" -> "C/a/x.js"
const flatten = (path) => path.replace(/^([A-Za-z]):/, '$1').replace(/^[\\/]+/, '')

export function backup(path, cwd = process.cwd()) {
	const absolute = isAbsolute(path) ? path : resolve(cwd, path)
	if (!existsSync(absolute) || SKIP.test(absolute)) return null
	const target = join(backupRoot(), today(), flatten(absolute))
	if (existsSync(target)) return target
	if (sizeOf(absolute) > MAX_BYTES) return null
	mkdirSync(join(target, '..'), { recursive: true })
	cpSync(absolute, target, { recursive: true })
	appendFileSync(
		join(backupRoot(), 'index.jsonl'),
		`${JSON.stringify({ at: new Date().toISOString(), from: absolute, to: target })}\n`,
	)
	return target
}

// The paths a simple `rm` would delete. Globs and variables are skipped: we never guess.
export function rmTargets(bare) {
	const targets = []
	for (const match of bare.matchAll(/(?:^|[;&|\n]|\$\()\s*rm\s+([^;&|\n]+)/g)) {
		for (const word of match[1].trim().split(/\s+/)) {
			if (word.startsWith('-') || /[*?$`{}]/.test(word)) continue
			targets.push(word)
		}
	}
	return targets
}
