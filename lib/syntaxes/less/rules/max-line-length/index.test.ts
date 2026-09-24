import { createRule } from "../../../../rules/max-line-length/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

// The address of every `url()` comes off a line, and a `url(` inside a comment spells none. The file's syntax says which double slashes open a comment, so the same line is counted one way here and another under the core, where a double slash is code and the address behind it comes off.
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

testRule({
	ruleName,
	config: [21],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `an import with an option in parentheses in front of its address, which Less reads between the name and the address: 48 - 27 = 21`,
			code: `@import (reference) "aaaaaaaaaaaaaaaaaaaa.less";`,
		},
		{
			description: `a plugin with arguments in parentheses in front of its address, anything but a closing parenthesis or a semicolon to Less: 41 - 25 = 16`,
			code: `@plugin (a: 1) "aaaaaaaaaaaaaaaaaaaa.js";`,
		},
		{
			description: `a plugin, whose address Less loads as an import's: 34 - 25 = 9`,
			code: `@plugin "aaaaaaaaaaaaaaaaaaaa.js";`,
		},
	],

	reject: [
		{
			description: `an import with its option group right behind the name, which Less reads as an at-rule of its own rather than an import`,
			code: `@import(reference) "aaaaaaaaaaaaaaaaaaaa.less";`,
			line: 1,
			column: 47,
			message: messages.expected(21),
		},
		{
			description: `an import whose group holds a word Less has no option by`,
			code: `@import (foo) "aaaaaaaaaaaaaaaaaaaa.less";`,
			line: 1,
			column: 42,
			message: messages.expected(21),
		},
		{
			description: `a plugin spelled in upper case, which Less refuses`,
			code: `@PLUGIN "aaaaaaaaaaaaaaaaaaaa.js";`,
			line: 1,
			column: 34,
			message: messages.expected(21),
		},
		{
			description: `a use, which names no module under Less`,
			code: `@use "aaaaaaaaaaaaaaaaaaaaaaaa.scss";`,
			line: 1,
			column: 37,
			message: messages.expected(21),
		},
	],
})

testRule({
	ruleName,
	config: [33],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `an import with comments in front of its option group and inside it, which Less steps over: 60 - 27 = 33`,
			code: `@import /*c*/ (reference /*d*/) "aaaaaaaaaaaaaaaaaaaa.less";`,
		},
	],
})
