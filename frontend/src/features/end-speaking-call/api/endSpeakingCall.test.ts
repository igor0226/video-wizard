import { endSpeakingCall } from "./endSpeakingCall";

describe("endSpeakingCall", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("posts the end-call request", async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
		vi.stubGlobal("fetch", fetchMock);

		await endSpeakingCall({ callId: "call-1", userId: "user-1" });

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:3001/api/speaking/calls/call-1/end",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ userId: "user-1" }),
			}),
		);
	});

	it("throws when the response is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 409 }),
		);

		await expect(
			endSpeakingCall({ callId: "call-1", userId: "user-1" }),
		).rejects.toThrow("Failed to end call (409)");
	});
});
