"use client";

import type { LanguageLevel } from "@/shared/config";

import { LANGUAGE_LEVELS, LANGUAGE_OPTIONS } from "@/shared/config";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

import "./upload-fields.css";

export function UploadFields({
	title,
	sourceLanguage,
	explanationLanguage,
	languageLevel,
	file,
	isUploading,
	onTitleChange,
	onSourceLanguageChange,
	onExplanationLanguageChange,
	onLanguageLevelChange,
	onFileChange,
}: {
	title: string;
	sourceLanguage: string;
	explanationLanguage: string;
	languageLevel: LanguageLevel | "";
	file: File | null;
	isUploading: boolean;
	onTitleChange: (value: string) => void;
	onSourceLanguageChange: (value: string) => void;
	onExplanationLanguageChange: (value: string) => void;
	onLanguageLevelChange: (value: LanguageLevel) => void;
	onFileChange: (file: File | null) => void;
}) {
	return (
		<>
			<div className="newVideoField">
				<Label htmlFor="video-title">Video public title</Label>
				<Input
					id="video-title"
					type="text"
					value={title}
					onChange={(event) => onTitleChange(event.target.value)}
					disabled={isUploading}
					placeholder="How I spent my summer"
					required
				/>
			</div>
			<LanguageSelect
				id="video-source-language"
				label="Video language"
				placeholder="Select the video language"
				value={sourceLanguage}
				disabled={isUploading}
				onChange={onSourceLanguageChange}
			/>
			<LanguageSelect
				id="video-explanation-language"
				label="Explanation language"
				placeholder="Select the explanation language"
				value={explanationLanguage}
				disabled={isUploading}
				onChange={onExplanationLanguageChange}
			/>
			<div className="newVideoField">
				<Label htmlFor="video-language-level">Language level</Label>
				<Select
					value={languageLevel}
					onValueChange={(value) =>
						onLanguageLevelChange(value as LanguageLevel)
					}
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
			<FileChooser
				file={file}
				disabled={isUploading}
				onFileChange={onFileChange}
			/>
		</>
	);
}

function LanguageSelect({
	id,
	label,
	placeholder,
	value,
	disabled,
	onChange,
}: {
	id: string;
	label: string;
	placeholder: string;
	value: string;
	disabled: boolean;
	onChange: (value: string) => void;
}) {
	return (
		<div className="newVideoField">
			<Label htmlFor={id}>{label}</Label>
			<Select value={value} onValueChange={onChange} disabled={disabled}>
				<SelectTrigger id={id}>
					<SelectValue placeholder={placeholder} />
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
	);
}

function FileChooser({
	file,
	disabled,
	onFileChange,
}: {
	file: File | null;
	disabled: boolean;
	onFileChange: (file: File | null) => void;
}) {
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
