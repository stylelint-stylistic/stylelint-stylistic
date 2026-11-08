import stylelint from "stylelint"
import { expect, it } from "vitest"

import { pick } from "../../../../../vitest.helpers.ts"
import plugins from "../../../../index.ts"
import { createRule } from "../../../../rules/selector-list-comma-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an end-of-line comment standing between the comma and the newline`,
			code: `a, // comment\nb {}`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `a,   // comment\nb {}`,
		},
		{
			description: `the same behind a tab`,
			code: `a,\t// comment\nb {}`,
		},
		{
			description: `the same behind two tabs`,
			code: `a,\t\t// comment\nb {}`,
		},
		{
			description: `the same behind tabs and spaces`,
			code: `a, \t \t // comment\nb {}`,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n.b, .c {}`,
			fixed: `.a // c\n.b,\n .c {}`,
			line: 2,
			column: 3,
			message: messages.expectedAfter(),
		},
		{
			// Pins the end of an inline comment where the parser cuts it, so the fix writes behind the comment rather than repeating the word after it
			description: `a comma followed by an inline comment that a bare carriage return closes`,
			code: `a, // c\r b {}`,
			fixed: `a, // c\n\r b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `the same list with a form feed closing the comment`,
			code: `a, // c\f b {}`,
			fixed: `a, // c\n\f b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			code: `.a, // c\n.b {}`,
			fixed: `.a, // c\n.b {}`,
			line: 1,
			column: 3,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

// `postcss-scss` spells a `//` comment of a selector as a block comment in the raw the rule reads, so one pressed to the comma is looked past as one standing behind a space is, and the break closing it is the one asked for
it(`accepts a \`//\` comment pressed to the comma under postcss-scss, where the break closing the comment is the one asked for`, async () => {
	let config = { plugins, rules: { [`@stylistic/scss/selector-list-comma-newline-after`]: `always` } }
	let fixed = await stylelint.lint({ code: `a,// c\nb {}\n`, config, fix: true, customSyntax: `postcss-scss` })

	expect({ fixed: fixed.code, warnings: pick(fixed.results).warnings.length }).toEqual({ fixed: `a,// c\nb {}\n`, warnings: 0 })
})
