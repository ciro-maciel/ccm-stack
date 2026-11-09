#!/usr/bin/env node
// Compares lib/line-facts.json with each line's live llms.txt: every price and plan size the
// facts state must still be written there. Run before a release: node scripts/check-facts.js

import { FACTS, USER_AGENT } from '../lib/line.js'

const numbers = (text) => [...text.matchAll(/R\$ ?\d+(?:\.\d{3})*,\d{2}/g)].map((match) => match[0].replace('R$ ', 'R$ ').replace(/R\$(\d)/, 'R$ $1'))
let failed = 0
for (const [name, line] of Object.entries(FACTS.lines)) {
	const response = await fetch(line.source, { headers: { 'user-agent': USER_AGENT } })
	if (!response.ok) {
		console.error(`${name}: ${line.source} answered ${response.status}`)
		failed++
		continue
	}
	const live = (await response.text()).replace(/\s+/g, ' ')
	const stated = [FACTS.common.plans, line.counted, ...Object.values(line.products)].join(' ')
	const missing = [...new Set(numbers(stated))].filter((price) => !live.includes(price))
	if (missing.length) {
		console.error(`${name}: not in the live llms.txt: ${missing.join(', ')}`)
		failed++
	} else console.log(`${name}: every price is in the live llms.txt`)
}
process.exit(failed ? 1 : 0)
