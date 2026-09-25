import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Fixes one snippet in one pass under this rule and a rule taking stray semicolons out, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @param neighbor - The rule taking the semicolon out, and its setting.
 * @returns The file the pass left and how many warnings the pair has about it.
 */
async function fix (code: string, thisRuleFirst: boolean, neighbor: [string, unknown] = [`@stylistic/no-extra-semicolons`, true]): Promise<{
	code: string,
	warnings: number,
}> {
	let pair: [string, unknown][] = [[`@stylistic/no-eol-whitespace`, true], neighbor]
	let rules = Object.fromEntries(thisRuleFirst ? pair : pair.toReversed())
	let fixed = await stylelint.lint({ code, config: { plugins, rules }, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config: { plugins, rules } })

	return { code: fixed.code ?? code, warnings: read.results[0]?.warnings.length ?? 0 }
}

describe(`the whitespace in front of a stray semicolon the rule about extra semicolons takes out`, () => {
	// The semicolon is read as the whitespace it leaves, so the spaces in front of it are whitespace at the end of a line
	it(`is taken out in one pass in both orders, behind a rule's brace`, async () => {
		expect(await fix(`a {}  \n  ;\n`, true)).toEqual({ code: `a {}\n\n`, warnings: 0 })
		expect(await fix(`a {}  \n  ;\n`, false)).toEqual({ code: `a {}\n\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders where a second semicolon stands in the raw behind`, async () => {
		expect(await fix(`a {}  \n  ;;\n`, true)).toEqual({ code: `a {}\n\n`, warnings: 0 })
		expect(await fix(`a {}  \n  ;;\n`, false)).toEqual({ code: `a {}\n\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders in front of a block's closing brace`, async () => {
		expect(await fix(`a {\n  b: c;\n  ;\n}\n`, true)).toEqual({ code: `a {\n  b: c;\n\n}\n`, warnings: 0 })
		expect(await fix(`a {\n  b: c;\n  ;\n}\n`, false)).toEqual({ code: `a {\n  b: c;\n\n}\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders where the semicolons stand against the brace with no other whitespace on the line`, async () => {
		expect(await fix(`a {} ;;\n`, true)).toEqual({ code: `a {}\n`, warnings: 0 })
		expect(await fix(`a {} ;;\n`, false)).toEqual({ code: `a {}\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders in the stylesheet's tail`, async () => {
		expect(await fix(`@import "x";  \n  ;\n`, true)).toEqual({ code: `@import "x";\n\n`, warnings: 0 })
		expect(await fix(`@import "x";  \n  ;\n`, false)).toEqual({ code: `@import "x";\n\n`, warnings: 0 })
	})

	// The block's closing brace stands a line above the end PostCSS gives a rule with a free semicolon behind its brace, so the line of a semicolon in the block's tail is counted from the brace
	it(`is kept in front of a semicolon in a block's tail a disable comment keeps, where a free semicolon stands behind the brace on a later line`, async () => {
		let code = `x {\n\ta {\n\t\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n\t\t; \n\t}\n\n\t;\n}`
		let output = `x {\n\ta {\n\t\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n\t\t;\n\t}\n\n\n}`

		expect(await fix(code, true)).toEqual({ code: output, warnings: 0 })
		expect(await fix(code, false)).toEqual({ code: output, warnings: 0 })
	})

	it(`is taken out in one pass in both orders in front of a comment behind the last declaration, whose semicolons the rule about a trailing semicolon takes`, async () => {
		let neighbor: [string, unknown] = [`@stylistic/declaration-block-trailing-semicolon`, `never`]

		expect(await fix(`a {\n  b: c;\n  ;\n  /* x */\n}\n`, true, neighbor)).toEqual({ code: `a {\n  b: c\n\n  /* x */\n}\n`, warnings: 0 })
		expect(await fix(`a {\n  b: c;\n  ;\n  /* x */\n}\n`, false, neighbor)).toEqual({ code: `a {\n  b: c\n\n  /* x */\n}\n`, warnings: 0 })
	})
})

describe(`a stray semicolon the rule about extra semicolons takes out, standing at the end of a line`, () => {
	// The semicolon is read as absent, not as whitespace, so a line ending on it holds no whitespace at its end
	it(`draws no warning of this rule`, async () => {
		let rules = { "@stylistic/no-eol-whitespace": true, "@stylistic/no-extra-semicolons": true }
		let { results } = await stylelint.lint({ code: `a {}\n;\na {\n  b: c;;\n}\n`, config: { plugins, rules } })

		expect(results[0]?.warnings.filter(({ rule }) => rule === `@stylistic/no-eol-whitespace`)).toEqual([])
	})
})
