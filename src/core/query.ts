import jsep from "jsep";
import { DailyActivity } from "@/db/db";

jsep.addBinaryOp("starts_with", 6);
export function parseQueryToJSEP(query: string) {
	let normalized = normalizeLogicalOperators(query);
	const parsed = jsep(normalized);
	return parsed;
}

function normalizeLogicalOperators(input: string): string {
	return input.replace(/\bAND\b/gi, "&&").replace(/\bOR\b/gi, "||");
}

// export function evaluateExpression(node: any, data: DailyActivity): boolean {
// 	if (!data) return false;
// 	if (!node.type) return false;
// 	console.log("evaluating expression");

// 	switch (node.type) {
// 		case "Literal":
// 			return node.value;
// 		case "Identifier":
// 			return (data as any)[node.name];
// 		case "BinaryExpression":
// 			console.log("binary");
// 			const left = evaluateExpression(node.left, data);
// 			let right = evaluateExpression(node.right, data);

// 			if (node.value[0] === "/") {
// 				right = node.value.substring(1);
// 			}
// 			switch (node.operator) {
// 				case "&&":
// 					return left && right;
// 				case "||":
// 					return left || right;
// 				case "contains":
// 					return String(left).includes(String(right));
// 				case "starts_with":
// 					return String(left).startsWith(String(right));
// 				case "ends_with":
// 					return String(left).endsWith(String(right));
// 				case "==":
// 					return left === right;
// 				case "!=":
// 					return left !== right;
// 				case ">":
// 					return left > right;
// 				case "<":
// 					return left < right;
// 				default:
// 					throw new Error("Unsupported operator: " + node.operator);
// 			}
// 		case undefined:
// 			console.log(node);
// 		default:
// 			throw new Error("Unsupported node type: " + node.type);
// 	}
// }

export function compileEvaluator(node: any): (entry: DailyActivity) => boolean {
	const code = generateCode(node);
	console.log("Generated filter function:", `return ${code};`); // Add this line

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
