import scssParser from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../../vitest.helpers.ts"
import plugins from "../../../../index.ts"
import { createRule } from "../../../../rules/value-slash-newline-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an inline comment in front of the solidus, whose closing newline is the one the option asks for`,
			code: `a { b: 1 // c\n/ 2; }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `an inline comment closed by the newline in front of the solidus, which the fixer has to leave standing`,
			code: `a { b: 1 // c\n/ 2; }`,
			fixed: `a { b: 1 // c\n/ 2; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

// A write emptying the run between two solidi brings them together into a `//` comment
describe(`the run in front of a solidus under a syntax that spells a \`//\` comment`, () => {
	let rule = `@stylistic/scss/value-slash-newline-before`

	/**
	 * Fixes a Sass text under this rule.
	 * @param code - The text.
	 * @param option - This rule's primary.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string, option: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [rule]: option }, customSyntax: scssParser }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`leaves the run between two solidi, whose closing would take the rest of the line into a comment`, async () => {
		expect(await fix(`a {\n\tb: 1/  /2,\n\t\t3;\n}`, `never-multi-line`)).toEqual({
			fixed: `a {\n\tb: 1/  /2,\n\t\t3;\n}`,
			left: [`2:9 Unexpected whitespace before "/" in a multi-line declaration (@stylistic/scss/value-slash-newline-before)`],
		})
	})
})
