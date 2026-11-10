// Zen, the design system of @ciromaciel/components-kit and @ciromaciel/dashboard-kit: radius 0, no shadows, the gray ramp only
// (red.6 for errors), Montserrat weights 500/700/800/900, Tabler icons only.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { STYLE_FILE, matches } from './code.js'

// Screens and their styles. Plain .js is left out: a worker that writes an e-mail needs hex colors,
// because e-mail clients do not read CSS variables.
const SCREEN_FILE = /\.[jt]sx$/

const OTHER_ICONS = /from\s+['"](lucide-react|react-icons[^'"]*|@heroicons\/[^'"]+|@fortawesome\/[^'"]+|@mui\/icons-material[^'"]*|phosphor-react|@phosphor-icons\/[^'"]+|react-feather)['"]/
const COLORS = 'blue|red|green|teal|cyan|grape|violet|indigo|pink|orange|yellow|lime'

const RULES = [
	[/\bradius=\{?\s*["']?(?:xs|sm|md|lg|xl|[1-9]\d*)\b/, 'Zen has no rounded corners: radius is always 0 (drop the prop).'],
	[/\bborderRadius\s*:\s*["']?[1-9]/, 'Zen has no rounded corners: borderRadius is always 0.'],
	[/\bborder-radius\s*:\s*[1-9]/, 'Zen has no rounded corners: border-radius is always 0.'],
	[/\bshadow=\{?\s*["'](?:xs|sm|md|lg|xl)["']/, 'Zen has no shadows: separate with a 1px gray.2 border instead.'],
	// An inset shadow draws a line inside the box, a border by other means; only depth is refused.
	[/\bboxShadow\s*:(?!\s*["'](?:none|inset\b))\s*["'][^"']+["']/, 'Zen has no shadows: separate with a 1px gray.2 border instead.'],
	[/\bbox-shadow\s*:(?!\s*(?:none|inset)\b)[^;}]+/, 'Zen has no shadows: separate with a 1px gray.2 border instead.'],
	[new RegExp(`\\b(?:c|color|bg)=\\{?\\s*["'](?!red\\.6["'])(?:${COLORS})(?:\\.\\d)?["']`), 'Zen uses the gray ramp only (gray.0 to gray.9); red.6 is kept for errors and losses.'],
	[/\b(?:color|background(?:-color)?|backgroundColor)\s*:\s*["']?#[0-9a-fA-F]{3,8}\b/, 'Zen colors come from the gray tokens (var(--mantine-color-gray-N)), never a hex value.'],
	[/\b(?:fw=\{?\s*["']?|fontWeight\s*:\s*["']?|font-weight\s*:\s*)(?:400|600)\b/, 'Zen uses Montserrat weights 500, 700, 800 and 900 only.'],
	[OTHER_ICONS, 'Zen icons are Tabler only (@tabler/icons-react).'],
]

// The two kits that carry Zen: pages and sites, and panels.
const KITS = ['@ciromaciel/components-kit', '@ciromaciel/dashboard-kit']
const cache = new Map()

function dependsOnKit(file) {
	if (!cache.has(file)) {
		let value = false
		try {
			const pkg = JSON.parse(readFileSync(file, 'utf8'))
			const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
			value = KITS.some((kit) => deps[kit])
		} catch {}
		cache.set(file, value)
	}
	return cache.get(file)
}

// In a monorepo the kit is a dependency of one app, not of the root: the package.json nearest to the
// file decides whether that screen is a Zen screen.
function nearestUsesKit(path, root) {
	for (let dir = dirname(resolve(root, path)); ; dir = dirname(dir)) {
		const file = join(dir, 'package.json')
		if (existsSync(file)) return dependsOnKit(file)
		if (dir === resolve(root) || dirname(dir) === dir) return false
	}
}

function projectsUsingKit(root) {
	const listed = spawnSync('git', ['ls-files', '--', 'package.json', '*/package.json'], { cwd: root, encoding: 'utf8' }).stdout
	const files = (listed || '').split('\n').filter((file) => file && !file.includes('node_modules/'))
	if (!files.length && existsSync(join(root, 'package.json'))) files.push('package.json')
	return files.filter((file) => dependsOnKit(join(root, file))).length
}

export const pack = {
	id: 'zen',
	title: 'Zen design system: radius 0, no shadows, gray only, Montserrat 500-900, Tabler icons',
	// Declared: every screen of the project. Shown by evidence: only the screens of the apps that use the kit.
	appliesTo: (path, { root, isDeclared } = {}) => (SCREEN_FILE.test(path) || STYLE_FILE.test(path)) && (isDeclared || !root || nearestUsesKit(path, root)),
	evidence: (projectRoot) => {
		const count = projectsUsingKit(projectRoot)
		return count ? `${count === 1 ? 'an app' : `${count} apps`} here depend on a Zen kit (${KITS.join(' or ')}); their screens follow it` : null
	},
	check({ text }) {
		return RULES.flatMap(([pattern, message]) => matches(text, pattern).map(({ line, found }) => ({ line, key: `zen:${found.replace(/\s+/g, ' ')}`, message: `${message} Found: ${found.trim()}` })))
	},
}
