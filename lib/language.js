// Tells which language a reply is written in, from its most common short words.
// Code, paths, links and the spoken-summary comment are left out before counting.

export const LANGUAGE_NAMES = {
	en: 'English',
	pt: 'Brazilian Portuguese',
	es: 'Spanish',
	fr: 'French',
	de: 'German',
}

const STOPWORDS = {
	en: 'the and is are was were of to with that this for you your it be have has will would can should not but from which what when there they their been into than then only also just',
	pt: 'de que o a os as e um uma do da dos das em no na nos nas para com por se mais mas como foi ser seu sua isso esse essa este esta ao pelo pela não você está são',
	es: 'el la los las de que y en un una por con para es se del al lo como más pero sus le ya o este sí porque esta entre cuando muy sin sobre también usted está son',
	fr: 'le la les de des du et en un une est que qui dans pour pas sur au avec ce il elle ne se plus par vous nous sont cette mais ou comme été',
	de: 'der die das und ist nicht ein eine zu den mit von sich des auf für im dem auch es an als wie bei aus oder sind wird nach noch dass sie wir',
}
const SETS = Object.fromEntries(Object.entries(STOPWORDS).map(([code, words]) => [code, new Set(words.split(' '))]))

export const baseLanguage = (tag) => (tag || '').toLowerCase().split(/[-_]/)[0]

export function cleanReply(text) {
	return text
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\S+[\\/]\S+/g, ' ')
}

export function detectLanguage(text) {
	const words = cleanReply(text).toLowerCase().match(/\p{L}+/gu) || []
	const scores = Object.fromEntries(Object.keys(SETS).map((code) => [code, 0]))
	for (const word of words) for (const code of Object.keys(SETS)) if (SETS[code].has(word)) scores[code]++
	return { words: words.length, scores }
}

// True when the reply is clearly in another supported language than the one asked for.
export function isWrongLanguage(text, tag) {
	const wanted = baseLanguage(tag)
	if (!SETS[wanted]) return false
	const { words, scores } = detectLanguage(text)
	if (words < 25) return false
	const [top, topScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
	return top !== wanted && topScore >= 8 && topScore > 2 * scores[wanted]
}
