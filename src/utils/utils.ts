import { DailyActivity, TimeEntry } from "@/db/types";
import { App } from "obsidian";
import { db } from "../db/db";
import { Unit } from "../defs/types";
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

export const getFileName = (path: string): string => {
	return path.split("/").pop() || path;
};

export const getFileNameWithoutExtension = (path: string): string => {
	const fileName = getFileName(path);
	return fileName.replace(/\.[^/.]+$/, "");
};

export const log = (msg: string) => {
	console.info(
		`%cKEEP THE RHYTHM%c ${msg}`,
		"font-weight: bold; color: purple;",
		"font-weight: normal",
	);
};

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

export const getDateForCell = (
	weekIndex: number,
	dayIndex: number,
	totalAmountOfWeeks: number,
): Date => {
	const today = new Date();
	const date = new Date(today);

	const currentDayIndex = getDayIndex(date.getDay());
	date.setDate(date.getDate() - currentDayIndex);

	// Calculate offset from the current week's Monday
	const weekOffset = weekIndex - (totalAmountOfWeeks - 1);
	date.setDate(date.getDate() + weekOffset * 7 + dayIndex);

	return date;
};

export const getDayIndex = (dayIndex: number): number => {
	return dayIndex === 0 ? 6 : dayIndex - 1;
};

// function getRandomArbitrary(min, max) {
// 	return Math.random() * (max - min) + min;
// }

export function getRandomInt(min: number, max: number) {
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

export function sumTimeEntries(
	dailyActivity: DailyActivity,
	unit: Unit,
): number {
	let total = 0;

	if (unit === Unit.WORD) {
		total += dailyActivity.wordCountStart;
		for (const entry of dailyActivity.changes) {
			total += entry.w;
		}
	}

	if (unit === Unit.CHAR) {
		total += dailyActivity.charCountStart;
		for (const entry of dailyActivity.changes) {
			total += entry.c;
		}
	}

	return total;
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
