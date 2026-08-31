import { createRule } from "../../../../rules/function-comma-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px , // a, b\n  2px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma inside the text of an inline comment behind a bare address is no comma of the value`,
			code: `
				a { t: image-set(url(//cdn/a.png) 1x , // a, b
				  url(//cdn/b.png) 2x); }
			`,
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
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `an inline comment standing behind a bare address is a comment all the same, and the comma cannot join its line`,
			code: `
				a { t: image-set(url(//cdn/a.png) 1x // c
				  ,url(//cdn/b.png) 2x); }
			`,
			fixed: `
				a { t: image-set(url(//cdn/a.png) 1x // c
				  ,url(//cdn/b.png) 2x); }
			`,
			line: 2,
			column: 3,
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
			message: messages.rejectedBefore(),
		},
	],
})
