import { Breadcrumb, BreadcrumbList } from "@/shared/ui/breadcrumb";
import { AppPageHeaderBreadcrumbItem } from "./AppPageHeaderBreadcrumbItem";
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
							return (
								<AppPageHeaderBreadcrumbItem
									key={key}
									crumb={crumb}
									isLast={isLast}
								/>
							);
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
