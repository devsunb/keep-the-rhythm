import Dexie from "dexie";

import { DailyActivity } from "./types";

class KTRDatabase extends Dexie {
	dailyActivity!: Dexie.Table<DailyActivity, number>;

	constructor() {
		super("KTRDatabase");

		this.version(2).stores({
			dailyActivity:
				"++id, date, filePath, [date+filePath], [filePath+date]",
		});
	}
}

export const db = new KTRDatabase();
