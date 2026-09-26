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

	// A line of spaces a disable comment keeps from that rule holds its spaces and stands, and the others go, whichever side of that rule this one is listed
	it.each([
		[`a {}\n/* stylelint-disable-next-line */\n  \n\n\n  \nb {}\n`, `a {}\n/* stylelint-disable-next-line */\n  \n\nb {}\n`],
		[`a {\n  b: c;\n/* stylelint-disable-next-line */\n  \n\n\n  \n}\n`, `a {\n  b: c;\n/* stylelint-disable-next-line */\n  \n\n}\n`],
	])(`is counted empty in %j but for the line a disable comment keeps`, async (code, output) => {
		expect(await fixBesideNoEol(code, 1, true, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoEol(code, 1, true, false)).toEqual({ code: output, left: 0 })
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

describe(`a warning about empty lines the rules listed earlier wrote lines in front of`, () => {
	// Stylelint reads the line of a warning in the file, and the rules listed first took the file's first line and the characters of later lines out
	it.each([
		[[`@stylistic/no-empty-first-line`, `@stylistic/no-extra-semicolons`, `@stylistic/no-eol-whitespace`, ruleName]],
		[[`@stylistic/no-extra-semicolons`, `@stylistic/no-eol-whitespace`, ruleName, `@stylistic/no-empty-first-line`]],
		[[ruleName, `@stylistic/no-empty-first-line`, `@stylistic/no-extra-semicolons`, `@stylistic/no-eol-whitespace`]],
	])(`stands on the line of the file it is about, past a comment disabling this rule on its own line, in the order %j`, async (order) => {
		let code = `  \na {}\n/* stylelint-disable-line @stylistic/max-empty-lines */\n ;\n \nb {} \n`
		let config = { plugins, rules: Object.fromEntries(order.map((name) => [name, name === ruleName ? 1 : true])) }
		let fixed = await stylelint.lint({ code, config, fix: true })

		expect(fixed.code).toBe(`a {}\n/* stylelint-disable-line @stylistic/max-empty-lines */\n\nb {}\n`)
	})

	// A neighbor writing a break behind the empty lines, or taking the file's first lines out in front of its end, leaves the warning on its line
	it.each([
		[`a { /* stylelint-disable-next-line @stylistic/max-empty-lines */\n\n\n}b {}\n`, [`@stylistic/block-closing-brace-newline-after`, `always`], `a { /* stylelint-disable-next-line @stylistic/max-empty-lines */\n\n}\nb {}\n`],
		[`  \n\na {} /* stylelint-disable-line @stylistic/max-empty-lines */\n\n\n`, [`@stylistic/no-empty-first-line`, true], `a {} /* stylelint-disable-line @stylistic/max-empty-lines */\n`],
	] as [string, [string, unknown], string][])(`stands on the line of the file it is about in %j beside %j in either order`, async (code, [name, setting], output) => {
		for (let thisRuleFirst of [true, false]) {
			let pair: [string, unknown][] = [[ruleName, 1], [name, setting]]
			let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			let fixed = await stylelint.lint({ code, config, fix: true })

			expect(fixed.code).toBe(output)
		}
	})
})

/**
 * Fixes a snippet under this rule and the rules about stray semicolons and the whitespace ending a line, in the order given.
 * @param code - The snippet.
 * @param order - The rules in the order listed.
 * @returns The file the pass left.
 */
async function fixInOrder (code: string, order: string[]): Promise<string | undefined> {
	let config = { plugins, rules: Object.fromEntries(order.map((name) => [name, name === ruleName ? 1 : true])) }

	return (await stylelint.lint({ code, config, fix: true })).code
}

describe(`a line of spaces a disable comment keeps from the rule about the whitespace ending a line`, () => {
	let keep = `/* stylelint-disable-next-line @stylistic/no-eol-whitespace */`
	let orders = [
		[ruleName, `@stylistic/no-extra-semicolons`, `@stylistic/no-eol-whitespace`],
		[`@stylistic/no-extra-semicolons`, ruleName, `@stylistic/no-eol-whitespace`],
		[`@stylistic/no-eol-whitespace`, `@stylistic/no-extra-semicolons`, ruleName],
	]

	// Its spaces and tabs stand as spelled, whichever order the rules are listed in, while a neighbor takes lines of spaces and semicolons out around it
	it.each([
		[`a {}\n${keep}\n\t\t\n\n\n  \nb {}\n`, `a {}\n${keep}\n\t\t\n\nb {}\n`],
		[`\n;\na {\n${keep}\n    \n}\n  ;\nb {}\n`, `\na {\n${keep}\n    \n}\n\nb {}\n`],
		[`${keep}\na {  \n  \n \t \n;\n\t  \n${keep}\n  \n}\n`, `${keep}\na {  \n\n${keep}\n  \n}\n`],
	])(`stands in %j`, async (code, output) => {
		for (let order of orders) {
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			expect(await fixInOrder(code, order)).toBe(output)
		}
	})

	// The fix writes a kept space as a character of Unicode's private use area while it collapses runs, and leaves a file spelling one to the reading of old
	it(`leaves the characters of Unicode's private use area a file spells as they are`, async () => {
		let code = `a {\n\tb/**/: c;\n${keep}\n  \n\n  \n}\n`

		for (let order of orders) {
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			expect(await fixInOrder(code, order)).toContain(`/**/`)
		}
	})
})
