import { createRule } from "../../../../rules/grid-flexible-track-no-content-minimum/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [true],

	accept: [
		{
			description: `a track list written in a variable, which spells no track the rule can read`,
			code: `a { grid-template-columns: $columns; }`,
		},
		{
			description: `a flexible track whose number is interpolated`,
			code: `a { grid-template-columns: #{$n}fr; }`,
		},
		{
			description: `a flexible track whose minimum is interpolated, which the rule cannot call content-sized`,
			code: `a { grid-template-columns: minmax(#{$min}, 1fr); }`,
		},
		{
			description: `a repeated flexible track whose minimum is a variable`,
			code: `a { grid-template-columns: repeat(auto-fill, minmax($min, 1fr)); }`,
		},
		{
			description: `a bare flexible track written in the text of an end-of-line comment, which is no value at all`,
			code: `
				a { grid-template-columns: minmax(0, 1fr); // 1fr
				}
			`,
		},
	],

	reject: [
		{
			description: `a bare flexible track repeated a variable number of times, of which the track alone is written`,
			code: `a { grid-template-columns: repeat($n, 1fr); }`,
			fixed: `a { grid-template-columns: repeat($n, minmax(0, 1fr)); }`,
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
