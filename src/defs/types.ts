import { DailyActivity, FileStats } from "@/db/db";

export type Language =
	| "LATIN"
	| "CJK"
	| "JAPANESE"
	| "KOREAN"
	| "CYRILLIC"
	| "GREEK"
	| "ARABIC"
	| "HEBREW"
	| "INDIC"
	| "SOUTHEAST_ASIAN";

export interface IntensityConfig {
	low: number;
	medium: number;
	high: number;
}

export interface ColorConfig {
	0: string;
	1: string;
	2: string;
	3: string;
	4: string;
}

export interface ThemeColors {
	light: ColorConfig;
	dark: ColorConfig;
}

export enum Unit {
	CHAR = "CHAR",
	WORD = "WORD",
}

export enum SlotOption {
	CURRENT_FILE = "CURRENT_FILE",
	CURRENT_STREAK = "CURRENT_STREAK", // not done yet
	THIS_DAY = "THIS_DAY", // Add progress bar towards daily goal
	THIS_WEEK = "THIS_WEEK",
	THIS_MONTH = "THIS_MONTH",
	THIS_YEAR = "THIS_YEAR",
	LAST_DAY = "LAST_DAY", // not done yet (24hours)
	LAST_WEEK = "LAST_WEEK",
	LAST_MONTH = "LAST_MONTH",
	LAST_YEAR = "LAST_YEAR",
	WHOLE_VAULT = "WHOLE_VAULT", // not done yet
	// THIS_FOLDER = "THIS_FOLDER", //not done yet
}

export enum HeatmapColorModes {
	STOPS = "STOPS",
	GRADUAL = "GRADUAL",
	SOLID = "SOLID",
	LIQUID = "LIQUID",
}

// export type SlotCalc = "TOTAL" | "AVG";

// heatmap styling
// rounded + hide week labels + hide month labels?

export interface Settings {
	dailyWritingGoal: number; // created as setting, not used anywhere yet
	enabledLanguages: Language[]; // guides the definition of REGEXes for word counting
	globalFilter?: string; // not used yet
	startOfTheWeek: "MONDAY" | "SUNDAY"; // not used yet, should be used to offset start of the week calculations and heatmap
	heatmapConfig: HeatmapConfig;
	sidebarConfig: {
		visibility: {
			showSlots: boolean;
			showHeatmap: boolean;
			showEntries: boolean;
		};
		slots: SlotConfig[];
	};
}

export interface SlotConfig {
	index: number;
	option: SlotOption;
	unit: Unit;
	calc: "TOTAL" | "AVG";
}

export interface PluginData {
	settings: Settings;
	stats?: {
		currentStreak?: number;
		highestStreak?: number;
		highestStreakStartDate?: string;
		highestStreakEndDate?: string;
		fileStats: FileStats[];
		dailyActivity: DailyActivity[];
	};
}

export interface HeatmapConfig {
	intensityMode: HeatmapColorModes;
	roundCells: boolean;
	hideMonthLabels: boolean;
	hideWeekdayLabels: boolean;
	intensityStops: {
		low: number;
		medium: number;
		high: number;
	};
	colors?: {
		light: ColorConfig;
		dark: ColorConfig;
	};
}
export const DEFAULT_SETTINGS: Settings = {
	enabledLanguages: ["LATIN"],
	dailyWritingGoal: 500,
	startOfTheWeek: "SUNDAY",
	heatmapConfig: {
		roundCells: true,
		hideMonthLabels: false,
		hideWeekdayLabels: false,
		intensityMode: HeatmapColorModes.GRADUAL,
		intensityStops: {
			low: 100,
			medium: 500,
			high: 1000,
		},
		colors: {
			light: {
				0: "#e0e0e0",
				1: "#9be9a8",
				2: "#6ad286",
				3: "#2ebd54",
				4: "#12a53e",
			},
			dark: {
				0: "#ebedf015",
				1: "#0e4429",
				2: "#006d32",
				3: "#26a641",
				4: "#39d353",
			},
		},
	},
	sidebarConfig: {
		visibility: {
			showSlots: true,
			showEntries: true,
			showHeatmap: true,
		},
		slots: [
			{
				index: 0,
				option: SlotOption.THIS_DAY,
				unit: Unit.WORD,
				calc: "TOTAL",
			},
			{
				index: 1,
				option: SlotOption.THIS_WEEK,
				unit: Unit.WORD,
				calc: "TOTAL",
			},
			{
				index: 2,
				option: SlotOption.LAST_MONTH,
				unit: Unit.WORD,
				calc: "AVG",
			},
		],
	},
};
