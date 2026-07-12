"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Progress } from "../../../components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { AppPageHeader } from "../../components/AppPageHeader/AppPageHeader";
import { useVideoUpload } from "../../hooks/useVideoUpload";
import "../../styles/tasks-page.css";
import "./new-video-page.css";

const PRIORITY_OPTIONS = ["Low", "Medium", "High"] as const;

export default function NewVideoPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { uploadVideo, uploadProgress, isUploading, uploadError } =
		useVideoUpload();

	const [title, setTitle] = useState("");
	const [priority, setPriority] = useState<string>("");
	const [file, setFile] = useState<File | null>(null);

	const showProgress = isUploading || uploadProgress > 0;

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!file) {
			return;
		}

		try {
			const videoId = await uploadVideo({ title, file });
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
					<Label htmlFor="video-priority">Priority</Label>
					<Select
						value={priority}
						onValueChange={setPriority}
						disabled={isUploading}
					>
						<SelectTrigger id="video-priority">
							<SelectValue placeholder="Select the priority" />
						</SelectTrigger>
						<SelectContent>
							{PRIORITY_OPTIONS.map((option) => (
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
					<Button type="submit" disabled={isUploading}>
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
