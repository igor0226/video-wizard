import type { FormEvent } from "react";

import { Send } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type NotifyFormProps = {
	email: string;
	error: string | null;
	isSubmitted: boolean;
	onEmailChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function NotifyForm({
	email,
	error,
	isSubmitted,
	onEmailChange,
	onSubmit,
}: NotifyFormProps) {
	if (isSubmitted) {
		return (
			<p className="text-sm" aria-live="polite">
				You have been added to the early access cohort.
			</p>
		);
	}

	return (
		<form className="comingSoonForm" onSubmit={onSubmit}>
			<Input
				type="text"
				inputMode="email"
				value={email}
				onChange={(event) => onEmailChange(event.target.value)}
				placeholder="Enter your email for early access"
				aria-invalid={Boolean(error)}
			/>
			<Button type="submit">
				<Send className="mr-1.5 h-3.5 w-3.5" />
				Notify Me
			</Button>
			{error ? (
				<p className="w-full text-xs font-medium" aria-live="polite">
					{error}
				</p>
			) : null}
		</form>
	);
}
