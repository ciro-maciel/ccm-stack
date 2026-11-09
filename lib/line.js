// The Ciro Cesar Maciel line of products, as an agent uses them: one sign-in by an 8-character
// e-mail code, then every product over its public HTTP API or MCP server. Every address here is
// published in the line's llms.txt files. Same sign-in, authorization per product.

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { configDir } from './config.js'
import { zipDirectory } from './zip.js'

export const AUTH_URL = 'https://auth.worker.myinfrastructure.click'
export const HOSTER_URL = 'https://hoster.worker.myinfrastructure.click'

// Every MCP server of the line. `id` names the resource the address needs, when it needs one.
export const MCP_SERVERS = [
	{ name: 'hoster', line: 'infrastructure', does: 'publish sites', url: 'https://hoster.worker.myinfrastructure.click/mcp' },
	{ name: 'infrastructure-functions', line: 'infrastructure', does: 'run code', url: 'https://functions.manager.myinfrastructure.click/mcp' },
	{ name: 'infrastructure-monitors', line: 'infrastructure', does: 'watch URLs, status pages', url: 'https://monitors.manager.myinfrastructure.click/mcp' },
	{ name: 'infrastructure-storage', line: 'infrastructure', does: 'data and files', url: 'https://storage.manager.myinfrastructure.click/mcp/{tenantId}', id: 'tenantId' },
	{ name: 'infrastructure-payments', line: 'infrastructure', does: 'subscriptions and one-off charges', url: 'https://payments.worker.myinfrastructure.click/mcp/{projectId}', id: 'paymentsProjectId' },
	{ name: 'infrastructure-messages', line: 'infrastructure', does: 'transactional e-mail and inboxes', url: 'https://messages.worker.myinfrastructure.click/mcp/{projectId}', id: 'messagesProjectId' },
	{ name: 'infrastructure-auth', line: 'infrastructure', does: 'sign-in for your users', url: 'https://auth.worker.myinfrastructure.click/mcp/{applicationId}', id: 'applicationId' },
	{ name: 'operations-analytics', line: 'operations', does: 'visits, goals, MCP tool calls', url: 'https://analytics.worker.myoperations.click/mcp' },
	{ name: 'operations-videos', line: 'operations', does: 'video hosting', url: 'https://videos.worker.myoperations.click/mcp' },
	{ name: 'operations-tasks', line: 'operations', does: 'scheduled agent tasks', url: 'https://tasks.worker.myoperations.click/mcp' },
	{ name: 'customers-people', line: 'customers', does: 'where each customer is, and what to do now', url: 'https://people.worker.mycustomers.click/mcp' },
	{ name: 'marketing-blogs', line: 'marketing', does: 'blogs', url: 'https://blogs.worker.mymarketing.click/mcp' },
	{ name: 'marketing-pages', line: 'marketing', does: 'landing pages', url: 'https://pages.worker.mymarketing.click/mcp' },
	{ name: 'marketing-forms', line: 'marketing', does: 'forms', url: 'https://forms.worker.mymarketing.click/mcp' },
	{ name: 'marketing-links', line: 'marketing', does: 'short links with their origin', url: 'https://links.worker.mymarketing.click/mcp' },
	{ name: 'marketing-newsletter', line: 'marketing', does: 'newsletter', url: 'https://newsletter.worker.mymarketing.click/mcp' },
	{ name: 'marketing-decks', line: 'marketing', does: 'slide decks', url: 'https://decks.worker.mymarketing.click/mcp' },
	{ name: 'marketing-stores', line: 'marketing', does: 'online store, Pix and card', url: 'https://stores.worker.mymarketing.click/mcp' },
	{ name: 'marketing-designs', line: 'marketing', does: 'images, video, design files', url: 'https://designs.worker.mymarketing.click/mcp' },
	{ name: 'agents-brain', line: 'agents', does: 'memory for agents', url: 'https://brain.worker.myagents.click/mcp/{spaceId}', id: 'brainSpaceId' },
	{ name: 'agents-universal', line: 'agents', does: 'the MCP of the system you run', url: 'https://universal.worker.myagents.click/mcp/{systemId}', id: 'universalSystemId' },
]

