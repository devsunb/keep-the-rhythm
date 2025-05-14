import {
	weeksToShow,
	weekdaysNames,
	monthNames,
	formatDate,
} from "../utils/utils";

import { getDateForCell } from "../utils/utils";
import { db } from "@/db/db";

export class HistoricDataCache {
	private _cache: Record<string, number> = {};
	private _cacheIsSet: boolean = false;

	get historicalCache() {
		return this._cache;
	}

	get cacheExists() {
		return this._cacheIsSet;
	}

	public async resetCache() {
		const requiredDates = new Set<string>();

		for (let week = 0; week < weeksToShow; week++) {
			for (let day = 0; day < 7; day++) {
				const date = getDateForCell(week, day);
				requiredDates.add(formatDate(date));
			}
		}

		const results = await db.dailyActivity
			.where("date")
			.anyOf([...requiredDates])
			.toArray();

		const dateMap: Record<string, number> = {};
		for (const entry of results) {
			dateMap[entry.date] =
				(dateMap[entry.date] || 0) + entry.wordsWritten;
		}

		this._cache = dateMap;
		this._cacheIsSet = true;
		return dateMap;
	}
}

export const historicDataCache = new HistoricDataCache();
