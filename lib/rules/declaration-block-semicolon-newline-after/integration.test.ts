import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Fixes one snippet under this rule and `no-extra-semicolons`, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param options - The setting of this rule.
 * @param thisRuleFirst - Whether it is listed first.
 * @returns The file the pass left and the count of the warnings the pair has about it.
 */
async function fix (code: string, options: unknown, thisRuleFirst: boolean): Promise<{ code: string, left: number }> {
	let pair: [string, unknown][] = [[`@stylistic/declaration-block-semicolon-newline-after`, options], [`@stylistic/no-extra-semicolons`, true]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config })

	return { code: fixed.code ?? code, left: read.results[0]?.warnings.length ?? 0 }
}

describe(`the run behind a semicolon in front of a free one \`no-extra-semicolons\` takes out in the same run`, () => {
	// The free semicolon is gone once the pass is over, so the break is written into the run as it will stand rather than in front of that semicolon
	it.each([true, false])(`is written with one break, this rule listed first: %s`, async (thisRuleFirst) => {
		expect(await fix(`a {\n  b: c; ;\n  d: e;\n}`, `always`, thisRuleFirst)).toEqual({ code: `a {\n  b: c;\n  d: e;\n}`, left: 0 })
	})
})
