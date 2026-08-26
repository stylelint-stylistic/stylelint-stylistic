import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

// Every fixture here is written on one line with escapes, since a carriage return and a form feed are invisible in the source and no editor leaves either where it is put.
// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/294

testRule({
	ruleName,
	config: `tab`,

	accept: [
		{
			description: `a declaration and a closing brace at their level in a rule broken with carriage returns`,
			code: `a {\r\tcolor: pink;\r}`,
		},
		{
			description: `the same rule written with form-feed line breaks`,
			code: `a {\f\tcolor: pink;\f}`,
		},
		{
			description: `the same rule written with Windows line breaks`,
			code: `a {\r\n\tcolor: pink;\r\n}`,
		},
		{
			description: `a function whose parenthesis opens at the end of a carriage-return line, its arguments a level deeper`,
			code: `a {\r\tb: translate(\r\t\t1px,\r\t\t2px\r\t);\r}`,
		},
		{
			description: `the same function written with form-feed line breaks`,
			code: `a {\f\tb: translate(\f\t\t1px,\f\t\t2px\f\t);\f}`,
		},
		{
			description: `a media feature list broken with form feeds, its parenthesis opening at the end of a line`,
			code: `@media (\f\tmin-width: 100px\f) {\f\ta { b: c; }\f}`,
		},
	],

	reject: [
		{
			description: `a declaration standing at no indentation in a rule broken with carriage returns`,
			code: `a {\rcolor: pink;\r}`,
			fixed: `a {\r\tcolor: pink;\r}`,
			line: 1,
			column: 5,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same declaration written with form-feed line breaks`,
			code: `a {\fcolor: pink;\f}`,
			fixed: `a {\f\tcolor: pink;\f}`,
			line: 1,
			column: 5,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same declaration written with Windows line breaks, whose fix writes the pair back whole`,
			code: `a {\r\ncolor: pink;\r\n}`,
			fixed: `a {\r\n\tcolor: pink;\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a closing brace indented a level in a rule broken with carriage returns`,
			code: `a {\r\tcolor: pink;\r\t}`,
			fixed: `a {\r\tcolor: pink;\r}`,
			line: 1,
			column: 20,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same closing brace written with form-feed line breaks`,
			code: `a {\f\tcolor: pink;\f\t}`,
			fixed: `a {\f\tcolor: pink;\f}`,
			line: 1,
			column: 20,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the second line of a value indented a level short of its own, the value broken with a carriage return`,
			code: `a { b: 1px\r\t2px; }`,
			fixed: `a { b: 1px\r\t\t2px; }`,
			line: 1,
			column: 13,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same value written with a form-feed line break`,
			code: `a { b: 1px\f\t2px; }`,
			fixed: `a { b: 1px\f\t\t2px; }`,
			line: 1,
			column: 13,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `a value broken with a line feed and a carriage return in turn, whose second break opens the line that is measured`,
			code: `a { b: 1px\n\r\t2px; }`,
			fixed: `a { b: 1px\n\r\t\t2px; }`,
			line: 2,
			column: 3,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the second selector of a list indented a level too deep, the list broken with a carriage return`,
			code: `a,\r\tb { c: d; }`,
			fixed: `a,\rb { c: d; }`,
			line: 1,
			column: 5,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same selector list written with a form-feed line break`,
			code: `a,\f\tb { c: d; }`,
			fixed: `a,\fb { c: d; }`,
			line: 1,
			column: 5,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the second line of a set of parameters standing at no indentation, the set broken with a carriage return`,
			code: `@media (min-width: 100px)\rand (max-width: 200px) { a { b: c; } }`,
			fixed: `@media (min-width: 100px)\r\tand (max-width: 200px) { a { b: c; } }`,
			line: 1,
			column: 27,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same set of parameters written with a form-feed line break`,
			code: `@media (min-width: 100px)\fand (max-width: 200px) { a { b: c; } }`,
			fixed: `@media (min-width: 100px)\f\tand (max-width: 200px) { a { b: c; } }`,
			line: 1,
			column: 27,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the arguments of a function indented at the level of the line its parenthesis opens, the value broken with carriage returns`,
			code: `a {\r\tb: translate(\r\t1px,\r\t2px\r\t);\r}`,
			fixed: `a {\r\tb: translate(\r\t\t1px,\r\t\t2px\r\t);\r}`,
			warnings: [
				{
					line: 1,
					column: 21,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 1,
					column: 27,
					message: messages.expected(`2 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [2],

	reject: [
		{
			description: `a declaration standing at no indentation in a rule broken with carriage returns, measured in spaces`,
			code: `a {\rcolor: pink;\r}`,
			fixed: `a {\r  color: pink;\r}`,
			line: 1,
			column: 5,
			message: messages.expected(`2 spaces`),
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
		{
			description: `a rule at the level of the tag holding it, the page broken with carriage returns`,
			code: `<div>\r\t<style>\r\ta {\r\t\tb: c;\r\t}\r\t</style>\r</div>`,
		},
		{
			description: `the same page written with form-feed line breaks`,
			code: `<div>\f\t<style>\f\ta {\f\t\tb: c;\f\t}\f\t</style>\f</div>`,
		},
	],

	reject: [
		{
			description: `a declaration a level short of the one the tag holding its rule sets, the page broken with carriage returns`,
			code: `<div>\r\t<style>\r\ta {\r\tb: c;\r\t}\r\t</style>\r</div>`,
			fixed: `<div>\r\t<style>\r\ta {\r\t\tb: c;\r\t}\r\t</style>\r</div>`,
			line: 2,
			column: 16,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same page written with form-feed line breaks`,
			code: `<div>\f\t<style>\f\ta {\f\tb: c;\f\t}\f\t</style>\f</div>`,
			fixed: `<div>\f\t<style>\f\ta {\f\t\tb: c;\f\t}\f\t</style>\f</div>`,
			line: 1,
			column: 22,
			message: messages.expected(`2 tabs`),
		},
	],
})

// The contents of a styled template are a stylesheet, so a carriage return and a form feed end a line in them; the JavaScript around the template is measured by the line PostCSS counted, and JavaScript ends no line on a form feed.
testRule({
	ruleName,
	config: `tab`,
	customSyntax: `postcss-styled-syntax`,

	accept: [
		{
			description: `a declaration a level inside a template broken with carriage returns`,
			code: `const a = styled.div\`\r\tcolor: red;\r\`;`,
		},
		{
			description: `the same template written with form-feed line breaks`,
			code: `const a = styled.div\`\f\tcolor: red;\f\`;`,
		},
		{
			description: `a template standing on an indented line of a file broken with Windows pairs, the one spelling a widening of that reading would break`,
			code: `function f () {\r\n\tconst a = styled.div\`\r\n\t\tcolor: red;\r\n\t\`;\r\n}`,
		},
		{
			description: `a rule and its declaration inside a template broken with carriage returns`,
			code: `const a = styled.div\`\r\ta {\r\t\tb: c;\r\t}\r\`;`,
		},
	],

	reject: [
		{
			description: `a declaration standing at no indentation inside a template broken with carriage returns`,
			code: `const a = styled.div\`\rcolor: red;\r\`;`,
			fixed: `const a = styled.div\`\r\tcolor: red;\r\`;`,
			line: 1,
			column: 23,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same template written with form-feed line breaks`,
			code: `const a = styled.div\`\fcolor: red;\f\`;`,
			fixed: `const a = styled.div\`\f\tcolor: red;\f\`;`,
			line: 1,
			column: 23,
			message: messages.expected(`1 tab`),
		},
	],
})
