import { createRule } from "../../../../rules/aspect-ratio-notation/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`as-written`, { smallestIntegers: true }],

	accept: [
		{
			description: `a variable, which spells no ratio the rule can read`,
			code: `a { aspect-ratio: $ratio; }`,
		},
		{
			description: `an interpolation in front of a second number`,
			code: `a { aspect-ratio: #{$width} / 1; }`,
		},
		{
			description: `a pair sharing a divisor written in the text of an end-of-line comment, which is no value at all`,
			code: `
				a { aspect-ratio: 16 / 9; // 16 / 8
				}
			`,
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

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`ratio`],

	accept: [
		{
			description: `a media feature whose value is a variable, which the media parser cannot read`,
			code: `@media (aspect-ratio: $ratio) {}`,
		},
		{
			description: `a media feature whose value holds an interpolation`,
			code: `@media (aspect-ratio: #{$width} / 1) {}`,
		},
	],

	reject: [
		{
			description: `a media feature whose ratio is one number, read as the core reads it`,
			code: `@media (aspect-ratio: 2) {}`,
			fixed: `@media (aspect-ratio: 2 / 1) {}`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`2`, `2 / 1`),
		},
	],
})
