const LISTEN_AGAIN_BY_LANGUAGE: Record<string, string> = {
	english: "Let's listen once again!",
	spanish: "¡Escuchemos una vez más!",
	french: "Écoutons encore une fois !",
	german: "Hören wir noch einmal zu!",
	italian: "Ascoltiamo ancora una volta!",
	portuguese: "Vamos ouvir mais uma vez!",
	russian: "Давайте послушаем ещё раз!",
	chinese: "让我们再听一遍！",
	japanese: "もう一度聞いてみましょう！",
	korean: "다시 한번 들어봅시다!",
	arabic: "لنستمع مرة أخرى!",
	dutch: "Laten we nog een keer luisteren!",
	polish: "Posłuchajmy jeszcze raz!",
	turkish: "Bir kez daha dinleyelim!",
	ukrainian: "Давайте послухаємо ще раз!",
};

const LANGUAGE_ALIASES: Record<string, string> = {
	en: "english",
	es: "spanish",
	fr: "french",
	de: "german",
	it: "italian",
	pt: "portuguese",
	ru: "russian",
	zh: "chinese",
	ja: "japanese",
	ko: "korean",
	ar: "arabic",
	nl: "dutch",
	pl: "polish",
	tr: "turkish",
	uk: "ukrainian",
};

export function normalizeExplanationLanguage(language: string): string {
	return language.trim().toLowerCase();
}

export function getListenAgainPhrase(explanationLanguage: string): string {
	const normalized = normalizeExplanationLanguage(explanationLanguage);
	const resolved = LANGUAGE_ALIASES[normalized] ?? normalized;
	return LISTEN_AGAIN_BY_LANGUAGE[resolved] ?? LISTEN_AGAIN_BY_LANGUAGE.english;
}
