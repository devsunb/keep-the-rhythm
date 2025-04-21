import { TFile, Editor } from "obsidian";
import { DailyActivity, db } from "./db/db";
import KeepTheRhythm from "./main";
import { getExternalWordCount, getWordCount } from "@/wordCounting";
import { formatDate, log, getFileContent } from "./utils";

export async function handleEditorPaste(
	clip: ClipboardEvent,
	editor: Editor,
	info: any,
	plugin: KeepTheRhythm,
) {
	// console.log("EVENT: PASTED");
}

async function updateDatabase(path: string, deltaWords: number) {
	const start = performance.now();
	const today = formatDate(new Date());

	await db.dailyActivity
		.where("[date+filePath]")
		.equals([today, path])
		.modify((dailyEntry) => {
			if (dailyEntry) {
				dailyEntry.wordsWritten =
					(dailyEntry.wordsWritten || 0) + deltaWords;
			}
		});

	const dailyEntry = await db.dailyActivity
		.where("[date+filePath]")
		.equals([today, path])
		.first();

	if (dailyEntry) {
		await db.dailyActivity.update(dailyEntry, {
			wordsWritten: dailyEntry?.wordsWritten + deltaWords,
		});

		// await db.dailyActivity.get(dailyEntry.id!).then((item) => {
		// 	console.log(item?.wordsWritten);
		// });
	}

	eventEmitter.emit(EVENTS.REFRESH_EVERYTHING);
	const end = performance.now();
	console.log(end - start);
}

let currentFilePath: string | null = null;
let lastProcessedContent: string = "";
let lastProcessedWordCount: number = 0;
let accumulatedWordsDelta: number = 0;
let dbUpdateTimeout: NodeJS.Timeout | null = null;

// Debounce time in milliseconds
const DEBOUNCE_TIME = 100; // 2 seconds

export function handleEditorChange(
	editor: Editor,
	info: any,
	plugin: KeepTheRhythm,
) {
	// Make sure we have a valid file
	const file = info.file;
	if (!file || file.extension !== "md") {
		return;
	}

	const filePath = file.path;
	const currentContent = info.data;

	// If we've switched to a different file, update DB and reset tracking
	if (currentFilePath !== filePath) {
		// If we have accumulated changes for the previous file, save them
		if (currentFilePath && accumulatedWordsDelta !== 0) {
			flushChangesToDB(file);
		}

		// Reset for new file
		currentFilePath = filePath;
		lastProcessedContent = "";
		lastProcessedWordCount = 0;
		accumulatedWordsDelta = 0;

		// Clear any pending timeouts
		if (dbUpdateTimeout) {
			clearTimeout(dbUpdateTimeout);
			dbUpdateTimeout = null;
		}
	}

	// Process any changes, including when content might match lastSavedData
	// This ensures we catch deletions even when the file is saved afterward

	// Get current word count
	const currentWordCount = getExternalWordCount(
		currentContent,
		plugin.data.settings.enabledLanguages,
	);

	// Handle first time seeing this file
	if (!lastProcessedContent) {
		lastProcessedContent = currentContent;
		lastProcessedWordCount = currentWordCount;
		return;
	}

	// Calculate delta - will be negative for deletions
	const wordsDelta = currentWordCount - lastProcessedWordCount;

	// Only proceed if there's a change in word count
	if (wordsDelta !== 0) {
		// console.log(`File: ${filePath}`);
		// console.log("Words changed in this edit:", wordsDelta);
		// console.log("Current word count:", currentWordCount);

		// Accumulate changes
		accumulatedWordsDelta += wordsDelta;

		// Reset the debounce timer
		if (dbUpdateTimeout) {
			clearTimeout(dbUpdateTimeout);
		}

		// Set a new timer to update the database after the debounce period
		dbUpdateTimeout = setTimeout(() => {
			flushChangesToDB(file);
			dbUpdateTimeout = null;
		}, DEBOUNCE_TIME);

		// Update our word count reference
		lastProcessedWordCount = currentWordCount;
	}

	// Always update our reference content
	lastProcessedContent = currentContent;
}

function flushChangesToDB(file: TFile) {
	if (accumulatedWordsDelta === 0) return;

	console.log(
		`Updating database with accumulated change of ${accumulatedWordsDelta} words`,
	);

	// Update the database with accumulated changes
	updateDatabase(file.path, accumulatedWordsDelta);

	// Reset accumulator
	accumulatedWordsDelta = 0;
}

// Clean up when plugin is unloaded
export function cleanup() {
	if (dbUpdateTimeout) {
		clearTimeout(dbUpdateTimeout);
	}

	// If there are any pending changes, flush them
	if (currentFilePath && accumulatedWordsDelta !== 0) {
		const app = window.app;
		const file = app.vault.getFileByPath(currentFilePath);
		if (file) {
			flushChangesToDB(file as TFile);
		}
	}
}
export async function handleFileModify(file: TFile, plugin: KeepTheRhythm) {}

