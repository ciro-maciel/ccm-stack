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
  ccm voice stop                stop speaking

  ccm install [--tool <tool|all>]... [--project <dir>]
                                            put CCM Stack in this project for antigravity, windsurf,
                                            cursor, codex, gemini-cli, copilot (default all), plus git hooks
  ccm check pre-commit | commit-msg <file>  what the git hooks run

  ccm line                                  sign-in state and every MCP server of the line
  ccm line login <email> [code] [--line <line>]
                                            sign in: sends the 8-character code, then exchanges it;
                                            --line operations or customers (default infrastructure)
  ccm line ship <name> --dir <folder>       publish a built site at <name>.myhoster.click
  ccm line watch <url> [--name <name>]      a monitor on the published address
  ccm line provision <product> --env <file> [--name <name>]
                                            storage, functions, monitors, payments or messages;
                                            keys go to the file (kept out of git), never to the screen
  ccm line measure <domain> [--spa] [--mcp] the Analytics site and the one-line script to add
  ccm line numbers <domain> [--days 7|30|90] visits, views and goals, read in the conversation
  ccm line customers source <name> --env <file>
                                            a People source; its URL and secret go to the file
  ccm line customers send <type> <email> --env <file>
                                            one signed event, to prove the source receives
  ccm line mcp <server|line|all>...         add MCP servers to Claude Code
  ccm line logout`

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

function option(list, name) {
	const index = list.indexOf(name)
	return index >= 0 ? list[index + 1] : undefined
}

async function line([action, ...rest]) {
	const line = await import('../lib/line.js')
	if (!action || action === 'status') {
		for (const name of line.SIGN_IN_LINES) {
			const saved = line.session(name)
			print(`${name.padEnd(15)} ${saved ? `signed in as ${saved.email} until ${saved.expiresAt.slice(0, 10)}` : `not signed in: ccm line login <email>${name === 'infrastructure' ? '' : ` --line ${name}`}`}`)
		}
		print('', 'MCP servers (ccm line mcp <name|line|all>):')
		const known = line.resources()
		for (const server of line.MCP_SERVERS) {
			const note = server.id && !known[server.id] ? `  (needs ${server.id})` : ''
			print(`  ${server.name.padEnd(26)} ${server.does}${note}`)
		}
		return
	}
	if (action === 'login') {
		const positional = rest.filter((word, index) => !word.startsWith('--') && !rest[index - 1]?.startsWith('--'))
		const [email, code] = positional
		const lineName = option(rest, '--line') || 'infrastructure'
		if (!email) return print('usage: ccm line login <email> [code] [--line <line>]')
		const flag = lineName === 'infrastructure' ? '' : ` --line ${lineName}`
		if (!code) {
			const sent = await line.startSignIn(email, lineName)
			return print(`code sent to ${sent.email} for the ${lineName} line. It is valid for ${Math.round(sent.expiresIn / 60)} minutes. Run: ccm line login ${email} <code>${flag}`)
		}
		const signed = await line.finishSignIn(email, code, lineName)
		return print(`signed in to ${lineName} as ${signed.email} until ${signed.expiresAt.slice(0, 10)}`)
	}
	if (action === 'logout') {
		for (const name of line.SIGN_IN_LINES) rmSync(line.sessionFile(name), { force: true })
		return print('signed out of every line on this machine')
	}
	if (action === 'measure') {
		const [domain] = rest
		const result = await line.measure(domain, { isSpa: rest.includes('--spa'), kind: rest.includes('--mcp') ? 'mcp' : 'web' })
		if (result.isMcp) {
			print(`Analytics site ${result.id} for the MCP server ${domain}.`)
			return print(result.serverKey ? 'Its server key is in the Analytics panel, Settings; then run in the server project: npx @ciromaciel/analytics mcp init --key <ask_ key>' : 'Get its server key (ask_) in the Analytics panel, Settings.')
		}
		return print(`Analytics site ${result.id} for ${domain}. Add this line to the <head> of every page:`, '', result.snippet, '', 'Only the real domain counts: localhost and preview addresses are not measured.')
	}
	if (action === 'numbers') {
		const [domain] = rest
		const data = await line.numbers(domain, Number(option(rest, '--days') || 7))
		return print(JSON.stringify(data, null, 2))
	}
	if (action === 'customers') {
		const [sub, first, second] = rest
		const envFile = option(rest, '--env')
		if (sub === 'source') {
			const result = await line.customerSource(first, { envFile })
			return print(`People source "${result.name}": ${result.written.join(', ')} written to ${result.envFile}`)
		}
		if (sub === 'send') {
			const result = await line.sendCustomerEvent(envFile, { type: first, data: { person: { email: second }, channel: 'web' } })
			return print(`accepted ${result.accepted}, duplicates ${result.duplicates}${result.events?.[0]?.stage ? `, stage ${result.events[0].stage}` : ''}${result.test ? ' (test event: checked, not stored)' : ''}`)
		}
		return print('usage: ccm line customers source <name> --env <file> | ccm line customers send <type> <email> --env <file>')
	}
	if (action === 'ship') {
		const [name] = rest
		const result = await line.ship(name, option(rest, '--dir') || '.')
		return print(`live: ${result.url} (${result.files} files)`)
	}
	if (action === 'watch') {
		const [url] = rest
		const result = await line.watch(url, option(rest, '--name') || new URL(url).hostname)
		return print(`watching ${result.url} every 5 minutes as "${result.name}"`)
	}
	if (action === 'provision') {
		const [product] = rest
		const result = await line.provision(product, { name: option(rest, '--name'), envFile: option(rest, '--env') })
		print(`${result.product}: ${result.written.join(', ') || 'nothing new'} written to ${result.envFile}`)
		if (result.missing.length) print(`not returned this time (shown only when created): ${result.missing.join(', ')}`)
		return
	}
	if (action === 'mcp') {
		const { spawnSync } = await import('node:child_process')
		for (const server of line.mcpCommands(rest.length ? rest : ['all'])) {
			if (server.missing) {
				print(`skip ${server.name}: needs ${server.missing} (create it first with ccm line provision)`)
				continue
			}
			const result = spawnSync(server.command[0], server.command.slice(1), { encoding: 'utf8', shell: platform() === 'win32' })
			print(`${result.status === 0 ? 'added' : 'not added'} ${server.name}${result.status === 0 ? '' : `: ${(result.stderr || result.stdout || '').trim().split('\n')[0]}`}`)
		}
		return print('', 'Each server asks you to sign in once in the browser, the first time it is used.')
	}
	print(HELP)
}

async function installCommand(rest) {
	const { install, TOOL_NAMES } = await import('../lib/install.js')
	const tools = []
	rest.forEach((word, index) => {
		if (rest[index - 1] === '--tool') tools.push(...word.split(','))
	})
	const project = option(rest, '--project') || process.cwd()
	const report = install(project, tools.length ? tools : ['all'], loadConfig())
	print(
		`runtime: ${report.runtime}`,
		...report.skills.map((item) => `skills: ${item.count} in ${item.folder}`),
		`instructions: ${report.instructions.join(', ')}`,
		...report.hooks.map((item) => `hooks: ${item}`),
		report.git ? `git hooks: pre-commit and commit-msg in ${report.git}` : 'git hooks: not a git repository, skipped',
		'',
		`Tools: ${TOOL_NAMES.join(', ')}. Claude Code uses the plugin instead. Run again after updating CCM Stack.`,
	)
}

async function checkCommand([stage, file]) {
	const gitcheck = await import('../lib/gitcheck.js')
	const config = loadConfig()
	if (stage === 'pre-commit') {
		const problems = gitcheck.checkStaged(config)
		if (problems.length) {
			console.error(`CCM Stack refused this commit:\n${problems.map((item) => `- ${item}`).join('\n')}`)
			process.exit(1)
		}
		return
	}
	if (stage === 'commit-msg') {
		const problem = gitcheck.checkCommitMessage(file, config)
		if (problem) {
			console.error(`CCM Stack refused this commit message: ${problem}`)
			process.exit(1)
		}
		return
	}
	print('usage: ccm check pre-commit | ccm check commit-msg <file>')
}

async function main() {
	if (command === 'install') return installCommand(args)
	if (command === 'check') return checkCommand(args)
	if (command === 'line') return line(args)
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