export const lineDir = () => join(configDir(), 'line')
const sessionPath = () => join(lineDir(), 'session.json')
const pendingPath = () => join(lineDir(), 'pending.json')
const resourcesPath = () => join(lineDir(), 'resources.json')

function writePrivate(path, data) {
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, `${JSON.stringify(data, null, '\t')}\n`, { mode: 0o600 })
}
const readJson = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback)

export const resources = () => readJson(resourcesPath(), {})
export function saveResource(key, value) {
	writePrivate(resourcesPath(), { ...resources(), [key]: value })
}

export class LineError extends Error {
	constructor(message, { status, code } = {}) {
		super(message)
		this.status = status
		this.code = code
	}
}

async function call(url, { method = 'GET', token, body, form, headers = {} } = {}) {
	const init = { method, headers: { ...headers } }
	if (token) init.headers.authorization = `Bearer ${token}`
	if (body !== undefined) {
		init.headers['content-type'] = 'application/json'
		init.body = JSON.stringify(body)
	}
	if (form) init.body = form
	const response = await fetch(url, init)
	const text = await response.text()
	let data = null
	try {
		data = text ? JSON.parse(text) : null
	} catch {
		data = { raw: text.slice(0, 300) }
	}
	if (!response.ok) {
		const error = data?.error || {}
		const message = error.message || data?.message || data?.raw || `HTTP ${response.status}`
		if (response.status === 402) {
			throw new LineError(`${message} This needs a plan; the person subscribes, the agent never pays.`, { status: 402, code: error.code })
		}
		throw new LineError(message, { status: response.status, code: error.code })
	}
	return data
}

// --- Sign-in: the one human step ---------------------------------------------

export async function startSignIn(email) {
	const data = await call(`${AUTH_URL}/auth/code/start`, { method: 'POST', body: { email } })
	writePrivate(pendingPath(), { email, deviceCode: data.deviceCode, at: new Date().toISOString() })
	return { email, expiresIn: data.expiresIn }
}

export async function finishSignIn(email, code) {
	const data = await call(`${AUTH_URL}/auth/code/verify`, { method: 'POST', body: { email, code } })
	const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
	writePrivate(sessionPath(), { email: data.user?.email || email, userId: data.user?.id, token: data.token, expiresAt })
	return { email: data.user?.email || email, expiresAt }
}

export function session() {
	const saved = readJson(sessionPath(), null)
	if (!saved || new Date(saved.expiresAt) < new Date()) return null
	return saved
}

export function requireSession() {
	const saved = session()
	if (!saved) throw new LineError('Not signed in to the line. Run: ccm line login <email>, then ccm line login <email> <code>.')
	return saved.token
}

// --- Ship a site --------------------------------------------------------------

const PROJECT_ID = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/

export async function ship(projectId, dir) {
	if (!PROJECT_ID.test(projectId)) {
		throw new LineError('The project name becomes the address: 3 to 63 lowercase letters, numbers and hyphens.')
	}
	const folder = resolve(dir)
	if (!existsSync(join(folder, 'index.html'))) {
		throw new LineError(`${folder} has no index.html. Build the site first, then ship the folder the build writes (dist, build, out).`)
	}
	const token = requireSession()
	await call(`${HOSTER_URL}/projects`, { method: 'POST', token, body: { projectId } })
	const { buffer, count } = zipDirectory(folder)
	const form = new FormData()
	form.append('projectId', projectId)
	form.append('file', new Blob([buffer], { type: 'application/zip' }), `${projectId}.zip`)
	const result = await call(`${HOSTER_URL}/deploy-zip`, { method: 'POST', token, form })
	saveResource('hosterProjectId', projectId)
	return { url: `https://${projectId}.myhoster.click`, files: result?.fileCount ?? count, deployId: result?.deployId }
}

// --- Watch it -----------------------------------------------------------------

export async function watch(url, name) {
	const token = requireSession()
	// The sign-in is accepted on /monitors. The account's mk_ key is shown only when the account is
	// created, so relying on it would break every watch after the first.
	await call('https://monitors.manager.myinfrastructure.click/me', { token })
	const monitor = await call('https://monitors.manager.myinfrastructure.click/monitors', {
		method: 'POST',
		token,
		body: { name, url, interval: 300 },
	})
	return { id: monitor?.id, name, url }
}

