import valueParser, { type Node } from "postcss-value-parser"

import { HEX_ESCAPE_TERMINATOR, IDENTIFIER_CODE_POINT, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { spelledRuns } from "../spelledRuns/index.ts"

/** The `\0` and `\9` a stylesheet ends a value with to hide it from one browser or another, each a backslash and one digit. */
const HACK_UNITS = [`\\0`, `\\9`]

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

	// The `\0` and `\9` a stylesheet ends a value with to hide it from one browser or another are no part of the unit, and are taken off the copy wherever they stand. Only an escape the file spells is one: `10PX\\0` is a unit ending in an escaped backslash and a digit, as the tokenizer reads it, and taking two characters out of the middle of it would leave every escape behind that point read from the wrong side (#414). The whitespace closing such an escape is left in the copy where the file writes one: `10px\9 2PX` is one dimension to the grammar, and the hack taken out of it leaves `10px 2PX`, whose unit ends at the space the way any unit ends at a character that is no code point of an identifier — so `px` is the unit, and what stands behind the hack is off it, however many hacks the word carries (#526)
	let hackRuns = spelledRuns(value).filter((run) => run.escape && HACK_UNITS.some((hack) => run.text === hack || (run.text.startsWith(hack) && HEX_ESCAPE_TERMINATOR.test(run.text.slice(hack.length)))))

	// Taken from the end, so that the place of each run still counts in the copy the next one is taken out of
	for (let hackRun of hackRuns.toReversed()) take(hackRun.index, 2)

	let parsedUnit = valueParser.unit(value)

	if (!parsedUnit) {
		return {
			unit: null,
			number: null,
			positions: null,
		}
	}

	// `valueParser.unit` calls everything written behind the number a unit, and a unit is an identifier: it ends at the first character that is no code point of one, an escape aside. That is the reading every tokenizer takes — `10px#fff` is the dimension `10px` and the hash `#fff` (#426), `10PX$VAR` the dimension `10PX` and the name `VAR` behind a delimiter, `1px!important` the dimension and the flag — and it is the reading an escape needs, since a character escaped into a name is a character of the unit and ends nothing: `10px\#fff` is one dimension with the unit `px\#fff`, as is `10PX\*2REM` with the unit `PX\*2REM` (#414). What stands behind the unit is left in the copy and off the unit, so the caller measures the run it underlines through `positions` and writes into nothing else
	let unitEnd = spelledRuns(parsedUnit.unit).find((run) => !run.escape && !IDENTIFIER_CODE_POINT.test(run.text))?.index
	let unit = unitEnd === undefined ? parsedUnit.unit : parsedUnit.unit.slice(0, unitEnd)
	// A hexadecimal escape closing the unit may have taken the whitespace behind it, and that whitespace is the escape's rather than the unit's: `10PX\61 $VAR` is the dimension `10PX\61 ` to the tokenizer, and the unit named is `PX\61`, which is what the file spells of it and what the escape spells with or without its closing character. Between the letters of a unit such whitespace stays where it is, `P\61 X` being one identifier — and so does the whitespace an escape spells rather than closes on, `10PX\ ` being a unit ending in an escaped space, which is no closing character of anything
	let last = spelledRuns(unit).at(-1)
	let closing = last?.escape ? last.text.match(TRAILING_CSS_WHITESPACE)?.[0] ?? `` : ``
	let closes = closing !== `` && last !== undefined && last.text.length > closing.length + 1

	return {
		...parsedUnit,
		unit: closes ? unit.slice(0, -closing.length) : unit,
		positions,
	}
}
