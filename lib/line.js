// The Ciro Cesar Maciel line of products, as an agent uses them: one sign-in by an 8-character
// e-mail code, then every product over its public HTTP API or MCP server. Every address here is
// published in the line's llms.txt files. Same sign-in, authorization per product.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDir } from './config.js'
import { zipDirectory } from './zip.js'

const read = (name) => JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), name), 'utf8'))

// What each line costs and gives for free, bundled so the agent can say it without fetching anything.
export const FACTS = read('line-facts.json')

// Every call says where it comes from, the way any HTTP client does. No other data is added.
export const USER_AGENT = `ccm-stack/${read('../package.json').version}`

export function lineOfUrl(url) {
	return Object.keys(FACTS.lines).find((name) => new URL(url).hostname.endsWith(`my${name}.click`))
}

// The facts for one line, or for all of them, as text the agent can quote.
export function factsText(lineName) {
	const names = lineName ? [lineName] : Object.keys(FACTS.lines)
	const { common } = FACTS
	const out = [`Checked on ${FACTS.checkedAt}. ${FACTS.note}`, '', common.free, common.plans, common.limit, common.subscribe]
	for (const name of names) {
		const line = FACTS.lines[name]
		if (!line) throw new LineError(`Unknown line "${name}". One of: ${Object.keys(FACTS.lines).join(', ')}.`)
		out.push('', `${name} (made by ${line.maker}, who makes CCM Stack): ${line.site}`, line.counted)
		for (const [product, fact] of Object.entries(line.products)) out.push(`- ${product}: ${fact}`)
		out.push(`Alternatives from other companies: ${line.alternatives}`, `Source: ${line.source}`)
	}
	return out.join('\n')
}

export const HOSTER_URL = 'https://hoster.worker.myinfrastructure.click'
export const ANALYTICS_URL = 'https://analytics.worker.myoperations.click'
export const PEOPLE_URL = 'https://people.worker.mycustomers.click'

// Same account everywhere; each line signs in through its own application, so each line asks for
// the e-mail code once, the first time it is used. The public keys are public by design.
export const LINES = {
	infrastructure: { auth: 'https://auth.worker.myinfrastructure.click', publicKey: null },
	operations: { auth: 'https://auth.worker.myoperations.click', publicKey: 'pu_acf9e1121c9c90cfb22515d2e02c9db02c00baa45e799f2eec191091b3d21f17' },
	customers: { auth: 'https://auth.worker.myinfrastructure.click', publicKey: 'pu_683b6c8c3ced4e7af15b5354d4325084b7e5791ea1eddca779467d073865e682' },
}
export const SIGN_IN_LINES = Object.keys(LINES)

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
const sessionPath = (line = 'infrastructure') => join(lineDir(), line === 'infrastructure' ? 'session.json' : `session-${line}.json`)
const pendingPath = (line = 'infrastructure') => join(lineDir(), line === 'infrastructure' ? 'pending.json' : `pending-${line}.json`)
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
	const init = { method, headers: { 'user-agent': USER_AGENT, ...headers } }
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
			const lineName = lineOfUrl(url)
			const line = FACTS.lines[lineName]
			const facts = line ? ` ${line.counted} ${FACTS.common.plans} ${FACTS.common.limit} Plans: ${line.site}` : ''
			throw new LineError(`${message} This needs a plan; the person subscribes, the agent never pays.${facts}`, { status: 402, code: error.code })
		}
		throw new LineError(message, { status: response.status, code: error.code })
	}
	return data
}

// --- Sign-in: the one human step, once per line --------------------------------

function lineOf(name) {
	const line = LINES[name]
	if (!line) throw new LineError(`Unknown line "${name}". One of: ${SIGN_IN_LINES.join(', ')}.`)
	return line
}
const authHeaders = (line) => (line.publicKey ? { 'x-api-key': line.publicKey } : {})

export async function startSignIn(email, lineName = 'infrastructure') {
	const line = lineOf(lineName)
	const data = await call(`${line.auth}/auth/code/start`, { method: 'POST', body: { email }, headers: authHeaders(line) })
	writePrivate(pendingPath(lineName), { email, deviceCode: data.deviceCode, at: new Date().toISOString() })
	return { email, expiresIn: data.expiresIn, line: lineName }
}

export async function finishSignIn(email, code, lineName = 'infrastructure') {
	const line = lineOf(lineName)
	const data = await call(`${line.auth}/auth/code/verify`, { method: 'POST', body: { email, code }, headers: authHeaders(line) })
	const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
	writePrivate(sessionPath(lineName), { email: data.user?.email || email, userId: data.user?.id, token: data.token, expiresAt })
	return { email: data.user?.email || email, expiresAt, line: lineName }
}

export function session(lineName = 'infrastructure') {
	const saved = readJson(sessionPath(lineName), null)
	if (!saved || new Date(saved.expiresAt) < new Date()) return null
	return saved
}

