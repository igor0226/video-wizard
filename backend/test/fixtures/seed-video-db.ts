import { createAppDataSource } from "../../src/database/data-source";
import { ProcessingHistory, Video } from "../../src/models";
import type {
	VideoProcessingHistory,
	VideoRecord,
} from "../../src/storage/types";

export async function seedVideoMetadata(input: {
	record: VideoRecord;
	history: VideoProcessingHistory;
}): Promise<void> {
	const dataSource = createAppDataSource();
	await dataSource.initialize();
	await dataSource.getRepository(Video).save(input.record);
	await dataSource.getRepository(ProcessingHistory).save(input.history);
	await dataSource.destroy();
}
