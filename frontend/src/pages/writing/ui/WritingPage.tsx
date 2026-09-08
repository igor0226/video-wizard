import { ComingSoonPanel } from "@/features/subscribe-writing";
import { AppPageHeader } from "@/widgets/page-header";

export default function WritingPage() {
	return (
		<main className="comingSoonPage">
			<AppPageHeader
				title="Writing"
				breadcrumbs={[
					{ label: "Home", href: "/dashboard" },
					{ label: "Writing" },
				]}
			/>
			<ComingSoonPanel />
		</main>
	);
}
