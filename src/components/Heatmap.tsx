import { getLeafWithFile } from "../utils";
// import { useModifierKeyPressed } from "@/useModiferKey";
import { getApp } from "../utils";
import { getCorePluginSettings } from "@/windowUtility";
import { App } from "obsidian";
import { db, type DailyActivity } from "@/db";
import React from "react";
import { moment as _moment } from "obsidian";
const moment = _moment as unknown as typeof _moment.default;
import KeepTheRhythm from "../../main";
import { formatDate } from "../utils";
import { IntensityConfig } from "../types";
import * as obsidian from "obsidian";
import { weeksToShow, weekdaysNames, monthNames } from "../utils";
import { Tooltip } from "@/components/Tooltip";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import {
	appHasDailyNotesPluginLoaded,
	getAllDailyNotes,
	getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import { create } from "domain";
import { Vault } from "lucide-react";
import { useCtrlKey } from "@/useModiferKey";
interface HeatmapProps {
	intensityLevels: IntensityConfig;
}

interface HeatmapCellProps {
	intensity: number;
	count: number;
	date: string;
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

export const HeatmapCell = ({ intensity, count, date }: HeatmapCellProps) => {
	const isModifierHeld = useCtrlKey();

	const handleClick = async (event: React.MouseEvent<HTMLDivElement>) => {
		if (!isModifierHeld) return;

		const app = getApp();
		const dailyNotesSettings = getCorePluginSettings("daily-notes");
		let notePath = "";

		if (dailyNotesSettings?.folder) {
			notePath += dailyNotesSettings.folder.endsWith("/")
				? dailyNotesSettings.folder
				: dailyNotesSettings.folder + "/";
		}

		if (dailyNotesSettings?.format) {
			notePath += moment(date, "YYYY-MM-DD").format(
				dailyNotesSettings.format,
			);
		} else {
			notePath += date;
		}

		notePath += ".md";

		const existingFile = app.vault.getAbstractFileByPath(notePath);

		if (existingFile instanceof obsidian.TFile) {
			const existingLeaf = getLeafWithFile(app, existingFile);
			if (existingLeaf) {
				app.workspace.setActiveLeaf(existingLeaf);
			} else {
				app.workspace.getLeaf(true).openFile(existingFile);
			}
		} else {
			const newFile = await app.vault.create(notePath, "");
			await app.workspace.getLeaf(true).openFile(newFile);
		}
	};

	const intensityClass = "level-" + intensity + " ";
	const isTodayClass =
		date == formatDate(new Date()) ? "heatmap-square-today" : "";
	var classes = "heatmap-square " + intensityClass + isTodayClass;

	return (
		<Tooltip
			content={
				<>
					<strong>{date}</strong>
					<div>{count.toLocaleString()} words</div>
				</>
			}
		>
			<div
				onClick={handleClick}
				className={classes}
				style={{ cursor: isModifierHeld ? "pointer" : "default" }}
			></div>
		</Tooltip>
	);
};

// HEATMAP
export const Heatmap = ({ intensityLevels }: HeatmapProps) => {
	const [heatmapData, setHeatmapData] = React.useState<
		Record<string, number>
	>({});

	React.useEffect(() => {
		const fetchHeatmapData = async () => {
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

			setHeatmapData(dateMap);
		};
		fetchHeatmapData();
	}, []);

	const today = new Date();

	const getDayIndex = (dayIndex: number): number => {
		return dayIndex === 0 ? 6 : dayIndex - 1;
	};

	const getDateForCell = (weekIndex: number, dayIndex: number): Date => {
		const date = new Date(today);

		const currentDayIndex = getDayIndex(date.getDay());
		date.setDate(date.getDate() - currentDayIndex);

		// Calculate offset from the current week's Monday
		const weekOffset = weekIndex - (weeksToShow - 1);
		date.setDate(date.getDate() + weekOffset * 7 + dayIndex);

		return date;
	};

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

// const getTodayFiles = async () => {
// 	const today = formatDate(new Date());
// 	const todayData = await db.dailyActivity
// 		.where("date")
// 		.equals(today)
// 		.toArray();

// 	// return Object.entries(todayData)
// 	// 	.filter(
// 	// 		([_, wordCount]) => wordCount.current - wordCount.initial !== 0,
// 	// 	)
// 	// 	.map(([filePath, wordCount]) => ({
// 	// 		path: filePath,
// 	// 		wordCount,
// 	// 		delta: wordCount.current - wordCount.initial,
// 	// 	}));
// };

// const getDayData = async (day: string) => {
// 	db.dailyActivity.where("date").equals(day);
// };
