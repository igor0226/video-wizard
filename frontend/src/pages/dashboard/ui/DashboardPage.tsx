"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import {
	DASHBOARD_METRICS,
	HEATMAP_ENTRIES,
	parseLearningMode,
	RECENT_ACTIVITIES,
} from "@/entities/practice";
import { Button } from "@/shared/ui/button";
import {
	ActivityHeatmap,
	ActivityMetricCard,
	LearningModeTabs,
	RecentActivityList,
	WeeklyGoalCard,
} from "@/widgets/dashboard-overview";
import { AppPageHeader } from "@/widgets/page-header";

function DashboardContent() {
	const searchParams = useSearchParams();
	const activeMode = parseLearningMode(searchParams?.get("mode") ?? null);

	return (
		<main className="dashboardPage">
			<AppPageHeader
				title="Dashboard"
				subtitle="Review your performance metrics and activity history"
				breadcrumbs={[
					{ label: "Home", href: "/dashboard" },
					{ label: "Dashboard" },
				]}
				actions={
					<div className="flex items-center gap-3">
						<Button asChild>
							<Link href="/listening/upload">+ Add Video Task</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/speaking">Start AI Call</Link>
						</Button>
					</div>
				}
			/>
			<LearningModeTabs activeMode={activeMode} />
			<div id={`panel-${activeMode}`} role="tabpanel">
				<ActivityHeatmap entries={HEATMAP_ENTRIES} streakDays={12} />
			</div>
			<div className="dashboardMetrics">
				{DASHBOARD_METRICS.map((metric) => (
					<ActivityMetricCard key={metric.id} metric={metric} />
				))}
			</div>
			<div className="dashboardSplit">
				<RecentActivityList items={RECENT_ACTIVITIES} />
				<WeeklyGoalCard />
			</div>
		</main>
	);
}

export default function DashboardPage() {
	return (
		<Suspense>
			<DashboardContent />
		</Suspense>
	);
}
