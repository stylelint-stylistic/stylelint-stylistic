import { createRule } from "../../../../rules/block-closing-brace-empty-line-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a single-line block behind a media feature holding an inline comment, which the option leaves alone because the block is on one line however wide the comment is printed`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `no empty line in front of the closing brace of a block whose value carries on past an inline comment`,
			code: `
				a { b: 1px // c
					2px; }
			`,
			fixed: `
				a { b: 1px // c
					2px;${S}

				}
			`,
			line: 2,
			column: 7,
			message: messages.expected,
		},
	],
})
