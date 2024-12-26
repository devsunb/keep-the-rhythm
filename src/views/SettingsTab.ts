import { App, PluginSettingTab, Setting, Modal } from "obsidian";
import { IntensityConfig, ColorConfig } from "src/types";
import { DEFAULT_SETTINGS } from "../../main";

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

    contentEl.createEl("h2", { text: "Confirm Action" });

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
  colors: ColorConfig;
  onIntensityLevelsChange: (newLevels: IntensityConfig) => void;
  onShowOverviewChange: (newShowOverview: boolean) => void;
  onColorsChange: (newColors: ColorConfig) => void;
}

export class SettingsTab extends PluginSettingTab {
  private plugin: any;
  private options: SettingsTabOptions;

  constructor(app: App, plugin: any, options: SettingsTabOptions) {
    super(app, plugin);
    this.plugin = plugin;
    this.options = options;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Intensity Levels Section
    new Setting(containerEl)
      .setName("Low Intensity Threshold")
      .setDesc("Minimum word count to be considered low intensity")
      .addText((text) =>
        text
          .setPlaceholder("100")
          .setValue(this.plugin.settings.intensityLevels.low.toString())
          .onChange(async (value) => {
            const newLow = parseInt(value, 10);
            if (!isNaN(newLow)) {
              this.plugin.settings.intensityLevels.low = newLow;
              this.options.onIntensityLevelsChange(
                this.plugin.settings.intensityLevels,
              );
            }
          }),
      );

    new Setting(containerEl)
      .setName("Medium Intensity Threshold")
      .setDesc("Minimum word count to be considered medium intensity")
      .addText((text) =>
        text
          .setPlaceholder("500")
          .setValue(this.plugin.settings.intensityLevels.medium.toString())
          .onChange(async (value) => {
            const newMedium = parseInt(value, 10);
            if (!isNaN(newMedium)) {
              this.plugin.settings.intensityLevels.medium = newMedium;
              this.options.onIntensityLevelsChange(
                this.plugin.settings.intensityLevels,
              );
            }
          }),
      );

    new Setting(containerEl)
      .setName("High Intensity Threshold")
      .setDesc("Minimum word count to be considered high intensity")
      .addText((text) =>
        text
          .setPlaceholder("1000")
          .setValue(this.plugin.settings.intensityLevels.high.toString())
          .onChange(async (value) => {
            const newHigh = parseInt(value, 10);
            if (!isNaN(newHigh)) {
              this.plugin.settings.intensityLevels.high = newHigh;
              this.options.onIntensityLevelsChange(
                this.plugin.settings.intensityLevels,
              );
            }
          }),
      );

    // Show Overview Section
    new Setting(containerEl)
      .setName("Show Overview")
      .setDesc("Display the overview section in the word count heatmap")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showOverview)
          .onChange(async (value) => {
            this.plugin.settings.showOverview = value;
            this.options.onShowOverviewChange(value);
          }),
      );
    containerEl.createEl("h2", { text: "Heatmap Colors" });
    // Color for Level 0 (No activity)
    new Setting(containerEl)
      .setName("No Activity Color")
      .setDesc("Color for days with no writing activity")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.colors.level0)
          .onChange(async (value) => {
            this.plugin.settings.colors.level0 = value;
            this.options.onColorsChange(this.plugin.settings.colors);
            this.applyColorStyles();
          }),
      );

    // Color for Level 1

    new Setting(containerEl)
      .setName("Low Activity Color")
      .setDesc("Color for minimal writing activity")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.colors.level1)
          .onChange(async (value) => {
            this.plugin.settings.colors.level1 = value;
            this.options.onColorsChange(this.plugin.settings.colors);
            this.applyColorStyles();
          }),
      );

    // Color for Level 2
    new Setting(containerEl)
      .setName("Medium Activity Color")
      .setDesc("Color for moderate writing activity")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.colors.level2)
          .onChange(async (value) => {
            this.plugin.settings.colors.level2 = value;
            this.options.onColorsChange(this.plugin.settings.colors);
            this.applyColorStyles();
          }),
      );

    // Color for Level 3
    new Setting(containerEl)
      .setName("High Activity Color")
      .setDesc("Color for significant writing activity")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.colors.level3)
          .onChange(async (value) => {
            this.plugin.settings.colors.level3 = value;
            this.options.onColorsChange(this.plugin.settings.colors);
            this.applyColorStyles();
          }),
      );

    // Color for Level 4
    new Setting(containerEl)
      .setName("Very High Activity Color")
      .setDesc("Color for intense writing activity")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.colors.level4)
          .onChange(async (value) => {
            this.plugin.settings.colors.level4 = value;
            this.options.onColorsChange(this.plugin.settings.colors);
            this.applyColorStyles();
          }),
      );

    new Setting(containerEl)
      .setName("Restore Default Settings")
      .setDesc("Reset all settings to their original values")
      .addButton((button) =>
        button
          .setButtonText("Restore Defaults")
          .setCta()
          .onClick(() => {
            // Create and open the confirmation modal
            new ConfirmationModal(
              this.plugin.app,
              "Are you sure you want to restore default settings? This will reset all Word Count plugin settings to their original values.",
              async () => {
                // Restore default settings
                this.plugin.settings.intensityLevels = {
                  low: DEFAULT_SETTINGS.intensityLevels.low,
                  medium: DEFAULT_SETTINGS.intensityLevels.medium,
                  high: DEFAULT_SETTINGS.intensityLevels.high,
                };

                this.plugin.settings.showOverview =
                  DEFAULT_SETTINGS.showOverview;

                this.plugin.settings.colors = {
                  ...DEFAULT_SETTINGS.colors,
                };

                // Save the reset settings
                await this.plugin.saveSettings();

                // Apply color styles
                this.plugin.applyColorStyles();

                // Refresh the settings display
                this.display();

                // Refresh the view if it exists
                this.plugin.view?.refresh();
              },
            ).open();
          }),
      );
  }
  private applyColorStyles() {
    // Apply dynamic styles to the document
    let styleEl = document.getElementById("word-count-heatmap-colors");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "word-count-heatmap-colors";
      document.head.appendChild(styleEl);
    }

    const colors = this.plugin.settings.colors;
    styleEl.textContent = `
      .level-0 { background-color: ${colors.level0}; }
      .level-1 { background-color: ${colors.level1}; }
      .level-2 { background-color: ${colors.level2}; }
      .level-3 { background-color: ${colors.level3}; }
      .level-4 { background-color: ${colors.level4}; }
    `;
  }
}
