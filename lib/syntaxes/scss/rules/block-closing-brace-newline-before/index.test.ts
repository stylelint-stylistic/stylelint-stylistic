import { createRule } from "../../../../rules/block-closing-brace-newline-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a Sass nested property whose value spans lines while its block is one, the block alone deciding the block's lineness, in an outer block closed against its last node as the option asks`,
			code: `a {\n\tfont: 12px\n\t\tserif { family: x; }}`,
		},
	],

	reject: [
		{
			description: `a Sass nested property written with a value, which this syntax parses as a declaration with a block, whose brace stands behind a break and an indent`,
			code: `a { font: 12px { color: red;\n\t}}`,
			fixed: `a { font: 12px { color: red;}}`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a block whose last declaration carries an inline comment behind its value, so the brace has nowhere to go`,
			code: `
				a {
					color: pink // c
				}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			line: 2,
			column: 18,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block with the comment standing on a line of its own`,
			code: `
				a {
					color: pink;
					// c
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a stray semicolon behind such a comment, which the option takes away along with every break of the raw`,
			code: `
				a {
					color: pink;
					// c
				;
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				;
				}
			`,
			line: 4,
			column: 2,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, which this option never reaches, behind which the semicolon stands on a line of its own`,
			code: `
				a {
					color: pink // c
					;
				}
			`,
			fixed: `
				a {
					color: pink // c
					;}
			`,
			line: 3,
			column: 3,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a block an at-rule with neither a block nor a semicolon closes, an inline comment standing behind that at-rule, so the brace has nowhere to go`,
			code: `
				a {
					@extend .b
					// c
				}
			`,
			fixed: `
				a {
					@extend .b
					// c
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
	],
})
