import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type FileChooserProps = {
	file: File | null;
	disabled: boolean;
	onFileChange: (file: File | null) => void;
};

export function FileChooser({
	file,
	disabled,
	onFileChange,
}: FileChooserProps) {
	return (
		<div className="newVideoField">
			<Label htmlFor="video-file">Video file</Label>
			<div className="newVideoDropzone">
				<Label htmlFor="video-file" className="newVideoChooseButton">
					Choose File
				</Label>
				<Input
					id="video-file"
					type="file"
					accept="video/mp4,video/webm,video/quicktime"
					onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
					disabled={disabled}
					className="sr-only"
					aria-label="Upload video file"
				/>
				<span className="text-xs text-muted-foreground">
					{file ? file.name : "No file chosen"}
				</span>
			</div>
			<p className="text-xs text-muted-foreground">
				Supported formats: MP4, WebM, MOV. Maximum file size: 500MB.
			</p>
		</div>
	);
}
