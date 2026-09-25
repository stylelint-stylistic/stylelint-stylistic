import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

import { ruleName } from "./index.ts"

/**
 * Lists the orders of a set of rules.
 * @param rules - The rules and their settings.
 * @returns Every order.
 */
function ordersOf (rules: [string, unknown][]): [string, unknown][][] {
	if (rules.length <= 1) return [rules]

	return rules.flatMap((rule, index) => ordersOf(rules.toSpliced(index, 1)).map((rest) => [rule].concat(rest)))
}

/**
 * Fixes one snippet under this rule at `tab` and its neighbors in every order, and reads each output back.
 * @param code - The snippet.
 * @param neighbors - The neighbors and their settings.
 * @returns Each order's output and the count of the warnings the rules have about it.
 */
async function fixInEveryOrder (code: string, neighbors: [string, unknown][]): Promise<{ code: string, left: number }[]> {
	let outputs: { code: string, left: number }[] = []

	for (let order of ordersOf([[ruleName, `tab`], ...neighbors])) {
		let config = { plugins, rules: Object.fromEntries(order) }
		// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
		let fixed = await stylelint.lint({ code, config, fix: true })
		// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
		let read = await stylelint.lint({ code: fixed.code ?? code, config })

		outputs.push({ code: fixed.code ?? code, left: read.results[0]?.warnings.length ?? 0 })
	}

	return outputs
}

describe(`a line opening behind a stray semicolon behind a rule's closing brace, beside the rules taking the semicolon out`, () => {
	let noExtra: [string, unknown] = [`@stylistic/no-extra-semicolons`, true]

	// PostCSS files the semicolon with the break in front of it in the rule's raws and the whitespace behind it in the node's, and taking the semicolon out leaves both, so the line's head is read across the two raws as that rule leaves it
	it.each([
		[`a {\n\tb {}\n\t\t; c {}\n}`, `a {\n\tb {}\n\tc {}\n}`],
		[`a {\n\tb {}\n\t\t;; c {}\n}`, `a {\n\tb {}\n\tc {}\n}`],
		[`a {\n\tb {}\n\t\t; d: e;\n}`, `a {\n\tb {}\n\td: e;\n}`],
	])(`is indented in one run in either order in %j`, async (code, output) => {
		expect(await fixInEveryOrder(code, [noExtra])).toEqual([{ code: output, left: 0 }, { code: output, left: 0 }])
	})

	// Written into both raws by the rules about the run in front of the brace, the brace's line is read across them too
	it(`is indented in one run in every order where the closing brace's line opens behind the semicolon`, async () => {
		let output = `a { b {}\n}`

		expect(await fixInEveryOrder(`a { b {} ; }`, [noExtra, [`@stylistic/block-closing-brace-newline-before`, `always`]])).toEqual(Array.from({ length: 6 }, () => ({ code: output, left: 0 })))
	})
})
