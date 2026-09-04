import { createRule } from "../../../../rules/max-line-length/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427
// What comes off a line is the address of every `url()` the file spells, and a `url(` written inside a comment spells none. Which double slashes open a comment is the file's own syntax's answer, so the same line is counted one way here and another under the core, where a double slash is two characters of code and the address behind it comes off.
testRule({
	ruleName,
	config: [22],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `an address written inside an end-of-line comment, which opens no call at all`,
			code: `a { b: 1px //url(bbbbbbbbbbbbbbbbbbbb.png)\n}`,
			line: 1,
			column: 42,
			message: messages.expected(22),
		},
	],
})
