import { createRule } from "../../../../rules/declaration-colon-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `a nested property whose last declaration prints nothing behind its colon, the single space standing in the raw of the block the parser hangs on the outer declaration`,
			code: `a { font: 2px/3px { family: } }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a value that is nothing but an inline comment and a flag, whose run behind the colon this syntax keeps in the value's raw`,
			code: `a { color:  // c\n!important; }`,
			fixed: `a { color: // c\n!important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same nested property with two spaces there instead`,
			code: `a { font: 2px/3px { family:  } }`,
			fixed: `a { font: 2px/3px { family: } }`,
			line: 1,
			column: 28,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same run held by the raw of an inline comment written behind that declaration`,
			code: `a { font: 2px/3px { family:  // c\n} }`,
			fixed: `a { font: 2px/3px { family: // c\n} }`,
			line: 1,
			column: 28,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing at the top level of a stylesheet with an inline comment written behind it, a node of this syntax alone, whose two spaces that comment's raw holds`,
			code: `color:${S}${S}// c`,
			fixed: `color:${S}// c`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `the same value, whose run this option takes away without reaching into the text of the comment`,
			code: `a { color:  // c\n!important; }`,
			fixed: `a { color:// c\n!important; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing at the top level of a stylesheet with an inline comment written behind it, whose run this option takes away`,
			code: `color:${S}// c`,
			fixed: `color:// c`,
			line: 1,
			column: 7,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/389
			description: `two spaces behind the colon of a value broken by the inline comment in front of its word, whose break is the comment's own end, which this option passes over`,
			code: `a { color:  // c\n x; }`,
		},
	],

	reject: [],
})
