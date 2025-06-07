import { deleteActivityFromDate } from "../../db/queries";
import { Tooltip } from "./Tooltip";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { getFileNameWithoutExtension } from "../../utils/utils";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { formatDate } from "../../utils/dateUtils";
import { getActivityByDate } from "../../db/queries";
import { sumTimeEntries } from "../../utils/utils";
import { state, EVENTS } from "../../core/pluginState";
import { DailyActivity } from "../../db/types";
import { Unit } from "../../defs/types";
import { Notice, setIcon } from "obsidian";

interface EntriesProps {
	date?: string;
}
export const Entries = ({ date = formatDate(new Date()) }: EntriesProps) => {
	const [unit, setUnit] = useState<Unit>(Unit.WORD);
	const [entries, setEntries] = useState<DailyActivity[]>([]);

	const deleteButtonRef = useRef<HTMLButtonElement>(null);

	if (
		deleteButtonRef instanceof HTMLElement &&
		!deleteButtonRef.dataset.iconSet
	) {
		setIcon(deleteButtonRef, "trash-2");
		deleteButtonRef.dataset.iconSet = "true";
	}

	const handleEntriesRefresh = async () => {
		const fetchedActivities = await getActivityByDate(date);

		const pathCounts = new Map<string, number>();
		for (const activity of fetchedActivities) {
			if (activity.filePath) {
				pathCounts.set(
					activity.filePath,
					(pathCounts.get(activity.filePath) || 0) + 1,
				);
			}
		}

		const uniqueEntries = fetchedActivities.filter((entry) =>
			entry.filePath ? pathCounts.get(entry.filePath) === 1 : true,
		);
		setEntries(
			uniqueEntries.filter(
				(entry) => sumTimeEntries(entry, Unit.WORD, true) != 0,
			),
		);
	};

	const toggleUnit = () => {
		setUnit(unit == Unit.WORD ? Unit.CHAR : Unit.WORD);
	};

	useEffect(() => {
		handleEntriesRefresh();
		state.on(EVENTS.REFRESH_EVERYTHING, handleEntriesRefresh);

		return () => {
			state.off(EVENTS.REFRESH_EVERYTHING, handleEntriesRefresh);
		};
	}, []);

	return (
		<div className="todayEntries__section">
			<RadixTooltip.Provider delayDuration={200}>
				<div className="todayEntries__header">
					<div className="todayEntries__section-title">
						{date == state.today
							? "ENTRIES TODAY"
							: `ENTRIES (${date})`}
					</div>
					<Tooltip content="Toggle Unit">
						<button
							className="todayEntries__entry-unit"
							ref={(el) => el && setIcon(el, "case-sensitive")}
							onMouseDown={toggleUnit}
						/>
					</Tooltip>
				</div>
				{entries.length > 0 ? (
					entries.map((entry) => {
						const delta = sumTimeEntries(entry, unit, true);
						const prefix = delta > 0 ? "+" : "";

						return (
							<div
								key={entry.filePath}
								className="todayEntires__list-item"
							>
								<span
									className="todayEntries__file-path"
									onClick={() => {
										const file =
											state.plugin.app.vault.getFileByPath(
												entry.filePath,
											);
										if (file) {
											const leaf =
												state.plugin.app.workspace.getLeaf(
													"tab",
												);
											leaf.openFile(file);
										} else {
											new Notice("File not found!");
										}
									}}
								>
									{getFileNameWithoutExtension(
										entry.filePath,
									)}
								</span>
								<div className="todayEntries__list-item-right">
									<span className="todayEntries__word-count">
										{prefix}
										{delta.toLocaleString()}
									</span>
									<span className="todayEntries_list-item-unit">
										{" " + unit.toLowerCase() + "s"}
									</span>
									<Tooltip content="Delete entry">
										<button
											className="todayEntries__delete-button"
											ref={(el) =>
												el && setIcon(el, "trash-2")
											}
											onMouseDown={async () => {
												await deleteActivityFromDate(
													entry.filePath,
													date,
												);
												state.emit(
													EVENTS.REFRESH_EVERYTHING,
												);
											}}
										/>
									</Tooltip>
								</div>
							</div>
						);
					})
				) : (
					<p className="empty-data">No files edited today</p>
				)}
			</RadixTooltip.Provider>
		</div>
	);
};
