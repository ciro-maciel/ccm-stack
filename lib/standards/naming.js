// Naming: one way to write a name, everywhere. `Id`, never `ID`; a boolean reads as a yes-or-no
// question that is affirmative; a script file is kebab-case.

import { basename } from 'node:path'
import { CODE_FILE, codeOnly, matches } from './code.js'

const QUESTION = /^(is|has|can|should)[A-Z0-9]/
const NEGATIVE = /^(is|has|can|should)Not[A-Z]/
const SCRIPT_FILE = /\.(m|c)?[jt]s$/
const KEBAB_FILE = /^[a-z0-9]+(?:[-.][a-z0-9]+)*\.(m|c)?[jt]s$/

export const pack = {
	id: 'naming',
	title: 'Names: Id not ID, booleans as affirmative questions, kebab-case script files',
	appliesTo: (path) => CODE_FILE.test(path),
	// A team's convention, not a safety rule: it runs only where the project asked for it.
	evidence: () => null,
	check({ path, text }) {
		const code = codeOnly(text)
		const found = []
		for (const { line, found: name } of matches(code, /\b[a-z][A-Za-z0-9]*[a-z0-9]ID\b/)) {
			found.push({ line, key: `id:${name}`, message: `"${name}" spells ID in capitals: write ${name.replace(/ID/, 'Id')}.` })
		}
		const booleans = [
			...matches(code, /\b(?:const|let|var)\s+([a-z][A-Za-z0-9]*)\s*=\s*(?:true|false)\b/),
			...matches(code, /\[\s*([a-z][A-Za-z0-9]*)\s*,\s*set[A-Z]\w*\s*\]\s*=\s*useState\(\s*(?:true|false)\s*\)/),
		]
		for (const { line, groups } of booleans) {
			const name = groups[1]
			if (NEGATIVE.test(name)) found.push({ line, key: `bool:${name}`, message: `"${name}" asks a negative question: say it in the affirmative (is${name.replace(/^(is|has|can|should)Not/, '')} with the opposite value).` })
			else if (!QUESTION.test(name)) found.push({ line, key: `bool:${name}`, message: `"${name}" holds a boolean: name it as a question, is${name[0].toUpperCase()}${name.slice(1)} (or has, can, should).` })
		}
		return found
	},
	// Only a file being created is judged by its name: renaming an old file is a separate decision.
	checkNewFile(path) {
		const name = basename(path)
		if (!SCRIPT_FILE.test(name) || KEBAB_FILE.test(name)) return []
		const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase()
		return [{ line: 0, key: `file:${name}`, message: `The file "${name}" is not kebab-case: name it ${kebab}.` }]
	},
}
