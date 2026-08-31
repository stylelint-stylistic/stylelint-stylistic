import { createRule } from "../../../../rules/aspect-ratio-notation/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`as-written`, { smallestIntegers: true }],

	accept: [
		{
			description: `an at-variable, which spells no ratio the rule can read`,
			code: `a { aspect-ratio: @ratio; }`,
		},
	],

	reject: [
		{
			description: `a pair sharing a divisor in front of an end-of-line comment whose own text holds another`,
			code: `
				a { aspect-ratio: 16 / 8 // 4 / 2
				; }
			`,
			fixed: `
				a { aspect-ratio: 2 / 1 // 4 / 2
				; }
			`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`16 / 8`, `2 / 1`),
		},
	],
})
