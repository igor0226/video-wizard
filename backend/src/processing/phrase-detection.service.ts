import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { BlobStorageService, type VideoRecord } from "../storage";
import type { WhisperTranscript } from "./merge-transcripts";

const PHRASE_MODEL = "gpt-5.6-luna";

const PhraseSchema = z.object({
	phrases: z.array(
		z.object({
			phrase: z.string(),
			startWordIndex: z.number(),
			endWordIndex: z.number(),
			explanation: z.string(),
			difficulty: z.enum(["easy", "medium", "hard"]),
		}),
	),
});

export type DetectedPhrase = z.infer<typeof PhraseSchema>["phrases"][number];

export type PhraseDetectionResult = {
	phrasesRelativePath: string;
};

export type DetectPhrasesInput = {
	video: VideoRecord;
	transcriptRelativePath: string;
};

const SYSTEM_PROMPT = `You are helping build a language-learning video tool.

Your task is to analyze a transcript and identify phrases that would be challenging for a learner at the given CEFR level. Look for:
- Tricky idioms, collocations, and fixed expressions
- Grammatically difficult constructions
- Words or phrases whose meaning is hard to guess from surrounding context

Skip items that are obvious or easy for the learner's level. For each flagged phrase, write a brief explanation in the requested explanation language that helps the learner understand meaning and usage.

Return word indexes (0-based, inclusive) that refer to the numbered word list provided. Only include phrases that appear in the transcript.`;

@Injectable()
export class PhraseDetectionService {
	private openaiClient: OpenAI | null = null;

	constructor(
		@InjectPinoLogger(PhraseDetectionService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
	) {}

	async detectPhrases(
		input: DetectPhrasesInput,
	): Promise<PhraseDetectionResult> {
		const { video, transcriptRelativePath } = input;
		const apiKey = process.env.OPENAI_API_KEY?.trim();
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is required for phrase detection");
		}

		const transcript = await this.readTranscript(transcriptRelativePath);
		const words = transcript.words ?? [];
		const numberedWords = words
			.map((word, index) => `${index}: ${word.word}`)
			.join("\n");

		this.logger.info(
			{ videoId: video.id, wordCount: words.length },
			"phrase-detection-start",
		);

		const client = this.getOpenAiClient(apiKey);
		const response = await client.responses.parse({
			model: PHRASE_MODEL,
			input: [
				{ role: "system", content: SYSTEM_PROMPT },
				{
					role: "user",
					content: [
						`Source language: ${video.sourceLanguage}`,
						`Explanation language: ${video.explanationLanguage}`,
						`Learner CEFR level: ${video.languageLevel}`,
						"",
						"Full transcript:",
						transcript.text,
						"",
						"Numbered words (use these indexes for startWordIndex/endWordIndex):",
						numberedWords,
					].join("\n"),
				},
			],
			text: {
				format: zodTextFormat(PhraseSchema, "phrase_detection"),
			},
		});

		const parsed = this.extractParsedPhrases(response);
		const filtered = this.filterValidPhrases({
			phrases: parsed.phrases,
			wordCount: words.length,
		});

		const phrasesRelativePath = this.blobStorage.getPhrasesRelativePath(
			video.id,
		);
		await this.blobStorage.writeJson(phrasesRelativePath, {
			phrases: filtered,
		});

		this.logger.info(
			{ videoId: video.id, phraseCount: filtered.length },
			"phrase-detection-success",
		);

		return { phrasesRelativePath };
	}

	private getOpenAiClient(apiKey: string): OpenAI {
		if (!this.openaiClient) {
			this.openaiClient = new OpenAI({ apiKey });
		}
		return this.openaiClient;
	}

	private async readTranscript(
		transcriptRelativePath: string,
	): Promise<WhisperTranscript> {
		const content = await this.blobStorage.readText(transcriptRelativePath);
		return JSON.parse(content) as WhisperTranscript;
	}

	private extractParsedPhrases(
		response: Awaited<ReturnType<OpenAI["responses"]["parse"]>>,
	): z.infer<typeof PhraseSchema> {
		for (const output of response.output) {
			if (output.type !== "message") {
				continue;
			}
			for (const item of output.content) {
				if (item.type === "refusal") {
					throw new Error(`Phrase detection refused: ${item.refusal}`);
				}
				if (item.parsed) {
					return item.parsed as z.infer<typeof PhraseSchema>;
				}
			}
		}
		throw new Error("Could not parse phrase detection response");
	}

	private filterValidPhrases(input: {
		phrases: DetectedPhrase[];
		wordCount: number;
	}): DetectedPhrase[] {
		const { phrases, wordCount } = input;
		return phrases.filter((entry) => {
			if (entry.startWordIndex < 0 || entry.endWordIndex >= wordCount) {
				return false;
			}
			return entry.startWordIndex <= entry.endWordIndex;
		});
	}
}
