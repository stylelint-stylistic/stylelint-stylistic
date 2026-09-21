import { messages as closingNewlineBeforeMessages } from "../block-closing-brace-newline-before/index.ts"

import { messages, ruleName } from "./index.ts"

// Behind a wordless declaration the brace alone closes, the run in front of the brace is the run the `declaration-colon-*-after` rules read behind the colon. The library lists the rule a block names first and its extra rules behind it, so the neighbour has the last word.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			// See 1789420319
			description: `a wordless custom property in front of the brace, whose break the neighbour asks to stand behind the colon, so the space is not written and the warning stands`,
			code: `
				a {
					--x:
				}
			`,
			fixed: `
				a {
					--x:
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedBefore(),
		},
	],
})

// The break twin writes the run in front of the brace too, and the library lists it behind this rule (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/block-closing-brace-newline-before": `always` },

	reject: [
		{
			// The run in front of the brace is one of the twins' to write, and the two options disagree over it
			description: `two blocks closing on the single space this rule asks for, which the twin behind it wants a break in front of: the break is not written, since this rule reported nothing about the run as it stood, and the twin's two warnings stand`,
			code: `@media (a) { b { c: d } }`,
			fixed: `@media (a) { b { c: d } }`,
			warnings: [
				{
					line: 1,
					column: 22,
					endLine: 1,
					endColumn: 23,
					message: closingNewlineBeforeMessages.expectedBefore,
				},
				{
					line: 1,
					column: 24,
					endLine: 1,
					endColumn: 25,
					message: closingNewlineBeforeMessages.expectedBefore,
				},
			],
		},
		{
			// The twin behind reads the break behind a stray semicolon as its own, and used to put one in front of the space this rule wrote, the fixing run coming back clean over a file this rule refuses (1789979881)
			description: `a break behind a stray semicolon, which the twin behind accepts and would write back in front of the space: the space is not written, and this rule's warning stands`,
			code: `a { b: c;;\n}`,
			fixed: `a { b: c;;\n}`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
	],
})
