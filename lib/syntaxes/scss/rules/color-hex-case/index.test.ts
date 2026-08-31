import { createRule } from "../../../../rules/color-hex-case/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `an upper-case hex colour standing in the text of an inline comment the value holds`,
			code: `
				a { b: #aabbcc // #DDEEFF
					#00112a; }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `an upper-case hex colour on either side of an inline comment whose text holds one as well`,
			code: `
				a { b: #AABBCC // #DDEEFF
					#00112A; }
			`,
			fixed: `
				a { b: #aabbcc // #DDEEFF
					#00112a; }
			`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.expected(`#AABBCC`, `#aabbcc`),
				},
				{
					line: 2,
					column: 2,
					message: messages.expected(`#00112A`, `#00112a`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115
			description: `the fix reaches the copy of the value this syntax prints, and the inline comment keeps its spelling`,
			code: `
				$m: (
					// c
					'a': 1,
					'b': #FFF
				);
			`,
			fixed: `
				$m: (
					// c
					'a': 1,
					'b': #fff
				);
			`,
			line: 4,
			column: 7,
			message: messages.expected(`#FFF`, `#fff`),
		},
	],
})
