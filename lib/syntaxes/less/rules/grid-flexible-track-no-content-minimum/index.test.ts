import { createRule } from "../../../../rules/grid-flexible-track-no-content-minimum/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [true],

	accept: [
		{
			description: `a track list written in a variable, which spells no track the rule can read`,
			code: `a { grid-template-columns: @columns; }`,
		},
		{
			description: `a flexible track written as an escaped string, which is a string to the parser`,
			code: `a { grid-template-columns: ~"1fr"; }`,
		},
		{
			description: `a flexible track whose minimum is a variable, which the rule cannot call content-sized`,
			code: `a { grid-template-columns: minmax(@min, 1fr); }`,
		},
	],

	reject: [
		{
			description: `a bare flexible track repeated a variable number of times, of which the track alone is written`,
			code: `a { grid-template-columns: repeat(@n, 1fr); }`,
			fixed: `a { grid-template-columns: repeat(@n, minmax(0, 1fr)); }`,
			line: 1,
			column: 39,
			endLine: 1,
			endColumn: 42,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `a bare flexible track in front of an end-of-line comment whose own text holds another`,
			code: `
				a { grid-template-columns: 1fr // 2fr
				; }
			`,
			fixed: `
				a { grid-template-columns: minmax(0, 1fr) // 2fr
				; }
			`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
	],
})
