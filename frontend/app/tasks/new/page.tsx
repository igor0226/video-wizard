"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AppPageHeader } from "../../components/AppPageHeader/AppPageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { useVideoUpload } from "../../hooks/useVideoUpload";
import { LANGUAGE_LEVELS, LANGUAGE_OPTIONS } from "../../lib/languages";
import type { LanguageLevel } from "../../types/video";
import "../../styles/tasks-page.css";
import "./new-video-page.css";

export default function NewVideoPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { uploadVideo, uploadProgress, isUploading, uploadError } =
		useVideoUpload();

	const [title, setTitle] = useState("");
	const [sourceLanguage, setSourceLanguage] = useState("");
	const [explanationLanguage, setExplanationLanguage] = useState("");
	const [languageLevel, setLanguageLevel] = useState<LanguageLevel | "">("");
	const [file, setFile] = useState<File | null>(null);

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
			return;
		}

		try {
			const videoId = await uploadVideo({
				title,
				file,
				sourceLanguage,
				explanationLanguage,
				languageLevel,
			});
			await queryClient.invalidateQueries({ queryKey: ["videos"] });
			router.push(`/tasks/${videoId}`);
		} catch {
			// Error state is handled inside useVideoUpload.
		}
	};

	return (
		<main className="tasksPage">
			<AppPageHeader
				breadcrumbs={[
					{ label: "Home", href: "/" },
					{ label: "Tasks", href: "/" },
					{ label: "New video" },
				]}
			/>

			<form className="newVideoForm" onSubmit={handleSubmit}>
				<div className="newVideoField">
					<Label htmlFor="video-title">Video public title</Label>
					<Input
						id="video-title"
						type="text"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						disabled={isUploading}
						placeholder="How I spent my summer"
					/>
				</div>

				<div className="newVideoField">
					<Label htmlFor="video-source-language">Video language</Label>
					<Select
						value={sourceLanguage}
						onValueChange={setSourceLanguage}
						disabled={isUploading}
					>
						<SelectTrigger id="video-source-language">
							<SelectValue placeholder="Select the video language" />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGE_OPTIONS.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="newVideoField">
					<Label htmlFor="video-explanation-language">
						Explanation language
					</Label>
					<Select
						value={explanationLanguage}
						onValueChange={setExplanationLanguage}
						disabled={isUploading}
					>
						<SelectTrigger id="video-explanation-language">
							<SelectValue placeholder="Select the explanation language" />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGE_OPTIONS.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="newVideoField">
					<Label htmlFor="video-language-level">Language level</Label>
					<Select
						value={languageLevel}
						onValueChange={(value) => setLanguageLevel(value as LanguageLevel)}
						disabled={isUploading}
					>
						<SelectTrigger id="video-language-level">
							<SelectValue placeholder="Select the CEFR level" />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGE_LEVELS.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="newVideoField">
					<Input
						id="video-file"
						type="file"
						accept="video/*"
						onChange={(event) => setFile(event.target.files?.[0] ?? null)}
						disabled={isUploading}
						className="newVideoFileInput"
					/>
				</div>

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
