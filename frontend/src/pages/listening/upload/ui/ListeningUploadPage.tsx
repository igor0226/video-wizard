"use client";

import type { LanguageLevel } from "@/shared/config";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { UploadFields, useVideoUpload } from "@/features/upload-video";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import "@/widgets/listening-library";
import { AppPageHeader } from "@/widgets/page-header";

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

export default function ListeningUploadPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { uploadVideo, uploadProgress, isUploading, uploadError } =
		useVideoUpload();

	const [title, setTitle] = useState("");
	const [sourceLanguage, setSourceLanguage] = useState("");
	const [explanationLanguage, setExplanationLanguage] = useState("");
	const [languageLevel, setLanguageLevel] = useState<LanguageLevel | "">("");
	const [file, setFile] = useState<File | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	const showProgress = isUploading || uploadProgress > 0;
	const canSubmit =
		Boolean(file) &&
		title.trim().length > 0 &&
		sourceLanguage.length > 0 &&
		explanationLanguage.length > 0 &&
		languageLevel !== "";

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!file || languageLevel === "") {
			setValidationError(
				"Fill in all required fields and choose a video file.",
			);
			return;
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			setValidationError("Video file must be 500MB or smaller.");
			return;
		}

		try {
			setValidationError(null);
			const videoId = await uploadVideo({
				title,
				file,
				sourceLanguage,
				explanationLanguage,
				languageLevel,
			});
			await queryClient.invalidateQueries({ queryKey: ["videos"] });
			router.push(`/listening/${videoId}`);
		} catch {
			// Error state is handled inside useVideoUpload.
		}
	};

	return (
		<main className="tasksPage">
			<AppPageHeader
				title="Listening"
				breadcrumbs={[
					{ label: "Home", href: "/dashboard" },
					{ label: "Tasks", href: "/listening" },
					{ label: "New video" },
				]}
			/>

			<form className="newVideoForm" onSubmit={handleSubmit}>
				{validationError ? (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{validationError}</AlertDescription>
					</Alert>
				) : null}

				<UploadFields
					title={title}
					sourceLanguage={sourceLanguage}
					explanationLanguage={explanationLanguage}
					languageLevel={languageLevel}
					file={file}
					isUploading={isUploading}
					onTitleChange={setTitle}
					onSourceLanguageChange={setSourceLanguage}
					onExplanationLanguageChange={setExplanationLanguage}
					onLanguageLevelChange={setLanguageLevel}
					onFileChange={setFile}
				/>

				{showProgress ? (
					<div className="newVideoField">
						<Progress value={uploadProgress} className="newVideoProgress" />
					</div>
				) : null}

				{uploadError ? <p className="newVideoError">{uploadError}</p> : null}

				<div className="newVideoActions">
					<Button type="submit" disabled={isUploading || !canSubmit}>
						{isUploading ? (
							<span className="inline-flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								Uploading...
							</span>
						) : (
							"Submit"
						)}
					</Button>
				</div>
			</form>
		</main>
	);
}
