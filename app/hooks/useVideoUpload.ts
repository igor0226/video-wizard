"use client";

import { useCallback, useState } from "react";

type UploadVideoInput = {
	title: string;
	file: File;
};

export function useVideoUpload() {
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const uploadVideo = useCallback(({ title, file }: UploadVideoInput) => {
		if (!file) {
			setUploadError("Choose a video file first.");
			return Promise.reject(new Error("Missing file"));
		}
		if (!title.trim()) {
			setUploadError("Enter a video name.");
			return Promise.reject(new Error("Missing title"));
		}

		const formData = new FormData();
		formData.set("title", title.trim());
		formData.set("file", file);

		setUploadError(null);
		setIsUploading(true);
		setUploadProgress(0);

		return new Promise<string>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("POST", "/api/videos/upload");
			xhr.upload.onprogress = (progressEvent) => {
				if (progressEvent.lengthComputable) {
					setUploadProgress((progressEvent.loaded / progressEvent.total) * 100);
				}
			};

			xhr.onerror = () => {
				setIsUploading(false);
				setUploadError("Upload failed due to a network issue.");
				reject(new Error("Network error"));
			};

			xhr.onload = () => {
				setIsUploading(false);
				if (xhr.status < 200 || xhr.status >= 300) {
					setUploadError(xhr.responseText || "Upload failed.");
					reject(new Error("Upload failed"));
					return;
				}

				const responsePayload = JSON.parse(xhr.responseText) as { id: string };
				setUploadProgress(100);
				resolve(responsePayload.id);
			};

			xhr.send(formData);
		});
	}, []);

	return {
		uploadVideo,
		uploadProgress,
		isUploading,
		uploadError,
	};
}
