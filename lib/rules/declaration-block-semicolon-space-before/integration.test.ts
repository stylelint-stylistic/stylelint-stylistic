import { messages as colonNewlineAfterMessages } from "../declaration-colon-newline-after/index.ts"

import { messages, ruleName } from "./index.ts"

// Where a declaration's value is nothing but whitespace, the run this rule reads in front of the semicolon is the run the `declaration-colon-*-after` rules read behind the colon (#416). The library lists the rule a block names first and its extra rules behind it, so every block below has the neighbour run last and have the last word.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416
			description: `a value that is nothing but a space, which the neighbour asks to stand behind the colon: the neighbour is listed last and has the last word, so the space is not taken away and the warning stands`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			description: `a custom property whose value is a break and two spaces, which this rule would have cut down to the one space it leaves alone, and which the neighbour asks to keep opening with the break`,
			code: `
				a { --a:
				  ; }
			`,
			fixed: `
				a { --a:
				  ; }
			`,
			line: 2,
			column: 2,
			endLine: 2,
			endColumn: 3,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			description: `a value that is a break and two spaces, which the neighbour is content with and this rule would have cut down to a single space, taking the neighbour's break with it`,
			code: `
				a { color:
				  ; }
			`,
			fixed: `
				a { color:
				  ; }
			`,
			line: 2,
			column: 2,
			endLine: 2,
			endColumn: 3,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			description: `a single-line option the neighbour's break silences, so that this rule's fix costs the file nothing and is written ahead of the break`,
			code: `a { color: ; }`,
			fixed: `
				a { color:
				; }
			`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.rejectedBeforeSingleLine(),
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
