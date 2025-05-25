import { formatDate } from "./utils/dateUtils";
import {
	Plugin,
	TFile,
	TAbstractFile,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	Notice,
} from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";

import {
	ColorConfig,
	DEFAULT_SETTINGS,
	STARTING_STATS,
	PluginData,
} from "@/defs/types";
import { removeDuplicatedDailyEntries } from "./db/queries";

import { db } from "@/db/db";
import { EVENTS, state } from "@/core/pluginState";
import { PluginView, VIEW_TYPE } from "@/ui/views/PluginView";

import { SettingsTab } from "@/ui/views/SettingsTab";
import { SlotWrapper } from "./ui/components/SlotWrapper";
import { Heatmap } from "@/ui/components/Heatmap";
import { Entries } from "./ui/components/Entries";

import { migrateDataFromOldFormat } from "./utils/migrateData";
import { parseQueryToJSEP, parseSlotQuery } from "./core/codeBlockQuery";
import * as utils from "@/utils/utils";
import * as events from "@/core/events";
import { emit } from "process";

export default class KeepTheRhythm extends Plugin {
	data: PluginData = {
		schema: "0.2",
		settings: DEFAULT_SETTINGS,
		stats: {
			dailyActivity: [],
		},
	};
	codeBlockRoots: Map<
		HTMLElement,
		{ root: any; ctx: MarkdownPostProcessorContext; source: string }
	> = new Map();
	private JSON_DEBOUNCE_TIME = 1000;
	private JsonDebounceTimeout: any = null;

	// #region Initialization
	private async backupDataToVault(data: any) {
		console.log("Saving backup");

		const folderPath = ".keep-the-rhyhtm";
		const fileName = `backup-${formatDate(new Date())}.json`;
		const backupPath = `${folderPath}/${fileName}`;
		const jsonData = JSON.stringify(data, null, 2);

		const folderExists = await this.app.vault.adapter.exists(folderPath);
		if (!folderExists) {
			console.log("No backup folder, creating one...");
			await this.app.vault.adapter.mkdir(folderPath);
		}

		// List files in the hidden folder
		const backups = await this.app.vault.adapter.list(folderPath);
		// adapter.list returns { files: string[], folders: string[] }
		const backupFiles = backups.files.filter((f) => f.endsWith(".json"));

		if (data.schema !== "0.2") {
			console.log("Current schema found, checking backups...");
			// Compare against all existing backups
			for (const filePath of backupFiles) {
				const contents = await this.app.vault.adapter.read(filePath);
				if (contents === jsonData) {
					new Notice("KTR: No changes to backup.");
					return; // Exit early if same content exists
				}
			}
			// No identical backup found, save new one
			await this.app.vault.adapter.write(backupPath, jsonData);
			new Notice("KTR: New backup saved.");
		} else {
			console.log("Old schema: saving data from previous versions!");
			if (backupFiles.length === 0) {
				await this.app.vault.adapter.write(backupPath, jsonData);
				new Notice("KTR: First backup created.");
			} else {
				// Get most recent file by name (sorted descending)
				const latestFilePath = backupFiles.sort((a, b) =>
					b.localeCompare(a),
				)[0];
				await this.app.vault.adapter.write(latestFilePath, jsonData);
				new Notice(
					`KTR: Backup ${latestFilePath.split("/").pop()} updated.`,
				);
			}
		}
	}

	private async migrateDataFromJSON(loadedData: any) {
		const previousStats = migrateDataFromOldFormat(loadedData);
		this.data.stats = previousStats.stats;
		this.data.schema = "0.2";

		if (this.data.stats) {
			await db.dailyActivity.bulkAdd(this.data.stats.dailyActivity);
		}
	}

	private async initializeDataFromJSON(loadedData: PluginData) {
		if (loadedData.settings) {
			this.data.settings = {
				...DEFAULT_SETTINGS,
				...loadedData.settings,
			};
		}
		if (loadedData.stats) {
			this.data.stats = loadedData.stats;

			const dailyActivitiesFromJSON =
				this.data.stats?.dailyActivity || [];

			try {
				/** BulkPut updates the records if they already exist! */
				await db.dailyActivity.bulkPut(dailyActivitiesFromJSON);
			} catch (error) {
				console.error(
					"Failed loading some data, contact the developer.",
					error,
				);
			}
		}
	}

