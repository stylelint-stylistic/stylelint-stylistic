import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Fixes one snippet under this rule, its fix off, and `declaration-block-trailing-semicolon: never`, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param primary - This rule's primary option.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @returns The file the pass left, and how many warnings the pass reported and the pair has about the file.
 */
async function fix (code: string, primary: string, thisRuleFirst: boolean): Promise<{
	code: string,
	reported: number,
	left: number,
}> {
	let pair: [string, unknown][] = [[`@stylistic/at-rule-semicolon-space-before`, [primary, { disableFix: true }]], [`@stylistic/declaration-block-trailing-semicolon`, `never`]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config })

	return { code: fixed.code ?? code, reported: fixed.results[0]?.warnings.length ?? 0, left: read.results[0]?.warnings.length ?? 0 }
}

describe(`the whitespace in front of the semicolon of a bodiless at-rule the rule about a trailing semicolon takes out`, () => {
	// The semicolon is gone once the pass is over, so this rule has nothing to say about the whitespace in front of it whichever side it is listed
	it(`draws no warning of this rule, its fix off, in either order`, async () => {
		expect(await fix(`a { @import "x" ; }`, `never`, true)).toEqual({ code: `a { @import "x" }`, reported: 0, left: 0 })
		expect(await fix(`a { @import "x" ; }`, `never`, false)).toEqual({ code: `a { @import "x" }`, reported: 0, left: 0 })
		expect(await fix(`a { @import "x"; }`, `always`, true)).toEqual({ code: `a { @import "x" }`, reported: 0, left: 0 })
	})
})
