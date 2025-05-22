import { formatDate } from "@/utils/dateUtils";
import { DailyActivity } from "@/db/types";
import KeepTheRhythm from "@/main";
import { App } from "obsidian";

type Listener = (...args: any[]) => void;

export const EVENTS = {
	FILE_CHANGED: "FILE_CHANGED",
	// in need to create a cache of data previous from today
	// since only today will be updated it will reduce a lot of the
	// queries to the db to previous days
	REFRESH_EVERYTHING: "REFRESH_EVERYTHING",
	REFRESH_TODAY: "REFRESH_EVERYTHING",
	UPDATE_EDITOR: "UPDATE_EDITOR",
	// Add more events as needed
};

export class PluginState {
	private _currentVaultCount: number;
	private _DEBOUNCE_VAULT_READ: number = 1000;
	private _currentFileActivity: DailyActivity;
	private _today: string = formatDate(new Date());

	private _listeners: Array<() => void> = [];
	private _events: Record<string, Listener[]> = {};

	private _app: App;
	private _plugin: KeepTheRhythm;
	// private _deviceId: string;
	private _cache: Record<string, number> = {};
	private _cacheIsSet: boolean = false;
	private _reachedGoalToday: boolean = false;
	private _vaultReadTimeout: typeof setTimeout | null;

	get currentVaultCount(): number {
		return this.currentVaultCount;
	}
	get DEBOUNCE_VAULT_READ() {
		return this._DEBOUNCE_VAULT_READ;
	}
	get vaultReadTimeout() {
		return this._vaultReadTimeout;
	}
	get reachedGoalToday() {
		return this._reachedGoalToday;
	}
	get historicalCache() {
		return this._cache;
	}
	get cacheExists() {
		return this._cacheIsSet;
	}
	get app() {
		return this._app;
	}
	get plugin() {
		return this._plugin;
	}
	get currentActivity() {
		return this._currentFileActivity;
	}
	get today() {
		return this._today;
	}
	// get deviceId() {
	// 	return this._deviceId;
	// }

	setCurrentVaultCount(newVal: number) {
		this._currentVaultCount = newVal;
	}
	setVaultReadTimeout(timeout: typeof setTimeout | null) {
		this._vaultReadTimeout = timeout;
	}
	setReachedGoalToday(newValue: boolean) {
		this._reachedGoalToday = newValue;
	}

	setApp(app: App) {
		this._app = app;
	}

	setPlugin(plugin: KeepTheRhythm) {
		this._plugin = plugin;
	}
	setCurrentActivity(acitvity: DailyActivity) {
		this._currentFileActivity = acitvity;
		state.emit(EVENTS.REFRESH_EVERYTHING);
	}

	setToday(newDay: string) {
		this._today = newDay;
		this.emit(EVENTS.REFRESH_EVERYTHING);
	}

	on(event: string, listener: Listener): void {
		if (!this._events[event]) {
			this._events[event] = [];
		}
		this._events[event].push(listener);
	}
	off(event: string, listener: Listener): void {
		if (!this._events[event]) return;
		this._events[event] = this._events[event].filter((i) => i !== listener);
	}

	emit(event: string, ...args: any[]): void {
		if (!this._events[event]) return;
		this._events[event].forEach((listener) => listener(...args));
	}

	public async resetCache() {}
	// 	const requiredDates = new Set<string>();

	// 	for (let week = 0; week < weeksToShow; week++) {
	// 		for (let day = 0; day < 7; day++) {
	// 			const date = getDateForCell(week, day);
	// 			requiredDates.add(formatDate(date));
	// 		}
	// 	}

	// 	const results = await db.dailyActivity
	// 		.where("date")
	// 		.anyOf([...requiredDates])
	// 		.toArray();

	// 	const dateMap: Record<string, number> = {};
	// 	for (const entry of results) {
	// 		dateMap[entry.date] =
	// 			(dateMap[entry.date] || 0) +
	// 			Object.values(entry.changes).reduce(
	// 				(s, change) => s + change.w,
	// 				0,
	// 			);
	// 	}

	// 	this._cache = dateMap;
	// 	this._cacheIsSet = true;
	// 	return dateMap;
	// }
}

export const state = new PluginState();
