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
			description: `a Sass nested property whose value spans lines while its block is one, the block alone deciding the block's lineness`,
			code: `
				a {
					font: 12px
						serif { family: x; }

				}
			`,
		},
		{
			description: `a single-line block behind a media feature holding an inline comment, which the option leaves alone because the block is on one line however wide the comment is printed`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
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

testRule({
	ruleName,
	config: [`never`, { except: [`last-nested`] }],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a Sass nested property written with the empty line the reversed option asks in front of the brace of its own block, which this syntax parses as a declaration with a block and so ends the chain of nesting`,
			code: `
				a {
					font: 12px {
						color: red;

					}
				}
			`,
		},
		{
			description: `a rule inside a Sass nested property, whose brace ends the chain of nesting while the property's block holds it and therefore stands where the reversed option does not reach`,
			code: `
				a {
					font: 12px {
						b {
							color: red;

						}
					}
				}
			`,
		},
	],

	reject: [
		{
			description: `a Sass nested property written with no empty line in front of the brace of its own block, which the reversed option asks one of as any other`,
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
			description: `a Sass nested property written with an empty line in front of the brace of the block holding it, which holds a block of its own and so does not end the chain of nesting`,
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
			line: 7,
			column: 1,
			message: messages.rejected,
		},
	],
})
