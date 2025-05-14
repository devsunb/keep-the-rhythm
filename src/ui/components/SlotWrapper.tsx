import { v4 as uuidv4 } from "uuid";
import { useAltKey } from "@/utils/useModiferKey";
import React from "react";
import { formatDate } from "@/utils/utils";
import { SlotConfig, SlotOption, Unit } from "@/defs/types";
import { Slot } from "./Slot";
import { plugins } from "chart.js";
import { state, EVENTS } from "@/core/pluginState";
import { useEffect, useState } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";

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
	const [slotsState, setSlotsState] = useState<
		(SlotConfig & { uuid?: string })[] | undefined
	>(() => slots?.map((slot) => ({ ...slot, uuid: uuidv4() })));

	const updateSlots = () => {
		const currentSettings = state.plugin.data.settings.sidebarConfig.slots;
		const updatedSlots = currentSettings.map((slot) => {
			const existingSlot = slotsState?.find(
				(s) => s.index === slot.index,
			);
			return { ...slot, uuid: existingSlot?.uuid || uuidv4() };
		});

		setSlotsState(updatedSlots);
	};

	useEffect(() => {
		// state.off(EVENTS.REFRESH_EVERYTHING, updateSlots);
		// state.on(EVENTS.REFRESH_EVERYTHING, updateSlots);

		updateSlots();

		return () => {
			// state.off(EVENTS.REFRESH_EVERYTHING, updateSlots);
		};
	}, []);

	const handleDeleteClick = (index: number) => {
		const newSlots = state.plugin.data.settings.sidebarConfig.slots.filter(
			(_, i) => i !== index,
		);

		// Update indexes after filtering
		newSlots.forEach((slot, i) => {
			slot.index = i;
		});

		if (state.plugin && state.plugin.data && state.plugin.data.settings) {
			state.plugin.data.settings.sidebarConfig.slots = newSlots;
		}

		// Call quietSave to persist changes
		state.plugin.quietSave();

		// Update state with preserved UUIDs
		setSlotsState(slotsState?.filter((_, i) => i !== index));
	};

	const handleAddClick = () => {
		const newSlot: SlotConfig = {
			index: state.plugin.data.settings.sidebarConfig.slots.length,
			option: SlotOption.CURRENT_FILE,
			unit: Unit.WORD,
			calc: "TOTAL",
		};

		const updatedSlots = [
			...state.plugin.data.settings.sidebarConfig.slots,
			newSlot,
		];

		if (state.plugin && state.plugin.data && state.plugin.data.settings) {
			state.plugin.data.settings.sidebarConfig.slots = updatedSlots;
		}

		// Update state with new UUID for the new slot
		setSlotsState([...(slotsState || []), { ...newSlot, uuid: uuidv4() }]);
	};

	return (
		<div className="slot-wrapper">
			{isModifierHeld && (
				<div className="slot-wrapper__hide-item">
					<div className="slot-wrapper__hide-border">
						HIDE OVERVIEW
					</div>
				</div>
			)}
			<TransitionGroup className="slot-list">
				{slotsState?.map((slot, i) => (
					<CSSTransition
						key={slot.uuid}
						timeout={500}
						classNames="slot-fade"
						unmountOnExit
					>
						<Slot
							index={i}
							option={slot.option}
							unit={slot.unit}
							calc={slot.calc}
							onDelete={handleDeleteClick}
						/>
					</CSSTransition>
				))}
			</TransitionGroup>
			<button onClick={handleAddClick}>+ ADD NEW SLOT</button>
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
