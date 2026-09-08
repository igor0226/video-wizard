"use client";

import { Check, PenTool, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import "./ComingSoonPanel.css";

const FEATURES = [
	"Context-aware grammar & syntax explanations",
	"CEFR B1-C2 vocabulary upgrade recommendations",
	"Automated coherence, cohesion, and rubric scoring",
	"Direct integration with Listening vocabulary notebooks",
];

export function ComingSoonPanel() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setError("Please enter a valid email address");
			return;
		}
		setError(null);
		setIsSubmitted(true);
	};

	return (
		<Card>
			<CardContent className="comingSoonCard">
				<Badge variant="secondary" className="gap-2">
					<PenTool className="h-3.5 w-3.5" />
					Under Active Development
				</Badge>
				<h2 className="text-2xl font-bold tracking-tight">
					AI Writing Lab is coming soon
				</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					We are refining our AI-guided writing workbench to provide real-time
					essay analysis, CEFR vocabulary suggestions, and idiom corrections
					tailored to your level.
				</p>
				<ul className="comingSoonFeatures">
					{FEATURES.map((feature) => (
						<li key={feature} className="flex gap-2 text-sm">
							<Check className="mt-0.5 h-4 w-4 shrink-0" />
							{feature}
						</li>
					))}
				</ul>
				<NotifyForm
					email={email}
					error={error}
					isSubmitted={isSubmitted}
					onEmailChange={setEmail}
					onSubmit={handleSubmit}
				/>
				<Button asChild variant="link">
					<Link href="/listening">Return to Listening</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

function NotifyForm({
	email,
	error,
	isSubmitted,
	onEmailChange,
	onSubmit,
}: {
	email: string;
	error: string | null;
	isSubmitted: boolean;
	onEmailChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
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
