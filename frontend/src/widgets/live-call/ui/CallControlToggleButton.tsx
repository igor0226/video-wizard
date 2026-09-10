import { Button } from "@/shared/ui/button";

type CallControlToggleButtonProps = {
	label: string;
	pressed: boolean;
	onClick: () => void;
	children: React.ReactNode;
};

export function CallControlToggleButton({
	label,
	pressed,
	onClick,
	children,
}: CallControlToggleButtonProps) {
	return (
		<Button
			type="button"
			size="icon"
			variant={pressed ? "secondary" : "ghost"}
			aria-label={label}
			aria-pressed={pressed}
			onClick={onClick}
		>
			{children}
		</Button>
	);
}
