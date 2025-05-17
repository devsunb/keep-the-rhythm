import { Notice } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { useAltKey } from "@/utils/useModiferKey";
import React from "react";
import { formatDate } from "@/utils/dateUtils";
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
		if (slotsState && slotsState?.length >= 10) {
			new Notice("Maximum of 10 slots per view! (at least for now)");
			return;
		}
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

		// Call quietSave to persist changes
		state.plugin.quietSave();

		// Update state with new UUID for the new slot
		setSlotsState([...(slotsState || []), { ...newSlot, uuid: uuidv4() }]);
	};

	return (
		<div className="slot__section">
			<TransitionGroup className="slot__list">
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
			<button
				className="KTR-add-slot-button"
				onClick={handleAddClick}
				disabled={slotsState && slotsState?.length >= 10 ? true : false}
			>
				+ ADD NEW SLOT
			</button>
		</div>
	);
};
