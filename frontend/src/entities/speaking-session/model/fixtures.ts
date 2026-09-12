import type {
	CallTopic,
	ConnectionStep,
	SavedPhrase,
	TranscriptSegment,
} from "./types";

export const SPEAKING_TOPICS: CallTopic[] = [
	{
		id: "topic-1",
		title: "Job Interview: Technical & Product Communication",
		level: "B2-C1",
		description:
			"Practice answering complex behavioral and technical architecture questions in a professional setting.",
		suggestedDurationMins: 15,
		tags: ["Professional", "Tech", "Fluency"],
	},
	{
		id: "topic-2",
		title: "A simple conversation about life, work, and hobbies",
		level: "B1-B2",
		description: "Have a simple conversation about life, work, and hobbies.",
		suggestedDurationMins: 10,
		tags: ["Everyday", "Life"],
	},
	{
		id: "topic-3",
		title: "Academic Debate: Technological Automation & Ethics",
		level: "C1-C2",
		description:
			"Formulate coherent argumentative theses and defend viewpoints with sophisticated transitions.",
		suggestedDurationMins: 20,
		tags: ["Academic", "Debate"],
	},
];

export const CONNECTION_STEPS: Array<{
	id: ConnectionStep;
	label: string;
}> = [
	{ id: "permissions", label: "Verifying microphone & audio devices..." },
	{
		id: "ice_negotiation",
		label: "Connecting to AI Teacher conversational server...",
	},
	{ id: "model_warmup", label: "Preparing B2 CEFR vocabulary context..." },
	{ id: "ready", label: "Connection established. Launching session..." },
];

export const CONNECTION_ERRORS = {
	mic_denied:
		"Microphone access was denied. Please allow microphone permissions in your browser to continue.",
	network_timeout:
		"Unable to connect to speaking server after 15 seconds. Please check your internet connection.",
} as const;

export const TRANSCRIPT_FIXTURE: TranscriptSegment[] = [
	{
		id: "seg-1",
		speaker: "teacher",
		speakerName: "Elena",
		text: "Hello! Welcome back to our technical discussion session. Today we are exploring systems architecture and trade-off rationalization.",
		timestamp: "00:04",
		highlightedTerms: ["systems architecture", "trade-off"],
	},
	{
		id: "seg-2",
		speaker: "user",
		speakerName: "You",
		text: "Thank you Elena. I'm excited to practice explaining asynchronous messaging architectures.",
		timestamp: "00:18",
	},
	{
		id: "seg-3",
		speaker: "teacher",
		speakerName: "Elena",
		text: "Splendid! Could you describe how you managed consistency versus latency in your most recent cloud pipeline?",
		timestamp: "00:32",
		highlightedTerms: ["consistency", "latency"],
	},
];

export const SAVED_PHRASES: SavedPhrase[] = [
	{
		id: "v-1",
		term: "Trade-off",
		phonetic: "/ˈtreɪd.ɒf/",
		cefr: "B2",
		definition:
			"A balance achieved between two desirable but incompatible features; a compromise.",
		savedAt: "14:25",
	},
	{
		id: "v-2",
		term: "Latency",
		phonetic: "/ˈleɪ.tən.si/",
		cefr: "C1",
		definition:
			"The delay before a transfer of data begins following an instruction for its transfer.",
		savedAt: "14:26",
	},
];
