import Dexie from "dexie";
import { Unit } from "../types";
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

	// console.log(activities);

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
		.between(startDate, endDate, true, true)
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

export async function removeDuplicatedDailyEntries() {
	// Get all daily activity entries
	const allEntries = await db.dailyActivity.toArray();

	// Create a map to track unique entries by date+filePath
	const uniqueEntries = new Map();
	const duplicateIds = [];

	// Find duplicates
	for (const entry of allEntries) {
		const key = `${entry.date}-${entry.filePath}`;

		if (!uniqueEntries.has(key)) {
			// First occurrence of this date+filePath combination
			uniqueEntries.set(key, entry);
		} else {
			// This is a duplicate - merge data into the first entry
			const existingEntry = uniqueEntries.get(key);

			// Update counts in the first entry (optional - decide if you want to sum or keep max values)
			existingEntry.wordsWritten += entry.wordsWritten;
			existingEntry.charsWritten += entry.charsWritten;

			// Add this duplicate's ID to the list for deletion
			if (entry.id !== undefined) {
				duplicateIds.push(entry.id);
			}
		}
	}

	// Update all the merged entries
	for (const entry of uniqueEntries.values()) {
		if (entry.id !== undefined) {
			await db.dailyActivity.update(entry.id, {
				wordsWritten: entry.wordsWritten,
				charsWritten: entry.charsWritten,
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
