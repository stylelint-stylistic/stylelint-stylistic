import { messages as openingNewlineAfterMessages } from "../block-opening-brace-newline-after/index.ts"
import { messages as semicolonNewlineAfterMessages } from "../declaration-block-semicolon-newline-after/index.ts"

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
