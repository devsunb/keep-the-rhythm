import {
	Plugin,
	TFile,
	TAbstractFile,
	MarkdownView,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
} from "obsidian";
import { v4 as uuidv4 } from "uuid";
import React from "react";
import { createRoot } from "react-dom/client";

import { PluginView, VIEW_TYPE } from "@/ui/views/PluginView";
import { historicDataCache } from "./core/historicDataCache";
import { ColorConfig, DEFAULT_SETTINGS, PluginData } from "@/defs/types";
import { db, removeDuplicatedDailyEntries } from "@/db/db";
import { EVENTS, state } from "./core/pluginState";
import { SettingsTab } from "./ui/views/SettingsTab";
import { Heatmap } from "./ui/components/Heatmap";

import * as utils from "@/utils/utils";
import * as events from "@/core/events";

export default class KeepTheRhythm extends Plugin {
	regex: RegExp;
	data: PluginData;
	deviceId: string;
	view: PluginView | null;
	codeBlockRoots: Map<
		HTMLElement,
		{ root: any; ctx: MarkdownPostProcessorContext; source: string }
	> = new Map();

	// #region Initialization

	async onload() {
		/** Creates references for STATE usage across React Components */
		state.setApp(this.app);
		state.setPlugin(this);

		/**  Load information from data.json */
		const loadedData = await this.loadData();
		if (!loadedData) {
			this.data = { settings: DEFAULT_SETTINGS };
			await this.saveData(this.data);
		} else {
			this.data = loadedData;
		}

		/** Set of utility functions that registers required objects and sets plugin state */
		this.setDeviceId(); // Sets ID using LOCAL STORAGE if it doesn't exist
		this.initializeViews(); // Registers plugin SIDEBAR view
		this.initializeCommands(); // Registers all COMMANDS to obsidian API
		this.initializeEvents(); // Registers all EVENTS to obsidian API
		this.applyColorStyles(); // Applies color styles (CSS Custom Properties) to app container
		this.addSettingTab(new SettingsTab(this.app, this)); // Registers the settings tab for plugin configuration

		/** Resets historic cache used for HEATMAP component */
		historicDataCache.resetCache();

		/** Registers CUSTOM CODE BLOCKS */
		this.registerMarkdownCodeBlockProcessor(
			"keep-the-rhythm",
			this.createCodeBlockProcessor(),
		);

		// TODO: await migrateFromJSON(previousData);

		state.on(EVENTS.REFRESH_EVERYTHING, () => {
			this.saveStatsDataToJSON();
		});
	}

	private setDeviceId() {
		let id = localStorage.getItem("ktr-device-id");
		if (!id) {
			id = uuidv4();
			localStorage.setItem("ktr-device-id", id);
		}
		this.deviceId = id;
	}

	async activateView() {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length > 0) {
			return; // view is already opened
		}

		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE,
				active: true,
			});
		}
	}

	private applyColorStyles() {
		const containerStyle = this.app.workspace.containerEl.style;
		let light = undefined;
		let dark = undefined;

		if (this.data.settings.heatmapConfig.colors) {
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

	private createCodeBlockProcessor(): (
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

			const query = source.trim();
			// console.log(query);

			// TODO: IMPLEMENT QUERYING LANGUAGE PARSING

			const container = el.createDiv("heatmap-codeblock");
			const root = createRoot(container);
			this.codeBlockRoots.set(el, { root, ctx, source });

			root.render(
				React.createElement(Heatmap, {
					heatmapConfig: this.data.settings.heatmapConfig,
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

		// const filteredStats: Stats = {};

		// Object.entries(this.mergedStats).forEach(([date, dateData]) => {
		// 	const matchingFiles = Object.entries(dateData.files).filter(
		// 		([filePath]) => {
		// 			let includeFile = [];
		// 			for (const condition of pathConditions) {
		// 				const pathIncluded = filePath.includes(
		// 					condition.path,
		// 				);
		// 				if (pathIncluded && condition.isInclusion) {
		// 					includeFile.push(true);
		// 				} else if (
		// 					!pathIncluded &&
		// 					!condition.isInclusion
		// 				) {
		// 					includeFile.push(true);
		// 				} else if (pathIncluded && !condition.isInclusion) {
		// 					includeFile.push(false);
		// 				} else if (!pathIncluded && condition.isInclusion) {
		// 					includeFile.push(false);
		// 				}
		// 			}
		// 			return includeFile.every(
		// 				(condition) => condition === true,
		// 			);
		// 		},
		// 	);

		// 	if (matchingFiles.length > 0) {
		// 		const dateDelta = matchingFiles.reduce(
		// 			(total, [_, fileData]) =>
		// 				total + (fileData.current - fileData.initial),
		// 			0,
		// 		);

		// 		if (dateDelta !== 0) {
		// 			filteredStats[date] = {
		// 				totalDelta: dateDelta,
		// 				files: Object.fromEntries(matchingFiles),
		// 			};
		// 		}
		// 	}
		// });

		// const container = el.createDiv("heatmap-codeblock");
		// const root = createRoot(container);
		// this.codeBlockRoots.set(el, { root, ctx, source });

		// root.render(
		// 	React.createElement(Heatmap, {
		// 		data: filteredStats,
		// 		intensityLevels: this.pluginData.settings.intensityLevels,
		// 		...toggles,
		// 		plugin: this,
		// 	}),
		// );

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
		// };
	}

	private initializeViews() {
		this.registerView(VIEW_TYPE, (leaf) => {
			this.view = new PluginView(leaf, this);
			return this.view;
		});
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

		this.addCommand({
			id: "open-keep-the-rhythm",
			name: "Remove duplicated entries",
			callback: () => {
				removeDuplicatedDailyEntries();
			},
		});

		this.addCommand({
			id: "mock-data",
			name: "Mock data for last month",
			callback: () => {
				utils.mockMonthDailyActivity();
				state.emit(EVENTS.REFRESH_EVERYTHING);
			},
		});

		this.addCommand({
			id: "delete-db",
			name: "Delete database",
			callback: () => {
				db.dailyActivity.clear();
				db.fileStats.clear();
				// emit refresh
			},
		});

		this.addCommand({
			id: "reset-keep-the-rhythm",
			name: "Reset Settings",
			callback: () => {
				this.data.settings = DEFAULT_SETTINGS;
				this.saveData(this.data);
				console.log(this.data.settings.sidebarConfig.slots);
				utils.log("settings reseted");
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
					db.dailyActivity.add(activity);
				}
			});

			/** Assign new external settings*/
			if (this.data.settings !== newData.settings) {
				this.data.settings = newData.settings;
			}

			//TODO: ADD "SAVE AND UPDATE" HERE + EMIT UPDATE TO PLUGIN STATE
		} catch (error) {
			console.error("Error in onExternalSettingsChange:", error);
		}
	}

	// #region SAVING DATA

	public async updateAndSaveEverything() {
		await this.saveData(this.data);
		console.log("saving everything");
		state.emit(EVENTS.REFRESH_EVERYTHING);
	}

	public async quietSave() {
		console.log("saving to json");
		await this.saveData(this.data);
	}

	private async saveStatsDataToJSON() {
		const start = performance.now();
		const fileStats = await db.fileStats.toArray();
		const dailyActivity = await db.dailyActivity.toArray();

		this.data.stats = {
			fileStats: fileStats,
			dailyActivity: dailyActivity,
		};

		await this.saveData(this.data);
		const end = performance.now();
		// utils.log(`${end - start}`);
	}

	// #endregion
}
