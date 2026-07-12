import { Button } from "../../components/ui/button";

type AppHeaderProps = {
	onUploadClick: () => void;
};

export function AppHeader({ onUploadClick }: AppHeaderProps) {
	return (
		<header className="appHeader">
			<h1>Video Processing Service</h1>
			<Button
				type="button"
				variant="secondary"
				className="uploadButton"
				onClick={onUploadClick}
			>
				Upload a new video
			</Button>
		</header>
	);
}
