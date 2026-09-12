import { parse as postcssParse, type ProcessOptions, type Root, stringify } from "postcss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

/**
 * Parses a stylesheet and takes the `raws.before` off every declaration of the rules selecting `a`, the way a rule of another plugin that fills an empty block leaves them; the declarations of any other rule keep the runs the file spells, for PostCSS to invent a run out of.
 * @param source - The stylesheet.
 * @param opts - The options of the parse.
 * @returns The root.
 */
function parse (source: string, opts?: ProcessOptions): Root {
	let root = postcssParse(source, opts)

	root.walkRules(`a`, (statement) => {
		statement.walkDecls((decl) => {
			delete decl.raws.before
		})
	})

	return root
}

// The library's declaration names a string alone, but it hands whatever it is given to Stylelint, which takes a syntax object as readily as a package name
let declarationsWithoutARun = { parse, stringify } as unknown as string

testRule({
	ruleName,
	config: [`always`],
	customSyntax: declarationsWithoutARun,

	accept: [
		{
			// See #693
			description: `the break PostCSS prints in front of a declaration the file spells no run in front of`,
			code: `
				a {
				color: pink;
				top: 0; }
			`,
		},
	],

	reject: [],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: declarationsWithoutARun,

	accept: [
		{
			// See #693
			description: `the break PostCSS prints in front of a declaration the file spells no run in front of`,
			code: `
				a {
				color: pink;
				top: 0; }
			`,
		},
	],

	reject: [],
})

describe(`the run PostCSS prints in front of a declaration the file spells none in front of`, () => {
	/**
	 * Fixes a stylesheet under the syntax that takes the raws off, then reads the file the fix left as a plain stylesheet, which is what the next run of the linter has in front of it.
	 *
	 * The testing library reads that file under the same syntax instead, which takes the raws off a second time; no run of the linter ever meets such a node twice, since only a rule building one puts it there, so these cases are written against the linter itself.
	 * @param code - The stylesheet.
	 * @param primary - The primary option.
	 * @returns What the check said, the file the fix left, and how much the rule has to say about that file.
	 */
	async function fixAndRead (code: string, primary: string): Promise<{ warnings: string[], fixed: string, left: number }> {
		let config = { plugins, rules: { [ruleName]: primary } }
		let read = await stylelint.lint({ code, customSyntax: declarationsWithoutARun, config })
		let run = await stylelint.lint({ code, customSyntax: declarationsWithoutARun, config, fix: true })
		let fixed = run.code ?? code
		let again = await stylelint.lint({ code: fixed, config })

		return {
			warnings: pick(read.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`),
			fixed,
			left: pick(again.results).warnings.length,
		}
	}

	// See #693
	it(`is the break never-multi-line refuses, and the fix takes it out`, async () => {
		expect(await fixAndRead(`a {\ncolor: pink;\ntop: 0;\n}`, `never-multi-line`)).toEqual({
			warnings: [`2:13 ${messages.rejectedAfterMultiLine()}`],
			fixed: `a {\n    color: pink;top: 0;\n}`,
			left: 0,
		})
	})

	// See #693
	it(`is short of the break always asks for where the run PostCSS prints is the space its neighbour carries, and the fix writes it`, async () => {
		expect(await fixAndRead(`b { color: red;\n top: 0 }\na {color: pink;top: 0 }`, `always`)).toEqual({
			warnings: [`3:16 ${messages.expectedAfter()}`],
			fixed: `b { color: red;\n top: 0 }\na { color: pink;\n top: 0 }`,
			left: 0,
		})
	})

	// See #693
	it(`is short of the break always-multi-line asks for in a multi-line block, and the fix writes it`, async () => {
		expect(await fixAndRead(`b { color: red; top: 0 }\na {color: pink;top: 0\n}`, `always-multi-line`)).toEqual({
			warnings: [`2:16 ${messages.expectedAfterMultiLine()}`],
			fixed: `b { color: red; top: 0 }\na { color: pink;\n top: 0\n}`,
			left: 0,
		})
	})
})
