// The spoken summary: turns the agent's last words into sound on Linux, macOS and Windows.
// Engines: "phonon" (Gradium's on-device model, the default), "system" (the OS voice), "fish" (cloud, your key).

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
	appendFileSync,
	chmodSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs'
import { arch, platform, tmpdir } from 'node:os'
import { join } from 'node:path'
import { configDir } from './config.js'
import { baseLanguage } from './language.js'

export const PTTS_VERSION = '0.6.0'
const PTTS_URL = `https://github.com/gradium-ai/xn-ptts/releases/download/v${PTTS_VERSION}`
const PTTS_ASSETS = {
	'darwin-arm64': ['ptts-0.6.0-aarch64-apple-darwin.tar.gz', '6d66f66a24c74032b518c55a299a85e9950755bee5de13041c731070eeddf11d'],
	'darwin-x64': ['ptts-0.6.0-x86_64-apple-darwin.tar.gz', '9a2e0e032bbe01289f2947d1ffe552ab49e98d99aa62e770036d3f69b98a5576'],
	'linux-arm64': ['ptts-0.6.0-aarch64-unknown-linux-gnu.tar.gz', '96e315280ae3f2aed043698a6e5ff6fc2399ec917a0bf1ab24db370c5f4f6867'],
	'linux-x64': ['ptts-0.6.0-x86_64-unknown-linux-gnu.tar.gz', 'c6d0c31288e688b43bbbedf67a6eecaee86f050407124858901dda2ecf44ef89'],
	'win32-x64': ['ptts-0.6.0-x86_64-pc-windows-msvc.zip', '96994f8150ae1cbd0c1ff492d3892c22030998272940fe70518e598a56169adc'],
}

// One model per language, pinned to a revision so it loads from the cache offline.
export const PHONON_MODELS = {
	en: { repo: 'gradium/phonon-31m-en', revision: '92741c5b07d085ff840e26fea8ce43110b87852f', license: 'Apache-2.0', isCommercial: true, voice: 'Harper' },
	pt: { repo: 'gradium/phonon-40m-pt', revision: '4cbfd742a1555d60eb5399c6d296e9f2e07389e9', license: 'CC BY-NC 4.0', isCommercial: false, voice: 'Davi' },
	es: { repo: 'gradium/phonon-40m-es', revision: 'e5e052b26e31abd5918ade71d3135e69d51a66f8', license: 'CC BY-NC 4.0', isCommercial: false, voice: 'Marcos' },
	fr: { repo: 'gradium/phonon-40m-fr', revision: 'd91086970206b88efd2c88ca971d0628b5968f0f', license: 'CC BY-NC 4.0', isCommercial: false, voice: 'Marius' },
	de: { repo: 'gradium/phonon-40m-de', revision: '79cfc7b47fcfc0b666657b981eb366415023a862', license: 'CC BY-NC 4.0', isCommercial: false, voice: 'Henrik' },
}

const SYSTEM_VOICES = {
	darwin: { en: 'Samantha', pt: 'Luciana', es: 'Mónica', fr: 'Thomas', de: 'Anna' },
}

export const voiceDir = () => join(configDir(), 'voice')
export const pttsPath = () => join(voiceDir(), 'bin', platform() === 'win32' ? 'ptts.exe' : 'ptts')
const isWindows = () => platform() === 'win32'

export function has(command) {
	const probe = isWindows() ? spawnSync('where', [command]) : spawnSync('sh', ['-c', `command -v ${command}`])
	return probe.status === 0
}

const run = (command, args, options = {}) => spawnSync(command, args, { stdio: 'ignore', ...options }).status === 0

// --- Install ----------------------------------------------------------------

