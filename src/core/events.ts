import { EVENTS, state } from "./pluginState";
import { TFile, Editor } from "obsidian";
import { DailyActivity, db, TimeEntry } from "../db/db";
import KeepTheRhythm from "../main";
import { getLanguageBasedWordCount } from "@/core/wordCounting";
import { formatDate, floorMomentToFive } from "../utils/utils";
import { moment as _moment } from "obsidian";
import { emit } from "process";

const moment = _moment as unknown as typeof _moment.default;

let dbUpdateTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_TIME = 200; // ms

/**
 * @function handleEditorChange
 * Fires everytime the user makes an input inside a Markdown editor;
 */
export async function handleEditorChange(
	editor: Editor,
	info: any,
	plugin: KeepTheRhythm,
) {
	const file = info.file;

	if (!file || file.extension !== "md") {
		return;
	}

	const activity = state.currentActivity;

	//FIXME: this is creating the bug where two activities are created for the same file

	/** Handle mismatches between state and current opened file */
	if (!activity) {
		await handleFileOpen(info.file);
		return;
	} else if (activity?.filePath !== info.file.path) {
		await handleFileOpen(info.file);
		return;
	}

	/** Calculate CHAR and WORD deltas based on state  */
	const currentContent = editor.getValue();

	const newWordCount = getLanguageBasedWordCount(
		currentContent,
		plugin.data.settings.enabledLanguages,
	);

	const currentChanges: TimeEntry[] = state.currentActivity.changes;

	/**
	 * Calculates delta word count based on
	 * @var wordCountStart: amount of words the file started at the first time it was opened
	 * @var prevWordsAdded: amount of words written today (added across changes[])
	 * @var newWordCount: current amount of words in the file
	 */
	let prevWordsAdded = 0;
	let prevCharsAdded = 0;

	for (let i = 0; i < currentChanges.length; i++) {
		prevWordsAdded += currentChanges[i].w;
		prevCharsAdded += currentChanges[i].c;
	}

	const wordsAdded =
		newWordCount - (activity.wordCountStart + prevWordsAdded);
	const charsAdded =
		currentContent.length - (activity.charCountStart + prevCharsAdded);

	/**
	 * @const lastTimeKey Get's last key saved for this DailyActivity
	 * @const currentTimeKey Rounds current time to multiples of 5 so data is saved in consistent blocks
	 * Uses floors so it always rounds down (since you can write words in the future rsrs)
	 */
	const changes: TimeEntry[] = state.currentActivity.changes;

	const lastTimeKey = changes[changes.length - 1];
	const currentTimeKey = floorMomentToFive(moment()).format("HH:mm");

	/**
	 * Check if there is already a time key (HH:mm) for a change, create one if there isn't
	 * Time keys are added in blocks of 5 minutes and snap to the nearest time
	 */

	const existingEntry = changes.find(
		(entry) => entry.timeKey === currentTimeKey,
	);

	if (!existingEntry) {
		// No entry yet for this timeKey, so push a new one
		changes.push({
			timeKey: currentTimeKey,
			w: wordsAdded || 0,
			c: charsAdded || 0,
		});
	} else {
		// Entry exists, so update the word and char count
		existingEntry.w += wordsAdded;
		existingEntry.c += charsAdded;
	}

	// TODO: update to only refresh today's data
	state.emit(EVENTS.REFRESH_EVERYTHING);

	/** Debounces updates to the DB, which only happens when
	 *  the user stops editing the page for 200ms. */
	if (dbUpdateTimeout) clearTimeout(dbUpdateTimeout);
	dbUpdateTimeout = setTimeout(async () => {
		await flushChangesToDB(state.currentActivity);
	}, DEBOUNCE_TIME);
}

/**
 * @function handleFileDelete
 * Should probably just get the fileWordCount and consider it as delta in it's dailyActivity?
 */
