import valueParser, { type Node } from "postcss-value-parser"

import { INTERPOLATION_CHARACTER } from "../../regexps.ts"
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

	// A word reaches this reading holding no interpolation, since `isStandardValue` above turns away one that holds a whole one and the caller passes over one that carries any text of one broken across words (#298). So a character an interpolation is spelled with is a character of the word, and no unit is spelled with any of them: the dimension ends where the first one stands, and everything from there on is taken off the copy. Taking the characters alone out, as this reading used to, glued the two sides together and read `pxfff` as the unit of `10px#fff` (#426)
	let interpolationCharacter = value.search(INTERPOLATION_CHARACTER)

	if (interpolationCharacter !== -1) take(interpolationCharacter, value.length - interpolationCharacter)

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
