import { createRule } from "../../../../rules/declaration-colon-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a value that is nothing but an inline comment and a flag, whose run behind the colon this syntax keeps in the value's raw`,
			code: `a { color:  // c\n!important; }`,
			fixed: `a { color:\n  // c\n!important; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map written on one line, whose inner colon opens no declaration`,
			code: `$map: (key: value)`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken across lines, with the break behind its outer colon`,
			code: `$map\n: (\nkey: value,\nkey2 :value2)`,
		},
		{
			description: `an SCSS list broken across lines`,
			code: `
				$list: (
				'value1',
				'value2',
				)
			`,
		},
	],
})
