import type { AppPageBreadcrumb } from "./AppPageHeader";

import Link from "next/link";

import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";

type AppPageHeaderBreadcrumbItemProps = {
	crumb: AppPageBreadcrumb;
	isLast: boolean;
};

export function AppPageHeaderBreadcrumbItem({
	crumb,
	isLast,
}: AppPageHeaderBreadcrumbItemProps) {
	return (
		<>
			<BreadcrumbItem>
				{isLast || !crumb.href ? (
					<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
				) : (
					<BreadcrumbLink asChild>
						<Link href={crumb.href}>{crumb.label}</Link>
					</BreadcrumbLink>
				)}
			</BreadcrumbItem>
			{!isLast ? <BreadcrumbSeparator /> : null}
		</>
	);
}
