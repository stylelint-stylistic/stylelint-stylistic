import valueParser, { type Node } from "postcss-value-parser"

import { EVERY_INTERPOLATION_CHARACTER } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"

/**
 * Gets the dimension (number and unit) from a value node, and says where the text it was read out of stands in the node.
 * @param syntax - The syntax the rule is built over.
 * @param node - The value parser node, or nothing at all.
 * @returns The dimension object, or null values where the node carries no dimension.
 */
export function getDimension (syntax: Syntax, node?: Partial<Node>): {
	unit: null,
	number: null,
	positions: null,
} | (valueParser.Dimension & { positions: number[] }) {
	if (!node || !node.value) {
		return {
			unit: null,
			number: null,
			positions: null,
		}
	}

	// Ignore non-word nodes
	if (node.type !== `word`) {
		return {
			unit: null,
			number: null,
			positions: null,
		}
	}

	// Ignore non standard syntax
	if (!syntax.isStandardValue(node.value)) {
		return {
			unit: null,
			number: null,
			positions: null,
		}
	}

	// Ignore HEX
	if (node.value.startsWith(`#`)) {
		return {
			unit: null,
			number: null,
			positions: null,
		}
	}

	let value = node.value
	// Where each character of the copy read below stands in the text the node holds. A reading taken out of that copy is measured in the file through this map and no other way, since every cut below moves what follows it
	let positions = Array.from({ length: value.length }, (_, index) => index)

	/**
	 * Takes a run out of the copy being read, and out of the map with it.
	 * @param start - Where the run opens in the copy.
	 * @param length - How many characters the run holds.
	 */
	function take (start: number, length: number): void {
		value = value.slice(0, start) + value.slice(start + length)
		positions.splice(start, length)
	}

	// Remove non standard stuff, from the end of the copy to its beginning, so that a cut leaves the positions of the runs ahead of it where they were
	for (let { 0: run, index } of [...value.matchAll(EVERY_INTERPOLATION_CHARACTER)].toReversed()) take(index, run.length)

	// ignore hack units
	for (let hack of [`\\0`, `\\9`]) {
		let hackIndex = value.indexOf(hack)

		if (hackIndex !== -1) take(hackIndex, hack.length)
	}

	let parsedUnit = valueParser.unit(value)

	if (!parsedUnit) {
		return {
			unit: null,
			number: null,
			positions: null,
		}
	}

	return {
		...parsedUnit,
		positions,
	}
}
