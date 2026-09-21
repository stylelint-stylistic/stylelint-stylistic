import { messages as closingSpaceBeforeMessages } from "../block-closing-brace-space-before/index.ts"
import { messages as colonSpaceAfterMessages } from "../declaration-colon-space-after/index.ts"

import { messages, ruleName } from "./index.ts"

// Behind a wordless declaration the brace alone closes, the run in front of the brace is the run the `declaration-colon-*-after` rules read behind the colon. The library lists the rule a block names first and its extra rules behind it, so the neighbour runs last; neither of the two writes a run the other accepts.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always` },

	reject: [
		{
			// See 1789420319
			description: `a wordless declaration in front of the brace, whose single space the neighbour asks to stand behind the colon, so the break is not written and the warning stands`,
			code: `
				a {
					x: }
			`,
			fixed: `
				a {
					x: }
			`,
			line: 2,
			column: 4,
			message: messages.expectedBefore,
		},
		{
			// The neighbour listed behind used to write over the break this rule accepts, and the fixing run came back clean (1789508665)
			description: `the same declaration with the break this rule asks for in front of the brace, which the neighbour asks to be a single space: the space is not written, and the file rests with the neighbour's warning`,
			code: `
				a {
					x:
				}
			`,
			fixed: `
				a {
					x:
				}
			`,
			line: 2,
			column: 4,
			message: colonSpaceAfterMessages.expectedAfter(),
		},
	],
})

// The space twin writes the run in front of the brace too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/block-closing-brace-space-before": `always` },

	reject: [
		{
			// The run in front of the brace is one of the twins' to write, and the two options disagree over it
			description: `two blocks closing on a single space, which the twin behind this rule accepts and would write back: neither break is written, and both warnings stand`,
			code: `@media (a) { b { c: d } }`,
			fixed: `@media (a) { b { c: d } }`,
			warnings: [
				{
					line: 1,
					column: 22,
					endLine: 1,
					endColumn: 23,
					message: messages.expectedBefore,
				},
				{
					line: 1,
					column: 24,
					endLine: 1,
					endColumn: 25,
					message: messages.expectedBefore,
				},
			],
		},
		{
			// The twin behind writes over the break the trim rests on, and the fixing run used to come back clean over a file this rule refuses (1789979881)
			description: `a stray semicolon between a space and the break, which the twin behind would turn into a space: the trim is not written, the twin writes its space, and this rule's warning stands`,
			code: `a { b: c; ;\n}`,
			fixed: `a { b: c; ; }`,
			warnings: [
				{
					line: 1,
					column: 12,
					message: messages.expectedBefore,
				},
				{
					line: 1,
					column: 12,
					message: closingSpaceBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			// Around a stray semicolon the twins write different parts of the run, so one file answers both; the gate must not refuse it
			description: `the same semicolon in a run holding no break, where the break goes in front of the semicolon and the twin's space stays behind it`,
			code: `a { b: c; ; }`,
			fixed: `a { b: c;\n ; }`,
			line: 1,
			column: 12,
			message: messages.expectedBefore,
		},
	],
})
