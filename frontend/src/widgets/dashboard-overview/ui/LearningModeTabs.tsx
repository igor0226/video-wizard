"use client";

import type { LearningMode } from "@/entities/practice";

import { BookOpen, Headphones, Mic } from "lucide-react";
import { useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const MODES: Array<{
	id: LearningMode;
	label: string;
	count: string;
	icon: typeof Headphones;
}> = [
	{ id: "listening", label: "Listening", count: "14 tasks", icon: Headphones },
	{ id: "speaking", label: "Speaking", count: "3 sessions", icon: Mic },
	{ id: "writing", label: "Writing", count: "Coming soon", icon: BookOpen },
];

type LearningModeTabsProps = {
	activeMode: LearningMode;
};

export function LearningModeTabs({ activeMode }: LearningModeTabsProps) {
	const router = useRouter();

	return (
		<Tabs
			value={activeMode}
			onValueChange={(value) => {
				if (value === "writing") {
					router.push("/writing");
					return;
				}
				router.push(`/dashboard?mode=${value}`);
			}}
			className="dashboardTabs"
		>
			<TabsList className="dashboardTabsList" aria-label="Learning mode">
				{MODES.map((mode) => {
					const Icon = mode.icon;
					return (
						<TabsTrigger
							key={mode.id}
							value={mode.id}
							className="dashboardTab"
							id={`tab-${mode.id}`}
							aria-controls={`panel-${mode.id}`}
						>
							<Icon className="mr-2 h-4 w-4 text-muted-foreground" />
							{mode.label}
							<span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
								{mode.count}
							</span>
						</TabsTrigger>
					);
				})}
			</TabsList>
		</Tabs>
	);
}
