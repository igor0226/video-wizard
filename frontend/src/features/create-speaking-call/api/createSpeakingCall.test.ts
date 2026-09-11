import { createSpeakingCall } from "./createSpeakingCall";

describe("createSpeakingCall", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("posts the request and returns call credentials", async () => {
		const payload = {
			callId: "call-1",
			roomName: "teacher-call-1",
			token: "jwt",
			livekitUrl: "ws://localhost:7880",
		};
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(payload),
			}),
		);

		await expect(
			createSpeakingCall({
				userId: "user-1",
				sourceLanguage: "English",
				languageLevel: "B2",
				explanationLanguage: "English",
			}),
		).resolves.toEqual(payload);
	});

	it("throws when the response is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
			}),
		);

		await expect(
			createSpeakingCall({
				userId: "user-1",
				sourceLanguage: "English",
				languageLevel: "B2",
			}),
		).rejects.toThrow("Failed to create call (400)");
	});
});
