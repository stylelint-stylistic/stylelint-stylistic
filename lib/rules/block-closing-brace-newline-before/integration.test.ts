import { messages as colonSpaceAfterMessages } from "../declaration-colon-space-after/index.ts"

import { messages, ruleName } from "./index.ts"

// Behind a wordless declaration the brace alone closes, the run in front of the brace is the run the `declaration-colon-*-after` rules read behind the colon. The library lists the rule a block names first and its extra rules behind it, so the neighbor runs last; neither of the two writes a run the other accepts.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always` },

	reject: [
		{
			// See 1789420319
			description: `a wordless declaration in front of the brace, whose single space the neighbor asks to stand behind the colon, so the break is not written and the warning stands`,
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
			// The neighbor listed behind used to write over the break this rule accepts, and the fixing run came back clean (1789508665)
			description: `the same declaration with the break this rule asks for in front of the brace, which the neighbor asks to be a single space: the space is not written, and the file rests with the neighbor's warning`,
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
