import Dexie from "dexie";
import { Unit } from "./types";
import { start } from "repl";

export interface FileStats {
	id?: number;
	path: string;
	filename: string;
	wordCount: number;
	charCount?: number;
	created?: Date;
	deleted?: Date;
	lastModified: Date;
	timesOpened: number;
}

export interface DailyActivity {
	id?: number;
	date: string;
	device: string;
	filePath: string;
	wordCountStart: number;
	charCountStart: number;
	wordsWritten: number;
	charsWritten: number;
	created: boolean;
}

class KTRDatabase extends Dexie {
	fileStats!: Dexie.Table<FileStats, number>;
	dailyActivity!: Dexie.Table<DailyActivity, number>;

	constructor() {
		super("KTRDatabase");

		this.version(1).stores({
			fileStats: "++id, path, filename, created, lastModified",
			dailyActivity: "++id, date, filePath, [date+filePath]",
		});
	}
}

export const db = new KTRDatabase();

export async function getActivityByDate(date: string) {
	return await db.dailyActivity.where("date").equals(date).toArray();
}

export async function getTotalValueByDate(date: string, unit: Unit) {
	const activities = await db.dailyActivity
		.where("date")
		.equals(date)
		.toArray();

	let value = 0;
	if (unit == Unit.WORD) {
		value = activities.reduce(
			(sum, activity) => sum + activity.wordsWritten,
			0,
		);
	} else if (unit == Unit.CHAR) {
		value = activities.reduce(
			(sum, activity) => sum + activity.charsWritten,
			0,
		);
	}
	return value;
}
export async function getTotalValueInDateRange(
	startDate: string,
	endDate: string,
	unit: Unit,
) {
	const activities = await db.dailyActivity
		.where("date")
		.between(startDate, endDate)
		.toArray();

	let value = 0;
	if (unit == Unit.WORD) {
		value = activities.reduce(
			(sum, activity) => sum + activity.wordsWritten,
			0,
		);
	} else if (unit == Unit.CHAR) {
		value = activities.reduce(
			(sum, activity) => sum + activity.charsWritten,
			0,
		);
	}
	return value;
}
