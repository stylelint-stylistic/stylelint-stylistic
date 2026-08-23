import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [`unix`],

	accept: [
		{
			description: `a single line feed between two rules`,
			code: `a {}\nb {}`,
		},
		{
			description: `two line feeds between two rules`,
			code: `a {}\n\nb{}`,
		},
		{
			description: `two line feeds after a comment`,
			code: `/** horse */\n\nb{}`,
		},
		{
			description: `line feeds around a comment standing between two rules`,
			code: `a{}\n\n/** horse */\n\nb{}`,
		},
		{
			description: `line feeds opening and closing the stylesheet`,
			code: `\n\na {}\n\nb{}\n\n\n\n\n\n`,
		},
		{
			description: `line feeds between the parts of a value`,
			code: `a { border: 1px\n solid \nred; }`,
		},
		{
			description: `a line feed between two selectors`,
			code: `.foo\n .bar { }`,
		},
		{
			description: `a line feed after the opening brace`,
			code: `a {\n}`,
		},
		{
			description: `a line feed after the closing brace`,
			code: `a {}\n b {}`,
		},
	],

	reject: [
		{
			description: `a carriage-return line break between two rules`,
			code: `a {}\r\nb {}`,
			fixed: `a {}\nb {}`,
			line: 1,
			column: 5,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break on a blank line`,
			code: `a {}\n\r\nb{}`,
			fixed: `a {}\n\nb{}`,
			line: 2,
			column: 1,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break after a comment`,
			code: `/** horse */\r\n\nb{}`,
			fixed: `/** horse */\n\nb{}`,
			line: 1,
			column: 13,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break after a comment on the third line`,
			code: `a{}\n\n/** horse */\r\n\nb{}`,
			fixed: `a{}\n\n/** horse */\n\nb{}`,
			line: 3,
			column: 13,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break after a rule on the third line`,
			code: `\n\na {}\r\n\nb{}`,
			fixed: `\n\na {}\n\nb{}`,
			line: 3,
			column: 5,
			message: messages.expected(`unix`),
		},

		{
			description: `a carriage-return line break inside a comment`,
			code: `/* This is a\r\ncomment*/\na {}`,
			fixed: `/* This is a\ncomment*/\na {}`,
			line: 1,
			column: 13,
			message: messages.expected(`unix`),
		},
		{
			description: `the same break inside a comment that opens with spaces`,
			code: `/*    This is a\r\ncomment*/\na {}`,
			fixed: `/*    This is a\ncomment*/\na {}`,
			line: 1,
			column: 16,
			message: messages.expected(`unix`),
		},
		{
			description: `the same break inside a comment that opens with none`,
			code: `/*This is a\r\ncomment*/\na {}`,
			fixed: `/*This is a\ncomment*/\na {}`,
			line: 1,
			column: 12,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break inside a comment on the fourth line`,
			code: `\n\n/* This is\na\r\ncomment*/\na {}`,
			fixed: `\n\n/* This is\na\ncomment*/\na {}`,
			line: 4,
			column: 2,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break closing a comment written over two lines`,
			code: `/* This is\na comment*/\r\na {}`,
			fixed: `/* This is\na comment*/\na {}`,
			line: 2,
			column: 12,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break opening the stylesheet, in front of a comment`,
			code: `\r\n\n\n\n\n/* This is\na comment*/`,
			fixed: `\n\n\n\n\n/* This is\na comment*/`,
			line: 1,
			column: 1,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break among the blank lines that open the stylesheet`,
			code: `\n\r\n\n\n\n/* This is\na comment*/`,
			fixed: `\n\n\n\n\n/* This is\na comment*/`,
			line: 2,
			column: 1,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break opening the stylesheet, in front of a rule`,
			code: `\r\n\n\n\n\n\n\n\n\n\n\na {}`,
			fixed: `\n\n\n\n\n\n\n\n\n\n\na {}`,
			line: 1,
			column: 1,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break among the blank lines in front of a rule`,
			code: `\n\n\n\n\n\n\n\r\n\n\n\na {}`,
			fixed: `\n\n\n\n\n\n\n\n\n\n\na {}`,
			line: 8,
			column: 1,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break among the blank lines that close the stylesheet`,
			code: `a {}\n\n\r\n\n\n`,
			fixed: `a {}\n\n\n\n\n`,
			line: 3,
			column: 1,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break on the last line`,
			code: `a {}\n\n\r\n`,
			fixed: `a {}\n\n\n`,
			line: 3,
			column: 1,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break between two selectors`,
			code: `.foo\r\n .bar {}`,
			fixed: `.foo\n .bar {}`,
			line: 1,
			column: 5,
			message: messages.expected(`unix`),
		},
		{
			description: `the same break between selectors on the fourth line`,
			code: `\n\n\n.foo\r\n .bar {}`,
			fixed: `\n\n\n.foo\n .bar {}`,
			line: 4,
			column: 5,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break between the second and the third selector`,
			code: `\n\n\n.foo\n .bar\r\n .baz {}`,
			fixed: `\n\n\n.foo\n .bar\n .baz {}`,
			line: 5,
			column: 6,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break between the parts of a value`,
			code: `a { border: 1px\r\n solid red; }`,
			fixed: `a { border: 1px\n solid red; }`,
			line: 1,
			column: 16,
			message: messages.expected(`unix`),
		},
		{
			description: `the same break in a value on the fourth line`,
			code: `\n\n\na { border: 1px\r\n solid red; }`,
			fixed: `\n\n\na { border: 1px\n solid red; }`,
			line: 4,
			column: 16,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break in front of the last part of a value`,
			code: `\n\n\na { border: 1px\n solid \r\nred; }`,
			fixed: `\n\n\na { border: 1px\n solid \nred; }`,
			line: 5,
			column: 8,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break after the opening brace`,
			code: `\n\na {\r\n}`,
			fixed: `\n\na {\n}`,
			line: 3,
			column: 4,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break after the closing brace`,
			code: `\n\na {\n}\r\nb {\n}`,
			fixed: `\n\na {\n}\nb {\n}`,
			line: 4,
			column: 2,
			message: messages.expected(`unix`),
		},
		{
			description: `a carriage-return line break opening the stylesheet`,
			code: `\r\na {color:red;}`,
			fixed: `\na {color:red;}`,
			line: 1,
			column: 1,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a carriage-return line break inside a value that holds a block comment`,
			code: `a { b: 1px /* c */\r\n\t2px; }`,
			fixed: `a { b: 1px /* c */\n\t2px; }`,
			line: 1,
			column: 19,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/293
		{
			description: `a bare carriage return parting two rules`,
			code: `a {}\rb {}`,
			fixed: `a {}\nb {}`,
			line: 1,
			column: 9,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/293
		{
			description: `a bare carriage return standing among line feeds`,
			code: `a {}\nb {}\rc {}\nd {}`,
			fixed: `a {}\nb {}\nc {}\nd {}`,
			line: 2,
			column: 9,
			message: messages.expected(`unix`),
		},
	],
})

testRule({
	ruleName,
	config: [`windows`],

	accept: [
		{
			description: `a single carriage-return line break between two rules`,
			code: `a {}\r\nb {}`,
		},
		{
			description: `two carriage-return line breaks between two rules`,
			code: `a {}\r\n\r\nb{}`,
		},
		{
			description: `two carriage-return line breaks after a comment`,
			code: `/** horse */\r\n\r\nb{}`,
		},
		{
			description: `carriage-return line breaks around a comment standing between two rules`,
			code: `a{}\r\n\r\n/** horse */\r\n\r\nb{}`,
		},
		{
			description: `carriage-return line breaks opening and closing the stylesheet`,
			code: `\r\n\r\na {}\r\n\r\nb{}\r\n\r\n\r\n\r\n\r\n\r\n`,
		},
		{
			description: `carriage-return line breaks between the parts of a value`,
			code: `a { border: 1px\r\n solid \r\nred; }`,
		},
		{
			description: `a carriage-return line break between two selectors`,
			code: `.foo\r\n .bar { }`,
		},
		{
			description: `a carriage-return line break after the opening brace`,
			code: `a {\r\n}`,
		},
		{
			description: `a carriage-return line break after the closing brace`,
			code: `a {}\r\n b {}`,
		},
	],
	reject: [
		{
			description: `a bare line feed between two rules`,
			code: `a {}\nb {}`,
			fixed: `a {}\r\nb {}`,
			line: 1,
			column: 5,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed on a blank line`,
			code: `a {}\r\n\nb{}`,
			fixed: `a {}\r\n\r\nb{}`,
			line: 2,
			column: 1,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed after a comment`,
			code: `/** horse */\n\r\nb{}`,
			fixed: `/** horse */\r\n\r\nb{}`,
			line: 1,
			column: 13,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed after a comment on the third line`,
			code: `a{}\r\n\r\n/** horse */\n\r\nb{}`,
			fixed: `a{}\r\n\r\n/** horse */\r\n\r\nb{}`,
			line: 3,
			column: 13,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed after a rule on the third line`,
			code: `\r\n\r\na {}\n\r\nb{}`,
			fixed: `\r\n\r\na {}\r\n\r\nb{}`,
			line: 3,
			column: 5,
			message: messages.expected(`windows`),
		},

		{
			description: `a bare line feed inside a comment`,
			code: `/* This is a\ncomment*/\r\na {}`,
			fixed: `/* This is a\r\ncomment*/\r\na {}`,
			line: 1,
			column: 13,
			message: messages.expected(`windows`),
		},
		{
			description: `the same break inside a comment that opens with spaces`,
			code: `/*    This is a\ncomment*/\r\na {}`,
			fixed: `/*    This is a\r\ncomment*/\r\na {}`,
			line: 1,
			column: 16,
			message: messages.expected(`windows`),
		},
		{
			description: `the same break inside a comment that opens with none`,
			code: `/*This is a\ncomment*/\r\na {}`,
			fixed: `/*This is a\r\ncomment*/\r\na {}`,
			line: 1,
			column: 12,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed inside a comment on the fourth line`,
			code: `\r\n\r\n/* This is\r\na\ncomment*/\r\na {}`,
			fixed: `\r\n\r\n/* This is\r\na\r\ncomment*/\r\na {}`,
			line: 4,
			column: 2,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed closing a comment written over two lines`,
			code: `/* This is\r\na comment*/\na {}`,
			fixed: `/* This is\r\na comment*/\r\na {}`,
			line: 2,
			column: 12,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed opening the stylesheet, in front of a comment`,
			code: `\n\r\n\r\n\r\n\r\n/* This is\r\na comment*/`,
			fixed: `\r\n\r\n\r\n\r\n\r\n/* This is\r\na comment*/`,
			line: 1,
			column: 1,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed among the blank lines that open the stylesheet`,
			code: `\r\n\n\r\n\r\n\r\n/* This is\r\na comment*/`,
			fixed: `\r\n\r\n\r\n\r\n\r\n/* This is\r\na comment*/`,
			line: 2,
			column: 1,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed opening the stylesheet, in front of a rule`,
			code: `\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\na {}`,
			fixed: `\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\na {}`,
			line: 1,
			column: 1,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed among the blank lines in front of a rule`,
			code: `\r\n\r\n\r\n\r\n\r\n\r\n\r\n\n\r\n\r\n\r\na {}`,
			fixed: `\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\na {}`,
			line: 8,
			column: 1,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed among the blank lines that close the stylesheet`,
			code: `a {}\r\n\r\n\n\r\n\r\n`,
			fixed: `a {}\r\n\r\n\r\n\r\n\r\n`,
			line: 3,
			column: 1,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed on the last line`,
			code: `a {}\r\n\r\n\n`,
			fixed: `a {}\r\n\r\n\r\n`,
			line: 3,
			column: 1,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed between two selectors`,
			code: `.foo\n .bar {}`,
			fixed: `.foo\r\n .bar {}`,
			line: 1,
			column: 5,
			message: messages.expected(`windows`),
		},
		{
			description: `the same break between selectors on the fourth line`,
			code: `\r\n\r\n\r\n.foo\n .bar {}`,
			fixed: `\r\n\r\n\r\n.foo\r\n .bar {}`,
			line: 4,
			column: 5,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed between the second and the third selector`,
			code: `\r\n\r\n\r\n.foo\r\n .bar\n .baz {}`,
			fixed: `\r\n\r\n\r\n.foo\r\n .bar\r\n .baz {}`,
			line: 5,
			column: 6,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed between the parts of a value`,
			code: `a { border: 1px\n solid red; }`,
			fixed: `a { border: 1px\r\n solid red; }`,
			line: 1,
			column: 16,
			message: messages.expected(`windows`),
		},
		{
			description: `the same break in a value on the fourth line`,
			code: `\r\n\r\n\r\na { border: 1px\n solid red; }`,
			fixed: `\r\n\r\n\r\na { border: 1px\r\n solid red; }`,
			line: 4,
			column: 16,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed in front of the last part of a value`,
			code: `\r\n\r\n\r\na { border: 1px\r\n solid \nred; }`,
			fixed: `\r\n\r\n\r\na { border: 1px\r\n solid \r\nred; }`,
			line: 5,
			column: 8,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed after the opening brace`,
			code: `\r\n\r\na {\n}`,
			fixed: `\r\n\r\na {\r\n}`,
			line: 3,
			column: 4,
			message: messages.expected(`windows`),
		},
		{
			description: `a bare line feed after the closing brace`,
			code: `\r\n\r\na {\r\n}\nb {\r\n}`,
			fixed: `\r\n\r\na {\r\n}\r\nb {\r\n}`,
			line: 4,
			column: 2,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a bare line feed inside a value that holds a block comment`,
			code: `a { b: 1px /* c */\n\t2px; }`,
			fixed: `a { b: 1px /* c */\r\n\t2px; }`,
			line: 1,
			column: 19,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/293
		{
			description: `a bare carriage return standing in a file a line feed also breaks, which draws the warning the fix then rewrites both breaks under`,
			code: `a {}\nb {}\rc {}`,
			fixed: `a {}\r\nb {}\r\nc {}`,
			line: 1,
			column: 5,
			message: messages.expected(`windows`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`unix`],

	accept: [
		{
			description: `a line feed closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\n\t2px; }`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a carriage-return line break closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\r\n\t2px; }`,
			fixed: `a { b: 1px // c\n\t2px; }`,
			line: 1,
			column: 16,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/293
		{
			description: `a bare carriage return closing an end-of-line comment the value holds, the break whose removal used to carry the rest of the block into that comment`,
			code: `a { b: 1px // c\r\t2px; }`,
			fixed: `a { b: 1px // c\n\t2px; }`,
			line: 1,
			column: 23,
			message: messages.expected(`unix`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`windows`],

	accept: [
		{
			description: `a carriage-return line break closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\r\n\t2px; }`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a bare line feed closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\n\t2px; }`,
			fixed: `a { b: 1px // c\r\n\t2px; }`,
			line: 1,
			column: 16,
			message: messages.expected(`windows`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`unix`],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/293
		{
			description: `a bare carriage return closing an end-of-line comment the value holds, which this syntax reads as text of the comment while Less closes it there`,
			code: `a { b: 1px // c\r\t2px; }`,
			fixed: `a { b: 1px // c\n\t2px; }`,
			line: 1,
			column: 23,
			message: messages.expected(`unix`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`windows`],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a bare line feed inside a value that holds a block comment`,
			code: `a { b: 1px /* c */\n\t2px; }`,
			fixed: `a { b: 1px /* c */\r\n\t2px; }`,
			line: 1,
			column: 19,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a bare line feed inside the value of a Less at-variable that holds a block comment`,
			code: `@variable: 1px /* c */\n\t2px;`,
			fixed: `@variable: 1px /* c */\r\n\t2px;`,
			line: 1,
			column: 23,
			message: messages.expected(`windows`),
		},
	],
})
