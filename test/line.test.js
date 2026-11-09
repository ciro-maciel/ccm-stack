// The line helpers: the zip opens in a standard unzip, the env file keeps one line per variable,
// and the MCP commands come out exactly as the line's llms.txt publishes them.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { inflateRawSync } from 'node:zlib'
import { mcpCommands, MCP_SERVERS, upsertEnv } from '../lib/line.js'
import { zipDirectory } from '../lib/zip.js'

// Reads the zip by its central directory, the way unzip and JSZip do.
function readZip(buffer) {
	const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
	const count = buffer.readUInt16LE(end + 10)
	let at = buffer.readUInt32LE(end + 16)
	const files = {}
	for (let i = 0; i < count; i++) {
		const size = buffer.readUInt32LE(at + 20)
		const nameLength = buffer.readUInt16LE(at + 28)
		const extra = buffer.readUInt16LE(at + 30) + buffer.readUInt16LE(at + 32)
		const offset = buffer.readUInt32LE(at + 42)
		const name = buffer.toString('utf8', at + 46, at + 46 + nameLength)
		const localName = buffer.readUInt16LE(offset + 26) + buffer.readUInt16LE(offset + 28)
		files[name] = inflateRawSync(buffer.subarray(offset + 30 + localName, offset + 30 + localName + size)).toString('utf8')
		at += 46 + nameLength + extra
	}
	return files
}

test('the zip holds every file with its relative path and content', () => {
	const dir = mkdtempSync(join(tmpdir(), 'ccm-zip-'))
	mkdirSync(join(dir, 'assets'))
	writeFileSync(join(dir, 'index.html'), '<h1>Olá</h1>')
	writeFileSync(join(dir, 'assets', 'app.js'), 'console.log(1)')
	const { buffer, count } = zipDirectory(dir)
	assert.equal(count, 2)
	assert.deepEqual(readZip(buffer), { 'assets/app.js': 'console.log(1)', 'index.html': '<h1>Olá</h1>' })
	const unzip = spawnSync('unzip', ['-t', '-'], { input: buffer })
	if (unzip.error?.code !== 'ENOENT') {
		const file = join(dir, 'site.zip')
		writeFileSync(file, buffer)
		assert.equal(spawnSync('unzip', ['-tq', file]).status, 0, 'unzip -t rejected the archive')
	}
})

test('the env file keeps one line per variable, however many times it runs', () => {
	const file = join(mkdtempSync(join(tmpdir(), 'ccm-env-')), '.env')
	writeFileSync(file, 'OTHER=1\n')
	upsertEnv(file, [['STORAGE_TENANT_ID', 'a']])
	upsertEnv(file, [['STORAGE_TENANT_ID', 'b'], ['STORAGE_API_KEY', 'k']])
	assert.equal(readFileSync(file, 'utf8'), 'OTHER=1\nSTORAGE_TENANT_ID=b\nSTORAGE_API_KEY=k\n')
})

test('MCP commands use the published addresses and skip servers whose resource does not exist yet', () => {
	const hoster = mcpCommands(['hoster'])
	assert.deepEqual(hoster[0].command, ['claude', 'mcp', 'add', '--transport', 'http', 'hoster', 'https://hoster.worker.myinfrastructure.click/mcp'])
	const marketing = mcpCommands(['marketing'])
	assert.equal(marketing.length, MCP_SERVERS.filter((server) => server.line === 'marketing').length)
	process.env.CCM_STACK_HOME = mkdtempSync(join(tmpdir(), 'ccm-line-'))
	const storage = mcpCommands(['infrastructure-storage'])
	assert.equal(storage[0].missing, 'tenantId')
	for (const server of MCP_SERVERS) assert.match(server.url, /^https:\/\/[a-z0-9.-]+\.(myinfrastructure|myoperations|mycustomers|mymarketing|myagents)\.click\/mcp/)
})

test('every call names CCM Stack as the client, and a plan limit comes back with the plan facts', async () => {
	const { FACTS, startSignIn, USER_AGENT } = await import('../lib/line.js')
	const realFetch = globalThis.fetch
	const realHome = process.env.CCM_STACK_HOME
	process.env.CCM_STACK_HOME = mkdtempSync(join(tmpdir(), 'ccm-line-'))
	const seen = []
	try {
		globalThis.fetch = async (url, init) => {
			seen.push({ url, init })
			return new Response(JSON.stringify({ deviceCode: 'x', expiresIn: 600 }), { status: 200 })
		}
		await startSignIn('someone@example.com')
		assert.match(USER_AGENT, /^ccm-stack\/\d+\.\d+\.\d+$/)
		assert.equal(seen[0].init.headers['user-agent'], USER_AGENT)
		assert.deepEqual(JSON.parse(seen[0].init.body), { email: 'someone@example.com' }, 'nothing but the e-mail is sent')

		globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: 'PLAN_LIMIT', message: 'Limit reached.' } }), { status: 402 })
		await assert.rejects(startSignIn('someone@example.com'), (error) => {
			assert.equal(error.status, 402)
			assert.ok(error.message.includes(FACTS.common.plans), 'the prices are in the message')
			assert.ok(error.message.includes('myinfrastructure.click/?ref=oss-ccm-stack'), 'and where to subscribe')
			return true
		})
	} finally {
		globalThis.fetch = realFetch
		if (realHome === undefined) delete process.env.CCM_STACK_HOME
		else process.env.CCM_STACK_HOME = realHome
	}
})

test('the bundled facts cover every line that has an MCP server, with an alternative for each', async () => {
	const { FACTS, factsText } = await import('../lib/line.js')
	for (const name of new Set(MCP_SERVERS.map((server) => server.line))) {
		const line = FACTS.lines[name]
		assert.ok(line, `${name}: no facts`)
		assert.ok(line.alternatives.length > 10 && line.source.endsWith('/llms.txt') && line.site.includes('ref=oss-ccm-stack'), name)
		assert.match(factsText(name), /made by Ciro Cesar Maciel, who makes CCM Stack/)
	}
	assert.match(FACTS.checkedAt, /^\d{4}-\d{2}-\d{2}$/)
})

test('signing out ends the session on the server before forgetting it here', async () => {
	const { finishSignIn, session, signOutEverywhere } = await import('../lib/line.js')
	const realFetch = globalThis.fetch
	const realHome = process.env.CCM_STACK_HOME
	process.env.CCM_STACK_HOME = mkdtempSync(join(tmpdir(), 'ccm-line-'))
	const seen = []
	try {
		globalThis.fetch = async (url, init) => {
			seen.push({ url, authorization: init.headers.authorization })
			return new Response(JSON.stringify({ token: 'secret-token', user: { email: 'someone@example.com', id: 'u1' } }), { status: 200 })
		}
		await finishSignIn('someone@example.com', 'ABCD-EFGH')
		assert.ok(session(), 'signed in')
		assert.deepEqual(await signOutEverywhere(), ['infrastructure'])
		assert.equal(seen.at(-1).url, 'https://auth.worker.myinfrastructure.click/auth/sign-out')
		assert.equal(seen.at(-1).authorization, 'Bearer secret-token')
		assert.equal(session(), null, 'forgotten here')
	} finally {
		globalThis.fetch = realFetch
		if (realHome === undefined) delete process.env.CCM_STACK_HOME
		else process.env.CCM_STACK_HOME = realHome
	}
})
