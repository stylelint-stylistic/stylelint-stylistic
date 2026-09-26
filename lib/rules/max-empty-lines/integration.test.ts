import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

import { ruleName } from "./index.ts"

/**
 * Fixes one snippet under this rule and `no-extra-semicolons`, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param maximum - The most empty lines this rule allows.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @returns The file the pass left and the count of the warnings the pair has about it.
 */
async function fixBesideNoExtra (code: string, maximum: number, thisRuleFirst: boolean): Promise<{ code: string, left: number }> {
	let pair: [string, unknown][] = [[ruleName, maximum], [`@stylistic/no-extra-semicolons`, true]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config })

	return { code: fixed.code ?? code, left: read.results[0]?.warnings.length ?? 0 }
}

describe(`a line holding nothing but a stray semicolon the rule about extra semicolons takes out`, () => {
	// The line is empty once the semicolon is gone, so it is counted as one whichever side of that rule this one is listed, and the run is written as that rule leaves it
	it.each([
		[`a {\n\tb: c;\n;\n}`, 0, `a {\n\tb: c;\n}`],
		[`a {\n\tb: c;\n\n;\n\n}`, 1, `a {\n\tb: c;\n\n}`],
		[`a {\n\tb: c;\n;\n\td: e;\n}`, 0, `a {\n\tb: c;\n\td: e;\n}`],
	])(`is counted empty in %j at most %i in either order`, async (code, maximum, output) => {
		expect(await fixBesideNoExtra(code, maximum, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoExtra(code, maximum, false)).toEqual({ code: output, left: 0 })
	})

	// PostCSS files a semicolon behind a rule's brace with the run in front of it in the rule's own raw, and the rest of its line in the next raw, so the two are written as one run
	it.each([
		[`a {}\n;\nb {}`, 0, `a {}\nb {}`],
		[`a {\n\tb {}\n;\n}`, 0, `a {\n\tb {}\n}`],
	])(`is written across the raws of a semicolon behind a rule's brace in %j at most %i in either order`, async (code, maximum, output) => {
		expect(await fixBesideNoExtra(code, maximum, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoExtra(code, maximum, false)).toEqual({ code: output, left: 0 })
	})

	// Every warning hands the fix over, and a second pass would read the kept semicolon against the lines of a raw the first had shortened
	it.each([true, false])(`keeps a semicolon a disable comment covers where two runs are collapsed, this rule listed first: %s`, async (thisRuleFirst) => {
		let code = `a {}\n/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n;\n\n\nb {}`

		expect(await fixBesideNoExtra(code, 0, thisRuleFirst)).toEqual({ code: `a {}\n/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n;\nb {}`, left: 0 })
	})

	// The semicolon stays behind the space in front of it, where `no-eol-whitespace` listed behind both reads the line's end
	it(`leaves the space in front of the semicolon where a rule about the whitespace ending a line reads it`, async () => {
		let config = { plugins, rules: { [ruleName]: 0, "@stylistic/no-extra-semicolons": true, "@stylistic/no-eol-whitespace": true } }
		let fixed = await stylelint.lint({ code: `a {} ;\n\n\nb {}`, config, fix: true })

		expect(fixed.code).toBe(`a {}\nb {}`)
	})

	// The root's tail opens in the last rule's own raw behind a semicolon behind its brace, and the head in front of the first node, where the line holding the semicolon opens the file
	it.each([
		[`a {}\n;\n`, 0, `a {}\n`],
		[`a {}\n\n\n;\n`, 1, `a {}\n`],
		[`;\n\n\na {}`, 0, `a {}`],
		[`;;\n\na {}`, 1, `\na {}`],
	])(`is written at the stylesheet's ends in %j at most %i in either order`, async (code, maximum, output) => {
		expect(await fixBesideNoExtra(code, maximum, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoExtra(code, maximum, false)).toEqual({ code: output, left: 0 })
	})

	// A file ending on a taken semicolon ends in front of it, and a stylesheet holding nothing but such semicolons is written as the neighbor leaves it
	it.each([
		[`a {}\n\n\n;`, 2, `a {}\n\n`],
		[`;\n`, 0, ``],
	])(`is written where the file ends on the semicolon in %j at most %i in either order`, async (code, maximum, output) => {
		expect(await fixBesideNoExtra(code, maximum, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoExtra(code, maximum, false)).toEqual({ code: output, left: 0 })
	})

	// PostCSS prints the `<` of `<!--` escaped, three characters longer, and the lines are counted in the print, so the neighbor's semicolons are carried past the escape
	it.each([
		[`a[x="<!--"] {}\n;\nb {}`, `a[x="\\3c !--"] {}\nb {}`],
		[`a[x="</style>"] {\n\tb: c;\n;\n}`, `a[x="\\3c /style>"] {\n\tb: c;\n}`],
	])(`is counted empty behind an escaped text in %j in either order`, async (code, output) => {
		expect(await fixBesideNoExtra(code, 0, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoExtra(code, 0, false)).toEqual({ code: output, left: 0 })
	})

	it(`places the warning on the file's line behind an escaped text`, async () => {
		let result = await stylelint.lint({ code: `a[x="<!--"] {}\n;\n\n\nb {}`, config: { plugins, rules: { [ruleName]: 0, "@stylistic/no-extra-semicolons": true } } })

		expect((result.results[0]?.warnings ?? []).filter((warning) => warning.rule === ruleName).map(({ line, column }) => `${line}:${column}`)).toEqual([`2:2`, `3:1`, `4:1`])
	})
})
