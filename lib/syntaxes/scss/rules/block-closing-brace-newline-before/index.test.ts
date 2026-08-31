import { createRule } from "../../../../rules/block-closing-brace-newline-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/231
			description: `a block whose last declaration carries an inline comment behind its value, so the brace has nowhere to go`,
			code: `
				a {
					color: pink // c
				}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			line: 2,
			column: 18,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block with the comment standing on a line of its own`,
			code: `
				a {
					color: pink;
					// c
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a stray semicolon behind such a comment, which the option takes away along with every break of the raw`,
			code: `
				a {
					color: pink;
					// c
				;
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				;
				}
			`,
			line: 4,
			column: 2,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, which this option never reaches, behind which the semicolon stands on a line of its own`,
			code: `
				a {
					color: pink // c
					;
				}
			`,
			fixed: `
				a {
					color: pink // c
					;}
			`,
			line: 3,
			column: 3,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a block an at-rule with neither a block nor a semicolon closes, an inline comment standing behind that at-rule, so the brace has nowhere to go`,
			code: `
				a {
					@extend .b
					// c
				}
			`,
			fixed: `
				a {
					@extend .b
					// c
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
	],
})
