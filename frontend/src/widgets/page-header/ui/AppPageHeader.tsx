import Link from "next/link";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import "./AppPageHeader.css";

export type AppPageBreadcrumb = {
	label: string;
	href?: string;
};

type AppPageHeaderProps = {
	title: string;
	subtitle?: string;
	breadcrumbs: AppPageBreadcrumb[];
	actions?: React.ReactNode;
};

export function AppPageHeader({
	title,
	subtitle,
	breadcrumbs,
	actions,
}: AppPageHeaderProps) {
	return (
		<header className="tasksPageHeader">
			<nav aria-label="Breadcrumb">
				<Breadcrumb className="tasksPageBreadcrumb">
					<BreadcrumbList>
						{breadcrumbs.map((crumb, index) => {
							const isLast = index === breadcrumbs.length - 1;
							const key = `${crumb.label}-${index}`;
							return <FragmentItem key={key} crumb={crumb} isLast={isLast} />;
						})}
					</BreadcrumbList>
				</Breadcrumb>
			</nav>
			<div className="tasksPageHeaderTop">
				<div>
					<h1>{title}</h1>
					{subtitle ? <p className="tasksPageSubtitle">{subtitle}</p> : null}
				</div>
				{actions}
			</div>
		</header>
	);
}

function FragmentItem({
	crumb,
	isLast,
}: {
	crumb: AppPageBreadcrumb;
	isLast: boolean;
}) {
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
