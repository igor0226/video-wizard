export function createDebouncedRunner(delayMs: number): {
	schedule: (task: () => void | Promise<void>) => void;
	cancel: () => void;
} {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const schedule = (task: () => void | Promise<void>): void => {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			timer = undefined;
			void task();
		}, delayMs);
	};
	const cancel = (): void => {
		if (timer) {
			clearTimeout(timer);
			timer = undefined;
		}
	};
	return { schedule, cancel };
}
