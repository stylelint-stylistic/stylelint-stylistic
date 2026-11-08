import lessParser from "postcss-less"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../../vitest.helpers.ts"
import plugins from "../../../../index.ts"
import { createRule } from "../../../../rules/value-slash-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a value opening with a variable, which is passed over whole`,
			code: `a { b: @a/2; }`,
		},
		{
			description: `a variable's own value, which is no declaration to this rule`,
			code: `@a: 1/2;`,
		},
		{
			description: `a parenthesized group, inside which Less divides`,
			code: `a { b: (4/2); }`,
		},
		{
			description: `a solidus inside the text of an inline comment`,
			code: `a { b: 1 / 2; // 1/2\n}`,
		},
	],

	reject: [
		{
			description: `a solidus in front of a variable, which Less keeps as the separator under its default math mode`,
			code: `a { b: 2/@a; }`,
			fixed: `a { b: 2 /@a; }`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `an inline comment closed by the break in front of the solidus, the space the option asks for having nowhere to go but the text of the comment`,
			code: `a { b: 1 // c\n/2; }`,
			fixed: `a { b: 1 // c\n/2; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `an inline comment closed by the break in front of the solidus, which the fixer has to leave standing`,
			code: `a { b: 1 // c\n /2; }`,
			fixed: `a { b: 1 // c\n /2; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBefore(),
		},
	],
})

// A `never` write emptying the run between two solidi brings them together into a `//` comment, and everything behind it on the line goes into that comment
describe(`the run in front of a solidus under a syntax that spells a \`//\` comment`, () => {
	let lessRule = `@stylistic/less/value-slash-space-before`

	/**
	 * Fixes a Less text under a primary of this rule.
	 * @param code - The text.
	 * @param primary - The primary option.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string, primary: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [lessRule]: primary }, customSyntax: lessParser }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`leaves it under Less, which spells such a comment too`, async () => {
		expect(await fix(`a { b: 1/  /2 }`, `never`)).toEqual({
			fixed: `a { b: 1/  /2 }`,
			left: [`1:12 Unexpected whitespace before "/" (@stylistic/less/value-slash-space-before)`],
		})
	})
})
