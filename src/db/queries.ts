import { db } from "./db";
import { Unit } from "../defs/types";
import { sumTimeEntries } from "@/utils/utils";

export async function getActivityByDate(date: string) {
	return await db.dailyActivity.where("date").equals(date).toArray();
}

/** Expects that there is only one activity for that file */
// TODO: maybe I could check here if the file activity is duplicated to avoid errors.
export async function getActivtityForFile(date: string, filePath: string) {
	return await db.dailyActivity
		.where("[date+filePath]")
		.equals([date, filePath])
		.first();
}

export async function getTotalValueByDate(
	date: string,
	unit: Unit,
): Promise<number> {
	const activities = await db.dailyActivity
		.where("date")
		.equals(date)
		.toArray();

	let value = activities.reduce((sum, activity) => {
		return sumTimeEntries(activity, unit);
	}, 0);

	return value || 0;
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

	let value = activities.reduce((sum, activity) => {
		return sumTimeEntries(activity, unit);
	}, 0);

	return value;
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
