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
			description: `a space behind the solidus and none in front of it, which this rule does not measure`,
			code: `@media (aspect-ratio: 16/ 9) {}`,
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
			description: `a comment standing between the ratio's numbers, with a space between the solidus and it`,
			code: `@media (aspect-ratio: 16 / /*c*/9) {}`,
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
			code: `@media (aspect-ratio: 16/#{$a}) {}`,
		},
	],

	reject: [
		{
			description: `no space behind the solidus`,
			code: `@media (aspect-ratio: 16/9) {}`,
			fixed: `@media (aspect-ratio: 16/ 9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus, under a mixed-case at-rule name`,
			code: `@mEdIa (aspect-ratio: 16/9) {}`,
			fixed: `@mEdIa (aspect-ratio: 16/ 9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus, under an upper-case at-rule name`,
			code: `@MEDIA (aspect-ratio: 16/9) {}`,
			fixed: `@MEDIA (aspect-ratio: 16/ 9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the solidus`,
			code: `@media (aspect-ratio: 16/\t9) {}`,
			fixed: `@media (aspect-ratio: 16/ 9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the solidus`,
			code: `@media (aspect-ratio: 16/  9) {}`,
			fixed: `@media (aspect-ratio: 16/ 9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline behind the solidus`,
			code: `@media (aspect-ratio: 16/\n9) {}`,
			fixed: `@media (aspect-ratio: 16/ 9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			description: `a carriage-return line break behind the solidus`,
			code: `@media (aspect-ratio: 16/\r\n9) {}`,
			fixed: `@media (aspect-ratio: 16/ 9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus of a ratio in the range form`,
			code: `@media (16/9 <= aspect-ratio) {}`,
			fixed: `@media (16/ 9 <= aspect-ratio) {}`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus of either of two features`,
			code: `@media (min-aspect-ratio: 1/1) and (max-aspect-ratio: 2/1) {}`,
			fixed: `@media (min-aspect-ratio: 1/ 1) and (max-aspect-ratio: 2/ 1) {}`,
			warnings: [
				{
					line: 1,
					column: 28,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 56,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `no space behind the solidus of a feature inside a grouped condition`,
			code: `@media ((aspect-ratio: 16/9) and (width > 1px)) {}`,
			fixed: `@media ((aspect-ratio: 16/ 9) and (width > 1px)) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment standing right behind the solidus, with nothing between them`,
			code: `@media (aspect-ratio: 16 //*c*/ 9) {}`,
			fixed: `@media (aspect-ratio: 16 / /*c*/ 9) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab behind the solidus, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `@media (aspect-ratio: 16 /\v9) {}`,
			fixed: `@media (aspect-ratio: 16 / \v9) {}`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 27,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `no space behind the solidus`,
			code: `@media (aspect-ratio: 16 /9) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (aspect-ratio: 16 /9) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (aspect-ratio: 16 /9) {}`,
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
			description: `a comment standing right behind the solidus, with nothing between them`,
			code: `@media (aspect-ratio: 16 //*c*/ 9) {}`,
		},
		{
			description: `the division operator of a math function`,
			code: `@media (min-width: calc(100px / 2)) {}`,
		},
	],

	reject: [
		{
			description: `a space behind the solidus`,
			code: `@media (aspect-ratio: 16/ 9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the solidus, under a mixed-case at-rule name`,
			code: `@mEdIa (aspect-ratio: 16/ 9) {}`,
			fixed: `@mEdIa (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the solidus, under an upper-case at-rule name`,
			code: `@MEDIA (aspect-ratio: 16/ 9) {}`,
			fixed: `@MEDIA (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the solidus`,
			code: `@media (aspect-ratio: 16/  9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the solidus`,
			code: `@media (aspect-ratio: 16/\t9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			description: `a newline behind the solidus`,
			code: `@media (aspect-ratio: 16/\n9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			description: `a carriage-return line break behind the solidus`,
			code: `@media (aspect-ratio: 16/\r\n9) {}`,
			fixed: `@media (aspect-ratio: 16/9) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the solidus of either of two features`,
			code: `@media (min-aspect-ratio: 1/ 1) and (max-aspect-ratio: 2/ 1) {}`,
			fixed: `@media (min-aspect-ratio: 1/1) and (max-aspect-ratio: 2/1) {}`,
			warnings: [
				{
					line: 1,
					column: 28,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 57,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			description: `a space between the solidus and a comment`,
			code: `@media (aspect-ratio: 16 / /*c*/9) {}`,
			fixed: `@media (aspect-ratio: 16 //*c*/9) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab at the run behind the solidus: only the tokenizer's run goes, and the character stays`,
			code: `@media (aspect-ratio: 16/ \v9) {}`,
			fixed: `@media (aspect-ratio: 16/\v9) {}`,
			line: 1,
			column: 25,
			endLine: 1,
			endColumn: 26,
			message: messages.rejectedAfter(),
		},
	],
})
