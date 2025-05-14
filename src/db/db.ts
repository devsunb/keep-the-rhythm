import Dexie from "dexie";
import { Unit } from "../defs/types";
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
	changes: {
		[timeKey: string]: EditChange;
	};
}

export interface EditChange {
	w: number;
	c: number;
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

export async function getActivtityForFile(date: string, filePath: string) {
	return await db.dailyActivity
		.where("[date+filePath]")
		.equals([date, filePath])
		.first();
}

export async function getTotalValueByDate(date: string, unit: Unit) {
	const activities = await db.dailyActivity
		.where("date")
		.equals(date)
		.toArray();

	// console.log(activities);

	let value = 0;
	if (unit == Unit.WORD) {
		value = activities.reduce((sum, activity) => {
			return (
				sum +
				Object.values(activity.changes).reduce(
					(s, change) => s + change.w,
					0,
				)
			);
		}, 0);
	} else if (unit == Unit.CHAR) {
		value = activities.reduce((sum, activity) => {
			return (
				sum +
				Object.values(activity.changes).reduce(
					(s, change) => s + change.c,
					0,
				)
			);
		}, 0);
	}
	// console.log("Called calculation", Date.now() + " " + value);

	return value;
}
export async function getTotalValueInDateRange(
	startDate: string,
	endDate: string,
	unit: Unit,
) {
	const activities = await db.dailyActivity
		.where("date")
		.between(startDate, endDate, true, true)
		.toArray();

	let value = 0;
	if (unit == Unit.WORD) {
		value = activities.reduce((sum, activity) => {
			return (
				sum +
				Object.values(activity.changes).reduce(
					(s, change) => s + change.w,
					0,
				)
			);
		}, 0);
	} else if (unit == Unit.CHAR) {
		value = activities.reduce((sum, activity) => {
			return (
				sum +
				Object.values(activity.changes).reduce(
					(s, change) => s + change.c,
					0,
				)
			);
		}, 0);
	}
	return value;
}

export async function removeDuplicatedDailyEntries() {
	const allEntries = await db.dailyActivity.toArray();

	// Create a map to track unique entries by date+filePath
	const uniqueEntries = new Map();
	const duplicateIds = [];

	for (const entry of allEntries) {
		const key = `${entry.date}-${entry.filePath}`;

		if (!uniqueEntries.has(key)) {
			uniqueEntries.set(key, entry);
		} else {
			const existingEntry = uniqueEntries.get(key);

			for (const [key, change] of Object.entries(entry.changes)) {
				if (existingEntry.changes[key]) {
					existingEntry.changes[key].w += change.w;
					existingEntry.changes[key].c += change.c;
				} else {
					existingEntry.changes[key] = { ...change };
				}
			}

			if (entry.id !== undefined) {
				duplicateIds.push(entry.id);
			}
		}
	}

	// Update all the merged entries
	for (const entry of uniqueEntries.values()) {
		if (entry.id !== undefined) {
			await db.dailyActivity.update(entry.id, {
				changes: entry.changes,
			});
		}
	}

	// Delete all duplicates
	if (duplicateIds.length > 0) {
		await db.dailyActivity.bulkDelete(duplicateIds);
	}

	return {
		totalEntries: allEntries.length,
		uniqueEntries: uniqueEntries.size,
		duplicatesRemoved: duplicateIds.length,
	};
}

export async function getWordAndCharCountByTimeKey(date: string) {
	const activities = await db.dailyActivity
		.where("date")
		.equals(date)
		.toArray();

	const timeKeyTotals: {
		[timeKey: string]: { totalWords: number; totalChars: number };
	} = {};

	for (const activity of activities) {
		for (const [timeKey, change] of Object.entries(activity.changes)) {
			if (!timeKeyTotals[timeKey]) {
				timeKeyTotals[timeKey] = { totalWords: 0, totalChars: 0 };
			}
			timeKeyTotals[timeKey].totalWords += change.w;
			timeKeyTotals[timeKey].totalChars += change.c;
		}
	}

	const result = Object.entries(timeKeyTotals)
		.map(([timeKey, { totalWords, totalChars }]) => ({
			timeKey,
			totalWords,
			totalChars,
		}))
		.sort((a, b) => a.timeKey.localeCompare(b.timeKey));

	return result;
}
