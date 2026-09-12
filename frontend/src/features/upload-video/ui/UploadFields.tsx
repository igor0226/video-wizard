"use client";

import type { LanguageLevel } from "@/shared/config";

import { LANGUAGE_LEVELS } from "@/shared/config";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { FileChooser } from "./FileChooser";
import { LanguageSelect } from "./LanguageSelect";
import "./upload-fields.css";

type UploadFieldsProps = {
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
};

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
}: UploadFieldsProps) {
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
