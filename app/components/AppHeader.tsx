import Link from "next/link";
import { Button } from "../../components/ui/button";

export function AppHeader() {
	return (
		<header className="appHeader">
			<h1>Video Processing Service</h1>
			<Button asChild variant="secondary" className="uploadButton">
				<Link href="/tasks/new">Upload a new video</Link>
			</Button>
		</header>
	);
}
