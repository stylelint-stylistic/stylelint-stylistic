import { createRule } from "../../../../rules/block-opening-brace-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a space behind each of the two opening braces of a media query holding an inline comment, the outer one of which the rule reaches only once the block is measured as the file spells it`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px // c
					) {a {color: red; } }
			`,
			warnings: [
				{
					line: 2,
					column: 9,
					message: messages.rejectedAfter(),
				},
				{
					line: 2,
					column: 5,
					message: messages.rejectedAfter(),
				},
			],
		},
	],
})
