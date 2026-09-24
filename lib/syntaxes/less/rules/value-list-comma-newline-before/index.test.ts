import { createRule } from "../../../../rules/value-list-comma-newline-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a double slash of a syntax that spells a comment with one still opens a comment: the comma in its text is no comma of the value, and the one behind it stands on its own line`,
			code: `a { b: 1px // a , b\n,2px; }`,
		},
		{
			description: `an inline comment standing behind a bare address is a comment all the same, and the comma behind it stands on its own line`,
			code: `
				a {
					b: url(http://x) // c
					,'y';
				}
			`,
		},
	],

	reject: [
		{
			description: `a value spelling an extend, which the syntax marks the declaration as one for`,
			code: `a { b: "extend(x)",0; }`,
			fixed: `a { b: "extend(x)"\n,0; }`,
			line: 1,
			column: 19,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma inside the text of an inline comment is no comma of the value, and the comma in front of the comment gets its break`,
			code: `
				a {
					b: 'x', // a , b
						'y';
				}
			`,
			fixed: `
				a {
					b: 'x'
				, // a , b
						'y';
				}
			`,
			line: 2,
			column: 8,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `inline comment before the comma: the comma cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					b: 'x' // c
					,'y';
				}
			`,
			fixed: `
				a {
					b: 'x' // c
					,'y';
				}
			`,
			line: 3,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it holding the break that closes an inline comment, which the fixer has to leave standing`,
			code: `a { prop: // c\n ,0,\n1; }`,
			fixed: `a { prop: // c\n ,0,\n1; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
