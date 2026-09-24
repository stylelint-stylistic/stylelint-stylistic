import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// Every fixture here is written on one line with escapes, since a carriage return is invisible in the source and no editor leaves it where it is put.

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
		{
			// A line holding a form feed alone is empty, as one holding a space is: the form feed is no content to measure
			description: `a value line holding a form feed alone, which is an empty line and not measured`,
			code: `a {\n\tmargin: 0\n\f\n\t\t1px;\n}`,
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
			description: `a value line whose indentation opens with a bare carriage return, measured by the whole run in front of its content`,
			code: `a {\n\tmargin: 0\n\r\t1px;\n}`,
			fixed: `a {\n\tmargin: 0\n\t\t1px;\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same value line behind a form feed, at the level asked for in tabs yet not in the run`,
			code: `a {\n\tmargin: 0\n\f\t\t1px;\n}`,
			fixed: `a {\n\tmargin: 0\n\t\t1px;\n}`,
			line: 3,
			column: 4,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `a value line opened by a vertical tab, which is content to the tokenizer and no indentation`,
			code: `a {\n\tmargin: 0\n\t1px;\n}`,
			fixed: `a {\n\tmargin: 0\n\t\t1px;\n}`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `a selector line whose indentation opens with a bare carriage return`,
			code: `a,\n\r\tb {}`,
			fixed: `a,\nb {}`,
			line: 2,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a params line whose indentation opens with a bare carriage return`,
			code: `@media\n\r\t\tscreen {}`,
			fixed: `@media\n\tscreen {}`,
			line: 2,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a closing parenthesis behind a bare carriage return, which still lowers its own line, so one run settles it`,
			code: `a {\n\tb: fn(\n\t\tc\n\r\t\t);\n}`,
			fixed: `a {\n\tb: fn(\n\t\tc\n\t);\n}`,
			line: 4,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same closing parenthesis behind a form feed`,
			code: `a {\n\tb: fn(\n\t\tc\n\f\t\t);\n}`,
			fixed: `a {\n\tb: fn(\n\t\tc\n\t);\n}`,
			line: 4,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a value line opened by a no-break space, which is content to the tokenizer and no indentation`,
			code: `a {\n\tmargin: 0\n\t 1px;\n}`,
			fixed: `a {\n\tmargin: 0\n\t\t 1px;\n}`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			// The params were trimmed as JavaScript reads whitespace, which took the line of a lone vertical tab off before it was measured
			description: `a last params line holding a vertical tab alone, which is content to the tokenizer and no indentation`,
			code: `a {\n\t@media print,\n\v {}\n}`,
			fixed: `a {\n\t@media print,\n\t\t\v {}\n}`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same line holding a no-break space alone`,
			code: `a {\n\t@media print,\n  {}\n}`,
			fixed: `a {\n\t@media print,\n\t\t  {}\n}`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same vertical tab closing the params of an at-rule with neither block nor semicolon`,
			code: `a {\n\t@include print,\n\v\n}`,
			fixed: `a {\n\t@include print,\n\t\t\v\n}`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `a closing brace inside a value behind a bare carriage return, which lowers its own line the same way`,
			code: `a {\n\tb: fn({\n\t\tc: d\n\r\t\t});\n}`,
			fixed: `a {\n\tb: fn({\n\t\tc: d\n\t});\n}`,
			line: 4,
			column: 4,
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
