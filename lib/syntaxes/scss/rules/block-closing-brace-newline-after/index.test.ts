import { createRule } from "../../../../rules/block-closing-brace-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `no newline behind the closing brace of an at-rule whose parameters carry on past an inline comment, which this syntax keeps a second copy of`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }b { color: red; }
			`,
			fixed: `
				@media (min-width: 100px // c
					) { a { color: red; } }
				b { color: red; }
			`,
			line: 2,
			column: 25,
			message: messages.expectedAfter(),
		},
	],
})
