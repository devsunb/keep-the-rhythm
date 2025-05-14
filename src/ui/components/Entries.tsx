import {
	formatDate,
	mockMonthDailyActivity,
	sumTimeEntries,
} from "@/utils/utils";
import { DailyActivity } from "@/db/db";
import React, { useEffect, useState } from "react";
import { EVENTS, state } from "@/core/pluginState";
import { getActivityByDate } from "@/db/db";
import { Unit } from "@/defs/types";

// import type { PluginData } from "../types";
// import KeepTheRhythm from "../../main";

// interface EntriesProps {
// 	data: PluginData;
// 	plugin: KeepTheRhythm;
// }

export const Entries = ({}) => {
	const [entries, setEntries] = useState<DailyActivity[]>([]);
	const todayStr = formatDate(new Date());

	const handleEntriesRefresh = async () => {
		const fetchedActivities = await getActivityByDate(todayStr);

		setEntries(
			fetchedActivities.filter(
				(entry) => sumTimeEntries(entry, Unit.WORD) != 0,
			),
		);
	};

	useEffect(() => {
		handleEntriesRefresh();
		state.on(EVENTS.REFRESH_EVERYTHING, handleEntriesRefresh);

		return () => {
			state.off(EVENTS.REFRESH_EVERYTHING, handleEntriesRefresh);
		};
	}, []);

	return (
		<div>
			{entries.map((entry) => (
				<div key={entry.filePath} className="">
					{entry.filePath} / {sumTimeEntries(entry, Unit.WORD)}
				</div>
			))}
		</div>
	);
};

// export const Entries = ({ data }: { data: Stats }) => {
// 	{
// 		<div className="todayEntries__section">
// 			<div className="todayEntries__section-title">TODAY ENTRIES</div>
// 			{getTodayFiles().length > 0 ? (
// 				getTodayFiles().map((file) => (
// 					<div key={file.path} className="todayEntires__list-item">
// 						<span className="todayEntries__file-path">
// 							{getFileNameWithoutExtension(file.path)}
// 						</span>
// 						<div className="todayEntries__list-item-right">
// 							<span className="todayEntries__word-count">
// 								{file.delta > 0
// 									? `+${file.delta.toLocaleString()}`
// 									: file.delta.toLocaleString()}{" "}
// 								words
// 							</span>
// 							<button
// 								className="todayEntries__delete-button"
// 								onClick={() =>
// 									plugin.handleDeleteEntry(file.path)
// 								}
// 							>
// 								<svg
// 									xmlns="http://www.w3.org/2000/svg"
// 									width="24"
// 									height="24"
// 									viewBox="0 0 24 24"
// 									fill="none"
// 									stroke="currentColor" // This ensures the icon uses the current text color
// 									strokeWidth="2" // React uses camelCase for attributes like 'stroke-width'
// 									strokeLinecap="round"
// 									strokeLinejoin="round"
// 									className="svg-icon"
// 								>
// 									<path d="M3 6h18" />
// 									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
// 									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
// 									<line x1="10" y1="11" x2="10" y2="17" />
// 									<line x1="14" y1="11" x2="14" y2="17" />
// 								</svg>
// 							</button>
// 						</div>
// 					</div>
// 				))
// 			) : (
// 				<p className="empty-data">No files edited today</p>
// 			)}
// 		</div>;
// 	}
// };
