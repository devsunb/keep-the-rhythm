import { normalizePath, TFile } from "obsidian";
import { DEFAULT_SETTINGS, PluginData } from "../defs/types";
import { TimeEntry, DailyActivity } from "../db/types";

export type OldFormat = {
	settings: {
		intensityLevels: {
			low: number;
			medium: number;
			high: number;
		};
		colors: {
			light: Record<string, string>;
			dark: Record<string, string>;
		};
		showOverview: boolean;
		showEntries: boolean;
		showHeatmap: boolean;
		enabledScripts: string[];
	};
	devices: {
		[deviceId: string]: {
			[date: string]: {
				files: {
					[filePath: string]: {
						initial: number;
						current: number;
					};
				};
				totalDelta: number;
			};
		};
	};
};

export function convertOldDataToNewFormat(oldData: OldFormat): PluginData {
	const newFormat: PluginData = {
		settings: DEFAULT_SETTINGS,
		stats: {
			fileStats: [],
			currentStreak: 0,
			daysWithCompletedGoal: [],
			dailyActivity: [],
		},
	};

	for (const deviceId in oldData.devices) {
		const device = oldData.devices[deviceId];
		for (const date in device) {
			const dayData = device[date];
			for (const filePath in dayData.files) {
				const fileData = dayData.files[filePath];
				const wordDelta = fileData.current - fileData.initial;

				if (wordDelta <= 0) continue;

				const change: TimeEntry = {
					timeKey: "00:00",
					w: wordDelta,
					c: 0,
				};

				const activity: DailyActivity = {
					date,
					filePath,
					wordCountStart: 0,
					charCountStart: fileData.initial,
					changes: [change],
					id: Math.floor(Math.random() * 1e6), // Use UUID or deterministic hash for real apps
				};

				newFormat.stats?.dailyActivity.push(activity);

				if (wordDelta >= DEFAULT_SETTINGS.dailyWritingGoal) {
					newFormat.stats?.daysWithCompletedGoal?.push(date);
				}
			}
		}
	}

	return newFormat;
}

export async function migrateOnStart(previousData: OldFormat) {
	const newData = convertOldDataToNewFormat(previousData);
	return newData;
}
