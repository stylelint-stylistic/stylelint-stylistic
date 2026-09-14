import { messages, ruleName } from "./index.ts"

// Behind a wordless declaration the brace alone closes, the run in front of the brace is the run the `declaration-colon-*-after` rules read behind the colon. The library lists the rule a block names first and its extra rules behind it, so the neighbour has the last word.
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
	],
})
