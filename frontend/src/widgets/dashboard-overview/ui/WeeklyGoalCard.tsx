import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

export function WeeklyGoalCard() {
	return (
		<Card className="lg:col-span-5">
			<CardContent className="flex h-full flex-col justify-between p-6">
				<div>
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Weekly Target
						</span>
						<span className="font-mono text-xs text-muted-foreground">
							Week 34 · 2026
						</span>
					</div>
					<h3 className="text-lg font-bold">5.0 Hours Listening Target</h3>
					<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
						Consistently training your auditory recognition at B2 level builds
						rapid conversational reflex.
					</p>
					<div className="mt-6 space-y-2">
						<div className="flex justify-between font-mono text-xs">
							<span>3.8 / 5.0 hrs completed</span>
							<span className="text-muted-foreground">76%</span>
						</div>
						<Progress value={76} />
					</div>
					<div className="mt-6 space-y-2 rounded-lg border border-border bg-muted p-3">
						<div className="flex items-center gap-1.5 text-xs font-medium">
							<CheckCircle2 className="h-3.5 w-3.5" />
							Next Milestone: 1 hr 12 mins to reach weekly goal
						</div>
						<p className="text-[11px] text-muted-foreground">
							Recommended task: "Test with parallel" (7:51 duration) contains 18
							B2 idioms.
						</p>
					</div>
				</div>
				<Button asChild className="mt-6 w-full">
					<Link href="/listening/upload">Practice Now</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
