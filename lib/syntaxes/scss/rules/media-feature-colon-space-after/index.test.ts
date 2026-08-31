import { createRule } from "../../../../rules/media-feature-colon-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a feature standing behind an interpolated query, which names no function and opens no call`,
			code: `@media #{$q}(min-width:1px) { a { b: c; } }`,
			fixed: `@media #{$q}(min-width: 1px) { a { b: c; } }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115
			description: `the fix reaches the copy of the parameters this syntax prints, and the inline comment keeps its spelling`,
			code: `
				@media (min-width:1px) and // c
				(max-width:2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) and // c
				(max-width: 2px) { a { color: red; } }
			`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 11,
					message: messages.expectedAfter(),
				},
			],
		},
	],
})
