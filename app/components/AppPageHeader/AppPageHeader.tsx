import { User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import "./AppPageHeader.css";

export type AppPageBreadcrumb = {
	label: string;
	href?: string;
};

type AppPageHeaderProps = {
	breadcrumbs: AppPageBreadcrumb[];
};

export function AppPageHeader({ breadcrumbs }: AppPageHeaderProps) {
	return (
		<header className="tasksPageHeader">
			<div className="tasksPageHeaderTop">
				<h1>Awesome video processing service</h1>
				<Avatar>
					<AvatarFallback>
						<User className="h-5 w-5" />
					</AvatarFallback>
				</Avatar>
			</div>
			<Breadcrumb className="tasksPageBreadcrumb">
				<BreadcrumbList>
					{breadcrumbs.map((crumb, index) => {
						const isLast = index === breadcrumbs.length - 1;
						const key = `${crumb.label}-${index}`;

						return <FragmentItem key={key} crumb={crumb} isLast={isLast} />;
					})}
				</BreadcrumbList>
			</Breadcrumb>
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
