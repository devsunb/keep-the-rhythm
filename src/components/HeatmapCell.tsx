import {
	weeksToShow,
	weekdaysNames,
	monthNames,
	formatDate,
	getLeafWithFile,
	getApp,
} from "../utils";
import { db } from "../db/db";
import React from "react";
import { IntensityConfig } from "../types";
import * as obsidian from "obsidian";
import { Tooltip } from "./Tooltip";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { useCtrlKey } from "../context/useModiferKey";
import { getCorePluginSettings } from "../utils/windowUtility";

import { moment as _moment } from "obsidian";
const moment = _moment as unknown as typeof _moment.default;

interface HeatmapCellProps {
	intensity: number;
	count: number;
	date: string;
}

export const HeatmapCell = ({ intensity, count, date }: HeatmapCellProps) => {
	const isModifierHeld = useCtrlKey();

	const handleClick = async (event: React.MouseEvent<HTMLDivElement>) => {
		if (!isModifierHeld) return;

		const app = getApp();
		const dailyNotesSettings = getCorePluginSettings("daily-notes");
		let notePath = "";

		if (dailyNotesSettings?.folder) {
			notePath += dailyNotesSettings.folder.endsWith("/")
				? dailyNotesSettings.folder
				: dailyNotesSettings.folder + "/";
		}

		if (dailyNotesSettings?.format) {
			notePath += moment(date, "YYYY-MM-DD").format(
				dailyNotesSettings.format,
			);
		} else {
			notePath += date;
		}

		notePath += ".md";

		const existingFile = app.vault.getAbstractFileByPath(notePath);

		if (existingFile instanceof obsidian.TFile) {
			const existingLeaf = getLeafWithFile(app, existingFile);
			if (existingLeaf) {
				app.workspace.setActiveLeaf(existingLeaf);
			} else {
				app.workspace.getLeaf(true).openFile(existingFile);
			}
		} else {
			const newFile = await app.vault.create(notePath, "");
			await app.workspace.getLeaf(true).openFile(newFile);
		}
	};

	const intensityClass = "level-" + intensity + " ";
	const isTodayClass =
		date == formatDate(new Date()) ? "heatmap-square-today" : "";
	var classes = "heatmap-square " + intensityClass + isTodayClass;

	return (
		<Tooltip
			content={
				<>
					<strong>{date}</strong>
					<div>{count.toLocaleString()} words</div>
				</>
			}
		>
			<div
				onClick={handleClick}
				className={classes}
				style={{ cursor: isModifierHeld ? "pointer" : "default" }}
			></div>
		</Tooltip>
	);
};
