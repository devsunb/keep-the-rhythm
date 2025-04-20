import { getFileContent } from "./utils";
import { Filter } from "lucide-react";
import { TFile } from "obsidian";
import { off } from "process";
import { db } from "./db";
import KeepTheRhythm from "main";
import { getExternalWordCount, getWordCount } from "@/wordCounting";
import { formatDate } from "./utils";
import { log } from "./utils";

export async function handleFileModify(file: TFile, plugin: KeepTheRhythm) {
	if (!file || file.extension !== "md") {
		return;
	}

	const today = formatDate(new Date());
	const dailyEntry = await db.dailyActivity
		.where("[date+filePath]")
		.equals([today, file.path])
		.first();

	if (dailyEntry) {
		const content = await plugin.app.vault.read(file);
		const wordCount = getExternalWordCount(
			content,
			plugin.data.settings.enabledLanguages,
		);
		const charCount = content.length;

		if (
			wordCount != dailyEntry.wordCountStart ||
			charCount != dailyEntry.charCountStart
		) {
			await db.dailyActivity.update(dailyEntry.id!, {
				wordsWritten: wordCount - dailyEntry.wordCountStart,
				charsWritten: charCount - dailyEntry.charCountStart,
			});
		}
		const dif = wordCount - dailyEntry?.wordCountStart;
		eventEmitter.emit(EVENTS.REFRESH_EVERYTHING);
	} else {
		console.error("FILE ENTRY NOT FOUND");
	}
}

export function handleFileDelete(file: TFile) {
	console.log(file.name + " deleted");
}

export function handleFileCreate(file: TFile) {
	console.log(file.name + " created");
}

export function handleFileRename(file: TFile) {
	console.log(file.name + " renamed");
}

export async function handleFileOpen(file: TFile, plugin: KeepTheRhythm) {
	const today = formatDate(new Date());
	const existingEntry = await db.dailyActivity
		.where("[date+filePath]")
		.equals([today, file.path])
		.first();

	if (!existingEntry) {
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
	} else {
		// console.log(existingEntry);
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
