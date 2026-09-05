import { createRule } from "../../../../rules/aspect-ratio-notation/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

// The neighbours are read under the namespace's own names (#550), so an SCSS file configured with the namespace's slash rules gets its solidus spelled as they ask.
testRule({
	ruleName,
	config: [`ratio`],
	customSyntax: `postcss-scss`,
	extraRules: {
		"@stylistic/scss/value-slash-space-before": `never`,
		"@stylistic/scss/value-slash-space-after": `never`,
	},

	reject: [
		{
			description: `a whole number written on its own, whose second number is written behind a solidus spelled tight as both neighbours ask`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2/1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2/1`),
		},
	],
})
