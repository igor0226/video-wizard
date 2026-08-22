export async function mapWithConcurrency<TItem, TResult>(input: {
	items: readonly TItem[];
	concurrency: number;
	mapper: (item: TItem, index: number) => Promise<TResult>;
}): Promise<TResult[]> {
	const { items, mapper } = input;
	const concurrency = Math.max(1, Math.floor(input.concurrency));

	if (items.length === 0) {
		return [];
	}

	const results = Array.from<TResult>({ length: items.length });
	let nextIndex = 0;

	async function runWorker(): Promise<void> {
		while (true) {
			const currentIndex = nextIndex;
			nextIndex += 1;

			if (currentIndex >= items.length) {
				return;
			}

			results[currentIndex] = await mapper(items[currentIndex], currentIndex);
		}
	}

	const workerCount = Math.min(concurrency, items.length);
	await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

	return results;
}
