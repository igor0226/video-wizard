"use client";

import type {
	TeacherFaceEmotion,
	TeacherFaceIntensity,
	TeacherFaceSpeech,
} from "../model/teacher-face";

import {
	type RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import { cn } from "@/shared/lib/utils";
import teacherAvatar from "../assets/Elena.svg";
import {
	DEFAULT_TEACHER_FACE_EMOTION,
	DEFAULT_TEACHER_FACE_INTENSITY,
	DEFAULT_TEACHER_FACE_SPEECH,
} from "../model/teacher-face";
import { applyTeacherFaceExpression } from "../utils/apply-teacher-face-expression";
import { logTeacherFaceApplyResult } from "../utils/log-teacher-face-apply";
import { resolveImportedAssetSrc } from "../utils/resolve-imported-asset-src";
import { withSvgRootClass } from "../utils/with-svg-root-class";
import "./TeacherFace.css";

type TeacherFaceProps = {
	emotion?: TeacherFaceEmotion;
	intensity?: TeacherFaceIntensity;
	speech?: TeacherFaceSpeech;
	staticMotion?: boolean;
	className?: string;
};

const teacherAvatarSrc = resolveImportedAssetSrc(teacherAvatar);

export function TeacherFace({
	emotion = DEFAULT_TEACHER_FACE_EMOTION,
	intensity = DEFAULT_TEACHER_FACE_INTENSITY,
	speech = DEFAULT_TEACHER_FACE_SPEECH,
	staticMotion = false,
	className,
}: TeacherFaceProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const markupId = useTeacherFaceMarkup(rootRef, staticMotion);
	useTeacherFaceExpression(rootRef, markupId, emotion, intensity, speech);

	return <div ref={rootRef} className={cn("teacherFace", className)} />;
}

function useTeacherFaceExpression(
	rootRef: RefObject<HTMLDivElement | null>,
	markupId: number,
	emotion: TeacherFaceEmotion,
	intensity: TeacherFaceIntensity,
	speech: TeacherFaceSpeech,
) {
	useLayoutEffect(() => {
		const svg = rootRef.current?.querySelector("#ai-teacher-face");
		if (!svg) {
			if (markupId > 0) {
				logTeacherFaceApplyResult(null, emotion, intensity, speech);
			}
			return;
		}
		applyTeacherFaceExpression(svg, emotion, intensity, speech);
		logTeacherFaceApplyResult(svg, emotion, intensity, speech);
	}, [rootRef, markupId, emotion, intensity, speech]);
}

function useTeacherFaceMarkup(
	rootRef: RefObject<HTMLDivElement | null>,
	staticMotion: boolean,
) {
	const [markupId, setMarkupId] = useState(0);

	useEffect(() => {
		const controller = new AbortController();

		fetch(teacherAvatarSrc, { signal: controller.signal })
			.then((response) => response.text())
			.then((svg) => {
				const root = rootRef.current;
				if (!root) {
					return;
				}
				root.innerHTML = staticMotion
					? withSvgRootClass(svg, "is-static")
					: svg;
				setMarkupId((current) => current + 1);
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
				if (rootRef.current) {
					rootRef.current.innerHTML = "";
				}
			});

		return () => controller.abort();
	}, [rootRef, staticMotion]);

	return markupId;
}
