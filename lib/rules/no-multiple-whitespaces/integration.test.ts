import { messages as namedGridAreasAlignmentMessages } from "../named-grid-areas-alignment/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// The other order of the pair the alignment rule's integration test holds, this rule listed first: the runs between the tokens of a line of the table are the alignment rule's under `alignColumns` (#45), so this rule passes them over before that rule has written anything, and collapses the run in front of the solidus as before.
testRule({
	ruleName,
	config: [true],
	extraRules: { "@stylistic/named-grid-areas-alignment": [true, { alignColumns: true }] },

	reject: [
		{
			description: `a table to pad and a doubled run in front of the solidus, this rule running first: the run is collapsed, the padding is written behind it, and nothing is left for either rule to say`,
			code: `
				a {
					grid-template:
						[a] "x  x" 1fr
						[bbb] "y y" auto  / 1fr;
				}
			`,
			fixed: `
				a {
					grid-template:
						[a]   "x x" 1fr
						[bbb] "y y" auto / 1fr;
				}
			`,
			warnings: [
				{
					line: 4,
					column: 19,
					endLine: 4,
					endColumn: 21,
					message: messages.rejected,
				},
				{
					line: 3,
					column: 3,
					endLine: 4,
					endColumn: 26,
					message: namedGridAreasAlignmentMessages.expected(`grid-template`),
				},
			],
		},
	],
})
