import { createRule } from "../../../../rules/value-list-comma-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a double slash of a syntax that spells a comment with one still opens a comment: the comma in its text is no comma of the value, and the one behind it cannot join the comment's line. This is what the syntax must go on doing, and is a guard rather than a shape the issue names`,
			code: `a { b: 1px // a , b\n,2px; }`,
			fixed: `a { b: 1px // a , b\n,2px; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136
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
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `an inline comment standing behind a bare address is a comment all the same, and the comma cannot join its line`,
			code: `
				a {
					b: url(http://x) // c
					,'y';
				}
			`,
			fixed: `
				a {
					b: url(http://x) // c
					,'y';
				}
			`,
			line: 3,
			column: 2,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a comma opening the value, the whitespace in front of it holding the break that closes an inline comment, which the fixer has to leave standing`,
			code: `a { prop: // c\n ,0; }`,
			fixed: `a { prop: // c\n ,0; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `
				a {
					b: 'x', // a , b
						'y';
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma inside the text of an inline comment behind a bare address is no comma of the value`,
			code: `
				a {
					b: url(http://x), // a , b
						'y';
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/181
			description: `a value spelling an extend, which the syntax marks the declaration as one for`,
			code: `a { b: "extend(x)" ,0; }`,
			fixed: `a { b: "extend(x)",0; }`,
			line: 1,
			column: 20,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136
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
			message: messages.rejectedBefore(),
		},
	],
})
