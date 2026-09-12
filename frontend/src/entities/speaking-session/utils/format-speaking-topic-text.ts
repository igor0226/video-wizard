import type { CallTopic } from "../model/types";

export function formatSpeakingTopicText(
	topic: Pick<CallTopic, "title" | "description">,
): string {
	return `${topic.title}. ${topic.description}`;
}
