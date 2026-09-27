import { messages as trailingSemicolonMessages, ruleName as trailingSemicolonRuleName } from "../declaration-block-trailing-semicolon/index.ts"

import { ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

let testTrailingSemicolonListedFirst = createTestRule({ ruleName: trailingSemicolonRuleName })

testRule({
	ruleName,
	config: [0],
	extraRules: { [trailingSemicolonRuleName]: `always` },

	reject: [
		{
			// The blank lines a custom property keeps in front of the closing brace are the block's, which the semicolon rule writes its semicolon in front of, so this rule leaves them whichever of the two runs first
			description: `a custom property closing the block with no semicolon, blank lines in front of the brace, this rule listed first`,
			code: `
				a {
					c: d;
					--b: red


				}
			`,
			fixed: `
				a {
					c: d;
					--b: red;


				}
			`,
			line: 3,
			column: 9,
			message: trailingSemicolonMessages.expected,
		},
	],
})

testTrailingSemicolonListedFirst({
	ruleName: trailingSemicolonRuleName,
	config: [`always`],
	extraRules: { [ruleName]: 0 },

	reject: [
		{
			description: `the same block with the semicolon rule listed first`,
			code: `
				a {
					c: d;
					--b: red


				}
			`,
			fixed: `
				a {
					c: d;
					--b: red;


				}
			`,
			line: 3,
			column: 9,
			message: trailingSemicolonMessages.expected,
		},
	],
})
