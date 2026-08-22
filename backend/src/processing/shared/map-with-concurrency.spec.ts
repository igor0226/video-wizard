import { describe, expect, it, vi } from "vitest";

import { mapWithConcurrency } from "./map-with-concurrency";

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

describe("mapWithConcurrency", () => {
	it("returns an empty array for empty input", async () => {
		const mapper = vi.fn(async () => "value");

		await expect(
			mapWithConcurrency({ items: [], concurrency: 3, mapper }),
		).resolves.toEqual([]);
		expect(mapper).not.toHaveBeenCalled();
	});

	it("preserves result order when tasks finish out of order", async () => {
		const items = ["slow", "fast", "medium"];

		const results = await mapWithConcurrency({
			items,
			concurrency: 2,
			mapper: async (item) => {
				if (item === "slow") {
					await delay(30);
				} else if (item === "medium") {
					await delay(15);
				}

				return item.toUpperCase();
			},
		});

		expect(results).toEqual(["SLOW", "FAST", "MEDIUM"]);
	});

	it("limits active workers to the configured concurrency", async () => {
		let activeWorkers = 0;
		let maxActiveWorkers = 0;

		await mapWithConcurrency({
			items: [1, 2, 3, 4, 5],
			concurrency: 2,
			mapper: async (value) => {
				activeWorkers += 1;
				maxActiveWorkers = Math.max(maxActiveWorkers, activeWorkers);
				await delay(20);
				activeWorkers -= 1;
				return value * 2;
			},
		});

		expect(maxActiveWorkers).toBeLessThanOrEqual(2);
	});

	it("rejects when any mapped task fails", async () => {
		await expect(
			mapWithConcurrency({
				items: [1, 2, 3],
				concurrency: 2,
				mapper: async (value) => {
					if (value === 2) {
						throw new Error("boom");
					}
					return value;
				},
			}),
		).rejects.toThrow("boom");
	});
});
