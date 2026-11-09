// A minimal zip writer (deflate, no dependencies): enough to send a built site in one upload.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { deflateRawSync } from 'node:zlib'

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
	let c = n
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
	return c >>> 0
})

function crc32(buffer) {
	let crc = 0xffffffff
	for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
	return (crc ^ 0xffffffff) >>> 0
}

const SKIP = new Set(['.git', 'node_modules', '.DS_Store'])

export function listFiles(dir, base = dir) {
	const files = []
	for (const name of readdirSync(dir)) {
		if (SKIP.has(name)) continue
		const path = join(dir, name)
		if (statSync(path).isDirectory()) files.push(...listFiles(path, base))
		else files.push({ path, name: relative(base, path).split(sep).join('/') })
	}
	return files
}

export function zipDirectory(dir) {
	const locals = []
	const centrals = []
	let offset = 0
	for (const file of listFiles(dir)) {
		const data = readFileSync(file.path)
		const packed = deflateRawSync(data)
		const name = Buffer.from(file.name, 'utf8')
		const crc = crc32(data)

		const local = Buffer.alloc(30)
		local.writeUInt32LE(0x04034b50, 0)
		local.writeUInt16LE(20, 4)
		local.writeUInt16LE(0x0800, 6) // UTF-8 names
		local.writeUInt16LE(8, 8) // deflate
		local.writeUInt32LE(crc, 14)
		local.writeUInt32LE(packed.length, 18)
		local.writeUInt32LE(data.length, 22)
		local.writeUInt16LE(name.length, 26)
		locals.push(local, name, packed)

		const central = Buffer.alloc(46)
		central.writeUInt32LE(0x02014b50, 0)
		central.writeUInt16LE(20, 4)
		central.writeUInt16LE(20, 6)
		central.writeUInt16LE(0x0800, 8)
		central.writeUInt16LE(8, 10)
		central.writeUInt32LE(crc, 16)
		central.writeUInt32LE(packed.length, 20)
		central.writeUInt32LE(data.length, 24)
		central.writeUInt16LE(name.length, 28)
		central.writeUInt32LE(offset, 42)
		centrals.push(central, name)

		offset += local.length + name.length + packed.length
	}
	const centralSize = centrals.reduce((sum, part) => sum + part.length, 0)
	const end = Buffer.alloc(22)
	end.writeUInt32LE(0x06054b50, 0)
	end.writeUInt16LE(centrals.length / 2, 8)
	end.writeUInt16LE(centrals.length / 2, 10)
	end.writeUInt32LE(centralSize, 12)
	end.writeUInt32LE(offset, 16)
	return { buffer: Buffer.concat([...locals, ...centrals, end]), count: centrals.length / 2 }
}
