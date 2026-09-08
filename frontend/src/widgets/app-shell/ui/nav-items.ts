import {
	Headphones,
	LayoutDashboard,
	type LucideIcon,
	Mic,
	PenTool,
} from "lucide-react";

export type AppNavItem = {
	label: string;
	href: string;
	icon: LucideIcon;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
	{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ label: "Listening", href: "/listening", icon: Headphones },
	{ label: "Writing", href: "/writing", icon: PenTool },
	{ label: "Speaking", href: "/speaking", icon: Mic },
];

export function isNavItemActive(pathname: string, href: string): boolean {
	if (href === "/dashboard") {
		return pathname === "/dashboard";
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}
