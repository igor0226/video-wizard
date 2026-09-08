import type { LearningMetric } from "@/entities/practice";

import { Award, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/shared/ui/card";

type ActivityMetricCardProps = {
	metric: LearningMetric;
};

export function ActivityMetricCard({ metric }: ActivityMetricCardProps) {
	return (
		<article>
			<Card>
				<CardContent className="p-6">
					<div className="mb-2 flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-semibold uppercase tracking-wider">
							{metric.label}
						</span>
						<Award className="h-4 w-4" aria-hidden />
					</div>
					<div className="text-2xl font-bold tracking-tight">
						{metric.value}
					</div>
					<p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
						<TrendingUp className="h-3.5 w-3.5" aria-hidden />
						<span>{metric.delta}</span>
					</p>
				</CardContent>
			</Card>
		</article>
	);
}
