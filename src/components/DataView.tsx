import { KeyProvider } from "@/useModiferKey";
import React from "react";
import type { PluginData } from "../types";
import KeepTheRhythm from "../../main";
import { Heatmap } from "./Heatmap";
import { SlotWrapper } from "./SlotWrapper";
import { Entries } from "./Entries";
import plugin from "tailwindcss-animate";

interface KTRView {
	data?: PluginData;
	showSlots?: boolean;
	showHeatmap?: boolean;
	showEntries?: boolean;
	plugin: KeepTheRhythm;
}

export const KTRView = ({ plugin }: KTRView) => {
	const slots = plugin.data.settings.sidebarConfig.slots;

	return (
		<div>
			<KeyProvider>
				<SlotWrapper slots={slots} />
				{
					<Heatmap
						intensityLevels={plugin.data.settings.intensityStops}
					/>
				}
				<h3>ENTRIES</h3>
				<li>item</li>
				<li>item</li>
				<li>item</li>
				{/* <Entries /> */}
				<h3>SHORCUTS</h3>
				<div>{"CTRL on heatmap -> link"}</div>
				<div>ALT to hide sections</div>
				<div>ACTIONS?</div>
			</KeyProvider>
		</div>
	);
};
