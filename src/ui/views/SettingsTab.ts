import React from "react";
import ReactDOM from "react-dom/client";
import { Heatmap } from "../components/Heatmap";
import { createRoot } from "react-dom/client";
import {
	App,
	PluginSettingTab,
	Setting,
	Modal,
	DropdownComponent,
} from "obsidian";
// import { IntensityConfig, ColorConfig, ThemeColors } from "src/types";
import {
	IntensityConfig,
	ColorConfig,
	ThemeColors,
	DEFAULT_SETTINGS,
	Language,
	HeatmapColorModes,
	HeatmapConfig,
} from "@/defs/types";

class ConfirmationModal extends Modal {
	private onConfirm: () => void;
	private onCancel: () => void;
	private message: string;
	private confirmText: string;

	constructor(
		app: App,
		message: string,
		onConfirm: () => void,
		onCancel?: () => void,
		confirmText = "Confirm",
	) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel || (() => {});
		this.confirmText = confirmText;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h3", { text: "Confirm action" });
		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText("Cancel").onClick(() => {
					this.onCancel();
					this.close();
				}),
			)
			.addButton((button) =>
				button
					.setButtonText(this.confirmText)
					.setCta()
					.onClick(() => {
						this.onConfirm();
						this.close();
					}),
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

interface SettingsTabOptions {
	intensityLevels: IntensityConfig;
	showOverview: boolean;
	showHeatmap: boolean;
	showEntries: boolean;
	colors: ThemeColors;
	enabledScripts: Language[];
	onIntensityLevelsChange: (newLevels: IntensityConfig) => void;
	onShowOverviewChange: (newShowOverview: boolean) => void;
	onShowEntriesChange: (newShowEntries: boolean) => void;
	onShowHeatmapChange: (newShowHeatmap: boolean) => void;
	onColorsChange: (newColors: ThemeColors) => void;
	onEnabledScriptsChange: (scripts: Language[]) => void;
}

export class SettingsTab extends PluginSettingTab {
	private plugin: any;
	private options: SettingsTabOptions;

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async changeColorMode(value: string) {
		this.plugin.data.settings.heatmapConfig.intensityMode = value;
		await this.plugin.updateAndSaveEverything();
		this.display();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h5", { text: "General" });

		new Setting(containerEl)
			.setName("Writing Goal")
			.setDesc("Amount of words you intend to write on a day")
			.addText((text) =>
				text
					.setPlaceholder("500")
					.setValue(this.plugin.data.settings.dailyWritingGoal)
					.onChange(async (value) => {
						this.plugin.data.settings.dailyWritingGoal = value;
						this.plugin.updateAndSaveEverything();
					}),
			);

		containerEl.createEl("hr");

		containerEl.createEl("h5", { text: "Sidebar View" });

		new Setting(containerEl)
			.setName("Show overview")
			.setDesc("Display the overview section in the word count heatmap")
			.setClass("ktr-first")
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.data.settings.sidebarConfig.visibility
							.showSlots,
					)
					.onChange(async (value) => {
						this.plugin.data.settings.sidebarConfig.visibility.showSlots =
							value;
						this.plugin.updateAndSaveEverything();
					}),
			);

		new Setting(containerEl)
			.setName("Show today's entries")
			.setDesc(
				"Display which files were edited today and their respective word counts.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.data.settings.sidebarConfig.visibility
							.showEntries,
					)
					.onChange(async (value) => {
						this.plugin.data.settings.sidebarConfig.visibility.showEntries =
							value;
						this.plugin.updateAndSaveEverything();
					}),
			);

		new Setting(containerEl)
			.setName("Show heatmap")
			.setDesc("Displays a heatmap with historic writing data.")
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.data.settings.sidebarConfig.visibility
							.showHeatmap,
					)
					.onChange(async (value) => {
						this.plugin.data.settings.sidebarConfig.visibility.showHeatmap =
							value;
						this.plugin.updateAndSaveEverything();
						this.display();
					}),
			);

		if (this.plugin.data.settings.sidebarConfig.visibility.showHeatmap) {
			new Setting(containerEl)
				.setName("Rounded Cells")
				.setClass("KTR-sub-config")
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.data.settings.heatmapConfig.roundCells,
						)
						.onChange(async (value) => {
							this.plugin.data.settings.heatmapConfig.roundCells =
								value;
							await this.plugin.updateAndSaveEverything();
							this.display();
						}),
				);

			new Setting(containerEl)
				.setName("Hide Month Labels")
				.setClass("KTR-sub-config")
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.data.settings.heatmapConfig
								.hideMonthLabels,
						)
						.onChange(async (value) => {
							this.plugin.data.settings.heatmapConfig.hideMonthLabels =
								value;
							await this.plugin.updateAndSaveEverything();
							this.display();
						}),
				);

			new Setting(containerEl)
				.setName("Hide Weekday Labels")
				.setClass("KTR-sub-config")
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.data.settings.heatmapConfig
								.hideWeekdayLabels,
						)
						.onChange(async (value) => {
							this.plugin.data.settings.heatmapConfig.hideWeekdayLabels =
								value;
							await this.plugin.updateAndSaveEverything();
							this.display();
						}),
				);
		}
		// Sidebar Filters?
		// Slot settings

		containerEl.createEl("hr");

		containerEl.createEl("h5", { text: "Code Blocks" });

		containerEl.createEl("hr");

		containerEl
			.createEl("h5", { text: "Heatmaps" })
			.onClickEvent((event) => {
				// const item = event.target.classList as DOMTokenList
				// console.log("clicked header");
			});

		// 	new Setting(containerEl)
		// 		.setName("Show overview")
		// 		.setDesc("Display the overview section in the word count heatmap")
		// 		.addToggle((toggle) =>
		// 			toggle
		// 				.setValue(this.plugin.settings.showOverview)
		// 				.onChange(async (value) => {
		// 					this.plugin.settings.showOverview = value;
		// 					this.options.onShowOverviewChange(value);
		// 				}),
		// 		);

		/**
		 * Stops vs. Gradual colors
		 * */

		// I NEED TO ADD THE CSS COLORS HERE, THEY DON'T EXIST IN THIS SCOPE FOR SOME REASON
		// const previewContainer = containerEl.createDiv({
		// 	cls: "heatmap-preview",
		// });

		// const root = ReactDOM.createRoot(previewContainer);
		// root.render(
		// 	React.createElement(Heatmap, {
		// 		heatmapConfig: this.plugin.data.settings.heatmapConfig,
		// 	}),
		// );

		new Setting(containerEl)
			.setName("Coloring Mode")
			.setDesc("Choose the heatmap coloring method.")

			.addDropdown((dropdown) => {
				dropdown
					.addOptions({ ...HeatmapColorModes })
					.setValue(
						this.plugin.data.settings.heatmapConfig.intensityMode,
					)
					.onChange(async (value) => {
						await this.changeColorMode(value);
					});
			});

		// const mode = this.plugin.data.settings.heatmapConfig.intensityMode;

		// if (mode !== HeatmapColorModes.SOLID) {
		// 	new Setting(containerEl)
		// 		.setName("Low intensity threshold")
		// 		.setDesc("Minimum word count to be considered low intensity")
		// 		.addText((text) =>
		// 			text
		// 				.setPlaceholder("100")
		// 				.setValue(
		// 					this.plugin.data.settings.heatmapConfig.intensityStops.low.toString(),
		// 				)
		// 				.onChange(async (value) => {
		// 					console.log("value changed");
		// 				}),
		// 		);
		// }

		// if (mode == HeatmapColorModes.STOPS) {
		// 	new Setting(containerEl)
		// 		.setName("Medium intensity threshold")
		// 		.setDesc("Minimum word count to be considered medium intensity")
		// 		.setDisabled(true)
		// 		.addText((text) =>
		// 			text
		// 				.setPlaceholder("500")
		// 				.setValue(
		// 					this.plugin.data.settings.heatmapConfig.intensityStops.medium.toString(),
		// 				)
		// 				.onChange(async (value) => {
		// 					console.log("value changed");
		// 				}),
		// 		);
		// }

		// new Setting(containerEl)
		// 	.setName("High intensity threshold")
		// 	.setDesc("Minimum word count to be considered high intensity")
		// 	.addText((text) =>
		// 		text
		// 			.setPlaceholder("1000")
		// 			.setValue(
		// 				this.plugin.data.settings.heatmapConfig.intensityStops.high.toString(),
		// 			)
		// 			.onChange(async (value) => {
		// 				console.log("value changed");
		// 			}),
		// 	);

		// TODO: add option to choose low/medium/high as the "Goal" and add custom views for that
		this.createThresholdSettings(containerEl);

		this.createColorSettings(containerEl, "light");

		this.createColorSettings(containerEl, "dark");

		// IF GRADUAL, choose min color and max color (equivalent to levels 0 and 4)
		// IF SOLID, choose one color (level 0)
		// IF STOPS, choose all colors (level 0,1,2)
		// Random color per week? Something like that
		// Choose colors?

		containerEl.createEl("hr");
		// Future features?

		new Setting(containerEl).setName("Backups").setHeading();
		// Weekly external backups
		// Recover data from previous versions (should probably happen automatically after you update?)

		containerEl.createEl("hr");
		new Setting(containerEl).setName("Others").setHeading();
		// Buy me a coffee
		// User survey + suggestions?

		// when the week starts?
		// backups

		// 	new Setting(containerEl)
		// 		.setName("Enabled Scripts")
		// 		.setDesc("Select which writing systems to count")
		// 		.addDropdown((dropdown) => {
		// 			const scriptOptions = {
		// 				basic: "Basic (Latin only)",
		// 				cjk: "CJK Support",
		// 				full: "Full Unicode",
		// 				custom: "Custom",
		// 			};

		// 			dropdown
		// 				.addOptions(scriptOptions)
		// 				.setValue(
		// 					this.plugin.settings.enabledScripts.length === 1
		// 						? "basic"
		// 						: this.plugin.settings.enabledScripts.includes(
		// 									"CJK",
		// 							  )
		// 							? "cjk"
		// 							: this.plugin.settings.enabledScripts.length > 3
		// 								? "full"
		// 								: "custom",
		// 				)
		// 				.onChange((value) => {
		// 					let newScripts: Language[] = [];
		// 					switch (value) {
		// 						case "basic":
		// 							newScripts = ["LATIN"];
		// 							break;
		// 						case "cjk":
		// 							newScripts = [
		// 								"LATIN",
		// 								"CJK",
		// 								"JAPANESE",
		// 								"KOREAN",
		// 							];
		// 							break;
		// 						case "full":
		// 							newScripts = [
		// 								"LATIN",
		// 								"CJK",
		// 								"JAPANESE",
		// 								"KOREAN",
		// 								"CYRILLIC",
		// 								"GREEK",
		// 								"ARABIC",
		// 								"HEBREW",
		// 								"INDIC",
		// 								"SOUTHEAST_ASIAN",
		// 							];
		// 							break;
		// 						case "custom":
		// 							/**Add checkboxes for individual scripts*/
		// 							break;
		// 					}
		// 					this.options.onEnabledScriptsChange(newScripts);
		// 				});
		// 		});

		// 	new Setting(containerEl)
		// 		.setName("Show overview")
		// 		.setDesc("Display the overview section in the word count heatmap")
		// 		.addToggle((toggle) =>
		// 			toggle
		// 				.setValue(this.plugin.settings.showOverview)
		// 				.onChange(async (value) => {
		// 					this.plugin.settings.showOverview = value;
		// 					this.options.onShowOverviewChange(value);
		// 				}),
		// 		);

		// 	new Setting(containerEl)
		// 		.setName("Show today ")
		// 		.setDesc(
		// 			"Display which files were edited today and their respective word counts.",
		// 		)
		// 		.addToggle((toggle) =>
		// 			toggle
		// 				.setValue(this.plugin.settings.showEntries)
		// 				.onChange(async (value) => {
		// 					this.plugin.settings.showEntries = value;
		// 					this.options.onShowEntriesChange(value);
		// 				}),
		// 		);

		// 	new Setting(containerEl)
		// 		.setName("Show heatmap")
		// 		.setDesc("Displays a heatmap with historic writing data.")
		// 		.addToggle((toggle) =>
		// 			toggle
		// 				.setValue(this.plugin.settings.showHeatmap)
		// 				.onChange(async (value) => {
		// 					this.plugin.settings.showHeatmap = value;
		// 					this.options.onShowHeatmapChange(value);
		// 				}),
		// 		);
		// 	new Setting(containerEl).setName("Heatmap colors").setHeading();

		// 	new Setting(containerEl).setName("Light theme colors").setHeading();
		// 	this.createColorSettings(containerEl, "light");

		// 	new Setting(containerEl).setName("Dark theme colors").setHeading();
		// 	this.createColorSettings(containerEl, "dark");

		// 	// new Setting(containerEl)
		// 	// 	.setName("Restore default settings")
		// 	// 	.setDesc("Reset all settings to their original values")
		// 	// 	.addButton((button) =>
		// 	// 		button
		// 	// 			.setButtonText("Restore defaults")
		// 	// 			.setCta()
		// 	// 			.onClick(() => {
		// 	// 				new ConfirmationModal(
		// 	// 					this.plugin.app,
		// 	// 					"Are you sure you want to restore default settings? This will reset all Word Count plugin settings to their original values.",
		// 	// 					async () => {
		// 	// 						/**Restore default settings*/
		// 	// 						this.plugin.settings.intensityLevels = {
		// 	// 							low: DEFAULT_SETTINGS.intensityLevels.low,
		// 	// 							medium: DEFAULT_SETTINGS.intensityLevels
		// 	// 								.medium,
		// 	// 							high: DEFAULT_SETTINGS.intensityLevels.high,
		// 	// 						};

		// 	// 						this.plugin.settings.showOverview =
		// 	// 							DEFAULT_SETTINGS.showOverview;

		// 	// 						this.plugin.settings.colors = {
		// 	// 							...DEFAULT_SETTINGS.colors,
		// 	// 						};

		// 	// 						this.plugin.update();
		// 	// 						this.plugin.applyColorStyles();
		// 	// 						this.display();
		// 	// 					},
		// 	// 				).open();
		// 	// 			}),
		// 	// 	);

		// 	/**RESTORE DATA*/
		// 	new Setting(containerEl)
		// 		.setName("Restore data from previous versions")
		// 		.setDesc("Helps migrate data from versions prior to 0.1.2.")
		// 		.addButton((button) =>
		// 			button
		// 				.setButtonText("Restore data")
		// 				.setCta()
		// 				.onClick(() => {
		// 					this.plugin.restoreDataFromPreviousVersions();
		// 				}),
		// 		);
		// }

		// 	/**Add theme-specific reset button*/

		// 	// new Setting(containerEl)
		// 	// 	.setName(
		// 	// 		`Reset ${theme === "light" ? "light" : "dark"} theme colors`,
		// 	// 	)
		// 	// 	.addButton((button) =>
		// 	// 		button.setButtonText("Reset theme colors").onClick(() => {
		// 	// 			new ConfirmationModal(
		// 	// 				this.plugin.app,
		// 	// 				`Are you sure you want to reset the ${theme} theme colors to their default values?`,
		// 	// 				async () => {
		// 	// 					this.plugin.settings.colors[theme] = {
		// 	// 						...DEFAULT_SETTINGS.colors[theme],
		// 	// 					};
		// 	// 					await this.plugin.update();
		// 	// 					this.plugin.applyColorStyles();
		// 	// 					this.display();
		// 	// 				},
		// 	// 			).open();
		// 	// 		}),
		// 	// 	);
	}

	private createColorSettings(
		containerEl: HTMLElement,
		theme: "light" | "dark",
	) {
		const mode = this.plugin.data.settings.heatmapConfig.intensityMode;
		const colorValues =
			this.plugin.data.settings.heatmapConfig.colors[theme];

		// Define which color levels to show based on mode
		let levelsToShow: number[] = [];

		switch (mode) {
			case HeatmapColorModes.GRADUAL:
			case HeatmapColorModes.LIQUID:
				levelsToShow = [0, 4];
				break;
			case HeatmapColorModes.SOLID:
				levelsToShow = [4];
				break;
			default:
				levelsToShow = [0, 1, 2, 3, 4];
		}

		//TODO: ACTUALLY I SHOULD ALWAYS DISPLAY JUST TWO COLORS AND MAKE A GRADIENT OUT OF THE REST IF NECESSARY, no need for the user to choose each color i think

		const setting = new Setting(containerEl)
			.setName(`${theme.charAt(0).toUpperCase() + theme.slice(1)} colors`)
			.setDesc("Before low, low, between low and medium, medium");

		levelsToShow.forEach((level) => {
			setting.addColorPicker((color) =>
				color.setValue(colorValues[level]).onChange(async (value) => {
					colorValues[level] = value;
					this.plugin.updateAndSaveEverything();
					this.plugin.applyColorStyles();
					this.display();
				}),
			);
		});

		setting.addButton((button) => {
			button.setButtonText("Reset").onClick(() => {
				new ConfirmationModal(
					this.plugin.app,
					`Are you sure you want to reset the ${theme} theme colors to their default values?`,
					async () => {
						this.plugin.data.settings.heatmapConfig.colors[theme] =
							{
								...DEFAULT_SETTINGS.heatmapConfig.colors![
									theme
								],
							};
						await this.plugin.updateAndSaveEverything();
						this.plugin.applyColorStyles();
						this.display();
					},
				).open();
			});
		});
	}

	private createThresholdSettings(containerEl: HTMLElement) {
		const { intensityMode, intensityStops } =
			this.plugin.data.settings.heatmapConfig;
		const setting = new Setting(containerEl)
			.setName("Intensity thresholds")
			.setDesc("Low, medium, and high.");

		// Each mode determines which threshold levels to show
		const thresholds: {
			key: keyof typeof intensityStops;
			placeholder: string;
			label: string;
		}[] = [];

		if (intensityMode !== HeatmapColorModes.SOLID) {
			thresholds.push({
				key: "low",
				placeholder: "100",
				label: "Low",
			});
		}

		if (intensityMode === HeatmapColorModes.STOPS) {
			thresholds.push({
				key: "medium",
				placeholder: "500",
				label: "Medium",
			});
		}

		// Always show high
		thresholds.push({
			key: "high",
			placeholder: "1000",
			label: "High",
		});

		thresholds.forEach(({ key, placeholder, label }) => {
			setting
				.addText((text) =>
					text
						.setPlaceholder(placeholder)
						.setValue(intensityStops[key].toString())
						.onChange(async (value) => {
							const num = parseInt(value);
							if (!isNaN(num)) {
								intensityStops[key] = num;
								console.log(
									this.plugin.data.settings.heatmapConfig
										.intensityStops[key],
								);
								await this.plugin.updateAndSaveEverything();
							}
						}),
				)
				.setClass("ktr__threshold-inputs");
		});
	}
}

export {};
