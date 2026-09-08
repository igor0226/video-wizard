"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { AppNavLinks } from "./AppNavLinks";
import "./AppShell.css";

type AppShellProps = {
	children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
	const pathname = usePathname() ?? "";
	const isImmersive = pathname.startsWith("/speaking/call/");

	if (isImmersive) {
		return <div className="callPage">{children}</div>;
	}

	return (
		<div className="studioPage appShell">
			<header className="appShellHeader">
				<div className="appShellHeaderInner">
					<div className="flex items-center gap-8">
						<Link href="/dashboard" className="appShellBrand">
							<span className="appShellMark">LS</span>
							<span className="appShellBrandText">
								<span className="appShellBrandName">Language Studio</span>
								<span className="appShellBrandMeta">v2.4 · B2 Fluency</span>
							</span>
						</Link>
						<AppNavLinks pathname={pathname} className="appShellNav" />
					</div>
					<Avatar>
						<AvatarFallback>
							<User className="h-4 w-4" />
							<span className="sr-only">User profile</span>
						</AvatarFallback>
					</Avatar>
				</div>
				<AppNavLinks pathname={pathname} className="appShellMobileNav" />
			</header>
			<div className="appShellMain">{children}</div>
		</div>
	);
}