async function download(url, target) {
	const response = await fetch(url, { redirect: 'follow' })
	if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`)
	writeFileSync(target, Buffer.from(await response.arrayBuffer()))
}

function findFile(dir, name) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry)
		if (statSync(path).isDirectory()) {
			const found = findFile(path, name)
			if (found) return found
		} else if (entry === name) return path
	}
	return null
}

export async function installPtts() {
	const key = `${platform()}-${arch()}`
	const asset = PTTS_ASSETS[key]
	if (!asset) throw new Error(`Phonon has no build for ${key}. Use the system voice: ccm config set voice.engine system`)
	const [file, sha256] = asset
	const work = join(tmpdir(), `ccm-ptts-${process.pid}`)
	mkdirSync(work, { recursive: true })
	try {
		const archive = join(work, file)
		await download(`${PTTS_URL}/${file}`, archive)
		const actual = createHash('sha256').update(readFileSync(archive)).digest('hex')
		if (actual !== sha256) throw new Error(`Checksum mismatch for ${file}: expected ${sha256}, got ${actual}`)
		// tar ships with macOS, Linux and Windows 10+, and reads .zip on Windows.
		if (!run('tar', ['-xf', archive, '-C', work])) throw new Error(`Could not extract ${file}`)
		const binary = findFile(work, isWindows() ? 'ptts.exe' : 'ptts')
		if (!binary) throw new Error(`No ptts binary inside ${file}`)
		mkdirSync(join(voiceDir(), 'bin'), { recursive: true })
		renameSync(binary, pttsPath())
		if (!isWindows()) chmodSync(pttsPath(), 0o755)
		return pttsPath()
	} finally {
		rmSync(work, { recursive: true, force: true })
	}
}

// --- Synthesis --------------------------------------------------------------

export function phononFor(config) {
	const lang = baseLanguage(config.language) || 'en'
	const model = PHONON_MODELS[lang]
	if (!model) return { reason: `Phonon has no model for "${config.language}"` }
	if (!model.isCommercial && config.voice.isCommercialUse) {
		return { reason: `${model.repo} is ${model.license} (non-commercial); your config says commercial use` }
	}
	return { lang, model, voice: config.voice.voice || model.voice }
}

function synthPhonon(text, wav, config) {
	const choice = phononFor(config)
	if (choice.reason || !existsSync(pttsPath())) return false
	const modelRef = config.voice.model || `hf://${choice.model.repo}@${choice.model.revision}`
	return run(pttsPath(), ['--model', modelRef, '--lang', choice.lang, '--quant', 'q4k', '--voice', choice.voice, text, '-o', wav])
}

async function synthFish(text, wav, config) {
	const key = process.env.FISH_API_KEY
	if (!key || !config.voice.voice) return false
	const response = await fetch('https://api.fish.audio/v1/tts', {
		method: 'POST',
		headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', model: config.voice.model || 's1' },
		body: JSON.stringify({ text, reference_id: config.voice.voice, format: 'wav', prosody: { speed: config.voice.speed } }),
	})
	if (!response.ok) return false
	writeFileSync(wav, Buffer.from(await response.arrayBuffer()))
	return true
}

// Speeds the file up without changing the pitch, when ffmpeg is there. Returns true if done.
function speedUp(input, output, speed) {
	if (speed === 1 || !has('ffmpeg')) return false
	return run('ffmpeg', ['-loglevel', 'error', '-y', '-i', input, '-af', `atempo=${speed},loudnorm=I=-16:TP=-1.5:LRA=11`, output])
}

// --- Playback ---------------------------------------------------------------

function play(wav, rate) {
	const os = platform()
	if (os === 'darwin') return run('afplay', rate !== 1 ? ['-r', String(rate), '-q', '1', wav] : [wav])
	if (os === 'win32') {
		return run('powershell', ['-NoProfile', '-Command', `(New-Object Media.SoundPlayer '${wav.replaceAll("'", "''")}').PlaySync()`])
	}
	for (const [player, args] of [['paplay', [wav]], ['aplay', ['-q', wav]], ['ffplay', ['-nodisp', '-autoexit', '-loglevel', 'error', wav]]]) {
		if (has(player)) return run(player, args)
	}
	return false
}

