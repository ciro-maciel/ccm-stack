// The checks git runs on every commit, whoever makes it: any agent, any editor, a person.
// They reuse the same rule functions as the hooks, on what is staged and on the message.

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import * as checks from './checks.js'
import { isActive } from './rules.js'
import * as standards from './standards/index.js'

const git = (args, cwd) => spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

// What each staged file adds, as the new and old text the write rules compare.
export function stagedChanges(cwd = process.cwd()) {
	const names = git(['diff', '--cached', '--name-only', '--diff-filter=AM'], cwd).stdout.split('\n').filter(Boolean)
	return names.map((path) => {
		const diff = git(['diff', '--cached', '-U0', '--', path], cwd).stdout
		const added = diff.split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++')).map((line) => line.slice(1))
		const removed = diff.split('\n').filter((line) => line.startsWith('-') && !line.startsWith('---')).map((line) => line.slice(1))
		const isNew = git(['diff', '--cached', '--name-only', '--diff-filter=A', '--', path], cwd).stdout.trim() !== ''
		return { path: `/${path}`, file: path, isNew, newText: added.join('\n'), oldText: removed.join('\n') }
	})
}

export function checkStaged(config, cwd) {
	const problems = []
	for (const change of stagedChanges(cwd)) {
		if (/(^|\/)(node_modules|dist|build|vendor)\//.test(change.path)) continue
		for (const [id, check] of [
			['no-emoji', checks.noEmoji],
			['no-tests-in-ci', checks.noTestsInCi],
		]) {
			if (!isActive(id, config)) continue
			const reason = check(change, config)
			if (reason) problems.push(`${change.path.slice(1)}: ${reason} (${id})`)
		}
		if (isActive('follow-project-standards', config)) {
			const root = cwd || process.cwd()
			for (const found of standards.newViolations({ path: `${root}/${change.file}`, root: standards.projectRoot(`${root}/${change.file}`), newText: change.newText, oldText: change.oldText, isNew: change.isNew, isCommit: true })) {
				problems.push(`${change.file}: ${found.message} (${found.pack})`)
			}
		}
	}
	return problems
}

export function checkCommitMessage(file, config) {
	if (!isActive('conventional-commits', config)) return null
	const subject = readFileSync(file, 'utf8').split('\n').find((line) => line.trim() && !line.startsWith('#'))?.trim() ?? ''
	if (/^(Merge|Revert|fixup!|squash!)/.test(subject)) return null
	const command = `git commit -m ${JSON.stringify(subject)}`
	return checks.conventionalCommits({ command, bare: checks.bareCommand(command) })
}