	async onload() {
		// #region JSON

		// Sei lá meu :\
		db.dailyActivity.clear();

		/** Information from source of truth (data.json) */
		const loadedData = await this.loadData();

		if (loadedData) {
			await this.backupDataToVault(loadedData);
		}

		/** Data is only loaded into dexie if it's the correct schema */
		if (loadedData && loadedData.schema === "0.2") {
			await this.initializeDataFromJSON(loadedData);
		} else if (loadedData && loadedData.schema !== "0.2") {
			new Notice("KTR: Migrating data from previous versions...");
			await this.migrateDataFromJSON(loadedData);
		} else if (!loadedData) {
			this.data.schema = "0.2";
			this.data.stats = {
				...STARTING_STATS,
			};
		} else {
			this.data.stats = loadedData.stats;
			this.data.settings = loadedData.settings;
		}

		await this.saveData(this.data);

		// #endregion

		// #region STATE SETUP

		/** Setup state / cache / etc. */
		state.setPlugin(this);
		state.setToday();

		// START CACHE SOMEWHERE HERE
		// START SAVING DATA LOOP / JSON / DEBOUNCE HERE
		// this.saveDataToJSON();

		// /** Set of utility functions that registers required objects and sets plugin state */

		/** Initialize SIDEBAR view */
		this.registerView(VIEW_TYPE, (leaf) => {
			return new PluginView(leaf, this);
		});

		this.initializeCommands(); // Initialize COMMAND PALETTE options
		this.initializeEvents(); // Registers all EVENTS to obsidian API
		this.applyColorStyles(); // Applies color styles (CSS Custom Properties) to app container
		this.addSettingTab(new SettingsTab(this.app, this)); // Registers the settings tab for plugin configuration

		/** Registers CUSTOM CODE BLOCKS */
		this.registerMarkdownCodeBlockProcessor(
			"ktr-heatmap",
			this.createHeatmapCodeBlock(),
		);

		this.registerMarkdownCodeBlockProcessor(
			"ktr-slots",
			this.createSlotsCodeBlock(),
		);

		this.registerMarkdownCodeBlockProcessor(
			"ktr-entries",
			this.createEntriesCodeBlock(),
		);

		state.on(EVENTS.REFRESH_EVERYTHING, async () => {
			if (this.JsonDebounceTimeout)
				clearTimeout(this.JsonDebounceTimeout);

			this.JsonDebounceTimeout = setTimeout(async () => {
				await this.saveDataToJSON();
			}, this.JSON_DEBOUNCE_TIME);
		});
	}

	private applyColorStyles() {
		const containerStyle = this.app.workspace.containerEl.style;
		let light = undefined;
		let dark = undefined;

		if (this.data.settings?.heatmapConfig?.colors) {
			light = this.data.settings.heatmapConfig.colors?.light;
			dark = this.data.settings.heatmapConfig.colors?.dark;
		}

		if (light && dark) {
			for (let i = 0; i <= 4; i++) {
				const key = i as keyof ColorConfig;
				containerStyle.setProperty(`--light-${i}`, light[key]);
				containerStyle.setProperty(`--dark-${i}`, dark[key]);
			}
		}
	}

	private createEntriesCodeBlock(): (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	) => void {
		return (
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext,
		) => {
			if (!this.data || !this.data.settings) {
				return;
			}

			const container = el.createDiv("slots-codeblock");
			const root = createRoot(container);
			this.codeBlockRoots.set(el, { root, ctx, source });

			let date;
			if (source.trim() !== "") {
				date = source.trim();
			}
			root.render(
				React.createElement(Entries, {
					date: date,
				}),
			);

			// ctx.addChild(
			// 	new (class extends MarkdownRenderChild {
			// 		constructor(containerEl: HTMLElement) {
			// 			super(containerEl);
			// 		}
			// 		onunload() {
			// 			root.unmount();
			// 		}
			// 	})(container),
			// );
			return;
		};
	}

	private createSlotsCodeBlock(): (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	) => void {
		return (
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext,
		) => {
			if (!this.data || !this.data.settings) {
				return;
			}

			const config = parseSlotQuery(source);
			if (config.length === 0) return;

			const container = el.createDiv("slots-codeblock");
			const root = createRoot(container);
			this.codeBlockRoots.set(el, { root, ctx, source });

			root.render(
				React.createElement(SlotWrapper, {
					slots: config,
					isCodeBlock: true,
				}),
			);

			// ctx.addChild(
			// 	new (class extends MarkdownRenderChild {
			// 		constructor(containerEl: HTMLElement) {
			// 			super(containerEl);
			// 		}
			// 		onunload() {
			// 			root.unmount();
			// 		}
			// 	})(container),
			// );
			return;
		};
	}

	private createHeatmapCodeBlock(): (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	) => void {
		return (
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext,
		) => {
			if (!this.data || !this.data.settings) {
				return;
			}

			// if (source.trim() !== "") return

			const query = parseQueryToJSEP(source.trim());
			if (!query?.options) return;

			const container = el.createDiv("heatmap-codeblock");
			const root = createRoot(container);
			this.codeBlockRoots.set(el, { root, ctx, source });

			root.render(
				React.createElement(Heatmap, {
					heatmapConfig: query?.options,
					query: query?.filter,
					isCodeBlock: true,
				}),
			);

			ctx.addChild(
				new (class extends MarkdownRenderChild {
					constructor(containerEl: HTMLElement) {
						super(containerEl);
					}
					onunload() {
						root.unmount();
					}
				})(container),
			);
			return;
		};
	}

