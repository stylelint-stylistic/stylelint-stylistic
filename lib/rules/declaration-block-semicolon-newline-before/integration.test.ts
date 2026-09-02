import { messages as colonNewlineAfterMessages } from "../declaration-colon-newline-after/index.ts"
import { messages as colonSpaceAfterMessages } from "../declaration-colon-space-after/index.ts"

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

// The break this rule's fix puts onto the value's copy is laid out the way the parser lays it — the run in the raw, `decl.value` without it — so a colon rule reading the value's lineness later in the pass reads what the next parse would hand it (#487). Both blocks run this rule first: the order in which its break used to make the declaration read as multi-line for the rest of the pass.
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always-single-line` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/487
			description: `a single-line declaration missing its space, which the neighbour used to fall silent about once the written break polluted the value's copy: both fixes land in one run now`,
			code: `a { color:red; }`,
			fixed: `
				a { color: red
				; }
			`,
			warnings: [
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 14,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: colonSpaceAfterMessages.expectedAfterSingleLine(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always-multi-line` },

	reject: [
		{
			description: `a single-line declaration whose written break used to wake the neighbour's multi-line option, which the next parse never would have: the neighbour stays silent now, and both orders rest on one file`,
			code: `a { color: red; }`,
			fixed: `
				a { color: red
				; }
			`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 15,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494
			description: `a value that is a vertical tab behind its run, a word to the tokenizer: both breaks are written around it in one run, and both orders rest on this file`,
			code: `a { color: \v; }`,
			fixed: `a { color:\n \v\n; }`,
			warnings: [
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: colonNewlineAfterMessages.expectedAfter(),
				},
			],
		},
	],
})