export async function handleFileDelete(file: TFile) {
	//FUTURE: correct file delta is only calculated if the user opens the file first
	// if he doesnt there is no daily activity to get the current file count and it will not consider that into the calculations
	try {
		await db.dailyActivity
			.where("[date+filePath]")
			.equals([state.today, file.path])
			.modify((dailyEntry) => {
				let wordSum = 0;
				let charSum = 0;

				const currentTimeKey =
					floorMomentToFive(moment()).format("HH:mm");

				/** If no changed was made to the file
				 *  Then the delta is just the word count when it was opened
				 */

				if (!dailyEntry.changes || dailyEntry.changes?.length == 0) {
					dailyEntry.changes.push({
						timeKey: currentTimeKey,
						w: -dailyEntry.wordCountStart,
						c: -dailyEntry.charCountStart,
					});
					return;
				}

				/** If there where changes made,
				 *  We need to sum those changes
				 *  The last change is only included if it's timekey isn't the current one
				 */
				// Get the last change (if any)
				const lastEntry =
					dailyEntry.changes[dailyEntry.changes.length - 1];
				const lastTimeKey = lastEntry?.timeKey;

				for (let i = 0; i < dailyEntry.changes.length - 1; i++) {
					wordSum += dailyEntry.changes[i].w;
					charSum += dailyEntry.changes[i].c;
				}

				// If lastTimeKey is not the same as current, include it
				if (lastEntry && lastTimeKey !== currentTimeKey) {
					wordSum += lastEntry.w;
					charSum += lastEntry.c;
				}

				const newEntry: TimeEntry = {
					timeKey: currentTimeKey,
					w: -(wordSum + dailyEntry.wordCountStart),
					c: -(charSum + dailyEntry.charCountStart),
				};

				// Find and update the existing entry if it exists
				const existingIndex = dailyEntry.changes.findIndex(
					(e) => e.timeKey === currentTimeKey,
				);

				if (existingIndex !== -1) {
					dailyEntry.changes[existingIndex] = newEntry;
				} else {
					dailyEntry.changes.push(newEntry);
				}
			});

		state.emit(EVENTS.REFRESH_EVERYTHING);
	} catch (error) {
		console.error(`KTR failed deleting ${file.path} | ${error}`);
	}
}

/**
 * @function handleFileCreate
 * - Add file to FileStats table?
 */
export function handleFileCreate(file: TFile) {}

/**
 * @function handleFileRename
 * Update all references to this file to match new filepath
 */
export async function handleFileRename(file: TFile, oldPath: string) {
	try {
		await db.dailyActivity
			.where("filePath")
			.equals(oldPath)
			.modify((dailyEntry) => {
				dailyEntry.filePath = file.path;
			});

		state.emit(EVENTS.REFRESH_EVERYTHING);
	} catch (error) {
		console.error(`KTR failed renaming ${file.path} | ${error}`);
	}
}

/**
 * @function handleFileOpen
 * - Updates the state to match the current opened file
 * - Creates an activity for the opened file if it doens't exist
 * - Checks if the day passed to update data (maybe should be somewhere else)
 */

export async function handleFileOpen(file: TFile) {
	const today = formatDate(new Date());
	if (today !== state.today) {
		state.setToday(today);
	}

	if (file.path == state.currentActivity?.filePath) {
		return;
	}

	let entry = await db.dailyActivity
		.where("[date+filePath]")
		.equals([state.today, file.path])
		.first();

	// File was not yet seen today
	if (!entry) {
		const content = await state.plugin.app.vault.read(file);
		const currentWordCount = getLanguageBasedWordCount(
			content,
			state.plugin.data.settings.enabledLanguages,
		);

		const id = await db.dailyActivity.add({
			date: state.today,
			filePath: file.path,
			wordCountStart: currentWordCount,
			charCountStart: content.length,
			changes: [],
		});

		entry = await db.dailyActivity.get(id);
	}

	if (entry) state.setCurrentActivity(entry);
	state.emit(EVENTS.REFRESH_EVERYTHING);
}

/**
 * @function flushChangesToDB
 * Debounced function that matches the state to the DB entries;
 */
async function flushChangesToDB(activity: DailyActivity) {
	// TODO: use this globally, making all updates on info real time by using stores but flushing them to the DB ocasionally.
	// probably here is a good moment to update the STREAK data?

	if (!activity) return;

	await db.dailyActivity
		.where("[date+filePath]")
		.equals([activity.date, activity.filePath])
		.modify((dailyEntry) => {
			const existingChanges: TimeEntry[] = dailyEntry.changes || [];
			const currentChanges: TimeEntry[] = activity.changes;

			// Convert existing changes to a map
			const mergedMap: Record<string, TimeEntry> = {};
			for (const entry of existingChanges) {
				mergedMap[entry.timeKey] = { ...entry };
			}

			for (const entry of currentChanges) {
				if (mergedMap[entry.timeKey]) {
					mergedMap[entry.timeKey].w += entry.w;
					mergedMap[entry.timeKey].c += entry.c;
				} else {
					mergedMap[entry.timeKey] = { ...entry };
				}
			}

			// Convert map back to array and sort by timeKey
			dailyEntry.changes = Object.values(mergedMap).sort((a, b) =>
				a.timeKey.localeCompare(b.timeKey),
			);
		});

	state.emit(EVENTS.REFRESH_EVERYTHING);
}

/**
 * @function cleanDBTimeout
 * Clears timeouts and flushed any data on memory to the DB
 */
export function cleanDBTimeout() {
	if (dbUpdateTimeout) {
		clearTimeout(dbUpdateTimeout);
	}
	flushChangesToDB(state.currentActivity);
}
