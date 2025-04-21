import { useAltKey } from "../context/useModiferKey";
import React from "react";
import { formatDate } from "../utils";
import { SlotConfig } from "@/types";
import { Slot } from "./Slot";

// DISPLAYS DIFFERENT STATS
// - Toggle between CHAR/WORD count
// - Daily / Weekly / Monthly / Yearly
// - Last 7 days, last 30 days, last year (total / avg)

// IDEA: probably give the user three slots and
// allow them to choose between the options?

// DEFAULT: today count, avg last week, total last 30 days
interface SlotWrapperProps {
	slots: SlotConfig[] | undefined;
}

export const SlotWrapper = ({ slots }: SlotWrapperProps) => {
	const isModifierHeld = useAltKey();

	return (
		<div className="slot-wrapper">
			{isModifierHeld && (
				<div className="slot-wrapper__hide-item">
					<div className="slot-wrapper__hide-border">
						HIDE OVERVIEW
					</div>
				</div>
			)}
			{slots?.map((slot) => (
				<Slot
					key={slot.index + slot.option}
					index={slot.index}
					option={slot.option}
					unit={slot.unit}
					calc={slot.calc}
				/>
			))}
		</div>
	);
	// const todayStr = formatDate(new Date());

	// // const getWordCount = (startDate: Date, endDate: Date) => {
	// // 	// let total = 0;
	// // 	// const start = formatDate(startDate);
	// // 	// const end = formatDate(endDate);

	// // 	// Object.entries(data).forEach(([date, dayData]) => {
	// // 	// 	if (date >= start && date <= end) {
	// // 	// 		total += dayData.totalDelta;
	// // 	// 	}
	// // 	// });
	// // 	// return total;
	// // };

	// const getWeekStart = (date: Date): Date => {
	// 	const result = new Date(date);
	// 	const day = result.getDay();
	// 	const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
	// 	result.setDate(diff);
	// 	return result;
	// };

	// const todayCount = data[todayStr]?.totalDelta || 0;

	// const weekStart = new Date(today);
	// const daysSinceMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
	// weekStart.setDate(today.getDate() - daysSinceMonday);

	// const weekCount = getWordCount(weekStart, today);

	// const yearStart = new Date(today.getFullYear(), 0, 1);
	// const yearCount = getWordCount(yearStart, today);

	return (
		<div className="stats-SlotWrapper">
			{/* <div className="stats-grid">
				<div className="stat-card">
					<div className="stat-label">Today</div>
					<div className="stat-value">
						{todayCount.toLocaleString()}
						<span className="stat-unit"> words</span>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-label">This Week</div>
					<div className="stat-value">
						{weekCount.toLocaleString()}
						<span className="stat-unit"> words</span>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-label">This Year</div>
					<div className="stat-value">
						{yearCount.toLocaleString()}
						<span className="stat-unit"> words</span>
					</div>
				</div>
			</div> */}
		</div>
	);
};
