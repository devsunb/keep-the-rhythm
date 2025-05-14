// import { usePluginState2 } from "@/core/pluginState";
import { KeyProvider } from "@/utils/useModiferKey";
import React, { useEffect, useState } from "react";
import type { PluginData } from "@/defs/types";
import KeepTheRhythm from "@/main";
import { Heatmap } from "./Heatmap";
import { SlotWrapper } from "./SlotWrapper";
import { Entries } from "./Entries";
import { EVENTS, state } from "@/core/pluginState";

interface KTRView {
	data?: PluginData;
	showSlots?: boolean;
	showHeatmap?: boolean;
	showEntries?: boolean;
	plugin: KeepTheRhythm;
}

export const KTRView = ({ plugin }: KTRView) => {
	const [slots, setSlots] = useState(
		plugin.data.settings.sidebarConfig.slots,
	);
	const [showHeatmap, setShowHeatmap] = useState(
		plugin.data.settings.sidebarConfig.visibility.showHeatmap,
	);
	const [showEntries, setShowEntries] = useState(
		plugin.data.settings.sidebarConfig.visibility.showEntries,
	);
	const [showSlots, setShowSlots] = useState(
		plugin.data.settings.sidebarConfig.visibility.showSlots,
	);

	// const [currentFile, setCurrentFile] = useState<string>("");
	// const handleRefresh = () => {
	// 	if (state.currentActivity)
	// 		setCurrentFile(state.currentActivity.filePath);
	// };

	// useEffect(() => {
	// 	handleRefresh();

	// 	eventEmitter.on(EVENTS.REFRESH_EVERYTHING, handleRefresh);

	// 	return () => {
	// 		eventEmitter.off(EVENTS.REFRESH_EVERYTHING, handleRefresh);
	// 	};
	// });

	const updateData = () => {
		setSlots(plugin.data.settings.sidebarConfig.slots);
		setShowHeatmap(
			plugin.data.settings.sidebarConfig.visibility.showHeatmap,
		);
		setShowEntries(
			plugin.data.settings.sidebarConfig.visibility.showEntries,
		);
		setShowSlots(plugin.data.settings.sidebarConfig.visibility.showSlots);
	};

	useEffect(() => {
		updateData();

		state.on(EVENTS.REFRESH_EVERYTHING, updateData);

		return () => {
			state.off(EVENTS.REFRESH_EVERYTHING, updateData);
		};
	}, []);

	return (
		<div className="sidebar-view">
			<KeyProvider>
				{showSlots && <SlotWrapper slots={slots} />}
				{/* <CustomChart
						intensityLevels={[0, 1, 3, 4, 5]}
					></CustomChart> */}
				{showHeatmap && (
					<Heatmap
						heatmapConfig={plugin.data.settings.heatmapConfig}
					/>
				)}
				{showEntries && <Entries />}
			</KeyProvider>
		</div>
	);
};
