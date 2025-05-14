import { EVENTS, state } from "./pluginState";
import { TFile, Editor } from "obsidian";
import { DailyActivity, db } from "../db/db";
import KeepTheRhythm from "../main";
import { getLanguageBasedWordCount } from "@/core/wordCounting";
import { formatDate, floorMomentToFive } from "../utils/utils";
import { moment as _moment } from "obsidian";

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

	/** Handle mismatches between state and current opened file */
	if (!activity) {
		await handleFileOpen(info.file, plugin);
		return;
	} else if (activity?.filePath !== info.file.path) {
		await handleFileOpen(info.file, plugin);
		return;
	}

	/** Calculate CHAR and WORD deltas based on state  */
	const currentContent = editor.getValue();

	const newWordCount = getLanguageBasedWordCount(
		currentContent,
		plugin.data.settings.enabledLanguages,
	);

	const currentChanges = Object.values(state.currentActivity.changes);

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
	const changesKeys = Object.keys(state.currentActivity.changes);

	const lastTimeKey = changesKeys[changesKeys.length - 1];
	const currentTimeKey = floorMomentToFive(moment()).format("HH:mm");

	/**
	 * Check if there is already a time key (HH:mm) for a change, create one if there isn't
	 * Time keys are added in blocks of 5 minutes and snap to the nearest time
	 */

	if (!lastTimeKey || lastTimeKey !== currentTimeKey) {
		/** Time key doesn't exist or is different from the current one */
		console.log("creating new key");
		state.currentActivity.changes[currentTimeKey] = {
			w: wordsAdded || 0,
			c: charsAdded || 0,
		};
		console.log(state.currentActivity.changes);
	} else {
		/** Key exists and is equal to the current, so we just add the wordsAdded */
		console.log("using existing key");
		const lastData = state.currentActivity.changes[lastTimeKey];
		state.currentActivity.changes[lastTimeKey] = {
			w: lastData.w + wordsAdded,
			c: lastData.c + charsAdded,
		};
		console.log(state.currentActivity.changes);
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
 * @function flushChangesToDB
 * Debounced function that matches the state to the DB entries;
 */
async function flushChangesToDB(activity: DailyActivity) {
	// TODO: use this globally, making all updates on info real time by using stores but flushing them to the DB ocasionally.
	// probably here is a good moment to update the STREAK data?

	console.log("flushing to DB");
	await db.dailyActivity
		.where("[date+filePath]")
		.equals([activity.date, activity.filePath])
		.modify((dailyEntry) => {
			dailyEntry.changes = {
				...dailyEntry.changes,
				...state.currentActivity.changes,
			};
		});

	state.emit(EVENTS.REFRESH_EVERYTHING);
}

/**
 * @function cleanup
 * Clears timeouts and flushed any data on memory to the DB
 */
export function cleanup() {
	if (dbUpdateTimeout) {
		clearTimeout(dbUpdateTimeout);
	}
	flushChangesToDB(state.currentActivity);
}

/**
 * @function handleFileDelete
 * Should probably just get the fileWordCount and consider it as delta in it's dailyActivity?
 */
export function handleFileDelete(file: TFile) {}

/**
 * @function handleFileCreate
 * - Add file to FileStats table?
 */
export function handleFileCreate(file: TFile) {}

/**
 * @function handleFileRename
 * Update all references to this file to match new filepath
 */
export function handleFileRename(file: TFile) {}

/**
 * @function handleFileOpen
 * - Updates the state to match the current opened file
 * - Creates an activity for the opened file if it doens't exist
 * - Checks if the day passed to update data (maybe should be somewhere else)
 */

export async function handleFileOpen(file: TFile, plugin: KeepTheRhythm) {
	const today = formatDate(new Date());
	if (today !== state.today) {
		state.setToday(today);
	}

	if (file.path == state.currentActivity?.filePath) {
		console.log("same file as before, returning");
		return;
	}

	let entry = await db.dailyActivity
		.where("[date+filePath]")
		.equals([today, file.path])
		.first();

	// File was not yet seen today
	if (!entry) {
		const content = await plugin.app.vault.read(file);
		const currentWordCount = getLanguageBasedWordCount(
			content,
			plugin.data.settings.enabledLanguages,
		);

		const id = await db.dailyActivity.add({
			date: today,
			filePath: file.path,
			device: plugin.deviceId,
			wordCountStart: currentWordCount,
			charCountStart: content.length,
			changes: {},
		});

		entry = await db.dailyActivity.get(id);
	}

	if (entry) state.setCurrentActivity(entry);
	state.emit(EVENTS.REFRESH_EVERYTHING);
}
