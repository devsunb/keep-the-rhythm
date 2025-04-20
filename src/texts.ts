import { SlotOption } from "./types";

export function getSlotLabel(option: SlotOption) {
	switch (option) {
		case SlotOption.THIS_DAY:
			return "Today";
		case SlotOption.THIS_WEEK:
			return "This Week";
		case SlotOption.THIS_MONTH:
			return "This Month";
		case SlotOption.THIS_YEAR:
			return "This Year";
		case SlotOption.LAST_DAY:
			return "Last 24 Hours";
		case SlotOption.LAST_WEEK:
			return "Last 7 Days";
		case SlotOption.LAST_MONTH:
			return "Last 30 Days";
		case SlotOption.LAST_YEAR:
			return "Last Year";
	}
}
