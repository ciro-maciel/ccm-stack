// Project standards: packs of rules a project declares in ccm.standards.json, checked the moment an
// agent writes, again at every commit, and on demand for the whole tree. Only what a change ADDS is
// refused, so a standard adopted today never blocks work on the code written before it.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { pack as apiKeys } from './api-keys.js'
import { pack as naming } from './naming.js'
import { pack as zen } from './zen.js'

export const PACKS = Object.fromEntries([naming, apiKeys, zen].map((pack) => [pack.id, pack]))
export const FILE_NAME = 'ccm.standards.json'
const SKIP = /(^|[\\/])(node_modules|dist|build|vendor|coverage|\.git|\.next|\.astro)([\\/]|$)/

// The project a path belongs to: the nearest folder upward with ccm.standards.json, else the git root.
export function projectRoot(path) {
	const full = resolve(path)
	const dir = existsSync(full) && statSync(full).isDirectory() ? full : dirname(full)
	let gitRoot = null
	for (let current = dir; ; current = dirname(current)) {
		if (existsSync(join(current, FILE_NAME))) return current
		if (!gitRoot && existsSync(join(current, '.git'))) gitRoot = current
		if (dirname(current) === current) return gitRoot || dir
	}
}

export function readStandards(root) {
	const file = join(root, FILE_NAME)
	if (!existsSync(file)) return { packs: {}, ignore: [], isDeclared: false }
	try {
		const data = JSON.parse(readFileSync(file, 'utf8'))
		return { packs: data.packs || {}, ignore: data.ignore || [], isDeclared: true }
	} catch (error) {
		return { packs: {}, ignore: [], isDeclared: false, error: `${FILE_NAME}: ${error.message}` }
	}
}

// Which packs run in this project, and why each one does or does not.
export function activePacks(root) {
	const standards = readStandards(root)
	return Object.values(PACKS).map((pack) => {
		const declared = standards.packs[pack.id]
		if (declared === false) return { pack, isActive: false, why: `turned off in ${FILE_NAME}` }
		if (declared) return { pack, isActive: true, isDeclared: true, why: `declared in ${FILE_NAME}` }
		const evidence = pack.evidence(root)
		return evidence ? { pack, isActive: true, why: evidence } : { pack, isActive: false, why: `not declared in ${FILE_NAME}` }
	})
}

// A line that says why it is the exception (`ccm: allow <reason>`) is never a finding: the reason is
// in the code, where the next person reads it.
const ALLOW = /ccm:\s*allow\s+\S/
function findings(pack, input) {
	const lines = input.text.split('\n')
	return pack.check(input).filter((item) => !item.line || !ALLOW.test(lines[item.line - 1] ?? ''))
}

const isIgnored = (rel, ignore) => SKIP.test(rel) || ignore.some((prefix) => rel === prefix || rel.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`))

// What `newText` adds that `oldText` did not have, pack by pack. `isNew` means the file is being created.
export function newViolations({ path, newText, oldText = '', isNew = false, isCommit = false, root = projectRoot(path) }) {
	const standards = readStandards(root)
	const rel = relative(root, resolve(path)).split(sep).join('/')
	if (rel.startsWith('..') || isIgnored(rel, standards.ignore)) return []
	const found = []
	for (const { pack, isActive, isDeclared } of activePacks(root)) {
		if (!isActive || !pack.appliesTo(path, { root, isDeclared })) continue
		const before = new Map()
		for (const item of findings(pack, { path, text: oldText, isCommit })) before.set(item.key, (before.get(item.key) || 0) + 1)
		for (const item of findings(pack, { path, text: newText, isCommit })) {
			const left = before.get(item.key) || 0
			if (left > 0) before.set(item.key, left - 1)
			else found.push({ pack: pack.id, ...item })
		}
		if (isNew && pack.checkNewFile) found.push(...pack.checkNewFile(path).map((item) => ({ pack: pack.id, ...item })))
	}
	return found
}

// The one sentence an agent reads when a write is refused.
export function refusal(path, violations) {
	const first = violations[0]
	const more = violations.length > 1 ? ` (and ${violations.length - 1} more)` : ''
	return `${first.message}${first.line ? ` Line ${first.line}.` : ''}${more} The project's standards are in ${FILE_NAME}; only what a change adds is refused.`
}

const tracked = (root) =>
	spawnSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).stdout.split('\n').filter(Boolean)

// The whole tree against every pack, active or not: how far the project is from each standard today.
export function report(root) {
	const standards = readStandards(root)
	const files = tracked(root).filter((rel) => !isIgnored(rel, standards.ignore))
	const rows = activePacks(root).map(({ pack, isActive, isDeclared, why }) => {
		let checked = 0
		const byFile = []
		for (const rel of files) {
			if (!pack.appliesTo(rel, { root, isDeclared: isDeclared || !isActive })) continue
			let text
			try {
				text = readFileSync(join(root, rel), 'utf8')
			} catch {
				continue
			}
			checked++
			const items = [...findings(pack, { path: rel, text, isCommit: true }), ...(pack.checkNewFile ? pack.checkNewFile(rel) : [])]
			if (items.length) byFile.push({ file: rel, count: items.length, first: items[0] })
		}
		const total = byFile.reduce((sum, row) => sum + row.count, 0)
		return { pack: pack.id, title: pack.title, isActive, why, checked, clean: checked - byFile.length, total, worst: byFile.sort((a, b) => b.count - a.count).slice(0, 5) }
	})
	return { root, isDeclared: standards.isDeclared, rows }
}

// What the project already does, measured, and the file that would declare it. Nothing is written
// unless asked: the standards are the team's decision.
export function propose(root) {
	const measured = report(root)
	const packs = {}
	const reasons = []
	for (const row of measured.rows) {
		const share = row.checked ? row.clean / row.checked : 1
		const percent = `${Math.round(share * 100)}%`
		if (row.pack === 'api-keys') {
			packs[row.pack] = true
			reasons.push(`api-keys: on in every project. ${row.total ? `${row.total} secret(s) found in ${row.worst.length} file(s) today: move them to the environment file and rotate them.` : 'No secret found in the code today.'}`)
		} else if (row.pack === 'zen') {
			// Left out of the file on purpose: undeclared, it follows the evidence app by app, so a screen of
			// an app without the kit (an e-mail template, a third-party app) is never held to it.
			reasons.push(row.isActive ? `zen: on by evidence, ${row.why}. ${percent} of those screens already follow it. Not written in the file, so each app keeps deciding by its own dependencies.` : 'zen: off, no app here uses @ciromaciel/components-kit. Declare "zen": true only if you adopt it.')
		} else {
			packs[row.pack] = share >= 0.8
			reasons.push(`${row.pack}: ${percent} of ${row.checked} file(s) already follow it, ${packs[row.pack] ? 'so it is proposed on: new code keeps the way most of the project is written' : 'so it is proposed off: most of the project is written another way; turning it on is a team decision'}.`)
		}
	}
	return { file: { packs, ignore: [] }, reasons, measured }
}

export function writeStandards(root, file) {
	const target = join(root, FILE_NAME)
	writeFileSync(target, `${JSON.stringify({ $comment: 'Project standards checked by CCM Stack: https://github.com/ciro-maciel/ccm-stack#project-standards', ...file }, null, '\t')}\n`)
	return target
}
