import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// Every fixture here is written on one line with escapes, since a carriage return is invisible in the source and no editor leaves it where it is put.
// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/294

testRule({
	ruleName,
	config: `tab`,

	accept: [
		{
			description: `a declaration and a closing brace at their level in a rule broken with Windows line breaks`,
			code: `a {\r\n\tcolor: pink;\r\n}`,
		},
		{
			description: `a form feed on either side of the declaration, which is whitespace and no line break, so the rule stays on one line`,
			code: `a {\fcolor: pink;\f}`,
		},
	],

	reject: [
		{
			description: `a declaration standing at no indentation in a rule broken with Windows line breaks, whose fix writes the pair back whole`,
			code: `a {\r\ncolor: pink;\r\n}`,
			fixed: `a {\r\n\tcolor: pink;\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: `tab`,
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a page whose embedded stylesheet holds a line separator of Unicode, which ends a line to JavaScript and to no stylesheet`,
			code: `<div>\n\t<style>\n\ta {\n\t\tb: c; /* x\u2028y */\n\t}\n\t</style>\n</div>`,
		},
	],
})