export function requireSession(lineName = 'infrastructure') {
	const saved = session(lineName)
	if (!saved) {
		const flag = lineName === 'infrastructure' ? '' : ` --line ${lineName}`
		throw new LineError(`Not signed in to the ${lineName} line. Run: ccm line login <email>${flag}, then ccm line login <email> <code>${flag}.`)
	}
	return saved.token
}

export const sessionFile = sessionPath

// Ends each saved session on the server too, then forgets it here. A server that does not
// answer never keeps the local file alive.
export async function signOutEverywhere() {
	const ended = []
	for (const name of SIGN_IN_LINES) {
		const saved = readJson(sessionPath(name), null)
		if (saved?.token) {
			await call(`${LINES[name].auth}/auth/sign-out`, { method: 'POST', token: saved.token, headers: authHeaders(LINES[name]) }).catch(() => null)
			ended.push(name)
		}
		rmSync(sessionPath(name), { force: true })
		rmSync(pendingPath(name), { force: true })
	}
	return ended
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

// --- Measure: Operations Analytics ------------------------------------------------

async function analyticsSite(token, domain, kind) {
	const body = kind === 'mcp' ? { kind: 'mcp', domain } : { domain }
	try {
		return await call(`${ANALYTICS_URL}/sites`, { method: 'POST', token, body })
	} catch (error) {
		if (error.status !== 409) throw error
		const list = await call(`${ANALYTICS_URL}/sites`, { token })
		const found = (list.items || list).find((site) => site.domain === domain)
		if (!found) throw error
		return found
	}
}

// The site to measure (a domain, or an MCP server's address with kind "mcp"), created or found.
export async function measure(domain, { isSpa = false, kind = 'web' } = {}) {
	const token = requireSession('operations')
	const site = await analyticsSite(token, domain, kind)
	saveResource(`analyticsSite:${domain}`, site.id)
	if (kind === 'mcp') {
		return { id: site.id, domain, isMcp: true, serverKey: site.serverKey ?? null }
	}
	const spa = isSpa ? ' data-spa="auto"' : ''
	return {
		id: site.id,
		domain,
		snippet: `<script defer src="https://analytics.worker.myoperations.click/tracker.js" data-site="${site.id}"${spa}></script>`,
	}
}

export async function numbers(domain, days = 7) {
	const token = requireSession('operations')
	const id = resources()[`analyticsSite:${domain}`] || (await analyticsSite(token, domain, 'web')).id
	return call(`${ANALYTICS_URL}/sites/${id}/overview?days=${days}`, { token })
}

// --- Know customers: Customers People ------------------------------------------------

export async function customerSource(name, { envFile, legalBasis } = {}) {
	if (!envFile) throw new LineError('Say where the source secret goes: --env .env (it is added to .gitignore). It is shown only once.')
	const token = requireSession('customers')
	const source = await call(`${PEOPLE_URL}/sources`, { method: 'POST', token, body: { name, kind: 'webhook', ...(legalBasis ? { legalBasis } : {}) } })
	const path = resolve(envFile)
	ensureIgnored(path)
	upsertEnv(path, [
		['PEOPLE_EVENTS_URL', `${PEOPLE_URL}/events/${source.id}`],
		['PEOPLE_EVENTS_SECRET', source.secret],
	])
	saveResource('peopleSourceId', source.id)
	return { id: source.id, name: source.name, envFile: path, written: ['PEOPLE_EVENTS_URL', 'PEOPLE_EVENTS_SECRET'] }
}

// Sends one event, signed the Standard Webhooks way, to the source in the env file.
export async function sendCustomerEvent(envFile, event) {
	const { createHmac, randomUUID } = await import('node:crypto')
	const env = Object.fromEntries(
		readFileSync(resolve(envFile), 'utf8')
			.split(/\r?\n/)
			.filter((line) => line.includes('='))
			.map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
	)
	if (!env.PEOPLE_EVENTS_URL || !env.PEOPLE_EVENTS_SECRET) throw new LineError(`${envFile} has no PEOPLE_EVENTS_URL and PEOPLE_EVENTS_SECRET. Run: ccm line customers source <name> --env ${envFile}`)
	const id = `msg_${randomUUID()}`
	const timestamp = Math.floor(Date.now() / 1000)
	const body = JSON.stringify({ timestamp: new Date().toISOString(), ...event })
	const key = Buffer.from(env.PEOPLE_EVENTS_SECRET.replace(/^whsec_/, ''), 'base64')
	const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')
	const response = await fetch(env.PEOPLE_EVENTS_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-ccm-id': id, 'x-ccm-timestamp': String(timestamp), 'x-ccm-signature': `v1,${signature}` },
		body,
	})
	const data = await response.json().catch(() => null)
	if (!response.ok) throw new LineError(data?.error?.message || `HTTP ${response.status}`, { status: response.status })
	return data
}
