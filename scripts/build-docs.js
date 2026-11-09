// Writes the generated parts of the docs from rules.json and the lesson files:
// the rules table in README.md and the lesson index in course/README.md.
// With --check it changes nothing and exits 1 when the docs are out of date.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, RULES } from '../lib/rules.js'

const isCheck = process.argv.includes('--check')
const MODULES = { 0: 'Start', 1: 'Work', 2: 'Prove', 3: 'Build' }

export function lessons() {
	return readdirSync(join(ROOT, 'course'))
		.filter((name) => /^\d{2}-.+\.md$/.test(name))
		.sort()
		.map((file) => {
			const text = readFileSync(join(ROOT, 'course', file), 'utf8')
			const title = text.match(/^# \d{2} · (.+)$/m)[1]
			const [, module, minutes] = text.match(/\*\*Module (\d) · \w+\*\* · (\d+) minutes/)
			return { id: file.replace(/\.md$/, ''), file, title, module: Number(module), minutes: Number(minutes) }
		})
}

export function rulesTable() {
	const byLesson = Object.fromEntries(lessons().map((lesson) => [lesson.id, lesson]))
	const rows = RULES.map((rule) => {
		const lesson = byLesson[rule.lesson]
		const by = rule.enforcedBy === 'hook' ? `hook (${rule.event.split(':')[0]})` : `skill [\`${rule.skill}\`](skills/${rule.skill}/SKILL.md)`
		const notes = [rule.isDefaultOn ? '' : 'off by default', rule.platforms ? `${rule.platforms.join(', ')} only` : '', rule.requires ? `needs \`${rule.requires}\`` : '']
			.filter(Boolean)
			.join('; ')
		return `| \`${rule.id}\` | ${rule.title} | ${by} | [${lesson.title}](course/${lesson.file}) | ${notes} |`
	})
	return ['| Rule | What it says | Enforced by | Lesson | Notes |', '|---|---|---|---|---|', ...rows].join('\n')
}

export function courseIndex() {
	const all = lessons()
	const total = all.reduce((sum, lesson) => sum + lesson.minutes, 0)
	const parts = [`${all.length} lessons, about ${Math.round(total / 60)} hours.`]
	for (const [number, name] of Object.entries(MODULES)) {
		parts.push('', `### Module ${number} · ${name}`, '')
		for (const lesson of all.filter((item) => item.module === Number(number))) {
			parts.push(`${lesson.id.slice(0, 2)}. [${lesson.title}](${lesson.file}) · ${lesson.minutes} min`)
		}
	}
	return parts.join('\n')
}

function replaceBetween(path, marker, content) {
	const text = readFileSync(path, 'utf8')
	const pattern = new RegExp(`(<!-- ${marker}:start -->)[\\s\\S]*?(<!-- ${marker}:end -->)`)
	if (!pattern.test(text)) throw new Error(`${path} has no ${marker} markers`)
	const next = text.replace(pattern, `$1\n${content}\n$2`)
	if (next === text) return false
	if (!isCheck) writeFileSync(path, next)
	return true
}

const changed = [
	replaceBetween(join(ROOT, 'README.md'), 'rules', rulesTable()) && 'README.md',
	replaceBetween(join(ROOT, 'course', 'README.md'), 'lessons', courseIndex()) && 'course/README.md',
].filter(Boolean)

if (isCheck && changed.length) {
	console.error(`Out of date: ${changed.join(', ')}. Run: node scripts/build-docs.js`)
	process.exit(1)
}
console.log(changed.length ? `updated: ${changed.join(', ')}` : 'docs are up to date')
