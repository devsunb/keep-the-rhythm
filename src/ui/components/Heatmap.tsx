import { useLiveQuery } from "dexie-react-hooks";
import { weekdaysNames, monthNames } from "../texts";
import { getDateForCell, sumTimeEntries, log } from "@/utils/utils";
import { formatDate } from "@/utils/dateUtils";
import { DailyActivity } from "@/db/types";
import React from "react";
import { Unit, HeatmapColorModes, HeatmapConfig } from "@/defs/types";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { moment as _moment } from "obsidian";
import { HeatmapCell } from "./HeatmapCell";
import { compileEvaluator } from "@/core/query";
import { db } from "@/db/db";

interface HeatmapProps {
	heatmapConfig: HeatmapConfig;
	amountOfWeeks?: number;
	query?: any;
}

const getIntensityLevel = (
	count: number,
	heatmapConfig: HeatmapConfig,
): number => {
	if (
		!heatmapConfig ||
		!heatmapConfig.intensityStops ||
		!heatmapConfig.intensityMode
	) {
		return 0;
	}

	const { low, medium, high } = heatmapConfig.intensityStops;

	switch (heatmapConfig.intensityMode) {
		/** Gradual is proportional to 100 to avoid decimals */
		case HeatmapColorModes.GRADUAL:
			if (count <= low) return 0;
			if (count >= high) return 100;

			const proportion = (count / high) * 100;

			if (proportion > 100) return 100;
			return proportion;
			break;
		case HeatmapColorModes.LIQUID:
			if (count <= low) return 0;
			if (count >= high) return 100;

			const height = (count / high) * 100;

			if (height > 100) return 100;
			return height;
			break;
		case HeatmapColorModes.SOLID:
			if (count >= low) {
				return 4;
			} else {
				return 0;
			}
			break;
		case HeatmapColorModes.STOPS:
			if (count <= 0) return 0;
			if (count < low) return 1;
			if (count < medium) return 2;
			if (count < high) return 3;
			break;
	}

	return 4;
};

// HEATMAP
export const Heatmap = ({
	heatmapConfig,
	query,
	amountOfWeeks,
}: HeatmapProps) => {
	let startDate: Date | null = null;
	let endDate: Date | null = null;
	const weeksToShow = amountOfWeeks || 20;

	const heatmapData = useLiveQuery(async () => {
		const start = performance.now();
		const requiredDates = new Set<string>();

		for (let week = 0; week < weeksToShow; week++) {
			for (let day = 0; day < 7; day++) {
				const date = getDateForCell(week, day, weeksToShow);
				requiredDates.add(formatDate(date));

				if (!startDate || date < startDate) startDate = date;
				if (!endDate || date > endDate) endDate = date;
			}
		}

		let usedIndex = false;
		let usedCompound = false;
		let results;
		let filterFn: ((entry: DailyActivity) => boolean) | null = null;
		if (query) {
			try {
				filterFn = compileEvaluator(query);
			} catch (e) {
				console.error("Error compiling query:", e);
			}
		}

		if (
			query &&
			query.type == "BinaryExpression" &&
			query.operator === "starts_with"
		) {
			console.log("why did you use the index");
			usedIndex = true;

			let value = query.right.value;
			if (typeof value === "string") {
				value = value.startsWith("/") ? value.substring(1) : value;
			}

			results = await db.dailyActivity
				.where("[filePath+date]")
				.between(
					[value, startDate],
					[value + "\uffff", endDate],
					true,
					true,
				)
				.toArray();
		} else if (query) {
			results = await db.dailyActivity
				.where("date")
				.anyOf([...requiredDates])
				.filter((entry) => {
					return filterFn!(entry);
				})
				.toArray();
		} else {
			results = await db.dailyActivity
				.where("date")
				.anyOf([...requiredDates])
				.toArray();
		}

		// // Apply remaining query conditions in-memory
		// if (query || query.type !== "BinaryExpresion") {
		// 	console.log("not binary");

		// }

		const dateMap: Record<string, number> = {};

		for (const entry of results) {
			dateMap[entry.date] = sumTimeEntries(entry, Unit.WORD);
		}

		const end = performance.now();
		log(
			`HEATMAP UPDATED: ${end - start} ms ${query?.right?.value || ""} ${usedIndex ? "USED INDEX" : ""} ${usedCompound ? "USED COMPOUND" : ""}`,
		);

		return dateMap;
	});

	if (!heatmapData) {
		return <div className="heatmap-loading">Loading heatmap...</div>; // Replace with spinner or skeleton
	}

	const getMonthLabels = () => {
		const labels = [];
		let lastMonth = -1;

		for (let week = 0; week < weeksToShow; week++) {
			const date = getDateForCell(week, 0, weeksToShow);

			const localDate = new Date(
				date.getTime() - date.getTimezoneOffset() * 60000,
			);
			const month = localDate.getMonth();
			const dayOfMonth = localDate.getDate();

			if (month !== lastMonth && dayOfMonth <= 7) {
				labels.push({
					month: monthNames[month],
					week: week,
				});
				lastMonth = month;
			}
		}
		return labels;
	};

	return (
		<RadixTooltip.Provider
			delayDuration={0}
			skipDelayDuration={1000}
			disableHoverableContent
		>
			{heatmapData && (
				<div className="heatmap-wrapper">
					<div className="week-day-labels">
						{weekdaysNames.map((day) => (
							<div key={day} className="week-day-label">
								{day}
							</div>
						))}
					</div>

					<div className="heatmap-content">
						<div className="month-labels">
							{getMonthLabels().map(({ month, week }) => (
								<div
									key={`${month}-${week}`}
									className="month-label"
									style={{ gridColumn: week + 1 }}
								>
									{month}
								</div>
							))}
						</div>
						<div className="heatmap-new-grid">
							{Array(weeksToShow)
								.fill(null)
								.map((_, weekIndex) => (
									<div
										key={weekIndex}
										className="heatmap-column"
									>
										{Array(7)
											.fill(null)
											.map((_, dayIndex) => {
												const date = getDateForCell(
													weekIndex,
													dayIndex,
													weeksToShow,
												);
												const dateStr =
													formatDate(date);
												const count =
													heatmapData[dateStr] ?? 0;
												return (
													<HeatmapCell
														key={dateStr}
														count={count}
														date={dateStr}
														intensity={getIntensityLevel(
															count,
															heatmapConfig,
														)}
														mode={
															heatmapConfig.intensityMode
														}
													/>
												);
											})}
									</div>
								))}
						</div>
					</div>
				</div>
			)}
		</RadixTooltip.Provider>
	);
};

