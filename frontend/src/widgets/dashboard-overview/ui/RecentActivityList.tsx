"use client";

import type { RecentActivity } from "@/entities/practice";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/shared/ui/card";
import { activityHref } from "../utils/activity-href";
import { ActivityRow } from "./ActivityRow";

type RecentActivityListProps = {
	items: RecentActivity[];
};

export function RecentActivityList({ items }: RecentActivityListProps) {
	const router = useRouter();

	return (
		<Card className="lg:col-span-7">
			<CardContent className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h2 className="text-base font-semibold">
							Recent Practice Activity
						</h2>
						<p className="text-xs text-muted-foreground">
							Latest completed video analyses and speaking conversations
						</p>
					</div>
					<Link
						href="/listening"
						className="flex items-center gap-1 text-xs font-semibold hover:underline"
					>
						View All Library
						<ArrowUpRight className="h-3.5 w-3.5" />
					</Link>
				</div>
				<div className="divide-y divide-border">
					{items.map((item) => (
						<button
							key={item.id}
							type="button"
							className="activityRow w-full text-left"
							onClick={() => router.push(activityHref(item))}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									router.push(activityHref(item));
								}
							}}
						>
							<ActivityRow item={item} />
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
