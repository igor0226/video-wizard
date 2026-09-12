"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";
import teacherAvatar from "../assets/Elena.svg";
import { resolveImportedAssetSrc } from "../utils/resolve-imported-asset-src";
import { withSvgRootClass } from "../utils/with-svg-root-class";
import "./TeacherFace.css";

type TeacherFaceProps = {
	staticMotion?: boolean;
	className?: string;
};

const teacherAvatarSrc = resolveImportedAssetSrc(teacherAvatar);

export function TeacherFace({
	staticMotion = false,
	className,
}: TeacherFaceProps) {
	const markup = useTeacherFaceMarkup(staticMotion);

	return (
		<div
			className={cn("teacherFace", className)}
			// Markup is a first-party SVG asset, not user input.
			dangerouslySetInnerHTML={markup ? { __html: markup } : undefined}
		/>
	);
}

function useTeacherFaceMarkup(staticMotion: boolean) {
	const [markup, setMarkup] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		fetch(teacherAvatarSrc, { signal: controller.signal })
			.then((response) => response.text())
			.then((svg) => {
				setMarkup(staticMotion ? withSvgRootClass(svg, "is-static") : svg);
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
				setMarkup(null);
			});

		return () => controller.abort();
	}, [staticMotion]);

	return markup;
}
