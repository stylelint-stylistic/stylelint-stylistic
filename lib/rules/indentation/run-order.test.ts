import { messages as openingNewlineAfterMessages } from "../block-opening-brace-newline-after/index.ts"
import { messages as semicolonNewlineAfterMessages } from "../declaration-block-semicolon-newline-after/index.ts"
import { messages as trailingSemicolonMessages } from "../declaration-block-trailing-semicolon/index.ts"

import { messages, ruleName } from "./index.ts"

// The rule reads every line the writers of a run touch, so its check takes the run's last turn (#353): a line another rule's break begins gets its indent in the same run, whatever order the configuration lists the rules in.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-after": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/353
			description: `a declaration the neighbour's break carries onto a line of its own: the line gets its indent in the same run, where it used to keep the single space and draw no warning`,
			code: `a {\n\tcolor: red; top: 0;\n}\n`,
			fixed: `a {\n  color: red;\n  top: 0;\n}\n`,
			warnings: [
				{
					line: 2,
					column: 13,
					endLine: 2,
					endColumn: 14,
					message: semicolonNewlineAfterMessages.expectedAfter(),
				},
				{
					line: 2,
					column: 2,
					endLine: 2,
					endColumn: 13,
					message: messages.expected(`2 spaces`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	extraRules: { "@stylistic/block-opening-brace-newline-after": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/353
			description: `a block the neighbour's break opens onto a new line: that line is indented in the same run`,
			code: `@media screen{\na{b:c}\n}\n`,
			fixed: `@media screen{\n\ta{\n\t\tb:c}\n}\n`,
			warnings: [
				{
					line: 2,
					column: 3,
					endLine: 2,
					endColumn: 4,
					message: openingNewlineAfterMessages.expectedAfter(),
				},
				{
					line: 2,
					column: 1,
					endLine: 2,
					endColumn: 7,
					message: messages.expected(`1 tab`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	extraRules: { "@stylistic/block-opening-brace-newline-after": `always-multi-line` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/353
			description: `a break written by a lineness-deferred neighbour: this rule's check runs behind even those, so the line that break begins is indented too`,
			code: `@media screen{\na{b:c;\nd:e}\n}\n`,
			fixed: `@media screen{\n\ta{\n\t\tb:c;\n\t\td:e}\n}\n`,
			warnings: [
				{
					line: 2,
					column: 3,
					endLine: 2,
					endColumn: 4,
					message: openingNewlineAfterMessages.expectedAfterMultiLine(),
				},
				{
					line: 2,
					column: 1,
					endLine: 3,
					endColumn: 5,
					message: messages.expected(`1 tab`),
				},
				{
					line: 3,
					column: 1,
					endLine: 3,
					endColumn: 4,
					message: messages.expected(`2 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the closing brace of a block whose last at-rule the neighbour puts a semicolon behind: that semicolon hands the run in front of the brace from the at-rule to the block, and the brace is measured in whichever of the two raws holds it`,
			code: `a {\n\t@extend .b\n\t\t}\n`,
			fixed: `a {\n\t@extend .b;\n}\n`,
			warnings: [
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: trailingSemicolonMessages.expected,
				},
				{
					line: 3,
					column: 3,
					endLine: 3,
					endColumn: 4,
					message: messages.expected(`0 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `never` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/510
			description: `a comment in front of the semicolon the neighbour takes away, the statement's while the semicolon stands and the block's once it is gone`,
			code: `a {\n\t@extend .b\n\t/* c */;\n}\n`,
			fixed: `a {\n\t@extend .b\n\t/* c */\n}\n`,
			warnings: [
				{
					line: 3,
					column: 9,
					endLine: 3,
					endColumn: 10,
					message: trailingSemicolonMessages.rejected,
				},
				{
					line: 3,
					column: 2,
					endLine: 3,
					endColumn: 3,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the same brace where the neighbour takes the semicolon away instead, which leaves the run standing in the block's own raw`,
			code: `a {\n\t@extend .b;\n\t\t}\n`,
			fixed: `a {\n\t@extend .b\n}\n`,
			warnings: [
				{
					line: 2,
					column: 12,
					endLine: 2,
					endColumn: 13,
					message: trailingSemicolonMessages.rejected,
				},
				{
					line: 3,
					column: 3,
					endLine: 3,
					endColumn: 4,
					message: messages.expected(`0 tabs`),
				},
			],
		},
	],
})
