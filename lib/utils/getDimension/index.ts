import valueParser, { type Node } from "postcss-value-parser"

import { HEX_ESCAPE_TERMINATOR, IDENTIFIER_CODE_POINT, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { spelledRuns } from "../spelledRuns/index.ts"

/** The `\0` and `\9` hacks hiding a value from one browser or another. */
const HACK_UNITS = [`\\0`, `\\9`]

/**
 * Gets a value node's dimension, and where each character read stands in the node.
 * @param syntax - The rule's syntax.
 * @param node - The value parser node, if any.
 * @returns The dimension and positions, or nulls where there is none.
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
	// Where each character of the copy stands in the node; every cut below moves what follows, so the file is measured through this map
	let positions = Array.from({ length: value.length }, (_, index) => index)

	/**
	 * Takes a run out of the copy and the map.
	 * @param start - Where the run opens in the copy.
	 * @param length - How many characters the run takes.
	 */
	function take (start: number, length: number): void {
		value = value.slice(0, start) + value.slice(start + length)
		positions.splice(start, length)
	}

	// Less ends a unit at the first escape whatever it spells (`10P\9X` is `10P` and the keyword `\9X`), so no hack comes out and the cut below falls on the escape (#527)
	let endsAtEscape = syntax.endsUnitAtEscape()

	// The hacks come off wherever they stand, only where the file spells an escape (`10PX\\0` ends in an escaped backslash, #414); the escape's closing whitespace stays, so the unit of `10px\9 2PX` ends at the space (#526)
	let hackRuns = endsAtEscape ? [] : spelledRuns(value).filter((run) => run.escape && HACK_UNITS.some((hack) => run.text === hack || (run.text.startsWith(hack) && HEX_ESCAPE_TERMINATOR.test(run.text.slice(hack.length)))))

	// From the end, so each run's index still counts in the copy
	for (let hackRun of hackRuns.toReversed()) take(hackRun.index, 2)

	let parsedUnit = valueParser.unit(value)

	if (!parsedUnit) {
		return {
			unit: null,
			number: null,
			positions: null,
		}
	}

	// `valueParser.unit` calls everything behind the number a unit; an identifier ends at the first character that is no code point of one, an escape aside (`10px#fff` is `10px` and `#fff`, #426; `10px\#fff` has the unit `px\#fff`, #414), or at the escape under Less (#527); the rest stays in the copy
	let unitEnd = spelledRuns(parsedUnit.unit).find((run) => (run.escape ? endsAtEscape : !IDENTIFIER_CODE_POINT.test(run.text)))?.index
	let unit = unitEnd === undefined ? parsedUnit.unit : parsedUnit.unit.slice(0, unitEnd)
	// A closing hexadecimal escape may have taken the whitespace behind it, which is the escape's: the unit of `10PX\61 $VAR` is `PX\61`. Between letters it stays, `P\61 X` being one identifier, as does an escaped space, `10PX\ `
	let last = spelledRuns(unit).at(-1)
	let closing = last?.escape ? last.text.match(TRAILING_CSS_WHITESPACE)?.[0] ?? `` : ``
	let closes = closing !== `` && last !== undefined && last.text.length > closing.length + 1

	return {
		...parsedUnit,
		unit: closes ? unit.slice(0, -closing.length) : unit,
		positions,
	}
}
