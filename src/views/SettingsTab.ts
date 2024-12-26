import { App, PluginSettingTab, Setting } from "obsidian";
import { IntensityConfig } from "src/types";

interface SettingsTabOptions {
  intensityLevels: IntensityConfig;
  showOverview: boolean;
  onIntensityLevelsChange: (newLevels: IntensityConfig) => void;
  onShowOverviewChange: (newShowOverview: boolean) => void;
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
          .setValue(this.plugin.settings.showOverview) // Use plugin's current setting
          .onChange(async (value) => {
            this.plugin.settings.showOverview = value;
            this.options.onShowOverviewChange(value);
          }),
      );
  }
}
