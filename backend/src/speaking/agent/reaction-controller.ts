import type { EmotionPublisher } from "./emotion";
import { publishEmotion } from "./emotion";
import { createDebouncedRunner } from "./debounce";
import { ReactionClassifier } from "./reaction-classifier";

export type TranscriptEvent = {
	transcript: string;
	isFinal: boolean;
};

export class ReactionController {
	private readonly classifier = new ReactionClassifier();
	private readonly debounce: ReturnType<typeof createDebouncedRunner>;
	private latestTranscript = "";
	private started = false;

	constructor(
		private readonly publisher: EmotionPublisher,
		delayMs = Number(process.env.SPEAKING_REACTION_DEBOUNCE_MS ?? 800),
	) {
		this.debounce = createDebouncedRunner(delayMs);
	}

	async onUserStartedSpeaking(): Promise<void> {
		if (this.started) {
			return;
		}
		this.started = true;
		await publishEmotion({
			publisher: this.publisher,
			message: { emotion: "thoughtful", source: "reaction" },
		});
	}

	onTranscript(event: TranscriptEvent): void {
		this.latestTranscript = event.transcript;
		if (event.isFinal) {
			this.debounce.cancel();
			void this.publishClassification();
			return;
		}
		this.debounce.schedule(() => this.publishClassification());
	}

	onUserStoppedSpeaking(): void {
		this.started = false;
		this.debounce.cancel();
	}

	private async publishClassification(): Promise<void> {
		const classified = await this.classifier.classify(this.latestTranscript);
		await publishEmotion({
			publisher: this.publisher,
			message: {
				emotion: classified.emotion,
				intensity: classified.intensity,
				source: "reaction",
			},
		});
	}
}
