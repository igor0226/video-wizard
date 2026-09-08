import type { Metadata } from "next";

import { AppShell } from "@/widgets/app-shell";
import { Providers } from "./providers";

import "./styles/globals.css";

export const metadata: Metadata = {
	description:
		"Learn languages from video with listening, speaking, and writing practice",
	title: "Language Studio",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<AppShell>{children}</AppShell>
				</Providers>
			</body>
		</html>
	);
}
