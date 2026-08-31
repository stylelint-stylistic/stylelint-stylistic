import { createRule } from "../../../../rules/selector-pseudo-class-case/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a pseudo-class built by interpolation`,
			code: `:#{$variable} {}`,
		},
		{
			description: `the same interpolation written in upper case`,
			code: `:#{$VARIABLE} {}`,
		},
		{
			description: `the same interpolation behind a type selector`,
			code: `a:#{$variable} {}`,
		},
	],
})
testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a pseudo-class built by interpolation`,
			code: `:#{$variable} {}`,
		},
		{
			description: `the same interpolation written in upper case`,
			code: `:#{$VARIABLE} {}`,
		},
		{
			description: `the same interpolation behind a type selector`,
			code: `a:#{$variable} {}`,
		},
	],
})
testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\nb:HOVER {}`,
			fixed: `.a // c\nb:hover {}`,
			line: 2,
			column: 2,
			message: messages.expected(`:HOVER`, `:hover`),
		},
	],
})
