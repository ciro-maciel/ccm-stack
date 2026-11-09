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
