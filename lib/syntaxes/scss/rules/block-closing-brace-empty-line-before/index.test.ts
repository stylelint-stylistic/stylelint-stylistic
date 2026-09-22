import { createRule } from "../../../../rules/block-closing-brace-empty-line-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// See #570
			description: `a Sass nested property whose value spans lines while its block is one, the block alone deciding the block's lineness`,
			code: `
				a {
					font: 12px
						serif { family: x; }

				}
			`,
		},
		{
			// See #139
			description: `a single-line block behind a media feature holding an inline comment, which the option leaves alone because the block is on one line however wide the comment is printed`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
			// See #570
			description: `a Sass nested property written with a value, which this syntax parses as a declaration with a block, whose multi-line block closes with no empty line in front of its brace`,
			code: `
				a {
					font: 12px {
						color: red;
					}

				}
			`,
			fixed: `
				a {
					font: 12px {
						color: red;

					}

				}
			`,
			line: 4,
			column: 2,
			message: messages.expected,
		},
		{
			// See #139
			description: `no empty line in front of the closing brace of a block whose value carries on past an inline comment`,
			code: `
				a { b: 1px // c
					2px; }
			`,
			fixed: `
				a { b: 1px // c
					2px;

				 }
			`,
			line: 2,
			column: 7,
			message: messages.expected,
		},
	],
})
