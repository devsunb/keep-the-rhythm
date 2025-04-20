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
	THIS_DAY = "THIS_DAY",
	THIS_WEEK = "THIS_WEEK",
	THIS_MONTH = "THIS_MONTH",
	THIS_YEAR = "THIS_YEAR",
	LAST_DAY = "LAST_DAY",
	LAST_WEEK = "LAST_WEEK",
	LAST_MONTH = "LAST_MONTH",
	LAST_YEAR = "LAST_YEAR",
}

// export type SlotUnit = "CHAR" | "WORD";
// export type SlotCalc = "TOTAL" | "AVG";

export interface Settings {
	enabledLanguages: Language[];
	intensityStops: IntensityConfig;
	sidebarConfig: {
		visibility: {
			showOverview: boolean;
			showHeatmap: boolean;
			showEntries: boolean;
		};
		slots: SlotConfig[];
	};
	colors?: {
		light: ColorConfig;
		dark: ColorConfig;
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
		fileStats: {};
		dailyActivity: {};
	};
}

export const DEFAULT_SETTINGS: Settings = {
	enabledLanguages: ["LATIN"],
	sidebarConfig: {
		visibility: {
			showOverview: true,
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
};
