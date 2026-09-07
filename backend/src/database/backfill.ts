import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { ProcessingHistory, Video } from "../models";
import { createDefaultHistory } from "../storage/utils/create-default-history";
import { normalizeLegacyVideoRecord } from "../storage/utils/video-record";
import type { VideoProcessingHistory, VideoRecord } from "../storage/types";
import { resolveStorageRoot } from "../storage/utils/resolve-storage-root";
import { createAppDataSource } from "./data-source";

const RECORDS_DIR = "records";
const HISTORY_DIR = "history";

async function readJsonFiles<T>(
	directory: string,
): Promise<Array<{ fileName: string; data: T }>> {
	const absoluteDirectory = path.join(resolveStorageRoot(), directory);
	let entries: string[];
	try {
		entries = await readdir(absoluteDirectory);
	} catch {
		return [];
	}

	const results: Array<{ fileName: string; data: T }> = [];
	for (const fileName of entries.filter((entry) => entry.endsWith(".json"))) {
		const content = await readFile(
			path.join(absoluteDirectory, fileName),
			"utf8",
		);
		results.push({ fileName, data: JSON.parse(content) as T });
	}
	return results;
}

async function backfill(): Promise<void> {
	const AppDataSource = createAppDataSource();
	await AppDataSource.initialize();

	const videoRepo = AppDataSource.getRepository(Video);
	const historyRepo = AppDataSource.getRepository(ProcessingHistory);

	const records = await readJsonFiles<Partial<VideoRecord>>(RECORDS_DIR);
	for (const { data } of records) {
		await videoRepo.save(normalizeLegacyVideoRecord(data));
		process.stdout.write(`backfilled video ${String(data.id)}\n`);
	}

	const histories =
		await readJsonFiles<Partial<VideoProcessingHistory>>(HISTORY_DIR);
	for (const { data } of histories) {
		const videoId = String(data.videoId);
		await historyRepo.save({
			...createDefaultHistory(videoId),
			...data,
			videoId,
			events: data.events ?? [],
		});
		process.stdout.write(`backfilled history ${videoId}\n`);
	}

	await AppDataSource.destroy();
	process.stdout.write(
		`backfill complete: ${records.length} videos, ${histories.length} histories\n`,
	);
}

void backfill().catch((error) => {
	process.stderr.write(`${String(error)}\n`);
	process.exit(1);
});
