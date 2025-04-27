import {
	HistoricDataCache,
	historicDataCache,
} from "@/store/historicDataCache";
import { getDateForCell, getDayIndex } from "../utils";
import { eventEmitter, EVENTS } from "../events";
import {
	weeksToShow,
	weekdaysNames,
	monthNames,
	formatDate,
	getLeafWithFile,
	getApp,
} from "../utils";
import { db, getActivityByDate, getTotalValueByDate } from "@/db/db";
import React from "react";
import { IntensityConfig, Unit } from "../types";
import * as obsidian from "obsidian";
import { Tooltip } from "@/components/Tooltip";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { useCtrlKey } from "../context/useModiferKey";
import { moment as _moment } from "obsidian";
import { HeatmapCell } from "./HeatmapCell";
import { editorStore } from "@/store/editorStore";

interface HeatmapProps {
	intensityLevels: IntensityConfig;
}

const getIntensityLevel = (
	count: number,
	intensityLevels: IntensityConfig,
): number => {
	const { low, medium, high } = intensityLevels;
	if (count <= 0) return 0;
	if (count < low) return 1;
	if (count < medium) return 2;
	if (count < high) return 3;
	return 4;
};

// HEATMAP
export const Heatmap = ({ intensityLevels }: HeatmapProps) => {
	const [heatmapData, setHeatmapData] = React.useState<
		Record<string, number>
	>({});

	const fetchHeatmapData = async () => {
		const start = performance.now();
		const today = formatDate(new Date());
		let data: Record<string, number> = {};

		if (historicDataCache.cacheExists) {
			console.log("using existing data");
			data = historicDataCache.historicalCache;
		} else {
			console.log("refetching data");
			data = await historicDataCache.resetCache();
		}

		await getTotalValueByDate(today, Unit.WORD).then((todayEntry) => {
			data[today] = todayEntry;
		});

		setHeatmapData({ ...historicDataCache.historicalCache });

		const end = performance.now();
		console.log(end - start);
	};

	React.useEffect(() => {
		fetchHeatmapData();
		eventEmitter.on(EVENTS.REFRESH_EVERYTHING, fetchHeatmapData);
		return () => {
			eventEmitter.off(EVENTS.REFRESH_EVERYTHING, fetchHeatmapData);
		};
	}, []);

	const today = new Date();

	const getMonthLabels = () => {
		const labels = [];
		let lastMonth = -1;

		for (let week = 0; week < weeksToShow; week++) {
			const date = getDateForCell(week, 0);

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
								<div key={weekIndex} className="heatmap-column">
									{Array(7)
										.fill(null)
										.map((_, dayIndex) => {
											const date = getDateForCell(
												weekIndex,
												dayIndex,
											);
											const dateStr = formatDate(date);
											const count =
												heatmapData[dateStr] ?? 0;
											return (
												<HeatmapCell
													key={dateStr}
													count={count}
													date={dateStr}
													intensity={getIntensityLevel(
														count,
														intensityLevels,
													)}
												/>
											);
										})}
								</div>
							))}
					</div>
				</div>
			</div>
		</RadixTooltip.Provider>
	);
};
