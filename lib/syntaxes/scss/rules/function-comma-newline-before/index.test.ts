import { createRule } from "../../../../rules/function-comma-newline-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value, key2: value2)`,
		},
		{
			description: `an SCSS list, whose parentheses open no call either`,
			code: `$list: (value, value2)`,
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken behind its comma`,
			code: `$map: (key: value,\nkey2: value2)`,
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken in front of its comma`,
			code: `$map: (key: value\n,key2: value2)`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma between two bare addresses, whose double slashes open no comment, with an inline comment behind it`,
			code: `
				a { b: image-set(url(//a) 1x , // c
				 url(//b) 2x); }
			`,
			fixed: `
				a { b: image-set(url(//a) 1x, // c
				 url(//b) 2x); }
			`,
			line: 1,
			column: 30,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
