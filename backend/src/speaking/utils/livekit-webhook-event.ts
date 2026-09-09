export enum LivekitWebhookEventType {
	RoomFinished = "room_finished",
	ParticipantLeft = "participant_left",
}

export type LivekitWebhookEvent = {
	event?: LivekitWebhookEventType | string;
	room?: { name?: string };
	participant?: { identity?: string };
};
