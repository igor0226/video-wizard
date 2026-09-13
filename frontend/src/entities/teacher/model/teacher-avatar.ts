import teacherAvatar from "../assets/Elena.svg";
import { resolveImportedAssetSrc } from "../utils/resolve-imported-asset-src";

export const TEACHER_AVATAR_MEDIA = {
	type: "image" as const,
	src: resolveImportedAssetSrc(teacherAvatar),
	alt: "AI Teacher Elena",
};