export function handleFileDelete(file: TFile) {}

export function handleFileCreate(file: TFile) {}

export function handleFileRename(file: TFile) {}

export async function handleFileOpen(file: TFile, plugin: KeepTheRhythm) {
	const today = formatDate(new Date());
	const existingEntry = await db.dailyActivity
		.where("[date+filePath]")
		.equals([today, file.path])
		.first();

	if (!existingEntry) {
		console.log("entry DOES NOT exist");

		const content = await plugin.app.vault.read(file);

		await db.dailyActivity.add({
			date: today,
			filePath: file.path,
			device: plugin.deviceId,
			wordCountStart: getExternalWordCount(
				content,
				plugin.data.settings.enabledLanguages,
			),
			charCountStart: content.length,
			wordsWritten: 0,
			charsWritten: 0,
			created: false,
		});
	}
}

type Listener = (...args: any[]) => void;

class EventEmitter {
	private events: Record<string, Listener[]> = {};

	on(event: string, listener: Listener): void {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(listener);
	}

	off(event: string, listener: Listener): void {
		if (!this.events[event]) return;
		this.events[event] = this.events[event].filter((i) => i !== listener);
	}

	emit(event: string, ...args: any[]): void {
		if (!this.events[event]) return;
		this.events[event].forEach((listener) => listener(...args));
	}
}

export const eventEmitter = new EventEmitter();

export const EVENTS = {
	REFRESH_EVERYTHING: "REFRESH_EVERYTHING",
	// Add more events as needed
};

// let currentFilePath: string | null = null;
// let lastProcessedContent: string = "";
// let lastProcessedWordCount: number = 0;

// export async function handleEditorChange(
// 	editor: Editor,
// 	info: any,
// 	plugin: KeepTheRhythm,
// ) {
// 	const file = info.file;
// 	if (!file || file.extension !== "md") {
// 		return;
// 	}

// 	if (currentFilePath !== file.path) {
// 		currentFilePath = file.path;
// 		lastProcessedContent = ""; // Reset when switching files
// 		lastProcessedWordCount = 0;
// 	}

// 	// Check if there are actual changes between saved and current file content
// 	if (info.lastSavedData != info.data) {
// 		const currentContent = info.data;
// 		console.log("changed");

// 		// Only calculate differences if we have processed content before
// 		// and the current content differs from what we last processed
// 		if (lastProcessedContent !== currentContent) {
// 			const start = performance.now();

// 			const previousWordCount = getExternalWordCount(
// 				lastProcessedContent,
// 				plugin.data.settings.enabledLanguages,
// 			);

// 			const currentWordCount = getExternalWordCount(
// 				currentContent,
// 				plugin.data.settings.enabledLanguages,
// 			);

// 			// if (wordsDelta !== 0) {
// 			// 	await updateDatabase(file.path, wordsDelta);
// 			// }

// 			lastProcessedWordCount = currentWordCount;

// 			console.log(lastProcessedWordCount);
// 		} else if (!lastProcessedContent) {
// 			// First time seeing this file, initialize the word count
// 			lastProcessedWordCount = getExternalWordCount(
// 				currentContent,
// 				plugin.data.settings.enabledLanguages,
// 			);
// 		}
// 		lastProcessedContent = currentContent;
// 	}

// 	// console.log(info.lastData);
// 	// if (!info.data || !info.lastData) {
// 	// 	return;
// 	// }

// 	// const currentContent = info.data;
// 	// const previousContent = info.lastData;

// 	// const currentWordCount = getExternalWordCount(
// 	// 	editor,
// 	// 	plugin.data.settings.enabledLanguages,
// 	// );

// 	// const wordsDelta = currentWordCount - previousWordCount;
// 	// console.log(wordsDelta);

// 	// if (wordsDelta == 0) {
// 	// 	return;
// 	// }

// 	// const file = info.file || (info.view && info.view.file);
// 	// if (!file || file.extension !== "md") {
// 	// 	return;
// 	// }

// 	// const today = formatDate(new Date());

// 	// const dailyEntry = await db.dailyActivity
// 	// 	.where("[date+filePath]")
// 	// 	.equals([today, file.path])
// 	// 	.first();

// 	// if (dailyEntry) {
// 	// 	await db.dailyActivity.update(dailyEntry.id!, {
// 	// 		wordsWritten: dailyEntry.wordsWritten + wordsDelta,
// 	// 		charsWritten:
// 	// 			dailyEntry.charsWritten +
// 	// 			(currentContent.length - previousContent.length),
// 	// 	});

// 	// 	eventEmitter.emit(EVENTS.REFRESH_EVERYTHING);
// 	// } else {
// 	// 	console.log("Creating new entry for today's activity");
// 	// }
// }

// Keep track of only the current active file
