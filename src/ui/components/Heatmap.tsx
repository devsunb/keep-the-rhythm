import { historicDataCache } from "@/core/historicDataCache";
import {
	getDateForCell,
	weeksToShow,
	weekdaysNames,
	monthNames,
	formatDate,
} from "@/utils/utils";
import { getTotalValueByDate } from "@/db/db";
import React from "react";
import { Unit, HeatmapColorModes, HeatmapConfig } from "@/defs/types";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { moment as _moment } from "obsidian";
import { HeatmapCell } from "./HeatmapCell";
import { EVENTS, state } from "@/core/pluginState";

interface HeatmapProps {
	heatmapConfig: HeatmapConfig;
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
export const Heatmap = ({ heatmapConfig }: HeatmapProps) => {
	const [heatmapData, setHeatmapData] = React.useState<
		Record<string, number>
	>({});

	const fetchHeatmapData = async () => {
		const start = performance.now();
		let data: Record<string, number> = {};

		if (state.cacheExists) {
			data = state.historicalCache;
		} else {
			data = await state.resetCache();
		}

		await getTotalValueByDate(state.today, Unit.WORD).then((todayEntry) => {
			data[state.today] = todayEntry;
		});

		setHeatmapData({ ...data });

		const end = performance.now();
	};

	React.useEffect(() => {
		fetchHeatmapData();
		state.on(EVENTS.REFRESH_EVERYTHING, fetchHeatmapData);

		return () => {
			state.off(EVENTS.REFRESH_EVERYTHING, fetchHeatmapData);
		};
	}, []);

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
		</RadixTooltip.Provider>
	);
};
