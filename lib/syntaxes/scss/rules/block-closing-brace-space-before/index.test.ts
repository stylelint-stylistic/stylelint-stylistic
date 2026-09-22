import { createRule } from "../../../../rules/block-closing-brace-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// See #570
			description: `a Sass nested property written with a value, which this syntax parses as a declaration with a block, whose brace abuts its last declaration`,
			code: `a { font: 12px {color: red;} }`,
			fixed: `a { font: 12px {color: red; } }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			// See #231
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
			message: messages.expectedBefore(),
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
			message: messages.expectedBefore(),
		},
		{
			description: `a stray semicolon behind such a comment, the break in front of the semicolon closing the comment and leaving the brace outside it`,
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
				; }
			`,
			line: 4,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, behind which the semicolon stands on a line of its own`,
			code: `
				a {
					color: pink // c
					;
				}
			`,
			fixed: `
				a {
					color: pink // c
					; }
			`,
			line: 3,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			// See #292
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
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
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
			message: messages.rejectedBefore(),
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
			message: messages.rejectedBefore(),
		},
		{
			description: `a stray semicolon behind such a comment, the break in front of the semicolon closing the comment and leaving the brace outside it`,
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
				;}
			`,
			line: 4,
			column: 2,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, behind which the semicolon stands on a line of its own`,
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
			message: messages.rejectedBefore(),
		},
		{
			// See #292
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
			message: messages.rejectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// See #570
			description: `a Sass nested property whose value spans lines while its block is one, the block alone deciding the block's lineness, in an outer block closed behind the space the option asks for`,
			code: `a {\n\tfont: 12px\n\t\tserif { family: x;} }`,
		},
	],

	reject: [
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
			message: messages.expectedBeforeMultiLine(),
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
			message: messages.expectedBeforeMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
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
			message: messages.rejectedBeforeMultiLine(),
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
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
