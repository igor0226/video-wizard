import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";
import OpenAI from "openai";

import { BlobStorageService } from "../../storage";
import { probeAudioDurationSeconds } from "../shared/ffmpeg-probe";
import { getListenAgainPhrase, normalizeExplanationLanguage } from "./listen-again";

const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "coral";
const SENTENCE_END_PATTERN = /[.!?]$/;

export type SynthesizeSpeechInput = {
	phrase: string;
	explanation: string;
	explanationLanguage: string;
	outputRelativePath: string;
};

export function buildExplanationSpeechText(input: {
	phrase: string;
	explanation: string;
}): string {
	const phrase = input.phrase.trim();
	const explanation = input.explanation.trim();

	if (!phrase) {
		return explanation;
	}

	if (!explanation) {
		return phrase;
	}

	const separator = SENTENCE_END_PATTERN.test(phrase) ? " " : ". ";
	return `${phrase}${separator}${explanation}`;
}

@Injectable()
export class ExplanationTtsService {
	private openaiClient: OpenAI | null = null;

	constructor(
		@InjectPinoLogger(ExplanationTtsService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
	) {}

	async synthesizeSpeech(
		input: SynthesizeSpeechInput,
	): Promise<{ durationSeconds: number }> {
		const apiKey = process.env.OPENAI_API_KEY?.trim();
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is required for explanation TTS");
		}

		const client = this.getOpenAiClient(apiKey);
		this.logger.info(
			{ output: input.outputRelativePath },
			"explanation-tts-start",
		);

		const response = await client.audio.speech.create({
			model: TTS_MODEL,
			voice: TTS_VOICE,
			input: buildExplanationSpeechText({
				phrase: input.phrase,
				explanation: input.explanation,
			}),
			instructions: `Speak clearly as a language teacher in ${input.explanationLanguage}. Keep a calm, helpful tone.`,
		});

		const buffer = Buffer.from(await response.arrayBuffer());
		await this.blobStorage.writeUploadFile(input.outputRelativePath, buffer);

		const outputAbsolutePath = this.blobStorage.resolveRelativePath(
			input.outputRelativePath,
		);
		const durationSeconds =
			await probeAudioDurationSeconds(outputAbsolutePath);
		this.logger.info(
			{ output: input.outputRelativePath, durationSeconds },
			"explanation-tts-success",
		);

		return { durationSeconds };
	}

	async resolveClosingAudio(
		explanationLanguage: string,
	): Promise<{ absolutePath: string; durationSeconds: number }> {
		const normalizedLanguage =
			normalizeExplanationLanguage(explanationLanguage);
		const assetRelativePath =
			this.blobStorage.getListenAgainAssetRelativePath(normalizedLanguage);
		const assetAbsolutePath =
			this.blobStorage.resolveRelativePath(assetRelativePath);

		if (!(await this.blobStorage.fileExists(assetRelativePath))) {
			this.logger.info(
				{ language: normalizedLanguage, output: assetRelativePath },
				"explanation-tts-closing-cache-miss",
			);
			await this.synthesizeSpeech({
				phrase: "",
				explanation: getListenAgainPhrase(explanationLanguage),
				explanationLanguage,
				outputRelativePath: assetRelativePath,
			});
		} else {
			this.logger.info(
				{ language: normalizedLanguage, output: assetRelativePath },
				"explanation-tts-closing-cache-hit",
			);
		}

		const durationSeconds = await probeAudioDurationSeconds(assetAbsolutePath);
		return { absolutePath: assetAbsolutePath, durationSeconds };
	}

	private getOpenAiClient(apiKey: string): OpenAI {
		if (!this.openaiClient) {
			this.openaiClient = new OpenAI({ apiKey });
		}
		return this.openaiClient;
	}
}

export function formatClipIndex(index: number): string {
	return String(index).padStart(3, "0");
}

export function getClipSpeechAudioRelativePath(
	videoId: string,
	index: number,
): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.speech.mp3`,
	);
}

export function getClipAudioRelativePath(
	videoId: string,
	index: number,
): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.mp3`,
	);
}

export function getClipVideoRelativePath(
	videoId: string,
	index: number,
): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.mp4`,
	);
}

export function getClipAssRelativePath(videoId: string, index: number): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.ass`,
	);
}