	private initializeCommands() {
		this.addRibbonIcon("calendar-days", "Word Count Stats", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-keep-the-rhythm",
			name: "Open tracking heatmap",
			callback: () => {
				this.activateView();
			},
		});
	}
	private initializeEvents() {
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor, info) => {
				events.handleEditorChange(editor, info, this);
			}),
		);
		this.registerEvent(
			this.app.vault.on("delete", (file: TAbstractFile) => {
				if (file instanceof TFile) events.handleFileDelete(file);
			}),
		);
		this.registerEvent(
			this.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile) events.handleFileCreate(file);
			}),
		);
		this.registerEvent(
			this.app.vault.on(
				"rename",
				(file: TAbstractFile, oldPath: string) => {
					if (file instanceof TFile)
						events.handleFileRename(file, oldPath);
				},
			),
		);
		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (file) events.handleFileOpen(file);
			}),
		);
	}

	// #endregion

	// #region Unloading

	async onunload() {
		events.cleanDBTimeout();

		if (this.JsonDebounceTimeout) {
			clearTimeout(this.JsonDebounceTimeout);
		}
		this.saveDataToJSON();
		this.backupDataToVault(this.data);

		await db.dailyActivity.clear();
	}

	// #endregion

	async onExternalSettingsChange() {
		try {
			const newData = (await this.loadData()) as PluginData;

			if (JSON.stringify(newData) == JSON.stringify(this.data)) {
				return;
			}

			newData.stats?.dailyActivity.forEach(async (activity, index) => {
				let existingActivity;

				if (activity.id) {
					existingActivity = await db.dailyActivity.get(activity.id);
				}

				/** Find any new activity and add it to the db */
				if (
					existingActivity &&
					JSON.stringify(existingActivity) ===
						JSON.stringify(activity)
				) {
					return;
				} else {
					db.dailyActivity.put(activity);
				}
			});

			/** Assign new external settings*/
			if (this.data.settings !== newData.settings) {
				this.data.settings = {
					...DEFAULT_SETTINGS,
					...newData.settings,
				};
			}

			state.emit(EVENTS.REFRESH_EVERYTHING);
			//TODO: ADD "SAVE AND UPDATE" HERE + EMIT UPDATE TO PLUGIN STATE
		} catch (error) {
			console.error("Error in onExternalSettingsChange:", error);
		}
	}

	// #region SAVING DATA

	private async saveDataToJSON() {
		const dailyActivityDB = await db.dailyActivity.toArray();

		this.data.stats = {
			dailyActivity: dailyActivityDB,
		};

		await this.saveData(this.data);
	}

	public async updateCurrentStreak(increase: boolean) {
		if (!this.data.stats) return;

		// TODO: check previous date to  see when was the last one

		if (!this.data.stats.daysWithCompletedGoal) {
			this.data.stats.daysWithCompletedGoal = [];
		}

		const { longestStreak, currentStreak } = utils.getDateStreaks(
			this.data.stats.daysWithCompletedGoal,
		);

		if (increase) {
			if (this.data.stats.daysWithCompletedGoal.includes(state.today)) {
				return;
			}
			this.data.stats.daysWithCompletedGoal.push(state.today);
		} else {
			if (this.data.stats.daysWithCompletedGoal.includes(state.today)) {
				const newArray = this.data.stats.daysWithCompletedGoal?.filter(
					(item) => item !== state.today,
				);
				this.data.stats.daysWithCompletedGoal = newArray;
			}
		}
	}

	public async updateAndSaveEverything() {
		await this.saveData(this.data);
		state.emit(EVENTS.REFRESH_EVERYTHING);
	}

	public async quietSave() {
		await this.saveData(this.data);
	}

	private async saveTodayDataToJSON() {
		const start = performance.now();
		const dailyActivity = await db.dailyActivity
			.where("date")
			.equals(state.today)
			.toArray();

		// Merge with existing data rather than overwriting
		this.data.stats = {
			...this.data.stats,
			dailyActivity: [
				...(this.data.stats?.dailyActivity?.filter(
					(a) => a.date !== state.today,
				) || []),
				...dailyActivity,
			],
		};

		const end = performance.now();
		//     await this.saveData(this.data);
	}

	// #endregion

	/**
	 * @function activateView opens the SIDEBAR plugin view
	 */
	async activateView() {
		// Return if view already exists
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length > 0) return;

		// Get the leaf and focus on it
		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE,
				active: true,
			});
		}
	}
}
