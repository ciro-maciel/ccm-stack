// `ccm install`: puts CCM Stack where each coding agent looks for it, in one project.
// Skills follow the open Agent Skills format; principles go into the instruction file each tool
// reads; hooks get a thin adapter per tool; git hooks are the net that works with any of them.

import { spawnSync } from 'node:child_process'
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { configDir } from './config.js'
import { principlesText } from './hooks.js'
import { ROOT } from './rules.js'

// Where each tool reads skills and instructions in a project.
export const TOOLS = {
	antigravity: { skills: ['.agents/skills'], instructions: ['AGENTS.md', 'GEMINI.md'] },
	windsurf: { skills: ['.agents/skills', '.devin/skills'], instructions: ['AGENTS.md'], hooks: 'windsurf' },
	cursor: { skills: ['.cursor/skills'], instructions: ['AGENTS.md'], hooks: 'cursor' },
	codex: { skills: ['.agents/skills'], instructions: ['AGENTS.md'] },
	'gemini-cli': { skills: ['.gemini/skills'], instructions: ['GEMINI.md'] },
	copilot: { skills: ['.github/skills'], instructions: ['AGENTS.md', '.github/copilot-instructions.md'] },
}
export const TOOL_NAMES = Object.keys(TOOLS)

const START = '<!-- ccm-stack:start -->'
const END = '<!-- ccm-stack:end -->'

// A copy of the runtime outside the plugin cache, so hooks keep working when the plugin updates.
export const runtimeDir = () => join(configDir(), 'runtime')
export const runtimeCli = () => join(runtimeDir(), 'bin', 'ccm.js')

export function installRuntime() {
	const target = runtimeDir()
	rmSync(target, { recursive: true, force: true })
	mkdirSync(target, { recursive: true })
	for (const entry of ['bin', 'lib', 'hooks', 'skills', 'rules.json', 'principles.md', 'package.json']) {
		cpSync(join(ROOT, entry), join(target, entry), { recursive: true })
	}
	return target
}

function writeBlock(path, content) {
	const block = `${START}\n${content.trim()}\n${END}`
	const current = existsSync(path) ? readFileSync(path, 'utf8') : ''
	const pattern = new RegExp(`${START}[\\s\\S]*?${END}`)
	const next = pattern.test(current) ? current.replace(pattern, block) : `${current}${current && !current.endsWith('\n') ? '\n\n' : ''}${block}\n`
	mkdirSync(join(path, '..'), { recursive: true })
	writeFileSync(path, next)
}

// Each skill is copied as ccm-<name>, with its frontmatter name to match and the CLI path made absolute.
function installSkills(project, folder) {
	const target = join(project, folder)
	const cli = runtimeCli()
	const names = []
	for (const name of readdirSync(join(ROOT, 'skills'))) {
		const text = readFileSync(join(ROOT, 'skills', name, 'SKILL.md'), 'utf8')
			.replace(/^name: (.+)$/m, `name: ccm-$1`)
			.replace(/The CLI lives two folders above this skill's base directory: `node "<base>\/\.\.\/\.\.\/bin\/ccm\.js"( line \.\.\.)?`\./g, `The CLI is \`node "${cli}"$1\`.`)
			.replace(/The CLI lives two folders above this skill's base directory\. Call it as `node "<base>\/\.\.\/\.\.\/bin\/ccm\.js" <command>` and use the full path you were given\./g, `The CLI is \`node "${cli}" <command>\`.`)
		mkdirSync(join(target, `ccm-${name}`), { recursive: true })
		writeFileSync(join(target, `ccm-${name}`, 'SKILL.md'), text)
		names.push(`ccm-${name}`)
	}
	return { folder, count: names.length }
}

// Ours, whatever the config folder is called: the runtime's own hook script.
const isOurs = (entry) => /runtime[\\/]hooks[\\/]run\.js/.test(String(entry.command))

function hookCommand(mode) {
	return `node "${join(runtimeDir(), 'hooks', 'run.js')}" ${mode}`
}

function installToolHooks(project, kind) {
	if (kind === 'cursor') {
		const path = join(project, '.cursor', 'hooks.json')
		const current = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { version: 1, hooks: {} }
		current.version ??= 1
		current.hooks ??= {}
		const list = (current.hooks.beforeShellExecution ??= []).filter((entry) => !isOurs(entry))
		list.push({ command: hookCommand('cursor') })
		current.hooks.beforeShellExecution = list
		mkdirSync(join(project, '.cursor'), { recursive: true })
		writeFileSync(path, `${JSON.stringify(current, null, '\t')}\n`)
		return path
	}
	if (kind === 'windsurf') {
		const paths = [join(project, '.windsurf', 'hooks.json'), join(project, '.devin', 'hooks.v1.json')]
		for (const path of paths) {
			const current = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { hooks: {} }
			current.hooks ??= {}
			const list = (current.hooks.pre_run_command ??= []).filter((entry) => !isOurs(entry))
			list.push({ command: hookCommand('windsurf'), show_output: true })
			current.hooks.pre_run_command = list
			mkdirSync(join(path, '..'), { recursive: true })
			writeFileSync(path, `${JSON.stringify(current, null, '\t')}\n`)
		}
		return paths.join(', ')
	}
	return null
}

// The net under every tool: checks that run when anyone commits, agent or person.
function installGitHooks(project) {
	const git = spawnSync('git', ['rev-parse', '--git-path', 'hooks'], { cwd: project, encoding: 'utf8' })
	if (git.status !== 0) return null
	const custom = spawnSync('git', ['config', 'core.hooksPath'], { cwd: project, encoding: 'utf8' }).stdout.trim()
	const dir = resolve(project, custom || git.stdout.trim())
	mkdirSync(dir, { recursive: true })
	const cli = runtimeCli()
	const lines = {
		'pre-commit': `node "${cli}" check pre-commit || exit 1`,
		'commit-msg': `node "${cli}" check commit-msg "$1" || exit 1`,
	}
	for (const [name, line] of Object.entries(lines)) {
		const path = join(dir, name)
		const marked = `# ccm-stack\n${line}\n`
		let current = existsSync(path) ? readFileSync(path, 'utf8') : '#!/bin/sh\n'
		current = current.replace(/# ccm-stack\n.*\n/g, '')
		writeFileSync(path, `${current}${current.endsWith('\n') ? '' : '\n'}${marked}`)
		chmodSync(path, 0o755)
	}
	return dir
}

export function install(project, tools, config) {
	const root = resolve(project)
	const chosen = tools.includes('all') ? TOOL_NAMES : tools
	for (const tool of chosen) if (!TOOLS[tool]) throw new Error(`Unknown tool "${tool}". One of: ${TOOL_NAMES.join(', ')}, all.`)
	installRuntime()
	const report = { runtime: runtimeDir(), skills: [], instructions: [], hooks: [], git: null }
	const skillFolders = new Set(chosen.flatMap((tool) => TOOLS[tool].skills))
	for (const folder of skillFolders) report.skills.push(installSkills(root, folder))
	const instructionFiles = new Set(chosen.flatMap((tool) => TOOLS[tool].instructions))
	const text = principlesText(config, { isOutsideClaude: true })
	for (const file of instructionFiles) {
		writeBlock(join(root, file), text)
		report.instructions.push(file)
	}
	for (const tool of chosen) {
		const written = TOOLS[tool].hooks && installToolHooks(root, TOOLS[tool].hooks)
		if (written) report.hooks.push(`${tool}: ${written}`)
	}
	report.git = installGitHooks(root)
	return report
}
