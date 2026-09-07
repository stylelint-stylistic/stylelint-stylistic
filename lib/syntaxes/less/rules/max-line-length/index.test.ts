import { createRule } from "../../../../rules/max-line-length/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

// The address of every `url()` comes off a line, and a `url(` inside a comment spells none. The file's syntax says which double slashes open a comment, so the same line is counted one way here and another under the core, where a double slash is code and the address behind it comes off. See #427
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
