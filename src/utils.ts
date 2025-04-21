import { DailyActivity } from "./db/db";
import { App } from "obsidian";
import { db } from "./db/db";
import { IntensityConfig } from "./types";
import KeepTheRhythm from "main";
import { TFile } from "obsidian";
import { MarkdownView } from "obsidian";
import { WorkspaceLeaf } from "obsidian";

export function getLeafWithFile(app: App, file: TFile): WorkspaceLeaf | null {
	let result: WorkspaceLeaf | null = null;

	app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
		const view = leaf.view;

		if (view instanceof MarkdownView) {
			const currentFile = view.file;
			if (currentFile && currentFile.path === file.path) {
				result = leaf;
			}
		}
	});

	return result;
}

async function resetDatabase() {
	await db.delete();
	location.reload(); // Force page reload to reinitialize DB
}

// export function getCurrentDate(): string {
// 	const now = new Date();

// 	return (
// 		now.getFullYear() +
// 		"-" +
// 		String(now.getMonth() + 1).padStart(2, "0") +
// 		"-" +
// 		String(now.getDate()).padStart(2, "0")
// 	);
// }

export interface PathCondition {
	path: string;
	isInclusion: boolean;
}

export function parsePathFilters(query: string): PathCondition[] {
	const conditions: PathCondition[] = [];

	const regex = /PATH\s+((?:does\s+not\s+include)|includes)\s+"([^"]+)"/gi;
	let match;
	while ((match = regex.exec(query)) !== null) {
		const isInclusion = match[1].toLowerCase() !== "does not include";
		conditions.push({
			path: match[2],
			isInclusion,
		});
	}
	return conditions;
}

export function parseToggles(query: string) {
	const toggles = {
		showHeatmap: true,
		showOverview: true,
		showEntries: true,
	};

	const hideHeatmap = query.match(/HIDE\s+HEATMAP/i);
	const hideOverview = query.match(/HIDE\s+OVERVIEW/i);
	const hideEntries = query.match(/HIDE\s+ENTRIES/i);

	if (hideHeatmap) toggles.showHeatmap = false;
	if (hideOverview) toggles.showOverview = false;
	if (hideEntries) toggles.showEntries = false;

	return toggles;
}

export const formatDate = (date: Date): string => {
	return (
		date.getFullYear() +
		"-" +
		String(date.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(date.getDate()).padStart(2, "0")
	);
};

export const getFileName = (path: string): string => {
	return path.split("/").pop() || path;
};

export const getFileNameWithoutExtension = (path: string): string => {
	const fileName = getFileName(path);
	return fileName.replace(/\.[^/.]+$/, "");
};

export const weeksToShow = 52;
export const weekdaysNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const monthNames = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export const log = (msg: string) => {
	console.info(
		`%cKEEP THE RHYTHM%c ${msg}`,
		"font-weight: bold; color: purple;",
		"font-weight: normal",
	);
};

export function getRelativeDate(daysOffset: number) {
	const todayTime = new Date().getTime();
	const timeOffset = daysOffset * 24 * 60 * 60 * 1000;
	return new Date(todayTime + timeOffset);
}

export function getLastSevenDays() {
	return new Date(getRelativeDate(-7).setHours(0, 0, 0, 0));
}

export function getLastThirthyDays() {
	return new Date(getRelativeDate(-30).setHours(0, 0, 0, 0));
}

export function getLastYearInDays() {
	return new Date(getRelativeDate(-365).setHours(0, 0, 0, 0));
}

export function getStartOfWeek(date: Date) {
	const day = date.getDay();
	const diff = date.getDate() - day + (day === 0 ? -6 : 1);
	return new Date(date.getFullYear(), date.getMonth(), diff, 0, 0, 0, 0);
}

export async function getFileContent(file: TFile, plugin: KeepTheRhythm) {
	return await plugin.app.vault.read(file);
}

export async function openFileByPath(app: App, path: string): Promise<void> {
	const file = app.vault.getAbstractFileByPath(path);

	if (file instanceof TFile) {
		await app.workspace.getLeaf(true).openFile(file);
	} else {
		console.warn(
			`[openFileByPath] File not found or not a TFile: "${path}"`,
		);
	}
}

let appInstance: App | null = null;

export function setApp(app: App) {
	appInstance = app;
}

export function getApp(): App {
	if (!appInstance) throw new Error("App not initialized");
	return appInstance;
}

export async function mockMonthDailyActivity() {
	const today = new Date();
	const activities: DailyActivity[] = [];

	for (let i = 0; i < 30; i++) {
		const day = new Date(today);
		day.setDate(today.getDate() - i);

		const dateStr = day.toISOString().split("T")[0]; // YYYY-MM-DD

		activities.push({
			date: dateStr,
			device: "Laptop",
			filePath: `/mock/path/file-${i}.md`,
			wordsWritten: Math.floor(Math.random() * 500 + 100),
			charsWritten: Math.floor(Math.random() * 2000 + 500),
			created: false,
			wordCountStart: 0,
			charCountStart: 0,
		});
	}

	await db.dailyActivity.bulkAdd(activities);
}
