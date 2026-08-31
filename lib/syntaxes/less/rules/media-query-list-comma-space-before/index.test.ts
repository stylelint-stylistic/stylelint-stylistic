import { createRule } from "../../../../rules/media-query-list-comma-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137
			description: `inline comment before the comma: the comma cannot join the comment's line, so the parameters are left alone and the warning stands`,
			code: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137
			description: `a comma inside the text of an inline comment is no comma of the query`,
			code: `
				@media (min-width: 1px), // a , b
				(max-width: 2px) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137
			description: `inline comment before the comma: the comma cannot join the comment's line, so the parameters are left alone and the warning stands`,
			code: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})
