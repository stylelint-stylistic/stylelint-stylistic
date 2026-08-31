import { createRule } from "../../../../rules/media-feature-parentheses-space-inside/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138
			description: `a parenthesis inside the text of an inline comment opens no media feature`,
			code: `
				@media ( min-width: 100px ) and // (z
				( max-width: 200px ) { a { color: red; } }
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138
			description: `a parenthesis inside the text of an inline comment opens no media feature`,
			code: `
				@media (min-width: 100px) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/343
			// Sass answers alike for both spellings of the name here, as it does in the value of a declaration: `@media (min-width: aurl(a/b))` and `@media (min-width: éurl(a/b))` both compile, while `aurl(a//b)` and `éurl(a//b)` in their place both fail at one offset that is the length of the file, the comment the double slash opens having carried off the parenthesis.
			description: `a call inside the parameters whose name opens on a code point outside ASCII, which leaves the parentheses behind it inside the text of a comment`,
			code: `@media (min-width: \u00E9url(http://a/b.png) b( 1px )) { a { c: 2px; } }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138
			description: `the fix reaches the features of the query and leaves the text of the comment as it stands`,
			code: `
				@media ( min-width: 100px ) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 26,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/152
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the parameters are left alone and the warning stands`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			line: 2,
			column: 1,
			message: messages.rejectedClosing,
		},
	],
})