function speakSystem(text, config) {
	const os = platform()
	const lang = baseLanguage(config.language) || 'en'
	const speed = config.voice.speed || 1
	if (os === 'darwin') {
		const rate = String(Math.round(180 * speed))
		const voice = SYSTEM_VOICES.darwin[lang]
		return (voice && run('say', ['-v', voice, '-r', rate, text])) || run('say', ['-r', rate, text])
	}
	if (os === 'win32') {
		const rate = Math.max(-10, Math.min(10, Math.round((speed - 1) * 10)))
		const script = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = ${rate}; $s.Speak([Console]::In.ReadToEnd())`
		return spawnSync('powershell', ['-NoProfile', '-Command', script], { input: text, stdio: ['pipe', 'ignore', 'ignore'] }).status === 0
	}
	if (has('spd-say')) return run('spd-say', ['-w', '-l', lang, '-r', String(Math.round((speed - 1) * 100)), text])
	if (has('espeak-ng')) return run('espeak-ng', ['-v', lang, '-s', String(Math.round(175 * speed)), text])
	return false
}

// --- The worker -------------------------------------------------------------

const pidFile = () => join(voiceDir(), 'pid')

export function stopSpeaking() {
	if (!existsSync(pidFile())) return
	const pid = Number(readFileSync(pidFile(), 'utf8'))
	try {
		if (isWindows()) spawnSync('taskkill', ['/T', '/F', '/PID', String(pid)], { stdio: 'ignore' })
		else process.kill(-pid)
	} catch {}
	try {
		unlinkSync(pidFile())
	} catch {}
}

function keepLast(dir, count) {
	const audio = readdirSync(dir).filter((name) => name.endsWith('.wav')).sort()
	for (const name of audio.slice(0, Math.max(0, audio.length - count))) rmSync(join(dir, name), { force: true })
}

// Runs in its own detached process so the hook returns at once.
export async function speak(text, config, { project = '' } = {}) {
	const history = join(voiceDir(), 'history')
	mkdirSync(history, { recursive: true })
	const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`
	const raw = join(history, `${id}.raw.wav`)
	const wav = join(history, `${id}.wav`)
	appendFileSync(join(history, 'index.jsonl'), `${JSON.stringify({ id, at: new Date().toISOString(), text, project, engine: config.voice.engine })}\n`)

	const engine = config.voice.engine
	// "off" is silence, never the system voice: tests use it, and so can anyone who wants the log only.
	if (engine === 'off') return 'silent'
	const speed = config.voice.speed || 1
	let isMade = false
	if (engine === 'phonon') isMade = synthPhonon(text, raw, config)
	if (engine === 'fish') isMade = await synthFish(text, raw, config).catch(() => false)

	if (isMade) {
		const isAlreadyFast = engine === 'fish'
		const isSped = !isAlreadyFast && speedUp(raw, wav, speed)
		if (!isSped) renameSync(raw, wav)
		else rmSync(raw, { force: true })
		const rate = isAlreadyFast || isSped || platform() !== 'darwin' ? 1 : speed
		if (play(wav, rate)) {
			keepLast(history, 50)
			return 'played'
		}
	}
	rmSync(raw, { force: true })
	return speakSystem(text, config) ? 'system' : 'silent'
}

export function startSpeaking(text, config, project, entry) {
	stopSpeaking()
	mkdirSync(voiceDir(), { recursive: true })
	const textFile = join(voiceDir(), 'next.txt')
	writeFileSync(textFile, text)
	const child = spawn(process.execPath, [entry, 'speak', '--file', textFile, '--project', project], {
		detached: true,
		stdio: 'ignore',
		windowsHide: true,
	})
	writeFileSync(pidFile(), String(child.pid))
	child.unref()
}

export function voiceReport(config) {
	const lines = []
	const os = `${platform()}-${arch()}`
	lines.push(`engine: ${config.voice.engine}${config.voice.isEnabled ? '' : ' (voice is off)'}`)
	if (config.voice.engine === 'phonon') {
		const choice = phononFor(config)
		lines.push(`phonon binary: ${existsSync(pttsPath()) ? pttsPath() : `missing, run: ccm voice install (${PTTS_ASSETS[os] ? 'available' : 'no build'} for ${os})`}`)
		lines.push(choice.reason ? `phonon model: ${choice.reason}` : `phonon model: ${choice.model.repo} (${choice.model.license}), voice ${choice.voice}`)
	}
	if (config.voice.engine === 'fish') lines.push(`fish: ${process.env.FISH_API_KEY ? 'FISH_API_KEY set' : 'FISH_API_KEY missing'}, voice ${config.voice.voice || 'missing'}`)
	lines.push(`speed-up without pitch change: ${has('ffmpeg') ? 'ffmpeg' : platform() === 'darwin' ? 'afplay -r' : 'none (install ffmpeg)'}`)
	const players = { darwin: ['afplay'], win32: ['powershell'], linux: ['paplay', 'aplay', 'ffplay'] }[platform()] || []
	lines.push(`player: ${players.find(has) || 'none found'}`)
	const systemVoice = { darwin: 'say', win32: 'powershell' }[platform()] || ['spd-say', 'espeak-ng'].find(has)
	lines.push(`system voice fallback: ${systemVoice && has(systemVoice) ? systemVoice : 'none found (install speech-dispatcher or espeak-ng)'}`)
	return lines
}
