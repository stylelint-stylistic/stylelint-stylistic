import scss from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space on either side of the solidus`,
			code: `@media (aspect-ratio: 16 / 9) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (aspect-ratio: 16 / 9) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (aspect-ratio: 16 / 9) {}`,
		},
		{
			description: `a space in front of the solidus and none behind it, which this rule does not measure`,
			code: `@media (aspect-ratio: 16 /9) {}`,
		},
		{
			description: `a ratio in the range form`,
			code: `@media (16 / 9 <= aspect-ratio) {}`,
		},
		{
			description: `a ratio at either end of a range`,
			code: `@media (16 / 9 <= aspect-ratio <= 2 / 1) {}`,
		},
		{
			description: `the ratios of two features`,
			code: `@media (min-aspect-ratio: 1 / 1) and (max-aspect-ratio: 2 / 1) {}`,
		},
		{
			description: `a feature inside a grouped condition`,
			code: `@media ((aspect-ratio: 16 / 9) and (width > 1px)) {}`,
		},
		{
			description: `a solidus inside a comment standing in front of the query`,
			code: `@media /*(aspect-ratio: 16/9) and*/ (width <= 3em) {}`,
		},
		{
			description: `a comment standing between the ratio's numbers, with a space between it and the solidus`,
			code: `@media (aspect-ratio: 16/*c*/ / 9) {}`,
		},
		{
			description: `the division operator of a math function`,
			code: `@media (min-width: calc(100px/2)) {}`,
		},
		{
			description: `a solidus inside the arguments of a function belongs to the address and to no media feature`,
			code: `@media (width >= url(a/b)) {}`,
		},
		{
			description: `a solidus in a declaration's value, which another rule measures`,
			code: `@media (width >= 1px) { a { grid-area: 1/2; } }`,
		},
		{
			description: `a parameter list holding an interpolation, which is passed over whole`,
			code: `@media (aspect-ratio: #{$a}/9) {}`,
		},
	],

	reject: [
		{
			// The run in front of the delimiter is read over the copy with its escapes masked (1789661964)
			description: `an escaped space in front of the solidus, which is a character of the word and no space`,
			code: `@media (a: 1\\ /2) {}`,
			fixed: `@media (a: 1\\  /2) {}`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			// See #560
			description: `a solidus among the arguments behind a quoted address, which are those of any call`,
			code: `@media (c: url("x", 1/2)) {}`,
			fixed: `@media (c: url("x", 1 /2)) {}`,
			line: 1,
			column: 22,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus`,
			code: `@media (aspect-ratio: 16/9) {}`,
			fixed: `@media (aspect-ratio: 16 /9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus, under a mixed-case at-rule name`,
			code: `@mEdIa (aspect-ratio: 16/9) {}`,
			fixed: `@mEdIa (aspect-ratio: 16 /9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus, under an upper-case at-rule name`,
			code: `@MEDIA (aspect-ratio: 16/9) {}`,
			fixed: `@MEDIA (aspect-ratio: 16 /9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the solidus`,
			code: `@media (aspect-ratio: 16\t/9) {}`,
			fixed: `@media (aspect-ratio: 16 /9) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the solidus`,
			code: `@media (aspect-ratio: 16  /9) {}`,
			fixed: `@media (aspect-ratio: 16 /9) {}`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline in front of the solidus`,
			code: `@media (aspect-ratio: 16\n/9) {}`,
			fixed: `@media (aspect-ratio: 16 /9) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the solidus`,
			code: `@media (aspect-ratio: 16\r\n/9) {}`,
			fixed: `@media (aspect-ratio: 16 /9) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus of a ratio in the range form`,
			code: `@media (16/9 <= aspect-ratio) {}`,
			fixed: `@media (16 /9 <= aspect-ratio) {}`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus of either of two features`,
			code: `@media (min-aspect-ratio: 1/1) and (max-aspect-ratio: 2/1) {}`,
			fixed: `@media (min-aspect-ratio: 1 /1) and (max-aspect-ratio: 2 /1) {}`,
			warnings: [
				{
					line: 1,
					column: 28,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 56,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `no space in front of the solidus of a feature inside a grouped condition`,
			code: `@media ((aspect-ratio: 16/9) and (width > 1px)) {}`,
			fixed: `@media ((aspect-ratio: 16 /9) and (width > 1px)) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the solidus, with nothing between them`,
			code: `@media (aspect-ratio: 16/*c*//9) {}`,
			fixed: `@media (aspect-ratio: 16/*c*/ /9) {}`,
			line: 1,
			column: 30,
			message: messages.expectedBefore(),
		},
		{
			// See #496
			description: `a vertical tab in front of the solidus, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `@media (aspect-ratio: 16\v/9) {}`,
			fixed: `@media (aspect-ratio: 16\v /9) {}`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 27,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			// The run in front of the delimiter is read over the copy with its escapes masked (1789661964)
			description: `an escaped space in front of the solidus, which is a character of the word and no whitespace`,
			code: `@media (a: 1\\ /2) {}`,
		},
		{
			description: `no space in front of the solidus`,
			code: `@media (aspect-ratio: 16/ 9) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (aspect-ratio: 16/ 9) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (aspect-ratio: 16/ 9) {}`,
		},
		{
			description: `no space on either side of the solidus`,
			code: `@media (aspect-ratio: 16/9) {}`,
		},
		{
			description: `a ratio in the range form`,
			code: `@media (16/9 <= aspect-ratio) {}`,
		},
		{
			description: `the ratios of two features`,
			code: `@media (min-aspect-ratio: 1/1) and (max-aspect-ratio: 2/1) {}`,
		},
		{
			description: `a solidus inside a comment standing after the query`,
			code: `@media (aspect-ratio: 16/9) /*and (aspect-ratio: 16 / 9)*/ {}`,
		},
		{
			description: `a comment standing right in front of the solidus, with nothing between them`,
			code: `@media (aspect-ratio: 16/*c*//9) {}`,
		},
		{
			description: `the division operator of a math function`,
			code: `@media (min-width: calc(100px / 2)) {}`,
		},
	],

	reject: [
		{
			description: `a space in front of the solidus`,
			code: `@media (aspect-ratio: 16 /9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the solidus, under a mixed-case at-rule name`,
			code: `@mEdIa (aspect-ratio: 16 /9) {}`,
			fixed: `@mEdIa (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the solidus, under an upper-case at-rule name`,
			code: `@MEDIA (aspect-ratio: 16 /9) {}`,
			fixed: `@MEDIA (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the solidus`,
			code: `@media (aspect-ratio: 16  /9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the solidus`,
			code: `@media (aspect-ratio: 16\t/9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline in front of the solidus`,
			code: `@media (aspect-ratio: 16\n/9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the solidus`,
			code: `@media (aspect-ratio: 16\r\n/9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the solidus of either of two features`,
			code: `@media (min-aspect-ratio: 1 /1) and (max-aspect-ratio: 2 /1) {}`,
			fixed: `@media (min-aspect-ratio: 1/1) and (max-aspect-ratio: 2/1) {}`,
			warnings: [
				{
					line: 1,
					column: 29,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 58,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			description: `a space between a comment and the solidus`,
			code: `@media (aspect-ratio: 16 /*c*/ /9) {}`,
			fixed: `@media (aspect-ratio: 16 /*c*//9) {}`,
			line: 1,
			column: 32,
			message: messages.rejectedBefore(),
		},
		{
			// See #496
			description: `a vertical tab at the run in front of the solidus: only the tokenizer's run goes, and the character stays`,
			code: `@media (aspect-ratio: 16\v /9) {}`,
			fixed: `@media (aspect-ratio: 16\v/9) {}`,
			line: 1,
			column: 27,
			endLine: 1,
			endColumn: 28,
			message: messages.rejectedBefore(),
		},
	],
})

// A `never` write emptying the run between two solidi brings them together into a `//` comment, which takes the feature's closing parenthesis with the rest of the line
describe(`the run in front of a solidus under a syntax that spells a \`//\` comment`, () => {
	let rule = `@stylistic/scss/media-feature-slash-space-before`

	/**
	 * Fixes a Sass text under this rule's `never`.
	 * @param code - The text.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [rule]: `never` }, customSyntax: scss }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`leaves the run between two solidi, whose closing would take the rest of the line into a comment`, async () => {
		expect(await fix(`@media (aspect-ratio: 16/  /9) {}`)).toEqual({
			fixed: `@media (aspect-ratio: 16/  /9) {}`,
			left: [`1:28 Unexpected whitespace before "/" (@stylistic/scss/media-feature-slash-space-before)`],
		})
	})

	it(`closes the run where the word in front of it opens no comment`, async () => {
		expect(await fix(`@media (aspect-ratio: 16 /9) {}`)).toEqual({ fixed: `@media (aspect-ratio: 16/9) {}`, left: [] })
	})
})
