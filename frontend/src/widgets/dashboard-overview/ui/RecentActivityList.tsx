"use client";

import type { RecentActivity } from "@/entities/practice";

import { ArrowUpRight, ChevronRight, Headphones, Mic } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";

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

function activityHref(item: RecentActivity): string {
	if (item.mode === "speaking") {
		return "/speaking";
	}
	return `/listening/${item.taskId}`;
}

function ActivityRow({ item }: { item: RecentActivity }) {
	return (
		<>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
					{item.mode === "listening" ? (
						<Headphones className="h-4 w-4" />
					) : (
						<Mic className="h-4 w-4" />
					)}
				</div>
				<div>
					<div className="text-sm font-medium">{item.title}</div>
					<div className="mt-0.5 font-mono text-xs text-muted-foreground">
						{item.taskId} · {item.date} · {item.duration}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<Badge variant="secondary">{item.status}</Badge>
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</>
	);
}
