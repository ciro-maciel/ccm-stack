// API keys: a secret never lives in code or in a commit. It goes into the environment file, kept out
// of git, and the code reads it from the environment. Public keys (pu_, pk_ and read keys) are fine.

import { basename } from 'node:path'
import { matches } from './code.js'

// Google browser keys (AIza...) are left out on purpose: Google publishes them as public, restricted by
// referrer, and every Firebase or Maps project ships one in its pages.
// The secret prefixes of the Ciro Cesar Maciel line (infrastructure/docs/2026-09-15-prefixos-de-chave.md)
// and the formats other services publish for theirs.
const HOUSE = 'ak|psk|msk|stk|fk|mk|hk|ht|vk|ask|tk|frk|lk|nk|pgk|bk|dk|dsk|shk|rm|rk'
const SECRET = new RegExp(
	[
		`\\b(?:${HOUSE})_[A-Za-z0-9]{16,}`,
		'\\bsk-ant-[A-Za-z0-9_-]{20,}',
		'\\bsk-[A-Za-z0-9]{32,}',
		'\\b(?:sk|rk)_live_[A-Za-z0-9]{16,}',
		'\\bgh[pousr]_[A-Za-z0-9]{30,}',
		'\\bgithub_pat_[A-Za-z0-9_]{30,}',
		// Not inside a longer base64 run (embedded images), nor as the public key id of a presigned URL.
		'(?<![A-Za-z0-9+/])(?<!Credential=)AKIA[0-9A-Z]{16}(?![A-Za-z0-9+/])',
		'\\bxox[abpr]-[A-Za-z0-9-]{20,}',
		// The marker alone is how code that reads a key finds it; a key is the marker with its body.
		'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----(?:\\\\n|\\s)+[A-Za-z0-9+/]{40,}',
	].join('|'),
)
// A fake key in a test or a doc: a run of one character, a word, a counting sequence.
const PLACEHOLDER = /([A-Za-z0-9])\1{7,}|your|example|placeholder|fake|dummy|1234567890/i
export const ENV_FILE = /(^|[\\/])\.env(\.[\w-]+)?$/

const mask = (secret) => `${secret.slice(0, Math.min(8, secret.indexOf('_') + 3 || 6))}…`

export const pack = {
	id: 'api-keys',
	title: 'Secrets stay out of code and out of commits',
	appliesTo: (path) => !/\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|lock)$/i.test(path),
	// Safety, not taste: on wherever CCM Stack runs, unless the project turns it off.
	evidence: () => 'always on: a leaked key is a leak in any project',
	check({ path, text, isCommit }) {
		// Writing a key into the env file is the right place; committing that file is not.
		if (ENV_FILE.test(path) && !isCommit) return []
		const inEnv = ENV_FILE.test(path)
		return matches(text, SECRET)
			.filter(({ found }) => !PLACEHOLDER.test(found))
			.map(({ line, found }) => ({
				line,
				key: `secret:${found}`,
				message: inEnv
					? `${basename(path)} holds a secret (${mask(found)}) and is being committed: unstage it, add it to .gitignore, and rotate the key if it was ever pushed.`
					: `A secret (${mask(found)}) is written in the code: put it in the environment file (kept out of git) and read it with process.env.`,
			}))
	},
}
