// Small helpers the packs share: which files are code, and code without its strings and comments,
// so a rule about names never fires on a sentence or a URL.

export const CODE_FILE = /\.(m|c)?[jt]sx?$/
export const STYLE_FILE = /\.(css|scss|sass|less)$/

const STRINGS_AND_COMMENTS = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g

// A regular expression literal: a slash where a value starts (after ( , = : [ ! & | ? { } ; or return).
const REGEX_LITERAL = /(?<=(?:^|[(,=:[!&|?{};]|\breturn)\s*)\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\/[dgimsuvy]*/gm

// Keeps line breaks, so a line number found in the stripped text is the line in the file.
const blank = (match) => match.replace(/[^\n]/g, ' ')
export const codeOnly = (text) => text.replace(STRINGS_AND_COMMENTS, blank).replace(REGEX_LITERAL, blank)

export const lineOf = (text, index) => text.slice(0, index).split('\n').length

// Every match of `pattern` in `text`, as { line, found }.
export function matches(text, pattern) {
	const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
	return [...text.matchAll(new RegExp(pattern.source, flags))].map((match) => ({ line: lineOf(text, match.index), found: match[0], groups: match }))
}
