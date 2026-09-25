import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Spells warnings as their line, column and rule.
 * @param warnings - The warnings.
 * @returns The spellings.
 */
function where (warnings: { line: number, column: number, rule: string }[] | undefined): string[] {
	return (warnings ?? []).map(({ line, column, rule }) => `${line}:${column} ${rule}`)
}

/**
 * Fixes one snippet under this rule and `declaration-block-trailing-semicolon: never`, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param options - The setting of this rule.
 * @param thisRuleFirst - Whether it is listed first.
 * @returns The file the pass left, the warnings the pass reported, and those the pair has about the file.
 */
async function fix (code: string, options: unknown, thisRuleFirst: boolean): Promise<{
	code: string,
	reported: string[],
	left: string[],
}> {
	let pair: [string, unknown][] = [[`@stylistic/declaration-block-semicolon-space-after`, options], [`@stylistic/declaration-block-trailing-semicolon`, `never`]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config })

	return { code: fixed.code ?? code, reported: where(fixed.results[0]?.warnings), left: where(read.results[0]?.warnings) }
}

describe(`the whitespace behind a semicolon the rule about a trailing semicolon takes out in the same run`, () => {
	// The semicolon is gone once the pass is over, and the run behind it belongs to the comment behind the declaration, so either order leaves the run as the file spells it
	it.each([
		[`a {\n\tcolor: pink; /* c */\n}`, `never`],
		[`a { b: c;/* x */ }`, `always`],
		[`a { b: c;  /* x */ }`, `always`],
		[`a { b: c;  /* x */ }`, `never`],
		[`a {\n\tb: c;\n\t/* x */\n}`, `always`],
		[`a {\n\tb: c;\n\t/* x */\n}`, `never`],
	])(`is left as it stands in %j under %j in either order`, async (code, options) => {
		let expected = { code: code.replace(`;`, ``), reported: [], left: [] }

		expect(await fix(code, options, true)).toEqual(expected)
		expect(await fix(code, options, false)).toEqual(expected)
	})

	it(`draws no warning of this rule, its fix off, in either order`, async () => {
		let options = [`always`, { disableFix: true }]

		expect(await fix(`a { b: c;/* x */ }`, options, true)).toEqual({ code: `a { b: c/* x */ }`, reported: [], left: [] })
		expect(await fix(`a { b: c;/* x */ }`, options, false)).toEqual({ code: `a { b: c/* x */ }`, reported: [], left: [] })
	})

	it.each([true, false])(`still draws it where a disable comment on the line of a second semicolon keeps that rule's fix off, and the semicolon stays, this rule listed first: %s`, async (thisRuleFirst) => {
		let code = `a {\n  b: c;/* x */\n  ; /* stylelint-disable-line @stylistic/declaration-block-trailing-semicolon */\n}`
		let { code: left, reported } = await fix(code, [`always`, { disableFix: true }], thisRuleFirst)

		expect(left).toBe(code)
		expect(reported.some((warning) => warning.startsWith(`2:`) && warning.endsWith(`declaration-block-semicolon-space-after`))).toBe(true)
	})
})
