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

	// Placed in the print the empty lines are counted in, by where the syntax's stringifier writes the raw holding it
	it.each([
		[`postcss-scss`, `@stylistic/scss/`, `a {\n  font: 12px {\n    family: x;\n\n\n;\n  }\n\n\n;\n}`, [`6:2`, `10:2`]],
		[`postcss-styled-syntax`, `@stylistic/styled/`, `const A = styled.div\`\n  color: red;\n;\n\n\n;\n\`;\nconst B = styled.p\`\n  top: 0;\n;\n\n\n;\n\`;\n`, [`5:1`, `6:2`, `12:1`, `13:2`]],
	])(`is counted empty under %s in a Sass nested property's block and in the tail of a template host code follows`, async (customSyntax, namespace, code, warnings) => {
		let result = await stylelint.lint({ code, customSyntax, config: { plugins, rules: { [`${namespace}max-empty-lines`]: 2, [`${namespace}no-extra-semicolons`]: true } } })

		expect((result.results[0]?.warnings ?? []).filter((warning) => warning.rule === `${namespace}max-empty-lines`).map(({ line, column }) => `${line}:${column}`)).toEqual(warnings)
	})
})

/**
 * Fixes one snippet under this rule and `no-eol-whitespace`, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param maximum - The most empty lines this rule allows.
 * @param neighbor - The setting of the rule about the whitespace ending a line.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @returns The file the pass left and the count of the warnings the pair has about it.
 */
async function fixBesideNoEol (code: string, maximum: number, neighbor: unknown, thisRuleFirst: boolean): Promise<{ code: string, left: number }> {
	let pair: [string, unknown][] = [[ruleName, maximum], [`@stylistic/no-eol-whitespace`, neighbor]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config })

	return { code: fixed.code ?? code, left: read.results[0]?.warnings.length ?? 0 }
}

describe(`a line of nothing but spaces and tabs the rule about the whitespace ending a line empties`, () => {
	// The line is empty once that rule has trimmed it, so it is counted as one whichever side of that rule this one is listed
	it.each([
		[`a {}\n  \n  \n  \nb {}`, 1, `a {}\n\nb {}`],
		[`a {\n  b: c;\n  \n\t\n  \n}`, 1, `a {\n  b: c;\n\n}`],
		[`a {}\n \n`, 1, `a {}\n`],
		[`/* a\n  \n  \n*/`, 1, `/* a\n\n*/`],
		[`a { b: c,\n  \n  \n  d; }`, 0, `a { b: c,\n  d; }`],
		[`a {}\r\n  \r\n  \r\nb {}`, 1, `a {}\r\n\r\nb {}`],
		[`\n \n`, 0, ``],
	])(`is counted empty in %j at most %i in either order`, async (code, maximum, output) => {
		expect(await fixBesideNoEol(code, maximum, true, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoEol(code, maximum, true, false)).toEqual({ code: output, left: 0 })
	})

	it(`is not where a disable comment keeps that rule off such a line`, async () => {
		let code = `a {}\n/* stylelint-disable @stylistic/no-eol-whitespace */\n  \n  \n/* stylelint-enable @stylistic/no-eol-whitespace */\nb {}`

		expect(await fixBesideNoEol(code, 0, true, true)).toEqual({ code, left: 0 })
		expect(await fixBesideNoEol(code, 0, true, false)).toEqual({ code, left: 0 })
	})

	// A comment disabling every rule on its own line keeps that rule off no line of spaces
	it(`is where a disable comment keeps that rule off another line of the file`, async () => {
		let code = `a {}\n\n  \n\n/* stylelint-disable-line */\n\n\nb {}`

		expect(await fixBesideNoEol(code, 1, true, true)).toEqual({ code: `a {}\n\n/* stylelint-disable-line */\n\nb {}`, left: 0 })
		expect(await fixBesideNoEol(code, 1, true, false)).toEqual({ code: `a {}\n\n/* stylelint-disable-line */\n\nb {}`, left: 0 })
	})

	it(`leaves the runs inside a comment the option passes over as they are`, async () => {
		let code = `a { b: x\n/* c\n\n\n\n */\n  y; }`
		let result = await stylelint.lint({ code, fix: true, config: { plugins, rules: { [ruleName]: [1, { ignore: [`comments`] }] } } })

		expect(result.code).toBe(code)
	})

	it(`is not where that rule passes empty lines over`, async () => {
		let code = `a {}\n  \n  \n  \nb {}`

		expect(await fixBesideNoEol(code, 1, [true, { ignore: [`empty-lines`] }], true)).toEqual({ code, left: 0 })
		expect(await fixBesideNoEol(code, 1, [true, { ignore: [`empty-lines`] }], false)).toEqual({ code, left: 0 })
	})
})
