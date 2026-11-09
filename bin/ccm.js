#!/usr/bin/env node
// ccm: see and change your CCM Stack. The skills run it; you can too.

import { readFileSync, rmSync } from 'node:fs'
import { arch, platform } from 'node:os'
import { fileURLToPath } from 'node:url'
import { configPath, getKey, loadConfig, saveConfig, setKey } from '../lib/config.js'
import { inactiveReason, RULES } from '../lib/rules.js'
import { installPtts, PHONON_MODELS, pttsPath, speak, stopSpeaking, voiceReport } from '../lib/voice.js'

const [command, ...args] = process.argv.slice(2)
const print = (...lines) => console.log(lines.join('\n'))

const HELP = `ccm: your CCM Stack

  ccm status                    every rule, the lesson that teaches it, and whether it runs here
  ccm doctor                    what works on this machine, and what to install
  ccm config                    print your config and where it lives
  ccm config get <key>          e.g. ccm config get voice.engine
  ccm config set <key> <value>  e.g. ccm config set language pt-BR
  ccm rule on|off <id>          turn one rule on or off
  ccm voice install             download Phonon for this system (checksum verified)
  ccm voice test [text]         speak a sentence now
  ccm voice on|off              turn the spoken summary on or off
  ccm voice stop                stop speaking`

function status() {
	const config = loadConfig()
	print(config.isConfigured ? `config: ${configPath()}` : 'not configured yet: run /ccm-stack:setup', '')
	for (const rule of RULES) {
		const reason = inactiveReason(rule, config)
		const by = rule.enforcedBy === 'hook' ? `hook ${rule.event.split(':')[0]}` : `skill ${rule.skill}`
		print(`${reason ? 'off' : 'on '}  ${rule.id.padEnd(30)} ${by.padEnd(24)} ${rule.lesson}${reason ? `  (${reason})` : ''}`)
	}
}

function doctor() {
	const config = loadConfig()
	const [major] = process.versions.node.split('.').map(Number)
	print(
		`run me as: node "${fileURLToPath(import.meta.url)}" <command>`,
		`system: ${platform()}-${arch()}`,
		`node: ${process.versions.node}${major < 18 ? ' (needs 18 or newer)' : ''}`,
		`config: ${config.isConfigured ? configPath() : 'missing, run /ccm-stack:setup'}${config.configError ? ` (${config.configError})` : ''}`,
		`language: ${config.language || 'not set'}`,
		...voiceReport(config).map((line) => `voice ${line}`),
	)
}

async function voice([action, ...rest]) {
	const config = loadConfig()
	if (action === 'install') return print(`installed: ${await installPtts()}`)
	if (action === 'on' || action === 'off') {
		saveConfig(setKey(config, 'voice.isEnabled', String(action === 'on')))
		return print(`spoken summary ${action}`)
	}
	if (action === 'stop') return stopSpeaking()
	if (action === 'test') {
		const text = rest.join(' ') || 'CCM Stack is speaking. Your agent will tell you when the work is done.'
		return print(`result: ${await speak(text, config, { project: 'test' })}`)
	}
	if (action === 'models') {
		for (const [lang, model] of Object.entries(PHONON_MODELS)) {
			print(`${lang}  ${model.repo}  ${model.license}${model.isCommercial ? '' : ' (non-commercial)'}  default voice ${model.voice}`)
		}
		return
	}
	if (action === 'voices') {
		const { spawnSync } = await import('node:child_process')
		const result = spawnSync(pttsPath(), ['--list-voices'], { encoding: 'utf8' })
		return print(result.stdout || 'Phonon is not installed: ccm voice install')
	}
	print(HELP)
}

async function main() {
	if (command === 'status') return status()
	if (command === 'doctor') return doctor()
	if (command === 'config') {
		const config = loadConfig()
		const [action, key, ...value] = args
		if (action === 'get') return print(JSON.stringify(getKey(config, key), null, 2))
		if (action === 'set') return print(`saved: ${saveConfig(setKey(config, key, value.join(' ')))}`)
		const { isConfigured, configError, ...clean } = config
		return print(`# ${configPath()}${isConfigured ? '' : ' (not created yet)'}`, JSON.stringify(clean, null, 2))
	}
	if (command === 'rule') {
		const [state, id] = args
		if (!RULES.some((rule) => rule.id === id)) return print(`unknown rule: ${id}`)
		return print(`saved: ${saveConfig(setKey(loadConfig(), `rules.${id}`, String(state === 'on')))}`)
	}
	if (command === 'voice') return voice(args)
	if (command === 'speak') {
		// Internal: the detached worker started by the Stop hook.
		const file = args[args.indexOf('--file') + 1]
		const project = args.includes('--project') ? args[args.indexOf('--project') + 1] : ''
		const text = readFileSync(file, 'utf8')
		rmSync(file, { force: true })
		await speak(text, loadConfig(), { project })
		return
	}
	print(HELP)
}

main().catch((error) => {
	console.error(`ccm: ${error.message}`)
	process.exit(1)
})
