import { HeatmapColorModes, HeatmapConfig } from "@/defs/types";
import jsep, { Expression } from "jsep";
import { DailyActivity } from "@/db/types";
import {
	isValidCalculationType,
	isValidTargetCount,
	isValidUnit,
	isValidColoringMode,
} from "@/utils/utils";
import { SlotConfig, TargetCount, Unit, CalculationType } from "@/defs/types";
import { state } from "./pluginState";
jsep.addBinaryOp("starts_with", 6);

export function parseSlotQuery(query: string): SlotConfig[] {
	// returns a SlotConfig[]?
	const arrayOfLines = query.match(/[^\r\n]+/g);
	if (!arrayOfLines || arrayOfLines.length == 0) return [];

	let slots: SlotConfig[] = [];

	for (let i = 0; i < arrayOfLines.length; i++) {
		const parts = arrayOfLines[i].replace(/ /g, "").split(",");

		let type = parts[0];
		let unit = Unit.WORD;
		let calc = CalculationType.TOTAL;

		if (!isValidTargetCount(type)) {
			console.error("Invalid Type on Slots Codeblock");
			return [];
			// deveria mostrar o erro no codeblock mesmo, mas nao sei fazer isso ainda
		}

		if (parts[1] && isValidUnit(parts[1])) {
			unit = parts[1];
		}
		if (parts[2] && isValidCalculationType(parts[2])) {
			calc = parts[2];
		}

		slots.push({
			index: i,
			option: type as TargetCount,
			unit: unit as Unit,
			calc: (calc as CalculationType) ?? CalculationType.TOTAL,
		});
	}

	return slots;
}

export function parseQueryToJSEP(query: string) {
	const { filterText, optionsText } = splitFilterAndOptions(query);
	let normalized = normalizeLogicalOperators(filterText);

	let parsed;
	let config: HeatmapConfig = structuredClone(
		state.plugin.data.settings.heatmapConfig,
	);
	config.hideMonthLabels = false;
	config.hideWeekdayLabels = false;

	if (filterText) {
		parsed = jsep(normalized);
	}

	if (optionsText) {
		const arrayOfLines = query.match(/[^\r\n]+/g);
		if (!arrayOfLines || (arrayOfLines && arrayOfLines.length < 1)) return;

		/** defaults to user settings to define heatmapconfig */

		for (let i = 0; i < arrayOfLines?.length; i++) {
			const line = arrayOfLines[i];
			const firstSpace = line.indexOf(" ");
			let keyword;
			let details;

			if (firstSpace !== -1) {
				keyword = line.slice(0, firstSpace);
				details = line.slice(firstSpace + 1);
			} else {
				keyword = line;
				details = "";
			}

			switch (keyword) {
				case "OPTIONS":
					break;
				case "HIDE":
					if (details) {
						const items = details.replace(/ /g, "").split(",");
						for (let i = 0; i < items.length; i++) {
							switch (items[i]) {
								case "month_labels":
									config.hideMonthLabels = true;
									break;
								case "weekday_labels":
									config.hideWeekdayLabels = true;
									break;
							}
						}
					}
					break;
				case "COLORING_MODE":
					if (details && isValidColoringMode(details.trim())) {
						config.intensityMode = details as HeatmapColorModes;
					}
					break;
				case "STOPS":
					if (details) {
						const stops = details.replace(/ /g, "").split(",");
						if (stops.length == 1) {
							config.intensityStops.high = Number(stops[0]);
						} else if (stops.length == 2) {
							config.intensityStops.low = Number(stops[0]);
							config.intensityStops.high = Number(stops[1]);
						} else if (stops.length == 3) {
							config.intensityStops.low = Number(stops[0]);
							config.intensityStops.medium = Number(stops[1]);
							config.intensityStops.high = Number(stops[2]);
						}
					}
					break;
				case "SQUARED_CELLS":
					config.roundCells = false;
					break;
				case "ROUNDED_CELLS":
					config.roundCells = true;
					break;
			}
		}
	}

	return {
		filter: parsed,
		options: config,
	};
}

function normalizeLogicalOperators(input: string): string {
	return input.replace(/\bAND\b/gi, "&&").replace(/\bOR\b/gi, "||");
}

export function compileEvaluator(node: any): (entry: DailyActivity) => boolean {
	const code = generateCode(node);

	return new Function("entry", `return ${code};`) as (
		entry: DailyActivity,
	) => boolean;
}

function generateCode(node: any): string {
	switch (node.type) {
		case "Literal":
			let value = node.value;
			if (typeof value === "string") {
				value = value.startsWith("/") ? value.substring(1) : value;
			}
			return JSON.stringify(value);
		case "Identifier":
			return `entry.${node.name}`;
		case "BinaryExpression":
			let left = generateCode(node.left);
			let right = generateCode(node.right);

			switch (node.operator) {
				case "&&":
					return `(${left} && ${right})`;
				case "||":
					return `(${left} || ${right})`;
				case "starts_with":
					return `(${left}.startsWith(${right}))`;
				case "contains":
					return `(${left}.includes(${right}))`;
				case "==":
					return `(${left} === ${right})`;
				case "!=":
					return `(${left} !== ${right})`;
				case ">":
					return `(${left} > ${right})`;
				case "<":
					return `(${left} < ${right})`;
				default:
					throw new Error(`Unsupported operator: ${node.operator}`);
			}
		default:
			throw new Error(`Unsupported node type: ${node.type}`);
	}
}

function splitFilterAndOptions(input: string) {
	const lines = input.split("\n");
	const sectionHeaderPattern = /^[A-Z_]+/;

	let filterLines: string[] = [];
	let optionsLines: string[] = [];

	let inOptions = false;

	for (const line of lines) {
		if (!inOptions && sectionHeaderPattern.test(line.trim())) {
			inOptions = true;
		}

		if (inOptions) {
			optionsLines.push(line);
		} else {
			filterLines.push(line);
		}
	}

	return {
		filterText: filterLines.join("\n").trim(),
		optionsText: optionsLines.join("\n").trim(),
	};
}
