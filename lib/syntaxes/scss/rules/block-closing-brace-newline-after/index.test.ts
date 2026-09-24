import { createRule } from "../../../../rules/block-closing-brace-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `no newline behind the closing brace of an at-rule whose parameters carry on past an inline comment, which this syntax keeps a second copy of`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }b { color: red; }
			`,
			fixed: `
				@media (min-width: 100px // c
					) { a { color: red; } }
				b { color: red; }
			`,
			line: 2,
			column: 25,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// The break behind the comment ends it, so `never` has nothing to take away
			description: `an inline comment glued to the brace of a multi-line block, with the break that ends it in front of the next rule`,
			code: `
				a {
					color: pink;
				}// c
				b {
					color: pink;
				}
			`,
		},
		{
			description: `the same comment behind a space, with indentation behind its break`,
			code: `
				a {
					color: pink;
				} // c
					b {
					color: pink;
				}
			`,
		},
		{
			description: `the same comment ended by a carriage return and a line feed`,
			code: `a {\n\tcolor: pink;\n}// c\r\nb {\n\tcolor: pink;\n}`,
		},
	],

	reject: [
		{
			// A second run must not pull the rule behind into the comment
			description: `an inline comment on the line behind the brace, whose fixed form keeps the break that ends it`,
			code: `
				a {
					color: pink;
				}
				// c
				 b {
					color: pink;
				}
			`,
			fixed: `
				a {
					color: pink;
				}// c
				 b {
					color: pink;
				}
			`,
			line: 3,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// The break behind the comment ends it, so `never` has nothing to take away
			description: `an inline comment glued to the brace of a single-line block, with the break that ends it in front of the next rule`,
			code: `
				a { color: pink; }// c
				b { color: pink; }
			`,
		},
	],
})
