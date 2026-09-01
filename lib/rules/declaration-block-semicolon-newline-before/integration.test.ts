import { messages as colonNewlineAfterMessages } from "../declaration-colon-newline-after/index.ts"

import { messages, ruleName } from "./index.ts"

// Where a declaration's value is nothing but whitespace, the run this rule reads in front of the semicolon is the run the `declaration-colon-*-after` rules read behind the colon (#416). The library lists the rule a block names first and its extra rules behind it, so every block below has the neighbour run last and have the last word.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416
			description: `a value that is nothing but a break, which the neighbour asks to stand behind the colon: the neighbour is listed last and has the last word, so the break is not taken away and the warning stands`,
			code: `
				a {
					color:
				;
				}
			`,
			fixed: `
				a {
					color:
				;
				}
			`,
			line: 2,
			column: 8,
			endLine: 2,
			endColumn: 9,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a block the break alone puts over two lines, which taking it away would put back on one and this rule would fall silent about — where the neighbour would write it again`,
			code: `
				a { color:
				; }
			`,
			fixed: `
				a { color:
				; }
			`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/417
			description: `the shared run written by this rule first, which the other order now spells the same way`,
			code: `a { color:  /*c*/ ; }`,
			fixed: `a { color:  /*c*/\n; }`,
			warnings: [
				{
					line: 1,
					column: 18,
					endLine: 1,
					endColumn: 19,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 17,
					endLine: 1,
					endColumn: 18,
					message: colonNewlineAfterMessages.expectedAfter(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always` },

	reject: [
		{
			description: `a value that is nothing but a space, which the neighbour asks to stand behind the colon and this rule asks to be a break: the neighbour is listed last and has the last word, so the break is not written and the warning stands`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always-single-line` },

	reject: [
		{
			description: `a custom property, whose value the break this rule writes puts over two lines, so that the neighbour's single-line option falls silent and the break is written`,
			code: `a { --a: ; }`,
			fixed: `
				a { --a:
				; }
			`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
			message: messages.expectedBefore(),
		},
	],
})
