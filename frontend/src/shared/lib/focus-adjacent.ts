export function focusAdjacentButton(
	current: HTMLButtonElement,
	direction: "next" | "previous",
): void {
	const buttons = [
		...(current.parentElement?.querySelectorAll("button") ?? []),
	];
	const index = buttons.indexOf(current);
	const nextIndex =
		direction === "next"
			? Math.min(buttons.length - 1, index + 1)
			: Math.max(0, index - 1);
	buttons[nextIndex]?.focus();
}
