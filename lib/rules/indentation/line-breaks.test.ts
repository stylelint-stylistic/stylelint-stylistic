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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452
			description: `a declaration whose indentation opens with a bare carriage return, which is whitespace to the parser and part of the run the fix writes over`,
			code: `a {\n\r\t\tcolor: pink;\n}`,
			fixed: `a {\n\tcolor: pink;\n}`,
			line: 2,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same declaration behind a form feed`,
			code: `a {\n\f\tcolor: pink;\n}`,
			fixed: `a {\n\tcolor: pink;\n}`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a closing brace whose indentation opens with a bare carriage return`,
			code: `a {\n\tcolor: pink;\n\r\t}`,
			fixed: `a {\n\tcolor: pink;\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a property hack behind a bare carriage return, whose star the fix leaves where it stands`,
			code: `a {\n\r\t*color: pink;\n}`,
			fixed: `a {\n\t*color: pink;\n}`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `an empty line holding a space in a rule broken with Windows line breaks, whose pairs the fix keeps whole and whose space it leaves to another rule`,
			code: `a {\r\n \r\n\t\tcolor: pink;\r\n}`,
			fixed: `a {\r\n \r\n\tcolor: pink;\r\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: 2,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452
			autoStripIndent: false,
			description: `a stylesheet whose first node stands behind a bare carriage return and a tab, whitespace to the parser and no line`,
			code: `\r\ta{}`,
			fixed: `a{}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			autoStripIndent: false,
			description: `the same node behind a form feed`,
			code: `\f\ta{}`,
			fixed: `a{}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			autoStripIndent: false,
			description: `the same node behind a bare carriage return alone`,
			code: `\ra{}`,
			fixed: `a{}`,
			line: 1,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `a second rule whose indentation opens with a bare carriage return`,
			code: `a{}\n\r\tb{}`,
			fixed: `a{}\nb{}`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
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
