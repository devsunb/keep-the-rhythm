import { SlotOption } from "../types";
import React from "react";
import { getSlotLabel } from "@/texts";
import { useState, useEffect } from "react";
import {
	DailyActivity,
	getActivityByDate,
	getTotalValueByDate,
	getTotalValueInDateRange,
} from "../db";
import {
	formatDate,
	log,
	getRelativeDate,
	getLastSevenDays,
	getLastThirthyDays,
	getLastYearInDays,
	getStartOfWeek,
} from "@/utils";
import { SlotConfig } from "../types";
import { eventEmitter, EVENTS } from "@/events";

export const Slot = ({ index, option, unit, calc }: SlotConfig) => {
	const [value, setValue] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(true);

	const todayStr = formatDate(new Date());

	const callOptionFetch = (option: SlotOption) => {
		switch (option) {
			case SlotOption.THIS_DAY:
				getTotalValueByDate(todayStr, unit).then((newVal) => {
					setValue(newVal);
				});
				break;
			case SlotOption.THIS_WEEK:
				const thisWeekStart = formatDate(getStartOfWeek(new Date()));
				getTotalValueInDateRange(thisWeekStart, todayStr, unit).then(
					(total) => {
						setValue(total);
					},
				);
				break;
			case SlotOption.THIS_MONTH:
				break;
			case SlotOption.THIS_YEAR:
				break;
			case SlotOption.LAST_DAY:
				break;
			case SlotOption.LAST_WEEK:
				const lastWeek = formatDate(getLastSevenDays());
				getTotalValueInDateRange(lastWeek, todayStr, unit).then(
					(total) => {
						setValue(total);
					},
				);
				break;
			case SlotOption.LAST_MONTH:
				const lastMonth = formatDate(getLastThirthyDays());
				getTotalValueInDateRange(lastMonth, todayStr, unit).then(
					(total) => {
						setValue(total);
					},
				);
				break;
			case SlotOption.LAST_YEAR:
				const lastYearDate = formatDate(getLastYearInDays());
				getTotalValueInDateRange(lastYearDate, todayStr, unit).then(
					(total) => {
						setValue(total);
					},
				);
				break;
			default:
				console.warn("Unknown option", option);
		}
	};

	const handleRefresh = () => {
		callOptionFetch(option);
		setIsLoading(false);
	};

	useEffect(() => {
		handleRefresh();

		eventEmitter.on(EVENTS.REFRESH_EVERYTHING, handleRefresh);

		return () => {
			eventEmitter.off(EVENTS.REFRESH_EVERYTHING, handleRefresh);
		};
	}, [todayStr]);

	// if (isLoading) return <div>Loading...</div>;
	// if (error) return <div>Error: {error.message}</div>;
	// if (!data) return <div>No data found</div>;

	return (
		<div className="slot">
			<span id="customID" className="slot__label">
				{getSlotLabel(option)}
			</span>
			<div className="slot__info">
				<div className="slot__value">{value.toLocaleString()}</div>
				<div className="slot__unit">{unit.toLowerCase() + "s"}</div>
			</div>
		</div>
	);
};
