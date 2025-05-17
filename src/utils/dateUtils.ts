import { moment as _moment } from "obsidian";
const moment = _moment as unknown as typeof _moment.default;

export function getRelativeDate(daysOffset: number) {
	const todayTime = new Date().getTime();
	const timeOffset = daysOffset * 24 * 60 * 60 * 1000;
	return new Date(todayTime + timeOffset);
}

export function getLastSevenDays() {
	return new Date(getRelativeDate(-7).setHours(0, 0, 0, 0));
}

export function getLastThirthyDays() {
	return new Date(getRelativeDate(-30).setHours(0, 0, 0, 0));
}

export function getLastYearInDays() {
	return new Date(getRelativeDate(-365).setHours(0, 0, 0, 0));
}

// export function getStartOfWeek(date: Date) {
// 	const day = date.getDay();
// 	const diff = date.getDate() - day + (day === 0 ? -6 : 1);
// 	return new Date(date.getFullYear(), date.getMonth(), diff, 0, 0, 0, 0);
// }

export function getStartOfWeek(date: Date, weekStart: number = 1): Date {
	const currentDay = date.getDay(); // 0 (Sun) - 6 (Sat)
	const diff = (currentDay - weekStart + 7) % 7;
	const startDate = new Date(date);
	startDate.setDate(date.getDate() - diff);
	startDate.setHours(0, 0, 0, 0);
	return startDate;
}

export function getStartOfMonth(date: Date) {
	const startOfMonth = new Date(date);
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);
	return startOfMonth;
}

export function getStartOfYear(date: Date) {
	const startOfYear = new Date(date);
	startOfYear.setMonth(0, 1); // January 1st
	startOfYear.setHours(0, 0, 0, 0); // Reset time to midnight
	return startOfYear;
}

export function getLastDay() {
	return new Date(getRelativeDate(-1));
}

export function floorMomentToFive(m: any) {
	const ms = 1000 * 60 * 5;
	return moment(Math.floor(m.valueOf() / ms) * ms);
}

export const formatDate = (date: Date): string => {
	return (
		date.getFullYear() +
		"-" +
		String(date.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(date.getDate()).padStart(2, "0")
	);
};