// --- Provision the other products ----------------------------------------------

const PROVISION = {
	storage: { url: 'https://storage.manager.myinfrastructure.click/me', method: 'GET', keys: { apiKey: 'STORAGE_API_KEY', tenantId: 'STORAGE_TENANT_ID' }, resource: ['tenantId', 'tenantId'] },
	functions: { url: 'https://functions.manager.myinfrastructure.click/me', method: 'GET', keys: { apiKey: 'FUNCTIONS_API_KEY' } },
	monitors: { url: 'https://monitors.manager.myinfrastructure.click/me', method: 'GET', keys: { apiKey: 'MONITORS_API_KEY' } },
	payments: { url: 'https://payments.worker.myinfrastructure.click/projects', method: 'POST', named: true, keys: { publicKey: 'PAYMENTS_PUBLIC_KEY', secretKey: 'PAYMENTS_SECRET_KEY', id: 'PAYMENTS_PROJECT_ID' }, resource: ['paymentsProjectId', 'id'] },
	messages: { url: 'https://messages.worker.myinfrastructure.click/projects', method: 'POST', named: true, keys: { publicKey: 'MESSAGES_PUBLIC_KEY', secretKey: 'MESSAGES_SECRET_KEY', id: 'MESSAGES_PROJECT_ID' }, resource: ['messagesProjectId', 'id'] },
}
export const PRODUCTS = Object.keys(PROVISION)

function ensureIgnored(envFile) {
	const gitignore = join(dirname(envFile), '.gitignore')
	const name = envFile.split(/[\\/]/).pop()
	const current = existsSync(gitignore) ? readFileSync(gitignore, 'utf8') : ''
	if (!current.split(/\r?\n/).includes(name)) appendFileSync(gitignore, `${current && !current.endsWith('\n') ? '\n' : ''}${name}\n`)
}

// Sets each variable in the env file: replaces its line when it is there, appends it when not.
// Running provision twice leaves one line per variable.
export function upsertEnv(path, values) {
	if (!values.length) return
	const lines = existsSync(path) ? readFileSync(path, 'utf8').split(/\r?\n/) : []
	while (lines.length && lines.at(-1) === '') lines.pop()
	for (const [variable, value] of values) {
		const index = lines.findIndex((line) => line.startsWith(`${variable}=`))
		if (index >= 0) lines[index] = `${variable}=${value}`
		else lines.push(`${variable}=${value}`)
	}
	writeFileSync(path, `${lines.join('\n')}\n`, { mode: 0o600 })
}

// Writes the credentials into the project's env file (kept out of git) and returns only their names.
export async function provision(product, { name, envFile }) {
	const spec = PROVISION[product]
	if (!spec) throw new LineError(`Unknown product "${product}". One of: ${PRODUCTS.join(', ')}.`)
	if (!envFile) throw new LineError('Say where the keys go: --env .env (it is added to .gitignore). Keys are never printed.')
	const token = requireSession()
	const data = await call(spec.url, { method: spec.method, token, body: spec.named ? { name: name || 'My project' } : undefined })
	const path = resolve(envFile)
	ensureIgnored(path)
	const values = Object.entries(spec.keys).filter(([field]) => data?.[field] != null).map(([field, variable]) => [variable, data[field]])
	upsertEnv(path, values)
	const written = values.map(([variable]) => variable)
	if (spec.resource && data?.[spec.resource[1]]) saveResource(spec.resource[0], data[spec.resource[1]])
	const missing = Object.keys(spec.keys).filter((field) => data?.[field] == null)
	return { product, envFile: path, written, missing }
}

// --- MCP servers -----------------------------------------------------------------

export function mcpCommands(selection) {
	const known = resources()
	const wanted = MCP_SERVERS.filter((server) => selection.includes('all') || selection.includes(server.line) || selection.includes(server.name))
	return wanted.map((server) => {
		if (!server.id) return { ...server, command: ['claude', 'mcp', 'add', '--transport', 'http', server.name, server.url] }
		const value = known[server.id]
		if (!value) return { ...server, missing: server.id }
		return { ...server, command: ['claude', 'mcp', 'add', '--transport', 'http', server.name, server.url.replace(/\{[^}]+\}/, value)] }
	})
}
