import Dexie from "dexie";

import { DailyActivity, FileStats } from "./types";

class KTRDatabase extends Dexie {
	fileStats!: Dexie.Table<FileStats, number>;
	dailyActivity!: Dexie.Table<DailyActivity, number>;

	constructor() {
		super("KTRDatabase");

		this.version(2).stores({
			fileStats: "++id, path, filename, created, lastModified",
			dailyActivity:
				"++id, date, filePath, [date+filePath], [filePath+date]",
		});
	}
}

export const db = new KTRDatabase();
