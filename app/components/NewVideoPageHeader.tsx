import { User } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";

export function NewVideoPageHeader() {
	return (
		<header className="newVideoPageHeader">
			<div className="newVideoPageHeaderTop">
				<h1>Awesome video processing service</h1>
				<Avatar>
					<AvatarFallback>
						<User className="h-5 w-5" />
					</AvatarFallback>
				</Avatar>
			</div>
			<Breadcrumb className="newVideoBreadcrumb">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/">Tasks</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>New video</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		</header>
	);
}