// break;
// switch (filePathFilter.type) {
// 	case "equals":
// 		results = await db.dailyActivity
// 			.where("filePath")
// 			.equals(filePathFilter.value)
// 			.and((entry) => requiredDates.has(entry.date)) // further filter by date in-memory or use compound index if available
// 			.toArray();
// 		break;
// 	case "starts_with":
// 	case "contains":
// 		// No direct Dexie index for "contains", must filter in-memory after fetching date filtered records
// 		results = await db.dailyActivity
// 			.where("date")
// 			.anyOf([...requiredDates])
// 			.toArray();
// 		// In-memory filter for "contains"
// 		results = results.filter((entry) =>
// 			entry.filePath.includes(filePathFilter.value),
// 		);
// 		break;
// }

// const [heatmapData, setHeatmapData] = React.useState<
// 	Record<string, number>
// >({});

// const fetchHeatmapData = async () => {
// 	const start = performance.now();
// 	// let data: Record<string, number> = {};

// 	// if (state.cacheExists) {
// 	// 	data = state.historicalCache;
// 	// } else {
// 	// 	data = await state.resetCache();
// 	// }

// 	// await getTotalValueByDate(state.today, Unit.WORD).then((todayEntry) => {
// 	// 	data[state.today] = todayEntry;
// 	// });

// 	const requiredDates = new Set<string>();
// 	for (let week = 0; week < weeksToShow; week++) {
// 		for (let day = 0; day < 7; day++) {
// 			const date = getDateForCell(week, day);
// 			requiredDates.add(formatDate(date));
// 		}
// 	}

// 	// TODO
// 	// Important
// 	// I can ask users to always filter paths using the full path until the folder they want to avoid having
// 	// To do in-memory filtering, cause then I can just use "startsWith" which will be much more performant.

// 	// TODO FIXME FUTURE
// 	// Really important:
// 	// dexie js has live queries I can use to avoid having to manage updates, this will probably make my life much easier.

// 	// https://dexie.org/#live-queries
// 	// let results = await db.dailyActivity
// 	// 	.where("date")
// 	// 	.anyOf([...requiredDates])
// 	// 	.toArray();

// 	// if (query) {
// 	// 	results = results.filter((entry) =>
// 	// 		evaluateExpression(query, entry),
// 	// 	);
// 	// }

// 	const filePathFilter = extractFilePathFilter(query);

// 	let results;
// 	if (filePathFilter && query) {
// 		// Use indexed Dexie queries for filePath filter
// 		switch (filePathFilter.type) {
// 			case "equals":
// 				results = await db.dailyActivity
// 					.where("filePath")
// 					.equals(filePathFilter.value)
// 					.and((entry) => requiredDates.has(entry.date)) // further filter by date in-memory or use compound index if available
// 					.toArray();
// 				break;
// 			case "starts_with":
// 				results = await db.dailyActivity
// 					.where("filePath")
// 					.startsWithIgnoreCase(filePathFilter.value)
// 					.and((entry) => requiredDates.has(entry.date))
// 					.toArray();
// 				break;
// 			case "contains":
// 				// No direct Dexie index for "contains", must filter in-memory after fetching date filtered records
// 				results = await db.dailyActivity
// 					.where("date")
// 					.anyOf([...requiredDates])
// 					.toArray();
// 				// In-memory filter for "contains"
// 				results = results.filter((entry) =>
// 					entry.filePath.includes(filePathFilter.value),
// 				);
// 				break;
// 		}
// 	} else {
// 		// No filePath index filter, filter only by date
// 		results = await db.dailyActivity
// 			.where("date")
// 			.anyOf([...requiredDates])
// 			.toArray();
// 	}

// 	// Apply remaining query conditions in-memory
// 	if (query) {
// 		results = results.filter((entry) =>
// 			evaluateExpression(query, entry),
// 		);
// 	}

// 	const dateMap: Record<string, number> = {};

// 	for (const entry of results) {
// 		dateMap[entry.date] = sumTimeEntries(entry, Unit.WORD);
// 	}

// 	setHeatmapData({ ...dateMap });

// 	const end = performance.now();
// 	log(`${end - start}`);
// };

// React.useEffect(() => {
// 	fetchHeatmapData();
// 	state.on(EVENTS.REFRESH_EVERYTHING, fetchHeatmapData);

// 	return () => {
// 		state.off(EVENTS.REFRESH_EVERYTHING, fetchHeatmapData);
// 	};
// }, []);
