// Where CCM Stack keeps each person's settings, and how they are read and written.
// Linux and macOS: $XDG_CONFIG_HOME/ccm-stack or ~/.config/ccm-stack. Windows: %APPDATA%\ccm-stack.
// CCM_STACK_HOME overrides both (tests use it to stay isolated).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { dirname, join } from 'node:path'

export const DEFAULTS = Object.freeze({
	language: null,
	packageManager: null,
	testEmail: null,
	forbiddenCommands: [],
	recommendations: true,
	rules: {},
	voice: {
		isEnabled: false,
		engine: 'phonon',
		voice: null,
		speed: 1.5,
		model: null,
		isCommercialUse: false,
	},
})

export function configDir() {
	if (process.env.CCM_STACK_HOME) return process.env.CCM_STACK_HOME
	if (platform() === 'win32') {
		return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'ccm-stack')
	}
	return join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'ccm-stack')
}

export const configPath = () => join(configDir(), 'config.json')

function merge(base, extra) {
	const out = { ...base }
	for (const [key, value] of Object.entries(extra || {})) {
		const isObject = value && typeof value === 'object' && !Array.isArray(value)
		out[key] = isObject && base[key] && typeof base[key] === 'object' ? merge(base[key], value) : value
	}
	return out
}

export function loadConfig() {
	const path = configPath()
	if (!existsSync(path)) return { ...merge(DEFAULTS, {}), isConfigured: false }
	try {
		return { ...merge(DEFAULTS, JSON.parse(readFileSync(path, 'utf8'))), isConfigured: true }
	} catch (error) {
		return { ...merge(DEFAULTS, {}), isConfigured: false, configError: `${path}: ${error.message}` }
	}
}

export function saveConfig(config) {
	const { isConfigured, configError, ...clean } = config
	const path = configPath()
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, `${JSON.stringify(clean, null, '\t')}\n`)
	return path
}

// "voice.speed" + "1.5" -> config.voice.speed = 1.5. Values are parsed as JSON when they can be.
export function setKey(config, dottedKey, rawValue) {
	let value = rawValue
	try {
		value = JSON.parse(rawValue)
	} catch {}
	const keys = dottedKey.split('.')
	let node = config
	for (const key of keys.slice(0, -1)) {
		if (!node[key] || typeof node[key] !== 'object') node[key] = {}
		node = node[key]
	}
	node[keys.at(-1)] = value
	return config
}

export function getKey(config, dottedKey) {
	return dottedKey.split('.').reduce((node, key) => (node == null ? undefined : node[key]), config)
}
