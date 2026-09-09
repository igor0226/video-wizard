export type AgentDispatchInfo = {
	id: string;
};

export type CreateRoomInput = {
	name: string;
	emptyTimeout: number;
};

export type CreateDispatchInput = {
	roomName: string;
	agentName: string;
	metadata: string;
};

export type ParticipantTokenInput = {
	identity: string;
	roomName: string;
};
