import { parse as postcssParse, type ProcessOptions, type Root, stringify } from "postcss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

/**
 * Parses a stylesheet and takes the `raws.before` off the node standing at the head of every rule's block, the way a rule of another plugin that inserts a node there leaves one.
 * @param source - The stylesheet.
 * @param opts - The options of the parse.
 * @returns The root.
 */
function parse (source: string, opts?: ProcessOptions): Root {
	let root = postcssParse(source, opts)

	root.walkRules((statement) => {
		if (statement.first) delete statement.first.raws.before
	})

	return root
}

// The library's declaration names a string alone, but it hands whatever it is given to Stylelint, which takes a syntax object as readily as a package name
let headWithoutARun = { parse, stringify } as unknown as string

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: headWithoutARun,

	accept: [
		{
			description: `a single-line block whose head node the file spells no run in front of`,
			code: `a {/*c*/color: pink; }`,
		},
	],

	reject: [
		{
			// See #411
			description: `a break in front of the declaration standing behind a head comment the file spells no run in front of`,
			code: `
				a {/*c*/
				color: pink; }
			`,
			fixed: `a {/*c*/color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// See #411
			description: `a block of two comments, the head one of which the file spells no run in front of`,
			code: `
				a {/*1*/
				/*2*/ }
			`,
			fixed: `a {/*1*//*2*/}`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: headWithoutARun,

	accept: [
		{
			description: `the break in front of the declaration standing behind such a comment, which is the one the option asks for`,
			code: `
				a {/*c*/
				color: pink; }
			`,
		},
		{
			// See #680
			description: `the break PostCSS prints in front of a head declaration the file spells no run in front of`,
			code: `
				a {
				color: pink; }
			`,
		},
		{
			// See #680
			description: `the break PostCSS prints in front of the one comment a block holds, which stands where the checked node would`,
			code: `a {/*c*/}`,
		},
		{
			// See #680
			description: `the break PostCSS prints in front of a head comment the file spells no run in front of, which the check carries onto the declaration behind it`,
			code: `
				b {
					color: red;
					top: 0;
				}
				a {/*c*/ color: pink }
			`,
		},
	],

	reject: [],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: headWithoutARun,

	accept: [
		{
			// See #680
			description: `the break PostCSS prints in front of a head declaration the file spells no run in front of`,
			code: `
				a {
				color: pink; }
			`,
		},
		{
			// See #680
			description: `the break PostCSS prints in front of the one comment a block holds, which stands where the checked node would`,
			code: `a {/*c*/}`,
		},
	],

	reject: [],
})

describe(`the run PostCSS prints in front of a head node the file spells none in front of`, () => {
	/**
	 * Fixes a stylesheet under the syntax that takes the raw off, then reads the file the fix left as a plain stylesheet, which is what the next run of the linter has in front of it.
	 *
	 * The testing library reads that file under the same syntax instead, which takes the raw off a second time; no run of the linter ever meets such a node twice, since only a rule building one puts it there, so these cases are written against the linter itself.
	 * @param code - The stylesheet.
	 * @param primary - The primary option.
	 * @returns What the check said, the file the fix left, and how much the rule has to say about that file.
	 */
	async function fixAndRead (code: string, primary: string): Promise<{ warnings: string[], fixed: string, left: number }> {
		let config = { plugins, rules: { [ruleName]: primary } }
		let read = await stylelint.lint({ code, customSyntax: headWithoutARun, config })
		let run = await stylelint.lint({ code, customSyntax: headWithoutARun, config, fix: true })
		let fixed = run.code ?? code
		let again = await stylelint.lint({ code: fixed, config })

		return {
			warnings: pick(read.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`),
			fixed,
			left: pick(again.results).warnings.length,
		}
	}

	// See #411
	it(`is the whitespace never-multi-line refuses over a block holding one comment, and the fix takes it out`, async () => {
		expect(await fixAndRead(`a {/*1*/\n}`, `never-multi-line`)).toEqual({
			warnings: [`1:4 ${messages.rejectedAfterMultiLine()}`],
			fixed: `a {/*1*/}`,
			left: 0,
		})
	})

	// See #680
	it(`is the whitespace never-multi-line refuses over a block whose one comment the file spells no run in front of, and the fix takes it out`, async () => {
		expect(await fixAndRead(`a {/*c*/}`, `never-multi-line`)).toEqual({
			warnings: [`1:4 ${messages.rejectedAfterMultiLine()}`],
			fixed: `a {/*c*/}`,
			left: 0,
		})
	})

	// See #680
	it(`is the whitespace never-multi-line refuses in front of a head declaration, and the fix takes it out`, async () => {
		expect(await fixAndRead(`a {\ncolor: pink; }`, `never-multi-line`)).toEqual({
			warnings: [`1:4 ${messages.rejectedAfterMultiLine()}`],
			fixed: `a {color: pink; }`,
			left: 0,
		})
	})

	it(`is the break always asks for, where PostCSS prints one`, async () => {
		expect(await fixAndRead(`a {\ncolor: pink; }`, `always`)).toEqual({
			warnings: [],
			fixed: `a {\n    color: pink; }`,
			left: 0,
		})
	})

	it(`is short of that break where the run PostCSS prints is the empty one its neighbour carries, and the fix writes it`, async () => {
		expect(await fixAndRead(`a { color: pink;top: 0 }`, `always`)).toEqual({
			warnings: [`1:4 ${messages.expectedAfter()}`],
			fixed: `a {\ncolor: pink;top: 0 }`,
			left: 0,
		})
	})
})
