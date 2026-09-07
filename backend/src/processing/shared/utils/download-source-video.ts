import type { BlobStorageService } from "../../../storage";
import type { VideoRecord } from "../../../storage/types";
import { resolveSourceStorageKey } from "../../../storage/utils/resolve-source-storage-key";
import type { MediaWorkspace } from "../media-workspace.service";
import { WORKSPACE_SOURCE_RELATIVE_PATH } from "./workspace-source-path";

export async function downloadSourceVideoToWorkspace(input: {
	blobStorage: BlobStorageService;
	workspace: MediaWorkspace;
	video: VideoRecord;
}): Promise<string> {
	const sourceKey = await resolveSourceStorageKey(
		input.blobStorage,
		input.video,
	);
	return input.workspace.download({
		key: sourceKey,
		relative: WORKSPACE_SOURCE_RELATIVE_PATH,
	});
}
