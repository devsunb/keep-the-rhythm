// import DailyActivityChart from "@/ui/components/Chart";

// import NumberFlow from "@number-flow/react";
import { SlotOption, SlotConfig, Unit } from "@/defs/types";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { Tooltip } from "./Tooltip";
import { setIcon } from "obsidian";
import React from "react";
import { getSlotLabel } from "@/defs/texts";
import { useState, useEffect, useRef } from "react";
import { getTotalValueByDate, getTotalValueInDateRange } from "@/db/db";
import {
	formatDate,
	getLastSevenDays,
	getLastThirthyDays,
	getLastYearInDays,
	getStartOfWeek,
	getStartOfMonth,
	getLastDay,
	getStartOfYear,
} from "@/utils/utils";
import { EVENTS, state } from "@/core/pluginState";

export const Slot = ({
	index,
	option,
	unit,
	calc,
	onDelete,
}: SlotConfig & { onDelete: (index: number) => void }) => {
	const [value, setValue] = useState<number | string>(0);
	const [unitType, setUnitType] = useState<Unit>(unit);
	const [optionType, setOptionType] = useState<SlotOption>(option);
	const [calcType, setCalcType] = useState<"TOTAL" | "AVG">(calc);
	const [showCalcType, setShowCalcType] = useState<boolean>(true);
	const [showChart, setShowChart] = useState<boolean>(false);
	const [chartData, setChartData] = useState<boolean>(false);

	const deleteButtonRef = useRef<HTMLButtonElement>(null);
	const unitButtonRef = useRef<HTMLButtonElement>(null);
	const typeButtonRef = useRef<HTMLButtonElement>(null);
	const calcButtonRef = useRef<HTMLButtonElement>(null);

	const slotOptions = Object.values(SlotOption);

	const plugin = state.plugin;

	const handleCalcClick = () => {
		const newCalc = calcType == "TOTAL" ? "AVG" : "TOTAL";

		if (plugin && plugin.data && plugin.data.settings) {
			plugin.data.settings.sidebarConfig.slots[index].calc = newCalc;
			plugin.quietSave();
		}

		setCalcType(newCalc);
	};

	const handleUnitClick = () => {
		const newUnit: Unit = unitType == Unit.WORD ? Unit.CHAR : Unit.WORD;

		if (plugin && plugin.data && plugin.data.settings) {
			plugin.data.settings.sidebarConfig.slots[index].unit = newUnit;
			plugin.quietSave();
		}
		setUnitType(newUnit);
		// if (plugin && plugin.data && plugin.data.settings) {
		// 	plugin.data.settings.sidebarConfig.slots[index].unit = unitType;
		// 	plugin.quietSave();
		// }
	};

	const handleTypeClick = () => {
		const currentIndex = slotOptions.indexOf(optionType);
		const nextIndex = (currentIndex + 1) % slotOptions.length;
		const newOption = slotOptions[nextIndex];

		if (plugin && plugin.data && plugin.data.settings) {
			plugin.data.settings.sidebarConfig.slots[index].option = newOption;
			plugin.quietSave();
		}

		setOptionType(newOption);
	};

	const handleDeleteClick = () => {
		if (plugin && plugin.data && plugin.data.settings) {
			const newSlots = plugin.data.settings.sidebarConfig.slots.filter(
				(_, i) => i !== index,
			);

			for (let i = index; i < newSlots.length; i++) {
				newSlots[i].index = i;
			}

			plugin.data.settings.sidebarConfig.slots = newSlots;
			plugin.quietSave();
		}
	};

	useEffect(() => {
		setShowCalcType(
			optionType !== SlotOption.CURRENT_FILE &&
				optionType !== SlotOption.THIS_DAY &&
				optionType !== SlotOption.LAST_DAY &&
				optionType !== SlotOption.WHOLE_VAULT &&
				optionType !== SlotOption.CURRENT_STREAK,
		);
	}, [optionType]);

	useEffect(() => {
		if (calcButtonRef.current) {
			const icon = calcType == "TOTAL" ? "circle-slash-2" : "sigma";
			setIcon(calcButtonRef.current, icon);
		}
	}, [calcType]);

	useEffect(() => {
		if (calcButtonRef.current) {
			const icon =
				calcType == "TOTAL" ? "circle-slash-2" : "circle-slash-2";
			setIcon(calcButtonRef.current, icon);
		}
		if (unitButtonRef.current) {
			setIcon(unitButtonRef.current, "case-sensitive");
		}
		if (typeButtonRef.current) {
			setIcon(typeButtonRef.current, "list");
		}
		if (deleteButtonRef.current) {
			setIcon(deleteButtonRef.current, "x");
		}
	}, []);

	const updateData = () => {
		switch (optionType) {
			case SlotOption.CURRENT_FILE:
				setShowChart(false);
				if (unitType == Unit.WORD) {
					if (state.currentActivity) {
						setValue(
							state.currentActivity.wordCountStart +
								Object.values(
									state.currentActivity.changes,
								).reduce((s, change) => s + change.w, 0),
						);
					} else {
						setValue(0);
					}
				} else {
					if (state.currentActivity) {
						setValue(
							state.currentActivity.charCountStart +
								Object.values(
									state.currentActivity.changes,
								).reduce((s, change) => s + change.c, 0),
						);
					} else {
						setValue(0);
					}
				}
				break;
			case SlotOption.THIS_DAY:
				setShowChart(true);

				getTotalValueByDate(state.today, unitType).then((newVal) => {
					setValue(newVal);
				});
				break;
			case SlotOption.THIS_WEEK:
				const thisWeekStart = formatDate(getStartOfWeek(new Date()));
				const deltaWeekDays =
					Math.floor(
						(new Date(state.today).getTime() -
							new Date(thisWeekStart).getTime()) /
							(1000 * 3600 * 24),
					) + 1;

				getTotalValueInDateRange(
					thisWeekStart,
					state.today,
					unitType,
				).then((total) => {
					setValue(
						calcType === "AVG"
							? Math.round(total / deltaWeekDays)
							: total,
					);
				});
				break;
			case SlotOption.THIS_MONTH:
				const startOfMonth = formatDate(getStartOfMonth(new Date()));
				const deltaMonthDays =
					Math.floor(
						(new Date(state.today).getTime() -
							new Date(startOfMonth).getTime()) /
							(1000 * 3600 * 24),
					) + 1;
				getTotalValueInDateRange(
					startOfMonth,
					state.today,
					unitType,
				).then((total) => {
					setValue(
						calcType === "AVG"
							? Math.round(total / deltaMonthDays)
							: total,
					);
				});
				break;
			case SlotOption.THIS_YEAR:
				const startOfYear = formatDate(getStartOfYear(new Date()));
				const deltaYearDays =
					Math.floor(
						(new Date(state.today).getTime() -
							new Date(startOfYear).getTime()) /
							(1000 * 3600 * 24),
					) + 1;
				getTotalValueInDateRange(
					startOfYear,
					state.today,
					unitType,
				).then((total) => {
					setValue(
						calcType === "AVG"
							? Math.round(total / deltaYearDays)
							: total,
					);
				});
				break;
			case SlotOption.LAST_DAY:
				const lastDay = formatDate(getLastDay());
				getTotalValueByDate(lastDay, unitType).then((total) => {
					setValue(total);
				});
				break;
			case SlotOption.LAST_WEEK:
				const lastWeek = formatDate(getLastSevenDays());
				getTotalValueInDateRange(lastWeek, state.today, unitType).then(
					(total) => {
						setValue(
							calcType === "AVG" ? Math.round(total / 7) : total,
						);
					},
				);
				break;
			case SlotOption.LAST_MONTH:
				const lastMonth = formatDate(getLastThirthyDays());
				getTotalValueInDateRange(lastMonth, state.today, unitType).then(
					(total) => {
						setValue(
							calcType === "AVG" ? Math.round(total / 30) : total,
						);
					},
				);
				break;
			case SlotOption.LAST_YEAR:
				const lastYearDate = formatDate(getLastYearInDays());
				getTotalValueInDateRange(
					lastYearDate,
					state.today,
					unitType,
				).then((total) => {
					setValue(
						calcType === "AVG" ? Math.round(total / 365) : total,
					);
				});
				break;
			default:
				console.warn("Unable to find data", optionType);
		}
	};

	useEffect(() => {
		state.off(EVENTS.REFRESH_EVERYTHING, updateData);
		state.on(EVENTS.REFRESH_EVERYTHING, updateData);

		updateData();

		return () => {
			state.off(EVENTS.REFRESH_EVERYTHING, updateData);
		};
	}, [unitType, optionType, calcType]);

	return (
		<div className="slot">
			<div id="customID" className="slot__label">
				<div>{getSlotLabel(optionType)}</div>
				<div className="slot__buttons">
					<RadixTooltip.Provider delayDuration={200}>
						{showCalcType && (
							<Tooltip
								content={
									calcType == "TOTAL"
										? "Show average"
										: "Show total"
								}
							>
								<button
									className="KTR-min-button"
									ref={calcButtonRef}
									onClick={() => {
										handleCalcClick();
									}}
								></button>
							</Tooltip>
						)}

						<Tooltip content="Change Unit">
							<button
								className="KTR-min-button"
								ref={unitButtonRef}
								onClick={() => {
									handleUnitClick();
								}}
							></button>
						</Tooltip>
						<Tooltip content="Change Slot Type">
							<button
								className="KTR-min-button"
								ref={typeButtonRef}
								onClick={() => {
									handleTypeClick();
								}}
							></button>
						</Tooltip>
						<Tooltip content="Delete Slot">
							<button
								className="KTR-min-button"
								ref={deleteButtonRef}
								onClick={() => {
									onDelete(index);
								}}
							></button>
						</Tooltip>
					</RadixTooltip.Provider>
				</div>
			</div>
			<div className="slot__info">
				<div className="slot__value">{value.toLocaleString()}</div>
				<div className="slot__unit">
					{unitType.toLowerCase() +
						"s" +
						(showCalcType && calcType == "AVG" ? " (avg.)" : "")}
				</div>
			</div>
			{/* {showChart && <DailyActivityChart date={state.today} />} */}
		</div>
	);
};
