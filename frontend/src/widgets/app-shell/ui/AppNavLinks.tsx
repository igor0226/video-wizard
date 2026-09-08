import Link from "next/link";

import { cn } from "@/shared/lib";
import { APP_NAV_ITEMS, isNavItemActive } from "./nav-items";

type AppNavLinksProps = {
	pathname: string;
	className?: string;
};

export function AppNavLinks({ pathname, className }: AppNavLinksProps) {
	return (
		<nav aria-label="Main navigation" className={className}>
			{APP_NAV_ITEMS.map((item) => {
				const Icon = item.icon;
				const isActive = isNavItemActive(pathname, item.href);
				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"appShellNavLink",
							isActive && "appShellNavLinkActive",
						)}
						aria-current={isActive ? "page" : undefined}
					>
						<Icon className="h-4 w-4" aria-hidden />
						<span>{item.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
