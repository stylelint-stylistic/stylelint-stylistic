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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
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
