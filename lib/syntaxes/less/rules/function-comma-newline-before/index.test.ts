import { createRule } from "../../../../rules/function-comma-newline-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px, // a , b\n  2px); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `inline comment before the comma: the comma cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `a { t: translate(1px // c\n  ,2px); }`,
			fixed: `a { t: translate(1px // c\n  ,2px); }`,
			line: 2,
			column: 3,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is asked for no line break of its own`,
			code: `a { t: translate(1px\n, // a, b\n  2px); }`,
		},
	],
})
