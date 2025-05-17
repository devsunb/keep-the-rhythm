import { DailyActivity, TimeEntry } from "@/db/types";
import { getRandomInt } from "./utils";
import { db } from "@/db/db";

export async function mockMonthDailyActivity() {
	const today = new Date();
	const activities: DailyActivity[] = [];

	for (let i = 0; i < 365; i++) {
		const day = new Date(today);
		day.setDate(today.getDate() - i);

		const dateStr = day.toISOString().split("T")[0]; // YYYY-MM-DD

		// Simulate some changes throughout the day
		const changes: TimeEntry[] = [];
		const sessions = Math.floor(Math.random() * 5 + 1);

		for (let j = 0; j < sessions; j++) {
			const randomHour = getRandomInt(0, 24);
			const randomMinute = getRandomInt(0, 60);
			const timestamp =
				String(randomHour).padStart(2, "0") +
				":" +
				String(randomMinute).padStart(2, "0");

			changes.push({
				timeKey: timestamp,
				w: Math.floor(Math.random() * 200),
				c: Math.floor(Math.random() * 1000),
			});
		}

		const rand = Math.random();
		let filePath: string;
		if (rand < 0.33) {
			filePath = `mock/path/file-${i}.md`;
		} else if (rand < 0.66) {
			filePath = `data/${dateStr}/activity.md`;
		} else {
			filePath = `archives/${day.getFullYear()}/${day.getMonth() + 1}/day-${day.getDate()}.md`;
		}

		activities.push({
			date: dateStr,
			filePath,
			wordCountStart: 0,
			charCountStart: 0,
			changes,
		});
	}

	await db.dailyActivity.bulkAdd(activities);
}
