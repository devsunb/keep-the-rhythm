import { DailyActivity } from "../db/db";
import { App } from "obsidian";
import { db } from "../db/db";
import { IntensityConfig } from "../defs/types";
import KeepTheRhythm from "../main";
import { TFile } from "obsidian";
import { MarkdownView } from "obsidian";
import { WorkspaceLeaf } from "obsidian";
import { moment as _moment } from "obsidian";
const moment = _moment as unknown as typeof _moment.default;

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

export function getStartOfMonth(date: Date) {
	const startOfMonth = new Date(date);
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);
	return startOfMonth;
}

export function getStartOfYear(date: Date) {
	const startOfYear = new Date(date);
	startOfYear.setMonth(0, 1); // January 1st
	startOfYear.setHours(0, 0, 0, 0); // Reset time to midnight
	return startOfYear;
}

export function getLastDay() {
	return new Date(getRelativeDate(-1));
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

export async function mockMonthDailyActivity() {
	const today = new Date();
	const activities: DailyActivity[] = [];

	for (let i = 0; i < 30; i++) {
		const day = new Date(today);
		day.setDate(today.getDate() - i);

		const dateStr = day.toISOString().split("T")[0]; // YYYY-MM-DD

		// Simulate some changes throughout the day
		const changes: Record<string, { w: number; c: number }> = {};
		const sessions = Math.floor(Math.random() * 5 + 1);

		for (let j = 0; j < sessions; j++) {
			// const timestamp = new Date(
			// 	day.getTime() + j * 1000 * 60 * 60,
			// ).toISOString();
			const randomHour = getRandomInt(0, 24);
			const randomMinute = getRandomInt(0, 60);
			const timestamp =
				String(randomHour).padStart(2, "0") +
				":" +
				String(randomMinute).padStart(2, "0");
			changes[timestamp] = {
				w: Math.floor(Math.random() * 200),
				c: Math.floor(Math.random() * 1000),
			};
		}

		activities.push({
			date: dateStr,
			device: "Laptop",
			filePath: `/mock/path/file-${i}.md`,
			wordCountStart: 0,
			charCountStart: 0,
			changes,
		});
	}

	await db.dailyActivity.bulkAdd(activities);
}

export const getDateForCell = (weekIndex: number, dayIndex: number): Date => {
	const today = new Date();
	const date = new Date(today);

	const currentDayIndex = getDayIndex(date.getDay());
	date.setDate(date.getDate() - currentDayIndex);

	// Calculate offset from the current week's Monday
	const weekOffset = weekIndex - (weeksToShow - 1);
	date.setDate(date.getDate() + weekOffset * 7 + dayIndex);

	return date;
};

export const getDayIndex = (dayIndex: number): number => {
	return dayIndex === 0 ? 6 : dayIndex - 1;
};

// function getRandomArbitrary(min, max) {
// 	return Math.random() * (max - min) + min;
// }

function getRandomInt(min: number, max: number) {
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

export function floorMomentToFive(m: any) {
	const ms = 1000 * 60 * 5;
	return moment(Math.floor(m.valueOf() / ms) * ms);
}
